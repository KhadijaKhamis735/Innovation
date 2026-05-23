import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Sidebar.css";

const innovatorLinks = [
  { to: "/dashboard/innovator", label: "Dashboard", icon: "⊞" },
  { to: "/dashboard/innovator/projects", label: "My Projects", icon: "◈" },
  { to: "/dashboard/innovator/opportunities", label: "Browse Opportunities", icon: "◉" },
  { to: "/dashboard/innovator/applications", label: "My Applications", icon: "◐" },
];

const funderLinks = [
  { to: "/dashboard/funder", label: "Dashboard", icon: "⊞" },
  { to: "/dashboard/funder/post", label: "Post Opportunity", icon: "◈" },
  { to: "/dashboard/funder/opportunities", label: "My Opportunities", icon: "◉" },
  { to: "/dashboard/funder/applications", label: "Applications", icon: "◐" },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const links = user?.role === "innovator" ? innovatorLinks : funderLinks;

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <Link to="/" className="sidebar-logo-link">
          <div className="sidebar-logo">IM</div>
          <span className="sidebar-logo-text">IMS</span>
        </Link>
      </div>

      <div className="sidebar-user">
        <div className="sidebar-avatar">{user?.name?.charAt(0)}</div>
        <div className="sidebar-user-info">
          <p className="sidebar-user-name">{user?.name}</p>
          <p className="sidebar-user-role">{user?.role}</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        {links.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={`sidebar-link ${location.pathname === link.to ? "active" : ""}`}
          >
            <span className="sidebar-icon">{link.icon}</span>
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button
          className="sidebar-logout"
          onClick={() => { logout(); navigate("/"); }}
        >
          ↩ Logout
        </button>
      </div>
    </aside>
  );
}
