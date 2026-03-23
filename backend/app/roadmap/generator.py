from ..ai_client import call_ai_json

SYSTEM_PROMPT = (
    "You are a career development coach. Return JSON only. No markdown fences."
)

USER_TEMPLATE = """
Create a 30-day improvement plan to help a candidate get hired as a {role}.

Role: {role}
Areas to improve: {weak_areas}
Missing skills: {missing_skills}
Interview score: {score}/100

Focus purely on technical skills, communication, and career readiness for the role.
Do NOT mention any audio, microphone, or recording issues.

Return:
{{
  "summary": <string>,
  "weeks": [
    {{
      "week": <int>,
      "focus": <string>,
      "daily_tasks": [<string>],
      "resources": [
        {{"title": <string>, "url": <string>, "type": "video" | "article" | "practice"}}
      ]
    }}
  ],
  "quick_wins": [<string>]
}}
"""


async def generate_roadmap(
    role: str,
    weak_areas: list[str],
    missing_skills: list[str],
    score: int,
) -> dict:
    prompt = USER_TEMPLATE.format(
        role=role,
        weak_areas=", ".join(weak_areas) if weak_areas else "No specific weaknesses identified — build a well-rounded preparation plan for this role",
        missing_skills=", ".join(missing_skills) if missing_skills else "None identified",
        score=score,
    )
    return await call_ai_json(SYSTEM_PROMPT, prompt, max_tokens=8192)
