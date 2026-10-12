import { useEffect, useState } from "react";
import {
  BriefcaseBusiness,
  CalendarDays,
  Trophy,
  TrendingUp,
  BarChart3,
  Building2,
  Clock,
  CheckCircle2,
  XCircle,
  RotateCw,
  FileText,
  Layers,
  Target,
  Percent,
} from "lucide-react";
import analyticsService from "../services/analyticsService";
import "./Analytics.css";

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError("");
      const summary = await analyticsService.getSummary();
      setData(summary);
    } catch (err) {
      console.error("Failed to load analytics:", err);
      setError("Unable to load analytics. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;

    const fetchInitial = async () => {
      try {
        setLoading(true);
        setError("");
        const summary = await analyticsService.getSummary();
        if (!ignore) {
          setData(summary);
        }
      } catch (err) {
        if (!ignore) {
          console.error("Failed to load analytics:", err);
          setError("Unable to load analytics. Please try again.");
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
  }, []);

  const overview = data?.overview || {
    total_applications: 0,
    total_interviews: 0,
    total_offers: 0,
    response_rate: 0.0,
  };

  const pipeline = data?.application_pipeline || [];
  const activity = data?.application_activity || [];
  const interviewOverview = data?.interview_overview || {
    upcoming: 0,
    completed: 0,
    cancelled: 0,
    total: 0,
  };
  const topCompanies = data?.top_companies || [];
  const jobSearchSummary = data?.job_search_summary || {
    total_jobs: 0,
    total_companies: 0,
    user_applications: 0,
    user_interviews: 0,
  };
  const conversionMetrics = data?.conversion_metrics || {
    app_to_interview_rate: 0.0,
    interview_to_offer_rate: 0.0,
    rejection_rate: 0.0,
  };

  // Max count for activity chart scaling
  const maxActivityCount = Math.max(
    ...activity.map((point) => point.count),
    1
  );

  return (
    <div className="page-container analytics-page">
      {/* =========================================================
          HEADER
          ========================================================= */}
      <section className="page-header brutalist-card">
        <div>
          <span className="eyebrow">CAREER METRICS</span>
          <h1 className="page-title">Analytics</h1>
          <p>Understand your job search at a glance.</p>
        </div>

        <button
          type="button"
          className="brutalist-button"
          onClick={loadAnalytics}
          disabled={loading}
          title="Refresh analytics data"
        >
          <RotateCw size={16} className={loading ? "spin" : ""} />
          <span>Refresh</span>
        </button>
      </section>

      {/* ERROR BANNER */}
      {error && (
        <div className="form-error">
          <p>{error}</p>
          <button
            type="button"
            className="brutalist-button"
            onClick={loadAnalytics}
            style={{ marginTop: "8px", padding: "6px 12px", fontSize: "12px" }}
          >
            Retry
          </button>
        </div>
      )}

      {/* LOADING STATE */}
      {loading && !data && (
        <section className="analytics-loading brutalist-card">
          <RotateCw size={24} className="spin" />
          <p>Loading career analytics...</p>
        </section>
      )}

      {/* CONTENT */}
      {data && (
        <>
          {/* =========================================================
              1. CAREER OVERVIEW (4 Summary Cards)
              ========================================================= */}
          <section className="analytics-overview-grid">
            <div className="analytics-stat-card brutalist-card">
              <div className="stat-icon-wrapper yellow">
                <BriefcaseBusiness size={22} />
              </div>
              <div className="stat-content">
                <span className="stat-value">{overview.total_applications}</span>
                <span className="stat-title">Total Applications</span>
                <span className="stat-detail">Submitted or tracked</span>
              </div>
            </div>

            <div className="analytics-stat-card brutalist-card">
              <div className="stat-icon-wrapper sage">
                <CalendarDays size={22} />
              </div>
              <div className="stat-content">
                <span className="stat-value">{overview.total_interviews}</span>
                <span className="stat-title">Total Interviews</span>
                <span className="stat-detail">
                  {interviewOverview.upcoming} upcoming
                </span>
              </div>
            </div>

            <div className="analytics-stat-card brutalist-card">
              <div className="stat-icon-wrapper yellow">
                <Trophy size={22} />
              </div>
              <div className="stat-content">
                <span className="stat-value">{overview.total_offers}</span>
                <span className="stat-title">Offers Received</span>
                <span className="stat-detail">Confirmed job offers</span>
              </div>
            </div>

            <div className="analytics-stat-card brutalist-card">
              <div className="stat-icon-wrapper peach">
                <TrendingUp size={22} />
              </div>
              <div className="stat-content">
                <span className="stat-value">{overview.response_rate}%</span>
                <span className="stat-title">Response Rate</span>
                <span className="stat-detail">Responses / Total</span>
              </div>
            </div>
          </section>

          {/* =========================================================
              2-COLUMN ROW: Pipeline & Activity
              ========================================================= */}
          <div className="analytics-row-2col">
            {/* APPLICATION PIPELINE */}
            <section className="analytics-section brutalist-card pipeline-panel">
              <div className="panel-header">
                <div className="panel-heading">
                  <Layers size={18} />
                  <h2>Application Pipeline</h2>
                </div>
                <span className="panel-meta">
                  {overview.total_applications} Total
                </span>
              </div>

              {overview.total_applications === 0 ? (
                <div className="empty-state">
                  <p>No applications yet.</p>
                  <span>Add applications to see your recruitment funnel.</span>
                </div>
              ) : (
                <div className="pipeline-bars-container">
                  {pipeline.map((stage) => (
                    <div key={stage.status} className="pipeline-row">
                      <div className="pipeline-label-row">
                        <span
                          className={`status-tag status-${stage.status}`}
                        >
                          {stage.label}
                        </span>
                        <div className="pipeline-numbers">
                          <strong className="pipeline-count">
                            {stage.count}
                          </strong>
                          <span className="pipeline-pct">
                            ({stage.percentage}%)
                          </span>
                        </div>
                      </div>
                      <div className="pipeline-track-bar">
                        <div
                          className={`pipeline-fill-bar bar-${stage.status}`}
                          style={{
                            width: `${Math.max(stage.percentage, stage.count > 0 ? 3 : 0)}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* APPLICATION ACTIVITY */}
            <section className="analytics-section brutalist-card activity-panel">
              <div className="panel-header">
                <div className="panel-heading">
                  <BarChart3 size={18} />
                  <h2>Application Activity</h2>
                </div>
                <span className="panel-meta">Over Time</span>
              </div>

              {activity.length === 0 ? (
                <div className="empty-state">
                  <p>No application activity yet.</p>
                  <span>Your submission timelines will be charted here.</span>
                </div>
              ) : (
                <div className="activity-chart-wrapper">
                  <div className="chart-canvas">
                    {activity.map((point) => {
                      const barHeightPct = Math.round(
                        (point.count / maxActivityCount) * 100
                      );
                      return (
                        <div key={point.period} className="chart-bar-group">
                          <span className="chart-bar-value">{point.count}</span>
                          <div className="chart-bar-slot">
                            <div
                              className="chart-bar-fill"
                              style={{ height: `${Math.max(barHeightPct, 12)}%` }}
                              title={`${point.label}: ${point.count} application(s)`}
                            ></div>
                          </div>
                          <span className="chart-bar-label">{point.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* =========================================================
              2-COLUMN ROW: Interview Overview & Top Companies
              ========================================================= */}
          <div className="analytics-row-2col">
            {/* INTERVIEW OVERVIEW */}
            <section className="analytics-section brutalist-card interview-panel">
              <div className="panel-header">
                <div className="panel-heading">
                  <CalendarDays size={18} />
                  <h2>Interview Overview</h2>
                </div>
                <span className="panel-meta">
                  {interviewOverview.total} Total
                </span>
              </div>

              {interviewOverview.total === 0 ? (
                <div className="empty-state">
                  <p>No interview data yet.</p>
                  <span>Interviews you schedule will be tracked here.</span>
                </div>
              ) : (
                <div className="interview-breakdown-grid">
                  <div className="interview-breakdown-card sage">
                    <div className="breakdown-header">
                      <Clock size={16} />
                      <span>Upcoming</span>
                    </div>
                    <span className="breakdown-val">
                      {interviewOverview.upcoming}
                    </span>
                    <span className="breakdown-desc">
                      Future scheduled rounds
                    </span>
                  </div>

                  <div className="interview-breakdown-card blue">
                    <div className="breakdown-header">
                      <CheckCircle2 size={16} />
                      <span>Completed</span>
                    </div>
                    <span className="breakdown-val">
                      {interviewOverview.completed}
                    </span>
                    <span className="breakdown-desc">
                      Finished rounds
                    </span>
                  </div>

                  <div className="interview-breakdown-card peach">
                    <div className="breakdown-header">
                      <XCircle size={16} />
                      <span>Cancelled</span>
                    </div>
                    <span className="breakdown-val">
                      {interviewOverview.cancelled}
                    </span>
                    <span className="breakdown-desc">
                      Cancelled sessions
                    </span>
                  </div>
                </div>
              )}
            </section>

            {/* TOP COMPANIES */}
            <section className="analytics-section brutalist-card companies-panel">
              <div className="panel-header">
                <div className="panel-heading">
                  <Building2 size={18} />
                  <h2>Top Companies</h2>
                </div>
                <span className="panel-meta">By Applications</span>
              </div>

              {topCompanies.length === 0 ? (
                <div className="empty-state">
                  <p>No company activity yet.</p>
                  <span>Companies you apply to will appear here.</span>
                </div>
              ) : (
                <div className="top-companies-list">
                  {topCompanies.map((comp, idx) => (
                    <div key={comp.id} className="top-company-row">
                      <div className="company-rank-badge">#{idx + 1}</div>
                      <div className="company-info-block">
                        <span className="company-name">{comp.name}</span>
                        <div className="company-bar-track">
                          <div
                            className="company-bar-fill"
                            style={{ width: `${comp.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="company-count-block">
                        <strong className="company-app-count">
                          {comp.count}
                        </strong>
                        <span className="company-app-label">
                          {comp.count === 1 ? "app" : "apps"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* =========================================================
              CONVERSION METRICS PANEL
              ========================================================= */}
          <section className="analytics-section brutalist-card conversion-panel">
            <div className="panel-header">
              <div className="panel-heading">
                <Target size={18} />
                <h2>Conversion Funnel Metrics</h2>
              </div>
              <span className="panel-meta">Stage-by-Stage Efficiency</span>
            </div>

            <div className="conversion-metrics-grid">
              <div className="conversion-metric-card">
                <div className="conversion-metric-header">
                  <Percent size={15} />
                  <span>Application → Interview</span>
                </div>
                <div className="conversion-metric-val">
                  {conversionMetrics.app_to_interview_rate}%
                </div>
                <p className="conversion-metric-formula">
                  <strong>Calculation:</strong> (Applications reaching Interview or Offer ÷ Total Applications) × 100
                </p>
                <span className="conversion-metric-desc">
                  Measures resume & initial screening effectiveness.
                </span>
              </div>

              <div className="conversion-metric-card highlight">
                <div className="conversion-metric-header">
                  <Percent size={15} />
                  <span>Interview → Offer</span>
                </div>
                <div className="conversion-metric-val">
                  {conversionMetrics.interview_to_offer_rate}%
                </div>
                <p className="conversion-metric-formula">
                  <strong>Calculation:</strong> (Confirmed Job Offers ÷ Total Interviews) × 100
                </p>
                <span className="conversion-metric-desc">
                  Measures interview performance to offer conversion.
                </span>
              </div>

              <div className="conversion-metric-card">
                <div className="conversion-metric-header">
                  <Percent size={15} />
                  <span>Rejection Rate</span>
                </div>
                <div className="conversion-metric-val">
                  {conversionMetrics.rejection_rate}%
                </div>
                <p className="conversion-metric-formula">
                  <strong>Calculation:</strong> (Rejected Applications ÷ Total Applications) × 100
                </p>
                <span className="conversion-metric-desc">
                  Tracks market alignment and target competitiveness.
                </span>
              </div>
            </div>
          </section>

          {/* =========================================================
              JOB SEARCH SUMMARY
              ========================================================= */}
          <section className="analytics-section brutalist-card summary-panel">
            <div className="panel-header">
              <div className="panel-heading">
                <FileText size={18} />
                <h2>Job Search Summary</h2>
              </div>
              <span className="panel-meta">Workspace Totals</span>
            </div>

            <div className="summary-metrics-row">
              <div className="summary-metric-box">
                <span className="summary-box-label">TOTAL JOBS</span>
                <span className="summary-box-val">
                  {jobSearchSummary.total_jobs}
                </span>
                <span className="summary-box-sub">Available opportunities</span>
              </div>

              <div className="summary-metric-box">
                <span className="summary-box-label">COMPANIES</span>
                <span className="summary-box-val">
                  {jobSearchSummary.total_companies}
                </span>
                <span className="summary-box-sub">Registered employers</span>
              </div>

              <div className="summary-metric-box highlight">
                <span className="summary-box-label">YOUR APPLICATIONS</span>
                <span className="summary-box-val">
                  {jobSearchSummary.user_applications}
                </span>
                <span className="summary-box-sub">Active trackings</span>
              </div>

              <div className="summary-metric-box">
                <span className="summary-box-label">INTERVIEWS</span>
                <span className="summary-box-val">
                  {jobSearchSummary.user_interviews}
                </span>
                <span className="summary-box-sub">Recorded meetings</span>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
