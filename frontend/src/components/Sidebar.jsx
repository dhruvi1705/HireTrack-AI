import {
  BriefcaseBusiness,
  LayoutDashboard,
  FileText,
  Building2,
  CalendarDays,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import { NavLink } from "react-router-dom";

const navItems = [
  {
    label: "Home",
    path: "/",
    icon: LayoutDashboard,
  },
  {
    label: "Applications",
    path: "/applications",
    icon: BriefcaseBusiness,
  },
  {
    label: "Jobs",
    path: "/jobs",
    icon: FileText,
  },
  {
    label: "Companies",
    path: "/companies",
    icon: Building2,
  },
  {
    label: "Interviews",
    path: "/interviews",
    icon: CalendarDays,
  },
];

export default function Sidebar() {
  return (
    <header className="top-nav">
      <div className="top-nav-inner">

        {/* Logo */}
        <NavLink to="/" className="brand">
          <div className="brand-icon">
            <BriefcaseBusiness size={22} strokeWidth={2.2} />
          </div>

          <span>
            HireTrack <strong>AI</strong>
          </span>
        </NavLink>

        {/* Navigation */}
        <nav className="main-nav">
          {navItems.map(({ label, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `nav-link ${isActive ? "active" : ""}`
              }
            >
              <Icon size={17} strokeWidth={2} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Right side */}
        <div className="nav-right">

          <NavLink to="/ai-tools" className="ai-nav-link">
            <Sparkles size={17} />
            AI Tools
          </NavLink>

          <button className="profile-button">
            <span className="profile-avatar">D</span>

            <span className="profile-name">
              Dhruvi
            </span>

            <ChevronDown size={16} />
          </button>

        </div>

      </div>
    </header>
  );
}