import { Navigate } from "react-router-dom";

// Club sign-in is handled by the unified /login page now. Anyone hitting
// /club/login gets sent there; the system routes club members and club
// leaders to the right club dashboard automatically based on the role
// stored against their email.
export default function ClubLogin() {
  return <Navigate to="/login" replace />;
}