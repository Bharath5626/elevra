from ..ai_client import call_ai_json

SYSTEM_PROMPT = (
    "You are an expert interview coach with 10 years of experience. "
    "Return JSON only. No markdown fences. "
    "Include timestamps for key feedback moments relative to transcript."
)

USER_TEMPLATE = """
Question: {question}
Transcript (with word timestamps): {transcript}
Role: {role}

Return:
{{
  "technical_score": <int 0-100>,
  "structure_score": <int 0-100>,
  "depth_score": <int 0-100>,
  "overall_score": <int 0-100>,
  "star_format_used": <boolean>,
  "strengths": [<string>],
  "improvements": [<string>],
  "model_answer_hint": <string>,
  "feedback_timestamps": [
    {{"time_seconds": <int>, "feedback": <string>, "type": "positive" | "negative"}}
  ]
}}
"""


async def evaluate_answer(
    question: str,
    transcript: str,
    role: str,
    code_text: str = "",
) -> dict:
    # FIX: Don't use .format() — transcripts/questions often contain { } (JSON, code)
    # which causes KeyError. Build the prompt via concatenation instead.

    has_code = bool(code_text and code_text.strip())

    prompt = (
        "Question: " + question + "\n"
        "Transcript: " + transcript[:4000] + "\n"
    )
    if has_code:
        prompt += "Candidate Code:\n" + code_text[:3000] + "\n"
    prompt += (
        "Role: " + role + "\n\n"
        "Return JSON matching this schema exactly:\n"
        '{\n'
        '  "technical_score": <int 0-100>,\n'
        '  "structure_score": <int 0-100>,\n'
        '  "depth_score": <int 0-100>,\n'
    )
    if has_code:
        prompt += (
            '  "code_correctness_score": <int 0-100, rate correctness, efficiency, and readability of the submitted code>,\n'
        )
    prompt += (
        '  "overall_score": <int 0-100>,\n'
        '  "star_format_used": <boolean>,\n'
        '  "model_answer_hint": <string>,\n'
        '  "strengths": [<string>],\n'
        '  "improvements": [<string>],\n'
        '  "feedback_timestamps": [\n'
        '    {"time_seconds": <int>, "feedback": <string>, "type": "positive"|"negative"}\n'
        '  ]\n'
        '}'
    )
    return await call_ai_json(SYSTEM_PROMPT, prompt, max_tokens=2048)
