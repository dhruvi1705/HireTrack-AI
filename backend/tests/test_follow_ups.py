import uuid
from datetime import datetime, timedelta, timezone
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


@pytest.fixture
def test_users():
    uid = uuid.uuid4().hex[:8]
    email_a = f"fu_user_a_{uid}@example.com"
    email_b = f"fu_user_b_{uid}@example.com"
    pwd = "TestPassword123!"

    # Register & Login User A
    client.post("/api/auth/register", json={"full_name": "User A", "email": email_a, "password": pwd})
    token_a = client.post("/api/auth/login", json={"email": email_a, "password": pwd}).json()["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # Register & Login User B
    client.post("/api/auth/register", json={"full_name": "User B", "email": email_b, "password": pwd})
    token_b = client.post("/api/auth/login", json={"email": email_b, "password": pwd}).json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # Create Company, Job, Application for User A
    comp_a = client.post("/api/companies/", headers=headers_a, json={"name": "Acme Corp"}).json()
    job_a = client.post(
        "/api/jobs/",
        headers=headers_a,
        json={"company_id": comp_a["id"], "title": "Software Engineer"},
    ).json()
    app_a = client.post(
        "/api/applications/",
        headers=headers_a,
        json={"job_id": job_a["id"], "status": "applied"},
    ).json()

    # Create Company, Job, Application for User B
    comp_b = client.post("/api/companies/", headers=headers_b, json={"name": "Beta Corp"}).json()
    job_b = client.post(
        "/api/jobs/",
        headers=headers_b,
        json={"company_id": comp_b["id"], "title": "Product Manager"},
    ).json()
    app_b = client.post(
        "/api/applications/",
        headers=headers_b,
        json={"job_id": job_b["id"], "status": "applied"},
    ).json()

    return {
        "headers_a": headers_a,
        "app_a": app_a,
        "job_a": job_a,
        "comp_a": comp_a,
        "headers_b": headers_b,
        "app_b": app_b,
        "job_b": job_b,
        "comp_b": comp_b,
    }


def test_follow_up_crud_flow(test_users):
    headers_a = test_users["headers_a"]
    app_a_id = test_users["app_a"]["id"]

    # 1. Create Follow-up
    future_date = (datetime.now(timezone.utc) + timedelta(days=3)).isoformat()
    res_create = client.post(
        "/api/follow-ups/",
        headers=headers_a,
        json={
            "application_id": app_a_id,
            "title": "Check in with recruiter",
            "description": "Send a friendly email regarding application status.",
            "due_date": future_date,
            "status": "pending",
        },
    )
    assert res_create.status_code == 201
    created_data = res_create.json()
    fu_id = created_data["id"]
    assert created_data["title"] == "Check in with recruiter"
    assert created_data["description"] == "Send a friendly email regarding application status."
    assert created_data["status"] == "pending"
    assert created_data["company_name"] == "Acme Corp"
    assert created_data["job_title"] == "Software Engineer"
    assert created_data["is_overdue"] is False

    # 2. Get Follow-up by ID
    res_get = client.get(f"/api/follow-ups/{fu_id}", headers=headers_a)
    assert res_get.status_code == 200
    assert res_get.json()["id"] == fu_id
    assert res_get.json()["company_name"] == "Acme Corp"

    # 3. Update Follow-up
    res_update = client.post if False else client.put
    res_put = res_update(
        f"/api/follow-ups/{fu_id}",
        headers=headers_a,
        json={
            "title": "Follow up with VP of Eng",
            "status": "completed",
        },
    )
    assert res_put.status_code == 200
    assert res_put.json()["title"] == "Follow up with VP of Eng"
    assert res_put.json()["status"] == "completed"
    assert res_put.json()["is_overdue"] is False

    # 4. Delete Follow-up
    res_delete = client.delete(f"/api/follow-ups/{fu_id}", headers=headers_a)
    assert res_delete.status_code == 204

    # 5. Verify 404 after deletion
    res_get_deleted = client.get(f"/api/follow-ups/{fu_id}", headers=headers_a)
    assert res_get_deleted.status_code == 404


def test_overdue_derivation(test_users):
    headers_a = test_users["headers_a"]
    app_a_id = test_users["app_a"]["id"]

    past_date = (datetime.now(timezone.utc) - timedelta(days=2)).isoformat()
    future_date = (datetime.now(timezone.utc) + timedelta(days=2)).isoformat()

    # Past pending follow-up -> Overdue = True
    res_overdue = client.post(
        "/api/follow-ups/",
        headers=headers_a,
        json={
            "application_id": app_a_id,
            "title": "Overdue reminder",
            "due_date": past_date,
            "status": "pending",
        },
    )
    assert res_overdue.status_code == 201
    assert res_overdue.json()["is_overdue"] is True

    # Future pending follow-up -> Overdue = False
    res_future = client.post(
        "/api/follow-ups/",
        headers=headers_a,
        json={
            "application_id": app_a_id,
            "title": "Future reminder",
            "due_date": future_date,
            "status": "pending",
        },
    )
    assert res_future.status_code == 201
    assert res_future.json()["is_overdue"] is False

    # Completed past follow-up -> Overdue = False
    res_completed_past = client.post(
        "/api/follow-ups/",
        headers=headers_a,
        json={
            "application_id": app_a_id,
            "title": "Completed past task",
            "due_date": past_date,
            "status": "completed",
        },
    )
    assert res_completed_past.status_code == 201
    assert res_completed_past.json()["is_overdue"] is False


def test_follow_up_status_filtering(test_users):
    headers_a = test_users["headers_a"]
    app_a_id = test_users["app_a"]["id"]

    past_date = (datetime.now(timezone.utc) - timedelta(days=2)).isoformat()
    future_date = (datetime.now(timezone.utc) + timedelta(days=2)).isoformat()

    # Create 1 overdue pending, 1 future pending, 1 completed
    client.post(
        "/api/follow-ups/",
        headers=headers_a,
        json={"application_id": app_a_id, "title": "Task Overdue", "due_date": past_date, "status": "pending"},
    )
    client.post(
        "/api/follow-ups/",
        headers=headers_a,
        json={"application_id": app_a_id, "title": "Task Future", "due_date": future_date, "status": "pending"},
    )
    client.post(
        "/api/follow-ups/",
        headers=headers_a,
        json={"application_id": app_a_id, "title": "Task Done", "due_date": past_date, "status": "completed"},
    )

    # Filter: overdue
    res_overdue = client.get("/api/follow-ups/?status=overdue", headers=headers_a).json()
    assert len(res_overdue) == 1
    assert res_overdue[0]["title"] == "Task Overdue"
    assert res_overdue[0]["is_overdue"] is True

    # Filter: pending
    res_pending = client.get("/api/follow-ups/?status=pending", headers=headers_a).json()
    assert len(res_pending) == 2
    titles_pending = [f["title"] for f in res_pending]
    assert "Task Overdue" in titles_pending
    assert "Task Future" in titles_pending

    # Filter: completed
    res_completed = client.get("/api/follow-ups/?status=completed", headers=headers_a).json()
    assert len(res_completed) == 1
    assert res_completed[0]["title"] == "Task Done"

    # Filter: all
    res_all = client.get("/api/follow-ups/?status=all", headers=headers_a).json()
    assert len(res_all) == 3

    # Invalid status filter -> 400
    res_bad = client.get("/api/follow-ups/?status=invalid_status", headers=headers_a)
    assert res_bad.status_code == 400


def test_cross_user_isolation(test_users):
    headers_a = test_users["headers_a"]
    headers_b = test_users["headers_b"]
    app_a_id = test_users["app_a"]["id"]
    app_b_id = test_users["app_b"]["id"]

    # User A creates follow-up
    future_date = (datetime.now(timezone.utc) + timedelta(days=1)).isoformat()
    fu_a = client.post(
        "/api/follow-ups/",
        headers=headers_a,
        json={"application_id": app_a_id, "title": "User A secret follow-up", "due_date": future_date},
    ).json()

    # User B CANNOT read User A's follow-up -> 404
    assert client.get(f"/api/follow-ups/{fu_a['id']}", headers=headers_b).status_code == 404

    # User B CANNOT update User A's follow-up -> 404
    assert client.put(f"/api/follow-ups/{fu_a['id']}", headers=headers_b, json={"title": "Hacked"}).status_code == 404

    # User B CANNOT delete User A's follow-up -> 404
    assert client.delete(f"/api/follow-ups/{fu_a['id']}", headers=headers_b).status_code == 404

    # User B CANNOT create a follow-up for User A's application -> 404
    b_hack_create = client.post(
        "/api/follow-ups/",
        headers=headers_b,
        json={"application_id": app_a_id, "title": "Cross-user reminder", "due_date": future_date},
    )
    assert b_hack_create.status_code == 404

    # User A list does not show up in User B's list
    b_list = client.get("/api/follow-ups/", headers=headers_b).json()
    assert not any(f["id"] == fu_a["id"] for f in b_list)


def test_validation_and_unauthenticated():
    # 1. Unauthenticated requests -> 401
    assert client.get("/api/follow-ups/").status_code == 401
    assert client.post("/api/follow-ups/", json={}).status_code == 401

    # 2. Invalid token -> 401
    assert client.get("/api/follow-ups/", headers={"Authorization": "Bearer fake_token"}).status_code == 401


def test_cascade_delete_application(test_users):
    headers_a = test_users["headers_a"]
    app_a_id = test_users["app_a"]["id"]

    future_date = (datetime.now(timezone.utc) + timedelta(days=2)).isoformat()
    fu = client.post(
        "/api/follow-ups/",
        headers=headers_a,
        json={"application_id": app_a_id, "title": "Will be cascaded", "due_date": future_date},
    ).json()

    # Delete Application
    del_app = client.delete(f"/api/applications/{app_a_id}", headers=headers_a)
    assert del_app.status_code == 204

    # Follow-up should be cascade deleted
    assert client.get(f"/api/follow-ups/{fu['id']}", headers=headers_a).status_code == 404


def test_dashboard_upcoming_follow_ups(test_users):
    headers_a = test_users["headers_a"]
    app_a_id = test_users["app_a"]["id"]

    past_date = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
    future_date = (datetime.now(timezone.utc) + timedelta(days=1)).isoformat()

    # Create 1 overdue pending and 1 future pending
    client.post(
        "/api/follow-ups/",
        headers=headers_a,
        json={"application_id": app_a_id, "title": "Overdue Call", "due_date": past_date, "status": "pending"},
    )
    client.post(
        "/api/follow-ups/",
        headers=headers_a,
        json={"application_id": app_a_id, "title": "Upcoming Message", "due_date": future_date, "status": "pending"},
    )

    dash = client.get("/api/dashboard/summary", headers=headers_a).json()
    assert "upcoming_follow_ups" in dash
    assert len(dash["upcoming_follow_ups"]) >= 2

    # Check overdue item
    overdue_item = next(f for f in dash["upcoming_follow_ups"] if f["title"] == "Overdue Call")
    assert overdue_item["is_overdue"] is True
    assert overdue_item["company"] == "Acme Corp"
    assert overdue_item["role"] == "Software Engineer"
    assert overdue_item["application_id"] == app_a_id

    # Check future item
    future_item = next(f for f in dash["upcoming_follow_ups"] if f["title"] == "Upcoming Message")
    assert future_item["is_overdue"] is False
