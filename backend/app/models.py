import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, Text, DateTime,
    ForeignKey, JSON, LargeBinary,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from .database import Base


def _uuid():
    return str(uuid.uuid4())


# ─── Users ────────────────────────────────────────────────────────────────────
class User(Base):
    __tablename__ = "users"

    id            = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    email         = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    name          = Column(String(255), nullable=False)
    is_admin      = Column(Boolean, default=False, nullable=False)
    is_blocked    = Column(Boolean, default=False, nullable=False)
    created_at    = Column(DateTime, default=datetime.utcnow)

    resume_analyses   = relationship("ResumeAnalysis",   back_populates="user", cascade="all, delete-orphan")
    jd_analyses       = relationship("JDAnalysis",       back_populates="user", cascade="all, delete-orphan")
    interview_sessions= relationship("InterviewSession", back_populates="user", cascade="all, delete-orphan")
    cri_scores        = relationship("CRIScore",         back_populates="user", cascade="all, delete-orphan")
    roadmaps          = relationship("LearningRoadmap",  back_populates="user", cascade="all, delete-orphan")
    job_applications  = relationship("JobApplication",   back_populates="user", cascade="all, delete-orphan")
    profile           = relationship("UserProfile",      back_populates="user", uselist=False, cascade="all, delete-orphan")


# ─── Resume Analysis ──────────────────────────────────────────────────────────
class ResumeAnalysis(Base):
    __tablename__ = "resume_analyses"

    id                 = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    user_id            = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=False)
    version_number     = Column(Integer, default=1)
    filename           = Column(String(255))
    raw_text           = Column(Text)
    jd_text            = Column(Text)
    ats_score           = Column(Integer)
    ats_score_breakdown = Column(JSONB, default=dict)   # full deterministic sub-scores
    score_mode          = Column(String(20), default="general")  # "jd_provided" | "general"
    keyword_gaps        = Column(JSON, default=list)
    weak_bullets        = Column(JSON, default=list)
    improved_bullets    = Column(JSON, default=list)
    section_feedback    = Column(JSON, default=dict)
    bias_flags          = Column(JSON, default=list)
    overall_suggestion  = Column(Text)
    resume_pdf          = Column(LargeBinary, nullable=True)   # raw PDF bytes for extension upload
    created_at          = Column(DateTime, default=datetime.utcnow)

    user               = relationship("User", back_populates="resume_analyses")
    interview_sessions = relationship("InterviewSession", back_populates="resume_analysis")


# ─── JD Analysis ──────────────────────────────────────────────────────────────
class JDAnalysis(Base):
    __tablename__ = "jd_analyses"

    id               = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    user_id          = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=False)
    raw_jd           = Column(Text)
    role_title       = Column(String(255))
    required_skills  = Column(JSON, default=list)
    nice_to_have     = Column(JSON, default=list)
    culture_signals  = Column(JSON, default=list)
    fit_score        = Column(Integer)
    missing_skills   = Column(JSON, default=list)
    matching_skills  = Column(JSON, default=list)
    recommendation   = Column(Text)
    created_at       = Column(DateTime, default=datetime.utcnow)

    user             = relationship("User", back_populates="jd_analyses")


# ─── Interview Session ────────────────────────────────────────────────────────
class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id                 = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    user_id            = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=False)
    resume_analysis_id = Column(UUID(as_uuid=False), ForeignKey("resume_analyses.id"), nullable=True)
    job_role           = Column(String(255))
    difficulty         = Column(String(50))
    status             = Column(String(50), default="in_progress")
    questions          = Column(JSON, default=list)
    overall_score      = Column(Integer, default=0)
    created_at         = Column(DateTime, default=datetime.utcnow)

    user              = relationship("User",           back_populates="interview_sessions")
    resume_analysis   = relationship("ResumeAnalysis", back_populates="interview_sessions")
    answers           = relationship("InterviewAnswer",back_populates="session", cascade="all, delete-orphan")
    roadmaps          = relationship("LearningRoadmap",back_populates="session", cascade="all, delete-orphan")


# ─── Interview Answer ─────────────────────────────────────────────────────────
class InterviewAnswer(Base):
    __tablename__ = "interview_answers"

    id                   = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    session_id           = Column(UUID(as_uuid=False), ForeignKey("interview_sessions.id"), nullable=False)
    question_index       = Column(Integer)
    question_text        = Column(Text)
    video_url            = Column(String(500))
    code_text            = Column(Text, nullable=True)   # code editor answer (coding questions only)
    transcript           = Column(Text)
    filler_count         = Column(Integer, default=0)
    wpm                  = Column(Float, default=0.0)
    speech_clarity_score = Column(Integer, default=0)
    eye_contact_pct      = Column(Float, default=0.0)
    eye_contact_timeline = Column(JSON, default=list)
    emotion_scores       = Column(JSON, default=dict)
    confidence_score     = Column(Integer, default=0)
    technical_score      = Column(Integer, default=0)
    structure_score      = Column(Integer, default=0)
    depth_score          = Column(Integer, default=0)
    code_correctness_score = Column(Integer, nullable=True)  # only set for coding questions
    overall_score        = Column(Integer, default=0)
    strengths            = Column(JSON, default=list)
    improvements         = Column(JSON, default=list)
    model_answer_hint    = Column(Text, nullable=True)
    star_format_used     = Column(Boolean, default=False)
    feedback_timestamps  = Column(JSON, default=list)
    created_at           = Column(DateTime, default=datetime.utcnow)

    session = relationship("InterviewSession", back_populates="answers")


# ─── Learning Roadmap ─────────────────────────────────────────────────────────
class LearningRoadmap(Base):
    __tablename__ = "learning_roadmaps"

    id           = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    user_id      = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=False)
    session_id   = Column(UUID(as_uuid=False), ForeignKey("interview_sessions.id"), nullable=True)
    plan         = Column(JSON, default=dict)
    generated_at = Column(DateTime, default=datetime.utcnow)

    user    = relationship("User",             back_populates="roadmaps")
    session = relationship("InterviewSession", back_populates="roadmaps")


# ─── CRI Score ────────────────────────────────────────────────────────────────
class CRIScore(Base):
    __tablename__ = "cri_scores"

    id                = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    user_id           = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=False)
    resume_score      = Column(Integer, default=0)
    interview_score   = Column(Integer, default=0)
    jd_fit_score      = Column(Integer, default=0)
    improvement_delta = Column(Float, default=0.0)
    cri_total         = Column(Integer, default=0)
    percentile        = Column(Float, default=0.0)
    recorded_at       = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="cri_scores")


# ─── Question Bank ────────────────────────────────────────────────────────────
class QuestionBankItem(Base):
    __tablename__ = "question_bank"

    id           = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    text         = Column(Text, nullable=False)
    type         = Column(String(50))
    role         = Column(String(100))
    difficulty   = Column(Integer)
    topic        = Column(String(100))
    model_answer = Column(Text)
    tags         = Column(JSON, default=list)


# ─── Job Application ──────────────────────────────────────────────────────────
class JobApplication(Base):
    __tablename__ = "job_applications"

    id                 = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    user_id            = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=False)
    resume_analysis_id = Column(UUID(as_uuid=False), ForeignKey("resume_analyses.id"), nullable=True)
    job_id             = Column(String(255))          # external JSearch job id
    job_title          = Column(String(255))
    company            = Column(String(255))
    location           = Column(String(255))
    apply_url          = Column(String(1000))
    job_description    = Column(Text)
    salary_range       = Column(String(100), nullable=True)
    employer_logo      = Column(String(1000), nullable=True)
    match_score        = Column(Integer, default=0)
    cover_letter       = Column(Text)
    status             = Column(String(50), default="applied")  # applied | interviewing | offer | rejected
    applied_at         = Column(DateTime, default=datetime.utcnow)

    user            = relationship("User", back_populates="job_applications")
    resume_analysis = relationship("ResumeAnalysis")


# ─── User Profile (one-to-one, auto-enriched from resume + interview) ─────────
class UserProfile(Base):
    __tablename__ = "user_profiles"

    id            = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    user_id       = Column(UUID(as_uuid=False), ForeignKey("users.id"), unique=True, nullable=False)

    # ── Contact / identity ────────────────────────────────────────────────────
    full_name     = Column(String(255))
    email         = Column(String(255))          # mirrors User.email, handy for apply forms
    phone         = Column(String(50))
    location      = Column(String(255))
    linkedin_url  = Column(String(500))
    github_url    = Column(String(500))
    portfolio_url = Column(String(500))

    # ── Career summary ────────────────────────────────────────────────────────
    headline             = Column(String(255))   # e.g. "Senior Python Developer"
    summary              = Column(Text)          # professional summary paragraph
    years_of_experience  = Column(Integer, default=0)

    # ── Extracted content (from latest resume parse) ──────────────────────────
    skills           = Column(JSONB, default=list)   # flat list of skill strings
    experience_raw   = Column(Text)                 # raw experience section text
    education_raw    = Column(Text)                 # raw education section text
    certifications   = Column(JSONB, default=list)   # list of certification strings

    # ── Job preferences (accumulated from interview sessions) ─────────────────────
    preferred_roles     = Column(JSONB, default=list)   # ["Software Engineer", …]
    preferred_locations = Column(JSONB, default=list)   # ["Remote", "New York", …]

    # ── Meta ──────────────────────────────────────────────────────────────────
    last_resume_id  = Column(UUID(as_uuid=False), ForeignKey("resume_analyses.id"), nullable=True)
    last_updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="profile")
