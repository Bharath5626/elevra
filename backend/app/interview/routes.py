import logging
import os
import tempfile
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form, BackgroundTasks
from fastapi.responses import FileResponse
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..database import get_db
from ..models import User, InterviewSession, InterviewAnswer, ResumeAnalysis, UserProfile
from ..schemas import StartSessionRequest, InterviewSessionOut, InterviewAnswerOut, AnalysisStatusOut
from ..auth.jwt_handler import get_current_user, decode_token
from .generator import generate_questions
from .pipeline import run_analysis_pipeline, get_status

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/interview", tags=["interview"])

# ── Video auth: <video> elements can't send Authorization headers,
# so we also accept the JWT via ?token= query param.
_optional_bearer = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)

async def _get_video_user(
    header_token: Optional[str] = Depends(_optional_bearer),
    query_token: Optional[str] = Query(default=None, alias="token"),
    db: AsyncSession = Depends(get_db),
) -> User:
    token = header_token or query_token
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    user_id = decode_token(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


@router.post("/start", response_model=InterviewSessionOut, status_code=201)
async def start_session(
    body: StartSessionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Optionally grab resume text for personalised questions
    resume_summary = "No resume provided."
    if body.resume_analysis_id:
        r = await db.execute(
            select(ResumeAnalysis).where(
                ResumeAnalysis.id == body.resume_analysis_id,
                ResumeAnalysis.user_id == current_user.id,
            )
        )
        resume = r.scalar_one_or_none()
        if resume and resume.raw_text:
            resume_summary = resume.raw_text[:1500]

    difficulty_label = {
        "1": "Fresher", "2": "Junior", "3": "Mid-Level", "4": "Senior", "5": "Lead",
    }.get(str(body.difficulty), body.difficulty)

    try:
        questions = await generate_questions(
            role=body.job_role,
            difficulty=body.difficulty,
            resume_summary=resume_summary,
        )
    except Exception as e:
        logger.error("Interview question generation failed for user %s: %s", current_user.id, e, exc_info=True)
        raise HTTPException(status_code=502, detail=f"Question generation failed: {str(e)}")

    session = InterviewSession(
        user_id=current_user.id,
        resume_analysis_id=body.resume_analysis_id or None,
        job_role=body.job_role,
        difficulty=difficulty_label,
        status="in_progress",
        questions=questions,
    )
    db.add(session)
    await db.flush()

    # Track job role preference in user profile
    try:
        pr = await db.execute(
            select(UserProfile).where(UserProfile.user_id == current_user.id)
        )
        profile = pr.scalar_one_or_none()
        if profile is not None:
            roles: list[str] = list(profile.preferred_roles or [])
            role_lower = body.job_role.strip().lower()
            if not any(r.lower() == role_lower for r in roles):
                roles.insert(0, body.job_role.strip())
                profile.preferred_roles = roles[:10]   # keep last 10
                await db.flush()
    except Exception as _exc:
        logger.warning("Could not update preferred_roles for user %s: %s", current_user.id, _exc)

    return session


@router.post("/{session_id}/upload", status_code=202)
async def upload_answer(
    session_id: str,
    video: UploadFile = File(...),
    question_index: int = Form(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    r = await db.execute(
        select(InterviewSession).where(
            InterviewSession.id == session_id,
            InterviewSession.user_id == current_user.id,
        )
    )
    session = r.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    questions = session.questions or []
    question_text = ""
    if question_index < len(questions):
        q = questions[question_index]
        question_text = q.get("text", "") if isinstance(q, dict) else ""

    # Save video to temp storage (swap for DO Spaces in production)
    video_bytes = await video.read()
    tmp_dir = tempfile.mkdtemp()
    tmp_path = os.path.join(tmp_dir, f"answer_{question_index}.webm")
    with open(tmp_path, "wb") as f:
        f.write(video_bytes)

    # Upsert answer record
    answer_r = await db.execute(
        select(InterviewAnswer).where(
            InterviewAnswer.session_id == session_id,
            InterviewAnswer.question_index == question_index,
        )
    )
    answer = answer_r.scalar_one_or_none()
    if answer:
        answer.video_url = tmp_path
    else:
        answer = InterviewAnswer(
            session_id=session_id,
            question_index=question_index,
            question_text=question_text,
            video_url=tmp_path,
        )
        db.add(answer)
    await db.flush()
    return {"message": "Video uploaded", "question_index": question_index}


@router.post("/{session_id}/trigger", status_code=202)
async def trigger_analysis(
    session_id: str,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    r = await db.execute(
        select(InterviewSession).where(
            InterviewSession.id == session_id,
            InterviewSession.user_id == current_user.id,
        )
    )
    session = r.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if session.status != "completed":
        session.status = "analyzing"
        await db.flush()

    background_tasks.add_task(_run_bg, session_id)
    return {"message": "Analysis started"}


async def _run_bg(session_id: str) -> None:
    """Create a fresh DB session for the background task."""
    from ..database import AsyncSessionLocal
    async with AsyncSessionLocal() as bg_db:
        await run_analysis_pipeline(session_id, bg_db)


@router.get("/sessions", response_model=list[InterviewSessionOut])
async def list_sessions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    r = await db.execute(
        select(InterviewSession)
        .where(InterviewSession.user_id == current_user.id)
        .order_by(InterviewSession.created_at.desc())
    )
    return r.scalars().all()


@router.get("/{session_id}", response_model=InterviewSessionOut)
async def get_session(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    r = await db.execute(
        select(InterviewSession).where(
            InterviewSession.id == session_id,
            InterviewSession.user_id == current_user.id,
        )
    )
    session = r.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@router.get("/{session_id}/answers", response_model=list[InterviewAnswerOut])
async def get_answers(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Verify ownership
    r = await db.execute(
        select(InterviewSession).where(
            InterviewSession.id == session_id,
            InterviewSession.user_id == current_user.id,
        )
    )
    if not r.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Session not found")

    ar = await db.execute(
        select(InterviewAnswer)
        .where(InterviewAnswer.session_id == session_id)
        .order_by(InterviewAnswer.question_index)
    )
    return ar.scalars().all()


@router.get("/{session_id}/video/{question_index}")
async def stream_video(
    session_id: str,
    question_index: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(_get_video_user),
):
    """Stream a recorded answer video. Accepts JWT via Authorization header or ?token= query param."""
    r = await db.execute(
        select(InterviewSession).where(
            InterviewSession.id == session_id,
            InterviewSession.user_id == current_user.id,
        )
    )
    if not r.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Session not found")

    ar = await db.execute(
        select(InterviewAnswer).where(
            InterviewAnswer.session_id == session_id,
            InterviewAnswer.question_index == question_index,
        )
    )
    answer = ar.scalar_one_or_none()
    if not answer or not answer.video_url:
        raise HTTPException(status_code=404, detail="Video not found")

    if not os.path.exists(answer.video_url):
        raise HTTPException(status_code=404, detail="Video file is no longer available (server may have restarted)")

    return FileResponse(answer.video_url, media_type="video/webm")


@router.get("/{session_id}/status", response_model=AnalysisStatusOut)
async def analysis_status(
    session_id: str,
    current_user: User = Depends(get_current_user),
):
    data = get_status(session_id)
    return AnalysisStatusOut(
        session_id=session_id,
        status=data["status"],
        progress=data["progress"],
        current_step=data["current_step"],
    )
