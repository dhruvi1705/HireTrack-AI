from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class InterviewCreate(BaseModel):
    application_id: int = Field(..., gt=0)
    interview_date: datetime
    interview_type: str = Field(default="technical", min_length=2, max_length=50)
    meeting_link: str | None = Field(default=None, max_length=500)
    notes: str | None = None
    status: str = Field(default="scheduled", min_length=2, max_length=30)


class InterviewUpdate(BaseModel):
    interview_date: datetime | None = None
    interview_type: str | None = Field(
        default=None,
        min_length=2,
        max_length=50,
    )
    meeting_link: str | None = Field(default=None, max_length=500)
    notes: str | None = None
    status: str | None = Field(
        default=None,
        min_length=2,
        max_length=30,
    )


class InterviewResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    application_id: int
    interview_date: datetime
    interview_type: str
    meeting_link: str | None
    notes: str | None
    status: str

    job_title: str | None = None
    company_name: str | None = None

    created_at: datetime
    updated_at: datetime
