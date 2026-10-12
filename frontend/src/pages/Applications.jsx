import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  Plus,
  Search,
  BriefcaseBusiness,
  CalendarDays,
  Building2,
  X,
  Save,
  Trash2,
  List,
  LayoutGrid,
} from "lucide-react";


import applicationService from "../services/applicationService";
import AddApplication from "../components/AddApplication";
import "./Applications.css";

const STATUS_LABELS = {
  saved: "Not Started",
  applied: "Applied",
  screening: "Screening",
  interview: "Interview",
  offer: "Offered",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

const PIPELINE_COLUMNS = [
  { key: "saved", label: "Not Started", color: "neutral" },
  { key: "applied", label: "Applied", color: "peach" },
  { key: "screening", label: "Screening", color: "blue" },
  { key: "interview", label: "Interview", color: "sage" },
  { key: "offer", label: "Offered", color: "yellow" },
];

const STATUS_TABS = [
  { key: "all", label: "All" },
  { key: "saved", label: "Not Started" },
  { key: "applied", label: "Applied" },
  { key: "screening", label: "Screening" },
  { key: "interview", label: "Interview" },
  { key: "offer", label: "Offered" },
  { key: "rejected", label: "Rejected" },
  { key: "withdrawn", label: "Withdrawn" },
];

const formatDateTimeLocal = (dateValue) => {

  if (!dateValue) return "";
  try {
    const d = new Date(dateValue);
    if (isNaN(d.getTime())) return "";
    return d.toISOString().slice(0, 16);
  } catch {
    return "";
  }
};

export default function Applications() {
  const location = useLocation();

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState("list");

  const [showAddApplication, setShowAddApplication] = useState(false);

  /* VIEW / EDIT APPLICATION MODAL */
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [editForm, setEditForm] = useState({
    status: "applied",
    applied_at: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editError, setEditError] = useState("");

  const loadApplications = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await applicationService.getApplications();
      setApplications(data || []);
    } catch (err) {
      console.error("Loading applications failed:", err);
      setError(err.response?.data?.detail || "Unable to load applications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;

    const fetchInitialApplications = async () => {
      try {
        const data = await applicationService.getApplications();
        if (!ignore) {
          const list = data || [];
          setApplications(list);
          if (location.state?.selectedApplicationId && list.length > 0) {
            const match = list.find(
              (app) => app.id === location.state.selectedApplicationId
            );
            if (match) {
              setSelectedApplication(match);
              setEditForm({
                status: match.status || "applied",
                applied_at: formatDateTimeLocal(
                  match.applied_at || match.created_at
                ),
                notes: match.notes || "",
              });
            }
          }
        }
      } catch (err) {
        if (!ignore) {
          console.error("Loading applications failed:", err);
          setError(err.response?.data?.detail || "Unable to load applications.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    fetchInitialApplications();

    return () => {
      ignore = true;
    };
  }, [location.state]);


  const handleApplicationCreated = async () => {
    setShowAddApplication(false);
    await loadApplications();
  };

  const formatDate = (date) => {

    if (!date) return "Not specified";
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  /* =========================================
     VIEW APPLICATION DETAILS & EDIT
     ========================================= */
  const handleViewApplication = (application) => {
    if (!application) return;
    setSelectedApplication(application);
    setEditError("");
    setEditForm({
      status: application.status || "applied",
      applied_at: formatDateTimeLocal(
        application.applied_at || application.created_at
      ),
      notes: application.notes || "",
    });
  };

  const handleCloseEdit = () => {


    if (saving || deleting) return;
    setSelectedApplication(null);
    setEditError("");
  };

  const handleEditChange = (event) => {
    const { name, value } = event.target;
    setEditForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  /* =========================================
     SAVE APPLICATION
     ========================================= */
  const handleSaveApplication = async (event) => {
    event.preventDefault();
    if (!selectedApplication) return;

    try {
      setSaving(true);
      setEditError("");

      const updateData = {
        status: editForm.status,
        applied_at: editForm.applied_at
          ? new Date(editForm.applied_at).toISOString()
          : null,
        notes: editForm.notes.trim() || null,
      };

      const updated = await applicationService.updateApplication(
        selectedApplication.id,
        updateData
      );

      // Directly update in local state to avoid full reload and preserve filter
      setApplications((previous) =>
        previous.map((app) => (app.id === updated.id ? updated : app))
      );

      setSelectedApplication(null);
    } catch (err) {
      console.error("Updating application failed:", err);
      setEditError(err.response?.data?.detail || "Unable to update application.");
    } finally {
      setSaving(false);
    }
  };

  /* =========================================
     DELETE APPLICATION
     ========================================= */
  const handleDeleteApplication = async (applicationId) => {
    if (!window.confirm("Are you sure you want to delete this application?")) {
      return;
    }

    try {
      setDeleting(true);
      setEditError("");
      await applicationService.deleteApplication(applicationId);

      // Remove from visible UI immediately
      setApplications((previous) =>
        previous.filter((app) => app.id !== applicationId)
      );
      setSelectedApplication(null);
    } catch (err) {
      console.error("Deleting application failed:", err);
      setEditError(err.response?.data?.detail || "Unable to delete application.");
    } finally {
      setDeleting(false);
    }
  };

  /* =========================================
     COUNTS COMPUTATION (ACCURATE REAL DATA)
     ========================================= */
  const statusCounts = useMemo(() => {
    const counts = {
      all: applications.length,
      saved: 0,
      applied: 0,
      screening: 0,
      interview: 0,
      offer: 0,
      rejected: 0,
      withdrawn: 0,
    };

    applications.forEach((app) => {
      if (counts[app.status] !== undefined) {
        counts[app.status]++;
      }
    });

    return counts;
  }, [applications]);

  /* =========================================
     SEARCH + STATUS FILTER (DERIVED DATA)
     ========================================= */
  const filteredApplications = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return applications.filter((application) => {
      const matchesSearch =
        !search ||
        application.job_title?.toLowerCase().includes(search) ||
        application.company_name?.toLowerCase().includes(search) ||
        application.notes?.toLowerCase().includes(search);

      const matchesStatus =
        statusFilter === "all" || application.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [applications, searchTerm, statusFilter]);

  /* =========================================
     VISIBLE BOARD COLUMNS
     NEVER RENDER EMPTY COLUMNS FOR SELECTED STATUS
     ========================================= */
  const visibleBoardColumns = useMemo(() => {
    if (statusFilter === "all") {
      // In "All", display columns that either belong to the primary pipeline
      // or match any present status
      return PIPELINE_COLUMNS;
    }

    // When a specific status is chosen, show ONLY that single status column!
    const foundCol = PIPELINE_COLUMNS.find((col) => col.key === statusFilter);
    if (foundCol) {
      return [foundCol];
    }

    // For other statuses like rejected or withdrawn
    return [
      {
        key: statusFilter,
        label: STATUS_LABELS[statusFilter] || statusFilter,
        color: "neutral",
      },
    ];
  }, [statusFilter]);

  return (
    <div className="page-container applications-page">
      {/* =====================================
          HEADER (MATCHING JOBS COMPACT STYLE)
          ===================================== */}
      <section className="page-header brutalist-card">
        <div>
          <span className="eyebrow">Career Tracker</span>
          <h1 className="page-title">Applications</h1>
          <p>Track every application and follow its progress.</p>
        </div>

        <button
          type="button"
          className="brutalist-button primary"
          onClick={() => setShowAddApplication(true)}
        >
          <Plus size={17} />
          Add New Application
        </button>
      </section>

      {/* =====================================
          TOOLBAR (SEARCH + STATUS FILTER)
          ===================================== */}
      <section className="applications-toolbar brutalist-card">
        <div className="toolbar-top">
          <div className="search-box">
            <Search size={17} />
            <input
              type="text"
              placeholder="Search applications by title, company, notes..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={() => setSearchTerm("")}
                title="Clear search"
              >
                <X size={15} />
              </button>
            )}
          </div>

          <div className="toolbar-right">
            {/* Fallback compact select for very small mobile viewports */}
            <select
              className="status-filter-select mobile-only-select"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Filter applications by status"
            >
              <option value="all">All ({statusCounts.all})</option>
              <option value="saved">Not Started ({statusCounts.saved})</option>
              <option value="applied">Applied ({statusCounts.applied})</option>
              <option value="screening">Screening ({statusCounts.screening})</option>
              <option value="interview">Interview ({statusCounts.interview})</option>
              <option value="offer">Offered ({statusCounts.offer})</option>
              <option value="rejected">Rejected ({statusCounts.rejected})</option>
              <option value="withdrawn">Withdrawn ({statusCounts.withdrawn})</option>
            </select>
          </div>
        </div>

        {/* Status Filter Tabs with Real Counts */}
        <div className="status-filter-tabs">
          {STATUS_TABS.map((tab) => {
            const count = statusCounts[tab.key] ?? 0;
            // Hide rejected/withdrawn tabs if they have 0 count and aren't active
            if (
              (tab.key === "rejected" || tab.key === "withdrawn") &&
              count === 0 &&
              statusFilter !== tab.key
            ) {
              return null;
            }

            const isActive = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                className={`status-tab ${isActive ? "active" : ""}`}
                onClick={() => setStatusFilter(tab.key)}
              >
                <span>{tab.label}</span>
                <span className="tab-count">{count}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* =====================================
          APPLICATIONS CONTENT (LIST / BOARD)
          ===================================== */}
      <section className="applications-list brutalist-card">
        <div className="section-header">
          <div className="section-heading">
            <BriefcaseBusiness size={21} />
            <h2>
              {statusFilter === "all"
                ? "All Applications"
                : `${STATUS_LABELS[statusFilter] || statusFilter} Applications`}
            </h2>
          </div>

          <div className="section-header-actions">
            {/* View Mode Toggle: List vs Board */}
            <div className="view-toggle">
              <button
                type="button"
                className={`view-toggle-btn ${viewMode === "list" ? "active" : ""}`}
                onClick={() => setViewMode("list")}
                title="List View"
                aria-label="Switch to list view"
              >
                <List size={16} />
                <span className="toggle-label">List</span>
              </button>
              <button
                type="button"
                className={`view-toggle-btn ${viewMode === "board" ? "active" : ""}`}
                onClick={() => setViewMode("board")}
                title="Board View"
                aria-label="Switch to board view"
              >
                <LayoutGrid size={16} />
                <span className="toggle-label">Board</span>
              </button>
            </div>

            <span className="application-count">
              {filteredApplications.length} application
              {filteredApplications.length === 1 ? "" : "s"}
            </span>
          </div>
        </div>

        {/* FEEDBACK STATES */}
        {loading ? (
          <div className="empty-state">Loading applications...</div>
        ) : error ? (
          <div className="form-error">{error}</div>
        ) : filteredApplications.length === 0 ? (
          <div className="empty-state">
            <p className="empty-title">No applications found</p>
            <p className="empty-subtitle">
              {searchTerm || statusFilter !== "all"
                ? "Try another status or search."
                : "Get started by adding your first job application."}
            </p>
          </div>
        ) : viewMode === "list" ? (
          /* =====================================
             LIST VIEW (MATCHING JOBS ROW CARDS)
             ===================================== */
          <div className="applications-grid">
            {filteredApplications.map((application) => (
              <article
                className="application-card"
                key={application.id}
                onClick={() => handleViewApplication(application)}
              >
                {/* COMPANY LOGO */}
                <div className="company-logo">
                  {application.company_name
                    ? application.company_name.charAt(0).toUpperCase()
                    : "C"}
                </div>

                {/* JOB INFO */}
                <div className="application-main">
                  <h3>
                    {application.job_title || `Job #${application.job_id}`}
                  </h3>
                  <p className="application-company">
                    <Building2 size={15} />
                    {application.company_name || "Company"}
                  </p>
                </div>

                {/* STATUS & DATE */}
                <div className="application-meta">
                  <span
                    className={`application-status status-${application.status}`}
                  >
                    {STATUS_LABELS[application.status] || application.status}
                  </span>
                  <p className="application-date">
                    <CalendarDays size={14} />
                    {formatDate(application.applied_at || application.created_at)}
                  </p>
                </div>

                {/* FOOTER & VIEW ACTION */}
                <div className="application-card-footer">
                  <span className="application-number">
                    #{application.id}
                  </span>
                  <button
                    type="button"
                    className="view-job-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewApplication(application);
                    }}
                  >
                    View
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          /* =====================================
             BOARD VIEW (COLUMNS)
             NEVER SHOWS EMPTY COLUMNS FOR A SELECTED STATUS
             ===================================== */
          <div
            className={`applications-board ${
              visibleBoardColumns.length === 1 ? "single-column" : ""
            }`}
          >
            {visibleBoardColumns.map((column) => {
              const colApplications = filteredApplications.filter(
                (app) => app.status === column.key
              );

              return (
                <div
                  className={`board-column ${column.color}`}
                  key={column.key}
                >
                  <div className="board-column-header">
                    <div className="board-column-title-group">
                      <span className="board-column-dot" />
                      <h3>{column.label}</h3>
                      <span className="board-column-count">
                        {colApplications.length}
                      </span>
                    </div>
                  </div>

                  <div className="board-column-cards">
                    {colApplications.length === 0 ? (
                      <div className="board-column-empty">
                        No {column.label.toLowerCase()} applications
                      </div>
                    ) : (
                      colApplications.map((application) => (
                        <div
                          className="board-card"
                          key={application.id}
                          onClick={() => handleViewApplication(application)}
                        >
                          <div className="board-card-header">
                            <div className="company-logo small">
                              {application.company_name
                                ? application.company_name
                                    .charAt(0)
                                    .toUpperCase()
                                : "C"}
                            </div>
                            <span
                              className={`application-status status-${application.status}`}
                            >
                              {STATUS_LABELS[application.status] ||
                                application.status}
                            </span>
                          </div>

                          <h4 className="board-card-title">
                            {application.job_title ||
                              `Job #${application.job_id}`}
                          </h4>

                          <p className="board-card-company">
                            <Building2 size={13} />
                            {application.company_name || "Company"}
                          </p>

                          <div className="board-card-footer">
                            <span className="board-card-date">
                              <CalendarDays size={13} />
                              {formatDate(
                                application.applied_at ||
                                  application.created_at
                              )}
                            </span>
                            <button
                              type="button"
                              className="view-job-button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewApplication(application);
                              }}
                            >
                              View
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* =====================================
          ADD APPLICATION MODAL
          ===================================== */}
      {showAddApplication && (
        <AddApplication
          onClose={() => setShowAddApplication(false)}
          onCreated={handleApplicationCreated}
        />
      )}

      {/* =====================================
          VIEW DETAILS & EDIT MODAL
          ===================================== */}
      {selectedApplication && (
        <div className="modal-overlay" onClick={handleCloseEdit}>
          <div
            className="add-application-modal brutalist-card application-detail-modal"
            onClick={(e) => e.stopPropagation()}
          >
            {/* MODAL HEADER */}
            <div className="modal-header">
              <div>
                <span className="eyebrow">Application Details</span>
                <h2>
                  {selectedApplication.job_title ||
                    `Job #${selectedApplication.job_id}`}
                </h2>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={handleCloseEdit}
                aria-label="Close"
                disabled={saving || deleting}
              >
                <X size={20} />
              </button>
            </div>

            {/* APPLICATION INFO CARD */}
            <div className="application-detail-info">
              <div className="detail-meta-grid">
                <div className="detail-item">
                  <span className="detail-label">Company</span>
                  <div className="detail-value company-name">
                    <Building2 size={15} />
                    <strong>{selectedApplication.company_name || "Company"}</strong>
                  </div>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Application ID</span>
                  <span className="detail-value mono">
                    #{selectedApplication.id}
                  </span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Current Status</span>
                  <div>
                    <span
                      className={`application-status status-${selectedApplication.status}`}
                    >
                      {STATUS_LABELS[selectedApplication.status] ||
                        selectedApplication.status}
                    </span>
                  </div>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Date Tracked</span>
                  <span className="detail-value">
                    <CalendarDays size={14} />
                    {formatDate(
                      selectedApplication.applied_at ||
                        selectedApplication.created_at
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* EDIT FORM */}
            <form onSubmit={handleSaveApplication} className="application-modal-form">
              <div className="form-group">
                <label htmlFor="edit-status">Status</label>
                <select
                  id="edit-status"
                  name="status"
                  value={editForm.status}
                  onChange={handleEditChange}
                  disabled={saving || deleting}
                >
                  <option value="saved">Not Started</option>
                  <option value="applied">Applied</option>
                  <option value="screening">Screening</option>
                  <option value="interview">Interview</option>
                  <option value="offer">Offered</option>
                  <option value="rejected">Rejected</option>
                  <option value="withdrawn">Withdrawn</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="edit-applied-at">Applied / Updated Date</label>
                <input
                  id="edit-applied-at"
                  name="applied_at"
                  type="datetime-local"
                  value={editForm.applied_at}
                  onChange={handleEditChange}
                  disabled={saving || deleting}
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-notes">Notes</label>
                <textarea
                  id="edit-notes"
                  name="notes"
                  rows="4"
                  placeholder="Add notes about this application (interviews, follow-ups, contacts)..."
                  value={editForm.notes}
                  onChange={handleEditChange}
                  disabled={saving || deleting}
                />
              </div>

              {editError && <div className="form-error">{editError}</div>}

              {/* MODAL ACTIONS: DELETE + CANCEL + SAVE */}
              <div className="modal-actions-between">
                <button
                  type="button"
                  className="brutalist-button danger-button"
                  onClick={() => handleDeleteApplication(selectedApplication.id)}
                  disabled={saving || deleting}
                >
                  <Trash2 size={16} />
                  {deleting ? "Deleting..." : "Delete Application"}
                </button>

                <div className="modal-actions-right">
                  <button
                    type="button"
                    className="brutalist-button"
                    onClick={handleCloseEdit}
                    disabled={saving || deleting}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="brutalist-button primary"
                    disabled={saving || deleting}
                  >
                    <Save size={16} />
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
