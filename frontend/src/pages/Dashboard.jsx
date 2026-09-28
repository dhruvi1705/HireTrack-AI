import { useEffect, useState } from "react";

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
} from "lucide-react";

import dashboardService from "../services/dashboardService";
import AddApplication from "../components/AddApplication";

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddApplication, setShowAddApplication] = useState(false);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const data = await dashboardService.getSummary();

        setDashboardData(data);
      } catch (error) {
        console.error("Dashboard loading failed:", error);

        setError(
          error.response?.data?.detail || "Unable to load dashboard data.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

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
        <div className="brutalist-card dashboard-error">{error}</div>
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

            <button className="brutalist-button">
              Explore Jobs
              <ArrowUpRight size={17} />
            </button>
          </div>
        </div>

        {/* Decorative career illustration */}
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
        {/* Applications */}
        <div className="stat-card brutalist-card">
          <div className="stat-icon peach">
            <FileText size={22} />
          </div>

          <div>
            <span className="stat-number">
              {dashboardData.stats.applications}
            </span>

            <span className="stat-label">Applications</span>

            <small className="stat-growth">Total tracked</small>
          </div>
        </div>

        {/* Interviews */}
        <div className="stat-card brutalist-card">
          <div className="stat-icon peach">
            <CalendarDays size={22} />
          </div>

          <div>
            <span className="stat-number">
              {dashboardData.stats.interviews}
            </span>

            <span className="stat-label">Interviews</span>

            <small className="stat-growth">Scheduled</small>
          </div>
        </div>

        {/* Offers */}
        <div className="stat-card brutalist-card">
          <div className="stat-icon sage">
            <Trophy size={22} />
          </div>

          <div>
            <span className="stat-number">{dashboardData.stats.offers}</span>

            <span className="stat-label">Offers</span>

            <small className="stat-growth">Current offers</small>
          </div>
        </div>

        {/* Add Application */}
        <button
          className="stat-card add-card"
          onClick={() => setShowAddApplication(true)}
        >
          <div className="add-icon">
            <Plus size={25} />
          </div>

          <div>
            <strong>Add New</strong>

            <strong>Application</strong>
          </div>

          <ArrowUpRight size={22} />
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

              <input placeholder="Search applications..." />
            </div>

            <button className="small-button">
              <Sparkles size={16} />
            </button>

            <button className="small-button">+ View</button>
          </div>
        </div>

        {/* FILTERS */}
        <div className="tracker-tabs">
          <button className="tracker-tab active">All</button>

          <button className="tracker-tab">Not Started</button>

          <button className="tracker-tab">Applied</button>

          <button className="tracker-tab">Screening</button>

          <button className="tracker-tab">Interview</button>

          <button className="tracker-tab">Offered</button>
        </div>

        {/* PIPELINE */}
        <div className="pipeline">
          {[
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
          ].map((column) => (
            <div
              className={`pipeline-column ${column.color}`}
              key={column.status}
            >
              <div className="pipeline-heading">
                <div>
                  <span className="pipeline-dot" />

                  <strong>{column.title}</strong>

                  <span className="pipeline-count">
                    {dashboardData.pipeline[column.status]}
                  </span>
                </div>

                <button>
                  <Plus size={17} />
                </button>
              </div>

              <button className="new-job">
                <Plus size={15} />
                New
              </button>
            </div>
          ))}
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

            <button className="view-link">
              View all
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="applications-list">
            {dashboardData.recent_applications.length === 0 ? (
              <div className="empty-state">No applications yet.</div>
            ) : (
              dashboardData.recent_applications.map((application) => {
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
                  <div className="application-row" key={application.id}>
                    <div className="company-logo">
                      {application.company.charAt(0)}
                    </div>

                    <div className="application-company">
                      <strong>{application.company}</strong>
                    </div>

                    <div className="application-role">{application.role}</div>

                    <span
                      className={`status-tag ${
                        statusColors[application.status] || "neutral"
                      }`}
                    >
                      {application.status}
                    </span>

                    <span className="application-date">
                      {application.applied_at
                        ? new Date(application.applied_at).toLocaleDateString()
                        : new Date(application.created_at).toLocaleDateString()}
                    </span>
                  </div>
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

            <button className="view-link">
              View all
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="interview-list">
            {dashboardData.upcoming_interviews.length === 0 ? (
              <div className="empty-state">No upcoming interviews.</div>
            ) : (
              dashboardData.upcoming_interviews.map((interview) => (
                <div className="interview-item" key={interview.id}>
                  <div className="company-logo">
                    {interview.company.charAt(0)}
                  </div>

                  <div className="interview-info">
                    <strong>{interview.company}</strong>

                    <span>{interview.type}</span>
                  </div>

                  <span className="interview-date">{interview.date}</span>

                  <span className="interview-time">{interview.time}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
      {showAddApplication && (
        <AddApplication
          onClose={() => setShowAddApplication(false)}
          onCreated={() => {
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
