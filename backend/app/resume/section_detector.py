"""
Resume section detector.

Parses raw resume text into named sections by identifying
heading lines using keyword pattern matching.
"""
import re

# Ordered by priority — first match wins per line
SECTION_PATTERNS: dict[str, list[str]] = {
    "contact":          [r"contact\s*(info|details|information)?", r"personal\s+(info|details)"],
    "summary":          [r"(professional\s+)?summary", r"profile", r"objective",
                         r"career\s+objective", r"about\s*(me)?", r"professional\s+profile"],
    "experience":       [r"(work\s+|professional\s+)?experience", r"work\s+history",
                         r"employment(\s+history)?", r"career\s+history"],
    "education":        [r"education(\s+&\s+training)?", r"academic(\s+background)?",
                         r"qualifications?", r"degrees?"],
    "skills":           [r"(technical\s+)?skills?", r"competenc(y|ies)",
                         r"technologies", r"tools\s*&?\s*(technologies)?",
                         r"expertise", r"core\s+competenc"],
    "projects":         [r"projects?", r"portfolio", r"key\s+projects?"],
    "certifications":   [r"certif(ications?|icates?)", r"licenses?",
                         r"credentials?", r"courses?", r"training"],
    "achievements":     [r"achievements?", r"awards?", r"honors?",
                         r"recognitions?", r"accomplishments?"],
    "languages":        [r"languages?(\s+spoken)?"],
    "interests":        [r"interests?", r"hobbies", r"activities"],
    "references":       [r"references?"],
}

# All sections we consider "relevant" for ATS scoring
REQUIRED_SECTIONS  = {"experience", "education", "skills"}
PREFERRED_SECTIONS = {"summary", "contact", "certifications", "projects"}


def _is_heading(line: str) -> str | None:
    """
    Return section name if line looks like a section heading, else None.
    Headings are short lines (≤60 chars) that match a known section pattern.
    """
    stripped = line.strip(" :-_•·\t")
    if not stripped or len(stripped) > 60:
        return None

    # Skip lines that look like bullet points or sentences
    if stripped.startswith(("-", "•", "·", "*", "–")) or stripped.endswith(","):
        return None

    lower = stripped.lower()
    for section, patterns in SECTION_PATTERNS.items():
        for pattern in patterns:
            if re.fullmatch(pattern, lower) or re.search(r'^\s*' + pattern + r'\s*$', lower):
                return section
    return None


def detect_sections(text: str) -> dict[str, str]:
    """
    Split raw resume text into named sections.

    Returns a dict of {section_name: section_text}.
    Lines before the first detected heading go into 'contact'.
    """
    lines = text.split("\n")
    sections: dict[str, list[str]] = {"contact": []}
    current = "contact"

    for line in lines:
        detected = _is_heading(line)
        if detected:
            current = detected
            if current not in sections:
                sections[current] = []
        else:
            sections.setdefault(current, []).append(line)

    return {name: "\n".join(buf).strip() for name, buf in sections.items()}


def get_sections_present(sections: dict[str, str]) -> list[str]:
    """Return section names that contain meaningful content (>20 chars)."""
    return [name for name, text in sections.items() if text and len(text.strip()) > 20]
