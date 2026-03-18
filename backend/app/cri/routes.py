from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..database import get_db
from ..models import User, CRIScore, ResumeAnalysis, InterviewSession
from ..schemas import CRIScoreOut
from ..auth.jwt_handler import get_current_user
from .calculator import compute_cri, estimate_percentile

router = APIRouter(prefix="/cri", tags=["cri"])


async def _build_cri(user: User, db: AsyncSession) -> CRIScore:
    """Compute and persist a fresh CRI score for the user."""
    # Latest resume score
    rr = await db.execute(
        select(ResumeAnalysis)
        .where(ResumeAnalysis.user_id == user.id)
        .order_by(ResumeAnalysis.created_at.desc())
    )
    latest_resume = rr.scalars().first()
    resume_score = latest_resume.ats_score if latest_resume else 0

    # Average interview score (last 5 sessions)
    sr = await db.execute(
        select(InterviewSession)
        .where(
            InterviewSession.user_id == user.id,
            InterviewSession.status == "completed",
        )
        .order_by(InterviewSession.created_at.desc())
        .limit(5)
    )
    sessions = sr.scalars().all()
    interview_score = (
        int(sum(s.overall_score for s in sessions) / len(sessions)) if sessions else 0
    )

    # Improvement delta vs previous CRI
    prev_r = await db.execute(
        select(CRIScore)
        .where(CRIScore.user_id == user.id)
        .order_by(CRIScore.recorded_at.desc())
    )
    prev = prev_r.scalars().first()
    prev_total = prev.cri_total if prev else 0

    base_cri = compute_cri(
        resume_score=resume_score,
        interview_score=interview_score,
        jd_fit_score=0,
        improvement_delta=0,
    )
    improvement_delta = float(base_cri) - prev_total
    cri_total = compute_cri(
        resume_score=resume_score,
        interview_score=interview_score,
        jd_fit_score=0,
        improvement_delta=improvement_delta,
    )
    percentile = estimate_percentile(cri_total)

    record = CRIScore(
        user_id=user.id,
        resume_score=resume_score,
        interview_score=interview_score,
        jd_fit_score=0,
        improvement_delta=improvement_delta,
        cri_total=cri_total,
        percentile=percentile,
    )
    db.add(record)
    await db.flush()
    return record


@router.get("/current", response_model=CRIScoreOut)
async def get_current_cri(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = await _build_cri(current_user, db)
    return record


@router.get("/history", response_model=list[CRIScoreOut])
async def cri_history(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    r = await db.execute(
        select(CRIScore)
        .where(CRIScore.user_id == current_user.id)
        .order_by(CRIScore.recorded_at.desc())
        .limit(30)
    )
    return r.scalars().all()
