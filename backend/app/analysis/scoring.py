"""Final answer scoring algorithm.

Answer Score (no code) =
  0.30 × technical_score
  0.20 × structure_score
  0.15 × depth_score
  0.15 × eye_contact_pct × 100
  0.10 × confidence_score
  0.10 × speech_clarity_score

Answer Score (coding question — code submitted) =
  0.25 × technical_score
  0.20 × code_correctness_score
  0.15 × structure_score
  0.10 × depth_score
  0.15 × eye_contact_pct × 100
  0.08 × confidence_score
  0.07 × speech_clarity_score
"""
from typing import Optional


def compute_answer_score(
    technical_score: int,
    structure_score: int,
    depth_score: int,           # 0 – 100
    eye_contact_pct: float,     # 0.0 – 1.0
    confidence_score: int,      # 0 – 100
    speech_clarity_score: int,  # 0 – 100
    code_correctness_score: Optional[int] = None,  # present only for coding questions
) -> int:
    if code_correctness_score is not None:
        # Coding question: code score replaces some weight from soft skills
        raw = (
            0.25 * technical_score
            + 0.20 * code_correctness_score
            + 0.15 * structure_score
            + 0.10 * depth_score
            + 0.15 * (eye_contact_pct * 100)
            + 0.08 * confidence_score
            + 0.07 * speech_clarity_score
        )
    else:
        raw = (
            0.30 * technical_score
            + 0.20 * structure_score
            + 0.15 * depth_score
            + 0.15 * (eye_contact_pct * 100)
            + 0.10 * confidence_score
            + 0.10 * speech_clarity_score
        )
    return max(0, min(100, int(round(raw))))
