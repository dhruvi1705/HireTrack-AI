from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.company import Company
from app.models.job import Job
from app.schemas.job import JobCreate, JobResponse, JobUpdate

router = APIRouter(
    prefix="/api/jobs",
    tags=["Jobs"],
)


@router.post(
    "/",
    response_model=JobResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_job(
    job_data: JobCreate,
    db: Session = Depends(get_db),
):
    company = db.get(Company, job_data.company_id)

    if company is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found",
        )

    if (
        job_data.salary_min is not None
        and job_data.salary_max is not None
        and job_data.salary_min > job_data.salary_max
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Minimum salary cannot be greater than maximum salary",
        )

    job = Job(
        company_id=job_data.company_id,
        title=job_data.title,
        description=job_data.description,
        location=job_data.location,
        employment_type=job_data.employment_type,
        salary_min=job_data.salary_min,
        salary_max=job_data.salary_max,
    )

    db.add(job)
    db.commit()
    db.refresh(job)

    return job


@router.get(
    "/",
    response_model=list[JobResponse],
)
def get_jobs(
    db: Session = Depends(get_db),
):
    result = db.execute(
        select(Job, Company)
        .join(
            Company,
            Job.company_id == Company.id,
        )
        .order_by(Job.id.desc())
    )

    jobs = []

    for job, company in result.all():
        job_data = JobResponse.model_validate(job)

        job_data.company_name = company.name

        jobs.append(job_data)

    return jobs


@router.get(
    "/{job_id}",
    response_model=JobResponse,
)
def get_job(
    job_id: int,
    db: Session = Depends(get_db),
):
    result = db.execute(
        select(Job, Company)
        .join(
            Company,
            Job.company_id == Company.id,
        )
        .where(Job.id == job_id)
    ).first()

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found",
        )

    job, company = result

    job_data = JobResponse.model_validate(job)

    job_data.company_name = company.name

    return job_data


@router.put(
    "/{job_id}",
    response_model=JobResponse,
)
def update_job(
    job_id: int,
    job_data: JobUpdate,
    db: Session = Depends(get_db),
):
    job = db.get(Job, job_id)

    if job is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found",
        )

    update_data = job_data.model_dump(exclude_unset=True)

    if "company_id" in update_data:
        company = db.get(
            Company,
            update_data["company_id"],
        )

        if company is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Company not found",
            )

    new_salary_min = update_data.get(
        "salary_min",
        job.salary_min,
    )

    new_salary_max = update_data.get(
        "salary_max",
        job.salary_max,
    )

    if (
        new_salary_min is not None
        and new_salary_max is not None
        and new_salary_min > new_salary_max
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Minimum salary cannot be greater than maximum salary",
        )

    for field, value in update_data.items():
        setattr(job, field, value)

    db.commit()
    db.refresh(job)

    company = db.get(
        Company,
        job.company_id,
    )

    job_response = JobResponse.model_validate(job)

    if company:
        job_response.company_name = company.name

    return job_response


@router.delete(
    "/{job_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_job(
    job_id: int,
    db: Session = Depends(get_db),
):
    job = db.get(Job, job_id)

    if job is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found",
        )

    db.delete(job)
    db.commit()

    return None
