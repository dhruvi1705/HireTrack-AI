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

const applications = [
  {
    company: "Google",
    role: "Frontend Developer",
    status: "Interview",
    date: "Sep 24",
    color: "sage",
  },
  {
    company: "Microsoft",
    role: "Software Engineer Intern",
    status: "Applied",
    date: "Sep 22",
    color: "peach",
  },
  {
    company: "Infosys",
    role: "Full Stack Developer",
    status: "Screening",
    date: "Sep 20",
    color: "blue",
  },
];

const pipeline = [
  {
    title: "Not Started",
    count: 3,
    color: "neutral",
    jobs: [
      ["Frontend Developer", "Amazon"],
      ["Software Engineer", "Adobe"],
    ],
  },
  {
    title: "Applied",
    count: 12,
    color: "peach",
    jobs: [
      ["SDE Intern", "Microsoft"],
      ["Graduate Engineer", "TCS"],
    ],
  },
  {
    title: "Screening",
    count: 6,
    color: "blue",
    jobs: [
      ["Full Stack Developer", "Infosys"],
      ["Software Developer", "Wipro"],
    ],
  },
  {
    title: "Interview",
    count: 5,
    color: "sage",
    jobs: [
      ["Technical Interview", "Google"],
      ["Application Developer", "Accenture"],
    ],
  },
  {
    title: "Offered",
    count: 1,
    color: "yellow",
    jobs: [
      ["Associate Analyst", "Deloitte"],
    ],
  },
];

export default function Dashboard() {
  return (
    <div className="dashboard page-container">

      {/* HERO */}
      <section className="dashboard-hero brutalist-card">

        <div className="hero-copy">
          <div className="eyebrow">
            Your Job Search
          </div>

          <h1 className="page-title">
            Workspace
          </h1>

          <p>
            Track, plan and achieve your dream career.
          </p>
        </div>

        <div className="hero-art">

          <div className="hero-doodle">
            ✦
          </div>

          <div className="hero-books">
            ▱
            <br />
            ▱
            <br />
            ▱
          </div>

          <div className="hero-note">
            <strong>Good things</strong>
            <br />
            take time.
          </div>

        </div>

        <div className="hero-quote">
          "A more organised you,
          <br />
          for a brighter career."
          <span>♡</span>
        </div>

      </section>


      {/* QUICK STATS */}
      <section className="stats-grid">

        <div className="stat-card brutalist-card">
          <div className="stat-icon peach">
            <FileText size={22} />
          </div>

          <div>
            <span className="stat-number">24</span>
            <span className="stat-label">
              Applications
            </span>

            <small className="stat-growth">
              ↑ +12% from last month
            </small>
          </div>
        </div>


        <div className="stat-card brutalist-card">
          <div className="stat-icon peach">
            <CalendarDays size={22} />
          </div>

          <div>
            <span className="stat-number">5</span>
            <span className="stat-label">
              Interviews
            </span>

            <small className="stat-growth">
              ↑ +2 this month
            </small>
          </div>
        </div>


        <div className="stat-card brutalist-card">
          <div className="stat-icon sage">
            <Trophy size={22} />
          </div>

          <div>
            <span className="stat-number">1</span>
            <span className="stat-label">
              Offers
            </span>

            <small className="stat-growth">
              ✨ 1 active offer
            </small>
          </div>
        </div>


        <button className="stat-card add-card">
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
              <input
                placeholder="Search applications..."
              />
            </div>

            <button className="small-button">
              <Sparkles size={16} />
            </button>

            <button className="small-button">
              + View
            </button>

          </div>

        </div>


        {/* FILTERS */}
        <div className="tracker-tabs">
          <button className="tracker-tab active">
            All
          </button>

          <button className="tracker-tab">
            Not Started
          </button>

          <button className="tracker-tab">
            Applied
          </button>

          <button className="tracker-tab">
            Screening
          </button>

          <button className="tracker-tab">
            Interview
          </button>

          <button className="tracker-tab">
            Offered
          </button>
        </div>


        {/* PIPELINE */}
        <div className="pipeline">

          {pipeline.map((column) => (
            <div
              className={`pipeline-column ${column.color}`}
              key={column.title}
            >

              <div className="pipeline-heading">

                <div>
                  <span className="pipeline-dot" />
                  <strong>{column.title}</strong>
                  <span className="pipeline-count">
                    {column.count}
                  </span>
                </div>

                <button>
                  <Plus size={17} />
                </button>

              </div>


              {column.jobs.map(([role, company]) => (
                <div
                  className="job-card"
                  key={`${company}-${role}`}
                >

                  <div className="company-logo">
                    {company.charAt(0)}
                  </div>

                  <div className="job-info">
                    <strong>{role}</strong>
                    <span>{company}</span>
                  </div>

                  <button className="bookmark">
                    ♡
                  </button>

                </div>
              ))}


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

            {applications.map((application) => (
              <div
                className="application-row"
                key={application.company}
              >

                <div className="company-logo">
                  {application.company.charAt(0)}
                </div>

                <div className="application-company">
                  <strong>{application.company}</strong>
                </div>

                <div className="application-role">
                  {application.role}
                </div>

                <span
                  className={`status-tag ${application.color}`}
                >
                  {application.status}
                </span>

                <span className="application-date">
                  {application.date}
                </span>

              </div>
            ))}

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

            <div className="interview-item">

              <div className="company-logo">
                G
              </div>

              <div className="interview-info">
                <strong>Google</strong>
                <span>Technical Interview</span>
              </div>

              <span className="interview-date">
                Tomorrow
              </span>

              <span className="interview-time">
                10:30 AM
              </span>

            </div>


            <div className="interview-item">

              <div className="company-logo">
                M
              </div>

              <div className="interview-info">
                <strong>Microsoft</strong>
                <span>HR Interview</span>
              </div>

              <span className="interview-date">
                Oct 2
              </span>

              <span className="interview-time">
                2:00 PM
              </span>

            </div>

          </div>

        </div>

      </section>

    </div>
  );
}