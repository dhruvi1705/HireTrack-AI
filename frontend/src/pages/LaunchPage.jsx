import { useNavigate } from "react-router-dom";
import {
  BriefcaseBusiness,
  ArrowRight,
  FileText,
  Building2,
  CalendarDays,
  LayoutDashboard,
  Sparkles,
  Compass,
  TrendingUp,
  Layers,
  ArrowDown,
  Clock,
  HelpCircle,
} from "lucide-react";
import authService from "../services/authService";
import "./LaunchPage.css";

export default function LaunchPage() {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    if (authService.isAuthenticated()) {
      navigate("/dashboard");
    } else {
      navigate("/login");
    }
  };

  return (
    <div className="launch-container">
      {/* =========================================================
          NAVBAR
          ========================================================= */}
      <header className="launch-nav">
        <div className="launch-nav-inner">
          <div className="launch-brand" onClick={() => navigate("/")}>
            <div className="launch-brand-icon">
              <BriefcaseBusiness size={22} strokeWidth={2.2} />
            </div>
            <div className="launch-brand-text">
              <span className="brand-title">
                HireTrack <strong>AI</strong>
              </span>
              <span className="brand-tagline">Your career workspace</span>
            </div>
          </div>

          <div className="launch-nav-actions">
            <button
              type="button"
              className="launch-btn-primary nav-cta"
              onClick={handleGetStarted}
            >
              <span>Get Started</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </header>

      <main className="launch-main">
        {/* =========================================================
            HERO SECTION
            ========================================================= */}
        <section className="launch-hero-section">
          <div className="launch-hero-grid">
            {/* Left Column: Headline, Supporting Text, CTA */}
            <div className="launch-hero-content">
              <div className="hero-eyebrow">
                <span className="eyebrow-dot"></span>
                <span>INTELLIGENT CAREER MANAGEMENT</span>
              </div>

              <h1 className="hero-headline">
                Your job search,
                <br />
                <span className="headline-highlight">tracked intelligently.</span>
              </h1>

              <p className="hero-description">
                HireTrack AI brings your jobs, applications, companies, and
                interviews together in one intelligent career workspace.
              </p>

              <div className="hero-cta-wrapper">
                <button
                  type="button"
                  className="launch-btn-primary hero-cta-btn"
                  onClick={handleGetStarted}
                >
                  <span>Get Started</span>
                  <ArrowRight size={18} />
                </button>
                <p className="hero-subtext">
                  Organize your search. Understand your progress. Make smarter moves.
                </p>
              </div>
            </div>

            {/* Right Column: Component-Based Hero Workspace Visual */}
            <div className="launch-hero-visual-wrapper">
              <div className="product-visual-card brutalist-card">
                <div className="visual-top-bar">
                  <div className="visual-window-dots">
                    <span className="window-dot red"></span>
                    <span className="window-dot yellow"></span>
                    <span className="window-dot green"></span>
                  </div>
                  <span className="visual-badge">WORKSPACE PREVIEW</span>
                </div>

                <div className="visual-brand-strip">
                  <div className="visual-brand-title">
                    <BriefcaseBusiness size={16} />
                    <span>HIRETRACK AI</span>
                  </div>
                  <span className="visual-status-pill">ACTIVE WORKSPACE</span>
                </div>

                {/* Metrics Summary Row */}
                <div className="visual-metrics-grid">
                  <div className="visual-metric-box">
                    <span className="metric-label">APPLICATIONS</span>
                    <span className="metric-val">12</span>
                  </div>
                  <div className="visual-metric-box highlight">
                    <span className="metric-label">INTERVIEWS</span>
                    <span className="metric-val">3</span>
                  </div>
                  <div className="visual-metric-box">
                    <span className="metric-label">ACTIVE JOBS</span>
                    <span className="metric-val">8</span>
                  </div>
                </div>

                {/* Upcoming Interview Card Preview */}
                <div className="visual-interview-card">
                  <div className="interview-card-header">
                    <div className="interview-badge">
                      <Clock size={13} />
                      <span>Upcoming Interview</span>
                    </div>
                    <span className="interview-type-tag">Technical</span>
                  </div>

                  <div className="interview-role-title">Frontend Developer</div>
                  <div className="interview-meta-row">
                    <span className="meta-time">Tomorrow · 2:00 PM</span>
                    <span className="meta-sep">•</span>
                    <span className="meta-link">Meeting Link Ready</span>
                  </div>
                </div>

                {/* Pipeline Progression Preview Bar */}
                <div className="visual-pipeline-preview">
                  <div className="pipeline-header-row">
                    <span>SEARCH PIPELINE</span>
                    <span className="pipeline-phase">64% In Progress</span>
                  </div>
                  <div className="pipeline-track">
                    <div className="pipeline-segment saved" style={{ width: "25%" }}></div>
                    <div className="pipeline-segment applied" style={{ width: "35%" }}></div>
                    <div className="pipeline-segment interview" style={{ width: "25%" }}></div>
                    <div className="pipeline-segment offer" style={{ width: "15%" }}></div>
                  </div>
                  <div className="pipeline-legend">
                    <span>Saved</span>
                    <span>Applied</span>
                    <span>Interview</span>
                    <span>Offer</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================
            PROBLEM / VALUE SECTION
            ========================================================= */}
        <section className="launch-section problem-section">
          <div className="section-header">
            <span className="section-label">THE PROBLEM & THE SOLUTION</span>
            <h2 className="section-heading">
              Your job search shouldn't live in five different places.
            </h2>
            <p className="section-subheading">
              Keep job opportunities, applications, company information, and
              interviews organized in one place instead of scattered across
              spreadsheets, notes, bookmarks, and calendars.
            </p>
          </div>

          <div className="problem-blocks-grid">
            <div className="problem-block-card">
              <div className="block-number-badge">01</div>
              <div className="block-icon-wrap">
                <Layers size={22} />
              </div>
              <h3 className="block-title">01 — Track</h3>
              <p className="block-text">
                Keep every application and opportunity organized.
              </p>
            </div>

            <div className="problem-block-card">
              <div className="block-number-badge">02</div>
              <div className="block-icon-wrap">
                <Compass size={22} />
              </div>
              <h3 className="block-title">02 — Understand</h3>
              <p className="block-text">
                See where your job search stands at a glance.
              </p>
            </div>

            <div className="problem-block-card">
              <div className="block-number-badge">03</div>
              <div className="block-icon-wrap">
                <TrendingUp size={22} />
              </div>
              <h3 className="block-title">03 — Improve</h3>
              <p className="block-text">
                Use intelligent insights to make better career decisions.
              </p>
            </div>
          </div>
        </section>

        {/* =========================================================
            CORE FEATURES
            ========================================================= */}
        <section className="launch-section features-section">
          <div className="section-header">
            <span className="section-label">COMPLETE CAPABILITIES</span>
            <h2 className="section-heading">
              Everything you need to manage your search.
            </h2>
          </div>

          <div className="features-grid">
            {/* Feature 01 */}
            <div className="feature-card">
              <div className="feature-card-top">
                <span className="feature-idx">01</span>
                <div className="feature-icon-box">
                  <FileText size={20} />
                </div>
              </div>
              <h3 className="feature-title">01 — Jobs</h3>
              <p className="feature-desc">
                Save and organize job opportunities with company and role details.
              </p>
            </div>

            {/* Feature 02 */}
            <div className="feature-card">
              <div className="feature-card-top">
                <span className="feature-idx">02</span>
                <div className="feature-icon-box">
                  <BriefcaseBusiness size={20} />
                </div>
              </div>
              <h3 className="feature-title">02 — Applications</h3>
              <p className="feature-desc">
                Track application status, dates, notes, and progress.
              </p>
            </div>

            {/* Feature 03 */}
            <div className="feature-card">
              <div className="feature-card-top">
                <span className="feature-idx">03</span>
                <div className="feature-icon-box">
                  <Building2 size={20} />
                </div>
              </div>
              <h3 className="feature-title">03 — Companies</h3>
              <p className="feature-desc">
                Keep company information organized alongside your opportunities.
              </p>
            </div>

            {/* Feature 04 */}
            <div className="feature-card">
              <div className="feature-card-top">
                <span className="feature-idx">04</span>
                <div className="feature-icon-box">
                  <CalendarDays size={20} />
                </div>
              </div>
              <h3 className="feature-title">04 — Interviews</h3>
              <p className="feature-desc">
                Manage upcoming interviews, types, meeting links, and notes.
              </p>
            </div>

            {/* Feature 05 */}
            <div className="feature-card">
              <div className="feature-card-top">
                <span className="feature-idx">05</span>
                <div className="feature-icon-box">
                  <LayoutDashboard size={20} />
                </div>
              </div>
              <h3 className="feature-title">05 — Dashboard</h3>
              <p className="feature-desc">
                See your career-search activity and upcoming priorities in one place.
              </p>
            </div>

            {/* Feature 06: AI Career Assistant */}
            <div className="feature-card ai-feature-card">
              <div className="feature-card-top">
                <span className="feature-idx highlight">06</span>
                <div className="feature-icon-box ai-icon-box">
                  <Sparkles size={20} />
                </div>
              </div>
              <div className="ai-badge">NEXT INTELLIGENCE LAYER</div>
              <h3 className="feature-title">06 — AI Career Assistant</h3>
              <p className="feature-desc">
                Get intelligent insights and recommendations based on your
                HireTrack data.
              </p>
              <div className="ai-feature-note">
                AI-powered career guidance built into your workspace.
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================
            AI DIFFERENTIATOR
            ========================================================= */}
        <section className="launch-section ai-differentiator-section">
          <div className="section-header">
            <span className="section-label">INTELLIGENCE LAYER</span>
            <h2 className="section-heading">More than a tracker.</h2>
            <p className="section-subheading">
              HireTrack AI is designed to understand your career activity—not
              just store it.
            </p>
          </div>

          <div className="ai-concept-wrapper">
            {/* Conceptual Flow Diagram */}
            <div className="ai-flow-container">
              <div className="flow-step">
                <span className="flow-step-tag">STEP 1</span>
                <div className="flow-step-box">
                  <strong>YOUR DATA</strong>
                  <span>Raw Search Inputs</span>
                </div>
              </div>

              <div className="flow-arrow">
                <ArrowDown size={18} className="arrow-down" />
                <ArrowRight size={18} className="arrow-right" />
              </div>

              <div className="flow-step">
                <span className="flow-step-tag">STEP 2</span>
                <div className="flow-step-box">
                  <strong>Jobs + Applications + Interviews</strong>
                  <span>Unified Tracking</span>
                </div>
              </div>

              <div className="flow-arrow">
                <ArrowDown size={18} className="arrow-down" />
                <ArrowRight size={18} className="arrow-right" />
              </div>

              <div className="flow-step">
                <span className="flow-step-tag highlight">STEP 3</span>
                <div className="flow-step-box highlight">
                  <div className="box-title-with-icon">
                    <Sparkles size={16} />
                    <strong>HIRETRACK AI</strong>
                  </div>
                  <span>Intelligence Engine</span>
                </div>
              </div>

              <div className="flow-arrow">
                <ArrowDown size={18} className="arrow-down" />
                <ArrowRight size={18} className="arrow-right" />
              </div>

              <div className="flow-step">
                <span className="flow-step-tag">OUTPUT</span>
                <div className="flow-step-box output">
                  <strong>Insights + Recommendations</strong>
                  <span>Actionable Guidance</span>
                </div>
              </div>
            </div>

            {/* Example Future Questions */}
            <div className="ai-questions-wrapper">
              <div className="questions-title-row">
                <HelpCircle size={16} />
                <span>EXAMPLES OF INTENDED AI FUNCTIONALITY</span>
              </div>

              <div className="questions-grid">
                <div className="question-bubble">
                  <span className="q-mark">“</span>
                  <p>What should I focus on today?</p>
                </div>
                <div className="question-bubble">
                  <span className="q-mark">“</span>
                  <p>Which applications need follow-up?</p>
                </div>
                <div className="question-bubble">
                  <span className="q-mark">“</span>
                  <p>What interviews are coming up?</p>
                </div>
                <div className="question-bubble">
                  <span className="q-mark">“</span>
                  <p>Which opportunities should I prioritize?</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================
            HOW IT WORKS
            ========================================================= */}
        <section className="launch-section how-it-works-section">
          <div className="section-header">
            <span className="section-label">HOW IT WORKS</span>
            <h2 className="section-heading">
              Simple to start. Smarter as you use it.
            </h2>
          </div>

          <div className="steps-container">
            <div className="step-card">
              <div className="step-badge">01</div>
              <h3 className="step-title">ADD YOUR OPPORTUNITIES</h3>
              <p className="step-description">
                Add jobs and companies you are interested in.
              </p>
            </div>

            <div className="step-divider">
              <ArrowRight size={22} className="step-arrow-right" />
              <ArrowDown size={22} className="step-arrow-down" />
            </div>

            <div className="step-card">
              <div className="step-badge">02</div>
              <h3 className="step-title">TRACK YOUR PROGRESS</h3>
              <p className="step-description">
                Manage applications, statuses, interviews, and notes.
              </p>
            </div>

            <div className="step-divider">
              <ArrowRight size={22} className="step-arrow-right" />
              <ArrowDown size={22} className="step-arrow-down" />
            </div>

            <div className="step-card highlight-step">
              <div className="step-badge">03</div>
              <h3 className="step-title">MAKE BETTER DECISIONS</h3>
              <p className="step-description">
                Use your career data and upcoming AI capabilities to understand
                what deserves your attention.
              </p>
            </div>
          </div>
        </section>

        {/* =========================================================
            FINAL CTA
            ========================================================= */}
        <section className="launch-section final-cta-section">
          <div className="cta-banner brutalist-card">
            <div className="cta-content">
              <span className="cta-label">START TODAY</span>
              <h2 className="cta-heading">Take control of your job search.</h2>
              <p className="cta-subheading">
                Build a clearer picture of your applications, opportunities, and
                next steps.
              </p>
            </div>

            <div className="cta-action">
              <button
                type="button"
                className="launch-btn-primary cta-large-btn"
                onClick={handleGetStarted}
              >
                <span>Get Started</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* =========================================================
          FOOTER
          ========================================================= */}
      <footer className="launch-footer">
        <div className="launch-footer-inner">
          <div className="footer-brand">
            <div className="launch-brand-icon sm">
              <BriefcaseBusiness size={18} strokeWidth={2.2} />
            </div>
            <span className="footer-title">
              HireTrack <strong>AI</strong>
            </span>
          </div>

          <p className="footer-tagline">Your career workspace.</p>
          <p className="footer-subtext">Built to organize the modern job search.</p>
        </div>
      </footer>
    </div>
  );
}
