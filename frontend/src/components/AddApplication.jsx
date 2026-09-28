import { useEffect, useState } from "react";
import { X, Plus } from "lucide-react";

import applicationService from "../services/applicationService";
import jobService from "../services/jobService";

export default function AddApplication({ onClose, onCreated }) {
  const [jobs, setJobs] = useState([]);

  const [formData, setFormData] = useState({
    job_id: "",
    status: "applied",
    applied_at: "",
    notes: "",
  });

  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadJobs = async () => {
      try {
        setLoadingJobs(true);
        setError("");

        const data = await jobService.getJobs();

        setJobs(data);
      } catch (error) {
        console.error("Loading jobs failed:", error);

        setError(error.response?.data?.detail || "Unable to load jobs.");
      } finally {
        setLoadingJobs(false);
      }
    };

    loadJobs();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (!formData.job_id) {
      setError("Please select a job.");
      return;
    }

    try {
      setLoading(true);

      const applicationData = {
        job_id: Number(formData.job_id),
        status: formData.status,
        applied_at: formData.applied_at
          ? new Date(formData.applied_at).toISOString()
          : null,
        notes: formData.notes.trim() || null,
      };

      const createdApplication =
        await applicationService.createApplication(applicationData);

      if (onCreated) {
        onCreated(createdApplication);
      }

      onClose();
    } catch (error) {
      console.error("Creating application failed:", error);

      setError(error.response?.data?.detail || "Unable to create application.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="add-application-modal brutalist-card">
        {/* HEADER */}
        <div className="modal-header">
          <div>
            <span className="eyebrow">Career Tracker</span>

            <h2>Add Application</h2>
          </div>

          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit}>
          {/* JOB */}
          <div className="form-group">
            <label htmlFor="application-job">Job</label>

            {loadingJobs ? (
              <div className="form-loading">Loading available jobs...</div>
            ) : jobs.length === 0 ? (
              <div className="form-empty">
                No jobs available. Please create a job first.
              </div>
            ) : (
              <select
                id="application-job"
                name="job_id"
                value={formData.job_id}
                onChange={handleChange}
                required
              >
                <option value="">Select a job</option>

                {jobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.title}
                    {job.company_name ? ` — ${job.company_name}` : ""}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* STATUS */}
          <div className="form-group">
            <label htmlFor="application-status">Application Status</label>

            <select
              id="application-status"
              name="status"
              value={formData.status}
              onChange={handleChange}
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

          {/* APPLIED DATE */}
          <div className="form-group">
            <label htmlFor="application-date">Applied Date</label>

            <input
              id="application-date"
              name="applied_at"
              type="datetime-local"
              value={formData.applied_at}
              onChange={handleChange}
            />
          </div>

          {/* NOTES */}
          <div className="form-group">
            <label htmlFor="application-notes">Notes</label>

            <textarea
              id="application-notes"
              name="notes"
              rows="4"
              placeholder="Add notes about this application..."
              value={formData.notes}
              onChange={handleChange}
            />
          </div>

          {/* ERROR */}
          {error && <div className="form-error">{error}</div>}

          {/* ACTIONS */}
          <div className="modal-actions">
            <button
              type="button"
              className="brutalist-button"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="brutalist-button primary"
              disabled={loading || loadingJobs || jobs.length === 0}
            >
              <Plus size={17} />

              {loading ? "Adding..." : "Add Application"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
