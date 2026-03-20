"""
Migration: adds new columns to resume_analyses and interview_answers,
and creates the user_profiles table.
Run once from the backend/ directory:

    python migrate.py
"""
import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from app.database import engine
from sqlalchemy import text


async def migrate():
    async with engine.begin() as conn:
        await conn.execute(text("""
            ALTER TABLE resume_analyses
              ADD COLUMN IF NOT EXISTS ats_score_breakdown JSONB DEFAULT '{}',
              ADD COLUMN IF NOT EXISTS score_mode VARCHAR(20) DEFAULT 'general';
        """))
        await conn.execute(text("""
            ALTER TABLE interview_answers
              ADD COLUMN IF NOT EXISTS model_answer_hint TEXT;
        """))
        await conn.execute(text("""
            ALTER TABLE resume_analyses
              ADD COLUMN IF NOT EXISTS resume_pdf BYTEA;
        """))
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS user_profiles (
                id               UUID  PRIMARY KEY,
                user_id          UUID  NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
                full_name        VARCHAR(255),
                email            VARCHAR(255),
                phone            VARCHAR(50),
                location         VARCHAR(255),
                linkedin_url     VARCHAR(500),
                github_url       VARCHAR(500),
                portfolio_url    VARCHAR(500),
                headline         VARCHAR(255),
                summary          TEXT,
                years_of_experience INTEGER DEFAULT 0,
                skills           JSONB  DEFAULT '[]',
                experience_raw   TEXT,
                education_raw    TEXT,
                certifications   JSONB  DEFAULT '[]',
                preferred_roles     JSONB  DEFAULT '[]',
                preferred_locations JSONB  DEFAULT '[]',
                last_resume_id   UUID REFERENCES resume_analyses(id) ON DELETE SET NULL,
                last_updated_at  TIMESTAMP DEFAULT NOW()
            );
        """))
    print("Migration complete.")


"""
Migration: adds new columns to resume_analyses and interview_answers,
and creates the user_profiles table.
Run once from the backend/ directory:

    python migrate.py
"""
import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from app.database import engine
from sqlalchemy import text


async def migrate():
    async with engine.begin() as conn:
        await conn.execute(text("""
            ALTER TABLE resume_analyses
              ADD COLUMN IF NOT EXISTS ats_score_breakdown JSONB DEFAULT '{}',
              ADD COLUMN IF NOT EXISTS score_mode VARCHAR(20) DEFAULT 'general';
        """))
        await conn.execute(text("""
            ALTER TABLE interview_answers
              ADD COLUMN IF NOT EXISTS model_answer_hint TEXT;
        """))
        await conn.execute(text("""
            ALTER TABLE resume_analyses
              ADD COLUMN IF NOT EXISTS resume_pdf BYTEA;
        """))
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS user_profiles (
                id               UUID  PRIMARY KEY,
                user_id          UUID  NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
                full_name        VARCHAR(255),
                email            VARCHAR(255),
                phone            VARCHAR(50),
                location         VARCHAR(255),
                linkedin_url     VARCHAR(500),
                github_url       VARCHAR(500),
                portfolio_url    VARCHAR(500),
                headline         VARCHAR(255),
                summary          TEXT,
                years_of_experience INTEGER DEFAULT 0,
                skills           JSONB  DEFAULT '[]',
                experience_raw   TEXT,
                education_raw    TEXT,
                certifications   JSONB  DEFAULT '[]',
                preferred_roles     JSONB  DEFAULT '[]',
                preferred_locations JSONB  DEFAULT '[]',
                last_resume_id   UUID REFERENCES resume_analyses(id) ON DELETE SET NULL,
                last_updated_at  TIMESTAMP DEFAULT NOW()
            );
        """))
        # ── Admin column (added in admin dashboard release) ────────────────────
        await conn.execute(text("""
            ALTER TABLE users
              ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;
        """))
    print("Migration complete.")


asyncio.run(migrate())
