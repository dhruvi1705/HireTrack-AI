from pydantic import BaseModel, Field


class ResumeAnalyzeRequest(BaseModel):
    resume_text: str = Field(..., min_length=20, max_length=50000)


class ResumeAnalyzeResponse(BaseModel):
    skills: list[str]
    detected_sections: list[str]
    missing_sections: list[str]
    improvement_areas: list[str]
    resume_score: int
    word_count: int
    provider_configured: bool
    provider_note: str
    extracted_text: str | None = None


class JobMatchRequest(BaseModel):
    job_id: int | None = None
    resume_text: str = Field(..., min_length=20, max_length=50000)
    job_title: str | None = None
    job_description: str | None = None


class JobMatchResponse(BaseModel):
    job_title: str
    match_percentage: int
    matched_skills: list[str]
    missing_skills: list[str]
    keywords: list[str]
    improvement_suggestions: list[str]
    provider_configured: bool
    provider_note: str


class InterviewQuestionsRequest(BaseModel):
    job_id: int | None = None
    interview_id: int | None = None
    job_title: str | None = None
    job_description: str | None = None
    interview_type: str = Field(default="technical")


class InterviewQuestionsResponse(BaseModel):
    role: str
    interview_type: str
    questions_by_category: dict[str, list[str]]
    provider_configured: bool
    provider_note: str


class CoverLetterRequest(BaseModel):
    job_id: int | None = None
    job_title: str | None = None
    job_description: str | None = None
    company_name: str | None = None
    resume_text: str | None = None


class CoverLetterResponse(BaseModel):
    cover_letter: str
    job_title: str
    company_name: str
    provider_configured: bool
    provider_note: str


class AiProviderStatusResponse(BaseModel):
    provider_configured: bool
    status_label: str
    banner_message: str
    model: str | None = None
