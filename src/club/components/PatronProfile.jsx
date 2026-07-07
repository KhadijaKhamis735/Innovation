// IBARA YA 20 — Patron Profile
// Reusable card showing the Mlezi wa Klabu (Branch Patron) details.
// Used by BranchDetail and (optionally) the Leader dashboard.

export default function PatronProfile({ patron, university, compact = false }) {
  if (!patron) {
    return (
      <div className="club-patron-card club-empty">
        <p>No patron assigned yet.</p>
      </div>
    );
  }
  const initials = patron.fullName
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className={`club-patron-card ${compact ? 'is-compact' : ''}`}>
      <div className="club-patron-avatar" style={{ background: university?.primaryColor }}>
        {initials}
      </div>
      <div className="club-patron-body">
        <h3 className="club-patron-name">{patron.fullName}</h3>
        <p className="club-patron-role">Mlezi wa Klabu · {patron.role}</p>
        <p className="club-patron-meta">{university?.name || '—'}</p>
        <p className="club-patron-meta">📧 {patron.email}</p>
        {patron.phone ? <p className="club-patron-meta">📱 {patron.phone}</p> : null}
      </div>
    </div>
  );
}