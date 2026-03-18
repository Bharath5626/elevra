from __future__ import annotations
from datetime import datetime
from typing import Optional
from pydantic import BaseModel


# ── Search params ─────────────────────────────────────────
class JobSearchParams(BaseModel):
    query: str
    location: str = ""
    remote_only: bool = False
    page: int = 1


# ── Single job from JSearch ───────────────────────────────
class JobListingOut(BaseModel):
    job_id: str
    job_title: str
    company: str
    location: str
    description: str
    apply_url: str
    salary_range: Optional[str] = None
    posted_date: Optional[str] = None
    employer_logo: Optional[str] = None
    is_remote: bool = False


# ── Match score ───────────────────────────────────────────
class MatchScoreRequest(BaseModel):
    job_description: str
    resume_analysis_id: str


class MatchScoreOut(BaseModel):
    match_score: int
    matching_skills: list[str] = []
    missing_skills: list[str] = []


# ── Cover letter ──────────────────────────────────────────
class CoverLetterRequest(BaseModel):
    job_title: str
    company: str
    job_description: str
    resume_analysis_id: str


class CoverLetterOut(BaseModel):
    cover_letter: str


# ── Apply (save application) ─────────────────────────────
class ApplyRequest(BaseModel):
    job_id: str
    job_title: str
    company: str
    location: str = ""
    apply_url: str
    job_description: str = ""
    salary_range: Optional[str] = None
    employer_logo: Optional[str] = None
    match_score: int = 0
    cover_letter: str = ""
    resume_analysis_id: Optional[str] = None


# ── Application output ────────────────────────────────────
class JobApplicationOut(BaseModel):
    id: str
    user_id: str
    job_id: str
    job_title: str
    company: str
    location: str
    apply_url: str
    job_description: str
    salary_range: Optional[str] = None
    employer_logo: Optional[str] = None
    match_score: int
    cover_letter: str
    status: str
    resume_analysis_id: Optional[str] = None
    applied_at: datetime

    model_config = {"from_attributes": True}


# ── Update status ─────────────────────────────────────────
class StatusUpdate(BaseModel):
    status: str  # applied | interviewing | offer | rejected
