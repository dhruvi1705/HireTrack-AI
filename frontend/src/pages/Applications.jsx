import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  BriefcaseBusiness,
  CalendarDays,
  Building2,
  X,
  Save,
} from "lucide-react";

import applicationService from "../services/applicationService";
import AddApplication from "../components/AddApplication";

const STATUS_LABELS = {
  saved: "Not Started",
  applied: "Applied",
  screening: "Screening",
  interview: "Interview",
  offer: "Offered",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

export default function Applications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [showAddApplication, setShowAddApplication] = useState(false);

  /* EDIT APPLICATION */
  const [selectedApplication, setSelectedApplication] = useState(null);

  const [editForm, setEditForm] = useState({
    status: "applied",
    applied_at: "",
    notes: "",
  });

  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");

  const loadApplications = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await applicationService.getApplications();

      setApplications(data);
    } catch (error) {
      console.error("Loading applications failed:", error);

      setError(error.response?.data?.detail || "Unable to load applications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const handleApplicationCreated = async () => {
    setShowAddApplication(false);

    await loadApplications();
  };

  /* =========================================
     OPEN EDIT MODAL
     ========================================= */

  const handleViewApplication = (application) => {
    setSelectedApplication(application);

    setEditError("");

    setEditForm({
      status: application.status || "applied",
      applied_at: application.applied_at
        ? new Date(application.applied_at).toISOString().slice(0, 16)
        : "",
      notes: application.notes || "",
    });
  };

  /* =========================================
     CLOSE EDIT MODAL
     ========================================= */

  const handleCloseEdit = () => {
    if (saving) {
      return;
    }

    setSelectedApplication(null);
    setEditError("");
  };

  /* =========================================
     EDIT FORM CHANGE
     ========================================= */

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

    if (!selectedApplication) {
      return;
    }

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

      await applicationService.updateApplication(
        selectedApplication.id,
        updateData,
      );

      setSelectedApplication(null);

      await loadApplications();
    } catch (error) {
      console.error("Updating application failed:", error);

      setEditError(
        error.response?.data?.detail || "Unable to update application.",
      );
    } finally {
      setSaving(false);
    }
  };

  /* =========================================
     SEARCH + FILTER
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
     DATE FORMAT
     ========================================= */

  const formatDate = (date) => {
    if (!date) {
      return "Not specified";
    }

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="page-container applications-page">
      {/* =====================================
          HEADER
          ===================================== */}

      <section className="page-header brutalist-card">
        <div>
          <span className="eyebrow">Career Tracker</span>

          <h1 className="page-title">Applications</h1>

          <p>Track every application and follow its progress.</p>
        </div>

        <button
          className="brutalist-button primary"
          onClick={() => setShowAddApplication(true)}
        >
          <Plus size={17} />
          Add Application
        </button>
      </section>

      {/* =====================================
          TOOLBAR
          ===================================== */}

      <section className="applications-toolbar brutalist-card">
        <div className="search-box">
          <Search size={17} />

          <input
            type="text"
            placeholder="Search applications..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>

        <select
          className="status-filter"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="all">All Statuses</option>

          <option value="saved">Not Started</option>

          <option value="applied">Applied</option>

          <option value="screening">Screening</option>

          <option value="interview">Interview</option>

          <option value="offer">Offered</option>

          <option value="rejected">Rejected</option>

          <option value="withdrawn">Withdrawn</option>
        </select>
      </section>

      {/* =====================================
          APPLICATION LIST
          ===================================== */}

      <section className="applications-list brutalist-card">
        <div className="section-header">
          <div className="section-heading">
            <BriefcaseBusiness size={21} />

            <h2>Your Applications</h2>
          </div>

          <span className="application-count">
            {filteredApplications.length} applications
          </span>
        </div>

        {loading ? (
          <div className="empty-state">Loading applications...</div>
        ) : error ? (
          <div className="form-error">{error}</div>
        ) : filteredApplications.length === 0 ? (
          <div className="empty-state">
            {searchTerm || statusFilter !== "all"
              ? "No applications match your filters."
              : "No applications yet."}
          </div>
        ) : (
          <div className="applications-grid">
            {filteredApplications.map((application) => (
              <article className="application-card" key={application.id}>
                {/* CARD TOP */}

                <div className="application-card-top">
                  <div className="company-logo">
                    {application.company_name
                      ? application.company_name.charAt(0)
                      : "C"}
                  </div>

                  <span
                    className={`application-status status-${application.status}`}
                  >
                    {STATUS_LABELS[application.status] || application.status}
                  </span>
                </div>

                {/* JOB */}

                <h3>{application.job_title || `Job #${application.job_id}`}</h3>

                {/* COMPANY */}

                <p className="application-company">
                  <Building2 size={15} />

                  {application.company_name || "Company"}
                </p>

                {/* DATE */}

                <p className="application-date">
                  <CalendarDays size={15} />

                  {formatDate(application.applied_at)}
                </p>

                {/* NOTES */}

                {application.notes && (
                  <p className="application-notes">{application.notes}</p>
                )}

                {/* FOOTER */}

                <div className="application-card-footer">
                  <span>Application #{application.id}</span>

                  <button
                    type="button"
                    className="view-job-button"
                    onClick={() => handleViewApplication(application)}
                  >
                    View
                  </button>
                </div>
              </article>
            ))}
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
          EDIT APPLICATION MODAL
          ===================================== */}

      {selectedApplication && (
        <div className="modal-overlay">
          <div className="add-application-modal brutalist-card">
            {/* HEADER */}

            <div className="modal-header">
              <div>
                <span className="eyebrow">Application Details</span>

                <h2>Edit Application</h2>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={handleCloseEdit}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* APPLICATION INFO */}

            <div className="application-edit-info">
              <h3>
                {selectedApplication.job_title ||
                  `Job #${selectedApplication.job_id}`}
              </h3>

              <p>
                <Building2 size={15} />

                {selectedApplication.company_name || "Company"}
              </p>
            </div>

            {/* EDIT FORM */}

            <form onSubmit={handleSaveApplication}>
              {/* STATUS */}

              <div className="form-group">
                <label htmlFor="edit-status">Application Status</label>

                <select
                  id="edit-status"
                  name="status"
                  value={editForm.status}
                  onChange={handleEditChange}
                  disabled={saving}
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

              {/* DATE */}

              <div className="form-group">
                <label htmlFor="edit-applied-at">Applied Date</label>

                <input
                  id="edit-applied-at"
                  name="applied_at"
                  type="datetime-local"
                  value={editForm.applied_at}
                  onChange={handleEditChange}
                  disabled={saving}
                />
              </div>

              {/* NOTES */}

              <div className="form-group">
                <label htmlFor="edit-notes">Notes</label>

                <textarea
                  id="edit-notes"
                  name="notes"
                  rows="4"
                  placeholder="Add notes about this application..."
                  value={editForm.notes}
                  onChange={handleEditChange}
                  disabled={saving}
                />
              </div>

              {/* ERROR */}

              {editError && <div className="form-error">{editError}</div>}

              {/* ACTIONS */}

              <div className="modal-actions">
                <button
                  type="button"
                  className="brutalist-button"
                  onClick={handleCloseEdit}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="brutalist-button primary"
                  disabled={saving}
                >
                  <Save size={17} />

                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
