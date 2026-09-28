import { useEffect, useState } from "react";
import { Plus, Search, BriefcaseBusiness } from "lucide-react";

import jobService from "../services/jobService";
import AddJob from "../components/AddJob";

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddJob, setShowAddJob] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const loadJobs = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await jobService.getJobs();

      setJobs(data);
    } catch (error) {
      console.error("Loading jobs failed:", error);

      setError(error.response?.data?.detail || "Unable to load jobs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const handleJobCreated = async () => {
    setShowAddJob(false);
    await loadJobs();
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
            placeholder="Search jobs..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
      </section>

      {/* JOB LIST */}
      <section className="jobs-list brutalist-card">
        <div className="section-header">
          <div className="section-heading">
            <BriefcaseBusiness size={21} />

            <h2>Available Jobs</h2>
          </div>

          <span className="job-count">{filteredJobs.length} jobs</span>
        </div>

        {loading ? (
          <div className="empty-state">Loading jobs...</div>
        ) : error ? (
          <div className="form-error">{error}</div>
        ) : filteredJobs.length === 0 ? (
          <div className="empty-state">No jobs available yet.</div>
        ) : (
          <div className="jobs-grid">
            {filteredJobs.map((job) => (
              <div className="job-card" key={job.id}>
                <div className="job-card-top">
                  <div className="company-logo">
                    {job.company_name ? job.company_name.charAt(0) : "C"}
                  </div>

                  <span className="job-type">
                    {job.employment_type || "Full-time"}
                  </span>
                </div>

                <h3>{job.title}</h3>

                <p className="job-company">{job.company_name || "Company"}</p>

                {job.location && (
                  <p className="job-location">📍 {job.location}</p>
                )}

                <div className="job-card-footer">
                  <span>Job #{job.id}</span>

                  <button className="view-job-button">View</button>
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
    </div>
  );
}
