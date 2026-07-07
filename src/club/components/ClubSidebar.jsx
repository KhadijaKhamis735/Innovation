import { Link, useLocation } from 'react-router-dom';
import { useClub } from '../context/ClubContext';

// Reuses the existing InnovatorDashboard sidebar CSS classes (.sidebar,
// .sidebar-header, .sidebar-logo, .sidebar-brand, .nav-item, etc.) so the
// Club Leader dashboard feels like the same system. The InnovatorDashboard.css
// is imported by each Club page that uses this sidebar.

const linkIcons = {
  '/club/member/dashboard': (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  ),
  '/club/member/create': (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  '/club/leader/dashboard': (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 2h6a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    </svg>
  ),
  branches: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="5" r="2" />
      <circle cx="5" cy="19" r="2" />
      <circle cx="19" cy="19" r="2" />
      <path d="M12 7v4l-5 6M12 11l5 6" />
    </svg>
  ),
  committee: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  handover: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="17 1 21 5 17 9" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <polyline points="7 23 3 19 7 15" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  ),
  elections: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  ),
  noConfidence: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  ),
  meetings: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  treasury: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 3v18h18" />
      <path d="M7 13l3-3 4 4 5-6" />
    </svg>
  ),
  conduct: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  ),
  discipline: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  constitution: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="9" y1="13" x2="15" y2="13" />
      <line x1="9" y1="17" x2="15" y2="17" />
    </svg>
  ),
  onboarding: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  ),
};

export default function ClubSidebar({ user, userRole = 'member', onLogout }) {
  const location = useLocation();
  const { currentStudent, currentClubLeader, branchByUniversityId } = useClub();

  // Resolve the user's actual branch id
  const userBranch =
    userRole === 'leader'
      ? branchByUniversityId(currentClubLeader?.universityId)
      : branchByUniversityId(currentStudent?.universityId);
  const branchId = userBranch?.id || 'club-suza';

  const isAwaitingVerification =
    userRole === 'member' && currentStudent && currentStudent.status === 'pending';

  const staticLinks = userRole === 'leader'
    ? [
        { to: '/club/leader/dashboard', label: 'Dashboard', iconKey: '/club/leader/dashboard' },
      ]
    : [
        { to: '/club/member/dashboard', label: 'Dashboard', iconKey: '/club/member/dashboard' },
        {
          to: '/club/member/create',
          label: 'Create Project',
          iconKey: '/club/member/create',
          // Gate project creation on verification. Pending members see the
          // link greyed out with a badge instead of being silently bounced
          // to /club/pending on click — that's confusing.
          requiresVerification: true,
          disabled: isAwaitingVerification,
          badge: isAwaitingVerification ? 'Awaiting verification' : null,
        },
      ];

  const links = [
    ...staticLinks,
    { to: '/club/branches', label: 'All Branches', iconKey: 'branches' },
    { to: `/club/branches/${branchId}/committee`, label: 'My Committee', iconKey: 'committee' },
  ];

  if (userRole === 'leader') {
    links.push({ to: `/club/branches/${branchId}/handover`, label: 'Handover', iconKey: 'handover' });
  }

  links.push({ to: `/club/branches/${branchId}/elections`, label: 'Elections', iconKey: 'elections' });
  links.push({ to: `/club/branches/${branchId}/meetings`, label: 'Meetings', iconKey: 'meetings' });
  links.push({ to: `/club/branches/${branchId}/treasury`, label: 'Treasury', iconKey: 'treasury' });
  links.push({ to: `/club/branches/${branchId}/conduct`, label: 'Code of Conduct', iconKey: 'conduct' });
  links.push({ to: `/club/branches/${branchId}/discipline`, label: 'Discipline', iconKey: 'discipline' });
  links.push({ to: `/club/branches/${branchId}/constitution`, label: 'Constitution', iconKey: 'constitution' });

  if (userRole === 'leader') {
    links.push({ to: `/club/branches/${branchId}/no-confidence`, label: 'No Confidence', iconKey: 'noConfidence' });
  }

  const initials = (user?.fullName || user?.name || 'CU')
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const isActive = (path) => {
    if (path === '/club/branches') {
      return location.pathname === '/club/branches';
    }
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <Link to="/club" className="sidebar-logo-link" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', color: 'inherit' }}>
          <div className="sidebar-logo">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </div>
          <span className="sidebar-brand">Club Hub</span>
        </Link>
      </div>

      <nav className="sidebar-nav">
        {links.map((link) => {
          const Icon = linkIcons[link.iconKey] || linkIcons.branches;
          const active = isActive(link.to);
          const className = `nav-item ${active ? 'nav-item-active' : ''} ${link.disabled ? 'nav-item-disabled' : ''}`.trim();
          const title = link.disabled
            ? `Awaiting verification — disabled until your Club Leader approves your account`
            : undefined;
          // Disabled items render as a non-link span so the click handler
          // can't fire and bounce the user to /club/pending. The badge
          // explains why right in the sidebar.
          if (link.disabled) {
            return (
              <div
                key={link.to}
                className={className}
                title={title}
                aria-disabled="true"
              >
                {Icon}
                <span style={{ flex: 1 }}>{link.label}</span>
                {link.badge && <span className="nav-item-badge">{link.badge}</span>}
              </div>
            );
          }
          return (
            <Link
              key={link.to}
              to={link.to}
              className={className}
              title={title}
            >
              {Icon}
              <span style={{ flex: 1 }}>{link.label}</span>
              {link.badge && <span className="nav-item-badge">{link.badge}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <Link to="/" className="nav-item">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span>Home</span>
        </Link>
        <button className="nav-item nav-item-logout" onClick={onLogout}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}