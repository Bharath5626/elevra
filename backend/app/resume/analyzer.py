"""
ATS analysis orchestrator.

Pipeline
────────
1. Detect sections in the resume text
2. Extract skills from resume (and JD if provided)
3. Compute the ATS score deterministically:
      • JD provided  → vector similarity + keyword match + section + format
      • No JD        → section + format + impact language + keyword density + readability
4. Ask the LLM for *qualitative feedback only* (the score is already fixed)

The LLM never decides the score — it only explains and suggests improvements.
"""
import logging
from ..ai_client import call_ai_json
from .section_detector import detect_sections, get_sections_present
from .embedder import compute_semantic_similarity
from .skill_extractor import extract_skills, match_skills
from .parser import compute_readability
from .ats_scorer import (
    ATSScoreBreakdown,
    score_section_completeness,
    score_format_compliance,
    score_impact_language,
    score_keyword_density,
    normalize_readability,
    compute_ats_score_jd_mode,
    compute_ats_score_general_mode,
)

logger = logging.getLogger(__name__)

# ── AI feedback prompts (score already known — AI only gives suggestions) ─────

_FEEDBACK_SYSTEM = (
    "You are an expert career coach and ATS specialist. "
    "Return valid JSON only. No markdown fences. No extra text."
)

_FEEDBACK_TEMPLATE_JD = """\
The resume scored {score}/100 against the provided job description.

Deterministic score breakdown:
  Semantic similarity : {semantic_pct}%  (method: {sim_method})
  Keyword match       : {keyword_pct}%  ({matched_count}/{jd_skill_count} JD skills found)
  Section completeness: {section_pct}%
  Format compliance   : {format_pct}%

Missing skills: {missing_skills}
Format issues : {format_issues}
Sections found: {sections_found}

Resume (truncated):
{resume_text}

Job Description (truncated):
{jd_text}

Provide targeted, actionable feedback. Focus on the GAPS identified above.
Return JSON:
{{
  "keyword_gaps": [<top missing keywords — strings>],
  "weak_bullets": [{{"original": <string>, "improved": <string>}}],
  "improved_bullets": [<string>],
  "section_feedback": {{
    "summary": <string>,
    "experience": <string>,
    "skills": <string>,
    "education": <string>
  }},
  "bias_flags": [<string>],
  "overall_suggestion": <string>
}}
"""

_FEEDBACK_TEMPLATE_GENERAL = """\
The resume scored {score}/100 against general ATS standards (no job description was provided).

Deterministic score breakdown:
  Section completeness: {section_pct}%
  Format compliance   : {format_pct}%
  Impact language     : {impact_pct}%
  Keyword density     : {keyword_pct}%
  Readability         : {readability_pct}%

Skills detected : {skills_found}
Format issues   : {format_issues}
Sections found  : {sections_found}

Resume (truncated):
{resume_text}

Provide targeted, actionable feedback. Focus on the lowest-scoring areas above.
Return JSON:
{{
  "keyword_gaps": [<important skills or terms to add>],
  "weak_bullets": [{{"original": <string>, "improved": <string>}}],
  "improved_bullets": [<string>],
  "section_feedback": {{
    "summary": <string>,
    "experience": <string>,
    "skills": <string>,
    "education": <string>
  }},
  "bias_flags": [<string>],
  "overall_suggestion": <string>
}}
"""


# ── Main entry point ──────────────────────────────────────────────────────────

async def analyze_resume(
    resume_text: str,
    jd_text: str = "",
) -> tuple[ATSScoreBreakdown, dict]:
    """
    Full ATS analysis pipeline.

    Args:
        resume_text: raw text extracted from the uploaded résumé
        jd_text:     optional job description text

    Returns:
        (ATSScoreBreakdown, ai_feedback_dict)
    """
    # 1. Structural parsing
    sections       = detect_sections(resume_text)
    sections_found = get_sections_present(sections)

    # 2. Shared component scores
    section_score              = score_section_completeness(sections_found)
    format_score, format_issues = score_format_compliance(resume_text)
    resume_skills              = extract_skills(resume_text)

    has_jd = bool(jd_text and jd_text.strip())

    if has_jd:
        # ── JD MODE ──────────────────────────────────────────────────────────
        skill_cmp = match_skills(resume_text, jd_text)
        semantic_sim, sim_method = await compute_semantic_similarity(
            resume_text, jd_text
        )

        breakdown = compute_ats_score_jd_mode(
            semantic_sim         = semantic_sim,
            keyword_match_rate   = skill_cmp["match_rate"],
            section_completeness = section_score,
            format_compliance    = format_score,
            similarity_method    = sim_method,
            matched_skills       = skill_cmp["matched"],
            missing_skills       = skill_cmp["missing"],
            resume_skills        = skill_cmp["resume_skills"],
            sections_found       = sections_found,
            format_issues        = format_issues,
        )

        feedback_prompt = _FEEDBACK_TEMPLATE_JD.format(
            score          = breakdown.total,
            semantic_pct   = round(breakdown.semantic_similarity * 100),
            sim_method     = sim_method,
            keyword_pct    = round(breakdown.keyword_match_rate * 100),
            matched_count  = len(breakdown.matched_skills),
            jd_skill_count = len(skill_cmp["jd_skills"]),
            missing_skills = ", ".join(breakdown.missing_skills[:12]) or "none",
            format_issues  = ", ".join(format_issues) or "none",
            sections_found = ", ".join(sections_found) or "none detected",
            section_pct    = round(section_score * 100),
            format_pct     = round(format_score * 100),
            resume_text    = resume_text[:3000],
            jd_text        = jd_text[:1500],
        )

    else:
        # ── GENERAL MODE ─────────────────────────────────────────────────────
        readability      = compute_readability(resume_text)
        impact_score     = score_impact_language(resume_text)
        density_score    = score_keyword_density(resume_skills)
        readability_norm = normalize_readability(readability)

        breakdown = compute_ats_score_general_mode(
            section_completeness = section_score,
            format_compliance    = format_score,
            impact_language      = impact_score,
            keyword_density      = density_score,
            readability          = readability_norm,
            resume_skills        = resume_skills,
            sections_found       = sections_found,
            format_issues        = format_issues,
        )

        feedback_prompt = _FEEDBACK_TEMPLATE_GENERAL.format(
            score          = breakdown.total,
            section_pct    = round(section_score * 100),
            format_pct     = round(format_score * 100),
            impact_pct     = round(impact_score * 100),
            keyword_pct    = round(density_score * 100),
            readability_pct= round(readability_norm * 100),
            skills_found   = ", ".join(resume_skills[:15]) or "none detected",
            format_issues  = ", ".join(format_issues) or "none",
            sections_found = ", ".join(sections_found) or "none detected",
            resume_text    = resume_text[:3000],
        )

    # 3. AI qualitative feedback (score is already fixed — AI only suggests)
    try:
        ai_feedback = await call_ai_json(_FEEDBACK_SYSTEM, feedback_prompt, max_tokens=4096)
    except Exception as exc:
        logger.warning("AI feedback generation failed (%s); using defaults.", exc)
        ai_feedback = {
            "keyword_gaps":      breakdown.missing_skills[:10],
            "weak_bullets":      [],
            "improved_bullets":  [],
            "section_feedback":  {},
            "bias_flags":        [],
            "overall_suggestion": "",
        }

    return breakdown, ai_feedback
