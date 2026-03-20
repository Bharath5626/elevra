from ..ai_client import call_ai_json

SYSTEM_PROMPT = (
    "You are an experienced technical interviewer conducting a realistic mock interview. "
    "Your goal is to help students prepare for actual job interviews. "
    "Generate questions that are clear, specific, and directly relevant to the role and difficulty. "
    "Return JSON only. No markdown fences. No extra keys."
)

# Question type guide embedded in the prompt so the AI knows what each category means
_TYPE_GUIDE = """
Question type definitions:
- technical_concept : Test core knowledge of the role's tools, languages, or frameworks.
                      Example: "What is the difference between a list and a tuple in Python?"
- coding            : Ask the candidate to write, trace, or reason about a small piece of code /
                      algorithm. Keep it completable verbally in under 3 minutes.
                      Example: "How would you reverse a linked list? Walk me through your approach."
- behavioral        : Past-experience questions using the STAR format (Situation, Task, Action, Result).
                      Example: "Tell me about a project you built from scratch. What challenges did you face?"
- situational       : Hypothetical / problem-solving scenarios relevant to the role.
                      Example: "Your API is returning 500 errors in production. How would you debug it?"
- system_design     : High-level architecture and design trade-off questions (mid-level and above only).
                      Example: "How would you design a URL shortener service?"
- hr                : Motivation, goals, and culture-fit questions common in campus/first-job interviews.
                      Example: "Why do you want to work as a Python Developer? Where do you see yourself in 3 years?"
"""

# Per-difficulty question mix: list of types in the order they should appear
_MIX = {
    "1": ["technical_concept", "technical_concept", "coding", "behavioral", "situational", "hr"],
    "2": ["technical_concept", "technical_concept", "coding", "behavioral", "situational", "hr"],
    "3": ["technical_concept", "technical_concept", "coding", "system_design", "behavioral", "situational"],
    "4": ["technical_concept", "coding", "system_design", "system_design", "behavioral", "situational"],
    "5": ["technical_concept", "coding", "system_design", "system_design", "behavioral", "hr"],
}

_DIFFICULTY_LABELS = {
    "1": "Fresher — no industry experience, recently graduated or still studying",
    "2": "Junior — 0-1 years of experience, first or second job",
    "3": "Mid-Level — 1-3 years, works independently",
    "4": "Senior — 3-5 years, mentors others, owns features end-to-end",
    "5": "Lead / Principal — 5+ years, drives architecture and team decisions",
}

USER_TEMPLATE = """
You are generating exactly 7 interview questions for a mock interview session.

Candidate profile
-----------------
Role       : {role}
Difficulty : {difficulty}
Resume     : {resume_summary}

Question mix to follow (in this exact order)
--------------------------------------------
{mix_instructions}

{type_guide}

Rules
-----
1. Follow the mix order exactly — do NOT swap types.
2. Tailor difficulty, vocabulary, and depth to the level described above.
3. For "coding" questions at Fresher/Junior level, keep problems simple (arrays, strings, basic recursion).
4. For "behavioral" and "hr" questions, make them feel natural and conversational, not robotic.
5. If a resume is provided, personalise at least 2 questions around the candidate's actual skills or projects.
6. Each question must be self-contained — no follow-up context required.
7. expected_duration_seconds: hr/behavioral ≈ 120, coding ≈ 180, technical_concept ≈ 90, system_design ≈ 240.

Return this exact JSON (no extra keys, no markdown):
{{
  "questions": [
    {{
      "id": <int 1–7>,
      "text": <the full question string>,
      "type": <one of the type strings above>,
      "focus_area": <short label, e.g. "Python basics", "STAR method", "REST design">,
      "expected_duration_seconds": <int>
    }}
  ]
}}
"""


async def generate_questions(
    role: str,
    difficulty: str,
    resume_summary: str = "No resume provided.",
) -> list[dict]:
    diff_key   = str(difficulty)
    diff_label = _DIFFICULTY_LABELS.get(diff_key, difficulty)
    mix        = _MIX.get(diff_key, _MIX["1"])

    mix_instructions = "\n".join(
        f"  Q{i+1}: {qtype}" for i, qtype in enumerate(mix)
    )

    prompt = USER_TEMPLATE.format(
        role=role,
        difficulty=diff_label,
        resume_summary=resume_summary[:2000],
        mix_instructions=mix_instructions,
        type_guide=_TYPE_GUIDE,
    )
    data = await call_ai_json(SYSTEM_PROMPT, prompt, max_tokens=3000)
    return data.get("questions", [])
