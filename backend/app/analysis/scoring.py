"""Final answer scoring algorithm.

Answer Score =
  0.30 × technical_score
  0.20 × structure_score
  0.15 × depth_score
  0.15 × eye_contact_pct × 100
  0.10 × confidence_score
  0.10 × speech_clarity_score
"""


def compute_answer_score(
    technical_score: int,
    structure_score: int,
    depth_score: int,           # 0 – 100  (was silently excluded before)
    eye_contact_pct: float,     # 0.0 – 1.0
    confidence_score: int,      # 0 – 100
    speech_clarity_score: int,  # 0 – 100
) -> int:
    raw = (
        0.30 * technical_score
        + 0.20 * structure_score
        + 0.15 * depth_score
        + 0.15 * (eye_contact_pct * 100)
        + 0.10 * confidence_score
        + 0.10 * speech_clarity_score
    )
    return max(0, min(100, int(round(raw))))
