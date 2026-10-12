import { useState } from "react";
import {
  CalendarDays,
  Video,
  Building2,
  BriefcaseBusiness,
  Sparkles,
  RotateCw,
  HelpCircle,
  FileText,
  ChevronDown,
  ChevronUp,
  X,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  MessageSquare,
  Check,
} from "lucide-react";
import aiService from "../services/aiService";
import "./InterviewPreparationModal.css";

const SUGGESTED_INTERVIEWER_QUESTIONS = [
  {
    category: "Role & Expectations",
    question: "What does success look like in the first 90 days for this role?",
  },
  {
    category: "Role & Expectations",
    question: "What are the most urgent technical priorities for the engineer stepping into this position?",
  },
  {
    category: "Team & Collaboration",
    question: "How is the engineering team structured, and how do product and engineering collaborate?",
  },
  {
    category: "Team & Collaboration",
    question: "How are architectural decisions and code reviews handled within the team?",
  },
  {
    category: "Engineering & Challenges",
    question: "What are the most demanding scalability or reliability challenges the team is tackling right now?",
  },
  {
    category: "Culture & Growth",
    question: "How does the organization support continuous learning, mentoring, and technical career growth?",
  },
];

const GUIDANCE_FRAMEWORKS = {
  Technical: {
    interviewerLookingFor: "Algorithmic thinking, architectural scalability, system trade-offs, and edge-case awareness.",
    keyPoints: "State your assumptions, break down the problem methodically, discuss time/space complexity, and explain why you chose this design over alternatives.",
    relevantSkills: "Data structures, distributed systems, resilient API design, query optimization, error handling.",
    commonMistakes: "Jumping directly into implementation without asking clarifying questions or ignoring scalability bottlenecks.",
  },
  "Role-specific": {
    interviewerLookingFor: "Direct hands-on domain mastery, familiarity with industry tooling, and pragmatic execution ability.",
    keyPoints: "Reference real production systems you built, quantify performance improvements or business outcomes, and highlight domain-specific constraints.",
    relevantSkills: "Framework patterns, state management, schema design, deployment pipelines, production debugging.",
    commonMistakes: "Speaking only in high-level theory without giving concrete examples from past production experience.",
  },
  Behavioral: {
    interviewerLookingFor: "Ownership, conflict resolution, accountability, communication under pressure, and team alignment.",
    keyPoints: "Structure your response using STAR (Situation, Task, Action, Result). Emphasize YOUR specific actions and the measurable end result.",
    relevantSkills: "Cross-functional leadership, blameless postmortems, stakeholder management, mentoring.",
    commonMistakes: "Saying 'we did' without clarifying your personal contribution, or speaking negatively about former teammates.",
  },
  HR: {
    interviewerLookingFor: "Culture alignment, authentic motivation for this specific company, career trajectory, and professional communication.",
    keyPoints: "Connect your career goals with the company's mission and product. Speak clearly about your work style, compensation expectations, and timeline.",
    relevantSkills: "Active listening, self-awareness, career planning, work-life balance alignment.",
    commonMistakes: "Giving generic canned answers or demonstrating lack of research into the company's core product and market.",
  },
};

export default function InterviewPreparationModal({
  interview,
  onClose,
  initialView = "prep", // 'prep' | 'details' | 'summary'
}) {
  const isCompletedOrCancelled =
    interview?.status === "completed" || interview?.status === "cancelled";

  // Determine initial active category based on interview_type
  const getDefaultCategory = () => {
    const type = (interview?.interview_type || "").toLowerCase();
    if (type.includes("tech")) return "Technical";
    if (type.includes("behav")) return "Behavioral";
    if (type.includes("hr") || type.includes("screen")) return "HR";
    if (type.includes("final")) return "Role-specific";
    return "all";
  };

  const [activeView, setActiveView] = useState(() => {
    if (isCompletedOrCancelled) return "summary";
    return initialView;
  });

  const [selectedCategory, setSelectedCategory] = useState(getDefaultCategory);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedGuidance, setExpandedGuidance] = useState({});

  // Local storage for generated questions
  const questionsStorageKey = `hiretrack_interview_questions_${interview?.id || "temp"}`;
  const [questionsData, setQuestionsData] = useState(() => {
    try {
      const saved = localStorage.getItem(questionsStorageKey);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Local storage for preparation notes
  const notesStorageKey = `hiretrack_interview_prep_${interview?.id || "temp"}`;
  const [prepNotes, setPrepNotes] = useState(() => {
    try {
      return localStorage.getItem(notesStorageKey) || "";
    } catch {
      return "";
    }
  });
  const [notesSaved, setNotesSaved] = useState(false);

  if (!interview) return null;

  // Sync notes to localStorage
  const handleNotesChange = (e) => {
    const val = e.target.value;
    setPrepNotes(val);
    try {
      localStorage.setItem(notesStorageKey, val);
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 2000);
    } catch (err) {
      console.error("Failed to save prep notes:", err);
    }
  };

  const toggleGuidance = (key) => {
    setExpandedGuidance((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleGenerateQuestions = async () => {
    try {
      setLoading(true);
      setError("");

      const payload = {
        interview_id: interview.id,
        job_id: interview.job_id || undefined,
        interview_type:
          selectedCategory !== "all"
            ? selectedCategory.toLowerCase()
            : interview.interview_type || "technical",
        job_title: interview.job_title || undefined,
      };

      const result = await aiService.generateInterviewQuestions(payload);
      setQuestionsData(result);

      try {
        localStorage.setItem(questionsStorageKey, JSON.stringify(result));
      } catch (err) {
        console.error("Failed to cache questions:", err);
      }
    } catch (err) {
      console.error("Failed to generate interview questions:", err);
      if (err.response?.status === 404) {
        setError("Interview or associated job not found, or you do not have permission.");
      } else if (err.response?.status === 401) {
        setError("Your session has expired. Please log in again.");
      } else {
        setError(
          err.response?.data?.detail ||
            "Unable to generate interview questions right now. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Date not specified";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const categoriesToDisplay = () => {
    if (!questionsData?.questions_by_category) return [];
    const all = questionsData.questions_by_category;

    if (selectedCategory !== "all") {
      const list = all[selectedCategory] || [];
      return [{ category: selectedCategory, questions: list }];
    }

    const order = ["Technical", "Role-specific", "Behavioral", "HR"];
    return order
      .filter((cat) => all[cat] && all[cat].length > 0)
      .map((cat) => ({
        category: cat,
        questions: all[cat],
      }));
  };

  return (
    <div className="interview-prep-overlay" onClick={onClose}>
      <div
        className="interview-prep-modal brutalist-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="interview-prep-header">
          <div className="interview-prep-header-left">
            <span className="eyebrow">
              <Sparkles size={13} />
              Interview Preparation
            </span>
            <h2 className="interview-prep-title">
              {interview.job_title || "Interview"}
            </h2>
            <div className="interview-prep-subtitle">
              <span className="interview-prep-company">
                <Building2 size={15} />
                {interview.company_name || "Company"}
              </span>
              <span>•</span>
              <span className="interview-type-tag">
                {(interview.interview_type || "Technical").toUpperCase()} INTERVIEW
              </span>
              <span>•</span>
              <span>
                {formatDate(interview.interview_date)} {formatTime(interview.interview_date)}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="interview-prep-close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="interview-prep-body">
          {/* INTERVIEW CONTEXT BANNER */}
          <div className="interview-meta-banner">
            <div className="interview-meta-grid">
              <div className="interview-meta-item">
                <span className="interview-meta-label">Schedule</span>
                <span className="interview-meta-value mono">
                  <CalendarDays size={14} />
                  {formatDate(interview.interview_date)} at {formatTime(interview.interview_date)}
                </span>
              </div>

              <div className="interview-meta-item">
                <span className="interview-meta-label">Interview Stage</span>
                <span className="interview-meta-value">
                  <BriefcaseBusiness size={14} />
                  {interview.interview_type ? interview.interview_type.toUpperCase() : "TECHNICAL"}
                </span>
              </div>

              <div className="interview-meta-item">
                <span className="interview-meta-label">Current Status</span>
                <span className="interview-meta-value">
                  <span className={`status-tag ${interview.status}`}>
                    {interview.status}
                  </span>
                </span>
              </div>

              {interview.meeting_link && (
                <div className="interview-meta-item">
                  <span className="interview-meta-label">Meeting Room</span>
                  <span className="interview-meta-value">
                    <a
                      href={interview.meeting_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="interview-prep-link-btn"
                    >
                      <Video size={13} />
                      Join Meeting
                    </a>
                  </span>
                </div>
              )}
            </div>

            {interview.notes && (
              <div className="interview-official-notes">
                <strong>Scheduled Notes</strong>
                {interview.notes}
              </div>
            )}
          </div>

          {/* NAVIGATION TABS */}
          <div className="interview-modal-nav">
            {!isCompletedOrCancelled ? (
              <>
                <button
                  type="button"
                  className={`modal-nav-tab ${activeView === "prep" ? "active" : ""}`}
                  onClick={() => setActiveView("prep")}
                >
                  <Sparkles size={14} />
                  Interview Preparation
                </button>
                <button
                  type="button"
                  className={`modal-nav-tab ${activeView === "notes" ? "active" : ""}`}
                  onClick={() => setActiveView("notes")}
                >
                  <FileText size={14} />
                  Preparation Notes
                </button>
                <button
                  type="button"
                  className={`modal-nav-tab ${activeView === "suggested" ? "active" : ""}`}
                  onClick={() => setActiveView("suggested")}
                >
                  <HelpCircle size={14} />
                  Questions to Ask
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className={`modal-nav-tab ${activeView === "summary" ? "active" : ""}`}
                  onClick={() => setActiveView("summary")}
                >
                  <CheckCircle2 size={14} />
                  Interview Summary
                </button>
                <button
                  type="button"
                  className={`modal-nav-tab ${activeView === "prep" ? "active" : ""}`}
                  onClick={() => setActiveView("prep")}
                >
                  <BookOpen size={14} />
                  Review Practice Questions
                </button>
                <button
                  type="button"
                  className={`modal-nav-tab ${activeView === "notes" ? "active" : ""}`}
                  onClick={() => setActiveView("notes")}
                >
                  <FileText size={14} />
                  Saved Notes
                </button>
              </>
            )}
          </div>

          {/* VIEW: COMPLETED / CANCELLED SUMMARY */}
          {activeView === "summary" && isCompletedOrCancelled && (
            <div className="completed-summary-view">
              <div className="summary-status-banner">
                <div>
                  <h3 style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: 800 }}>
                    Interview Completed & Archived
                  </h3>
                  <p style={{ margin: 0, fontSize: "13px", color: "var(--text-soft)" }}>
                    This interview was held on {formatDate(interview.interview_date)}. Preparation mode is archived.
                  </p>
                </div>
                <span className={`status-tag ${interview.status}`}>{interview.status}</span>
              </div>

              {interview.notes && (
                <div className="interview-official-notes">
                  <strong>Interview Debrief Notes</strong>
                  {interview.notes}
                </div>
              )}

              {prepNotes && (
                <div className="interview-official-notes">
                  <strong>Your Preparation Notes</strong>
                  <div style={{ whiteSpace: "pre-wrap", marginTop: "4px" }}>{prepNotes}</div>
                </div>
              )}

              <div className="summary-checklist">
                <h4>Recommended Follow-up Steps</h4>
                <ul>
                  <li>Send a thoughtful thank-you email to your interviewer(s) within 24 hours.</li>
                  <li>Write down questions you were asked while your memory is fresh.</li>
                  <li>Update your application status in HireTrack to track next rounds or offers.</li>
                </ul>
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  className="modal-nav-tab active"
                  onClick={() => setActiveView("prep")}
                >
                  <BookOpen size={14} />
                  Review Practice Questions
                </button>
              </div>
            </div>
          )}

          {/* VIEW: PREPARATION / PRACTICE */}
          {activeView === "prep" && (
            <>
              {/* CATEGORY PICKER & GENERATOR */}
              <div className="prep-category-picker">
                <p className="prep-category-picker-title">
                  Choose preparation focus:
                </p>

                <div className="prep-category-buttons">
                  {["all", "Technical", "Role-specific", "Behavioral", "HR"].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      className={`category-filter-btn ${
                        selectedCategory === cat ? "selected" : ""
                      }`}
                      onClick={() => setSelectedCategory(cat)}
                    >
                      {cat === "all" ? "All Categories" : cat}
                    </button>
                  ))}
                </div>

                <div className="prep-generate-action-row">
                  <button
                    type="button"
                    className="prep-generate-btn"
                    onClick={handleGenerateQuestions}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <RotateCw size={15} className="spin" />
                        Preparing your interview...
                      </>
                    ) : (
                      <>
                        <Sparkles size={15} />
                        {questionsData ? "Regenerate Questions" : "Generate Questions"}
                      </>
                    )}
                  </button>

                  <span className="prep-generate-status-info">
                    {loading
                      ? "Analyzing job context and generating targeted questions..."
                      : questionsData
                      ? "Custom questions ready for practice and review."
                      : "Generates targeted questions using the actual job requirements."}
                  </span>
                </div>
              </div>

              {/* ERROR ALERT */}
              {error && (
                <div className="form-error" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              {/* GENERATED QUESTIONS LIST */}
              {questionsData && (
                <div className="prep-results-container">
                  <div className="prep-results-header">
                    <h3 className="prep-results-title">
                      <Sparkles size={16} />
                      Targeted Interview Questions
                    </h3>

                    {questionsData.provider_note && (
                      <span className="prep-provider-badge">
                        {questionsData.provider_configured ? "✨ Gemini Enhanced" : "Standard Set"}
                      </span>
                    )}
                  </div>

                  {categoriesToDisplay().map(({ category, questions }) => {
                    const guidance = GUIDANCE_FRAMEWORKS[category] || GUIDANCE_FRAMEWORKS.Technical;

                    return (
                      <div className="prep-category-block" key={category}>
                        <div className="category-block-header">
                          <h3>{category} Questions</h3>
                          <span className="category-question-count">
                            {questions.length} {questions.length === 1 ? "question" : "questions"}
                          </span>
                        </div>

                        <div className="questions-list">
                          {questions.map((q, idx) => {
                            const guidanceKey = `${category}-${idx}`;
                            const isGuidanceOpen = !!expandedGuidance[guidanceKey];

                            return (
                              <div className="question-card" key={idx}>
                                <div className="question-card-top">
                                  <span className="question-index">{idx + 1}</span>
                                  <p className="question-text">{q}</p>
                                </div>

                                <div className="question-actions">
                                  <button
                                    type="button"
                                    className="guidance-toggle-btn"
                                    onClick={() => toggleGuidance(guidanceKey)}
                                  >
                                    <HelpCircle size={13} />
                                    {isGuidanceOpen ? "Hide Answer Guidance" : "Show Answer Guidance"}
                                    {isGuidanceOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                  </button>
                                </div>

                                {isGuidanceOpen && (
                                  <div className="guidance-box">
                                    <span className="guidance-title">
                                      <BookOpen size={13} />
                                      Answer Guidance & Best Practices
                                    </span>

                                    <div className="guidance-grid">
                                      <div className="guidance-section">
                                        <span className="guidance-section-label">What Interviewers Look For:</span>
                                        <p>{guidance.interviewerLookingFor}</p>
                                      </div>

                                      <div className="guidance-section">
                                        <span className="guidance-section-label">Key Points to Highlight:</span>
                                        <p>{guidance.keyPoints}</p>
                                      </div>

                                      <div className="guidance-section">
                                        <span className="guidance-section-label">Relevant Skills & Concepts:</span>
                                        <p>{guidance.relevantSkills}</p>
                                      </div>

                                      <div className="guidance-section">
                                        <span className="guidance-section-label">Common Pitfalls to Avoid:</span>
                                        <p>{guidance.commonMistakes}</p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* VIEW: PREPARATION NOTES */}
          {activeView === "notes" && (
            <div className="prep-notes-section">
              <div className="prep-notes-header">
                <h3>
                  <FileText size={16} />
                  Your Preparation Notes
                </h3>
                {notesSaved && (
                  <span className="notes-save-badge">
                    <Check size={13} /> Saved locally
                  </span>
                )}
              </div>
              <p className="prep-notes-subtext">
                Record key talking points, technical topics to revise, company research, and questions for your interviewer. Stored in your secure local session without overwriting official interview records.
              </p>
              <textarea
                className="prep-notes-textarea"
                rows={8}
                value={prepNotes}
                onChange={handleNotesChange}
                placeholder="• Core technical achievements to highlight...&#10;• Architecture trade-offs to discuss...&#10;• Recent company initiatives or engineering blogs...&#10;• Questions to ask the engineering manager..."
              />
            </div>
          )}

          {/* VIEW: SUGGESTED QUESTIONS TO ASK */}
          {activeView === "suggested" && (
            <div className="suggested-questions-section">
              <div className="suggested-questions-header">
                <h3>
                  <MessageSquare size={16} />
                  Suggested Questions to Ask the Interviewer
                </h3>
                <p>
                  Asking thoughtful questions demonstrates curiosity, technical ownership, and genuine interest in the team's mission.
                </p>
              </div>

              <div className="suggested-grid">
                {SUGGESTED_INTERVIEWER_QUESTIONS.map((item, i) => (
                  <div className="suggested-card" key={i}>
                    <span className="suggested-tag">{item.category}</span>
                    <p className="suggested-text">"{item.question}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
