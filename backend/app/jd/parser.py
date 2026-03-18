from ..ai_client import call_ai_json

SYSTEM_PROMPT = (
    "You are a talent acquisition expert. Return JSON only. No markdown fences."
)

USER_TEMPLATE = """
Parse this job description deeply.

JD:
{jd_text}

Candidate Skills: {candidate_skills}

Return:
{{
  "role_title": <string>,
  "required_skills": [<string>],
  "nice_to_have": [<string>],
  "culture_signals": [<string>],
  "fit_score": <int 0-100>,
  "missing_skills": [<string>],
  "matching_skills": [<string>],
  "recommendation": <string>
}}
"""


async def analyze_jd_with_claude(
    jd_text: str,
    candidate_skills: list[str],
) -> dict:
    prompt = USER_TEMPLATE.format(
        jd_text=jd_text[:6000],
        candidate_skills=", ".join(candidate_skills) if candidate_skills else "Not provided",
    )
    return await call_ai_json(SYSTEM_PROMPT, prompt, max_tokens=2048)
