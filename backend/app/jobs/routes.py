import logging
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import httpx

from ..config import settings
from ..database import get_db
from ..models import User, ResumeAnalysis, JobApplication
from ..auth.jwt_handler import get_current_user
from ..ai_client import call_ai
from .schemas import (
    JobListingOut, MatchScoreRequest, MatchScoreOut,
    CoverLetterRequest, CoverLetterOut,
    ApplyRequest, JobApplicationOut, StatusUpdate,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/jobs", tags=["jobs"])

_JSEARCH_URL = "https://jsearch.p.rapidapi.com/search"


# ── GET /jobs/search ──────────────────────────────────────────────────────────
@router.get("/search", response_model=list[JobListingOut])
async def search_jobs(
    query: str = Query(..., min_length=2),
    location: str = Query(default=""),
    remote_only: bool = Query(default=False),
    page: int = Query(default=1, ge=1),
    current_user: User = Depends(get_current_user),
):
    api_key = settings.RAPIDAPI_KEY
    if not api_key:
        raise HTTPException(status_code=503, detail="Job search API key not configured")

    search_query = query
    if location:
        search_query += f" in {location}"

    params = {
        "query": search_query,
        "page": str(page),
        "num_pages": "1",
        "date_posted": "all",
    }
    if remote_only:
        params["remote_jobs_only"] = "true"

    headers = {
        "X-RapidAPI-Key": api_key,
        "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.get(_JSEARCH_URL, params=params, headers=headers)

    if resp.status_code != 200:
        logger.warning("JSearch API error %s: %s", resp.status_code, resp.text[:300])
        raise HTTPException(status_code=502, detail="Job search API returned an error")

    data = resp.json().get("data", [])

    results: list[JobListingOut] = []
    for job in data:
        salary_min = job.get("job_min_salary")
        salary_max = job.get("job_max_salary")
        salary_range = None
        if salary_min and salary_max:
            salary_range = f"${int(salary_min):,} – ${int(salary_max):,}"
        elif salary_min:
            salary_range = f"From ${int(salary_min):,}"
        elif salary_max:
            salary_range = f"Up to ${int(salary_max):,}"

        results.append(JobListingOut(
            job_id=job.get("job_id", ""),
            job_title=job.get("job_title", ""),
            company=job.get("employer_name", ""),
            location=job.get("job_city", job.get("job_country", "Remote")),
            description=job.get("job_description", "")[:3000],
            apply_url=job.get("job_apply_link") or job.get("job_google_link", ""),
            salary_range=salary_range,
            posted_date=job.get("job_posted_at_datetime_utc", ""),
            employer_logo=job.get("employer_logo"),
            is_remote=job.get("job_is_remote", False),
        ))

    return results


# ── POST /jobs/match-score ────────────────────────────────────────────────────
@router.post("/match-score", response_model=MatchScoreOut)
async def get_match_score(
    body: MatchScoreRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    resume = await db.get(ResumeAnalysis, body.resume_analysis_id)
    if not resume or resume.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Resume analysis not found")

    # Extract skills from resume breakdown
    resume_skills: set[str] = set()
    if resume.ats_score_breakdown and isinstance(resume.ats_score_breakdown, dict):
        for skill in resume.ats_score_breakdown.get("skills_found", []):
            resume_skills.add(skill.lower())

    # Also pull from raw text — simple keyword extraction
    raw_lower = (resume.raw_text or "").lower()

    # Extract required keywords from job description
    jd_lower = body.job_description.lower()

    # Use skill extractor logic — match resume skills against JD text
    matching = []
    missing = []
    for skill in resume_skills:
        if skill in jd_lower:
            matching.append(skill)

    # Quick keyword extraction from JD for common tech terms
    from ..resume.skill_extractor import extract_skills
    jd_skills = extract_skills(body.job_description)
    for skill in jd_skills:
        sl = skill.lower()
        if sl in raw_lower or sl in resume_skills:
            if sl not in [m.lower() for m in matching]:
                matching.append(skill)
        else:
            missing.append(skill)

    # Score: ratio of matched skills
    total = len(matching) + len(missing)
    if total == 0:
        score = 50  # neutral score if no skills detected
    else:
        score = int((len(matching) / total) * 100)

    # Blend with ATS score if available
    if resume.ats_score:
        score = int(score * 0.6 + resume.ats_score * 0.4)

    score = max(0, min(100, score))

    return MatchScoreOut(
        match_score=score,
        matching_skills=matching[:20],
        missing_skills=missing[:20],
    )


# ── POST /jobs/generate-cover-letter ─────────────────────────────────────────
@router.post("/generate-cover-letter", response_model=CoverLetterOut)
async def generate_cover_letter(
    body: CoverLetterRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    resume = await db.get(ResumeAnalysis, body.resume_analysis_id)
    if not resume or resume.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Resume analysis not found")

    resume_text = (resume.raw_text or "")[:4000]

    system_prompt = (
        "You are an expert career coach. Write a professional, compelling cover letter. "
        "Be concise (250-350 words). Use a warm but professional tone. "
        "Highlight relevant experience from the resume that matches the job. "
        "Do NOT make up experience — only reference what's in the resume. "
        "Return ONLY the cover letter text, no JSON wrapping, no subject line."
    )

    user_prompt = (
        f"Write a cover letter for this position:\n\n"
        f"Job Title: {body.job_title}\n"
        f"Company: {body.company}\n"
        f"Job Description:\n{body.job_description[:2000]}\n\n"
        f"Candidate's Resume:\n{resume_text}\n\n"
        f"Candidate Name: {current_user.name}"
    )

    letter = await call_ai(system_prompt, user_prompt, max_tokens=1500)
    return CoverLetterOut(cover_letter=letter.strip())


# ── POST /jobs/apply ──────────────────────────────────────────────────────────
@router.post("/apply", response_model=JobApplicationOut, status_code=201)
async def save_application(
    body: ApplyRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    application = JobApplication(
        user_id=current_user.id,
        resume_analysis_id=body.resume_analysis_id,
        job_id=body.job_id,
        job_title=body.job_title,
        company=body.company,
        location=body.location,
        apply_url=body.apply_url,
        job_description=body.job_description[:5000],
        salary_range=body.salary_range,
        employer_logo=body.employer_logo,
        match_score=body.match_score,
        cover_letter=body.cover_letter,
        status="applied",
    )
    db.add(application)
    await db.commit()
    await db.refresh(application)
    return application


# ── GET /jobs/applications ────────────────────────────────────────────────────
@router.get("/applications", response_model=list[JobApplicationOut])
async def list_applications(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(JobApplication)
        .where(JobApplication.user_id == current_user.id)
        .order_by(JobApplication.applied_at.desc())
    )
    return result.scalars().all()


# ── PATCH /jobs/applications/{id} ────────────────────────────────────────────
@router.patch("/applications/{application_id}", response_model=JobApplicationOut)
async def update_application_status(
    application_id: str,
    body: StatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    valid = {"applied", "interviewing", "offer", "rejected"}
    if body.status not in valid:
        raise HTTPException(status_code=400, detail=f"Status must be one of: {', '.join(valid)}")

    app = await db.get(JobApplication, application_id)
    if not app or app.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Application not found")

    app.status = body.status
    await db.commit()
    await db.refresh(app)
    return app


# ── DELETE /jobs/applications/{id} ───────────────────────────────────────────
@router.delete("/applications/{application_id}", status_code=204)
async def delete_application(
    application_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    app = await db.get(JobApplication, application_id)
    if not app or app.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Application not found")

    await db.delete(app)
    await db.commit()
