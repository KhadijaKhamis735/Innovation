import { useNavigate } from "react-router-dom";
import ClubSidebar from "./ClubSidebar";
import { useClub } from "../context/ClubContext";
import "../../pages/InnovatorDashboard.css";

// ClubLayout
// ----------
// Renders the persistent Club sidebar (Dashboard, All Branches, My Committee,
// Elections, Meetings, Treasury, etc.) alongside the page body. Used to wrap
// every authenticated Club page so the sidebar stays put as the user
// navigates between club routes (branches, committees, elections, etc.).
//
// Public-style pages that previously used their own BrandHeader (e.g. the
// IBARA YA 4 branch listing) can be wrapped with this layout as well — the
// sidebar still appears, and the page can keep its own header/hero inside
// the `<main>` content area.
//
// The CSS is loaded from InnovatorDashboard.css so the existing .sidebar,
// .nav-item, .main-content, .top-bar, .page-title classes resolve.

export default function ClubLayout({ user, userRole = "member", children }) {
  const navigate = useNavigate();
  const { logoutClub } = useClub();

  const handleLogout = () => {
    if (logoutClub) logoutClub();
    navigate("/", { replace: true });
  };

  return (
    <div className="dashboard">
      <ClubSidebar user={user} userRole={userRole} onLogout={handleLogout} />
      <main className="main-content">{children}</main>
    </div>
  );
}
