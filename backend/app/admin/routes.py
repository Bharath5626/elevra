"""
admin/routes.py — Elevra Admin API

Endpoints:
  POST /admin/login          — trade ADMIN_SECRET for an admin JWT
  GET  /admin/stats          — snapshot stats for all modules
  GET  /admin/stats/stream   — SSE stream that pushes fresh stats every 5 s
  GET  /admin/users          — paginated user list with per-user module counts
  GET  /admin/users/{id}     — single user detail
  POST /admin/promote/{id}   — mark a user as admin (or demote)

All GET / POST /admin/promote/* require the admin JWT (is_admin=True).
"""

import asyncio
import json
from datetime import datetime, timedelta
from typing import AsyncGenerator

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..config import settings
from ..database import get_db
from ..models import (
    CRIScore,
    InterviewSession,
    JDAnalysis,
    JobApplication,
    LearningRoadmap,
    ResumeAnalysis,
    User,
    UserProfile,
)
from ..auth.jwt_handler import create_access_token, decode_token
from ..auth.password import hash_password, verify_password

router = APIRouter(prefix="/admin", tags=["admin"])


# ─── Admin JWT dependency ──────────────────────────────────────────────────────
from fastapi.security import OAuth2PasswordBearer as _OAuth2

_oauth2 = _OAuth2(tokenUrl="/admin/login", auto_error=False)


async def get_admin_user(
    header_token: str | None = Depends(_oauth2),
    query_token: str | None = Query(default=None, alias="token"),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Accepts token from Authorization header (normal requests) OR ?token= query
    param (EventSource / SSE which cannot set custom headers)."""
    raw = header_token or query_token
    if not raw:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    user_id = decode_token(raw)
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    result = await db.execute(select(User).where(User.id == user_id))
    user: User | None = result.scalar_one_or_none()
    if not user or not user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return user


# ─── Login ─────────────────────────────────────────────────────────────────────

from pydantic import BaseModel

class AdminLoginBody(BaseModel):
    email: str
    password: str


@router.post("/login")
async def admin_login(body: AdminLoginBody, db: AsyncSession = Depends(get_db)):
    """
    Log in as an admin user.
    The first admin must be promoted via the DB or the /admin/init endpoint below.
    """
    result = await db.execute(select(User).where(func.lower(User.email) == body.email.lower().strip()))
    user: User | None = result.scalar_one_or_none()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Not an admin account")
    token = create_access_token(user.id)
    return {"access_token": token, "token_type": "bearer", "name": user.name, "email": user.email}


@router.get("/init")
async def init_admin(
    secret: str = Query(..., description="Must equal ADMIN_SECRET from server config"),
    email: str = Query(...),
    password: str = Query(...),
    name: str = Query(default="Admin"),
    db: AsyncSession = Depends(get_db),
):
    """
    Bootstrap: create or promote an admin account.
    Call once from your browser:
      GET /admin/init?secret=YOUR_SECRET&email=you@example.com&password=yourpw
    """
    if secret != settings.ADMIN_SECRET:
        raise HTTPException(status_code=403, detail="Invalid admin secret")

    result = await db.execute(select(User).where(func.lower(User.email) == email.lower().strip()))
    user: User | None = result.scalar_one_or_none()

    if not user:
        user = User(
            email=email.lower().strip(),
            password_hash=hash_password(password),
            name=name,
            is_admin=True,
        )
        db.add(user)
    else:
        user.is_admin = True
        user.password_hash = hash_password(password)

    await db.flush()
    token = create_access_token(user.id)
    return {"access_token": token, "token_type": "bearer", "message": "Admin account ready — you can now log in at /admin/login"}


# ─── Stats helper ──────────────────────────────────────────────────────────────

async def _build_stats(db: AsyncSession) -> dict:
    now = datetime.utcnow()
    last_24h = now - timedelta(hours=24)
    last_7d  = now - timedelta(days=7)
    last_30d = now - timedelta(days=30)

    async def count(model, *, since=None):
        q = select(func.count()).select_from(model)
        if since is not None:
            time_col = getattr(model, "created_at", None) or getattr(model, "applied_at", None) or getattr(model, "recorded_at", None) or getattr(model, "generated_at", None)
            if time_col is not None:
                q = q.where(time_col >= since)
        result = await db.execute(q)
        return result.scalar() or 0

    # User counts
    total_users        = await count(User)
    users_last_24h     = await count(User, since=last_24h)
    users_last_7d      = await count(User, since=last_7d)
    users_last_30d     = await count(User, since=last_30d)

    # Resume
    total_resumes      = await count(ResumeAnalysis)
    resumes_last_24h   = await count(ResumeAnalysis, since=last_24h)
    resumes_last_7d    = await count(ResumeAnalysis, since=last_7d)

    avg_ats_q = await db.execute(select(func.avg(ResumeAnalysis.ats_score)))
    avg_ats   = round(float(avg_ats_q.scalar() or 0), 1)

    # Interview
    total_interviews   = await count(InterviewSession)
    interviews_last_24h= await count(InterviewSession, since=last_24h)
    interviews_last_7d = await count(InterviewSession, since=last_7d)
    completed_interviews_q = await db.execute(
        select(func.count()).select_from(InterviewSession).where(InterviewSession.status == "completed")
    )
    completed_interviews = completed_interviews_q.scalar() or 0

    # JD Analysis
    total_jd           = await count(JDAnalysis)
    jd_last_24h        = await count(JDAnalysis, since=last_24h)

    # Roadmaps
    total_roadmaps     = await count(LearningRoadmap)
    roadmaps_last_7d   = await count(LearningRoadmap, since=last_7d)

    # Job Applications
    total_applications = await count(JobApplication)
    apps_last_7d       = await count(JobApplication, since=last_7d)

    # CRI
    total_cri          = await count(CRIScore)
    avg_cri_q          = await db.execute(select(func.avg(CRIScore.cri_total)))
    avg_cri            = round(float(avg_cri_q.scalar() or 0), 1)

    # Profiles filled
    total_profiles     = await count(UserProfile)

    return {
        "generated_at": now.isoformat(),
        "users": {
            "total": total_users,
            "last_24h": users_last_24h,
            "last_7d": users_last_7d,
            "last_30d": users_last_30d,
        },
        "resume": {
            "total": total_resumes,
            "last_24h": resumes_last_24h,
            "last_7d": resumes_last_7d,
            "avg_ats_score": avg_ats,
        },
        "interview": {
            "total": total_interviews,
            "completed": completed_interviews,
            "last_24h": interviews_last_24h,
            "last_7d": interviews_last_7d,
        },
        "jd_analysis": {
            "total": total_jd,
            "last_24h": jd_last_24h,
        },
        "roadmap": {
            "total": total_roadmaps,
            "last_7d": roadmaps_last_7d,
        },
        "job_applications": {
            "total": total_applications,
            "last_7d": apps_last_7d,
        },
        "cri": {
            "total": total_cri,
            "avg_score": avg_cri,
        },
        "profiles": {
            "total": total_profiles,
        },
    }


# ─── Stats snapshot ────────────────────────────────────────────────────────────

@router.get("/stats")
async def get_stats(
    _admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    return await _build_stats(db)


# ─── SSE live stream ────────────────────────────────────────────────────────────

@router.get("/stats/stream")
async def stats_stream(
    _admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
    interval: int = Query(default=5, ge=3, le=60, description="Push interval in seconds"),
):
    """Server-Sent Events endpoint. Pushes fresh stats every `interval` seconds."""

    async def event_generator() -> AsyncGenerator[str, None]:
        while True:
            try:
                stats = await _build_stats(db)
                yield f"data: {json.dumps(stats)}\n\n"
            except Exception as exc:
                yield f"data: {json.dumps({'error': str(exc)})}\n\n"
            await asyncio.sleep(interval)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


# ─── User list ─────────────────────────────────────────────────────────────────

@router.get("/users")
async def list_users(
    _admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    search: str = Query(default=""),
):
    offset = (page - 1) * page_size

    q = select(User).order_by(User.created_at.desc())
    count_q = select(func.count()).select_from(User)
    if search.strip():
        pattern = f"%{search.strip()}%"
        q       = q.where((User.email.ilike(pattern)) | (User.name.ilike(pattern)))
        count_q = count_q.where((User.email.ilike(pattern)) | (User.name.ilike(pattern)))

    total_r = await db.execute(count_q)
    total   = total_r.scalar() or 0

    users_r = await db.execute(q.offset(offset).limit(page_size))
    users   = users_r.scalars().all()

    # Batch-count each user's activity
    user_ids = [u.id for u in users]

    async def batch_count(model, fk_col):
        if not user_ids:
            return {}
        r = await db.execute(
            select(fk_col, func.count())
            .where(fk_col.in_(user_ids))
            .group_by(fk_col)
        )
        return {row[0]: row[1] for row in r.fetchall()}

    resume_counts  = await batch_count(ResumeAnalysis, ResumeAnalysis.user_id)
    interview_counts = await batch_count(InterviewSession, InterviewSession.user_id)
    jd_counts      = await batch_count(JDAnalysis, JDAnalysis.user_id)
    app_counts     = await batch_count(JobApplication, JobApplication.user_id)
    roadmap_counts = await batch_count(LearningRoadmap, LearningRoadmap.user_id)

    rows = []
    for u in users:
        rows.append({
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "is_admin": u.is_admin,
            "is_blocked": u.is_blocked,
            "created_at": u.created_at.isoformat(),
            "resume_count":    resume_counts.get(u.id, 0),
            "interview_count": interview_counts.get(u.id, 0),
            "jd_count":        jd_counts.get(u.id, 0),
            "application_count": app_counts.get(u.id, 0),
            "roadmap_count":   roadmap_counts.get(u.id, 0),
        })

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "users": rows,
    }


# ─── Single user detail ────────────────────────────────────────────────────────

@router.get("/users/{user_id}")
async def get_user_detail(
    user_id: str,
    _admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user: User | None = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    resumes_r = await db.execute(
        select(ResumeAnalysis.id, ResumeAnalysis.filename, ResumeAnalysis.ats_score, ResumeAnalysis.created_at)
        .where(ResumeAnalysis.user_id == user_id)
        .order_by(ResumeAnalysis.created_at.desc())
        .limit(10)
    )
    resumes = [{"id": r[0], "filename": r[1], "ats_score": r[2], "created_at": r[3].isoformat()} for r in resumes_r.fetchall()]

    sessions_r = await db.execute(
        select(InterviewSession.id, InterviewSession.job_role, InterviewSession.status, InterviewSession.overall_score, InterviewSession.created_at)
        .where(InterviewSession.user_id == user_id)
        .order_by(InterviewSession.created_at.desc())
        .limit(10)
    )
    sessions = [{"id": s[0], "job_role": s[1], "status": s[2], "overall_score": s[3], "created_at": s[4].isoformat()} for s in sessions_r.fetchall()]

    apps_r = await db.execute(
        select(JobApplication.job_title, JobApplication.company, JobApplication.status, JobApplication.applied_at)
        .where(JobApplication.user_id == user_id)
        .order_by(JobApplication.applied_at.desc())
        .limit(10)
    )
    applications = [{"job_title": a[0], "company": a[1], "status": a[2], "applied_at": a[3].isoformat()} for a in apps_r.fetchall()]

    cri_r = await db.execute(
        select(CRIScore.cri_total, CRIScore.percentile, CRIScore.recorded_at)
        .where(CRIScore.user_id == user_id)
        .order_by(CRIScore.recorded_at.desc())
        .limit(1)
    )
    cri_row = cri_r.fetchone()
    cri = {"cri_total": cri_row[0], "percentile": cri_row[1], "recorded_at": cri_row[2].isoformat()} if cri_row else None

    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "is_admin": user.is_admin,
        "is_blocked": user.is_blocked,
        "created_at": user.created_at.isoformat(),
        "resumes": resumes,
        "interview_sessions": sessions,
        "job_applications": applications,
        "cri": cri,
    }


# ─── Promote / demote admin ────────────────────────────────────────────────────

@router.post("/promote/{user_id}")
async def promote_user(
    user_id: str,
    is_admin: bool = Query(default=True),
    _admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user: User | None = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_admin = is_admin
    await db.flush()
    return {"id": user.id, "email": user.email, "is_admin": user.is_admin, "is_blocked": user.is_blocked}


# ─── Block / unblock user ───────────────────────────────────────────────────────────

@router.post("/block/{user_id}")
async def block_user(
    user_id: str,
    blocked: bool = Query(default=True),
    _admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user: User | None = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.is_admin:
        raise HTTPException(status_code=403, detail="Cannot block an admin account")
    user.is_blocked = blocked
    await db.flush()
    return {"id": user.id, "email": user.email, "is_blocked": user.is_blocked, "is_admin": user.is_admin}


# ─── Delete user ────────────────────────────────────────────────────────────────────

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    _admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user: User | None = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.is_admin:
        raise HTTPException(status_code=403, detail="Cannot delete an admin account")
    await db.delete(user)
    await db.flush()
    return {"detail": "User deleted successfully", "id": user_id}
