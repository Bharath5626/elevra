"""Background analysis pipeline.

Steps:
  1. Download video blob from storage (or local temp path)
  2. speech.py  → transcript + WPM + filler count + speech clarity
  3. eye_contact.py → eye_contact_pct + timeline
  4. emotion.py → emotion_scores + confidence_score
  5. evaluator.py → Claude scoring + feedback timestamps
  6. scoring.py → compute final overall_score
  7. Persist InterviewAnswer, update session status + overall_score
"""
import asyncio
import os
import tempfile
import logging
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ..models import InterviewSession, InterviewAnswer
from ..analysis.speech import analyze_speech
from ..analysis.eye_contact import analyze_eye_contact
from ..analysis.emotion import analyze_emotion
from ..analysis.scoring import compute_answer_score
from .evaluator import evaluate_answer

logger = logging.getLogger(__name__)

# In-memory status store  {session_id: {status, progress, current_step}}
_status_store: dict[str, dict] = {}


def get_status(session_id: str) -> dict:
    return _status_store.get(
        session_id,
        {"status": "pending", "progress": 0, "current_step": "Waiting to start"},
    )


def _update_status(session_id: str, status: str, progress: int, step: str) -> None:
    _status_store[session_id] = {
        "status": status,
        "progress": progress,
        "current_step": step,
    }


async def run_analysis_pipeline(
    session_id: str,
    db: AsyncSession,
) -> None:
    """Full async pipeline for one interview session."""
    _update_status(session_id, "processing", 5, "Loading session")
    logger.info("Pipeline started for session %s", session_id)

    try:
        result = await db.execute(
            select(InterviewSession).where(InterviewSession.id == session_id)
        )
        session = result.scalar_one_or_none()
        if not session:
            _update_status(session_id, "failed", 0, "Session not found")
            return

        answers_result = await db.execute(
            select(InterviewAnswer)
            .where(InterviewAnswer.session_id == session_id)
            .order_by(InterviewAnswer.question_index)
        )
        answers = answers_result.scalars().all()

        if not answers:
            _update_status(session_id, "failed", 0, "No answers to process")
            return

        total = len(answers)
        session_scores: list[int] = []
        loop = asyncio.get_running_loop()  # fix: get_event_loop() deprecated in Py3.10+

        for idx, answer in enumerate(answers):
            base_progress = int((idx / total) * 90)
            q_text = answer.question_text or ""

            # ── Step: Speech ──────────────────────────────────────────
            _update_status(session_id, "processing", base_progress + 5, f"Q{idx+1}: Transcribing speech")
            speech_data = {"transcript": "", "wpm": 0.0, "filler_count": 0, "speech_clarity_score": 50}
            if answer.video_url:
                try:
                    speech_data = await loop.run_in_executor(None, analyze_speech, answer.video_url)
                except Exception as exc:
                    logger.warning("Q%d speech analysis failed: %s", idx + 1, exc)

            # ── Step: Eye Contact ────────────────────────────────────
            _update_status(session_id, "processing", base_progress + 30, f"Q{idx+1}: Analyzing eye contact")
            eye_data = {"eye_contact_pct": 0.5, "eye_contact_timeline": []}
            if answer.video_url:
                try:
                    eye_data = await loop.run_in_executor(None, analyze_eye_contact, answer.video_url)
                except Exception as exc:
                    logger.warning("Q%d eye contact analysis failed: %s", idx + 1, exc)

            # ── Step: Emotion ────────────────────────────────────────
            _update_status(session_id, "processing", base_progress + 55, f"Q{idx+1}: Detecting emotions")
            emotion_data = {"emotion_scores": {}, "confidence_score": 50}
            if answer.video_url:
                try:
                    emotion_data = await loop.run_in_executor(None, analyze_emotion, answer.video_url)
                except Exception as exc:
                    logger.warning("Q%d emotion analysis failed: %s", idx + 1, exc)

            # ── Step: AI Evaluation ──────────────────────────────────
            _update_status(session_id, "processing", base_progress + 75, f"Q{idx+1}: AI evaluation")
            eval_data: dict = {}
            transcript = speech_data.get("transcript", "")
            if not transcript.strip():
                # No usable transcript — skip API call entirely
                logger.warning("Q%d skipping AI evaluation: empty transcript", idx + 1)
                eval_data = {
                    "technical_score": 0, "structure_score": 0, "depth_score": 0,
                    "overall_score": 0, "star_format_used": False, "model_answer_hint": "",
                    "strengths": [],
                    "improvements": ["No speech was detected in the recording. Please ensure your microphone is working and re-record your answer."],
                    "feedback_timestamps": [],
                }
            else:
                try:
                    eval_data = await evaluate_answer(
                        question=q_text,
                        transcript=transcript,
                        role=session.job_role,
                        code_text=answer.code_text or "",
                    )
                except Exception as exc:
                    logger.warning("Q%d AI evaluation failed: %s", idx + 1, exc)
                    eval_data = {
                        "technical_score": 0, "structure_score": 0, "depth_score": 0,
                        "overall_score": 0, "star_format_used": False, "model_answer_hint": "",
                        "strengths": [],
                        "improvements": ["AI evaluation failed. Please check your API key or try re-triggering analysis."],
                        "feedback_timestamps": [],
                    }

            # ── Step: Scoring ────────────────────────────────────────
            code_correctness = eval_data.get("code_correctness_score")  # None if no code submitted
            final_score = compute_answer_score(
                technical_score=eval_data.get("technical_score", 50),
                structure_score=eval_data.get("structure_score", 50),
                depth_score=eval_data.get("depth_score", 50),
                eye_contact_pct=eye_data.get("eye_contact_pct", 0.5),
                confidence_score=emotion_data.get("confidence_score", 50),
                speech_clarity_score=speech_data.get("speech_clarity_score", 50),
                code_correctness_score=code_correctness,
            )
            logger.info("Q%d final score: %d", idx + 1, final_score)

            # ── Persist ───────────────────────────────────────────────
            answer.transcript           = transcript
            answer.wpm                  = speech_data.get("wpm", 0.0)
            answer.filler_count         = speech_data.get("filler_count", 0)
            answer.speech_clarity_score = speech_data.get("speech_clarity_score", 50)
            answer.eye_contact_pct      = eye_data.get("eye_contact_pct", 0.5)
            answer.eye_contact_timeline = eye_data.get("eye_contact_timeline", [])
            answer.emotion_scores       = emotion_data.get("emotion_scores", {})
            answer.confidence_score     = emotion_data.get("confidence_score", 50)
            answer.technical_score      = eval_data.get("technical_score", 50)
            answer.structure_score      = eval_data.get("structure_score", 50)
            answer.depth_score          = eval_data.get("depth_score", 50)
            answer.code_correctness_score = eval_data.get("code_correctness_score")  # None if not a coding question
            answer.overall_score        = final_score
            answer.strengths            = eval_data.get("strengths", [])
            answer.improvements         = eval_data.get("improvements", [])
            answer.model_answer_hint    = eval_data.get("model_answer_hint", "")
            answer.star_format_used     = eval_data.get("star_format_used", False)
            answer.feedback_timestamps  = eval_data.get("feedback_timestamps", [])

            session_scores.append(final_score)

        # ── Session level ─────────────────────────────────────────────
        session.overall_score = int(sum(session_scores) / len(session_scores)) if session_scores else 0
        session.status = "completed"
        await db.commit()

        _update_status(session_id, "completed", 100, "Analysis complete")
        logger.info("Pipeline completed for session %s — score: %d", session_id, session.overall_score)

    except Exception as exc:
        _update_status(session_id, "failed", 0, f"Error: {str(exc)}")
        logger.exception("Pipeline failed for session %s", session_id)
        await db.rollback()
        raise
