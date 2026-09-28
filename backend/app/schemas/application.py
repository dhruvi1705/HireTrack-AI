from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ApplicationCreate(BaseModel):
    job_id: int = Field(..., gt=0)
    status: str = Field(default="saved", min_length=2, max_length=50)
    applied_at: datetime | None = None
    notes: str | None = None


class ApplicationUpdate(BaseModel):
    status: str | None = Field(
        default=None,
        min_length=2,
        max_length=50,
    )
    applied_at: datetime | None = None
    notes: str | None = None


class ApplicationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    job_id: int

    job_title: str | None = None
    company_name: str | None = None

    status: str
    applied_at: datetime | None
    notes: str | None

    created_at: datetime
    updated_at: datetime
