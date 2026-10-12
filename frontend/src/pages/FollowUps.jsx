import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  CheckCircle2,
  Clock,
  Plus,
  X,
  AlertTriangle,
  RotateCcw,
  Pencil,
  Trash2,
  Calendar,
  Search,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import followUpService from "../services/followUpService";
import applicationService from "../services/applicationService";
import "./FollowUps.css";

const FILTER_TABS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "overdue", label: "Overdue" },
  { key: "completed", label: "Completed" },
];

export default function FollowUps() {
  const navigate = useNavigate();

  const [followUps, setFollowUps] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingFollowUp, setEditingFollowUp] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [formData, setFormData] = useState({
    application_id: "",
    title: "",
    description: "",
    due_date: "",
    status: "pending",
  });

  const loadData = async (filter = activeFilter) => {
    try {
      setLoading(true);
      setError("");

      const params = filter === "all" ? {} : { status: filter };

      const [fuData, appData] = await Promise.all([
        followUpService.getFollowUps(params),
        applicationService.getApplications(),
      ]);

      setFollowUps(fuData || []);
      setApplications(appData || []);
    } catch (err) {
      console.error("Failed to load follow-ups:", err);
      if (err.response?.status === 401) {
        setError("Your session has expired. Please log in again.");
      } else {
        setError(err.response?.data?.detail || "Failed to load follow-ups.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;

    const fetchInitial = async () => {
      try {
        const params = activeFilter === "all" ? {} : { status: activeFilter };
        const [fuData, appData] = await Promise.all([
          followUpService.getFollowUps(params),
          applicationService.getApplications(),
        ]);
        if (!ignore) {
          setFollowUps(fuData || []);
          setApplications(appData || []);
        }
      } catch (err) {
        if (!ignore) {
          console.error("Failed to load follow-ups:", err);
          if (err.response?.status === 401) {
            setError("Your session has expired. Please log in again.");
          } else {
            setError(err.response?.data?.detail || "Failed to load follow-ups.");
          }
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    fetchInitial();

    return () => {
      ignore = true;
    };
  }, [activeFilter]);


  const handleOpenAddModal = () => {
    setEditingFollowUp(null);
    setFormError("");

    // Set default due_date to tomorrow at 09:00 AM local time
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);

    const pad = (n) => String(n).padStart(2, "0");
    const defaultLocalTime = `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(
      tomorrow.getDate()
    )}T${pad(tomorrow.getHours())}:${pad(tomorrow.getMinutes())}`;

    setFormData({
      application_id: applications.length > 0 ? String(applications[0].id) : "",
      title: "",
      description: "",
      due_date: defaultLocalTime,
      status: "pending",
    });

    setShowModal(true);
  };

  const handleOpenEditModal = (followUp) => {
    setEditingFollowUp(followUp);
    setFormError("");

    let localDateString = "";
    if (followUp.due_date) {
      const d = new Date(followUp.due_date);
      if (!isNaN(d.getTime())) {
        const pad = (n) => String(n).padStart(2, "0");
        localDateString = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
          d.getDate()
        )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
      }
    }

    setFormData({
      application_id: String(followUp.application_id),
      title: followUp.title || "",
      description: followUp.description || "",
      due_date: localDateString,
      status: followUp.status || "pending",
    });

    setShowModal(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (!formData.application_id) {
      setFormError("Please select an application.");
      return;
    }

    if (!formData.title.trim()) {
      setFormError("Please enter a title.");
      return;
    }

    if (!formData.due_date) {
      setFormError("Please select a due date and time.");
      return;
    }

    try {
      setSaving(true);
      setFormError("");

      const payload = {
        application_id: Number(formData.application_id),
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        due_date: new Date(formData.due_date).toISOString(),
        status: formData.status,
      };

      if (editingFollowUp) {
        await followUpService.updateFollowUp(editingFollowUp.id, payload);
      } else {
        await followUpService.createFollowUp(payload);
      }

      setShowModal(false);
      await loadData(activeFilter);
    } catch (err) {
      console.error("Failed to save follow-up:", err);
      setFormError(
        err.response?.data?.detail || "Failed to save follow-up. Please check your input."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (followUp) => {
    const nextStatus = followUp.status === "completed" ? "pending" : "completed";
    try {
      await followUpService.updateFollowUp(followUp.id, { status: nextStatus });
      await loadData(activeFilter);
    } catch (err) {
      console.error("Failed to update status:", err);
      setError("Failed to update reminder status.");
    }
  };

  const handleDelete = async (followUp) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete this follow-up: "${followUp.title}"?`
    );
    if (!confirmed) return;

    try {
      await followUpService.deleteFollowUp(followUp.id);
      await loadData(activeFilter);
    } catch (err) {
      console.error("Failed to delete follow-up:", err);
      setError("Failed to delete follow-up.");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "No date";
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "Invalid date";
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredFollowUps = useMemo(() => {
    if (!searchQuery.trim()) return followUps;
    const q = searchQuery.toLowerCase();
    return followUps.filter(
      (item) =>
        item.title?.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q) ||
        item.company_name?.toLowerCase().includes(q) ||
        item.job_title?.toLowerCase().includes(q)
    );
  }, [followUps, searchQuery]);

  const stats = useMemo(() => {
    const total = followUps.length;
    const pending = followUps.filter((f) => f.status === "pending").length;
    const overdue = followUps.filter((f) => f.is_overdue).length;
    const completed = followUps.filter((f) => f.status === "completed").length;
    return { total, pending, overdue, completed };
  }, [followUps]);

  return (
    <div className="page-container follow-ups-page">
      {/* PAGE HEADER */}
      <section className="page-header brutalist-card">
        <div>
          <span className="eyebrow">Outreach & Reminders</span>
          <h1 className="page-title">Follow-ups</h1>
          <p>Schedule proactive reminders, follow up with recruiters, and manage your pipeline.</p>
        </div>

        <button
          type="button"
          className="brutalist-button primary"
          onClick={handleOpenAddModal}
        >
          <Plus size={18} strokeWidth={2.5} />
          Add Follow-up
        </button>
      </section>

      {/* METRIC STRIP */}
      <section className="stats-strip brutalist-card">
        <div className="stat-pill">
          <span className="stat-pill-label">Total</span>
          <strong className="stat-pill-value">{stats.total}</strong>
        </div>
        <div className="stat-pill">
          <span className="stat-pill-label">Pending</span>
          <strong className="stat-pill-value">{stats.pending}</strong>
        </div>
        <div className="stat-pill alert">
          <span className="stat-pill-label">Overdue</span>
          <strong className="stat-pill-value">{stats.overdue}</strong>
        </div>
        <div className="stat-pill success">
          <span className="stat-pill-label">Completed</span>
          <strong className="stat-pill-value">{stats.completed}</strong>
        </div>
      </section>

      {/* ERROR BANNER */}
      {error && (
        <div className="form-error brutalist-card">
          <AlertTriangle size={18} />
          <span>{error}</span>
          <button
            type="button"
            className="small-button"
            onClick={() => loadData(activeFilter)}
            style={{ marginLeft: "auto" }}
          >
            Retry
          </button>
        </div>
      )}

      {/* MAIN CONTENT SECTION */}
      <section className="follow-ups-container brutalist-card">
        {/* TOOLBAR */}
        <div className="section-toolbar">
          <div className="filter-tabs">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`filter-tab ${activeFilter === tab.key ? "active" : ""}`}
                onClick={() => setActiveFilter(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="search-wrap">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search reminders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={() => setSearchQuery("")}
                title="Clear"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* LIST / CARDS */}
        {loading ? (
          <div className="empty-state">
            <Clock size={28} />
            <p>Loading follow-up reminders...</p>
          </div>
        ) : filteredFollowUps.length === 0 ? (
          <div className="empty-state">
            <Bell size={32} />
            <h3>No reminders found</h3>
            <p>
              {activeFilter === "all"
                ? "You haven't scheduled any follow-ups yet."
                : `No ${activeFilter} follow-ups matching this filter.`}
            </p>
            <button
              type="button"
              className="brutalist-button primary"
              onClick={handleOpenAddModal}
            >
              <Plus size={16} />
              Add Your First Reminder
            </button>
          </div>
        ) : (
          <div className="follow-ups-grid">
            {filteredFollowUps.map((item) => {
              const isOverdue = Boolean(item.is_overdue);
              const isCompleted = item.status === "completed";

              return (
                <div
                  key={item.id}
                  className={`follow-up-card brutalist-card ${
                    isOverdue ? "is-overdue" : ""
                  } ${isCompleted ? "is-completed" : ""}`}
                >
                  <div className="card-top-bar">
                    <div className="company-badge">
                      <div className="company-logo-avatar">
                        {item.company_name ? item.company_name.charAt(0).toUpperCase() : "C"}
                      </div>
                      <div className="company-job-meta">
                        <span className="card-company-name">
                          {item.company_name || "Company"}
                        </span>
                        <span className="card-job-title">
                          {item.job_title || "Application"}
                        </span>
                      </div>
                    </div>

                    <div className="status-badge-group">
                      {isOverdue && (
                        <span className="tag-overdue">
                          <AlertTriangle size={12} />
                          OVERDUE
                        </span>
                      )}
                      <span className={`tag-status ${isCompleted ? "done" : "pending"}`}>
                        {isCompleted ? "Completed" : "Pending"}
                      </span>
                    </div>
                  </div>

                  <div className="card-body">
                    <h3 className="follow-up-title">{item.title}</h3>
                    {item.description && (
                      <p className="follow-up-desc">{item.description}</p>
                    )}
                  </div>

                  <div className="card-due-bar">
                    <div className="due-info">
                      <Calendar size={14} />
                      <span className="due-date-text">{formatDate(item.due_date)}</span>
                      <span className="due-time-text">• {formatTime(item.due_date)}</span>
                    </div>

                    {item.application_status && (
                      <span className="app-stage-tag">
                        Stage: {item.application_status}
                      </span>
                    )}
                  </div>

                  <div className="card-actions-bar">
                    <button
                      type="button"
                      className={`action-btn complete-btn ${isCompleted ? "undo" : "check"}`}
                      onClick={() => handleToggleStatus(item)}
                      title={isCompleted ? "Mark as pending" : "Mark as completed"}
                    >
                      {isCompleted ? (
                        <>
                          <RotateCcw size={15} />
                          <span>Reopen</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={15} />
                          <span>Done</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      className="action-btn edit-btn"
                      onClick={() => handleOpenEditModal(item)}
                      title="Edit reminder"
                    >
                      <Pencil size={15} />
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      className="action-btn delete-btn"
                      onClick={() => handleDelete(item)}
                      title="Delete reminder"
                    >
                      <Trash2 size={15} />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ADD / EDIT MODAL */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div
            className="modal-content brutalist-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <span className="eyebrow">Outreach Reminder</span>
                <h2>{editingFollowUp ? "Edit Follow-up" : "Add Follow-up"}</h2>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowModal(false)}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            {formError && <div className="form-error">{formError}</div>}

            <form onSubmit={handleFormSubmit} className="follow-up-form">
              {/* APPLICATION SELECTOR */}
              <div className="form-group">
                <label htmlFor="application_id">Application *</label>
                <select
                  id="application_id"
                  name="application_id"
                  value={formData.application_id}
                  onChange={handleFormChange}
                  required
                >
                  <option value="">Select an application</option>
                  {applications.map((app) => (
                    <option key={app.id} value={app.id}>
                      {app.job_title} — {app.company_name}
                    </option>
                  ))}
                </select>
                {applications.length === 0 && (
                  <p className="form-hint">
                    No applications tracked yet.{" "}
                    <button
                      type="button"
                      className="text-link"
                      onClick={() => {
                        setShowModal(false);
                        navigate("/applications");
                      }}
                    >
                      Create an application first
                    </button>
                    .
                  </p>
                )}
              </div>

              {/* TITLE */}
              <div className="form-group">
                <label htmlFor="title">Title *</label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  placeholder="e.g., Send thank-you note to hiring manager"
                  value={formData.title}
                  onChange={handleFormChange}
                  required
                  maxLength={200}
                />
              </div>

              {/* DUE DATE & STATUS */}
              <div className="form-row-2">
                <div className="form-group">
                  <label htmlFor="due_date">Due Date & Time *</label>
                  <input
                    id="due_date"
                    name="due_date"
                    type="datetime-local"
                    value={formData.due_date}
                    onChange={handleFormChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="status">Status</label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleFormChange}
                  >
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              {/* DESCRIPTION */}
              <div className="form-group">
                <label htmlFor="description">Notes / Description (Optional)</label>
                <textarea
                  id="description"
                  name="description"
                  rows="3"
                  placeholder="Key topics discussed, email address to message, questions to prepare..."
                  value={formData.description}
                  onChange={handleFormChange}
                />
              </div>

              {/* ACTIONS */}
              <div className="modal-actions">
                <button
                  type="button"
                  className="brutalist-button"
                  onClick={() => setShowModal(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="brutalist-button primary"
                  disabled={saving || applications.length === 0}
                >
                  {saving
                    ? "Saving..."
                    : editingFollowUp
                    ? "Update Follow-up"
                    : "Create Follow-up"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
