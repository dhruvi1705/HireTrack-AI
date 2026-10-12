import uuid
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


@pytest.fixture
def test_users():
    uid = uuid.uuid4().hex[:8]
    email_a = f"test_a_{uid}@example.com"
    email_b = f"test_b_{uid}@example.com"
    password = "TestPassword123!"

    # Register User A
    reg_a = client.post(
        "/api/auth/register",
        json={"full_name": "Test User A", "email": email_a, "password": password},
    )
    assert reg_a.status_code == 201
    login_a = client.post(
        "/api/auth/login",
        json={"email": email_a, "password": password},
    )
    token_a = login_a.json()["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # Register User B
    reg_b = client.post(
        "/api/auth/register",
        json={"full_name": "Test User B", "email": email_b, "password": password},
    )
    assert reg_b.status_code == 201
    login_b = client.post(
        "/api/auth/login",
        json={"email": email_b, "password": password},
    )
    token_b = login_b.json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    return {"headers_a": headers_a, "headers_b": headers_b}


def test_auth_protection():
    # No token -> 401
    r_no_auth = client.get("/api/companies/")
    assert r_no_auth.status_code == 401

    # Invalid token -> 401
    r_bad_auth = client.get(
        "/api/companies/",
        headers={"Authorization": "Bearer invalid_token_xyz"},
    )
    assert r_bad_auth.status_code == 401


def test_empty_company_list_for_new_user(test_users):
    headers_a = test_users["headers_a"]
    res = client.get("/api/companies/", headers=headers_a)
    assert res.status_code == 200
    assert res.json() == []


def test_two_user_company_data_isolation(test_users):
    headers_a = test_users["headers_a"]
    headers_b = test_users["headers_b"]

    # User A creates Microsoft and Google
    res_ms = client.post(
        "/api/companies/",
        headers=headers_a,
        json={"name": "Microsoft", "website": "https://microsoft.com", "location": "Redmond, WA"},
    )
    assert res_ms.status_code == 201
    ms_id = res_ms.json()["id"]

    res_goog = client.post(
        "/api/companies/",
        headers=headers_a,
        json={"name": "Google", "website": "https://google.com", "location": "Mountain View, CA"},
    )
    assert res_goog.status_code == 201
    goog_id = res_goog.json()["id"]

    # Verify User A sees Microsoft and Google
    list_a = client.get("/api/companies/", headers=headers_a).json()
    names_a = [c["name"] for c in list_a]
    assert "Microsoft" in names_a
    assert "Google" in names_a
    assert len(names_a) == 2

    # User B creates TCS
    res_tcs = client.post(
        "/api/companies/",
        headers=headers_b,
        json={"name": "TCS", "website": "https://tcs.com", "location": "Mumbai, India"},
    )
    assert res_tcs.status_code == 201
    tcs_id = res_tcs.json()["id"]

    # Verify User B sees ONLY TCS
    list_b = client.get("/api/companies/", headers=headers_b).json()
    names_b = [c["name"] for c in list_b]
    assert names_b == ["TCS"]

    # User B cannot GET User A's company by ID
    assert client.get(f"/api/companies/{ms_id}", headers=headers_b).status_code == 404
    assert client.get(f"/api/companies/{goog_id}", headers=headers_b).status_code == 404

    # User B cannot PUT User A's company
    assert (
        client.put(
            f"/api/companies/{ms_id}",
            headers=headers_b,
            json={"name": "Tampered Name"},
        ).status_code
        == 404
    )

    # User B cannot DELETE User A's company
    assert client.delete(f"/api/companies/{ms_id}", headers=headers_b).status_code == 404


def test_job_ownership_and_security(test_users):
    headers_a = test_users["headers_a"]
    headers_b = test_users["headers_b"]

    # User A creates company
    res_comp_a = client.post("/api/companies/", headers=headers_a, json={"name": "Company A"}).json()
    comp_a_id = res_comp_a["id"]

    # User B cannot create job for User A's company
    hack_job = client.post(
        "/api/jobs/",
        headers=headers_b,
        json={"company_id": comp_a_id, "title": "Unauthorized Role"},
    )
    assert hack_job.status_code == 404

    # User B creates own company and job
    res_comp_b = client.post("/api/companies/", headers=headers_b, json={"name": "Company B"}).json()
    comp_b_id = res_comp_b["id"]
    job_b = client.post(
        "/api/jobs/",
        headers=headers_b,
        json={"company_id": comp_b_id, "title": "Legit Role"},
    ).json()
    job_b_id = job_b["id"]

    # User B cannot change job's company_id to User A's company
    hack_update = client.put(
        f"/api/jobs/{job_b_id}",
        headers=headers_b,
        json={"company_id": comp_a_id},
    )
    assert hack_update.status_code == 404

    # User A cannot update User B's job
    assert (
        client.put(
            f"/api/jobs/{job_b_id}",
            headers=headers_a,
            json={"title": "Hacked Title"},
        ).status_code
        == 404
    )

    # User A cannot delete User B's job
    assert client.delete(f"/api/jobs/{job_b_id}", headers=headers_a).status_code == 404


def test_cascade_deletion(test_users):
    headers_a = test_users["headers_a"]

    # Create Company -> Job -> Application -> Interview
    comp = client.post("/api/companies/", headers=headers_a, json={"name": "Cascade Corp"}).json()
    job = client.post(
        "/api/jobs/",
        headers=headers_a,
        json={"company_id": comp["id"], "title": "Cascade Role"},
    ).json()
    app = client.post(
        "/api/applications/",
        headers=headers_a,
        json={"job_id": job["id"], "status": "applied"},
    ).json()
    interview = client.post(
        "/api/interviews/",
        headers=headers_a,
        json={
            "application_id": app["id"],
            "interview_date": "2026-12-01T10:00:00Z",
            "interview_type": "technical",
            "status": "scheduled",
        },
    ).json()

    # Delete company
    del_res = client.delete(f"/api/companies/{comp['id']}", headers=headers_a)
    assert del_res.status_code == 204

    # Verify cascading removal
    assert client.get(f"/api/companies/{comp['id']}", headers=headers_a).status_code == 404
    assert client.get(f"/api/jobs/{job['id']}", headers=headers_a).status_code == 404
    assert client.get(f"/api/applications/{app['id']}", headers=headers_a).status_code == 404
    assert client.get(f"/api/interviews/{interview['id']}", headers=headers_a).status_code == 404


def test_dashboard_and_analytics_isolation(test_users):
    headers_a = test_users["headers_a"]
    headers_b = test_users["headers_b"]

    comp = client.post("/api/companies/", headers=headers_a, json={"name": "Analytics Corp"}).json()
    job = client.post(
        "/api/jobs/",
        headers=headers_a,
        json={"company_id": comp["id"], "title": "Data Engineer"},
    ).json()
    client.post(
        "/api/applications/",
        headers=headers_a,
        json={"job_id": job["id"], "status": "applied"},
    )

    # User A dashboard
    dash_a = client.get("/api/dashboard/summary", headers=headers_a).json()
    assert dash_a["stats"]["applications"] >= 1
    assert any(a["company"] == "Analytics Corp" for a in dash_a["recent_applications"])

    # User B dashboard should NOT contain Analytics Corp
    dash_b = client.get("/api/dashboard/summary", headers=headers_b).json()
    assert not any(a["company"] == "Analytics Corp" for a in dash_b["recent_applications"])

    # User B analytics should not count User A's companies or jobs
    analytics_b = client.get("/api/analytics/summary", headers=headers_b).json()
    assert analytics_b["job_search_summary"]["total_companies"] == 0
    assert analytics_b["job_search_summary"]["total_jobs"] == 0

    # User A conversion metrics
    analytics_a = client.get("/api/analytics/summary", headers=headers_a).json()
    assert "conversion_metrics" in analytics_a
    assert "app_to_interview_rate" in analytics_a["conversion_metrics"]
    assert "interview_to_offer_rate" in analytics_a["conversion_metrics"]
    assert "rejection_rate" in analytics_a["conversion_metrics"]


def test_ai_tools_and_cross_user_isolation(test_users):
    headers_a = test_users["headers_a"]
    headers_b = test_users["headers_b"]

    # 1. Resume Analyzer
    resume_text = """
    Jane Doe
    jane.doe@example.com | San Francisco, CA
    
    Professional Summary
    Experienced Full Stack Software Engineer with 5 years building scalable web services using Python, React, and PostgreSQL.
    
    Work Experience
    Senior Developer | TechCorp (2021 - Present)
    - Architected REST APIs using FastAPI and PostgreSQL, improving throughput by 40%.
    - Deployed containerized microservices using Docker and AWS.
    
    Education
    B.S. in Computer Science | State University
    
    Technical Skills
    Python, JavaScript, React, FastAPI, Docker, PostgreSQL, Git, AWS
    
    Projects
    HireTrack Platform: Built open-source job tracking system.
    """
    res_analyze = client.post(
        "/api/ai/resume-analyzer",
        headers=headers_a,
        json={"resume_text": resume_text},
    )
    assert res_analyze.status_code == 200
    data_analyze = res_analyze.json()
    assert data_analyze["resume_score"] > 50
    assert "Python" in data_analyze["skills"] or "PYTHON" in [s.upper() for s in data_analyze["skills"]]
    assert "Experience / Employment" in data_analyze["detected_sections"]
    assert "Education" in data_analyze["detected_sections"]

    # 2. User A creates Job under Company
    comp_a = client.post("/api/companies/", headers=headers_a, json={"name": "CloudWorks"}).json()
    job_a = client.post(
        "/api/jobs/",
        headers=headers_a,
        json={
            "company_id": comp_a["id"],
            "title": "Lead Python Engineer",
            "description": "Looking for Python, FastAPI, Docker, and PostgreSQL experts.",
        },
    ).json()
    job_a_id = job_a["id"]

    # User A runs Job Match
    res_match = client.post(
        "/api/ai/job-match",
        headers=headers_a,
        json={"job_id": job_a_id, "resume_text": resume_text},
    )
    assert res_match.status_code == 200
    data_match = res_match.json()
    assert data_match["match_percentage"] >= 50
    assert len(data_match["matched_skills"]) > 0

    # User B CANNOT run Job Match on User A's job -> 404
    hack_match = client.post(
        "/api/ai/job-match",
        headers=headers_b,
        json={"job_id": job_a_id, "resume_text": resume_text},
    )
    assert hack_match.status_code == 404

    # 3. User A Interview Questions
    res_q = client.post(
        "/api/ai/interview-questions",
        headers=headers_a,
        json={"job_id": job_a_id, "interview_type": "technical"},
    )
    assert res_q.status_code == 200
    data_q = res_q.json()
    assert "Technical" in data_q["questions_by_category"]
    assert "Behavioral" in data_q["questions_by_category"]

    # User B CANNOT generate interview questions on User A's job -> 404
    hack_q = client.post(
        "/api/ai/interview-questions",
        headers=headers_b,
        json={"job_id": job_a_id, "interview_type": "technical"},
    )
    assert hack_q.status_code == 404

    # 4. User A Cover Letter
    res_cl = client.post(
        "/api/ai/cover-letter",
        headers=headers_a,
        json={"job_id": job_a_id, "resume_text": resume_text},
    )
    assert res_cl.status_code == 200
    data_cl = res_cl.json()
    assert "CloudWorks" in data_cl["cover_letter"]
    assert "Lead Python Engineer" in data_cl["cover_letter"]

    # User B CANNOT generate cover letter on User A's job -> 404
    hack_cl = client.post(
        "/api/ai/cover-letter",
        headers=headers_b,
        json={"job_id": job_a_id, "resume_text": resume_text},
    )
    assert hack_cl.status_code == 404

