"""
create_admin.py — Create or promote an admin account directly in the database.

Usage (run from career-ai-studio/backend/):
    python create_admin.py --email admin@example.com --password yourpassword
    python create_admin.py --email admin@example.com --password yourpassword --name "Admin"
"""
import asyncio
import argparse
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from app.database import engine
from app.models import User
from app.auth.password import hash_password
from app.auth.jwt_handler import create_access_token
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import sessionmaker


AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def create_admin(email: str, password: str, name: str):
    async with AsyncSessionLocal() as db:
        async with db.begin():
            result = await db.execute(select(User).where(User.email == email))
            user: User | None = result.scalar_one_or_none()

            if user:
                user.is_admin = True
                user.password_hash = hash_password(password)
                print(f"[✓] Promoted existing user '{email}' to admin.")
            else:
                user = User(
                    email=email,
                    password_hash=hash_password(password),
                    name=name,
                    is_admin=True,
                )
                db.add(user)
                print(f"[✓] Created new admin account '{email}'.")

        # Refresh to get the id
        await db.refresh(user)
        token = create_access_token(user.id)
        print(f"\n    Email   : {user.email}")
        print(f"    Name    : {user.name}")
        print(f"    Token   : {token[:40]}…")
        print(f"\n    Log in at: http://localhost:5173/admin/login\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Create or promote an Elevra admin account.")
    parser.add_argument("--email",    required=True,  help="Admin email address")
    parser.add_argument("--password", required=True,  help="Admin password")
    parser.add_argument("--name",     default="Admin", help="Display name (default: Admin)")
    args = parser.parse_args()

    asyncio.run(create_admin(args.email, args.password, args.name))
