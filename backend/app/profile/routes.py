import base64
import logging
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ..database import get_db
from ..models import User, UserProfile, ResumeAnalysis
from ..schemas import UserProfileOut, UserProfileUpdate
from ..auth.jwt_handler import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/profile", tags=["profile"])


@router.get("/me", response_model=UserProfileOut)
async def get_my_profile(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return the current user's enriched profile."""
    result = await db.execute(
        select(UserProfile).where(UserProfile.user_id == current_user.id)
    )
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(
            status_code=404,
            detail="Profile not found. Upload a resume to auto-generate your profile.",
        )
    return profile


@router.patch("/me", response_model=UserProfileOut)
async def update_my_profile(
    body: UserProfileUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Manually update profile fields.
    Auto-extracted fields (skills, experience_raw, etc.) are NOT writable here
    to prevent accidental overwrite — they are refreshed on each resume upload.
    """
    result = await db.execute(
        select(UserProfile).where(UserProfile.user_id == current_user.id)
    )
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(
            status_code=404,
            detail="Profile not found. Upload a resume first to create your profile.",
        )

    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(profile, key, value)

    await db.flush()
    return profile


@router.get("/apply-kit")
async def get_apply_kit(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return all data the Chrome extension needs to auto-fill job application forms."""
    profile_r = await db.execute(
        select(UserProfile).where(UserProfile.user_id == current_user.id)
    )
    profile = profile_r.scalar_one_or_none()

    resume_r = await db.execute(
        select(ResumeAnalysis)
        .where(ResumeAnalysis.user_id == current_user.id)
        .order_by(ResumeAnalysis.created_at.desc())
        .limit(1)
    )
    resume = resume_r.scalar_one_or_none()

    full_name = (profile.full_name if profile else None) or current_user.name or ""
    parts      = full_name.strip().split(" ", 1)
    first_name = parts[0]
    last_name  = parts[1] if len(parts) > 1 else ""

    resume_b64 = None
    if resume and resume.resume_pdf:
        resume_b64 = base64.b64encode(resume.resume_pdf).decode("utf-8")

    return {
        "firstName":        first_name,
        "lastName":         last_name,
        "fullName":         full_name,
        "email":            (profile.email if profile else None) or current_user.email,
        "phone":            profile.phone if profile else None,
        "location":         profile.location if profile else None,
        "linkedin":         profile.linkedin_url if profile else None,
        "github":           profile.github_url if profile else None,
        "portfolio":        profile.portfolio_url if profile else None,
        "headline":         profile.headline if profile else None,
        "resumeBase64":     resume_b64,
        "resumeFilename":   resume.filename if resume else None,
        "resumeAnalysisId": resume.id if resume else None,
        "latestAtsScore":   resume.ats_score if resume else None,
        "skills":           (profile.skills if profile else None) or [],
    }
