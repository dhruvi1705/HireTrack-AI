"""add interviews table

Revision ID: 7cbd33e3b3a1
Revises: 6cddd2512e9b
Create Date: 2026-09-29 14:59:29.860233

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "7cbd33e3b3a1"
down_revision: Union[str, Sequence[str], None] = "6cddd2512e9b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create interviews table."""

    op.create_table(
        "interviews",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column(
            "application_id",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "interview_date",
            sa.DateTime(timezone=True),
            nullable=False,
        ),
        sa.Column(
            "interview_type",
            sa.String(length=50),
            nullable=False,
        ),
        sa.Column(
            "meeting_link",
            sa.String(length=500),
            nullable=True,
        ),
        sa.Column(
            "notes",
            sa.Text(),
            nullable=True,
        ),
        sa.Column(
            "status",
            sa.String(length=30),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["application_id"],
            ["applications.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(
        op.f("ix_interviews_id"),
        "interviews",
        ["id"],
        unique=False,
    )

    op.create_index(
        op.f("ix_interviews_application_id"),
        "interviews",
        ["application_id"],
        unique=False,
    )

    op.create_index(
        op.f("ix_interviews_interview_date"),
        "interviews",
        ["interview_date"],
        unique=False,
    )


def downgrade() -> None:
    """Drop interviews table."""

    op.drop_index(
        op.f("ix_interviews_interview_date"),
        table_name="interviews",
    )

    op.drop_index(
        op.f("ix_interviews_application_id"),
        table_name="interviews",
    )

    op.drop_index(
        op.f("ix_interviews_id"),
        table_name="interviews",
    )

    op.drop_table("interviews")
