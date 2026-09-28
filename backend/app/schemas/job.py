from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class JobBase(BaseModel):
    company_id: int = Field(..., gt=0)
    title: str = Field(..., min_length=2, max_length=200)
    description: str | None = None
    location: str | None = Field(default=None, max_length=150)
    employment_type: str | None = Field(default=None, max_length=50)
    salary_min: int | None = Field(default=None, ge=0)
    salary_max: int | None = Field(default=None, ge=0)


class JobCreate(JobBase):
    pass


class JobUpdate(BaseModel):
    company_id: int | None = Field(default=None, gt=0)
    title: str | None = Field(default=None, min_length=2, max_length=200)
    description: str | None = None
    location: str | None = Field(default=None, max_length=150)
    employment_type: str | None = Field(default=None, max_length=50)
    salary_min: int | None = Field(default=None, ge=0)
    salary_max: int | None = Field(default=None, ge=0)


class JobResponse(JobBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    company_name: str | None = None
