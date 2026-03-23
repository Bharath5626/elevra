from __future__ import annotations
from datetime import datetime
from typing import Any, Optional
from pydantic import BaseModel, EmailStr, field_validator

from .auth.disposable_domains import is_disposable_email


# ════════════════════════════════════════════════════════════
# AUTH
# ════════════════════════════════════════════════════════════
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str

    @field_validator("email")
    @classmethod
    def reject_disposable_email(cls, v: str) -> str:
        if is_disposable_email(v):
            raise ValueError(
                "Temporary or disposable email addresses are not allowed. "
                "Please use a permanent email address."
            )
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class GoogleAuthRequest(BaseModel):
    access_token: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    id: str
    email: str
    name: str
    full_name: str  # alias for frontend compat
    created_at: datetime

    model_config = {"from_attributes": True}

    @classmethod
    def from_orm(cls, obj: Any) -> "UserOut":  # type: ignore[override]
        return cls(
            id=obj.id,
            email=obj.email,
            name=obj.name,
            full_name=obj.name,
            created_at=obj.created_at,
        )


# ════════════════════════════════════════════════════════════
# RESUME
# ════════════════════════════════════════════════════════════
class WeakBullet(BaseModel):
    original: str
    improved: str


class SectionFeedback(BaseModel):
    summary: str = ""
    experience: str = ""
    skills: str = ""
    education: str = ""


class ResumeAnalysisOut(BaseModel):
    id: str
    user_id: str
    version_number: int
    filename: str
    jd_text: Optional[str] = None
    ats_score: int
    score_mode: Optional[str] = "general"       # "jd_provided" | "general"
    ats_score_breakdown: Optional[dict] = None  # full deterministic sub-scores
    keyword_gaps: list[str] = []
    skills_found: list[str] = []
    weak_bullets: list[Any] = []
    improved_bullets: list[str] = []
    section_feedback: Any = {}
    bias_flags: list[str] = []
    overall_suggestion: str = ""
    overall_readability: Optional[float] = None
    created_at: datetime

    model_config = {"from_attributes": True}


# ════════════════════════════════════════════════════════════
# JD
# ════════════════════════════════════════════════════════════
class JDAnalyzeRequest(BaseModel):
    jd_text: str
    candidate_skills: list[str] = []


class JDAnalysisOut(BaseModel):
    id: str
    user_id: str
    raw_jd: str
    role_title: str
    required_skills: list[str] = []
    nice_to_have: list[str] = []
    culture_signals: list[str] = []
    fit_score: int
    missing_skills: list[str] = []
    matching_skills: list[str] = []
    recommendation: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ════════════════════════════════════════════════════════════
# INTERVIEW
# ════════════════════════════════════════════════════════════
class StartSessionRequest(BaseModel):
    resume_analysis_id: Optional[str] = None
    job_role: str
    difficulty: str = "1"


class InterviewQuestion(BaseModel):
    id: int
    text: str
    type: str
    focus_area: str
    expected_duration_seconds: int


class InterviewSessionOut(BaseModel):
    id: str
    user_id: str
    resume_analysis_id: Optional[str] = None
    job_role: str
    difficulty: str
    status: str
    questions: list[Any] = []
    overall_score: int = 0
    created_at: datetime

    model_config = {"from_attributes": True}


class InterviewAnswerOut(BaseModel):
    id: str
    session_id: str
    question_index: int
    question_text: str
    video_url: Optional[str] = None
    code_text: Optional[str] = None
    transcript: Optional[str] = None
    filler_count: int = 0
    wpm: float = 0.0
    speech_clarity_score: int = 0
    eye_contact_pct: float = 0.0
    eye_contact_timeline: list[float] = []
    emotion_scores: dict = {}
    confidence_score: int = 0
    technical_score: int = 0
    structure_score: int = 0
    depth_score: int = 0
    code_correctness_score: Optional[int] = None
    overall_score: int = 0
    strengths: list[str] = []
    improvements: list[str] = []
    model_answer_hint: Optional[str] = None
    star_format_used: bool = False
    feedback_timestamps: list[Any] = []
    created_at: datetime

    model_config = {"from_attributes": True}


# ════════════════════════════════════════════════════════════
# ANALYSIS STATUS
# ════════════════════════════════════════════════════════════
class AnalysisStatusOut(BaseModel):
    session_id: str
    status: str
    progress: int
    current_step: str


# ════════════════════════════════════════════════════════════
# ROADMAP
# ════════════════════════════════════════════════════════════
class RoadmapOut(BaseModel):
    id: str
    user_id: str
    session_id: Optional[str] = None
    plan: dict
    generated_at: datetime

    model_config = {"from_attributes": True}


# ════════════════════════════════════════════════════════════
# CRI
# ════════════════════════════════════════════════════════════
class CRIScoreOut(BaseModel):
    id: str
    user_id: str
    resume_score: int
    interview_score: int
    jd_fit_score: int
    improvement_delta: float
    cri_total: int
    percentile: float
    recorded_at: datetime

    model_config = {"from_attributes": True}


# ════════════════════════════════════════════════════════════
# USER PROFILE  (one-to-one, auto-enriched from resume + interviews)
# ════════════════════════════════════════════════════════════
class UserProfileOut(BaseModel):
    id: str
    user_id: str
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    headline: Optional[str] = None
    summary: Optional[str] = None
    years_of_experience: int = 0
    skills: list[str] = []
    experience_raw: Optional[str] = None
    education_raw: Optional[str] = None
    certifications: list[str] = []
    preferred_roles: list[str] = []
    preferred_locations: list[str] = []
    last_resume_id: Optional[str] = None
    last_updated_at: datetime

    model_config = {"from_attributes": True}


class UserProfileUpdate(BaseModel):
    """Fields the user can manually edit/override."""
    phone: Optional[str] = None
    location: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    headline: Optional[str] = None
    summary: Optional[str] = None
    years_of_experience: Optional[int] = None
    preferred_roles: Optional[list[str]] = None
    preferred_locations: Optional[list[str]] = None
