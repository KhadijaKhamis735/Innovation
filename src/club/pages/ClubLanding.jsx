import { Link, useNavigate } from 'react-router-dom';
import { useClub } from '../context/ClubContext';
import { UNIVERSITIES } from '../context/clubSeed';
import './ClubLanding.css';

const FEATURES = [
  {
    icon: '🎓',
    title: 'For Students',
    desc: 'Register with your university and Student Registration Number. Get verified by your Club Leader to unlock project posting.',
  },
  {
    icon: '👨‍🏫',
    title: 'For Club Leaders',
    desc: 'Verify students from your university. Run elections, meetings, treasury, and discipline per the constitution.',
  },
  {
    icon: '🪙',
    title: 'Treasury & IP',
    desc: 'Track income/expenses, manage dues, register innovations, and protect member IP (IBARA YA 38–44).',
  },
  {
    icon: '🏛️',
    title: 'Constitutional Lifecycle',
    desc: 'View the full Katiba, propose amendments (⅔), vote on dissolution (¾), and onboard new branches (IBARA YA 46–48).',
  },
];

export default function ClubLanding() {
  const navigate = useNavigate();
  const { clubs, amendments, elections, meetings, codeOfConductSignatures } = useClub();

  const totalBranches = clubs.length;
  const totalAmendments = amendments.length;
  const openElections = elections.filter((e) => ['nominations_open', 'campaign', 'voting'].includes(e.status)).length;
  const upcomingMeetings = meetings.filter((m) => new Date(m.date).getTime() >= Date.now() && m.status === 'scheduled').length;
  const signedConduct = codeOfConductSignatures.length;

  return (
    <div className="club-landing">
      <section className="club-landing-hero">
        <div className="club-landing-hero-content">
          <div className="club-landing-badge">
            <span className="club-landing-badge-dot" />
            <span>Club Management System · ZSA</span>
          </div>
          <h1 className="club-landing-title">
            Where Students Build <span className="club-landing-title-accent">Together</span>
          </h1>
          <p className="club-landing-desc">
            The Startup Innovation Club is a constitutionally governed network of
            innovation clubs across four Zanzibar universities. Sign in as a Club
            Member to access your branch — or as a Club Leader (Mlezi) to manage
            the Executive Committee, treasury, and discipline processes.
          </p>
          <div className="club-landing-actions">
            <button className="club-btn-primary" onClick={() => navigate('/club/login', { state: { role: 'student' } })}>
              <span>🎓</span>
              <span>I'm a Club Member</span>
              <span>→</span>
            </button>
            <button className="club-btn-secondary" onClick={() => navigate('/club/login', { state: { role: 'leader' } })}>
              <span>👨‍🏫</span>
              <span>I'm a Club Leader</span>
            </button>
          </div>
          <p className="club-landing-register-cta">
            Don't have an account?{' '}
            <Link to="/club/register">Register as a Club Member</Link>
            {' · '}
            <Link to="/club/branches">Browse {totalBranches} branches</Link>
            {' · '}
            <Link to="/club/onboarding">Onboard a new branch</Link>
          </p>
        </div>
      </section>

      <section className="club-landing-quickstats">
        <div className="club-landing-quickstats-inner">
          <div className="club-landing-stat"><span className="club-landing-stat-value">{totalBranches}</span><span className="club-landing-stat-label">Branches</span></div>
          <div className="club-landing-stat"><span className="club-landing-stat-value">{upcomingMeetings}</span><span className="club-landing-stat-label">Upcoming meetings</span></div>
          <div className="club-landing-stat"><span className="club-landing-stat-value">{openElections}</span><span className="club-landing-stat-label">Active elections</span></div>
          <div className="club-landing-stat"><span className="club-landing-stat-value">{signedConduct}</span><span className="club-landing-stat-label">Conduct signatures</span></div>
          <div className="club-landing-stat"><span className="club-landing-stat-value">{totalAmendments}</span><span className="club-landing-stat-label">Amendment proposals</span></div>
        </div>
      </section>

      <section className="club-landing-uni-strip">
        <div className="club-landing-uni-strip-inner">
          <h2 className="club-landing-uni-strip-title">Approved Universities</h2>
          <div className="club-landing-uni-grid">
            {UNIVERSITIES.map((u) => {
              const branch = clubs.find((c) => c.universityId === u.id);
              return (
                <div key={u.id} className="club-landing-uni-chip" style={{ borderLeftColor: u.primaryColor }}>
                  <h3 className="club-landing-uni-chip-name">{u.shortName} · {u.name}</h3>
                  <p className="club-landing-uni-chip-tagline">{u.tagline}</p>
                  <Link
                    className="club-landing-uni-chip-link"
                    to={`/club/branches/club-${u.id}`}
                  >
                    Open branch →
                  </Link>
                  {branch ? (
                    <p className="club-landing-uni-chip-status">
                      {branch.status === 'active' ? '🟢 Active' : '🟡 ' + branch.status}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="club-landing-features">
        <div className="club-landing-features-grid">
          {FEATURES.map((f, idx) => (
            <div key={idx} className="club-landing-feature-card">
              <div className="club-landing-feature-icon">{f.icon}</div>
              <h3 className="club-landing-feature-title">{f.title}</h3>
              <p className="club-landing-feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="club-landing-constitution">
        <div className="club-landing-constitution-inner">
          <h2>Katiba ya Startup Innovation Club</h2>
          <p>
            Read the full 48-article constitution in Kiswahili with bilingual
            explanations. Propose amendments (⅔ majority), watch dissolution motions
            (¾ majority), and onboard new branches with the wizard.
          </p>
          <div className="club-landing-actions">
            <Link className="club-btn-primary" to={`/club/branches/club-${UNIVERSITIES[0].id}/constitution`}>
              Read the constitution →
            </Link>
            <Link className="club-btn-secondary" to="/club/onboarding">
              Onboard a new branch
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}