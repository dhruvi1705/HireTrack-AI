import { useEffect, useState, useRef } from "react";
import {
  FileText,
  Target,
  HelpCircle,
  Mail,
  Copy,
  Check,
  RotateCw,
  Sparkles,
  AlertCircle,
  Upload,
  CheckCircle2,
  XCircle,
  BriefcaseBusiness,
  X,
} from "lucide-react";

import aiService from "../services/aiService";
import jobService from "../services/jobService";
import "./AiTools.css";

const TOOLS = [
  { id: "resume", label: "Resume Analyzer", icon: FileText, desc: "Audit sections, extract skills & score quality" },
  { id: "match", label: "Job Match Analyzer", icon: Target, desc: "Compare resume keywords with job requirements" },
  { id: "questions", label: "Interview Questions", icon: HelpCircle, desc: "Generate targeted questions by category" },
  { id: "cover-letter", label: "Cover Letter Generator", icon: Mail, desc: "Draft a role-tailored application letter" },
];

export default function AiTools() {
  const [activeTab, setActiveTab] = useState("resume");
  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);

  // Resume Analyzer state
  const [resumeInputMode, setResumeInputMode] = useState("pdf"); // 'pdf' | 'text'
  const [resumeFile, setResumeFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [resumeText, setResumeText] = useState("");
  const [resumeResult, setResumeResult] = useState(null);
  const [analyzingResume, setAnalyzingResume] = useState(false);
  const [resumeError, setResumeError] = useState("");
  const fileInputRef = useRef(null);

  // Job Match state
  const [matchJobId, setMatchJobId] = useState("");
  const [customJobDesc, setCustomJobDesc] = useState("");
  const [customJobTitle, setCustomJobTitle] = useState("");
  const [matchResult, setMatchResult] = useState(null);
  const [matchingJob, setMatchingJob] = useState(false);
  const [matchError, setMatchError] = useState("");

  // Interview Questions state
  const [questionJobId, setQuestionJobId] = useState("");
  const [customQRole, setCustomQRole] = useState("");
  const [customQDesc, setCustomQDesc] = useState("");
  const [interviewType, setInterviewType] = useState("technical");
  const [questionsResult, setQuestionsResult] = useState(null);
  const [generatingQuestions, setGeneratingQuestions] = useState(false);
  const [questionsError, setQuestionsError] = useState("");

  // Cover Letter state
  const [coverJobId, setCoverJobId] = useState("");
  const [customCLCompany, setCustomCLCompany] = useState("");
  const [customCLRole, setCustomCLRole] = useState("");
  const [coverResult, setCoverResult] = useState(null);
  const [generatingCover, setGeneratingCover] = useState(false);
  const [coverError, setCoverError] = useState("");
  const [copiedCover, setCopiedCover] = useState(false);

  // Provider Status state
  const [providerStatus, setProviderStatus] = useState(null);

  useEffect(() => {
    let ignore = false;
    jobService
      .getJobs()
      .then((data) => {
        if (!ignore) {
          setJobs(data || []);
        }
      })
      .catch((err) => {
        console.error("Failed to load jobs for AI tools:", err);
      })
      .finally(() => {
        if (!ignore) {
          setLoadingJobs(false);
        }
      });

    aiService
      .getStatus()
      .then((statusData) => {
        if (!ignore && statusData) {
          setProviderStatus(statusData);
        }
      })
      .catch((err) => {
        console.warn("Could not retrieve AI provider status:", err);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setResumeError("");
    const isPdf = file.name.toLowerCase().endsWith(".pdf") || file.type === "application/pdf";
    if (!isPdf) {
      setResumeError("Only .pdf files are supported. Please select a PDF file.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setResumeError("File size exceeds the 10 MB limit. Please select a smaller PDF.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setResumeFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer?.files?.[0];
    if (!file) return;
    setResumeError("");
    const isPdf = file.name.toLowerCase().endsWith(".pdf") || file.type === "application/pdf";
    if (!isPdf) {
      setResumeError("Only .pdf files are supported. Please select a PDF file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setResumeError("File size exceeds the 10 MB limit. Please select a smaller PDF.");
      return;
    }
    setResumeFile(file);
  };

  const handleRemoveFile = () => {
    setResumeFile(null);
    setResumeError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // 1. Resume Analyzer Handler
  const handleAnalyzeResume = async (e) => {
    e.preventDefault();
    setResumeError("");

    if (resumeInputMode === "pdf") {
      if (!resumeFile) {
        setResumeError("Please select a PDF resume file to analyze.");
        return;
      }
    } else {
      if (!resumeText.trim() || resumeText.trim().length < 20) {
        setResumeError("Please enter at least 20 characters of resume text.");
        return;
      }
    }

    try {
      setAnalyzingResume(true);
      let res;
      if (resumeInputMode === "pdf") {
        res = await aiService.analyzeResume(resumeFile);
        if (res.extracted_text) {
          setResumeText(res.extracted_text);
        }
      } else {
        res = await aiService.analyzeResume(resumeText.trim());
      }
      setResumeResult(res);
    } catch (err) {
      console.error("Resume analysis failed:", err);
      const detail = err.response?.data?.detail;
      if (typeof detail === "string") {
        setResumeError(detail);
      } else if (err.response?.status === 413) {
        setResumeError("File size exceeds the 10 MB limit. Please upload a smaller PDF.");
      } else {
        setResumeError("Failed to analyze resume. Please try again.");
      }
    } finally {
      setAnalyzingResume(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.match(/\.(txt|md|rtf|json)$/i)) {
      setResumeError("For raw text extraction, please upload a .txt, .md, or .json file, or paste your text directly.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === "string") {
        setResumeText(content);
        setResumeError("");
      }
    };
    reader.onerror = () => {
      setResumeError("Could not read uploaded file.");
    };
    reader.readAsText(file);
  };


  // 2. Job Match Handler
  const handleMatchJob = async (e) => {
    e.preventDefault();
    if (!resumeText.trim()) {
      setMatchError("Please ensure resume text is provided above or pasted here.");
      return;
    }

    try {
      setMatchingJob(true);
      setMatchError("");
      const payload = {
        resume_text: resumeText.trim(),
        job_id: matchJobId ? Number(matchJobId) : null,
        job_title: customJobTitle.trim() || null,
        job_description: customJobDesc.trim() || null,
      };
      const res = await aiService.matchJob(payload);
      setMatchResult(res);
    } catch (err) {
      console.error("Job match analysis failed:", err);
      setMatchError(err.response?.data?.detail || "Failed to analyze job match.");
    } finally {
      setMatchingJob(false);
    }
  };

  // 3. Interview Questions Handler
  const handleGenerateQuestions = async (e) => {
    e.preventDefault();
    try {
      setGeneratingQuestions(true);
      setQuestionsError("");
      const payload = {
        job_id: questionJobId ? Number(questionJobId) : null,
        job_title: customQRole.trim() || null,
        job_description: customQDesc.trim() || null,
        interview_type: interviewType,
      };
      const res = await aiService.generateInterviewQuestions(payload);
      setQuestionsResult(res);
    } catch (err) {
      console.error("Generating interview questions failed:", err);
      setQuestionsError(err.response?.data?.detail || "Failed to generate interview questions.");
    } finally {
      setGeneratingQuestions(false);
    }
  };

  // 4. Cover Letter Handler
  const handleGenerateCover = async (e) => {
    e.preventDefault();
    try {
      setGeneratingCover(true);
      setCoverError("");
      const payload = {
        job_id: coverJobId ? Number(coverJobId) : null,
        company_name: customCLCompany.trim() || null,
        job_title: customCLRole.trim() || null,
        resume_text: resumeText.trim() || null,
      };
      const res = await aiService.generateCoverLetter(payload);
      setCoverResult(res);
    } catch (err) {
      console.error("Generating cover letter failed:", err);
      setCoverError(err.response?.data?.detail || "Failed to generate cover letter.");
    } finally {
      setGeneratingCover(false);
    }
  };

  const handleCopyCover = () => {
    if (!coverResult?.cover_letter) return;
    navigator.clipboard.writeText(coverResult.cover_letter);
    setCopiedCover(true);
    setTimeout(() => setCopiedCover(false), 2000);
  };

  return (
    <div className="page-container ai-tools-page">
      {/* PAGE HEADER */}
      <section className="page-header brutalist-card">
        <div>
          <span className="eyebrow">CAREER ASSISTIVE SUITE</span>
          <h1 className="page-title">AI Tools</h1>
          <p>Targeted career utilities to audit resumes, analyze job fit, and prepare for interviews.</p>
        </div>

        <div
          className={`provider-status-badge ${
            providerStatus?.provider_configured ? "enhanced" : "standard"
          }`}
          title={providerStatus?.banner_message || "AI Provider Status"}
        >
          <Sparkles size={16} />
          <span>
            {providerStatus?.status_label ||
              (providerStatus?.provider_configured
                ? "Gemini Enhanced Mode"
                : "Standard Analysis Mode")}
          </span>
        </div>
      </section>

      {providerStatus?.banner_message && (
        <div
          className={`ai-status-banner ${
            providerStatus.provider_configured ? "enhanced" : "standard"
          }`}
        >
          <Sparkles size={16} />
          <span>{providerStatus.banner_message}</span>
        </div>
      )}

      {/* TOOL SELECTOR TABS */}
      <section className="ai-tools-nav brutalist-card">
        <div className="ai-tabs-grid">
          {TOOLS.map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                className={`ai-tab-button ${isActive ? "active" : ""}`}
                onClick={() => setActiveTab(t.id)}
              >
                <div className="ai-tab-icon">
                  <Icon size={18} />
                </div>
                <div className="ai-tab-text">
                  <span className="ai-tab-title">{t.label}</span>
                  <span className="ai-tab-desc">{t.desc}</span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* =========================================================
          TOOL 1: RESUME ANALYZER
          ========================================================= */}
      {activeTab === "resume" && (
        <section className="ai-tool-content brutalist-card">
          <div className="tool-content-header">
            <div className="tool-title-group">
              <FileText size={20} />
              <div>
                <h2>Resume Analyzer</h2>
                <p>Inspect resume content for key technical skills, standard sections, and quantifiable metrics.</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleAnalyzeResume} className="ai-tool-form">
            {/* Input Method Selector */}
            <div className="resume-input-mode-tabs">
              <button
                type="button"
                className={`resume-mode-tab ${resumeInputMode === "pdf" ? "active" : ""}`}
                onClick={() => {
                  setResumeInputMode("pdf");
                  setResumeError("");
                }}
              >
                <Upload size={14} />
                <span>Upload PDF</span>
              </button>
              <button
                type="button"
                className={`resume-mode-tab ${resumeInputMode === "text" ? "active" : ""}`}
                onClick={() => {
                  setResumeInputMode("text");
                  setResumeError("");
                }}
              >
                <FileText size={14} />
                <span>Paste Text</span>
              </button>
            </div>

            {/* A. PDF Upload Mode */}
            {resumeInputMode === "pdf" && (
              <div className="resume-pdf-section">
                {!resumeFile ? (
                  <div
                    className={`pdf-dropzone brutalist-card ${isDragging ? "dragging" : ""}`}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                  >
                    <div className="pdf-upload-inner">
                      <div className="pdf-icon-circle">
                        <Upload size={28} />
                      </div>
                      <h3 className="pdf-upload-title">Upload your resume</h3>
                      <button
                        type="button"
                        className="brutalist-button primary choose-pdf-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          fileInputRef.current?.click();
                        }}
                      >
                        <FileText size={14} />
                        <span>Choose PDF</span>
                      </button>
                      <p className="pdf-upload-hint">PDF only • Max 10 MB</p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={handleFileSelect}
                      style={{ display: "none" }}
                    />
                  </div>
                ) : (
                  <div className="pdf-selected-card brutalist-card">
                    <div className="pdf-selected-info">
                      <div className="pdf-file-icon-box">
                        <FileText size={26} />
                      </div>
                      <div className="pdf-file-details">
                        <span className="pdf-filename" title={resumeFile.name}>
                          {resumeFile.name}
                        </span>
                        <span className="pdf-filesize">
                          {formatFileSize(resumeFile.size)}
                        </span>
                      </div>
                    </div>
                    <div className="pdf-selected-actions">
                      <button
                        type="button"
                        className="brutalist-button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={analyzingResume}
                      >
                        <span>Change PDF</span>
                      </button>
                      <button
                        type="button"
                        className="brutalist-button danger"
                        onClick={handleRemoveFile}
                        disabled={analyzingResume}
                        title="Remove PDF"
                      >
                        <X size={14} />
                        <span>Remove</span>
                      </button>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={handleFileSelect}
                      style={{ display: "none" }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* B. Paste Text Mode */}
            {resumeInputMode === "text" && (
              <div className="form-group">
                <div className="form-group-header">
                  <label htmlFor="resume-input">Resume Text / Content *</label>
                  <label className="upload-file-label brutalist-button" title="Upload .txt or .md file">
                    <Upload size={14} />
                    <span>Upload .txt / .md</span>
                    <input
                      type="file"
                      accept=".txt,.md,.rtf,.json"
                      onChange={handleFileUpload}
                      style={{ display: "none" }}
                    />
                  </label>
                </div>
                <textarea
                  id="resume-input"
                  rows={8}
                  placeholder="Paste your resume text here (Summary, Experience, Education, Skills, Projects)..."
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  required={resumeInputMode === "text"}
                />
                <span className="char-count">
                  {resumeText.trim().length} characters • {resumeText.trim().split(/\s+/).filter(Boolean).length} words
                </span>
              </div>
            )}

            {resumeError && <div className="form-error">{resumeError}</div>}

            <div className="tool-form-actions">
              <button
                type="submit"
                className="brutalist-button primary"
                disabled={
                  analyzingResume ||
                  (resumeInputMode === "pdf" ? !resumeFile : !resumeText.trim())
                }
              >
                <RotateCw size={16} className={analyzingResume ? "spin" : ""} />
                <span>{analyzingResume ? "Analyzing your resume..." : "Analyze Resume"}</span>
              </button>
            </div>
          </form>

          {resumeResult && (
            <div className="ai-results-panel">
              <div className="provider-disclosure-note">
                <AlertCircle size={15} />
                <span>{resumeResult.provider_note}</span>
              </div>

              {/* SCORE & STATS */}
              <div className="resume-score-card brutalist-card">
                <div className="score-display">
                  <span className="score-number">{resumeResult.resume_score}</span>
                  <span className="score-out-of">/ 100</span>
                </div>
                <div className="score-meta">
                  <h3>Calculated Quality Score</h3>
                  <p>
                    Based on verified section presence (40%), detected technical skill breadth (30%), quantifiable metrics & contact visibility (20%), and document length (10%).
                  </p>
                  <div className="score-bar-track">
                    <div
                      className="score-bar-fill"
                      style={{ width: `${resumeResult.resume_score}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* SECTIONS AUDIT */}
              <div className="results-grid-2col">
                <div className="audit-card brutalist-card">
                  <div className="audit-card-header">
                    <CheckCircle2 size={16} className="text-success" />
                    <h4>Detected Sections ({resumeResult.detected_sections.length})</h4>
                  </div>
                  {resumeResult.detected_sections.length === 0 ? (
                    <p className="empty-sub">No standard section headers found.</p>
                  ) : (
                    <div className="pill-list">
                      {resumeResult.detected_sections.map((sec) => (
                        <span key={sec} className="pill pill-success">✓ {sec}</span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="audit-card brutalist-card">
                  <div className="audit-card-header">
                    <XCircle size={16} className="text-warning" />
                    <h4>Missing Recommended Sections ({resumeResult.missing_sections.length})</h4>
                  </div>
                  {resumeResult.missing_sections.length === 0 ? (
                    <p className="empty-sub">All recommended resume sections are present!</p>
                  ) : (
                    <div className="pill-list">
                      {resumeResult.missing_sections.map((sec) => (
                        <span key={sec} className="pill pill-missing">✗ {sec}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* EXTRACTED SKILLS */}
              <div className="audit-card brutalist-card">
                <div className="audit-card-header">
                  <BriefcaseBusiness size={16} />
                  <h4>Extracted Technical & Domain Skills ({resumeResult.skills.length})</h4>
                </div>
                {resumeResult.skills.length === 0 ? (
                  <p className="empty-sub">No industry keywords matched the current tech skill vocabulary.</p>
                ) : (
                  <div className="pill-list">
                    {resumeResult.skills.map((skill) => (
                      <span key={skill} className="pill pill-skill">{skill}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* IMPROVEMENT AREAS */}
              {resumeResult.improvement_areas.length > 0 && (
                <div className="audit-card brutalist-card improvements-box">
                  <div className="audit-card-header">
                    <Target size={16} />
                    <h4>Targeted Improvement Recommendations</h4>
                  </div>
                  <ul className="improvement-list">
                    {resumeResult.improvement_areas.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* =========================================================
          TOOL 2: JOB MATCH ANALYZER
          ========================================================= */}
      {activeTab === "match" && (
        <section className="ai-tool-content brutalist-card">
          <div className="tool-content-header">
            <div className="tool-title-group">
              <Target size={20} />
              <div>
                <h2>Job Match Analyzer</h2>
                <p>Evaluate keyword alignment between your resume and a target job opportunity.</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleMatchJob} className="ai-tool-form">
            <div className="form-group">
              <label htmlFor="select-job">Select from Your Saved Jobs</label>
              {loadingJobs ? (
                <div className="loading-inline">Loading your jobs...</div>
              ) : jobs.length === 0 ? (
                <div className="empty-sub">
                  No jobs found in your workspace. You can enter a custom role description below.
                </div>
              ) : (
                <select
                  id="select-job"
                  value={matchJobId}
                  onChange={(e) => setMatchJobId(e.target.value)}
                >
                  <option value="">-- Choose a tracked job or enter custom --</option>
                  {jobs.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.title} ({j.company_name || "Company"})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {!matchJobId && (
              <div className="form-row-2col">
                <div className="form-group">
                  <label htmlFor="custom-job-title">Job Title (Optional)</label>
                  <input
                    id="custom-job-title"
                    type="text"
                    placeholder="e.g. Senior Frontend Engineer"
                    value={customJobTitle}
                    onChange={(e) => setCustomJobTitle(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="custom-job-desc">Job Description / Requirements (Optional)</label>
                  <textarea
                    id="custom-job-desc"
                    rows={3}
                    placeholder="Paste job description requirements and tech stack..."
                    value={customJobDesc}
                    onChange={(e) => setCustomJobDesc(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="match-resume-text">Resume Content to Compare *</label>
              <textarea
                id="match-resume-text"
                rows={6}
                placeholder="Paste your resume or skills summary here..."
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                required
              />
            </div>

            {matchError && <div className="form-error">{matchError}</div>}

            <div className="tool-form-actions">
              <button
                type="submit"
                className="brutalist-button primary"
                disabled={matchingJob || !resumeText.trim()}
              >
                <RotateCw size={16} className={matchingJob ? "spin" : ""} />
                <span>{matchingJob ? "Computing Match..." : "Calculate Job Match"}</span>
              </button>
            </div>
          </form>

          {matchResult && (
            <div className="ai-results-panel">
              <div className="provider-disclosure-note">
                <AlertCircle size={15} />
                <span>{matchResult.provider_note}</span>
              </div>

              <div className="resume-score-card brutalist-card">
                <div className="score-display">
                  <span className="score-number">{matchResult.match_percentage}%</span>
                </div>
                <div className="score-meta">
                  <h3>Target Match: {matchResult.job_title}</h3>
                  <p>
                    Match calculated as genuine skill overlap between required job keywords and extracted resume skills.
                  </p>
                  <div className="score-bar-track">
                    <div
                      className="score-bar-fill"
                      style={{ width: `${matchResult.match_percentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="results-grid-2col">
                <div className="audit-card brutalist-card">
                  <div className="audit-card-header">
                    <CheckCircle2 size={16} className="text-success" />
                    <h4>Matched Skills ({matchResult.matched_skills.length})</h4>
                  </div>
                  {matchResult.matched_skills.length === 0 ? (
                    <p className="empty-sub">No exact skills matched yet.</p>
                  ) : (
                    <div className="pill-list">
                      {matchResult.matched_skills.map((s) => (
                        <span key={s} className="pill pill-success">✓ {s}</span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="audit-card brutalist-card">
                  <div className="audit-card-header">
                    <XCircle size={16} className="text-warning" />
                    <h4>Missing / Recommended Skills ({matchResult.missing_skills.length})</h4>
                  </div>
                  {matchResult.missing_skills.length === 0 ? (
                    <p className="empty-sub">All detected job skills are covered in your resume!</p>
                  ) : (
                    <div className="pill-list">
                      {matchResult.missing_skills.map((s) => (
                        <span key={s} className="pill pill-missing">✗ {s}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {matchResult.improvement_suggestions.length > 0 && (
                <div className="audit-card brutalist-card improvements-box">
                  <div className="audit-card-header">
                    <Target size={16} />
                    <h4>Optimization Suggestions</h4>
                  </div>
                  <ul className="improvement-list">
                    {matchResult.improvement_suggestions.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* =========================================================
          TOOL 3: INTERVIEW QUESTION GENERATOR
          ========================================================= */}
      {activeTab === "questions" && (
        <section className="ai-tool-content brutalist-card">
          <div className="tool-content-header">
            <div className="tool-title-group">
              <HelpCircle size={20} />
              <div>
                <h2>Interview Question Generator</h2>
                <p>Generate relevant technical, role-specific, behavioral, and HR questions for any role.</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleGenerateQuestions} className="ai-tool-form">
            <div className="form-row-2col">
              <div className="form-group">
                <label htmlFor="question-job-id">Select Saved Job</label>
                <select
                  id="question-job-id"
                  value={questionJobId}
                  onChange={(e) => setQuestionJobId(e.target.value)}
                >
                  <option value="">-- Or enter custom role below --</option>
                  {jobs.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.title} ({j.company_name || "Company"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="interview-round-type">Interview Round Type</label>
                <select
                  id="interview-round-type"
                  value={interviewType}
                  onChange={(e) => setInterviewType(e.target.value)}
                >
                  <option value="technical">Technical Round</option>
                  <option value="behavioral">Behavioral Round</option>
                  <option value="hr">HR / Culture Fit</option>
                  <option value="screening">Screening Call</option>
                  <option value="final">Final Round</option>
                </select>
              </div>
            </div>

            {!questionJobId && (
              <div className="form-row-2col">
                <div className="form-group">
                  <label htmlFor="custom-q-role">Role Title</label>
                  <input
                    id="custom-q-role"
                    type="text"
                    placeholder="e.g. Full Stack Python / React Engineer"
                    value={customQRole}
                    onChange={(e) => setCustomQRole(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="custom-q-desc">Key Skills or Description</label>
                  <input
                    id="custom-q-desc"
                    type="text"
                    placeholder="e.g. PostgreSQL, FastAPI, Docker, Microservices"
                    value={customQDesc}
                    onChange={(e) => setCustomQDesc(e.target.value)}
                  />
                </div>
              </div>
            )}

            {questionsError && <div className="form-error">{questionsError}</div>}

            <div className="tool-form-actions">
              <button
                type="submit"
                className="brutalist-button primary"
                disabled={generatingQuestions}
              >
                <RotateCw size={16} className={generatingQuestions ? "spin" : ""} />
                <span>{generatingQuestions ? "Generating Questions..." : "Generate Interview Questions"}</span>
              </button>
            </div>
          </form>

          {questionsResult && (
            <div className="ai-results-panel">
              <div className="provider-disclosure-note">
                <AlertCircle size={15} />
                <span>{questionsResult.provider_note}</span>
              </div>

              <div className="questions-role-badge brutalist-card">
                <span>Target Preparation for:</span>
                <strong>{questionsResult.role}</strong>
                <span className="mono">({questionsResult.interview_type.toUpperCase()} FOCUS)</span>
              </div>

              <div className="questions-grid">
                {Object.entries(questionsResult.questions_by_category).map(([category, list]) => (
                  <div key={category} className="question-category-card brutalist-card">
                    <div className="question-cat-header">
                      <h3>{category} Questions</h3>
                      <span className="q-count-badge">{list.length}</span>
                    </div>
                    <ol className="question-list">
                      {list.map((q, idx) => (
                        <li key={idx} className="question-item">
                          <span>{q}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* =========================================================
          TOOL 4: COVER LETTER GENERATOR
          ========================================================= */}
      {activeTab === "cover-letter" && (
        <section className="ai-tool-content brutalist-card">
          <div className="tool-content-header">
            <div className="tool-title-group">
              <Mail size={20} />
              <div>
                <h2>Cover Letter Generator</h2>
                <p>Generate a professional, structured cover letter tailored to your profile and target company.</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleGenerateCover} className="ai-tool-form">
            <div className="form-group">
              <label htmlFor="cover-job-id">Select Target Job Opportunity</label>
              <select
                id="cover-job-id"
                value={coverJobId}
                onChange={(e) => setCoverJobId(e.target.value)}
              >
                <option value="">-- Select from your saved jobs, or enter manually below --</option>
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title} ({j.company_name || "Company"})
                  </option>
                ))}
              </select>
            </div>

            {!coverJobId && (
              <div className="form-row-2col">
                <div className="form-group">
                  <label htmlFor="custom-cl-company">Company Name</label>
                  <input
                    id="custom-cl-company"
                    type="text"
                    placeholder="e.g. Stripe, Acme Corp"
                    value={customCLCompany}
                    onChange={(e) => setCustomCLCompany(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="custom-cl-role">Job Title</label>
                  <input
                    id="custom-cl-role"
                    type="text"
                    placeholder="e.g. Senior Backend Engineer"
                    value={customCLRole}
                    onChange={(e) => setCustomCLRole(e.target.value)}
                  />
                </div>
              </div>
            )}

            {coverError && <div className="form-error">{coverError}</div>}

            <div className="tool-form-actions">
              <button
                type="submit"
                className="brutalist-button primary"
                disabled={generatingCover}
              >
                <RotateCw size={16} className={generatingCover ? "spin" : ""} />
                <span>{generatingCover ? "Generating Letter..." : "Generate Cover Letter"}</span>
              </button>
            </div>
          </form>

          {coverResult && (
            <div className="ai-results-panel">
              <div className="provider-disclosure-note">
                <AlertCircle size={15} />
                <span>{coverResult.provider_note}</span>
              </div>

              <div className="cover-letter-card brutalist-card">
                <div className="cover-letter-header">
                  <div>
                    <h3>{coverResult.job_title} Application</h3>
                    <span className="mono">Addressed to: {coverResult.company_name}</span>
                  </div>

                  <div className="cover-actions">
                    <button
                      type="button"
                      className="brutalist-button"
                      onClick={handleGenerateCover}
                      disabled={generatingCover}
                      title="Regenerate cover letter"
                    >
                      <RotateCw size={14} className={generatingCover ? "spin" : ""} />
                      <span>Regenerate</span>
                    </button>

                    <button
                      type="button"
                      className="brutalist-button primary"
                      onClick={handleCopyCover}
                    >
                      {copiedCover ? <Check size={14} /> : <Copy size={14} />}
                      <span>{copiedCover ? "Copied!" : "Copy to Clipboard"}</span>
                    </button>
                  </div>
                </div>

                <div className="cover-letter-body">
                  <pre>{coverResult.cover_letter}</pre>
                </div>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
