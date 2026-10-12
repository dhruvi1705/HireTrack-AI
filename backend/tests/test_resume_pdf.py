import io
import uuid
import pytest
from pypdf import PdfWriter
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def generate_valid_pdf_bytes(text_content: str = "Summary\nSoftware Engineer with Python, React, FastAPI experience.\nProjects\nBuilt microservices with Docker.\nSkills\nPython, Docker, SQL, Git.") -> bytes:
    # Build minimal valid PDF stream with extractable text
    escaped = text_content.replace("\n", " ")
    raw_pdf = f"""%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
4 0 obj << /Length {len(escaped) + 30} >> stream
BT
/F1 12 Tf
72 700 Td
({escaped}) Tj
ET
endstream endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000261 00000 n 
0000000384 00000 n 
trailer << /Size 6 /Root 1 0 R >>
startxref
455
%%EOF""".encode("latin-1")
    return raw_pdf


def generate_empty_page_pdf_bytes() -> bytes:
    # A valid PDF structure but with completely blank page (no extractable text)
    writer = PdfWriter()
    writer.add_blank_page(width=612, height=792)
    buf = io.BytesIO()
    writer.write(buf)
    return buf.getvalue()


@pytest.fixture
def auth_headers():
    uid = uuid.uuid4().hex[:8]
    email = f"pdf_tester_{uid}@example.com"
    pwd = "TestPassword123!"

    client.post("/api/auth/register", json={"full_name": "PDF Tester", "email": email, "password": pwd})
    login_res = client.post("/api/auth/login", json={"email": email, "password": pwd})
    token = login_res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_resume_analyzer_unauthenticated():
    # 8. Unauthenticated request -> 401
    pdf_bytes = generate_valid_pdf_bytes()
    res = client.post(
        "/api/ai/resume-analyzer",
        files={"file": ("resume.pdf", io.BytesIO(pdf_bytes), "application/pdf")},
    )
    assert res.status_code == 401


def test_resume_analyzer_valid_pdf(auth_headers):
    # 1. & 5. Valid text-based PDF with readable text
    pdf_bytes = generate_valid_pdf_bytes(
        "Professional Summary\nExperienced Senior Engineer with Python, React, FastAPI, Docker, and PostgreSQL expertise.\n"
        "Work Experience\nImproved API response time by 35% and served 500k users with high reliability.\n"
        "Education\nB.S. in Computer Science.\n"
        "Contact: dev@example.com\n"
        "Key Projects\nCreated open-source distributed task queue."
    )
    res = client.post(
        "/api/ai/resume-analyzer",
        headers=auth_headers,
        files={"file": ("my_resume.pdf", io.BytesIO(pdf_bytes), "application/pdf")},
    )
    assert res.status_code == 200
    data = res.json()
    assert "resume_score" in data
    assert data["resume_score"] >= 30
    assert "Python" in data["skills"]
    assert "Fastapi" in data["skills"] or "FASTAPI" in data["skills"] or any("fastapi" in s.lower() for s in data["skills"])
    assert "Summary / Objective" in data["detected_sections"]
    assert "Experience / Employment" in data["detected_sections"]
    assert data["word_count"] > 10


def test_resume_analyzer_empty_pdf_file(auth_headers):
    # 2. Empty PDF (0 bytes) -> 400
    res = client.post(
        "/api/ai/resume-analyzer",
        headers=auth_headers,
        files={"file": ("empty.pdf", io.BytesIO(b""), "application/pdf")},
    )
    assert res.status_code == 400
    assert "empty" in res.json()["detail"].lower()


def test_resume_analyzer_invalid_file_type(auth_headers):
    # 3. Invalid file type such as .docx -> 400
    res = client.post(
        "/api/ai/resume-analyzer",
        headers=auth_headers,
        files={"file": ("resume.docx", io.BytesIO(b"PK fake docx content"), "application/vnd.openxmlformats-officedocument.wordprocessingml.document")},
    )
    assert res.status_code == 400
    assert "only .pdf files are supported" in res.json()["detail"].lower()


def test_resume_analyzer_oversized_file(auth_headers):
    # 4. PDF larger than configured limit (> 10 MB) -> 413
    oversized = b"%PDF-1.4 " + (b"0" * (10 * 1024 * 1024 + 512))
    res = client.post(
        "/api/ai/resume-analyzer",
        headers=auth_headers,
        files={"file": ("huge.pdf", io.BytesIO(oversized), "application/pdf")},
    )
    assert res.status_code == 413
    assert "10 mb" in res.json()["detail"].lower()


def test_resume_analyzer_pdf_no_extractable_text(auth_headers):
    # 6. PDF with no extractable text (e.g. blank page or image only) -> 400
    blank_pdf = generate_empty_page_pdf_bytes()
    res = client.post(
        "/api/ai/resume-analyzer",
        headers=auth_headers,
        files={"file": ("scanned.pdf", io.BytesIO(blank_pdf), "application/pdf")},
    )
    assert res.status_code == 400
    assert "this pdf does not contain readable text" in res.json()["detail"].lower()


def test_resume_analyzer_paste_text_mode(auth_headers):
    # 7. Paste-text mode (JSON request)
    sample_text = (
        "Professional Summary: Full Stack Developer proficient in Python, React, JavaScript, and Docker.\n"
        "Experience: Built scalable web applications reducing query latency by 40%.\n"
        "Education: Bachelor of Science.\n"
        "Contact: engineer@test.com"
    )
    res = client.post(
        "/api/ai/resume-analyzer",
        headers=auth_headers,
        json={"resume_text": sample_text},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["resume_score"] >= 30
    assert "Python" in data["skills"]
    assert "React" in data["skills"]
    assert "Summary / Objective" in data["detected_sections"]

