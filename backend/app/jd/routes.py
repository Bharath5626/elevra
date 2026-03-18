import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..database import get_db
from ..models import User, JDAnalysis
from ..schemas import JDAnalyzeRequest, JDAnalysisOut
from ..auth.jwt_handler import get_current_user
from .parser import analyze_jd_with_claude

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/jd", tags=["jd"])


@router.post("/analyze", response_model=JDAnalysisOut, status_code=201)
async def analyze_jd(
    body: JDAnalyzeRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not body.jd_text.strip():
        raise HTTPException(status_code=400, detail="JD text cannot be empty")
    try:
        result = await analyze_jd_with_claude(body.jd_text, body.candidate_skills)
    except Exception as e:
        logger.error("JD AI analysis failed for user %s: %s", current_user.id, e, exc_info=True)
        raise HTTPException(status_code=502, detail=f"AI analysis failed: {str(e)}")

    record = JDAnalysis(
        user_id=current_user.id,
        raw_jd=body.jd_text,
        role_title=result.get("role_title", ""),
        required_skills=result.get("required_skills", []),
        nice_to_have=result.get("nice_to_have", []),
        culture_signals=result.get("culture_signals", []),
        fit_score=result.get("fit_score", 0),
        missing_skills=result.get("missing_skills", []),
        matching_skills=result.get("matching_skills", []),
        recommendation=result.get("recommendation", ""),
    )
    db.add(record)
    await db.flush()
    return record


@router.get("/history", response_model=list[JDAnalysisOut])
async def jd_history(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(JDAnalysis)
        .where(JDAnalysis.user_id == current_user.id)
        .order_by(JDAnalysis.created_at.desc())
    )
    return result.scalars().all()
