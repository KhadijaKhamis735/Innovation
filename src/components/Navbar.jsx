import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Navbar.css";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <div className="navbar-logo">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
        </div>
        <span className="navbar-title">Innovation Management</span>
      </Link>

      <div className="navbar-actions">
        {!user ? (
          <>
            <Link to="/login" className="navbar-link">Log In</Link>
            <Link to="/register" state={{ defaultRole: "innovator" }} className="btn-primary">
              Get Started
            </Link>
          </>
        ) : (
          <>
            <div className="navbar-avatar">{user.name.charAt(0)}</div>
            <span className="navbar-username">{user.name}</span>
            <button className="navbar-logout" onClick={handleLogout}>Logout</button>
          </>
        )}
      </div>
    </nav>
  );
}