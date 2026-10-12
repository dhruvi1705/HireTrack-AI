import io
import os
import re
from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile, status
import pypdf
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.application import Application
from app.models.company import Company
from app.models.interview import Interview
from app.models.job import Job
from app.models.user import User
from app.schemas.ai import (
    AiProviderStatusResponse,
    CoverLetterRequest,
    CoverLetterResponse,
    InterviewQuestionsRequest,
    InterviewQuestionsResponse,
    JobMatchRequest,
    JobMatchResponse,
    ResumeAnalyzeRequest,
    ResumeAnalyzeResponse,
)
from app.services.gemini_service import (
    gemini_service,
    STATUS_ENHANCED,
    STATUS_STANDARD,
    BANNER_ENHANCED,
    BANNER_STANDARD,
)

router = APIRouter(
    prefix="/api/ai",
    tags=["AI Tools"],
    dependencies=[Depends(get_current_user)],
)

MAX_RESUME_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

# Standard Skill Dictionary for genuine keyword extraction
TECH_SKILLS = [
    "python", "javascript", "typescript", "react", "next.js", "vue", "angular", "node.js",
    "express", "fastapi", "django", "flask", "html", "css", "tailwind", "sql", "postgresql",
    "mysql", "mongodb", "redis", "docker", "kubernetes", "aws", "azure", "gcp", "git",
    "github", "rest api", "graphql", "ci/cd", "linux", "c++", "c#", "java", "spring boot",
    "pandas", "numpy", "machine learning", "deep learning", "nlp", "tensorflow", "pytorch",
    "scikit-learn", "data structures", "algorithms", "microservices", "unit testing", "agile",
    "scrum", "jira", "figma", "system design", "devops", "terraform", "bash", "power bi"
]

COMMON_SECTIONS = {
    "Summary / Objective": [r"\b(summary|objective|professional summary|about me|profile)\b"],
    "Experience / Employment": [r"\b(experience|work experience|employment history|work history|professional experience)\b"],
    "Education": [r"\b(education|academic background|qualifications|academic history)\b"],
    "Skills": [r"\b(skills|technical skills|core competencies|technologies|proficiencies)\b"],
    "Projects": [r"\b(projects|key projects|personal projects|portfolio)\b"],
    "Certifications": [r"\b(certifications|certificates|licenses|credentials)\b"],
}


def is_ai_provider_configured() -> tuple[bool, str]:
    if gemini_service.is_configured():
        return True, BANNER_ENHANCED
    return False, BANNER_STANDARD


def extract_skills_from_text(text: str) -> list[str]:
    lowered = text.lower()
    found = []
    for skill in TECH_SKILLS:
        pattern = r"\b" + re.escape(skill) + r"\b"
        if re.search(pattern, lowered):
            found.append(skill.title() if len(skill) > 3 and not skill.endswith("api") else skill.upper() if skill in ["sql", "aws", "gcp", "css", "html", "nlp", "rest api"] else skill)
    return sorted(list(set(found)))


def perform_resume_analysis(text: str) -> ResumeAnalyzeResponse:
    cleaned = text.strip()
    words = re.findall(r"\b\w+\b", cleaned)
    word_count = len(words)
    lowered = cleaned.lower()

    # 1. Section detection
    detected_sections = []
    missing_sections = []
    for section_name, patterns in COMMON_SECTIONS.items():
        found = any(re.search(pat, lowered) for pat in patterns)
        if found:
            detected_sections.append(section_name)
        else:
            missing_sections.append(section_name)

    # 2. Skill extraction
    extracted_skills = extract_skills_from_text(cleaned)

    # 3. Improvement areas
    improvements = []
    if "Summary / Objective" in missing_sections:
        improvements.append("Add a professional Summary/Objective highlighting your target role and top value proposition.")
    if "Projects" in missing_sections:
        improvements.append("Include a Projects section with links to code repositories or live demonstrations.")
    if word_count < 250:
        improvements.append("Resume content is short (< 250 words). Provide more detailed bullet points detailing your achievements.")
    elif word_count > 1200:
        improvements.append("Resume is lengthy (> 1,200 words). Aim for a focused 1-2 page document.")

    # Check for metrics / quantifiable results
    has_metrics = bool(re.search(r"\b(\d+%\b|\$\d+|\d+\+?\s*(users|clients|projects|features|reduction|increase|improved))", lowered))
    if not has_metrics:
        improvements.append("Add quantifiable metrics (e.g. 'Improved API response time by 35%', 'Scaled service to 10k users') to prove impact.")

    # Check for contact presence
    has_email = bool(re.search(r"[\w\.-]+@[\w\.-]+\.\w+", cleaned))
    if not has_email:
        improvements.append("Ensure your contact email address is clearly visible at the top of the resume.")

    # 4. Genuinely calculated resume score (0-100)
    score = 0
    # Sections (up to 40)
    score += int((len(detected_sections) / len(COMMON_SECTIONS)) * 40)
    # Skills (up to 30)
    score += min(len(extracted_skills) * 3, 30)
    # Metrics & Contact (up to 20)
    if has_metrics:
        score += 12
    if has_email:
        score += 8
    # Length sanity (up to 10)
    if 300 <= word_count <= 900:
        score += 10
    elif 200 <= word_count <= 1200:
        score += 5

    score = max(min(score, 100), 15)

    baseline = ResumeAnalyzeResponse(
        skills=extracted_skills,
        detected_sections=detected_sections,
        missing_sections=missing_sections,
        improvement_areas=improvements,
        resume_score=score,
        word_count=word_count,
        provider_configured=False,
        provider_note=BANNER_STANDARD,
        extracted_text=cleaned,
    )

    if gemini_service.is_configured():
        return gemini_service.enhance_resume_analysis(cleaned, baseline)

    return baseline


@router.get("/status", response_model=AiProviderStatusResponse)
def get_ai_status(current_user: User = Depends(get_current_user)):
    is_conf = gemini_service.is_configured()
    return AiProviderStatusResponse(
        provider_configured=is_conf,
        status_label=STATUS_ENHANCED if is_conf else STATUS_STANDARD,
        banner_message=BANNER_ENHANCED if is_conf else BANNER_STANDARD,
        model=gemini_service.get_model_name() if is_conf else None,
    )


@router.post("/resume-analyzer", response_model=ResumeAnalyzeResponse)
async def analyze_resume(
    request: Request,
    file: UploadFile | None = File(None),
    resume_text: str | None = Form(None),
    current_user: User = Depends(get_current_user),
):
    content_type = request.headers.get("content-type", "")
    raw_text: str | None = None

    if "application/json" in content_type:
        try:
            body = await request.json()
            raw_text = body.get("resume_text")
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid JSON payload.",
            )
    elif file is not None and file.filename:
        filename_lower = file.filename.lower()
        if not filename_lower.endswith(".pdf"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only .pdf files are supported. Please upload a PDF resume or paste text directly.",
            )
        try:
            file_bytes = await file.read()
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to read uploaded file.",
            )

        if len(file_bytes) > MAX_RESUME_FILE_SIZE:
            status_413 = getattr(status, "HTTP_413_CONTENT_TOO_LARGE", status.HTTP_413_REQUEST_ENTITY_TOO_LARGE)
            raise HTTPException(
                status_code=status_413,
                detail="File size exceeds the 10 MB limit. Please upload a smaller PDF.",
            )

        if len(file_bytes) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The uploaded PDF file is empty (0 bytes). Please upload a valid resume PDF.",
            )

        try:
            reader = pypdf.PdfReader(io.BytesIO(file_bytes))
            pages_text = []
            for page in reader.pages:
                page_txt = page.extract_text() or ""
                if page_txt.strip():
                    pages_text.append(page_txt.strip())
            extracted = "\n\n".join(pages_text).strip()
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to parse the PDF file. Please ensure it is a valid, uncorrupted PDF document.",
            )

        if not extracted or len(extracted.strip()) < 20:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This PDF does not contain readable text. Please upload a text-based PDF or paste your resume text.",
            )
        raw_text = extracted
    elif resume_text:
        raw_text = resume_text

    if not raw_text or not raw_text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide a PDF resume or enter at least 20 characters of resume text.",
        )

    if len(raw_text.strip()) < 20:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Resume text is too short. Please provide at least 20 characters.",
        )

    return perform_resume_analysis(raw_text)


@router.post("/job-match", response_model=JobMatchResponse)
def match_job(
    request: JobMatchRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    job_title = request.job_title or "Target Role"
    job_description = request.job_description or ""

    if request.job_id:
        result = db.execute(
            select(Job, Company)
            .join(Company, Job.company_id == Company.id)
            .where(
                Job.id == request.job_id,
                Company.user_id == current_user.id,
            )
        ).first()

        if result is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job not found or does not belong to you",
            )
        job, company = result
        job_title = job.title
        job_description = f"{job.title} at {company.name}. {job.description or ''}"

    resume_skills = set([s.lower() for s in extract_skills_from_text(request.resume_text)])
    job_skills = set([s.lower() for s in extract_skills_from_text(job_description + " " + job_title)])

    # If job description didn't mention specific tech keywords, look for words in job title
    if not job_skills:
        for word in re.findall(r"\b\w+\b", job_title.lower()):
            if word in TECH_SKILLS:
                job_skills.add(word)

    if not job_skills:
        # Default minimum baseline skills if job has no detailed description
        job_skills = {"git", "communication", "problem solving"}

    matched = resume_skills.intersection(job_skills)
    missing = job_skills - resume_skills

    match_percentage = int((len(matched) / max(len(job_skills), 1)) * 100)
    match_percentage = min(max(match_percentage, 10), 100)

    suggestions = []
    if missing:
        missing_list = sorted([s.title() for s in missing])
        suggestions.append(f"Consider highlighting experience with key missing skills: {', '.join(missing_list[:5])}.")
    if match_percentage < 60:
        suggestions.append("Tailor your work experience bullet points to mirror the specific terminology in this job description.")
    else:
        suggestions.append("Strong keyword alignment! Emphasize relevant project accomplishments during interview rounds.")

    baseline = JobMatchResponse(
        job_title=job_title,
        match_percentage=match_percentage,
        matched_skills=sorted([s.title() for s in matched]),
        missing_skills=sorted([s.title() for s in missing]),
        keywords=sorted([s.title() for s in job_skills]),
        improvement_suggestions=suggestions,
        provider_configured=False,
        provider_note=BANNER_STANDARD,
    )

    if gemini_service.is_configured():
        return gemini_service.enhance_job_match(
            resume_text=request.resume_text,
            job_title=job_title,
            job_description=job_description,
            fallback=baseline,
        )

    return baseline


@router.post("/interview-questions", response_model=InterviewQuestionsResponse)
def generate_interview_questions(
    request: InterviewQuestionsRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    role = request.job_title or "Software Developer"
    description = request.job_description or ""

    if request.interview_id:
        result = db.execute(
            select(Interview, Application, Job, Company)
            .join(Application, Interview.application_id == Application.id)
            .join(Job, Application.job_id == Job.id)
            .join(Company, Job.company_id == Company.id)
            .where(
                Interview.id == request.interview_id,
                Application.user_id == current_user.id,
                Company.user_id == current_user.id,
            )
        ).first()

        if result is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Interview not found or does not belong to you",
            )
        interview, application, job, company = result
        role = f"{job.title} at {company.name}"
        description = job.description or ""
    elif request.job_id:
        result = db.execute(
            select(Job, Company)
            .join(Company, Job.company_id == Company.id)
            .where(
                Job.id == request.job_id,
                Company.user_id == current_user.id,
            )
        ).first()

        if result is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job not found or does not belong to you",
            )
        job, company = result
        role = f"{job.title} at {company.name}"
        description = job.description or ""

    detected_skills = extract_skills_from_text(description + " " + role)
    primary_skill = detected_skills[0] if detected_skills else "modern software engineering"

    questions_by_category = {
        "Technical": [
            f"How have you architected and optimized applications using {primary_skill} in production?",
            "Describe how you handle asynchronous state management, latency, and error boundaries.",
            "Walk through your approach to designing resilient RESTful APIs and database schemas.",
            "How do you profile, identify, and resolve performance bottlenecks or database query slowness?",
        ],
        "Role-specific": [
            f"What experience do you have tackling the core responsibilities of a {role}?",
            f"How would you onboard into our codebase and deliver your first major feature as a {role}?",
            f"What architectural trade-offs would you consider when building key components for this position?",
        ],
        "Behavioral": [
            "Tell me about a time you resolved a major production bug under tight deadline constraints.",
            "Describe a situation where you had an engineering disagreement with a teammate. How did you align?",
            "Give an example of how you prioritized technical debt vs rapid feature shipping.",
        ],
        "HR": [
            f"What attracted you to apply for the {role} role?",
            "Where do you see your career growth over the next two years, and what culture helps you thrive?",
            "What are your expectations for work arrangement, team collaboration, and communication?",
        ],
    }

    baseline = InterviewQuestionsResponse(
        role=role,
        interview_type=request.interview_type,
        questions_by_category=questions_by_category,
        provider_configured=False,
        provider_note=BANNER_STANDARD,
    )

    if gemini_service.is_configured():
        return gemini_service.enhance_interview_questions(
            role=role,
            job_description=description,
            interview_type=request.interview_type,
            fallback=baseline,
        )

    return baseline


@router.post("/cover-letter", response_model=CoverLetterResponse)
def generate_cover_letter(
    request: CoverLetterRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    job_title = request.job_title or "Software Engineer"
    company_name = request.company_name or "Hiring Team"
    description = request.job_description or ""

    if request.job_id:
        result = db.execute(
            select(Job, Company)
            .join(Company, Job.company_id == Company.id)
            .where(
                Job.id == request.job_id,
                Company.user_id == current_user.id,
            )
        ).first()

        if result is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job not found or does not belong to you",
            )
        job, company = result
        job_title = job.title
        company_name = company.name
        description = job.description or ""

    skills = extract_skills_from_text(description + " " + (request.resume_text or ""))
    top_skills_str = ", ".join(skills[:4]) if skills else "modern software engineering, problem solving, and scalable architecture"

    applicant_name = current_user.full_name or "Applicant"
    applicant_email = current_user.email or "applicant@example.com"

    cover_letter_text = f"""Dear Hiring Team at {company_name},

I am writing to express my enthusiastic interest in the {job_title} opportunity at {company_name}. With hands-on experience in {top_skills_str}, I am eager to contribute to your engineering initiatives and help build high-impact, reliable software.

Throughout my experience, I have focused on writing clean, maintainable code, designing scalable system architectures, and collaborating closely with cross-functional teams to solve technical challenges. I am particularly excited about {company_name}'s mission and the technical roadmap for this role.

Key strengths I bring to the {job_title} role include:
• Proven proficiency with {top_skills_str} and agile development practices.
• A disciplined approach to automated testing, code quality, and performance optimization.
• A user-centric mindset focused on delivering reliable, resilient applications that drive business outcomes.

I welcome the opportunity to discuss how my background and enthusiasm align with your team's goals. Thank you for your time and consideration.

Sincerely,

{applicant_name}
{applicant_email}
"""

    baseline = CoverLetterResponse(
        cover_letter=cover_letter_text.strip(),
        job_title=job_title,
        company_name=company_name,
        provider_configured=False,
        provider_note=BANNER_STANDARD,
    )

    if gemini_service.is_configured():
        return gemini_service.enhance_cover_letter(
            job_title=job_title,
            company_name=company_name,
            job_description=description,
            resume_text=request.resume_text,
            applicant_name=applicant_name,
            applicant_email=applicant_email,
            fallback=baseline,
        )

    return baseline
