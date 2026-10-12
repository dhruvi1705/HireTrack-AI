from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy import func, select

from app.database import get_db
from app.dependencies import get_current_user
from app.models.application import Application
from app.models.company import Company
from app.models.interview import Interview
from app.models.follow_up import FollowUp
from app.models.job import Job
from app.models.user import User


router = APIRouter(
    prefix="/api/dashboard",
    tags=["Dashboard"],
)


@router.get("/summary")
def get_dashboard_summary(
    db=Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # -----------------------------------------
    # Application & Resource counts
    # -----------------------------------------

    total_applications = (
        db.scalar(
            select(func.count(Application.id)).where(
                Application.user_id == current_user.id
            )
        )
        or 0
    )

    total_jobs = (
        db.scalar(
            select(func.count(Job.id))
            .join(Company, Job.company_id == Company.id)
            .where(Company.user_id == current_user.id)
        )
        or 0
    )

    total_companies = (
        db.scalar(
            select(func.count(Company.id))
            .where(Company.user_id == current_user.id)
        )
        or 0
    )

    interview_count = (
        db.scalar(
            select(func.count(Application.id)).where(
                Application.user_id == current_user.id,
                Application.status == "interview",
            )
        )
        or 0
    )

    offer_count = (
        db.scalar(
            select(func.count(Application.id)).where(
                Application.user_id == current_user.id,
                Application.status == "offer",
            )
        )
        or 0
    )

    follow_up_count = (
        db.scalar(
            select(func.count(FollowUp.id)).where(
                FollowUp.user_id == current_user.id,
                FollowUp.status == "pending",
            )
        )
        or 0
    )


    # -----------------------------------------
    # Pipeline counts
    # -----------------------------------------

    statuses = [
        "saved",
        "applied",
        "screening",
        "interview",
        "offer",
    ]

    pipeline = {}

    for status in statuses:
        count = (
            db.scalar(
                select(func.count(Application.id)).where(
                    Application.user_id == current_user.id,
                    Application.status == status,
                )
            )
            or 0
        )

        pipeline[status] = count

    # -----------------------------------------
    # Recent applications
    # -----------------------------------------

    rows = db.execute(
        select(Application, Job, Company)
        .join(Job, Application.job_id == Job.id)
        .join(Company, Job.company_id == Company.id)
        .where(
            Application.user_id == current_user.id,
            Company.user_id == current_user.id,
        )
        .order_by(Application.created_at.desc())
        .limit(10)
    ).all()

    recent_applications = []

    for application, job, company in rows:
        recent_applications.append(
            {
                "id": application.id,
                "job_id": job.id,
                "company_id": company.id,
                "company": company.name,
                "role": job.title,
                "status": application.status,
                "applied_at": application.applied_at,
                "created_at": application.created_at,
            }
        )

    # -----------------------------------------
    # Upcoming interviews (Real database data)
    # -----------------------------------------

    now = datetime.now(timezone.utc)
    interview_rows = db.execute(
        select(Interview, Application, Job, Company)
        .join(Application, Interview.application_id == Application.id)
        .join(Job, Application.job_id == Job.id)
        .join(Company, Job.company_id == Company.id)
        .where(
            Application.user_id == current_user.id,
            Company.user_id == current_user.id,
            Interview.interview_date >= now,
            Interview.status.not_in(["completed", "cancelled"]),
        )
        .order_by(Interview.interview_date.asc())
        .limit(5)
    ).all()

    upcoming_interviews = []
    for interview, application, job, company in interview_rows:
        upcoming_interviews.append(
            {
                "id": interview.id,
                "application_id": application.id,
                "company": company.name,
                "role": job.title,
                "interview_date": interview.interview_date,
                "interview_type": interview.interview_type,
                "meeting_link": interview.meeting_link,
                "status": interview.status,
            }
        )

    # -----------------------------------------
    # Upcoming follow-ups (Real database data)
    # -----------------------------------------

    follow_up_rows = db.execute(
        select(FollowUp, Application, Job, Company)
        .join(Application, FollowUp.application_id == Application.id)
        .join(Job, Application.job_id == Job.id)
        .join(Company, Job.company_id == Company.id)
        .where(
            FollowUp.user_id == current_user.id,
            Application.user_id == current_user.id,
            Company.user_id == current_user.id,
            FollowUp.status == "pending",
        )
        .order_by(FollowUp.due_date.asc())
        .limit(5)
    ).all()

    upcoming_follow_ups = []
    for follow_up, application, job, company in follow_up_rows:
        due = follow_up.due_date if follow_up.due_date.tzinfo else follow_up.due_date.replace(tzinfo=timezone.utc)
        upcoming_follow_ups.append(
            {
                "id": follow_up.id,
                "application_id": application.id,
                "title": follow_up.title,
                "description": follow_up.description,
                "due_date": follow_up.due_date,
                "status": follow_up.status,
                "company": company.name,
                "role": job.title,
                "is_overdue": due < now,
            }
        )

    return {
        "user": {
            "id": current_user.id,
            "full_name": current_user.full_name,
            "email": current_user.email,
        },
        "stats": {
            "applications": total_applications,
            "jobs": total_jobs,
            "companies": total_companies,
            "interviews": interview_count,
            "offers": offer_count,
            "follow_ups": follow_up_count,
        },
        "pipeline": pipeline,
        "recent_applications": recent_applications,
        "upcoming_interviews": upcoming_interviews,
        "upcoming_follow_ups": upcoming_follow_ups,
    }


