"""initial_schema

Revision ID: 1b1721ad0f48
Revises: 
Create Date: 2026-03-22 15:01:15.071599

NOTE: This revision is a no-op marker for databases that already exist
(created via migrate.py / create_all). New deployments should apply this
revision which will be a clean autogenerate from a fresh DB.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '1b1721ad0f48'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # No-op: schema already exists on databases created before Alembic was added.
    pass


def downgrade() -> None:
    pass

    op.alter_column('resume_analyses', 'ats_score_breakdown',
               existing_type=sa.JSON(),
               type_=postgresql.JSONB(astext_type=sa.Text()),
               existing_nullable=True,
               existing_server_default=sa.text("'{}'::jsonb"))
    # ### end Alembic commands ###
