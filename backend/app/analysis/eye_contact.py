"""Eye-contact analysis using MediaPipe Face Mesh.

Samples one frame per second from the video.
For each frame, determines if the person is looking at the camera
by checking if iris landmarks are centred in the eye region.

Returns:
  eye_contact_pct      : float  (0.0 – 1.0)
  eye_contact_timeline : list[float]  (per-second score)
"""
import subprocess
import tempfile
import os


def _extract_frames(video_path: str, output_dir: str, fps: int = 1) -> list[str]:
    """Extract frames at given fps using FFmpeg."""
    pattern = os.path.join(output_dir, "frame_%04d.jpg")
    subprocess.run(
        ["ffmpeg", "-y", "-i", video_path, "-vf", f"fps={fps}", pattern],
        check=True,
        timeout=120,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    frames = sorted(
        os.path.join(output_dir, f)
        for f in os.listdir(output_dir)
        if f.startswith("frame_")
    )
    return frames


def _is_eye_contact(frame_path: str) -> bool:
    """Return True if the subject appears to be looking at the camera."""
    import cv2
    import mediapipe as mp

    mp_face_mesh = mp.solutions.face_mesh
    img = cv2.imread(frame_path)
    if img is None:
        return False

    h, w = img.shape[:2]
    with mp_face_mesh.FaceMesh(
        static_image_mode=True,
        max_num_faces=1,
        refine_landmarks=True,
    ) as mesh:
        rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        result = mesh.process(rgb)

    if not result.multi_face_landmarks:
        return False

    lms = result.multi_face_landmarks[0].landmark
    # Iris centre landmarks: 473 (left iris), 468 (right iris)
    # Eye corner landmarks: 263 (left outer), 362 (left inner)
    #                        33 (right outer),  133 (right inner)
    def _x(idx: int) -> float:
        return lms[idx].x

    left_iris_x  = _x(473)
    left_outer_x = _x(263)
    left_inner_x = _x(362)

    right_iris_x  = _x(468)
    right_outer_x = _x(33)
    right_inner_x = _x(133)

    def _centered(iris: float, outer: float, inner: float, tol: float = 0.35) -> bool:
        if outer == inner:
            return True
        ratio = (iris - min(outer, inner)) / abs(outer - inner)
        return abs(ratio - 0.5) < tol

    return _centered(left_iris_x, left_outer_x, left_inner_x) and \
           _centered(right_iris_x, right_outer_x, right_inner_x)


def analyze_eye_contact(video_path: str) -> dict:
    """Synchronous — run in executor from async code."""
    with tempfile.TemporaryDirectory() as tmp:
        try:
            frames = _extract_frames(video_path, tmp)
        except (subprocess.CalledProcessError, subprocess.TimeoutExpired):
            return {"eye_contact_pct": 0.5, "eye_contact_timeline": []}

        timeline: list[float] = []
        for frame in frames:
            try:
                score = 1.0 if _is_eye_contact(frame) else 0.0
            except Exception:
                score = 0.5
            timeline.append(score)

    pct = sum(timeline) / len(timeline) if timeline else 0.5
    return {
        "eye_contact_pct": round(pct, 3),
        "eye_contact_timeline": timeline,
    }
