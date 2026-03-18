import io
import re
from pathlib import Path
import pdfplumber


def _count_syllables(word: str) -> int:
    """Rough syllable count using vowel-group heuristic."""
    word = word.lower().rstrip('e')
    return max(1, len(re.findall(r'[aeiou]+', word)))


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract raw text from PDF bytes using pdfplumber."""
    text_parts: list[str] = []
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text)
    return "\n".join(text_parts)


def compute_readability(text: str) -> float:
    """Return Flesch Reading Ease score (0-100, higher = easier)."""
    try:
        sentences = max(1, len(re.findall(r'[.!?]+', text)))
        words = text.split()
        if not words:
            return 50.0
        syllables = sum(_count_syllables(w) for w in words)
        score = 206.835 - 1.015 * (len(words) / sentences) - 84.6 * (syllables / len(words))
        return round(max(0.0, min(100.0, score)), 2)
    except Exception:
        return 50.0


def extract_skills_from_text(text: str) -> list[str]:
    """
    Naive skill extraction: look for known tech-stack keywords in the resume.
    Returns de-duplicated list, case-normalised.
    """
    KNOWN_SKILLS = [
        # Languages
        "python", "javascript", "typescript", "java", "c++", "c#", "go", "rust",
        "ruby", "swift", "kotlin", "php", "scala",
        # Frontend
        "react", "vue", "angular", "nextjs", "tailwindcss", "html", "css", "sass",
        # Backend / frameworks
        "fastapi", "django", "flask", "express", "spring", "rails", "nodejs",
        # Databases
        "postgresql", "mysql", "mongodb", "redis", "sqlite", "elasticsearch",
        # Cloud / DevOps
        "aws", "gcp", "azure", "docker", "kubernetes", "linux", "nginx", "git",
        "ci/cd", "github actions", "terraform",
        # ML / AI
        "pytorch", "tensorflow", "scikit-learn", "pandas", "numpy", "opencv",
        "hugging face", "langchain",
        # Misc
        "rest api", "graphql", "microservices", "agile", "scrum",
    ]
    lower = text.lower()
    found = [skill for skill in KNOWN_SKILLS if re.search(r'\b' + re.escape(skill) + r'\b', lower)]
    return list(dict.fromkeys(found))  # preserve order, deduplicate
