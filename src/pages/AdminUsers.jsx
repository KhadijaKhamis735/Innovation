import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./AdminPanel.css";

// Mock data
const mockUsers = [
  { id: 1, name: "Alex Johnson", email: "alex.j@email.com", location: "Lagos, Nigeria", role: "Innovator", joinedDate: "May 18, 2026", status: "active" },
  { id: 2, name: "Fatima Hassan", email: "fatima.h@email.com", location: "Nairobi, Kenya", role: "Innovator", joinedDate: "May 16, 2026", status: "active" },
  { id: 3, name: "James Odhiambo", email: "james.o@email.com", location: "Accra, Ghana", role: "Innovator", joinedDate: "May 14, 2026", status: "active" },
  { id: 4, name: "Priya Mwangi", email: "priya.m@email.com", location: "Dar es Salaam, Tanzania", role: "Innovator", joinedDate: "May 12, 2026", status: "active" },
  { id: 5, name: "David Kimani", email: "david.k@email.com", location: "Johannesburg, SA", role: "Innovator", joinedDate: "May 10, 2026", status: "active" },
  { id: 6, name: "Sarah Wanjiku", email: "sarah.w@email.com", location: "Kampala, Uganda", role: "Innovator", joinedDate: "May 8, 2026", status: "active" },
  { id: 7, name: "Michael Otieno", email: "michael.o@email.com", location: "Addis Ababa, Ethiopia", role: "Innovator", joinedDate: "May 6, 2026", status: "inactive" },
];

export default function AdminUsers() {
  const navigate = useNavigate();
  const [toast, setToast] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    navigate("/admin/login");
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const filteredUsers = mockUsers.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(search.toLowerCase()) ||
                         user.email.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || user.status === filter;
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: mockUsers.length,
    active: mockUsers.filter(u => u.status === "active").length,
    inactive: mockUsers.filter(u => u.status === "inactive").length,
  };

  return (
    <div className="admin-dashboard">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <div className="admin-sidebar-logo">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </div>
          <span className="admin-sidebar-brand">Admin Panel</span>
        </div>

        <nav className="admin-sidebar-nav">
          <Link to="/admin/dashboard" className="admin-nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
            <span>Dashboard</span>
          </Link>
          <Link to="/admin/organizations" className="admin-nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 21h18" />
              <path d="M5 21V7l8-4v18" />
              <path d="M19 21V11l-6-4" />
            </svg>
            <span>Funders</span>
          </Link>
          <Link to="/admin/users" className="admin-nav-item active">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span>Users</span>
          </Link>
          <Link to="/admin/opportunities" className="admin-nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
            <span>Opportunities</span>
          </Link>
        </nav>

        <div className="admin-sidebar-footer">
          <Link to="/" className="admin-nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span>Home</span>
          </Link>
          <button className="admin-nav-item admin-nav-logout" onClick={handleLogout}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        <header className="admin-top-bar">
          <div className="admin-top-bar-left">
            <h1>Users</h1>
            <p>Manage all platform users</p>
          </div>
        </header>

        {/* Stats */}
        <div className="admin-stats-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
          <div className="admin-stat-card">
            <div className="admin-stat-icon blue">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
              </svg>
            </div>
            <div className="admin-stat-info">
              <h3>{stats.total}</h3>
              <p>Total Users</p>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-icon green">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div className="admin-stat-info">
              <h3>{stats.active}</h3>
              <p>Active</p>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-icon" style={{ background: "#f1f5f9", color: "#64748b" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
            </div>
            <div className="admin-stat-info">
              <h3>{stats.inactive}</h3>
              <p>Inactive</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="admin-filter-bar">
          <button className={`admin-filter-btn ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>All</button>
          <button className={`admin-filter-btn ${filter === "active" ? "active" : ""}`} onClick={() => setFilter("active")}>Active</button>
          <button className={`admin-filter-btn ${filter === "inactive" ? "active" : ""}`} onClick={() => setFilter("inactive")}>Inactive</button>
        </div>

        {/* Search */}
        <div className="admin-search">
          <input
            type="text"
            className="admin-search-input"
            placeholder="Search users by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Table */}
        {filteredUsers.length === 0 ? (
          <div className="admin-card">
            <div className="admin-empty">
              <div className="admin-empty-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                </svg>
              </div>
              <h3>No users found</h3>
              <p>Try adjusting your search</p>
            </div>
          </div>
        ) : (
          <div className="admin-card">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Location</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="admin-user-avatar">
                        <div className="admin-avatar-circle">{user.name.charAt(0)}</div>
                        <div className="admin-user-info">
                          <strong>{user.name}</strong>
                          <span>{user.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>{user.location}</td>
                    <td><span className="admin-badge admin-badge-active">{user.role}</span></td>
                    <td>
                      <span className={`admin-badge admin-badge-${user.status === "active" ? "approved" : "rejected"}`}>
                        {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                      </span>
                    </td>
                    <td>{user.joinedDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {toast && <div className="admin-toast">{toast}</div>}
    </div>
  );
}