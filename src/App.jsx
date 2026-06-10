import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

// Innovator pages
import InnovatorDashboard from "./pages/InnovatorDashboard";
import MyProjects from "./pages/MyProjects";
import BrowseOpportunities from "./pages/BrowseOpportunities";
import MyApplication from "./pages/MyApplication";
import Settings from "./pages/Settings";

// Organization pages
import OrganizationDashboard from "./pages/OrganizationDashboard";
import PostOpportunity from "./pages/PostOpportunity";
import MyOpportunities from "./pages/MyOpportunities";
import ReceivedApplications from "./pages/ReceivedApplications";

// Admin pages
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminOrganizations from "./pages/AdminOrganizations";
import AdminUsers from "./pages/AdminUsers";
import AdminOpportunities from "./pages/AdminOpportunities";

function ProtectedRoute({ children, role }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) {
    return <Navigate to={user.role === "innovator" ? "/dashboard/innovator" : "/dashboard/funder"} replace />;
  }
  return children;
}

function AdminRoute({ children }) {
  const adminToken = localStorage.getItem("adminToken");
  if (!adminToken) return <Navigate to="/admin/login" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Innovator routes */}
        <Route path="/dashboard/innovator" element={<ProtectedRoute role="innovator"><InnovatorDashboard /></ProtectedRoute>} />
        <Route path="/dashboard/innovator/projects" element={<ProtectedRoute role="innovator"><MyProjects /></ProtectedRoute>} />
        <Route path="/dashboard/innovator/opportunities" element={<ProtectedRoute role="innovator"><BrowseOpportunities /></ProtectedRoute>} />
        <Route path="/dashboard/innovator/applications" element={<ProtectedRoute role="innovator"><MyApplication /></ProtectedRoute>} />
        <Route path="/dashboard/innovator/settings" element={<ProtectedRoute role="innovator"><Settings /></ProtectedRoute>} />

        {/* Funder routes */}
        <Route path="/dashboard/funder" element={<ProtectedRoute role="funder"><OrganizationDashboard /></ProtectedRoute>} />
        <Route path="/dashboard/funder/post" element={<ProtectedRoute role="funder"><PostOpportunity /></ProtectedRoute>} />
        <Route path="/dashboard/funder/opportunities" element={<ProtectedRoute role="funder"><MyOpportunities /></ProtectedRoute>} />
        <Route path="/dashboard/funder/applications" element={<ProtectedRoute role="funder"><ReceivedApplications /></ProtectedRoute>} />

        {/* Admin routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/organizations" element={<AdminRoute><AdminOrganizations /></AdminRoute>} />
        <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
        <Route path="/admin/opportunities" element={<AdminRoute><AdminOpportunities /></AdminRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}