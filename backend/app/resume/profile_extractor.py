"""
Profile extractor — derives user profile fields from a parsed resume.

Called after every successful ATS analysis so the UserProfile table
stays up-to-date with the latest resume content.
"""
import re
import logging
from ..models import UserProfile
from .section_detector import detect_sections

logger = logging.getLogger(__name__)

# ── Regex patterns ────────────────────────────────────────────────────────────
_EMAIL_RE    = re.compile(r"[\w.+-]+@[\w-]+\.[a-zA-Z]{2,}", re.I)
_NAME_RE     = re.compile(
    r"^([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){1,3})$",  # Title-cased words only
    re.M,
)
_PHONE_RE    = re.compile(
    r"(?:\+?\d{1,3}[\s\-.]?)?"          # country code
    r"(?:\(?\d{2,4}\)?[\s\-.]?)"        # area code
    r"\d{3,4}[\s\-.]?\d{4}"             # number
)
_LINKEDIN_RE = re.compile(r"linkedin\.com/in/([\w\-]+)", re.I)
_GITHUB_RE   = re.compile(r"github\.com/([\w\-]+)", re.I)
_URL_RE      = re.compile(r"https?://[\w\-./~%?=#&@+:,;]+", re.I)
_YOE_RE      = re.compile(
    r"(\d+)\+?\s+years?\s+(?:of\s+)?(?:experience|exp|work|industry)",
    re.I,
)


def _first(match):
    return match.group(0) if match else None


def extract_profile_fields(
    resume_text: str,
    sections: dict[str, str],
    resume_skills: list[str],
    user_name: str,
    user_email: str,
    resume_id: str,
) -> dict:
    """
    Return a dict of profile fields extracted from a resume.
    Only non-None values are returned — the caller merges into the DB record.
    """
    contact_block = sections.get("contact", "") + "\n" + resume_text[:800]

    # ── Name: look for Title-Cased full name in the first 10 lines ────────────
    resume_name = None
    for line in resume_text.splitlines()[:10]:
        line = line.strip()
        if not line or len(line) > 60 or len(line) < 4:
            continue
        if any(c in line for c in '@:/\\|0123456789'):
            continue
        if _NAME_RE.match(line) and ' ' in line:
            resume_name = line
            break

    # ── Email: prefer one found in resume over registration email ─────────────
    resume_email = _first(_EMAIL_RE.search(resume_text[:800]))

    # ── Contact info ──────────────────────────────────────────────────────────
    phone     = _first(_PHONE_RE.search(contact_block))
    linkedin  = _first(_LINKEDIN_RE.search(resume_text))
    if linkedin:
        linkedin = f"https://linkedin.com/in/{_LINKEDIN_RE.search(resume_text).group(1)}"
    github = _first(_GITHUB_RE.search(resume_text))
    if github:
        github = f"https://github.com/{_GITHUB_RE.search(resume_text).group(1)}"

    # Portfolio = any URL that isn't linkedin or github
    portfolio = None
    for url_match in _URL_RE.finditer(resume_text):
        url = url_match.group(0)
        if "linkedin" not in url.lower() and "github" not in url.lower():
            portfolio = url
            break

    # ── Location: first line of contact section that looks like a city/address ──
    location = _guess_location(contact_block)

    # ── Headline: look for job-title-like line near the top ───────────────────
    headline = _guess_headline(contact_block, user_name)

    # ── Summary ───────────────────────────────────────────────────────────────
    summary = sections.get("summary", "") or None
    if summary and len(summary.strip()) < 20:
        summary = None

    # ── Years of experience ───────────────────────────────────────────────────
    yoe = 0
    m = _YOE_RE.search(resume_text)
    if m:
        yoe = int(m.group(1))

    # ── Experience / Education raw text ───────────────────────────────────────
    experience_raw = sections.get("experience") or None
    education_raw  = sections.get("education")  or None

    # ── Certifications ────────────────────────────────────────────────────────
    cert_text = sections.get("certifications", "")
    certs = _parse_list_section(cert_text)

    return {k: v for k, v in {
        "full_name":         resume_name or user_name,
        "email":             resume_email or user_email,
        "phone":             phone,
        "location":          location,
        "linkedin_url":      linkedin,
        "github_url":        github,
        "portfolio_url":     portfolio,
        "headline":          headline,
        "summary":           summary,
        "years_of_experience": yoe if yoe else None,
        "skills":            resume_skills or None,
        "experience_raw":    experience_raw,
        "education_raw":     education_raw,
        "certifications":    certs or None,
        "last_resume_id":    resume_id,
    }.items() if v is not None}


def _guess_location(contact_block: str) -> str | None:
    """
    Heuristic: look for a short line that contains a city/state/country.
    Patterns like "Chennai, India" | "New York, NY" | "Remote"
    """
    _LOC_RE = re.compile(
        r"^[A-Za-z\s]+,\s*[A-Za-z\s]+$|"   # "Chennai, India"
        r"\bRemote\b|"
        r"\b[A-Z]{2}\s+\d{5}\b",            # US zip "NY 10001"
        re.M | re.I,
    )
    m = _LOC_RE.search(contact_block)
    if m:
        return m.group(0).strip()
    return None


def _guess_headline(contact_block: str, user_name: str) -> str | None:
    """
    The headline is often the line right after the person's name near the top.
    It looks like a job title: no @, no digits-only, 3–60 chars.
    """
    _TITLE_INDICATORS = re.compile(
        r"\b(engineer|developer|analyst|manager|designer|architect|"
        r"scientist|consultant|lead|senior|junior|intern|specialist|"
        r"director|vp|cto|ceo|devops|full.?stack|backend|frontend|"
        r"data|cloud|mobile|android|ios|qa|tester|researcher)\b",
        re.I,
    )
    lines = contact_block.split("\n")
    for line in lines[:20]:
        stripped = line.strip()
        if not stripped:
            continue
        if user_name.lower() in stripped.lower():
            continue
        if "@" in stripped or len(stripped) < 3 or len(stripped) > 80:
            continue
        if re.search(r"\d{5,}", stripped):   # phone-like
            continue
        if _TITLE_INDICATORS.search(stripped):
            return stripped
    return None


def _parse_list_section(text: str) -> list[str]:
    """Split a section text into a list of non-empty lines (for certifications etc.)."""
    if not text:
        return []
    items = []
    for line in text.split("\n"):
        line = line.strip(" •-–*·\t")
        if line and len(line) > 3:
            items.append(line)
    return items[:20]   # cap at 20


async def upsert_user_profile(
    db,
    user,
    resume_text: str,
    resume_skills: list[str],
    resume_id: str,
) -> None:
    """
    Create or update the UserProfile row for this user based on the
    latest resume parse results.  Silently logs and swallows errors
    so it never breaks the main analyze endpoint.
    """
    from sqlalchemy import select
    try:
        sections = detect_sections(resume_text)
        fields   = extract_profile_fields(
            resume_text=resume_text,
            sections=sections,
            resume_skills=resume_skills,
            user_name=user.name,
            user_email=user.email,
            resume_id=resume_id,
        )

        result  = await db.execute(
            select(UserProfile).where(UserProfile.user_id == user.id)
        )
        profile = result.scalar_one_or_none()

        if profile is None:
            profile = UserProfile(user_id=user.id)
            db.add(profile)

        for key, value in fields.items():
            # Never overwrite manually-set preferred_roles/locations with None
            if value is None:
                continue
            setattr(profile, key, value)

        await db.flush()
        logger.info("UserProfile upserted for user %s", user.id)

    except Exception as exc:
        logger.warning("Profile upsert failed for user %s: %s", user.id, exc, exc_info=True)
