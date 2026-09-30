from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.application import Application
from app.models.company import Company
from app.models.interview import Interview
from app.models.job import Job
from app.models.user import User
from app.schemas.interview import (
    InterviewCreate,
    InterviewResponse,
    InterviewUpdate,
)

router = APIRouter(
    prefix="/api/interviews",
    tags=["Interviews"],
)


VALID_INTERVIEW_TYPES = {
    "technical",
    "hr",
    "behavioral",
    "screening",
    "final",
    "other",
}


VALID_INTERVIEW_STATUSES = {
    "scheduled",
    "completed",
    "cancelled",
    "rescheduled",
}


def build_interview_response(
    interview: Interview,
    application: Application,
    job: Job,
    company: Company,
) -> InterviewResponse:
    response = InterviewResponse.model_validate(interview)

    response.job_title = job.title
    response.company_name = company.name

    return response


def get_user_application(
    application_id: int,
    current_user: User,
    db: Session,
) -> Application:
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

    return application


@router.post(
    "/",
    response_model=InterviewResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_interview(
    interview_data: InterviewCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    application = get_user_application(
        interview_data.application_id,
        current_user,
        db,
    )

    if interview_data.interview_type not in VALID_INTERVIEW_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Invalid interview type. "
                f"Allowed types: {sorted(VALID_INTERVIEW_TYPES)}"
            ),
        )

    if interview_data.status not in VALID_INTERVIEW_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Invalid interview status. "
                f"Allowed statuses: {sorted(VALID_INTERVIEW_STATUSES)}"
            ),
        )

    interview = Interview(
        application_id=application.id,
        interview_date=interview_data.interview_date,
        interview_type=interview_data.interview_type,
        meeting_link=interview_data.meeting_link,
        notes=interview_data.notes,
        status=interview_data.status,
    )

    db.add(interview)
    db.commit()
    db.refresh(interview)

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

    return build_interview_response(
        interview,
        application,
        job,
        company,
    )


@router.get(
    "/",
    response_model=list[InterviewResponse],
)
def get_interviews(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    result = db.execute(
        select(Interview, Application, Job, Company)
        .join(
            Application,
            Interview.application_id == Application.id,
        )
        .join(
            Job,
            Application.job_id == Job.id,
        )
        .join(
            Company,
            Job.company_id == Company.id,
        )
        .where(Application.user_id == current_user.id)
        .order_by(Interview.interview_date.asc())
    )

    interviews = []

    for interview, application, job, company in result.all():
        interviews.append(
            build_interview_response(
                interview,
                application,
                job,
                company,
            )
        )

    return interviews


@router.get(
    "/{interview_id}",
    response_model=InterviewResponse,
)
def get_interview(
    interview_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    result = db.execute(
        select(Interview, Application, Job, Company)
        .join(
            Application,
            Interview.application_id == Application.id,
        )
        .join(
            Job,
            Application.job_id == Job.id,
        )
        .join(
            Company,
            Job.company_id == Company.id,
        )
        .where(
            Interview.id == interview_id,
            Application.user_id == current_user.id,
        )
    ).first()

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview not found",
        )

    interview, application, job, company = result

    return build_interview_response(
        interview,
        application,
        job,
        company,
    )


@router.put(
    "/{interview_id}",
    response_model=InterviewResponse,
)
def update_interview(
    interview_id: int,
    interview_data: InterviewUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    result = db.execute(
        select(Interview, Application)
        .join(
            Application,
            Interview.application_id == Application.id,
        )
        .where(
            Interview.id == interview_id,
            Application.user_id == current_user.id,
        )
    ).first()

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview not found",
        )

    interview, application = result

    update_data = interview_data.model_dump(exclude_unset=True)

    if "interview_type" in update_data:
        if update_data["interview_type"] not in VALID_INTERVIEW_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Invalid interview type. "
                    f"Allowed types: {sorted(VALID_INTERVIEW_TYPES)}"
                ),
            )

    if "status" in update_data:
        if update_data["status"] not in VALID_INTERVIEW_STATUSES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Invalid interview status. "
                    f"Allowed statuses: {sorted(VALID_INTERVIEW_STATUSES)}"
                ),
            )

    for field, value in update_data.items():
        setattr(interview, field, value)

    db.commit()
    db.refresh(interview)

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

    return build_interview_response(
        interview,
        application,
        job,
        company,
    )


@router.delete(
    "/{interview_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_interview(
    interview_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    result = db.execute(
        select(Interview, Application)
        .join(
            Application,
            Interview.application_id == Application.id,
        )
        .where(
            Interview.id == interview_id,
            Application.user_id == current_user.id,
        )
    ).first()

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview not found",
        )

    interview, _ = result

    db.delete(interview)
    db.commit()

    return None
