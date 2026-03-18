"""
inspect_resume_data.py
----------------------
Quick read-only inspector — shows everything stored in the DB
after a resume is uploaded through the ATS analyzer.

Run from backend/ directory:
    python inspect_resume_data.py
    python inspect_resume_data.py --email user@example.com   # filter by user
    python inspect_resume_data.py --latest                   # latest upload only
"""
import asyncio
import sys
import os
import json
import argparse
from datetime import datetime

sys.path.insert(0, os.path.dirname(__file__))

from sqlalchemy import text
from app.database import engine

# ─── ANSI colors (works on Windows 10+ / modern terminals) ────────────────────
GRN  = "\033[92m"
YLW  = "\033[93m"
BLU  = "\033[94m"
CYN  = "\033[96m"
RED  = "\033[91m"
RST  = "\033[0m"
BOLD = "\033[1m"

def hdr(title: str):
    print(f"\n{BOLD}{BLU}{'─'*60}{RST}")
    print(f"{BOLD}{BLU}  {title}{RST}")
    print(f"{BOLD}{BLU}{'─'*60}{RST}")

def row(label: str, value):
    if value is None or value == "" or value == [] or value == {}:
        print(f"  {YLW}{label:<28}{RST} {RED}(empty){RST}")
    else:
        if isinstance(value, (dict, list)):
            value = json.dumps(value, ensure_ascii=False, indent=4)
            # indent continuation lines
            value = value.replace("\n", "\n" + " "*30)
        print(f"  {CYN}{label:<28}{RST} {GRN}{value}{RST}")


async def inspect(filter_email: str | None = None, latest_only: bool = False):
    async with engine.connect() as conn:

        # ── 1. Users ──────────────────────────────────────────────────────────
        hdr("TABLE: users")
        q = "SELECT id, email, name, created_at FROM users ORDER BY created_at DESC"
        if filter_email:
            q = f"SELECT id, email, name, created_at FROM users WHERE email = :e ORDER BY created_at DESC"
            result = await conn.execute(text(q), {"e": filter_email})
        else:
            result = await conn.execute(text(q))
        users = result.fetchall()
        if not users:
            print(f"  {RED}No users found.{RST}")
            return

        user_ids = []
        for u in users:
            user_ids.append(str(u.id))
            print(f"\n  {BOLD}User:{RST}")
            row("id",         u.id)
            row("email",      u.email)
            row("name",       u.name)
            row("created_at", u.created_at)

        # ── 2. resume_analyses ────────────────────────────────────────────────
        hdr("TABLE: resume_analyses")
        placeholders = ", ".join(f":uid{i}" for i in range(len(user_ids)))
        params       = {f"uid{i}": uid for i, uid in enumerate(user_ids)}

        limit_clause = "LIMIT 1" if latest_only else ""
        q = f"""
            SELECT id, user_id, version_number, filename, score_mode,
                   ats_score, ats_score_breakdown,
                   keyword_gaps, weak_bullets, improved_bullets,
                   section_feedback, bias_flags, overall_suggestion,
                   LENGTH(raw_text) AS raw_text_len,
                   LEFT(raw_text, 300) AS raw_text_preview,
                   created_at
            FROM resume_analyses
            WHERE user_id IN ({placeholders})
            ORDER BY created_at DESC
            {limit_clause}
        """
        result = await conn.execute(text(q), params)
        analyses = result.fetchall()

        if not analyses:
            print(f"  {RED}No resume analyses found yet. Upload a resume first.{RST}")
        else:
            for a in analyses:
                print(f"\n  {BOLD}Resume Analysis record:{RST}")
                row("id",                  a.id)
                row("user_id",             a.user_id)
                row("filename",            a.filename)
                row("version_number",      a.version_number)
                row("score_mode",          a.score_mode)
                row("ats_score",           a.ats_score)
                row("ats_score_breakdown", a.ats_score_breakdown)
                row("keyword_gaps",        a.keyword_gaps)
                row("weak_bullets",        a.weak_bullets)
                row("improved_bullets",    a.improved_bullets)
                row("section_feedback",    a.section_feedback)
                row("bias_flags",          a.bias_flags)
                row("overall_suggestion",  a.overall_suggestion)
                row("raw_text length",     f"{a.raw_text_len} characters")
                row("raw_text (preview)",  a.raw_text_preview)
                row("created_at",          a.created_at)

        # ── 3. user_profiles ──────────────────────────────────────────────────
        hdr("TABLE: user_profiles")
        # table may not exist yet if migration hasn't been run
        try:
            q = f"""
                SELECT * FROM user_profiles
                WHERE user_id IN ({placeholders})
                ORDER BY last_updated_at DESC
            """
            result = await conn.execute(text(q), params)
            profiles = result.fetchall()
            cols = result.keys()

            if not profiles:
                print(f"  {RED}No profile rows yet.{RST}")
                print(f"  {YLW}Tip: run 'python migrate.py' then upload a resume.{RST}")
            else:
                for p in profiles:
                    print(f"\n  {BOLD}UserProfile record:{RST}")
                    for col, val in zip(cols, p):
                        row(col, val)
        except Exception as e:
            if "does not exist" in str(e).lower():
                print(f"  {RED}user_profiles table not found.{RST}")
                print(f"  {YLW}Run: python migrate.py{RST}")
            else:
                print(f"  {RED}Error querying user_profiles: {e}{RST}")

        # ── 4. quick summary ──────────────────────────────────────────────────
        hdr("SUMMARY")
        try:
            r2 = await conn.execute(text(
                f"SELECT COUNT(*) FROM resume_analyses WHERE user_id IN ({placeholders})",
                params
            ))
        except Exception:
            r2 = None

        print(f"  Users found:           {BOLD}{len(users)}{RST}")
        print(f"  Resume analyses found: {BOLD}{len(analyses)}{RST}")
        print(f"\n  {GRN}Database:{RST}  postgresql @ localhost:5432/careerai")
        print(f"  {GRN}Tables:{RST}    users, resume_analyses, user_profiles")
        print()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Inspect stored resume data")
    parser.add_argument("--email",  help="Filter by user email")
    parser.add_argument("--latest", action="store_true", help="Show only the most recent upload")
    args = parser.parse_args()

    asyncio.run(inspect(filter_email=args.email, latest_only=args.latest))
