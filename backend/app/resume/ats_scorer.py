"""
Deterministic ATS scoring engine.

The score is computed purely from rules and vector similarity —
the LLM is NOT consulted for the score itself, only for feedback text.

Two scoring modes
─────────────────
JD mode (job description provided)
    0.35 × semantic_similarity   (vector cosine sim via Gemini / TF-IDF)
    0.30 × keyword_match_rate    (JD skills found in resume)
    0.20 × section_completeness  (required + preferred sections present)
    0.15 × format_compliance     (ATS-safe formatting heuristics)

General mode (no job description)
    0.30 × section_completeness
    0.25 × format_compliance
    0.20 × impact_language       (action verbs + quantified bullets)
    0.15 × keyword_density       (breadth of skills on resume)
    0.10 × readability           (Flesch score normalised to 0-1)
"""
import re
import dataclasses
from .section_detector import REQUIRED_SECTIONS, PREFERRED_SECTIONS


# ── Constants ────────────────────────────────────────────────────────────────

ACTION_VERBS: list[str] = [
    "achieved", "improved", "led", "managed", "developed", "created", "built",
    "designed", "implemented", "launched", "delivered", "increased", "reduced",
    "optimized", "automated", "streamlined", "collaborated", "coordinated",
    "analyzed", "trained", "mentored", "established", "transformed", "drove",
    "generated", "negotiated", "resolved", "scaled", "deployed", "migrated",
    "refactored", "architected", "spearheaded", "executed", "oversaw", "directed",
    "initiated", "introduced", "revamped", "accelerated", "consolidated",
    "prioritized", "engineered", "conceptualised", "facilitated",
]

# (regex_pattern, human-readable issue label)
FORMAT_CHECKS: list[tuple[str, str]] = [
    (r'\|',                    "table / pipe characters detected"),
    (r'[●▪►▸◆✓✗★☆→©®™]{1}',  "special Unicode bullets (may not parse in ATS)"),
    (r'[^\x00-\x7F]{4,}',     "block of non-ASCII characters (image/icon risk)"),
]

_EMAIL_RE = re.compile(r'[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}')
_PHONE_RE = re.compile(r'[\+]?[\d][\d\s\-().]{6,14}[\d]')


# ── Breakdown dataclass ───────────────────────────────────────────────────────

@dataclasses.dataclass
class ATSScoreBreakdown:
    total:                int   = 0
    mode:                 str   = "general"        # "jd_provided" | "general"

    # JD mode sub-scores
    semantic_similarity:  float = 0.0
    keyword_match_rate:   float = 0.0
    similarity_method:    str   = ""               # "gemini_embedding" | "tfidf_fallback"

    # General mode sub-scores
    impact_language:      float = 0.0
    keyword_density:      float = 0.0
    readability_score:    float = 0.0

    # Shared sub-scores
    section_completeness: float = 0.0
    format_compliance:    float = 0.0

    # Detail lists
    sections_found:  list = dataclasses.field(default_factory=list)
    matched_skills:  list = dataclasses.field(default_factory=list)
    missing_skills:  list = dataclasses.field(default_factory=list)
    resume_skills:   list = dataclasses.field(default_factory=list)
    format_issues:   list = dataclasses.field(default_factory=list)

    def as_dict(self) -> dict:
        return dataclasses.asdict(self)


# ── Individual component scorers ─────────────────────────────────────────────

def score_section_completeness(sections_found: list[str]) -> float:
    """
    0.0–1.0.  Required sections (experience, education, skills) carry 70 %,
    preferred sections (summary, contact, certifications, projects) carry 30 %.
    """
    req_score  = sum(1 for s in REQUIRED_SECTIONS  if s in sections_found) / len(REQUIRED_SECTIONS)
    pref_score = sum(1 for s in PREFERRED_SECTIONS if s in sections_found) / len(PREFERRED_SECTIONS)
    return round(0.7 * req_score + 0.3 * pref_score, 3)


def score_format_compliance(text: str) -> tuple[float, list[str]]:
    """
    0.0–1.0.  Starts at 1.0 and deducts 0.12 per detected issue.
    Also returns the list of human-readable issue labels.
    """
    issues: list[str] = []

    for pattern, label in FORMAT_CHECKS:
        if re.search(pattern, text):
            issues.append(label)

    word_count = len(text.split())
    if word_count > 1200:
        issues.append("resume may exceed 2 pages (~1 200+ words)")
    elif word_count < 150:
        issues.append("resume is very short (< 150 words)")

    if not _EMAIL_RE.search(text):
        issues.append("no email address detected")
    if not _PHONE_RE.search(text):
        issues.append("no phone number detected")

    score = max(0.0, 1.0 - len(issues) * 0.12)
    return round(score, 3), issues


def score_impact_language(text: str) -> float:
    """
    0.0–1.0.  50 % from action-verb count, 50 % from quantified-bullet ratio.
    """
    lower = text.lower()
    lines = [l.strip() for l in text.splitlines() if l.strip()]

    # Action verb component (10+ distinct verbs = full score)
    verb_hits  = sum(1 for v in ACTION_VERBS if re.search(r'\b' + v + r'\b', lower))
    verb_score = min(1.0, verb_hits / 10)

    # Quantification component
    # Only lines that start with an explicit bullet marker are counted —
    # NOT arbitrary uppercase lines (which would include headers and job titles).
    bullet_lines = [
        l for l in lines
        if l.startswith(("-", "•", "·", "*", "–", "▪", "●", "○", "◦"))
    ]
    if bullet_lines:
        quantified   = sum(1 for l in bullet_lines if re.search(r'\d+', l))
        # 40 %+ quantified bullets → full score
        quant_score  = min(1.0, (quantified / len(bullet_lines)) / 0.4)
    else:
        quant_score = 0.2  # no recognisable bullets

    return round(0.5 * verb_score + 0.5 * quant_score, 3)


def score_keyword_density(resume_skills: list[str]) -> float:
    """0.0–1.0.  50+ skills → full score."""
    return round(min(1.0, len(resume_skills) / 50), 3)


def normalize_readability(flesch_score: float) -> float:
    """
    Map Flesch Reading Ease (0–100) to 0.0–1.0.
    Ideal resume range: 40–80 (professional yet readable).
    Below 40 (too dense): linear scale up from 0.
    Above 80 (too simple): gentle penalty — full score not lost until Flesch 100+.
    """
    if 40.0 <= flesch_score <= 80.0:
        return 1.0
    if flesch_score < 40.0:
        return round(max(0.0, flesch_score / 40.0), 3)
    # Above 80: lose 1 point per 5 Flesch above 80 (0 at Flesch 130+)
    return round(max(0.0, 1.0 - (flesch_score - 80.0) / 100.0), 3)


# ── Final score calculators ───────────────────────────────────────────────────

def compute_ats_score_jd_mode(
    *,
    semantic_sim:      float,
    keyword_match_rate: float,
    section_completeness: float,
    format_compliance: float,
    similarity_method: str,
    matched_skills:    list[str],
    missing_skills:    list[str],
    resume_skills:     list[str],
    sections_found:    list[str],
    format_issues:     list[str],
) -> ATSScoreBreakdown:
    """
    JD mode:  0.35 × sem_sim + 0.30 × kw_match + 0.20 × sections + 0.15 × format
    """
    raw   = (0.35 * semantic_sim
           + 0.30 * keyword_match_rate
           + 0.20 * section_completeness
           + 0.15 * format_compliance)
    total = round(min(100, max(0, raw * 100)))

    return ATSScoreBreakdown(
        total                = total,
        mode                 = "jd_provided",
        semantic_similarity  = round(semantic_sim, 3),
        keyword_match_rate   = round(keyword_match_rate, 3),
        section_completeness = round(section_completeness, 3),
        format_compliance    = round(format_compliance, 3),
        similarity_method    = similarity_method,
        matched_skills       = matched_skills,
        missing_skills       = missing_skills,
        resume_skills        = resume_skills,
        sections_found       = sections_found,
        format_issues        = format_issues,
    )


def compute_ats_score_general_mode(
    *,
    section_completeness: float,
    format_compliance:    float,
    impact_language:      float,
    keyword_density:      float,
    readability:          float,
    resume_skills:        list[str],
    sections_found:       list[str],
    format_issues:        list[str],
) -> ATSScoreBreakdown:
    """
    General mode:  0.30 × sections + 0.25 × format + 0.20 × impact
                 + 0.15 × keywords + 0.10 × readability
    """
    raw   = (0.30 * section_completeness
           + 0.25 * format_compliance
           + 0.20 * impact_language
           + 0.15 * keyword_density
           + 0.10 * readability)
    total = round(min(100, max(0, raw * 100)))

    return ATSScoreBreakdown(
        total                = total,
        mode                 = "general",
        section_completeness = round(section_completeness, 3),
        format_compliance    = round(format_compliance, 3),
        impact_language      = round(impact_language, 3),
        keyword_density      = round(keyword_density, 3),
        readability_score    = round(readability, 3),
        resume_skills        = resume_skills,
        matched_skills       = resume_skills,  # in general mode matched = all resume skills
        sections_found       = sections_found,
        format_issues        = format_issues,
    )
