from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.application import Application
from app.models.company import Company
from app.models.follow_up import FollowUp
from app.models.job import Job
from app.models.user import User
from app.schemas.follow_up import (
    FollowUpCreate,
    FollowUpResponse,
    FollowUpUpdate,
)

router = APIRouter(
    prefix="/api/follow-ups",
    tags=["Follow-ups"],
    dependencies=[Depends(get_current_user)],
)

VALID_STATUSES = {"pending", "completed"}
VALID_QUERY_STATUSES = {"pending", "completed", "overdue", "all"}


def is_follow_up_overdue(due_date: datetime, status: str, now: datetime | None = None) -> bool:
    if status != "pending":
        return False
    if now is None:
        now = datetime.now(timezone.utc)
    due = due_date if due_date.tzinfo is not None else due_date.replace(tzinfo=timezone.utc)
    return due < now


def build_follow_up_response(
    follow_up: FollowUp,
    application: Application,
    job: Job,
    company: Company,
    now: datetime | None = None,
) -> FollowUpResponse:
    response = FollowUpResponse.model_validate(follow_up)
    response.job_id = job.id
    response.job_title = job.title
    response.company_name = company.name
    response.application_status = application.status
    response.is_overdue = is_follow_up_overdue(follow_up.due_date, follow_up.status, now)
    return response


def get_user_application(
    application_id: int,
    current_user: User,
    db: Session,
) -> tuple[Application, Job, Company]:
    result = db.execute(
        select(Application, Job, Company)
        .join(Job, Application.job_id == Job.id)
        .join(Company, Job.company_id == Company.id)
        .where(
            Application.id == application_id,
            Application.user_id == current_user.id,
            Company.user_id == current_user.id,
        )
    ).first()

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found",
        )

    return result


@router.post(
    "/",
    response_model=FollowUpResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_follow_up(
    follow_up_data: FollowUpCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    application, job, company = get_user_application(
        follow_up_data.application_id,
        current_user,
        db,
    )

    if follow_up_data.status not in VALID_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status. Allowed statuses: {sorted(VALID_STATUSES)}",
        )

    # Normalize due_date to timezone-aware UTC if naive
    due_date = follow_up_data.due_date
    if due_date.tzinfo is None:
        due_date = due_date.replace(tzinfo=timezone.utc)

    follow_up = FollowUp(
        user_id=current_user.id,
        application_id=follow_up_data.application_id,
        title=follow_up_data.title.strip(),
        description=follow_up_data.description.strip() if follow_up_data.description else None,
        due_date=due_date,
        status=follow_up_data.status,
    )

    db.add(follow_up)
    db.commit()
    db.refresh(follow_up)

    return build_follow_up_response(
        follow_up,
        application,
        job,
        company,
    )


@router.get(
    "/",
    response_model=list[FollowUpResponse],
)
def get_follow_ups(
    status_filter: str | None = Query(None, alias="status"),
    application_id: int | None = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    now = datetime.now(timezone.utc)

    query = (
        select(FollowUp, Application, Job, Company)
        .join(Application, FollowUp.application_id == Application.id)
        .join(Job, Application.job_id == Job.id)
        .join(Company, Job.company_id == Company.id)
        .where(
            FollowUp.user_id == current_user.id,
            Application.user_id == current_user.id,
            Company.user_id == current_user.id,
        )
    )

    if application_id is not None:
        query = query.where(FollowUp.application_id == application_id)

    if status_filter:
        normalized_status = status_filter.strip().lower()
        if normalized_status not in VALID_QUERY_STATUSES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status filter. Allowed values: {sorted(VALID_QUERY_STATUSES)}",
            )

        if normalized_status == "overdue":
            query = query.where(
                FollowUp.status == "pending",
                FollowUp.due_date < now,
            )
        elif normalized_status == "pending":
            query = query.where(FollowUp.status == "pending")
        elif normalized_status == "completed":
            query = query.where(FollowUp.status == "completed")
        # 'all' does not add extra status filter

    query = query.order_by(FollowUp.due_date.asc())
    rows = db.execute(query).all()

    return [
        build_follow_up_response(follow_up, application, job, company, now)
        for follow_up, application, job, company in rows
    ]


@router.get(
    "/{follow_up_id}",
    response_model=FollowUpResponse,
)
def get_follow_up(
    follow_up_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    result = db.execute(
        select(FollowUp, Application, Job, Company)
        .join(Application, FollowUp.application_id == Application.id)
        .join(Job, Application.job_id == Job.id)
        .join(Company, Job.company_id == Company.id)
        .where(
            FollowUp.id == follow_up_id,
            FollowUp.user_id == current_user.id,
            Application.user_id == current_user.id,
            Company.user_id == current_user.id,
        )
    ).first()

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Follow-up not found",
        )

    follow_up, application, job, company = result
    return build_follow_up_response(follow_up, application, job, company)


@router.put(
    "/{follow_up_id}",
    response_model=FollowUpResponse,
)
def update_follow_up(
    follow_up_id: int,
    follow_up_data: FollowUpUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    follow_up = db.execute(
        select(FollowUp).where(
            FollowUp.id == follow_up_id,
            FollowUp.user_id == current_user.id,
        )
    ).scalar_one_or_none()

    if follow_up is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Follow-up not found",
        )

    update_dict = follow_up_data.model_dump(exclude_unset=True)

    if "status" in update_dict and update_dict["status"] is not None:
        if update_dict["status"] not in VALID_STATUSES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status. Allowed statuses: {sorted(VALID_STATUSES)}",
            )

    if "application_id" in update_dict and update_dict["application_id"] is not None:
        # Verify target application belongs to authenticated user
        get_user_application(update_dict["application_id"], current_user, db)

    if "due_date" in update_dict and update_dict["due_date"] is not None:
        due_date = update_dict["due_date"]
        if due_date.tzinfo is None:
            update_dict["due_date"] = due_date.replace(tzinfo=timezone.utc)

    if "title" in update_dict and update_dict["title"] is not None:
        update_dict["title"] = update_dict["title"].strip()

    if "description" in update_dict and update_dict["description"] is not None:
        update_dict["description"] = update_dict["description"].strip()

    for field, value in update_dict.items():
        setattr(follow_up, field, value)

    db.commit()
    db.refresh(follow_up)

    application, job, company = get_user_application(
        follow_up.application_id,
        current_user,
        db,
    )

    return build_follow_up_response(
        follow_up,
        application,
        job,
        company,
    )


@router.delete(
    "/{follow_up_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_follow_up(
    follow_up_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    follow_up = db.execute(
        select(FollowUp).where(
            FollowUp.id == follow_up_id,
            FollowUp.user_id == current_user.id,
        )
    ).scalar_one_or_none()

    if follow_up is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Follow-up not found",
        )

    db.delete(follow_up)
    db.commit()

    return None
