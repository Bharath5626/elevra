from ..ai_client import call_ai_json

SYSTEM_PROMPT = (
    "You are a career development coach. Return JSON only. No markdown fences."
)

USER_TEMPLATE = """
Create a 30-day improvement plan based on this interview performance.

Role: {role}
Weak areas identified: {weak_areas}
Missing skills: {missing_skills}
Current overall score: {score}/100

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
        weak_areas=", ".join(weak_areas) if weak_areas else "General improvement needed",
        missing_skills=", ".join(missing_skills) if missing_skills else "None identified",
        score=score,
    )
    return await call_ai_json(SYSTEM_PROMPT, prompt, max_tokens=8192)
