"""
Dev launcher — starts backend (FastAPI) and frontend (Vite) together.

Usage:
    python dev.py

Ctrl+C stops both servers.
"""
import subprocess
import threading
import sys
import os
import signal

# ── Paths ─────────────────────────────────────────────────────────────────────
ROOT     = os.path.dirname(os.path.abspath(__file__))
BACKEND  = os.path.join(ROOT, "backend")
FRONTEND = os.path.join(ROOT, "frontend")

# Use the venv uvicorn on Windows; fall back to system uvicorn
UVICORN = (
    os.path.join(BACKEND, "venv", "Scripts", "uvicorn.exe")
    if os.path.exists(os.path.join(BACKEND, "venv", "Scripts", "uvicorn.exe"))
    else "uvicorn"
)

# ── ANSI colour helpers ───────────────────────────────────────────────────────
# Enable VT processing on Windows 10+
if sys.platform == "win32":
    import ctypes
    ctypes.windll.kernel32.SetConsoleMode(
        ctypes.windll.kernel32.GetStdHandle(-11), 7
    )

CYAN   = "\033[96m"
GREEN  = "\033[92m"
YELLOW = "\033[93m"
RESET  = "\033[0m"
BOLD   = "\033[1m"


def tag(label: str, colour: str) -> str:
    return f"{colour}{BOLD}[{label}]{RESET} "


def stream_output(proc: subprocess.Popen, label: str, colour: str) -> None:
    """Read a process's stdout/stderr and print with a coloured prefix."""
    prefix = tag(label, colour)
    for line in iter(proc.stdout.readline, b""):
        text = line.decode("utf-8", errors="replace").rstrip()
        print(f"{prefix}{text}", flush=True)


# ── Process registry ──────────────────────────────────────────────────────────
processes: list[subprocess.Popen] = []


def shutdown(*_) -> None:
    print(f"\n{YELLOW}Shutting down both servers...{RESET}")
    for p in processes:
        try:
            if sys.platform == "win32":
                p.terminate()
            else:
                os.killpg(os.getpgid(p.pid), signal.SIGTERM)
        except Exception:
            pass
    sys.exit(0)


signal.signal(signal.SIGINT,  shutdown)
signal.signal(signal.SIGTERM, shutdown)


def start_process(cmd: list[str], cwd: str) -> subprocess.Popen:
    kwargs: dict = dict(
        cwd    = cwd,
        stdout = subprocess.PIPE,
        stderr = subprocess.STDOUT,
    )
    if sys.platform != "win32":
        kwargs["start_new_session"] = True
    return subprocess.Popen(cmd, **kwargs)


# ── Main ──────────────────────────────────────────────────────────────────────
def main() -> None:
    print(f"\n{BOLD}Starting Elevra dev servers...{RESET}\n")

    # Backend
    backend_proc = start_process(
        [UVICORN, "app.main:app", "--reload", "--host", "0.0.0.0", "--port", "8000"],
        cwd=BACKEND,
    )
    processes.append(backend_proc)
    threading.Thread(
        target=stream_output, args=(backend_proc, "BACKEND", CYAN), daemon=True
    ).start()
    print(f"{tag('BACKEND', CYAN)}FastAPI  →  http://localhost:8000")

    # Frontend — npm.cmd on Windows, npm everywhere else
    npm = "npm.cmd" if sys.platform == "win32" else "npm"
    frontend_proc = start_process(
        [npm, "run", "dev"],
        cwd=FRONTEND,
    )
    processes.append(frontend_proc)
    threading.Thread(
        target=stream_output, args=(frontend_proc, "FRONTEND", GREEN), daemon=True
    ).start()
    print(f"{tag('FRONTEND', GREEN)}Vite     →  http://localhost:5173")

    print(f"\n{YELLOW}Press Ctrl+C to stop both servers.{RESET}\n")

    # Wait for either process to exit (crash / manual stop)
    while True:
        for p in processes:
            if p.poll() is not None:
                label = "BACKEND" if p is backend_proc else "FRONTEND"
                print(f"\n{YELLOW}{label} exited (code {p.returncode}). Stopping all.{RESET}")
                shutdown()
        threading.Event().wait(1)


if __name__ == "__main__":
    main()
