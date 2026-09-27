from fastapi import FastAPI

from app.database import engine
from app.routers.companies import router as companies_router
from app.routers.jobs import router as jobs_router
from app.routers.applications import router as applications_router
from app.routers.auth import router as auth_router

app = FastAPI(
    title="HireTrack AI API",
    description="Backend API for the HireTrack AI platform",
    version="1.0.0",
)


@app.get("/")
def root():
    return {
        "message": "HireTrack AI API is running",
        "status": "ok",
    }


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
    }


@app.get("/api/health/database")
def database_health():
    from sqlalchemy import text

    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))

        return {
            "database": "connected",
            "result": result.scalar(),
        }


app.include_router(companies_router)
app.include_router(jobs_router)
app.include_router(applications_router)
app.include_router(auth_router)
