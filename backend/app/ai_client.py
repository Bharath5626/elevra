"""
Provider-agnostic AI client.

Auto-detects which provider to use based on the key prefix:
  sk-ant-...   → Anthropic Claude
  AIza...      → Google Gemini
"""
import re
import json
import logging

logger = logging.getLogger(__name__)


def _strip_fences(text: str) -> str:
    """Remove accidental markdown code fences."""
    text = re.sub(r'^```[a-z]*\n?', '', text.strip())
    text = re.sub(r'\n?```$', '', text)
    return text.strip()


def _detect_provider(key: str) -> str:
    if not key:
        raise ValueError(
            "AI_API_KEY is not set. Open career-ai-studio/.env and paste your Gemini or Anthropic key."
        )
    if key.startswith("sk-ant-"):
        return "anthropic"
    if key.startswith("AIza"):
        return "gemini"
    raise ValueError(
        f"Unrecognised API key format. "
        "Anthropic keys start with 'sk-ant-', Gemini keys start with 'AIza'."
    )


async def call_ai(system: str, prompt: str, max_tokens: int = 4096) -> str:
    """
    Send a prompt to the configured AI provider and return the raw text response.
    Raises on network/API errors so callers can handle them.
    """
    from .config import settings  # lazy import to avoid circular deps

    key = settings.AI_API_KEY
    provider = _detect_provider(key)
    logger.info("call_ai using provider=%s max_tokens=%d", provider, max_tokens)

    if provider == "anthropic":
        from anthropic import AsyncAnthropic
        client = AsyncAnthropic(api_key=key)
        message = await client.messages.create(
            model=settings.CLAUDE_MODEL,
            max_tokens=max_tokens,
            messages=[{"role": "user", "content": prompt}],
            system=system,
        )
        return message.content[0].text.strip()

    # provider == "gemini"
    from google import genai
    from google.genai import types
    client = genai.Client(api_key=key)
    response = await client.aio.models.generate_content(
        model=settings.GEMINI_MODEL,
        contents=prompt,
        config=types.GenerateContentConfig(
            system_instruction=system,
            max_output_tokens=max_tokens,
            response_mime_type="application/json",
        ),
    )
    # FIX: response.text is None when Gemini blocks/refuses the request
    if not response.text:
        raise ValueError(f"Gemini returned empty response (possible content block). Candidates: {response.candidates}")
    return response.text.strip()


async def call_ai_json(system: str, prompt: str, max_tokens: int = 4096) -> dict:
    """
    Like call_ai but parses the response as JSON.
    Strips markdown fences before parsing.
    """
    raw = await call_ai(system, prompt, max_tokens)
    raw = _strip_fences(raw)
    return json.loads(raw)
