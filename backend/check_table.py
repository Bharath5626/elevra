import asyncio, sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))
from app.database import init_db

async def migrate():
    await init_db()
    print("SUCCESS: init_db completed — all tables synced")

asyncio.run(migrate())
