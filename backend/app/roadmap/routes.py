import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..database import get_db
from ..models import User, LearningRoadmap, InterviewSession, InterviewAnswer
from ..schemas import RoadmapOut
from ..auth.jwt_handler import get_current_user
from .generator import generate_roadmap

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/roadmap", tags=["roadmap"])


@router.post("/generate", response_model=RoadmapOut, status_code=201)
async def create_roadmap(
    body: dict,   # {session_id: str}
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session_id = body.get("session_id", "")
    r = await db.execute(
        select(InterviewSession).where(
            InterviewSession.id == session_id,
            InterviewSession.user_id == current_user.id,
        )
    )
    session = r.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found")

    # Collect weak areas from answers, stripping out technical-failure messages
    # (e.g. "No speech was detected", "microphone", "API evaluation failed")
    TECHNICAL_NOISE = ("no speech", "microphone", "ai evaluation failed", "re-record", "api key")
    ar = await db.execute(
        select(InterviewAnswer).where(InterviewAnswer.session_id == session_id)
    )
    answers = ar.scalars().all()
    weak_areas: list[str] = []
    for a in answers:
        for item in (a.improvements or []):
            low = item.lower()
            if not any(kw in low for kw in TECHNICAL_NOISE):
                weak_areas.append(item)
    weak_areas = list(dict.fromkeys(weak_areas))[:10]

    try:
        plan = await generate_roadmap(
            role=session.job_role,
            weak_areas=weak_areas,
            missing_skills=[],
            score=session.overall_score or 50,
        )
    except Exception as e:
        logger.error("Roadmap generation failed for user %s: %s", current_user.id, e, exc_info=True)
        raise HTTPException(status_code=502, detail=f"Roadmap generation failed: {str(e)}")

    record = LearningRoadmap(
        user_id=current_user.id,
        session_id=session_id,
        plan=plan,
    )
    db.add(record)
    await db.flush()
    return record


@router.get("/all", response_model=list[RoadmapOut])
async def list_roadmaps(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    r = await db.execute(
        select(LearningRoadmap)
        .where(LearningRoadmap.user_id == current_user.id)
        .order_by(LearningRoadmap.generated_at.desc())
    )
    return r.scalars().all()


@router.get("/{session_id}", response_model=RoadmapOut)
async def get_roadmap(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    r = await db.execute(
        select(LearningRoadmap).where(
            LearningRoadmap.session_id == session_id,
            LearningRoadmap.user_id == current_user.id,
        ).order_by(LearningRoadmap.generated_at.desc())
    )
    record = r.scalars().first()
    if not record:
        raise HTTPException(status_code=404, detail="Roadmap not found. Generate one first.")
    return record
