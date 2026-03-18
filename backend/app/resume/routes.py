import logging
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from ..database import get_db
from ..models import User, ResumeAnalysis
from ..schemas import ResumeAnalysisOut
from ..auth.jwt_handler import get_current_user
from .parser import extract_text_from_pdf, compute_readability
from .analyzer import analyze_resume
from .profile_extractor import upsert_user_profile

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/resume", tags=["resume"])


@router.post("/analyze", response_model=ResumeAnalysisOut, status_code=201)
async def analyze_resume_endpoint(
    file: UploadFile = File(...),
    jd_text: str = Form(default=""),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    file_bytes = await file.read()
    if len(file_bytes) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds 5MB limit")

    resume_text = extract_text_from_pdf(file_bytes)
    if not resume_text.strip():
        raise HTTPException(status_code=422, detail="Could not extract text from PDF")

    # Version number
    count_result = await db.execute(
        select(func.count()).select_from(ResumeAnalysis).where(
            ResumeAnalysis.user_id == current_user.id
        )
    )
    version = (count_result.scalar() or 0) + 1

    # Run the full ATS pipeline (deterministic score + AI feedback)
    try:
        breakdown, ai_feedback = await analyze_resume(resume_text, jd_text)
    except Exception as e:
        logger.error("ATS analysis failed for user %s: %s", current_user.id, e, exc_info=True)
        raise HTTPException(status_code=502, detail=f"Analysis failed: {str(e)}")

    improved_bullets = [
        b["improved"] for b in ai_feedback.get("weak_bullets", [])
        if isinstance(b, dict) and "improved" in b
    ]

    record = ResumeAnalysis(
        user_id             = current_user.id,
        version_number      = version,
        filename            = file.filename,
        raw_text            = resume_text,
        resume_pdf          = file_bytes,
        jd_text             = jd_text,
        ats_score           = breakdown.total,
        ats_score_breakdown = breakdown.as_dict(),
        score_mode          = breakdown.mode,
        keyword_gaps        = ai_feedback.get("keyword_gaps", []),
        weak_bullets        = ai_feedback.get("weak_bullets", []),
        improved_bullets    = ai_feedback.get("improved_bullets", improved_bullets),
        section_feedback    = ai_feedback.get("section_feedback", {}),
        bias_flags          = ai_feedback.get("bias_flags", []),
        overall_suggestion  = ai_feedback.get("overall_suggestion", ""),
    )
    db.add(record)
    await db.flush()

    out = ResumeAnalysisOut.model_validate(record)
    out.skills_found        = breakdown.resume_skills
    out.overall_readability = compute_readability(resume_text)

    # Enrich user profile from this resume (fire-and-soft-fail)
    await upsert_user_profile(
        db=db,
        user=current_user,
        resume_text=resume_text,
        resume_skills=breakdown.resume_skills,
        resume_id=record.id,
    )

    return out


@router.get("/history", response_model=list[ResumeAnalysisOut])
async def resume_history(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(ResumeAnalysis)
        .where(ResumeAnalysis.user_id == current_user.id)
        .order_by(ResumeAnalysis.created_at.desc())
    )
    return result.scalars().all()


@router.get("/{resume_id}", response_model=ResumeAnalysisOut)
async def get_resume(
    resume_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(ResumeAnalysis).where(
            ResumeAnalysis.id == resume_id,
            ResumeAnalysis.user_id == current_user.id,
        )
    )
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="Resume analysis not found")
    return record
