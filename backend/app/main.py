import logging
import logging.handlers
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import settings
from .database import init_db, engine
from .auth import router as auth_router
from .resume import router as resume_router
from .jd import router as jd_router
from .interview import router as interview_router
from .roadmap import router as roadmap_router
from .cri import router as cri_router
from .jobs import router as jobs_router
from .profile import router as profile_router
from .admin import router as admin_router

# ── Logging setup ─────────────────────────────────────────────────────────────
_LOG_DIR = Path(__file__).resolve().parents[2] / "logs"
_LOG_DIR.mkdir(exist_ok=True)
_LOG_FILE = _LOG_DIR / "backend.log"

_fmt = logging.Formatter(
    fmt="%(asctime)s [%(levelname)s] %(name)s  %(pathname)s:%(lineno)d\n  %(message)s\n",
    datefmt="%Y-%m-%d %H:%M:%S",
)

# Rotating: 5 MB per file, keep 5 backups
_file_handler = logging.handlers.RotatingFileHandler(
    _LOG_FILE, maxBytes=5 * 1024 * 1024, backupCount=5, encoding="utf-8"
)
_file_handler.setLevel(logging.WARNING)
_file_handler.setFormatter(_fmt)

# Also log INFO+ to console
_console_handler = logging.StreamHandler()
_console_handler.setLevel(logging.INFO)
_console_handler.setFormatter(_fmt)

logging.basicConfig(level=logging.INFO, handlers=[_file_handler, _console_handler])
logger = logging.getLogger("elevra")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables on startup (dev mode — use Alembic in production)
    try:
        await init_db()
        logger.info("Database initialised successfully.")
    except Exception as e:
        logger.warning("DB init skipped — could not connect: %s. Start PostgreSQL and restart.", e)
    yield
    await engine.dispose()


app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description="Elevra — AI-powered career development platform: Resume Intelligence, Mock Interview Coach, Career Readiness Index.",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_origin_regex=r"http://localhost:\d+",  # allow any localhost port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth_router)
app.include_router(resume_router)
app.include_router(jd_router)
app.include_router(interview_router)
app.include_router(roadmap_router)
app.include_router(cri_router)
app.include_router(jobs_router)
app.include_router(profile_router)
app.include_router(admin_router)


# ── Global exception handler ──────────────────────────────────────────────────
@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.error(
        "Unhandled exception on %s %s",
        request.method,
        request.url,
        exc_info=exc,   # writes file name + line number via traceback
    )
    response = JSONResponse(
        status_code=500,
        content={"detail": "Internal server error. Check logs/backend.log for details."},
    )
    # CORSMiddleware does not wrap exception handler responses — add headers manually
    origin = request.headers.get("origin")
    if origin:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
    return response


@app.get("/health", tags=["health"])
async def health():
    return {"status": "ok", "app": settings.APP_NAME}
