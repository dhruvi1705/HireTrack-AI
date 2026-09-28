from fastapi import APIRouter, Depends
from sqlalchemy import func, select

from app.database import get_db
from app.dependencies import get_current_user
from app.models.application import Application
from app.models.company import Company
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
    # Application counts
    # -----------------------------------------

    total_applications = (
        db.scalar(
            select(func.count(Application.id)).where(
                Application.user_id == current_user.id
            )
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
        .where(Application.user_id == current_user.id)
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

    return {
        "user": {
            "id": current_user.id,
            "full_name": current_user.full_name,
            "email": current_user.email,
        },
        "stats": {
            "applications": total_applications,
            "interviews": interview_count,
            "offers": offer_count,
        },
        "pipeline": pipeline,
        "recent_applications": recent_applications,
        "upcoming_interviews": [],
    }
