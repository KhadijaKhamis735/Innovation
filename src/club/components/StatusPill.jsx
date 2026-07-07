import '../styles/ClubShared.css';

const LABELS = { pending: 'Pending', verified: 'Verified', rejected: 'Rejected' };

export default function StatusPill({ status, label }) {
  return (
    <span className={`club-status-pill ${status}`}>
      {label || LABELS[status] || status}
    </span>
  );
}