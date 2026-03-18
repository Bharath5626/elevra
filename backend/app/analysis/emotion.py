"""Emotion analysis using DeepFace.

Samples one frame every 2 seconds.
Maps dominant emotion distribution to a confidence score:
  confidence_score = (happy + neutral) % of total detections × 100

Returns:
  emotion_scores : dict  {happy, neutral, sad, angry, surprise, fear, disgust}
  confidence_score : int  (0-100)
"""
import subprocess
import tempfile
import os


def _extract_frames(video_path: str, output_dir: str, fps: float = 0.5) -> list[str]:
    pattern = os.path.join(output_dir, "frame_%04d.jpg")
    subprocess.run(
        ["ffmpeg", "-y", "-i", video_path, "-vf", f"fps={fps}", pattern],
        check=True,
        timeout=120,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    return sorted(
        os.path.join(output_dir, f)
        for f in os.listdir(output_dir)
        if f.startswith("frame_")
    )


def analyze_emotion(video_path: str) -> dict:
    """Synchronous — run in executor from async code."""
    from deepface import DeepFace

    emotion_totals: dict[str, float] = {
        "happy": 0, "neutral": 0, "sad": 0,
        "angry": 0, "surprise": 0, "fear": 0, "disgust": 0,
    }
    detected = 0

    with tempfile.TemporaryDirectory() as tmp:
        try:
            frames = _extract_frames(video_path, tmp)
        except (subprocess.CalledProcessError, subprocess.TimeoutExpired):
            return {"emotion_scores": emotion_totals, "confidence_score": 50}

        for frame in frames:
            try:
                result = DeepFace.analyze(
                    img_path=frame,
                    actions=["emotion"],
                    enforce_detection=False,
                    silent=True,
                )
                emotions = result[0]["emotion"] if isinstance(result, list) else result["emotion"]
                for k in emotion_totals:
                    emotion_totals[k] += emotions.get(k, 0)
                detected += 1
            except Exception:
                continue

    if detected > 0:
        emotion_scores = {k: round(v / detected, 2) for k, v in emotion_totals.items()}
    else:
        emotion_scores = {k: 0.0 for k in emotion_totals}

    total_pct = sum(emotion_scores.values()) or 1
    positive_pct = (
        emotion_scores.get("happy", 0) + emotion_scores.get("neutral", 0)
    ) / total_pct
    confidence_score = int(positive_pct * 100)

    return {
        "emotion_scores": emotion_scores,
        "confidence_score": confidence_score,
    }
