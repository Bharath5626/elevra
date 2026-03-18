"""
Skill extractor based on a curated, categorised skills taxonomy.

Replaces the old parser.py keyword list with a comprehensive taxonomy
sorted by length (longest first) to avoid partial matches.

No external ML model needed — pure regex over a curated word list.
"""
import re

# ── Taxonomy ──────────────────────────────────────────────────────────────────
SKILLS_TAXONOMY: dict[str, list[str]] = {
    "languages": [
        "python", "javascript", "typescript", "java", "c++", "c#", "golang", "go",
        "rust", "ruby", "swift", "kotlin", "php", "scala", "r", "matlab", "perl",
        "bash", "shell", "powershell", "sql", "dart", "elixir", "clojure",
        "haskell", "lua", "objective-c", "groovy", "vba", "assembly",
    ],
    "frontend": [
        "react native", "next.js", "nextjs", "nuxtjs", "vue.js", "vuejs",
        "react", "vue", "angular", "svelte", "remix", "gatsby",
        "material-ui", "chakra-ui", "styled-components",
        "tailwindcss", "tailwind", "bootstrap", "webpack", "vite", "babel",
        "html5", "css3", "html", "css", "sass", "scss", "less",
        "redux", "mobx", "zustand", "graphql", "apollo", "jquery",
    ],
    "backend": [
        "spring boot", "ruby on rails", "asp.net", ".net core",
        "fastapi", "django", "flask", "express", "nestjs", "spring",
        "rails", "laravel", "symfony", "node.js", "nodejs",
        "actix", "gin", "fiber", "hapi", "koa", "strapi",
        "prisma", "sequelize", "hibernate", "sqlalchemy",
    ],
    "databases": [
        "sql server", "amazon dynamodb", "google firestore",
        "postgresql", "postgres", "mysql", "mongodb", "redis",
        "sqlite", "oracle", "cassandra", "dynamodb", "firebase",
        "firestore", "elasticsearch", "neo4j", "influxdb",
        "cockroachdb", "supabase", "mariadb", "couchdb", "arangodb",
        "pgvector",
    ],
    "cloud_devops": [
        "amazon web services", "google cloud platform", "microsoft azure",
        "github actions", "gitlab ci", "circleci", "travis ci",
        "aws", "gcp", "azure", "docker", "kubernetes", "k8s",
        "terraform", "ansible", "jenkins", "linux", "nginx", "apache",
        "ci/cd", "devops", "heroku", "vercel", "netlify",
        "digitalocean", "cloudflare", "serverless", "lambda",
        "s3", "ec2", "rds", "git",
    ],
    "ml_ai": [
        "scikit-learn", "hugging face", "deep learning", "machine learning",
        "computer vision", "natural language processing",
        "pytorch", "tensorflow", "keras", "sklearn", "pandas",
        "numpy", "opencv", "transformers", "langchain", "openai",
        "llm", "nlp", "mlflow", "dvc", "spark", "hadoop",
        "xgboost", "lightgbm", "matplotlib", "seaborn", "plotly",
        "data science",
    ],
    "mobile": [
        "react native", "xamarin", "cordova", "ionic", "expo",
        "android", "ios", "flutter",
    ],
    "architecture_practices": [
        "microservices", "api design", "system design",
        "data structures", "algorithms", "rest api", "restful",
        "graphql", "websocket", "grpc", "message queue",
        "kafka", "rabbitmq", "oauth", "jwt",
        "agile", "scrum", "kanban",
    ],
    "tools": [
        "jira", "confluence", "figma", "notion", "slack",
        "postman", "swagger", "github", "gitlab", "bitbucket",
        "visual studio", "intellij", "pycharm", "vs code",
    ],
}

# Flatten and sort longest → shortest (prevents "go" matching inside "golang")
_ALL_SKILLS: list[str] = sorted(
    {skill for skills in SKILLS_TAXONOMY.values() for skill in skills},
    key=len,
    reverse=True,
)


def _build_pattern(skill: str) -> re.Pattern:
    return re.compile(r'\b' + re.escape(skill) + r'\b', re.IGNORECASE)


# Pre-compile all patterns once at import time
_COMPILED: list[tuple[str, re.Pattern]] = [
    (skill, _build_pattern(skill)) for skill in _ALL_SKILLS
]


def extract_skills(text: str) -> list[str]:
    """
    Extract skills from text using the curated taxonomy.
    Returns deduplicated list, ordered by first appearance in taxonomy.
    """
    found: list[str] = []
    seen: set[str] = set()
    for skill, pattern in _COMPILED:
        if skill not in seen and pattern.search(text):
            found.append(skill)
            seen.add(skill)
    return found


def extract_skills_by_category(text: str) -> dict[str, list[str]]:
    """Return skills grouped by taxonomy category."""
    result: dict[str, list[str]] = {}
    for category, skills in SKILLS_TAXONOMY.items():
        matched = [s for s in skills if _build_pattern(s).search(text)]
        if matched:
            result[category] = matched
    return result


def match_skills(resume_text: str, jd_text: str) -> dict:
    """
    Compare skills found in resume vs skills required by job description.

    Returns:
        matched       — skills in both resume and JD
        missing       — skills in JD but not in resume
        resume_skills — all skills found in resume
        jd_skills     — all skills found in JD
        match_rate    — matched / jd_skills (0.0–1.0)
    """
    resume_skills = set(extract_skills(resume_text))
    jd_skills     = set(extract_skills(jd_text))

    if not jd_skills:
        return {
            "matched":       sorted(resume_skills),
            "missing":       [],
            "resume_skills": sorted(resume_skills),
            "jd_skills":     [],
            "match_rate":    1.0,
        }

    matched    = resume_skills & jd_skills
    missing    = jd_skills - resume_skills
    match_rate = len(matched) / len(jd_skills)

    return {
        "matched":       sorted(matched),
        "missing":       sorted(missing),
        "resume_skills": sorted(resume_skills),
        "jd_skills":     sorted(jd_skills),
        "match_rate":    round(match_rate, 3),
    }
