from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.company import Company
from app.schemas.company import CompanyCreate, CompanyResponse, CompanyUpdate

router = APIRouter(
    prefix="/api/companies",
    tags=["Companies"],
)


@router.post(
    "/",
    response_model=CompanyResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_company(
    company_data: CompanyCreate,
    db: Session = Depends(get_db),
):
    company = Company(
        name=company_data.name,
        website=str(company_data.website) if company_data.website else None,
        location=company_data.location,
    )

    db.add(company)
    db.commit()
    db.refresh(company)

    return company


@router.get(
    "/",
    response_model=list[CompanyResponse],
)
def get_companies(
    db: Session = Depends(get_db),
):
    result = db.execute(select(Company).order_by(Company.id.desc()))

    return result.scalars().all()


@router.get(
    "/{company_id}",
    response_model=CompanyResponse,
)
def get_company(
    company_id: int,
    db: Session = Depends(get_db),
):
    company = db.get(Company, company_id)

    if company is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found",
        )

    return company


@router.put(
    "/{company_id}",
    response_model=CompanyResponse,
)
def update_company(
    company_id: int,
    company_data: CompanyUpdate,
    db: Session = Depends(get_db),
):
    company = db.get(Company, company_id)

    if company is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found",
        )

    update_data = company_data.model_dump(exclude_unset=True)

    if "website" in update_data and update_data["website"] is not None:
        update_data["website"] = str(update_data["website"])

    for field, value in update_data.items():
        setattr(company, field, value)

    db.commit()
    db.refresh(company)

    return company


@router.delete(
    "/{company_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_company(
    company_id: int,
    db: Session = Depends(get_db),
):
    company = db.get(Company, company_id)

    if company is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found",
        )

    db.delete(company)
    db.commit()

    return None
