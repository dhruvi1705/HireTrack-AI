from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class FollowUpCreate(BaseModel):
    application_id: int = Field(..., gt=0)
    title: str = Field(..., min_length=1, max_length=200)
    description: str | None = None
    due_date: datetime
    status: str = Field(default="pending", min_length=2, max_length=20)


class FollowUpUpdate(BaseModel):
    application_id: int | None = Field(default=None, gt=0)
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    due_date: datetime | None = None
    status: str | None = Field(default=None, min_length=2, max_length=20)


class FollowUpResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    application_id: int
    user_id: int
    title: str
    description: str | None = None
    due_date: datetime
    status: str
    created_at: datetime
    updated_at: datetime

    # Application, Job, and Company info
    job_id: int | None = None
    job_title: str | None = None
    company_name: str | None = None
    application_status: str | None = None

    # Derived field
    is_overdue: bool = False
