"""
Provider-agnostic AI client.

Auto-detects which provider to use based on the key prefix:
  sk-ant-...   → Anthropic Claude
  AIza...      → Google Gemini

Gemini quota fallback chain:
  gemini-2.5-flash  →  gemini-2.0-flash  →  gemini-1.5-flash  →  gemini-1.5-flash-8b
"""
import re
import json
import logging
from typing import List

logger = logging.getLogger(__name__)

# Models tried in order when a 429 is hit.  All are free-tier eligible.
_GEMINI_FALLBACK_CHAIN: List[str] = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-1.5-flash-8b",
]


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


async def _call_gemini(key: str, primary_model: str, system: str, prompt: str, max_tokens: int) -> str:
    """Try the primary model first, then fall back through the chain on 429."""
    from google import genai
    from google.genai import types
    from google.genai.errors import ClientError

    client = genai.Client(api_key=key)

    # Build fallback list: primary first, then the rest of the chain (no duplicates)
    chain = [primary_model] + [m for m in _GEMINI_FALLBACK_CHAIN if m != primary_model]

    last_exc: Exception = RuntimeError("No models in fallback chain.")
    for model in chain:
        try:
            logger.info("Gemini call: model=%s max_tokens=%d", model, max_tokens)
            response = await client.aio.models.generate_content(
                model=model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system,
                    max_output_tokens=max_tokens,
                    response_mime_type="application/json",
                ),
            )
            if not response.text:
                raise ValueError(
                    f"Gemini returned empty response (possible content block). "
                    f"Candidates: {response.candidates}"
                )
            return response.text.strip()
        except ClientError as exc:
            if exc.status_code == 429:
                logger.warning(
                    "Gemini quota exhausted for model=%s, trying next fallback. Error: %s",
                    model, exc,
                )
                last_exc = exc
                continue  # try next model
            raise  # non-quota errors bubble up immediately

    raise last_exc  # all models exhausted


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
    return await _call_gemini(key, settings.GEMINI_MODEL, system, prompt, max_tokens)


async def call_ai_json(system: str, prompt: str, max_tokens: int = 4096) -> dict:
    """
    Like call_ai but parses the response as JSON.
    Strips markdown fences before parsing.
    """
    raw = await call_ai(system, prompt, max_tokens)
    raw = _strip_fences(raw)
    return json.loads(raw)
