from ..ai_client import call_ai_json

SYSTEM_PROMPT = (
    "You are a senior technical interviewer at a top tech company. "
    "Return JSON only. No markdown fences."
)

USER_TEMPLATE = """
Generate 6 interview questions for this candidate.

Parsed Resume Summary: {resume_summary}
Role: {role}
Difficulty: {difficulty} (1=fresher, 5=senior lead)

Return:
{{
  "questions": [
    {{
      "id": <int>,
      "text": <string>,
      "type": "technical" | "behavioral",
      "focus_area": <string>,
      "expected_duration_seconds": <int>
    }}
  ]
}}
"""

_DIFFICULTY_LABELS = {
    "1": "Fresher (no experience)",
    "2": "Junior (0-1 years)",
    "3": "Mid-Level (1-3 years)",
    "4": "Senior (3-5 years)",
    "5": "Lead / Principal (5+ years)",
}


async def generate_questions(
    role: str,
    difficulty: str,
    resume_summary: str = "No resume provided.",
) -> list[dict]:
    diff_label = _DIFFICULTY_LABELS.get(str(difficulty), difficulty)
    prompt = USER_TEMPLATE.format(
        resume_summary=resume_summary[:2000],
        role=role,
        difficulty=diff_label,
    )
    data = await call_ai_json(SYSTEM_PROMPT, prompt, max_tokens=2048)
    return data.get("questions", [])
