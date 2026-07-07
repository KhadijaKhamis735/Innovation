import { Navigate } from 'react-router-dom';
import { useClub } from '../context/ClubContext';

// Like the existing ProtectedRoute (in App.jsx) but for Club Management.
// Verifies a Club Member is signed in and (when status='active') approved.
// Use `requireVerification` for routes that should only be accessible after
// the Club Leader has approved the student (e.g. Create Project).
//
// As of the unified-login change, unauthenticated club users are sent to
// the single /login page; the system routes them to /club/leader/dashboard
// or /club/member/dashboard automatically based on their stored role.

export default function ClubRouteGuard({
  children,
  role = 'student',
  requireVerification = false,
}) {
  const { currentStudent, currentClubLeader } = useClub();

  if (role === 'leader') {
    if (!currentClubLeader) return <Navigate to="/login" replace />;
    return children;
  }

  // role === 'student'
  if (!currentStudent) return <Navigate to="/login" replace />;

  if (requireVerification && currentStudent.status !== 'active') {
    return <Navigate to="/club/pending" replace />;
  }

  return children;
}