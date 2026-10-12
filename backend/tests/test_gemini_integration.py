import io
import uuid
import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from app.main import app
from app.database import settings
from app.services.gemini_service import gemini_service
from tests.test_resume_pdf import generate_valid_pdf_bytes

client = TestClient(app)


def register_user_and_login(prefix: str):
    uid = uuid.uuid4().hex[:8]
    email = f"{prefix}_{uid}@example.com"
    pwd = "TestPassword123!"
    client.post("/api/auth/register", json={"full_name": f"{prefix.title()} User", "email": email, "password": pwd})
    res = client.post("/api/auth/login", json={"email": email, "password": pwd})
    token = res.json()["access_token"]
    return email, token, {"Authorization": f"Bearer {token}"}


@pytest.fixture
def user_a():
    return register_user_and_login("user_a")


@pytest.fixture
def user_b():
    return register_user_and_login("user_b")


def test_ai_status_endpoint(user_a):
    _, _, headers = user_a
    res = client.get("/api/ai/status", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "provider_configured" in data
    assert "status_label" in data
    assert "banner_message" in data
    # Ensure no secret key is exposed in the response
    assert "gemini_api_key" not in data
    assert settings.gemini_api_key not in str(data)
    if gemini_service.is_configured():
        assert data["provider_configured"] is True
        assert data["status_label"] == "Gemini Enhanced Mode"
        assert data["banner_message"] == "Enhanced AI analysis active"
    else:
        assert data["provider_configured"] is False
        assert data["status_label"] == "Standard Analysis Mode"
        assert "Standard AI analysis active" in data["banner_message"]


def test_resume_analyzer_text_mode(user_a):
    _, _, headers = user_a
    resume_text = (
        "Professional Summary\nSenior Software Engineer with 6 years experience in Python, FastAPI, Docker, and PostgreSQL.\n"
        "Experience\nArchitected high-throughput microservices handling 20,000 requests per minute with 99.99% uptime.\n"
        "Education\nB.S. in Computer Science.\n"
        "Skills\nPython, FastAPI, SQL, PostgreSQL, Docker, AWS, React, Git, CI/CD."
    )
    res = client.post("/api/ai/resume-analyzer", headers=headers, json={"resume_text": resume_text})
    assert res.status_code == 200
    data = res.json()
    assert "skills" in data
    assert len(data["skills"]) > 0
    assert "resume_score" in data
    assert 10 <= data["resume_score"] <= 100
    assert "detected_sections" in data
    assert "missing_sections" in data
    assert "improvement_areas" in data
    assert "provider_configured" in data
    assert "provider_note" in data
    assert settings.gemini_api_key not in str(data)


def test_resume_analyzer_pdf_mode(user_a):
    _, _, headers = user_a
    pdf_bytes = generate_valid_pdf_bytes(
        "Summary\nPython Full Stack Engineer with React, FastAPI, Docker experience.\n"
        "Experience\nOptimized database queries, reducing response times by 40%.\n"
        "Education\nComputer Science Degree.\n"
        "Skills\nPython, React, FastAPI, Docker, PostgreSQL."
    )
    res = client.post(
        "/api/ai/resume-analyzer",
        headers=headers,
        files={"file": ("resume.pdf", io.BytesIO(pdf_bytes), "application/pdf")},
    )
    assert res.status_code == 200
    data = res.json()
    assert "resume_score" in data
    assert len(data["skills"]) > 0
    assert data["provider_configured"] in [True, False]
    assert settings.gemini_api_key not in str(data)


def test_job_match_custom_role(user_a):
    _, _, headers = user_a
    payload = {
        "resume_text": "Experienced Python and FastAPI backend engineer with PostgreSQL and Redis skills.",
        "job_title": "Backend Python Engineer",
        "job_description": "We are looking for a Python engineer skilled in FastAPI, PostgreSQL, Docker, and Redis.",
    }
    res = client.post("/api/ai/job-match", headers=headers, json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["job_title"] == "Backend Python Engineer"
    assert 10 <= data["match_percentage"] <= 100
    assert "matched_skills" in data
    assert "missing_skills" in data
    assert "improvement_suggestions" in data
    assert "provider_configured" in data
    assert "provider_note" in data
    assert settings.gemini_api_key not in str(data)


def test_interview_questions_custom_role(user_a):
    _, _, headers = user_a
    payload = {
        "job_title": "Senior Backend Developer",
        "job_description": "Building scalable microservices using Python, FastAPI, and Kafka.",
        "interview_type": "technical",
    }
    res = client.post("/api/ai/interview-questions", headers=headers, json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["role"] == "Senior Backend Developer"
    assert data["interview_type"] == "technical"
    assert "questions_by_category" in data
    for cat in ["Technical", "Role-specific", "Behavioral", "HR"]:
        assert cat in data["questions_by_category"]
        assert len(data["questions_by_category"][cat]) > 0
    assert settings.gemini_api_key not in str(data)


def test_cover_letter_custom_role(user_a):
    _, _, headers = user_a
    payload = {
        "job_title": "Full Stack Developer",
        "company_name": "Acme Innovations",
        "job_description": "Seeking Full Stack engineer proficient in React, Python, and PostgreSQL.",
        "resume_text": "Full stack developer with 4 years building web applications with Python and React.",
    }
    res = client.post("/api/ai/cover-letter", headers=headers, json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["job_title"] == "Full Stack Developer"
    assert data["company_name"] == "Acme Innovations"
    assert len(data["cover_letter"]) > 100
    assert "Acme Innovations" in data["cover_letter"]
    assert settings.gemini_api_key not in str(data)


def test_cross_user_job_isolation_ai_tools(user_a, user_b):
    _, _, headers_a = user_a
    _, _, headers_b = user_b

    # User A creates a company and job
    comp_res = client.post("/api/companies/", headers=headers_a, json={"name": "User A Company"})
    assert comp_res.status_code == 201
    comp_id = comp_res.json()["id"]

    job_res = client.post(
        "/api/jobs/",
        headers=headers_a,
        json={"title": "Private Role", "company_id": comp_id, "status": "Applied", "description": "Confidential job"},
    )
    assert job_res.status_code == 201
    job_id = job_res.json()["id"]

    # User B attempts to access User A's job via AI tools -> must receive 404
    match_res = client.post(
        "/api/ai/job-match",
        headers=headers_b,
        json={"job_id": job_id, "resume_text": "Python engineer with 5 years experience."},
    )
    assert match_res.status_code == 404

    q_res = client.post(
        "/api/ai/interview-questions",
        headers=headers_b,
        json={"job_id": job_id},
    )
    assert q_res.status_code == 404

    cl_res = client.post(
        "/api/ai/cover-letter",
        headers=headers_b,
        json={"job_id": job_id},
    )
    assert cl_res.status_code == 404

    # User A creates an application and an interview
    app_res = client.post(
        "/api/applications/",
        headers=headers_a,
        json={"job_id": job_id, "status": "interview"},
    )
    assert app_res.status_code == 201
    application_id = app_res.json()["id"]

    int_res = client.post(
        "/api/interviews/",
        headers=headers_a,
        json={
            "application_id": application_id,
            "interview_date": "2026-10-15T10:00:00",
            "interview_type": "technical",
            "status": "scheduled",
        },
    )
    assert int_res.status_code == 201
    interview_data = int_res.json()
    assert interview_data["job_id"] == job_id
    interview_id = interview_data["id"]

    # User A can generate questions via interview_id
    q_user_a = client.post(
        "/api/ai/interview-questions",
        headers=headers_a,
        json={"interview_id": interview_id, "interview_type": "technical"},
    )
    assert q_user_a.status_code == 200
    assert "Private Role" in q_user_a.json()["role"]

    # User B cannot generate questions via User A's interview_id -> 404
    q_user_b = client.post(
        "/api/ai/interview-questions",
        headers=headers_b,
        json={"interview_id": interview_id},
    )
    assert q_user_b.status_code == 404


def test_unauthenticated_requests():
    endpoints = [
        ("GET", "/api/ai/status", {}),
        ("POST", "/api/ai/resume-analyzer", {"json": {"resume_text": "Short resume text for test."}}),
        ("POST", "/api/ai/job-match", {"json": {"resume_text": "Python engineer with experience."}}),
        ("POST", "/api/ai/interview-questions", {"json": {"job_title": "Developer"}}),
        ("POST", "/api/ai/cover-letter", {"json": {"job_title": "Developer"}}),
    ]
    for method, path, kwargs in endpoints:
        if method == "GET":
            res = client.get(path, **kwargs)
        else:
            res = client.post(path, **kwargs)
        assert res.status_code == 401, f"{path} should require authentication"


def test_gemini_fallback_when_key_missing(user_a):
    _, _, headers = user_a
    # Simulate missing GEMINI_API_KEY
    with patch.object(settings, "gemini_api_key", None):
        # 1. Status endpoint
        status_res = client.get("/api/ai/status", headers=headers)
        assert status_res.status_code == 200
        assert status_res.json()["provider_configured"] is False
        assert status_res.json()["status_label"] == "Standard Analysis Mode"

        # 2. Resume analyzer deterministic fallback
        res_res = client.post(
            "/api/ai/resume-analyzer",
            headers=headers,
            json={"resume_text": "Python engineer with SQL and Docker experience. Improved latency by 20%."},
        )
        assert res_res.status_code == 200
        data = res_res.json()
        assert data["provider_configured"] is False
        assert "Standard AI analysis active" in data["provider_note"]
        assert "Python" in data["skills"]

        # 3. Job match deterministic fallback
        jm_res = client.post(
            "/api/ai/job-match",
            headers=headers,
            json={"resume_text": "Python engineer with SQL.", "job_title": "Python Dev", "job_description": "Python, SQL, AWS"},
        )
        assert jm_res.status_code == 200
        data = jm_res.json()
        assert data["provider_configured"] is False
        assert "Standard AI analysis active" in data["provider_note"]
        assert "Python" in data["matched_skills"]


def test_gemini_fallback_when_provider_errors(user_a):
    _, _, headers = user_a
    # Simulate Gemini API raising an unexpected exception
    with patch("app.services.gemini_service.gemini_service._generate_content", side_effect=Exception("503 Service Unavailable")):
        res_res = client.post(
            "/api/ai/resume-analyzer",
            headers=headers,
            json={"resume_text": "Python engineer with FastAPI and Docker experience."},
        )
        assert res_res.status_code == 200
        # Result gracefully falls back to deterministic rule-based analysis
        data = res_res.json()
        assert "skills" in data
        assert "Python" in data["skills"]
        assert data["resume_score"] > 0


def test_interview_preparation_workflow_scheduled(user_a):
    _, _, headers = user_a

    # 1. Create Company
    comp_res = client.post("/api/companies/", headers=headers, json={"name": "Stripe", "website": "https://stripe.com"})
    assert comp_res.status_code == 201
    comp_id = comp_res.json()["id"]

    # 2. Create Job
    job_res = client.post(
        "/api/jobs/",
        headers=headers,
        json={
            "company_id": comp_id,
            "title": "Staff Backend Engineer",
            "description": "Architect high-throughput payment APIs in Python, PostgreSQL, and distributed caching.",
            "employment_type": "Full-time",
            "status": "active",
        },
    )
    assert job_res.status_code == 201
    job_id = job_res.json()["id"]

    # 3. Create Application
    app_res = client.post(
        "/api/applications/",
        headers=headers,
        json={"job_id": job_id, "status": "interview"},
    )
    assert app_res.status_code == 201
    app_id = app_res.json()["id"]

    # 4. Create Scheduled Technical Interview
    int_res = client.post(
        "/api/interviews/",
        headers=headers,
        json={
            "application_id": app_id,
            "interview_date": "2026-10-12T10:00:00",
            "interview_type": "technical",
            "meeting_link": "https://meet.google.com/abc-def-ghi",
            "notes": "Review distributed payment transaction architecture",
            "status": "scheduled",
        },
    )
    assert int_res.status_code == 201
    interview_data = int_res.json()
    assert interview_data["job_id"] == job_id
    assert "payment APIs" in interview_data["job_description"]

    # 5. Generate Interview Preparation Questions using interview_id
    prep_res = client.post(
        "/api/ai/interview-questions",
        headers=headers,
        json={
            "interview_id": interview_data["id"],
            "interview_type": "technical",
        },
    )
    assert prep_res.status_code == 200
    prep_data = prep_res.json()
    assert "Staff Backend Engineer" in prep_data["role"]
    assert "Stripe" in prep_data["role"]
    assert "Technical" in prep_data["questions_by_category"]
    assert "Role-specific" in prep_data["questions_by_category"]
    assert "Behavioral" in prep_data["questions_by_category"]
    assert "HR" in prep_data["questions_by_category"]
    assert len(prep_data["questions_by_category"]["Technical"]) >= 3


def test_interview_preparation_various_interview_types(user_a):
    _, _, headers = user_a
    comp = client.post("/api/companies/", headers=headers, json={"name": "Datadog"}).json()
    job = client.post("/api/jobs/", headers=headers, json={"company_id": comp["id"], "title": "SRE", "description": "Linux, Kubernetes, Go"}).json()
    app = client.post("/api/applications/", headers=headers, json={"job_id": job["id"], "status": "interview"}).json()

    for itype in ["behavioral", "hr", "screening", "final", "other"]:
        interv = client.post(
            "/api/interviews/",
            headers=headers,
            json={
                "application_id": app["id"],
                "interview_date": "2026-10-15T14:00:00",
                "interview_type": itype,
                "status": "scheduled",
            },
        ).json()

        res = client.post(
            "/api/ai/interview-questions",
            headers=headers,
            json={"interview_id": interv["id"], "interview_type": itype},
        )
        assert res.status_code == 200
        data = res.json()
        assert data["interview_type"] == itype
        assert len(data["questions_by_category"]["Technical"]) > 0
        assert len(data["questions_by_category"]["Behavioral"]) > 0


def test_interview_preparation_cross_user_isolation(user_a, user_b):
    _, _, headers_a = user_a
    _, _, headers_b = user_b

    # User A creates company, job, application, interview
    comp_a = client.post("/api/companies/", headers=headers_a, json={"name": "UserA Corp"}).json()
    job_a = client.post("/api/jobs/", headers=headers_a, json={"company_id": comp_a["id"], "title": "A Role", "description": "A secret job"}).json()
    app_a = client.post("/api/applications/", headers=headers_a, json={"job_id": job_a["id"], "status": "interview"}).json()
    interview_a = client.post(
        "/api/interviews/",
        headers=headers_a,
        json={"application_id": app_a["id"], "interview_date": "2026-10-18T11:00:00", "interview_type": "technical", "status": "scheduled"},
    ).json()

    # User B attempts to generate questions for User A's interview_id -> MUST BE 404
    b_try_int = client.post(
        "/api/ai/interview-questions",
        headers=headers_b,
        json={"interview_id": interview_a["id"]},
    )
    assert b_try_int.status_code == 404
    assert "not found or does not belong to you" in b_try_int.json()["detail"].lower()

    # User B attempts to generate questions for User A's job_id -> MUST BE 404
    b_try_job = client.post(
        "/api/ai/interview-questions",
        headers=headers_b,
        json={"job_id": job_a["id"]},
    )
    assert b_try_job.status_code == 404
    assert "not found or does not belong to you" in b_try_job.json()["detail"].lower()

