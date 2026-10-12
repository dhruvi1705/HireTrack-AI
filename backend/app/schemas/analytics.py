from pydantic import BaseModel, ConfigDict


class OverviewMetrics(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    total_applications: int
    total_interviews: int
    total_offers: int
    response_rate: float


class PipelineStage(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    status: str
    label: str
    count: int
    percentage: float


class ActivityPoint(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    period: str
    label: str
    count: int


class InterviewOverview(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    upcoming: int
    completed: int
    cancelled: int
    total: int


class TopCompany(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    count: int
    percentage: float


class JobSearchSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    total_jobs: int
    total_companies: int
    user_applications: int
    user_interviews: int


class ConversionMetrics(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    app_to_interview_rate: float
    interview_to_offer_rate: float
    rejection_rate: float


class AnalyticsSummaryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    overview: OverviewMetrics
    application_pipeline: list[PipelineStage]
    application_activity: list[ActivityPoint]
    interview_overview: InterviewOverview
    top_companies: list[TopCompany]
    job_search_summary: JobSearchSummary
    conversion_metrics: ConversionMetrics

