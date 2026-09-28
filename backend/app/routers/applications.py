from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.application import Application
from app.models.company import Company
from app.models.job import Job
from app.models.user import User
from app.schemas.application import (
    ApplicationCreate,
    ApplicationResponse,
    ApplicationUpdate,
)

router = APIRouter(
    prefix="/api/applications",
    tags=["Applications"],
)


VALID_STATUSES = {
    "saved",
    "applied",
    "screening",
    "interview",
    "offer",
    "rejected",
    "withdrawn",
}


def build_application_response(
    application: Application,
    job: Job,
    company: Company,
) -> ApplicationResponse:
    response = ApplicationResponse.model_validate(application)

    response.job_title = job.title
    response.company_name = company.name

    return response


@router.post(
    "/",
    response_model=ApplicationResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_application(
    application_data: ApplicationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    job = db.get(Job, application_data.job_id)

    if job is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found",
        )

    company = db.get(Company, job.company_id)

    if company is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found",
        )

    if application_data.status not in VALID_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Invalid application status. "
                f"Allowed statuses: {sorted(VALID_STATUSES)}"
            ),
        )

    application = Application(
        user_id=current_user.id,
        job_id=application_data.job_id,
        status=application_data.status,
        applied_at=application_data.applied_at,
        notes=application_data.notes,
    )

    db.add(application)
    db.commit()
    db.refresh(application)

    return build_application_response(
        application,
        job,
        company,
    )


@router.get(
    "/",
    response_model=list[ApplicationResponse],
)
def get_applications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    result = db.execute(
        select(Application, Job, Company)
        .join(
            Job,
            Application.job_id == Job.id,
        )
        .join(
            Company,
            Job.company_id == Company.id,
        )
        .where(Application.user_id == current_user.id)
        .order_by(Application.id.desc())
    )

    applications = []

    for application, job, company in result.all():
        applications.append(
            build_application_response(
                application,
                job,
                company,
            )
        )

    return applications


@router.get(
    "/{application_id}",
    response_model=ApplicationResponse,
)
def get_application(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    result = db.execute(
        select(Application, Job, Company)
        .join(
            Job,
            Application.job_id == Job.id,
        )
        .join(
            Company,
            Job.company_id == Company.id,
        )
        .where(
            Application.id == application_id,
            Application.user_id == current_user.id,
        )
    ).first()

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found",
        )

    application, job, company = result

    return build_application_response(
        application,
        job,
        company,
    )


@router.put(
    "/{application_id}",
    response_model=ApplicationResponse,
)
def update_application(
    application_id: int,
    application_data: ApplicationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    application = db.execute(
        select(Application).where(
            Application.id == application_id,
            Application.user_id == current_user.id,
        )
    ).scalar_one_or_none()

    if application is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found",
        )

    update_data = application_data.model_dump(exclude_unset=True)

    if "status" in update_data:
        if update_data["status"] not in VALID_STATUSES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Invalid application status. "
                    f"Allowed statuses: {sorted(VALID_STATUSES)}"
                ),
            )

    for field, value in update_data.items():
        setattr(application, field, value)

    db.commit()
    db.refresh(application)

    job = db.get(Job, application.job_id)

    if job is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found",
        )

    company = db.get(Company, job.company_id)

    if company is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found",
        )

    return build_application_response(
        application,
        job,
        company,
    )


@router.delete(
    "/{application_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_application(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    application = db.execute(
        select(Application).where(
            Application.id == application_id,
            Application.user_id == current_user.id,
        )
    ).scalar_one_or_none()

    if application is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found",
        )

    db.delete(application)
    db.commit()

    return None
