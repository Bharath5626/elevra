"""Career Readiness Index (CRI) calculator (section 9.3 of master_plan.txt).

CRI = 0.35 × resume_score
    + 0.40 × interview_score
    + 0.15 × jd_fit_score
    + 0.10 × improvement_delta   (capped -20 to +20 points)

Percentile: computed against a synthetic distribution centred at 65.
"""
import math


def compute_cri(
    resume_score: int,
    interview_score: int,
    jd_fit_score: int,
    improvement_delta: float,
) -> int:
    delta_contribution = max(-20, min(20, improvement_delta))
    raw = (
        0.35 * resume_score
        + 0.40 * interview_score
        + 0.15 * jd_fit_score
        + 0.10 * delta_contribution
    )
    return max(0, min(100, int(round(raw))))


def estimate_percentile(cri_total: int) -> float:
    """
    Approximate percentile using a normal distribution
    with mean=65, std=15 — represents a realistic student population.
    """
    mean, std = 65.0, 15.0
    z = (cri_total - mean) / std
    percentile = 0.5 * (1 + math.erf(z / math.sqrt(2)))
    return round(percentile * 100, 1)
