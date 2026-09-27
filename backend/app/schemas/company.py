from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, HttpUrl


class CompanyBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    website: HttpUrl | None = None
    location: str | None = Field(default=None, max_length=150)


class CompanyCreate(CompanyBase):
    pass


class CompanyUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=150)
    website: HttpUrl | None = None
    location: str | None = Field(default=None, max_length=150)


class CompanyResponse(CompanyBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
