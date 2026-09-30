import { useEffect, useState } from "react";
import {
  Calendar,
  CalendarDays,
  Clock,
  Video,
  MapPin,
  Plus,
  X,
  Building2,
} from "lucide-react";

import interviewService from "../services/interviewService";
import applicationService from "../services/applicationService";
import "./Interviews.css";

function Interviews() {
  const [interviews, setInterviews] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  const [formData, setFormData] = useState({
    application_id: "",
    interview_date: "",
    interview_type: "technical",
    meeting_link: "",
    notes: "",
    status: "scheduled",
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadInterviews();
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      const data = await applicationService.getApplications();
      setApplications(data);
    } catch (err) {
      console.error("Failed to load applications:", err);
    }
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleFormSubmit = async (event) => {
    event.preventDefault();

    if (!formData.application_id || !formData.interview_date) {
      setError("Please fill in all required fields.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      await interviewService.createInterview({
        ...formData,
        application_id: Number(formData.application_id),
      });

      setShowAddModal(false);

      setFormData({
        application_id: "",
        interview_date: "",
        interview_type: "technical",
        meeting_link: "",
        notes: "",
        status: "scheduled",
      });

      await loadInterviews();
    } catch (err) {
      console.error("Failed to create interview:", err);

      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError("Failed to create interview.");
      }
    } finally {
      setSaving(false);
    }
  };

  const loadInterviews = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await interviewService.getInterviews();
      setInterviews(data);
    } catch (err) {
      console.error("Failed to load interviews:", err);

      if (err.response?.status === 401) {
        setError("Your session has expired. Please log in again.");
      } else {
        setError("Failed to load interviews.");
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not specified";
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

  const getStatusClass = (status) => {
    switch (status) {
      case "scheduled":
        return "scheduled";
      case "completed":
        return "completed";
      case "cancelled":
        return "cancelled";
      case "rescheduled":
        return "rescheduled";
      default:
        return "";
    }
  };

  return (
    <div className="page-container jobs-page interviews-page">
      {/* PAGE HEADER */}
      <section className="page-header brutalist-card">
        <div>
          <span className="eyebrow">Career Tracker</span>

          <h1 className="page-title">Interviews</h1>

          <p>Keep track of your upcoming and completed interviews.</p>
        </div>

        <button
          className="brutalist-button primary"
          onClick={() => {
            setError("");
            setShowAddModal(true);
          }}
        >
          <Plus size={17} />
          Add Interview
        </button>
      </section>

      {/* ERROR */}
      {error && <div className="form-error">{error}</div>}

      {/* INTERVIEW LIST */}
      <section className="jobs-list brutalist-card">
        <div className="section-header">
          <div className="section-heading">
            <Calendar size={21} />

            <h2>Your Interviews</h2>
          </div>

          <span className="job-count">
            {interviews.length} {interviews.length === 1 ? "interview" : "interviews"}
          </span>
        </div>

        {loading ? (
          <div className="empty-state">Loading interviews...</div>
        ) : interviews.length === 0 ? (
          <div className="empty-state">
            No interviews yet. Add an interview to start tracking your schedule.
          </div>
        ) : (
          <div className="interviews-grid">
            {interviews.map((interview) => (
              <div className="interview-card" key={interview.id}>
                <div className="interview-card-left">
                  <div className="company-logo">
                    {interview.company_name
                      ? interview.company_name.charAt(0).toUpperCase()
                      : "C"}
                  </div>

                  <span className="job-type">
                    {interview.interview_type || "Technical"}
                  </span>
                </div>

                <div className="interview-main">
                  <h3>{interview.job_title || "Interview"}</h3>

                  <p className="interview-company">
                    <Building2 size={15} />
                    {interview.company_name || "Company"}
                  </p>

                  {interview.notes && (
                    <p className="interview-notes-text">
                      <span>Note:</span> {interview.notes}
                    </p>
                  )}
                </div>

                <div className="interview-meta">
                  <span
                    className={`status-tag ${getStatusClass(
                      interview.status
                    )}`}
                  >
                    {interview.status}
                  </span>

                  <div className="interview-schedule">
                    <p className="interview-date">
                      <CalendarDays size={14} />
                      {formatDate(interview.interview_date)}
                    </p>

                    <p className="interview-time">
                      <Clock size={14} />
                      {formatTime(interview.interview_date)}
                    </p>
                  </div>
                </div>

                <div className="interview-card-footer">
                  {interview.meeting_link ? (
                    <a
                      href={interview.meeting_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="view-job-button join-btn"
                    >
                      <Video size={14} />
                      Join Meeting
                    </a>
                  ) : (
                    <button
                      className="view-job-button disabled"
                      disabled
                    >
                      <MapPin size={14} />
                      No Link
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ADD INTERVIEW MODAL */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="add-application-modal brutalist-card">
            <div className="modal-header">
              <div>
                <span className="eyebrow">Career Tracker</span>

                <h2>Add Interview</h2>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={() => setShowAddModal(false)}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit}>
              {/* APPLICATION */}
              <div className="form-group">
                <label htmlFor="application_id">Application</label>

                <select
                  id="application_id"
                  name="application_id"
                  value={formData.application_id}
                  onChange={handleFormChange}
                  required
                >
                  <option value="">Select an application</option>

                  {applications.map((application) => (
                    <option key={application.id} value={application.id}>
                      {application.job_title} — {application.company_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* DATE + TYPE */}
              <div className="salary-row">
                <div className="form-group">
                  <label htmlFor="interview_date">Date & Time</label>

                  <input
                    id="interview_date"
                    name="interview_date"
                    type="datetime-local"
                    value={formData.interview_date}
                    onChange={handleFormChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="interview_type">Interview Type</label>

                  <select
                    id="interview_type"
                    name="interview_type"
                    value={formData.interview_type}
                    onChange={handleFormChange}
                  >
                    <option value="technical">Technical</option>
                    <option value="hr">HR</option>
                    <option value="behavioral">Behavioral</option>
                    <option value="screening">Screening</option>
                    <option value="final">Final</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              {/* MEETING LINK */}
              <div className="form-group">
                <label htmlFor="meeting_link">Meeting Link</label>

                <input
                  id="meeting_link"
                  name="meeting_link"
                  type="url"
                  placeholder="https://meet.google.com/..."
                  value={formData.meeting_link}
                  onChange={handleFormChange}
                />
              </div>

              {/* NOTES */}
              <div className="form-group">
                <label htmlFor="notes">Notes</label>

                <textarea
                  id="notes"
                  name="notes"
                  rows="4"
                  placeholder="Add interview preparation notes..."
                  value={formData.notes}
                  onChange={handleFormChange}
                />
              </div>

              {/* ERROR */}
              {error && <div className="form-error">{error}</div>}

              {/* MODAL ACTIONS */}
              <div className="modal-actions">
                <button
                  type="button"
                  className="brutalist-button"
                  onClick={() => setShowAddModal(false)}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="brutalist-button primary"
                  disabled={saving}
                >
                  <Plus size={17} />
                  {saving ? "Adding..." : "Add Interview"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Interviews;