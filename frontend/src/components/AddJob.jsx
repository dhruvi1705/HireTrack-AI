import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";

import jobService from "../services/jobService";
import companyService from "../services/companyService";

export default function AddJob({ onClose, onCreated }) {
  const [companies, setCompanies] = useState([]);

  const [formData, setFormData] = useState({
    company_id: "",
    title: "",
    description: "",
    location: "",
    employment_type: "Full-time",
    salary_min: "",
    salary_max: "",
  });

  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadCompanies = async () => {
      try {
        setLoadingCompanies(true);

        const data = await companyService.getCompanies();

        setCompanies(data);
      } catch (error) {
        console.error("Loading companies failed:", error);

        setError(error.response?.data?.detail || "Unable to load companies.");
      } finally {
        setLoadingCompanies(false);
      }
    };

    loadCompanies();
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

    if (!formData.company_id) {
      setError("Please select a company.");
      return;
    }

    if (!formData.title.trim()) {
      setError("Please enter a job title.");
      return;
    }

    if (
      formData.salary_min !== "" &&
      formData.salary_max !== "" &&
      Number(formData.salary_min) > Number(formData.salary_max)
    ) {
      setError("Minimum salary cannot be greater than maximum salary.");
      return;
    }

    try {
      setLoading(true);

      const jobData = {
        company_id: Number(formData.company_id),
        title: formData.title.trim(),
        description: formData.description.trim(),
        location: formData.location.trim() || null,
        employment_type: formData.employment_type,
        salary_min:
          formData.salary_min === "" ? null : Number(formData.salary_min),
        salary_max:
          formData.salary_max === "" ? null : Number(formData.salary_max),
      };

      const createdJob = await jobService.createJob(jobData);

      if (onCreated) {
        onCreated(createdJob);
      }

      onClose();
    } catch (error) {
      console.error("Creating job failed:", error);

      setError(error.response?.data?.detail || "Unable to create job.");
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
            <span className="eyebrow">Career Opportunities</span>

            <h2>Add Job</h2>
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
          {/* COMPANY */}
          <div className="form-group">
            <label htmlFor="company_id">Company</label>

            {loadingCompanies ? (
              <div className="form-loading">Loading companies...</div>
            ) : companies.length === 0 ? (
              <div className="form-empty">No companies available yet.</div>
            ) : (
              <select
                id="company_id"
                name="company_id"
                value={formData.company_id}
                onChange={handleChange}
              >
                <option value="">Select a company</option>

                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* JOB TITLE */}
          <div className="form-group">
            <label htmlFor="title">Job Title</label>

            <input
              id="title"
              name="title"
              type="text"
              placeholder="Example: Frontend Developer Intern"
              value={formData.title}
              onChange={handleChange}
              maxLength={200}
            />
          </div>

          {/* LOCATION */}
          <div className="form-group">
            <label htmlFor="location">Location</label>

            <input
              id="location"
              name="location"
              type="text"
              placeholder="Example: Ahmedabad, Gujarat"
              value={formData.location}
              onChange={handleChange}
              maxLength={200}
            />
          </div>

          {/* EMPLOYMENT TYPE */}
          <div className="form-group">
            <label htmlFor="employment_type">Employment Type</label>

            <select
              id="employment_type"
              name="employment_type"
              value={formData.employment_type}
              onChange={handleChange}
            >
              <option value="Full-time">Full-time</option>

              <option value="Part-time">Part-time</option>

              <option value="Internship">Internship</option>

              <option value="Contract">Contract</option>

              <option value="Freelance">Freelance</option>
            </select>
          </div>

          {/* SALARY */}
          <div className="salary-row">
            <div className="form-group">
              <label htmlFor="salary_min">Minimum Salary</label>

              <input
                id="salary_min"
                name="salary_min"
                type="number"
                min="0"
                placeholder="Optional"
                value={formData.salary_min}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="salary_max">Maximum Salary</label>

              <input
                id="salary_max"
                name="salary_max"
                type="number"
                min="0"
                placeholder="Optional"
                value={formData.salary_max}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* DESCRIPTION */}
          <div className="form-group">
            <label htmlFor="description">Job Description</label>

            <textarea
              id="description"
              name="description"
              rows="5"
              placeholder="Add the job description..."
              value={formData.description}
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
              disabled={loading || loadingCompanies || companies.length === 0}
            >
              <Plus size={17} />

              {loading ? "Adding..." : "Add Job"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
