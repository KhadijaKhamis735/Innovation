import { SEED_LEADERS, findUniversity } from '../context/clubSeed';
import '../styles/ClubShared.css';

export default function DevHelperBar({ onPickLeader }) {
  return (
    <div className="club-dev-helper">
      <div className="club-dev-helper-header">
        <span>🛠</span>
        <span>Demo helper · tap to sign in as a Club Leader</span>
      </div>
      <div className="club-dev-helper-grid">
        {SEED_LEADERS.map((leader) => {
          const uni = findUniversity(leader.universityId);
          return (
            <button
              type="button"
              key={leader.id}
              className="club-dev-helper-tile"
              style={{ borderLeft: `4px solid ${uni?.primaryColor || 'var(--club-orange)'}` }}
              onClick={() => onPickLeader({ email: leader.email, password: leader.password, leader })}
            >
              <div className="club-dev-helper-tile-title">
                {uni?.shortName} · {leader.role}
              </div>
              <div className="club-dev-helper-tile-email">{leader.email}</div>
              <div className="club-dev-helper-tile-pass">pw: {leader.password}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}