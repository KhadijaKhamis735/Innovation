import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BrandHeader from '../components/BrandHeader';
import ClubLayout from "../components/ClubLayout";
import { useClub } from '../context/ClubContext';
import { ELECTION_DEFAULTS } from '../data/elections';
import '../styles/ClubShared.css';

// IBARA YA 30 — Announce an Election
// Patron / Chair only. Sets the schedule (nominations → campaign → voting).

const formatDateTimeLocal = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

export default function ClubElectionAnnounce() {
  const { branchId } = useParams();
  const navigate = useNavigate();
  const {
    branchById,
    universities,
    executivePositions,
    activeElectionForPosition,
    committeeForBranch,
    announceElection,
    currentClubLeader,
  } = useClub();

  const branch = branchById(branchId);
  const uni = universities.find((u) => u.id === branch?.universityId);
  const committee = committeeForBranch(branch?.id);

  const [position, setPosition] = useState('');
  const [nominationsEndAt, setNominationsEndAt] = useState(
    formatDateTimeLocal(addDays(new Date(), ELECTION_DEFAULTS.nominationsDays))
  );
  const [campaignEndAt, setCampaignEndAt] = useState(
    formatDateTimeLocal(
      addDays(new Date(), ELECTION_DEFAULTS.nominationsDays + ELECTION_DEFAULTS.campaignDays)
    )
  );
  const [votingEndAt, setVotingEndAt] = useState(
    formatDateTimeLocal(
      addDays(
        new Date(),
        ELECTION_DEFAULTS.nominationsDays +
          ELECTION_DEFAULTS.campaignDays +
          ELECTION_DEFAULTS.votingDays
      )
    )
  );
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!branch) {
    return (
      <div className="club-public-page">
        <header className="club-public-header">
          <div className="club-public-header-inner">
            <BrandHeader compact title="Branch not found" />
            <button
              className="club-btn-secondary"
              type="button"
              onClick={() => navigate('/club/branches')}
            >
              ← Branches
            </button>
          </div>
        </header>
      </div>
    );
  }

  const existingElection = position ? activeElectionForPosition(branch.id, position) : null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!position) {
      setError('Please choose a position.');
      return;
    }
    if (!nominationsEndAt || !campaignEndAt || !votingEndAt) {
      setError('Please fill all three schedule dates.');
      return;
    }
    const nomDate = new Date(nominationsEndAt);
    const campDate = new Date(campaignEndAt);
    const voteDate = new Date(votingEndAt);
    if (!(nomDate < campDate && campDate < voteDate)) {
      setError('Dates must be in order: nominations end → campaign ends → voting ends.');
      return;
    }
    if (existingElection) {
      setError('An election is already active for this position. Cancel it first.');
      return;
    }
    const result = announceElection({
      branchId: branch.id,
      position,
      committeeId: committee?.id || null,
      nominationsEndAt: nomDate.toISOString(),
      campaignEndAt: campDate.toISOString(),
      votingEndAt: voteDate.toISOString(),
      announcedBy: currentClubLeader?.id || null,
    });
    if (!result.ok) {
      setError(result.error || 'Could not announce election.');
      return;
    }
    setSuccess('Election announced ✓');
    setTimeout(() => {
      navigate(`/club/branches/${branch.id}/elections/${result.election.id}`);
    }, 700);
  };

  return (
    <ClubLayout user={currentClubLeader} userRole="leader">
      <div className="club-public-page">
      <header className="club-public-header">
        <div className="club-public-header-inner">
          <BrandHeader
            compact
            title="Announce Election"
            subtitle={`${branch.name} · IBARA YA 30`}
          />
          <div className="club-public-header-actions">
            <button
              className="club-btn-secondary"
              type="button"
              onClick={() => navigate(`/club/branches/${branch.id}/elections`)}
            >
              ← All elections
            </button>
          </div>
        </div>
      </header>

      <main className="club-public-main">
        <div className="club-branch-grid-2">
          <section className="card">
            <div className="card-header">
              <h2 className="card-title">Election schedule</h2>
              <span className="card-link">{uni?.shortName}</span>
            </div>
            <form onSubmit={handleSubmit}>
              {error ? <div className="club-error-box">{error}</div> : null}
              {success ? (
                <div
                  className="club-error-box"
                  style={{ background: '#dcfce7', borderColor: '#bbf7d0', color: '#15803d' }}
                >
                  {success}
                </div>
              ) : null}

              <div className="club-form-group">
                <label className="club-form-label">Position *</label>
                <select
                  className="club-form-input"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                >
                  <option value="">— Select a position —</option>
                  {executivePositions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({p.titleEnglish})
                    </option>
                  ))}
                </select>
                {existingElection ? (
                  <p className="club-footnote" style={{ marginTop: 8 }}>
                    ⚠️ An election is already active for this position.
                  </p>
                ) : null}
              </div>

              <div className="club-form-group">
                <label className="club-form-label">Nominations close *</label>
                <input
                  type="datetime-local"
                  className="club-form-input"
                  value={nominationsEndAt}
                  onChange={(e) => setNominationsEndAt(e.target.value)}
                />
              </div>

              <div className="club-form-group">
                <label className="club-form-label">Campaign period ends *</label>
                <input
                  type="datetime-local"
                  className="club-form-input"
                  value={campaignEndAt}
                  onChange={(e) => setCampaignEndAt(e.target.value)}
                />
              </div>

              <div className="club-form-group">
                <label className="club-form-label">Voting closes *</label>
                <input
                  type="datetime-local"
                  className="club-form-input"
                  value={votingEndAt}
                  onChange={(e) => setVotingEndAt(e.target.value)}
                />
              </div>

              <div className="club-form-group">
                <label className="club-form-label">Election Committee</label>
                <p className="club-form-sublabel">
                  {committee
                    ? `Active committee of ${committee.members.length} members formed on ${formatDateTimeLocal(committee.formedAt)}`
                    : 'No Election Committee is formed yet — candidates will still be able to submit, but verification will be limited.'}
                </p>
                <button
                  type="button"
                  className="club-btn-secondary club-btn-sm"
                  style={{ marginTop: 6 }}
                  onClick={() =>
                    navigate(`/club/branches/${branch.id}/elections/committee`)
                  }
                >
                  {committee ? 'Manage committee' : 'Form Election Committee'} →
                </button>
              </div>

              <button type="submit" className="club-btn-primary">
                Announce election
              </button>
            </form>
          </section>

          {/* Side: default schedule + rules */}
          <section className="card">
            <div className="card-header">
              <h2 className="card-title">Defaults &amp; rules</h2>
              <span className="card-link">IBARA YA 30</span>
            </div>
            <dl className="club-exec-card-meta">
              <div>
                <dt>Default nominations</dt>
                <dd>{ELECTION_DEFAULTS.nominationsDays} days</dd>
              </div>
              <div>
                <dt>Default campaign</dt>
                <dd>{ELECTION_DEFAULTS.campaignDays} days</dd>
              </div>
              <div>
                <dt>Default voting</dt>
                <dd>{ELECTION_DEFAULTS.votingDays} days</dd>
              </div>
              <div>
                <dt>Voting method</dt>
                <dd>Secret ballot</dd>
              </div>
              <div>
                <dt>Quorum</dt>
                <dd>1/3 of active members</dd>
              </div>
              <div>
                <dt>One-vote rule</dt>
                <dd>One vote per active member per position</dd>
              </div>
            </dl>
            <p className="club-footnote" style={{ marginTop: 14 }}>
              IBARA YA 32 — The Election Committee (3–5 members) oversees nominations,
              campaign ethics, voting conduct, and ballot counting. They also resolve
              complaints during the election.
            </p>
          </section>
        </div>
      </main>
    </div>
    </ClubLayout>
  );
}