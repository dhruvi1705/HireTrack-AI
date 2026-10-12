import { useEffect, useState } from "react";
import { Plus, Search, BriefcaseBusiness, Building2, X, Trash2, Target } from "lucide-react";

import jobService from "../services/jobService";
import AddJob from "../components/AddJob";
import JobMatchSection from "../components/JobMatchSection";
import "./Jobs.css";

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddJob, setShowAddJob] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [matchScores, setMatchScores] = useState(() => {
    try {
      const scores = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("hiretrack_job_match_")) {
          const id = key.replace("hiretrack_job_match_", "");
          const parsed = JSON.parse(localStorage.getItem(key) || "{}");
          if (parsed && typeof parsed.match_percentage === "number") {
            scores[id] = parsed;
          }
        }
      }
      return scores;
    } catch {
      return {};
    }
  });

  const handleMatchCalculated = (jobId, result) => {
    setMatchScores((prev) => ({
      ...prev,
      [jobId]: result,
    }));
  };

  const loadJobs = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await jobService.getJobs();
      setJobs(data || []);
    } catch (err) {
      console.error("Loading jobs failed:", err);
      setError(err.response?.data?.detail || "Unable to load jobs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;

    const fetchInitialJobs = async () => {
      try {
        const data = await jobService.getJobs();
        if (!ignore) {
          setJobs(data || []);
        }
      } catch (err) {
        if (!ignore) {
          console.error("Loading jobs failed:", err);
          setError(err.response?.data?.detail || "Unable to load jobs.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    fetchInitialJobs();

    return () => {
      ignore = true;
    };
  }, []);

  const handleJobCreated = async () => {
    setShowAddJob(false);
    await loadJobs();
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm("Are you sure you want to delete this job?")) {
      return;
    }

    try {
      setDeleting(true);
      setDeleteError("");
      await jobService.deleteJob(jobId);
      setJobs((prev) => prev.filter((j) => j.id !== jobId));
      setSelectedJob(null);
    } catch (err) {
      console.error("Failed to delete job:", err);
      setDeleteError(err.response?.data?.detail || "Unable to delete job.");
    } finally {
      setDeleting(false);
    }
  };

  const filteredJobs = jobs.filter((job) => {
    const search = searchTerm.trim().toLowerCase();

    if (!search) {
      return true;
    }

    return (
      job.title?.toLowerCase().includes(search) ||
      job.company_name?.toLowerCase().includes(search) ||
      job.location?.toLowerCase().includes(search) ||
      job.employment_type?.toLowerCase().includes(search)
    );
  });

  return (
    <div className="page-container jobs-page">
      {/* HEADER */}
      <section className="page-header brutalist-card">
        <div>
          <span className="eyebrow">Career Opportunities</span>

          <h1 className="page-title">Jobs</h1>

          <p>Keep track of the jobs you want to apply for.</p>
        </div>

        <button
          type="button"
          className="brutalist-button primary"
          onClick={() => setShowAddJob(true)}
        >
          <Plus size={17} />
          Add Job
        </button>
      </section>

      {/* SEARCH */}
      <section className="jobs-toolbar brutalist-card">
        <div className="search-box">
          <Search size={17} />

          <input
            type="text"
            placeholder="Search jobs by title, company, location, type..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          {searchTerm && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={() => setSearchTerm("")}
              title="Clear search"
              style={{ background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center" }}
            >
              <X size={15} />
            </button>
          )}
        </div>
      </section>

      {/* JOB LIST */}
      <section className="jobs-list brutalist-card">
        <div className="section-header">
          <div className="section-heading">
            <BriefcaseBusiness size={21} />

            <h2>Available Jobs</h2>
          </div>

          <span className="job-count">
            {filteredJobs.length} {filteredJobs.length === 1 ? "job" : "jobs"}
          </span>
        </div>

        {loading ? (
          <div className="empty-state">Loading jobs...</div>
        ) : error ? (
          <div className="form-error">{error}</div>
        ) : filteredJobs.length === 0 ? (
          <div className="empty-state">
            {searchTerm ? "No jobs match your search." : "No jobs available yet."}
          </div>
        ) : (
          <div className="jobs-grid">
            {filteredJobs.map((job) => (
              <div
                className="job-card"
                key={job.id}
                onClick={() => setSelectedJob(job)}
                style={{ cursor: "pointer" }}
              >
                <div className="job-card-top">
                  <div className="company-logo">
                    {job.company_name ? job.company_name.charAt(0).toUpperCase() : "C"}
                  </div>

                  <span className="job-type">
                    {job.employment_type || "Full-time"}
                  </span>

                  {matchScores[job.id] && (
                    <span className="card-match-badge" title="Calculated AI Match Score">
                      <Target size={11} />
                      <span>{matchScores[job.id].match_percentage}%</span>
                    </span>
                  )}
                </div>

                <h3>{job.title}</h3>

                <p className="job-company">{job.company_name || "Company"}</p>

                <p className="job-location">
                  {job.location ? `📍 ${job.location}` : ""}
                </p>

                <div className="job-card-footer">
                  <button
                    type="button"
                    className="match-job-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedJob(job);
                    }}
                    title="Analyze match for this job"
                  >
                    <Target size={13} />
                    <span>
                      {matchScores[job.id] ? `${matchScores[job.id].match_percentage}% Fit` : "Match Score"}
                    </span>
                  </button>

                  <button
                    type="button"
                    className="view-job-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedJob(job);
                    }}
                  >
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ADD JOB MODAL */}
      {showAddJob && (
        <AddJob
          onClose={() => setShowAddJob(false)}
          onCreated={handleJobCreated}
        />
      )}

      {/* VIEW JOB DETAIL MODAL */}
      {selectedJob && (
        <div className="modal-overlay" onClick={() => setSelectedJob(null)}>
          <div
            className="add-application-modal brutalist-card job-detail-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <span className="eyebrow">Job Details</span>
                <h2>{selectedJob.title}</h2>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={() => setSelectedJob(null)}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="job-detail-body">
              <div className="job-detail-meta-grid">
                <div className="job-detail-item">
                  <span className="job-detail-label">Company</span>
                  <div className="job-detail-value company-val">
                    <Building2 size={15} />
                    <strong>{selectedJob.company_name || "Company"}</strong>
                  </div>
                </div>

                <div className="job-detail-item">
                  <span className="job-detail-label">Job ID</span>
                  <span className="job-detail-value mono">#{selectedJob.id}</span>
                </div>

                <div className="job-detail-item">
                  <span className="job-detail-label">Employment Type</span>
                  <span className="job-detail-value">
                    {selectedJob.employment_type || "Full-time"}
                  </span>
                </div>

                {selectedJob.location && (
                  <div className="job-detail-item">
                    <span className="job-detail-label">Location</span>
                    <span className="job-detail-value">📍 {selectedJob.location}</span>
                  </div>
                )}

                {(selectedJob.salary_min !== null || selectedJob.salary_max !== null) && (
                  <div className="job-detail-item job-detail-full-width">
                    <span className="job-detail-label">Salary Range</span>
                    <span className="job-detail-value mono">
                      {selectedJob.salary_min ? `₹${selectedJob.salary_min.toLocaleString("en-IN")}` : "0"} -{" "}
                      {selectedJob.salary_max ? `₹${selectedJob.salary_max.toLocaleString("en-IN")}` : "Open"}
                    </span>
                  </div>
                )}
              </div>

              {selectedJob.description && (
                <div className="job-detail-description">
                  <span className="job-detail-label">Description</span>
                  <p>{selectedJob.description}</p>
                </div>
              )}

              {/* INTEGRATED JOB MATCH SCORE & ANALYSIS */}
              <JobMatchSection
                job={selectedJob}
                savedResult={matchScores[selectedJob.id]}
                onMatchCalculated={handleMatchCalculated}
              />
            </div>

            {deleteError && (
              <div className="form-error" style={{ margin: "0 24px 14px" }}>
                {deleteError}
              </div>
            )}

            <div className="job-detail-actions">
              <button
                type="button"
                className="brutalist-button danger-button"
                onClick={() => handleDeleteJob(selectedJob.id)}
                disabled={deleting}
              >
                <Trash2 size={16} />
                {deleting ? "Deleting..." : "Delete Job"}
              </button>

              <button
                type="button"
                className="brutalist-button"
                onClick={() => setSelectedJob(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
