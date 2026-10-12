import { useState, useRef } from "react";
import {
  Target,
  Sparkles,
  Upload,
  FileText,
  RotateCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  X,
  BriefcaseBusiness,
} from "lucide-react";
import aiService from "../services/aiService";
import "./JobMatchSection.css";

export default function JobMatchSection({ job, savedResult, onMatchCalculated }) {
  const [matchResult, setMatchResult] = useState(savedResult || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [inputMode, setInputMode] = useState("text"); // 'text' | 'pdf'
  const [resumeText, setResumeText] = useState(() => {
    try {
      return localStorage.getItem("hiretrack_user_resume_text") || "";
    } catch {
      return "";
    }
  });
  const [resumeFile, setResumeFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showInputForm, setShowInputForm] = useState(!savedResult);
  const fileInputRef = useRef(null);

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
    setError("");
    const isPdf = file.name.toLowerCase().endsWith(".pdf") || file.type === "application/pdf";
    if (!isPdf) {
      setError("Only .pdf files are supported. Please select a valid PDF.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("File size exceeds 10 MB limit.");
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
    setError("");
    const isPdf = file.name.toLowerCase().endsWith(".pdf") || file.type === "application/pdf";
    if (!isPdf) {
      setError("Only .pdf files are supported. Please select a valid PDF.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("File size exceeds 10 MB limit.");
      return;
    }
    setResumeFile(file);
  };

  const handleTextFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === "string") {
        setResumeText(content);
        try {
          localStorage.setItem("hiretrack_user_resume_text", content);
        } catch {
          // ignore storage error
        }
        setError("");
      }
    };
    reader.readAsText(file);
  };

  const handleAnalyzeMatch = async (e) => {
    if (e) e.preventDefault();
    setError("");

    let textToAnalyze = resumeText.trim();

    // If PDF is selected, extract text first
    if (inputMode === "pdf") {
      if (!resumeFile) {
        setError("Please select a PDF resume file to analyze.");
        return;
      }
      try {
        setLoading(true);
        const extracted = await aiService.analyzeResume(resumeFile);
        if (extracted && extracted.extracted_text) {
          textToAnalyze = extracted.extracted_text;
          setResumeText(textToAnalyze);
          try {
            localStorage.setItem("hiretrack_user_resume_text", textToAnalyze);
          } catch {
            // ignore
          }
        } else {
          setError("Could not extract readable text from the uploaded PDF.");
          setLoading(false);
          return;
        }
      } catch (err) {
        console.error("PDF text extraction failed:", err);
        setError(err.response?.data?.detail || "Failed to process PDF resume.");
        setLoading(false);
        return;
      }
    } else {
      if (!textToAnalyze || textToAnalyze.length < 20) {
        setError("Please provide at least 20 characters of resume text to analyze match.");
        return;
      }
    }

    try {
      setLoading(true);
      const payload = {
        job_id: job.id,
        resume_text: textToAnalyze,
      };
      const result = await aiService.matchJob(payload);
      setMatchResult(result);
      setShowInputForm(false);
      try {
        localStorage.setItem(`hiretrack_job_match_${job.id}`, JSON.stringify(result));
      } catch {
        // ignore storage error
      }
      if (onMatchCalculated) {
        onMatchCalculated(job.id, result);
      }
    } catch (err) {
      console.error("Job match analysis failed:", err);
      setError(err.response?.data?.detail || "Failed to compute job match. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getScoreColorClass = (score) => {
    if (score >= 75) return "score-high";
    if (score >= 50) return "score-medium";
    return "score-low";
  };

  return (
    <div className="job-match-section brutalist-card">
      <div className="job-match-header">
        <div className="job-match-title-group">
          <Target size={18} className="job-match-icon" />
          <div>
            <h3>Job Match & Fit Analysis</h3>
            <p className="job-match-subtitle">
              Evaluate your resume alignment with this position using AI keyword matching.
            </p>
          </div>
        </div>

        {matchResult && !showInputForm && (
          <div className="job-match-quick-badge">
            <span className={`match-badge-pill ${getScoreColorClass(matchResult.match_percentage)}`}>
              {matchResult.match_percentage}% Match
            </span>
          </div>
        )}
      </div>

      {/* INPUT FORM */}
      {showInputForm && (
        <div className="job-match-form-container">
          <div className="job-match-mode-tabs">
            <button
              type="button"
              className={`job-match-mode-tab ${inputMode === "text" ? "active" : ""}`}
              onClick={() => {
                setInputMode("text");
                setError("");
              }}
            >
              <FileText size={14} />
              <span>Paste Text</span>
            </button>
            <button
              type="button"
              className={`job-match-mode-tab ${inputMode === "pdf" ? "active" : ""}`}
              onClick={() => {
                setInputMode("pdf");
                setError("");
              }}
            >
              <Upload size={14} />
              <span>Upload PDF</span>
            </button>
          </div>

          {inputMode === "text" && (
            <div className="job-match-text-group">
              <div className="job-match-text-header">
                <label htmlFor={`job-match-text-${job.id}`}>Candidate Resume Content *</label>
                <label className="upload-txt-btn" title="Upload text file">
                  <Upload size={13} />
                  <span>Import .txt / .md</span>
                  <input
                    type="file"
                    accept=".txt,.md,.rtf,.json"
                    onChange={handleTextFileUpload}
                    style={{ display: "none" }}
                  />
                </label>
              </div>

              <textarea
                id={`job-match-text-${job.id}`}
                rows={5}
                placeholder="Paste your resume summary, work experience, and tech skills here..."
                value={resumeText}
                onChange={(e) => {
                  setResumeText(e.target.value);
                  try {
                    localStorage.setItem("hiretrack_user_resume_text", e.target.value);
                  } catch {
                    // ignore
                  }
                }}
              />
              <div className="job-match-char-count">
                {resumeText.trim().length} characters • {resumeText.trim().split(/\s+/).filter(Boolean).length} words
                {resumeText.trim() && " (Saved to session)"}
              </div>
            </div>
          )}

          {inputMode === "pdf" && (
            <div className="job-match-pdf-group">
              {!resumeFile ? (
                <div
                  className={`job-match-dropzone ${isDragging ? "dragging" : ""}`}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                >
                  <Upload size={24} />
                  <p>Drop PDF resume here, or click to browse</p>
                  <span className="dropzone-hint">PDF up to 10 MB</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleFileSelect}
                    style={{ display: "none" }}
                  />
                </div>
              ) : (
                <div className="job-match-file-selected">
                  <div className="file-info-left">
                    <FileText size={20} />
                    <div>
                      <strong>{resumeFile.name}</strong>
                      <span className="file-size">{formatFileSize(resumeFile.size)}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="file-remove-btn"
                    onClick={() => {
                      setResumeFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    title="Remove file"
                  >
                    <X size={15} />
                  </button>
                </div>
              )}
            </div>
          )}

          {error && <div className="form-error job-match-error">{error}</div>}

          <div className="job-match-form-actions">
            <button
              type="button"
              className="brutalist-button primary match-submit-btn"
              onClick={handleAnalyzeMatch}
              disabled={loading || (inputMode === "pdf" ? !resumeFile : !resumeText.trim())}
            >
              <RotateCw size={15} className={loading ? "spin" : ""} />
              <span>{loading ? "Analyzing Role Match..." : "Calculate Job Match Score"}</span>
            </button>

            {matchResult && (
              <button
                type="button"
                className="brutalist-button"
                onClick={() => setShowInputForm(false)}
                disabled={loading}
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}

      {/* MATCH RESULTS PANEL */}
      {matchResult && !showInputForm && (
        <div className="job-match-results">
          {matchResult.provider_note && (
            <div className="job-match-provider-note">
              <Sparkles size={14} />
              <span>{matchResult.provider_note}</span>
            </div>
          )}

          {/* SCORE CARD */}
          <div className="job-match-score-card">
            <div className={`score-badge-circle ${getScoreColorClass(matchResult.match_percentage)}`}>
              <span className="score-val">{matchResult.match_percentage}%</span>
              <span className="score-tag">Match</span>
            </div>

            <div className="score-details-right">
              <h4>Role Alignment: {job.title}</h4>
              <p>
                Calculated overlap between required role skills and your candidate resume credentials.
              </p>
              <div className="score-progress-track">
                <div
                  className={`score-progress-fill ${getScoreColorClass(matchResult.match_percentage)}`}
                  style={{ width: `${matchResult.match_percentage}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* SKILLS BREAKDOWN */}
          <div className="job-match-skills-grid">
            <div className="match-skill-card matched-card">
              <div className="skill-card-head">
                <CheckCircle2 size={15} className="text-success" />
                <h5>Matched Skills ({matchResult.matched_skills.length})</h5>
              </div>
              {matchResult.matched_skills.length === 0 ? (
                <p className="empty-skill-msg">No exact keyword overlap detected yet.</p>
              ) : (
                <div className="skill-pills-wrap">
                  {matchResult.matched_skills.map((skill) => (
                    <span key={skill} className="skill-pill pill-match">
                      ✓ {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="match-skill-card missing-card">
              <div className="skill-card-head">
                <XCircle size={15} className="text-warning" />
                <h5>Missing / Recommended ({matchResult.missing_skills.length})</h5>
              </div>
              {matchResult.missing_skills.length === 0 ? (
                <p className="empty-skill-msg">All required keywords found in resume!</p>
              ) : (
                <div className="skill-pills-wrap">
                  {matchResult.missing_skills.map((skill) => (
                    <span key={skill} className="skill-pill pill-miss">
                      ✗ {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* KEYWORDS */}
          {matchResult.keywords && matchResult.keywords.length > 0 && (
            <div className="match-keywords-card">
              <div className="skill-card-head">
                <BriefcaseBusiness size={14} />
                <h5>Key Role Competencies</h5>
              </div>
              <div className="skill-pills-wrap">
                {matchResult.keywords.map((kw) => (
                  <span key={kw} className="skill-pill pill-kw">
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* SUGGESTIONS */}
          {matchResult.improvement_suggestions && matchResult.improvement_suggestions.length > 0 && (
            <div className="match-suggestions-card">
              <div className="skill-card-head">
                <AlertCircle size={14} />
                <h5>Optimization Suggestions</h5>
              </div>
              <ul className="suggestions-list">
                {matchResult.improvement_suggestions.map((sug, idx) => (
                  <li key={idx}>{sug}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="job-match-results-actions">
            <button
              type="button"
              className="brutalist-button"
              onClick={() => setShowInputForm(true)}
            >
              <RotateCw size={14} />
              <span>Update Resume / Re-Analyze</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
