"""Speech analysis using faster-whisper + local FFmpeg.

Returns:
  transcript           : str
  wpm                  : float
  filler_count         : int   (um, uh, like, you know, basically, literally)
  speech_clarity_score : int   (0-100, penalises bad WPM and high filler %)
"""
import re
import subprocess
import tempfile
import os


_FILLER_PATTERN = re.compile(
    r'\b(um|uh|like|you know|basically|literally|right|so|actually)\b',
    re.IGNORECASE,
)


def _extract_audio(video_path: str, output_wav: str) -> None:
    """Use FFmpeg to extract mono 16khz WAV from video."""
    subprocess.run(
        [
            "ffmpeg", "-y", "-i", video_path,
            "-vn", "-acodec", "pcm_s16le",
            "-ar", "16000", "-ac", "1",
            output_wav,
        ],
        check=True,
        timeout=120,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )


def analyze_speech(video_path: str) -> dict:
    """Synchronous (CPU-bound) — run in executor from async code."""
    from faster_whisper import WhisperModel

    with tempfile.TemporaryDirectory() as tmp:
        wav_path = os.path.join(tmp, "audio.wav")
        try:
            _extract_audio(video_path, wav_path)
        except (subprocess.CalledProcessError, subprocess.TimeoutExpired):
            return {
                "transcript": "",
                "wpm": 0.0,
                "filler_count": 0,
                "speech_clarity_score": 0,
            }

        model = WhisperModel("base", device="cpu", compute_type="int8")
        segments, info = model.transcribe(wav_path, beam_size=5, word_timestamps=True)

        words: list[dict] = []
        for seg in segments:
            for word in (seg.words or []):
                words.append({"word": word.word, "start": word.start, "end": word.end})

    transcript = " ".join(w["word"].strip() for w in words)

    # Discard transcripts that are almost certainly Whisper hallucinations:
    # fewer than 3 words almost always means silent/near-silent audio.
    _HALLUCINATIONS = {
        'you', 'you you', 'you.', 'thank you', 'thank you.', 'thanks',
        'thanks.', 'okay', 'ok', 'yeah', 'yes', 'no',
    }
    if len(words) < 3 or transcript.lower().strip('. ') in _HALLUCINATIONS:
        transcript = ""

    word_count = len(words)
    duration_seconds = words[-1]["end"] if words else 1
    wpm = (word_count / duration_seconds) * 60 if duration_seconds > 0 else 0.0

    fillers = _FILLER_PATTERN.findall(transcript)
    filler_count = len(fillers)
    filler_pct = filler_count / max(word_count, 1)

    # WPM score: ideal 120-150, penalise outside
    if 120 <= wpm <= 150:
        wpm_score = 100
    elif wpm < 90 or wpm > 180:
        wpm_score = 40
    else:
        wpm_score = 70

    # Filler score
    if filler_pct < 0.02:
        filler_score = 100
    elif filler_pct < 0.05:
        filler_score = 75
    elif filler_pct < 0.10:
        filler_score = 50
    else:
        filler_score = 25

    speech_clarity_score = int(0.6 * wpm_score + 0.4 * filler_score)

    return {
        "transcript": transcript,
        "wpm": round(wpm, 1),
        "filler_count": filler_count,
        "speech_clarity_score": speech_clarity_score,
    }
