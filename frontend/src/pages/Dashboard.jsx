import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  Plus,
  Search,
  Sparkles,
  Trophy,
  Video,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import dashboardService from "../services/dashboardService";
import applicationService from "../services/applicationService";
import interviewService from "../services/interviewService";
import AddApplication from "../components/AddApplication";
import "./Dashboard.css";

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
  {
    title: "Not Started",
    status: "saved",
    color: "neutral",
  },
  {
    title: "Applied",
    status: "applied",
    color: "peach",
  },
  {
    title: "Screening",
    status: "screening",
    color: "blue",
  },
  {
    title: "Interview",
    status: "interview",
    color: "sage",
  },
  {
    title: "Offered",
    status: "offer",
    color: "yellow",
  },
];

export default function Dashboard() {
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState(null);
  const [applications, setApplications] = useState([]);
  const [interviews, setInterviews] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showAddApplication, setShowAddApplication] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const [summary, applicationData, interviewData] = await Promise.all([
        dashboardService.getSummary(),
        applicationService.getApplications(),
        interviewService.getInterviews().catch((err) => {
          console.error("Dashboard interviews loading failed:", err);
          return [];
        }),
      ]);

      setDashboardData(summary);
      setApplications(applicationData || []);
      setInterviews(interviewData || []);
    } catch (error) {
      console.error("Dashboard loading failed:", error);

      setError(
        error.response?.data?.detail ||
          "Unable to load dashboard data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;

    const fetchInitialDashboard = async () => {
      try {
        const [summary, applicationData, interviewData] = await Promise.all([
          dashboardService.getSummary(),
          applicationService.getApplications(),
          interviewService.getInterviews().catch((err) => {
            console.error("Dashboard interviews loading failed:", err);
            return [];
          }),
        ]);

        if (!ignore) {
          setDashboardData(summary);
          setApplications(applicationData || []);
          setInterviews(interviewData || []);
        }
      } catch (error) {
        if (!ignore) {
          console.error("Dashboard loading failed:", error);
          setError(
            error.response?.data?.detail || "Unable to load dashboard data."
          );
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    fetchInitialDashboard();

    return () => {
      ignore = true;
    };
  }, []);

  const handleApplicationCreated = async () => {
    setShowAddApplication(false);
    await loadDashboard();
  };

  const handleViewApplications = () => {
    navigate("/applications");
  };

  const handleViewInterviews = () => {
    navigate("/interviews");
  };

  const handleOpenApplication = () => {
    navigate("/applications");
  };

  const searchFilteredApplications = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return applications.filter((application) => {
      const jobTitle = application.job_title || "";
      const companyName = application.company_name || "";
      const notes = application.notes || "";

      return (
        !search ||
        jobTitle.toLowerCase().includes(search) ||
        companyName.toLowerCase().includes(search) ||
        notes.toLowerCase().includes(search)
      );
    });
  }, [applications, searchTerm]);

  const visibleColumns = useMemo(() => {
    if (activeFilter === "all") {
      return PIPELINE_COLUMNS;
    }
    return PIPELINE_COLUMNS.filter((col) => col.status === activeFilter);
  }, [activeFilter]);

  const getApplicationsByStatus = (status) => {
    return searchFilteredApplications.filter(
      (application) => application.status === status
    );
  };

  const upcomingInterviews = useMemo(() => {
    const now = new Date();

    return interviews
      .filter((interview) => {
        if (!interview.interview_date) return false;

        // Exclude cancelled and completed interviews
        const status = (interview.status || "").toLowerCase();
        if (status === "cancelled" || status === "completed") {
          return false;
        }

        const interviewDate = new Date(interview.interview_date);
        if (isNaN(interviewDate.getTime())) return false;

        // Upcoming interview must be scheduled for the future
        return interviewDate > now;
      })
      .sort((a, b) => new Date(a.interview_date) - new Date(b.interview_date))
      .slice(0, 5);
  }, [interviews]);

  const formatDate = (date) => {
    if (!date) return "Not specified";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (date) => {
    if (!date) return "";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "";

    return d.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="dashboard page-container">
        <div className="brutalist-card dashboard-loading">
          Loading your workspace...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard page-container">
        <div className="brutalist-card dashboard-error">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard page-container">

      {/* HERO */}
      <section className="dashboard-hero brutalist-card">
        <div className="hero-copy">
          <div className="eyebrow">Your Job Search</div>

          <h1 className="page-title">Workspace</h1>

          <p>Track, plan and achieve your dream career.</p>

          <div className="hero-actions">
            <button
              className="brutalist-button primary"
              onClick={() => setShowAddApplication(true)}
            >
              <Plus size={17} />
              Add Application
            </button>

            <button
              className="brutalist-button"
              onClick={() => navigate("/jobs")}
            >
              Explore Jobs
              <ArrowUpRight size={17} />
            </button>
          </div>
        </div>

        <div className="hero-illustration">
          <div className="illustration-star">✦</div>

          <div className="illustration-laptop">
            <div className="laptop-screen">
              <div className="screen-line short" />
              <div className="screen-line" />
              <div className="screen-line medium" />

              <div className="screen-card">
                <CheckCircle2 size={18} />
                <span>Interview</span>
              </div>
            </div>

            <div className="laptop-base" />
          </div>

          <div className="illustration-paper">
            <span>JOB</span>
            <strong>TRACKER</strong>
            <div className="paper-line" />
            <div className="paper-line short" />
            <div className="paper-check">✓</div>
          </div>

          <div className="illustration-flower">✿</div>
        </div>

        <div className="hero-quote">
          <span className="quote-mark">“</span>

          <div>
            <strong>Small steps.</strong>
            <br />
            Big career moves.
          </div>

          <span className="quote-heart">♡</span>
        </div>
      </section>

      {/* QUICK STATS */}
      <section className="stats-grid">

        <div className="stat-card brutalist-card">
          <div className="stat-icon peach">
            <FileText size={22} />
          </div>

          <div>
            <span className="stat-number">
              {dashboardData.stats.applications}
            </span>

            <span className="stat-label">Applications</span>

            <small className="stat-growth">
              Total tracked
            </small>
          </div>
        </div>

        <div className="stat-card brutalist-card">
          <div className="stat-icon peach">
            <CalendarDays size={22} />
          </div>

          <div>
            <span className="stat-number">
              {dashboardData.stats.interviews}
            </span>

            <span className="stat-label">Interviews</span>

            <small className="stat-growth">
              Scheduled
            </small>
          </div>
        </div>

        <div className="stat-card brutalist-card">
          <div className="stat-icon sage">
            <Trophy size={22} />
          </div>

          <div>
            <span className="stat-number">
              {dashboardData.stats.offers}
            </span>

            <span className="stat-label">Offers</span>

            <small className="stat-growth">
              Current offers
            </small>
          </div>
        </div>

        <button
          type="button"
          className="stat-card add-card"
          onClick={() => setShowAddApplication(true)}
        >
          <div className="stat-icon">
            <Plus size={22} />
          </div>

          <div>
            <span className="stat-label">Add New Application</span>
            <small className="stat-growth">Track new entry</small>
          </div>

          <ArrowUpRight size={20} style={{ marginLeft: "auto" }} />
        </button>
      </section>

      {/* APPLICATION TRACKER */}
      <section className="tracker brutalist-card">

        <div className="tracker-header">
          <div className="tracker-title">
            <BriefcaseBusiness size={24} />
            <h2>Application Tracker</h2>
          </div>

          <div className="tracker-actions">

            <div className="search-box">
              <Search size={17} />

              <input
                placeholder="Search applications..."
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(event.target.value)
                }
              />
            </div>

            <button
              className="small-button"
              type="button"
              title="Clear search"
              onClick={() => setSearchTerm("")}
            >
              <Sparkles size={16} />
            </button>

            <button
              className="small-button"
              type="button"
              onClick={handleViewApplications}
            >
              + View
            </button>
          </div>
        </div>

        {/* FILTERS */}
        <div className="tracker-tabs">

          <button
            className={`tracker-tab ${
              activeFilter === "all" ? "active" : ""
            }`}
            onClick={() => setActiveFilter("all")}
          >
            All
          </button>

          <button
            className={`tracker-tab ${
              activeFilter === "saved" ? "active" : ""
            }`}
            onClick={() => setActiveFilter("saved")}
          >
            Not Started
          </button>

          <button
            className={`tracker-tab ${
              activeFilter === "applied" ? "active" : ""
            }`}
            onClick={() => setActiveFilter("applied")}
          >
            Applied
          </button>

          <button
            className={`tracker-tab ${
              activeFilter === "screening" ? "active" : ""
            }`}
            onClick={() => setActiveFilter("screening")}
          >
            Screening
          </button>

          <button
            className={`tracker-tab ${
              activeFilter === "interview" ? "active" : ""
            }`}
            onClick={() => setActiveFilter("interview")}
          >
            Interview
          </button>

          <button
            className={`tracker-tab ${
              activeFilter === "offer" ? "active" : ""
            }`}
            onClick={() => setActiveFilter("offer")}
          >
            Offered
          </button>
        </div>

        {/* PIPELINE */}
        <div className={`pipeline ${visibleColumns.length === 1 ? "single-column" : ""}`}>

          {visibleColumns.map((column) => {
            const columnApplications =
              getApplicationsByStatus(column.status);

            return (
              <div
                className={`pipeline-column ${column.color}`}
                key={column.status}
              >

                <div className="pipeline-heading">
                  <div>
                    <span className="pipeline-dot" />

                    <strong>{column.title}</strong>

                    <span className="pipeline-count">
                      {columnApplications.length}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setShowAddApplication(true)
                    }
                    title={`Add ${column.title} application`}
                  >
                    <Plus size={17} />
                  </button>
                </div>

                <button
                  className="new-job"
                  type="button"
                  onClick={() =>
                    setShowAddApplication(true)
                  }
                >
                  <Plus size={15} />
                  New
                </button>

                {/* REAL APPLICATION CARDS */}
                <div className="pipeline-applications">

                  {columnApplications.length === 0 ? (
                    <div className="pipeline-empty">
                      No applications
                    </div>
                  ) : (
                    columnApplications.map((application) => (
                      <button
                        type="button"
                        className="pipeline-application-card"
                        key={application.id}
                        onClick={handleOpenApplication}
                      >
                        <div className="pipeline-company">
                          <div className="company-logo">
                            {application.company_name
                              ? application.company_name
                                  .charAt(0)
                                  .toUpperCase()
                              : "C"}
                          </div>

                          <div>
                            <strong>
                              {application.job_title ||
                                `Job #${application.job_id}`}
                            </strong>

                            <span>
                              {application.company_name ||
                                "Company"}
                            </span>
                          </div>
                        </div>

                        <div className="pipeline-card-footer">
                          <span>
                            Application #{application.id}
                          </span>

                          <ChevronRight size={15} />
                        </div>
                      </button>
                    ))
                  )}

                </div>
              </div>
            );
          })}

        </div>
      </section>

      {/* BOTTOM SECTION */}
      <section className="bottom-grid">

        {/* RECENT APPLICATIONS */}
        <div className="recent-card brutalist-card">

          <div className="section-header">
            <div className="section-heading">
              <Clock3 size={21} />
              <h2>Recent Applications</h2>
            </div>

            <button
              className="view-link"
              onClick={handleViewApplications}
            >
              View all
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="applications-list">

            {applications.length === 0 ? (
              <div className="empty-state">
                No applications yet.
              </div>
            ) : (
              applications.slice(0, 5).map((application) => {

                const statusColors = {
                  saved: "neutral",
                  applied: "peach",
                  screening: "blue",
                  interview: "sage",
                  offer: "yellow",
                  rejected: "peach",
                  withdrawn: "neutral",
                };

                return (
                  <button
                    type="button"
                    className="application-row"
                    key={application.id}
                    onClick={handleOpenApplication}
                  >
                    <div className="company-logo">
                      {application.company_name
                        ? application.company_name
                            .charAt(0)
                            .toUpperCase()
                        : "C"}
                    </div>

                    <div className="application-company">
                      <strong>
                        {application.company_name ||
                          "Company"}
                      </strong>
                    </div>

                    <div className="application-role">
                      {application.job_title ||
                        `Job #${application.job_id}`}
                    </div>

                    <span
                      className={`status-tag ${
                        statusColors[application.status] ||
                        "neutral"
                      }`}
                    >
                      {STATUS_LABELS[application.status] ||
                        application.status}
                    </span>

                    <span className="application-date">
                      {formatDate(
                        application.applied_at ||
                          application.created_at
                      )}
                    </span>
                  </button>
                );
              })
            )}

          </div>
        </div>

        {/* UPCOMING INTERVIEWS */}
        <div className="interviews-card brutalist-card">

          <div className="section-header">
            <div className="section-heading">
              <CalendarDays size={21} />
              <h2>Upcoming Interviews</h2>
            </div>

            <button
              type="button"
              className="view-link"
              onClick={handleViewInterviews}
              title="View all interviews"
            >
              View all
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="interview-list">

            {upcomingInterviews.length === 0 ? (
              <div className="empty-state">
                No upcoming interviews.
              </div>
            ) : (
              upcomingInterviews.map((interview) => (
                <div
                  className="interview-item"
                  key={interview.id}
                  onClick={handleViewInterviews}
                  style={{ cursor: "pointer" }}
                >
                  <div className="company-logo">
                    {interview.company_name
                      ? interview.company_name
                          .charAt(0)
                          .toUpperCase()
                      : "C"}
                  </div>

                  <div className="interview-info">
                    <strong>
                      {interview.company_name || "Company"}
                    </strong>

                    <span>
                      {interview.job_title ? `${interview.job_title} • ` : ""}
                      {interview.interview_type || "Technical"}
                    </span>
                  </div>

                  <div className="interview-timing">
                    <span className="interview-date">
                      {formatDate(interview.interview_date)}
                    </span>

                    <span className="interview-time">
                      {formatTime(interview.interview_date)}
                    </span>
                  </div>

                  {interview.meeting_link && (
                    <a
                      href={interview.meeting_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="view-job-button join-btn small-btn"
                      onClick={(e) => e.stopPropagation()}
                      title="Join Meeting"
                    >
                      <Video size={13} />
                      <span>Join</span>
                    </a>
                  )}
                </div>
              ))
            )}

          </div>
        </div>

      </section>

      {/* ADD APPLICATION MODAL */}
      {showAddApplication && (
        <AddApplication
          onClose={() => setShowAddApplication(false)}
          onCreated={handleApplicationCreated}
        />
      )}

    </div>
  );
}