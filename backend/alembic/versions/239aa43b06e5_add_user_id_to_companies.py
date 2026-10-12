"""add_user_id_to_companies

Revision ID: 239aa43b06e5
Revises: 7cbd33e3b3a1
Create Date: 2026-10-05 11:19:38.091542

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '239aa43b06e5'
down_revision: Union[str, Sequence[str], None] = '7cbd33e3b3a1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # 1. Add user_id column as nullable
    op.add_column('companies', sa.Column('user_id', sa.Integer(), nullable=True))

    # 2. Safely populate user_id for existing rows based on verified data ownership
    op.execute(
        sa.text(
            """
            UPDATE companies
            SET user_id = 1
            WHERE id = 1 AND user_id IS NULL;
            """
        )
    )
    op.execute(
        sa.text(
            """
            UPDATE companies
            SET user_id = 4
            WHERE id = 5 AND user_id IS NULL;
            """
        )
    )

    # 3. Create foreign key constraint to users.id
    op.create_foreign_key(
        'fk_companies_user_id_users',
        'companies',
        'users',
        ['user_id'],
        ['id'],
        ondelete='CASCADE',
    )

    # 4. Create index on companies.user_id
    op.create_index(
        op.f('ix_companies_user_id'),
        'companies',
        ['user_id'],
        unique=False,
    )

    # 5. Enforce NOT NULL on user_id
    op.alter_column('companies', 'user_id', nullable=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_companies_user_id'), table_name='companies')
    op.drop_constraint('fk_companies_user_id_users', 'companies', type_='foreignkey')
    op.drop_column('companies', 'user_id')

