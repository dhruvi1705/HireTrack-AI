import { useEffect, useRef, useState } from "react";
import {
  BriefcaseBusiness,
  LayoutDashboard,
  FileText,
  Building2,
  CalendarDays,
  Sparkles,
  ChevronDown,
  LogOut,
  BarChart3,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import authService from "../services/authService";
import "./Sidebar.css";

const navItems = [
  {
    label: "Home",
    path: "/dashboard",
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
  {
    label: "Analytics",
    path: "/analytics",
    icon: BarChart3,
  },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    let ignore = false;

    authService
      .getCurrentUser()
      .then((data) => {
        if (!ignore && data) {
          setUser(data);
        }
      })
      .catch(() => {
        // Fallback silently if offline or token not ready
      });

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      ignore = true;
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    setDropdownOpen(false);
    authService.logout();
    navigate("/login");
  };

  const displayName = user?.full_name || "Dhruvi";
  const avatarLetter = (displayName[0] || "D").toUpperCase();

  return (
    <header className="top-nav">
      <div className="top-nav-inner">

        {/* Logo */}
        <NavLink to="/dashboard" className="brand">
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
              end={path === "/dashboard"}
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

          <div className="profile-wrapper" ref={dropdownRef}>
            <button
              type="button"
              className="profile-button"
              onClick={() => setDropdownOpen((prev) => !prev)}
              aria-expanded={dropdownOpen}
            >
              <span className="profile-avatar">{avatarLetter}</span>

              <span className="profile-name">
                {displayName}
              </span>

              <ChevronDown size={16} />
            </button>

            {dropdownOpen && (
              <div className="profile-dropdown">
                <div className="profile-dropdown-header">
                  <div className="profile-dropdown-name">{displayName}</div>
                  {user?.email && (
                    <div className="profile-dropdown-email">{user.email}</div>
                  )}
                </div>

                <button
                  type="button"
                  className="profile-logout-button"
                  onClick={handleLogout}
                >
                  <LogOut size={16} />
                  <span>Log out</span>
                </button>
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
}