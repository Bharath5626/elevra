"""
Text embedding utilities.

Primary:  Gemini text-embedding-004 (768-dim vectors, free tier)
Fallback: TF-IDF cosine similarity (no external model needed)

The fallback activates automatically when:
  - The configured AI key is an Anthropic key (no embedding endpoint)
  - The Gemini embedding API call fails for any reason
"""
import math
import asyncio
import logging
from collections import Counter

logger = logging.getLogger(__name__)

_GEMINI_EMBEDDING_MODEL = "embedding-001"
_MAX_EMBED_CHARS = 8000  # Gemini token limit guard


# ── Vector math ──────────────────────────────────────────────────────────────

def cosine_similarity(vec_a: list[float], vec_b: list[float]) -> float:
    """Return cosine similarity in [0.0, 1.0] between two equal-length vectors."""
    if not vec_a or not vec_b:
        return 0.0
    dot   = sum(a * b for a, b in zip(vec_a, vec_b))
    mag_a = math.sqrt(sum(a * a for a in vec_a))
    mag_b = math.sqrt(sum(b * b for b in vec_b))
    if mag_a == 0.0 or mag_b == 0.0:
        return 0.0
    return dot / (mag_a * mag_b)


def _tfidf_similarity(text_a: str, text_b: str) -> float:
    """
    Bag-of-words TF-IDF cosine similarity.
    Used as fallback when Gemini embeddings are unavailable.
    """
    import re
    def tokenize(t: str) -> list[str]:
        return re.findall(r'\b[a-z][a-z+#.]{1,}\b', t.lower())

    tokens_a = tokenize(text_a)
    tokens_b = tokenize(text_b)
    vocab    = list(set(tokens_a) | set(tokens_b))
    if not vocab:
        return 0.0

    freq_a = Counter(tokens_a)
    freq_b = Counter(tokens_b)
    vec_a  = [freq_a.get(w, 0) for w in vocab]
    vec_b  = [freq_b.get(w, 0) for w in vocab]
    return cosine_similarity(vec_a, vec_b)


# ── Gemini embedding ──────────────────────────────────────────────────────────

def _is_gemini_key(key: str) -> bool:
    return bool(key) and key.startswith("AIza")


async def _gemini_embed(text: str, key: str) -> list[float] | None:
    """
    Call Gemini text-embedding-004 synchronously inside a thread
    so it doesn't block the FastAPI event loop.
    Returns embedding vector or None on failure.
    """
    def _sync_call() -> list[float]:
        from google import genai  # already in requirements.txt
        client   = genai.Client(api_key=key)
        response = client.models.embed_content(
            model=_GEMINI_EMBEDDING_MODEL,
            contents=text[:_MAX_EMBED_CHARS],
        )
        return list(response.embedding.values)

    try:
        return await asyncio.to_thread(_sync_call)
    except Exception as exc:
        logger.warning("Gemini embedding failed (%s), falling back to TF-IDF", exc)
        return None


# ── Public API ────────────────────────────────────────────────────────────────

async def compute_semantic_similarity(
    text_a: str,
    text_b: str,
) -> tuple[float, str]:
    """
    Compute semantic similarity between two texts.

    Returns:
        (score: float 0.0–1.0, method: str)

    Method values:
        "gemini_embedding" — Gemini text-embedding-004 cosine similarity
        "tfidf_fallback"   — bag-of-words TF-IDF cosine similarity
    """
    from ..config import settings  # lazy to avoid circular import

    key = settings.AI_API_KEY

    if _is_gemini_key(key):
        # Embed both texts concurrently
        emb_a, emb_b = await asyncio.gather(
            _gemini_embed(text_a, key),
            _gemini_embed(text_b, key),
        )
        if emb_a and emb_b:
            sim = cosine_similarity(emb_a, emb_b)
            # Cosine sim on embedding space is naturally 0-1 for text
            return round(sim, 4), "gemini_embedding"

    # Anthropic key or Gemini call failed → TF-IDF fallback
    sim = _tfidf_similarity(text_a, text_b)
    return round(sim, 4), "tfidf_fallback"
