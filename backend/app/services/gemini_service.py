import json
import logging
import re
from typing import Any
from google import genai
from google.genai import types
from google.genai.errors import APIError

from app.database import settings
from app.schemas.ai import (
    CoverLetterResponse,
    InterviewQuestionsResponse,
    JobMatchResponse,
    ResumeAnalyzeResponse,
)

logger = logging.getLogger(__name__)

STATUS_ENHANCED = "Gemini Enhanced Mode"
STATUS_STANDARD = "Standard Analysis Mode"
BANNER_ENHANCED = "Enhanced AI analysis active"
BANNER_STANDARD = "Standard AI analysis active — enhanced generation is unavailable right now."


class GeminiService:
    def __init__(self) -> None:
        pass

    def is_configured(self) -> bool:
        return bool(settings.gemini_api_key and settings.gemini_api_key.strip())

    def get_model_name(self) -> str:
        return settings.gemini_model or "gemini-flash-latest"

    def _get_client(self) -> genai.Client | None:
        if not self.is_configured():
            return None
        try:
            return genai.Client(api_key=settings.gemini_api_key.strip())
        except Exception as e:
            logger.warning("Gemini client initialization failed: %s", self._sanitize_error(e))
            return None

    def _sanitize_error(self, err: Exception) -> str:
        msg = f"{type(err).__name__}: {str(err)}"
        if settings.gemini_api_key and settings.gemini_api_key in msg:
            msg = msg.replace(settings.gemini_api_key, "[REDACTED_API_KEY]")
        return msg[:300]

    def _extract_json(self, text: str) -> dict[str, Any] | None:
        if not text or not text.strip():
            return None
        cleaned = text.strip()
        # Strip markdown ```json ... ``` blocks if present
        match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", cleaned)
        if match:
            cleaned = match.group(1).strip()
        try:
            parsed = json.loads(cleaned)
            if isinstance(parsed, dict):
                return parsed
        except Exception:
            # Fallback: attempt to find the first '{' and last '}'
            start = cleaned.find("{")
            end = cleaned.rfind("}")
            if start != -1 and end != -1 and end > start:
                try:
                    parsed = json.loads(cleaned[start : end + 1])
                    if isinstance(parsed, dict):
                        return parsed
                except Exception:
                    pass
        return None

    def _generate_content(
        self,
        client: genai.Client,
        prompt: str,
        config: types.GenerateContentConfig | None = None,
    ) -> Any:
        primary_model = self.get_model_name()
        candidates = [primary_model]
        for backup in ["gemini-flash-latest", "gemini-3.5-flash-lite", "gemini-3.5-flash"]:
            if backup not in candidates:
                candidates.append(backup)

        last_error: Exception | None = None
        for model in candidates:
            try:
                return client.models.generate_content(
                    model=model,
                    contents=prompt,
                    config=config,
                )
            except Exception as e:
                last_error = e
                logger.warning(
                    "Gemini generation with %s encountered error (%s).",
                    model,
                    self._sanitize_error(e),
                )
        if last_error:
            raise last_error
        raise RuntimeError("No model candidates available for Gemini generation.")

    def enhance_resume_analysis(
        self,
        resume_text: str,
        fallback: ResumeAnalyzeResponse,
    ) -> ResumeAnalyzeResponse:
        client = self._get_client()
        if not client:
            return fallback

        prompt = f"""You are an expert technical recruiter and resume auditor.
Analyze the following resume text objectively and thoroughly.

Resume text:
\"\"\"
{resume_text[:15000]}
\"\"\"

Produce a valid JSON object matching this schema:
{{
  "skills": ["List of verified technical, domain, and tool skills found in the resume"],
  "detected_sections": ["List of standard sections found, e.g. Summary, Experience, Education, Skills, Projects, Certifications"],
  "missing_sections": ["List of standard sections missing or needing inclusion"],
  "improvement_areas": ["List of 3 to 6 concrete, actionable recommendations covering action verbs, quantifiable metrics, section structure, and impact"],
  "resume_score": <integer from 15 to 98 reflecting overall resume quality and completeness>
}}

Strict constraints:
- Do not fabricate experiences or skills not mentioned or reasonably implied.
- Return ONLY the JSON object.
"""
        try:
            config = types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.2,
            )
            response = self._generate_content(
                client,
                prompt,
                config=config,
            )
            data = self._extract_json(response.text or "")
            if not data:
                logger.warning("Gemini returned invalid JSON for resume analysis. Falling back to deterministic.")
                return fallback

            gemini_skills = [str(s).strip() for s in data.get("skills", []) if str(s).strip()]
            all_skills_map = {s.lower(): s for s in fallback.skills}
            for s in gemini_skills:
                if s.lower() not in all_skills_map:
                    all_skills_map[s.lower()] = s
            skills = sorted(list(all_skills_map.values())) if all_skills_map else fallback.skills

            canonical_detected = set(fallback.detected_sections)
            for s in data.get("detected_sections", []):
                lowered = str(s).lower()
                if any(k in lowered for k in ["summary", "objective", "profile", "about"]):
                    canonical_detected.add("Summary / Objective")
                elif any(k in lowered for k in ["experience", "employment", "work history"]):
                    canonical_detected.add("Experience / Employment")
                elif any(k in lowered for k in ["education", "academic", "degree"]):
                    canonical_detected.add("Education")
                elif any(k in lowered for k in ["skill", "competenc", "technolog"]):
                    canonical_detected.add("Skills")
                elif any(k in lowered for k in ["project", "portfolio"]):
                    canonical_detected.add("Projects")
                elif any(k in lowered for k in ["certif", "license"]):
                    canonical_detected.add("Certifications")
                elif str(s).strip():
                    canonical_detected.add(str(s).strip().title())

            detected = sorted(list(canonical_detected))
            canonical_all = [
                "Summary / Objective",
                "Experience / Employment",
                "Education",
                "Skills",
                "Projects",
                "Certifications",
            ]
            missing = [c for c in canonical_all if c not in detected]
            improvements = [str(i).strip() for i in data.get("improvement_areas", []) if str(i).strip()] or fallback.improvement_areas
            
            raw_score = data.get("resume_score", fallback.resume_score)
            try:
                score = int(raw_score)
                score = max(10, min(100, score))
            except (ValueError, TypeError):
                score = fallback.resume_score

            return ResumeAnalyzeResponse(
                skills=skills,
                detected_sections=detected,
                missing_sections=missing,
                improvement_areas=improvements,
                resume_score=score,
                word_count=fallback.word_count,
                provider_configured=True,
                provider_note=BANNER_ENHANCED,
                extracted_text=fallback.extracted_text,
            )
        except Exception as e:
            logger.warning("Gemini resume analysis failed: %s. Using deterministic fallback.", self._sanitize_error(e))
            return fallback

    def enhance_job_match(
        self,
        resume_text: str,
        job_title: str,
        job_description: str,
        fallback: JobMatchResponse,
    ) -> JobMatchResponse:
        client = self._get_client()
        if not client:
            return fallback

        prompt = f"""You are an expert career advisor and technical recruiter.
Evaluate the alignment between the candidate's resume and the target job opportunity.

Job Title: {job_title}
Job Description / Requirements:
\"\"\"
{job_description[:8000]}
\"\"\"

Candidate Resume Text:
\"\"\"
{resume_text[:12000]}
\"\"\"

Produce a valid JSON object matching this schema:
{{
  "match_percentage": <integer from 10 to 100 based on genuine skill, experience, and requirement fit>,
  "matched_skills": ["List of skills and qualifications present in the resume that match the job requirements"],
  "missing_skills": ["List of important skills or qualifications required by the job that are missing from the resume"],
  "keywords": ["List of essential keywords and core competencies for this job"],
  "improvement_suggestions": ["List of 2 to 4 actionable suggestions to optimize the candidate's resume for this specific role"]
}}

Strict constraints:
- Base the evaluation strictly on the provided job and resume text.
- Do not fabricate matched skills if the resume does not mention them.
- Return ONLY the JSON object.
"""
        try:
            config = types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.2,
            )
            response = self._generate_content(
                client,
                prompt,
                config=config,
            )
            data = self._extract_json(response.text or "")
            if not data:
                logger.warning("Gemini returned invalid JSON for job match. Falling back to deterministic.")
                return fallback

            raw_pct = data.get("match_percentage", fallback.match_percentage)
            try:
                match_pct = int(raw_pct)
                match_pct = max(10, min(100, match_pct))
            except (ValueError, TypeError):
                match_pct = fallback.match_percentage

            matched_skills = [str(s).strip() for s in data.get("matched_skills", []) if str(s).strip()] or fallback.matched_skills
            missing_skills = [str(s).strip() for s in data.get("missing_skills", []) if str(s).strip()] or fallback.missing_skills
            keywords = [str(k).strip() for k in data.get("keywords", []) if str(k).strip()] or fallback.keywords
            suggestions = [str(s).strip() for s in data.get("improvement_suggestions", []) if str(s).strip()] or fallback.improvement_suggestions

            return JobMatchResponse(
                job_title=job_title,
                match_percentage=match_pct,
                matched_skills=matched_skills,
                missing_skills=missing_skills,
                keywords=keywords,
                improvement_suggestions=suggestions,
                provider_configured=True,
                provider_note=BANNER_ENHANCED,
            )
        except Exception as e:
            logger.warning("Gemini job match failed: %s. Using deterministic fallback.", self._sanitize_error(e))
            return fallback

    def enhance_interview_questions(
        self,
        role: str,
        job_description: str,
        interview_type: str,
        fallback: InterviewQuestionsResponse,
    ) -> InterviewQuestionsResponse:
        client = self._get_client()
        if not client:
            return fallback

        prompt = f"""You are an experienced hiring manager and interview coach.
Generate tailored interview questions for a candidate preparing for the following position and interview stage.

Target Role: {role}
Interview Stage / Focus: {interview_type}
Job Context / Description:
\"\"\"
{job_description[:8000]}
\"\"\"

Generate 4 to 6 high-quality, probing questions for each of the 4 standard categories (giving special emphasis to the {interview_type} focus area):
1. "Technical"
2. "Role-specific"
3. "Behavioral"
4. "HR"

Produce a valid JSON object matching this schema:
{{
  "questions_by_category": {{
    "Technical": ["4 to 6 specific technical or problem-solving questions"],
    "Role-specific": ["4 to 6 questions about day-to-day role execution, domain challenges, and architecture"],
    "Behavioral": ["4 to 6 STAR-method behavioral questions about teamwork, conflict, or high-pressure situations"],
    "HR": ["4 to 6 cultural, motivation, and career trajectory questions"]
  }}
}}

Strict constraints:
- Tailor questions directly to {role} and the provided description.
- Do not create an autonomous conversation or agent.
- Return ONLY the JSON object.
"""
        try:
            config = types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.3,
            )
            response = self._generate_content(
                client,
                prompt,
                config=config,
            )
            data = self._extract_json(response.text or "")
            if not data or "questions_by_category" not in data or not isinstance(data["questions_by_category"], dict):
                logger.warning("Gemini returned invalid JSON for interview questions. Falling back to deterministic.")
                return fallback

            q_map = data["questions_by_category"]
            valid_categories = ["Technical", "Role-specific", "Behavioral", "HR"]
            cleaned_q_map = {}
            for cat in valid_categories:
                raw_list = q_map.get(cat, [])
                if isinstance(raw_list, list) and raw_list:
                    cleaned_q_map[cat] = [str(q).strip() for q in raw_list if str(q).strip()]
                else:
                    cleaned_q_map[cat] = fallback.questions_by_category.get(cat, [])

            return InterviewQuestionsResponse(
                role=role,
                interview_type=interview_type,
                questions_by_category=cleaned_q_map,
                provider_configured=True,
                provider_note=BANNER_ENHANCED,
            )
        except Exception as e:
            logger.warning("Gemini interview questions failed: %s. Using deterministic fallback.", self._sanitize_error(e))
            return fallback

    def enhance_cover_letter(
        self,
        job_title: str,
        company_name: str,
        job_description: str,
        resume_text: str | None,
        applicant_name: str,
        applicant_email: str,
        fallback: CoverLetterResponse,
    ) -> CoverLetterResponse:
        client = self._get_client()
        if not client:
            return fallback

        prompt = f"""You are a professional executive resume writer and career coach.
Write a concise, polished, and compelling cover letter for the applicant applying to the following position.

Applicant Name: {applicant_name}
Applicant Email: {applicant_email}
Target Company: {company_name}
Target Role: {job_title}
Job Description / Requirements:
\"\"\"
{job_description[:6000]}
\"\"\"
Applicant Resume / Profile:
\"\"\"
{(resume_text or "General software engineering background")[:8000]}
\"\"\"

Strict instructions:
- Use the actual role, company name, and candidate credentials.
- Do NOT fabricate fake employers, degrees, or years of experience not mentioned in the candidate resume/profile.
- Structure: Salutation to Hiring Team at {company_name}, strong opening expressing genuine interest, 2-3 focused body paragraphs aligning applicant's real skills with key job requirements, and a professional closing with applicant's name and contact info.
- Return ONLY the cover letter text, with no preamble, conversational remarks, or markdown code fence.
"""
        try:
            config = types.GenerateContentConfig(
                temperature=0.3,
            )
            response = self._generate_content(
                client,
                prompt,
                config=config,
            )
            letter_text = response.text or ""
            letter_text = letter_text.strip()
            # Clean any accidental outer markdown fences if returned
            if letter_text.startswith("```") and letter_text.endswith("```"):
                lines = letter_text.splitlines()
                if len(lines) > 2:
                    letter_text = "\n".join(lines[1:-1]).strip()

            if not letter_text or len(letter_text) < 100:
                logger.warning("Gemini returned too short cover letter. Falling back to deterministic.")
                return fallback

            return CoverLetterResponse(
                cover_letter=letter_text,
                job_title=job_title,
                company_name=company_name,
                provider_configured=True,
                provider_note=BANNER_ENHANCED,
            )
        except Exception as e:
            logger.warning("Gemini cover letter failed: %s. Using deterministic fallback.", self._sanitize_error(e))
            return fallback


gemini_service = GeminiService()
