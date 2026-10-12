from datetime import datetime, timezone
from collections import defaultdict
from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.application import Application
from app.models.company import Company
from app.models.interview import Interview
from app.models.job import Job
from app.models.user import User
from app.schemas.analytics import (
    AnalyticsSummaryResponse,
    ActivityPoint,
    ConversionMetrics,
    InterviewOverview,
    JobSearchSummary,
    OverviewMetrics,
    PipelineStage,
    TopCompany,
)

router = APIRouter(
    prefix="/api/analytics",
    tags=["Analytics"],
    dependencies=[Depends(get_current_user)],
)

STATUS_LABELS = {
    "saved": "Not Started / Saved",
    "applied": "Applied",
    "screening": "Screening",
    "interview": "Interview",
    "offer": "Offered",
    "rejected": "Rejected",
    "withdrawn": "Withdrawn",
}

PIPELINE_ORDER = [
    "saved",
    "applied",
    "screening",
    "interview",
    "offer",
    "rejected",
    "withdrawn",
]


@router.get(
    "/summary",
    response_model=AnalyticsSummaryResponse,
)
def get_analytics_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_id = current_user.id
    now = datetime.now(timezone.utc)

    # ---------------------------------------------------------
    # 1. Total Applications & Status Counts
    # ---------------------------------------------------------
    app_status_counts = dict(
        db.execute(
            select(Application.status, func.count(Application.id))
            .where(Application.user_id == user_id)
            .group_by(Application.status)
        ).all()
    )

    total_applications = sum(app_status_counts.values())

    # ---------------------------------------------------------
    # 2. Total Interviews for this user
    # ---------------------------------------------------------
    total_interviews = (
        db.scalar(
            select(func.count(Interview.id))
            .join(Application, Interview.application_id == Application.id)
            .where(Application.user_id == user_id)
        )
        or 0
    )

    # ---------------------------------------------------------
    # 3. Offers
    # ---------------------------------------------------------
    total_offers = app_status_counts.get("offer", 0)

    # ---------------------------------------------------------
    # 4. Response Rate
    # Statuses indicating an employer response has been received:
    # "screening", "interview", "offer", "rejected"
    # ---------------------------------------------------------
    responded_statuses = {"screening", "interview", "offer", "rejected"}
    responded_count = sum(
        count for status, count in app_status_counts.items() if status in responded_statuses
    )

    response_rate = (
        round((responded_count / total_applications) * 100, 1)
        if total_applications > 0
        else 0.0
    )

    overview = OverviewMetrics(
        total_applications=total_applications,
        total_interviews=total_interviews,
        total_offers=total_offers,
        response_rate=response_rate,
    )

    # ---------------------------------------------------------
    # 5. Application Pipeline Stages
    # ---------------------------------------------------------
    pipeline_stages: list[PipelineStage] = []
    for st in PIPELINE_ORDER:
        cnt = app_status_counts.get(st, 0)
        pct = (
            round((cnt / total_applications) * 100, 1)
            if total_applications > 0
            else 0.0
        )
        pipeline_stages.append(
            PipelineStage(
                status=st,
                label=STATUS_LABELS.get(st, st.capitalize()),
                count=cnt,
                percentage=pct,
            )
        )

    # ---------------------------------------------------------
    # 6. Application Activity Over Time
    # Using applied_at (falling back to created_at)
    # ---------------------------------------------------------
    app_dates = db.execute(
        select(func.coalesce(Application.applied_at, Application.created_at))
        .where(Application.user_id == user_id)
        .order_by(func.coalesce(Application.applied_at, Application.created_at).asc())
    ).scalars().all()

    month_counts = defaultdict(int)
    for dt in app_dates:
        if dt is not None:
            # Format period as YYYY-MM
            period_key = dt.strftime("%Y-%m")
            month_counts[period_key] += 1

    activity_points: list[ActivityPoint] = []
    for period_key in sorted(month_counts.keys()):
        # Parse for human readable label e.g. "Sep 2026"
        try:
            parsed = datetime.strptime(period_key, "%Y-%m")
            label = parsed.strftime("%b %Y")
        except Exception:
            label = period_key
        activity_points.append(
            ActivityPoint(
                period=period_key,
                label=label,
                count=month_counts[period_key],
            )
        )

    # ---------------------------------------------------------
    # 7. Interview Overview
    # Upcoming: future date AND status NOT IN ('completed', 'cancelled')
    # Completed: status == 'completed'
    # Cancelled: status == 'cancelled'
    # ---------------------------------------------------------
    upcoming_interviews = (
        db.scalar(
            select(func.count(Interview.id))
            .join(Application, Interview.application_id == Application.id)
            .where(
                Application.user_id == user_id,
                Interview.interview_date >= now,
                Interview.status.not_in(["completed", "cancelled"]),
            )
        )
        or 0
    )

    completed_interviews = (
        db.scalar(
            select(func.count(Interview.id))
            .join(Application, Interview.application_id == Application.id)
            .where(
                Application.user_id == user_id,
                Interview.status == "completed",
            )
        )
        or 0
    )

    cancelled_interviews = (
        db.scalar(
            select(func.count(Interview.id))
            .join(Application, Interview.application_id == Application.id)
            .where(
                Application.user_id == user_id,
                Interview.status == "cancelled",
            )
        )
        or 0
    )

    interview_overview = InterviewOverview(
        upcoming=upcoming_interviews,
        completed=completed_interviews,
        cancelled=cancelled_interviews,
        total=total_interviews,
    )

    # ---------------------------------------------------------
    # 8. Top Companies
    # ---------------------------------------------------------
    top_comp_rows = db.execute(
        select(Company.id, Company.name, func.count(Application.id).label("app_count"))
        .join(Job, Application.job_id == Job.id)
        .join(Company, Job.company_id == Company.id)
        .where(
            Application.user_id == user_id,
            Company.user_id == user_id,
        )
        .group_by(Company.id, Company.name)
        .order_by(func.count(Application.id).desc(), Company.name.asc())
        .limit(10)
    ).all()

    top_companies: list[TopCompany] = []
    for comp_id, comp_name, app_count in top_comp_rows:
        pct = (
            round((app_count / total_applications) * 100, 1)
            if total_applications > 0
            else 0.0
        )
        top_companies.append(
            TopCompany(
                id=comp_id,
                name=comp_name,
                count=app_count,
                percentage=pct,
            )
        )

    # ---------------------------------------------------------
    # 9. Job Search Summary
    # ---------------------------------------------------------
    total_jobs = (
        db.scalar(
            select(func.count(Job.id))
            .join(Company, Job.company_id == Company.id)
            .where(Company.user_id == user_id)
        )
        or 0
    )
    total_companies = (
        db.scalar(
            select(func.count(Company.id)).where(Company.user_id == user_id)
        )
        or 0
    )

    job_search_summary = JobSearchSummary(
        total_jobs=total_jobs,
        total_companies=total_companies,
        user_applications=total_applications,
        user_interviews=total_interviews,
    )

    # ---------------------------------------------------------
    # 10. Conversion Metrics
    # Application -> Interview conversion rate: (interview apps + offers) / total apps
    # Interview -> Offer conversion rate: total offers / total interviews
    # Rejection rate: rejected apps / total apps
    # ---------------------------------------------------------
    interview_progressed = sum(
        app_status_counts.get(st, 0) for st in ["interview", "offer"]
    )
    app_to_interview_rate = (
        round((interview_progressed / total_applications) * 100, 1)
        if total_applications > 0
        else 0.0
    )
    interview_to_offer_rate = (
        round((total_offers / total_interviews) * 100, 1)
        if total_interviews > 0
        else 0.0
    )
    rejection_rate = (
        round((app_status_counts.get("rejected", 0) / total_applications) * 100, 1)
        if total_applications > 0
        else 0.0
    )

    conversion_metrics = ConversionMetrics(
        app_to_interview_rate=app_to_interview_rate,
        interview_to_offer_rate=interview_to_offer_rate,
        rejection_rate=rejection_rate,
    )

    return AnalyticsSummaryResponse(
        overview=overview,
        application_pipeline=pipeline_stages,
        application_activity=activity_points,
        interview_overview=interview_overview,
        top_companies=top_companies,
        job_search_summary=job_search_summary,
        conversion_metrics=conversion_metrics,
    )

