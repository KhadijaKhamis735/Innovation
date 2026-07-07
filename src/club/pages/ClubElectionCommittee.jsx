import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BrandHeader from '../components/BrandHeader';
import ClubLayout from "../components/ClubLayout";
import { useClub } from '../context/ClubContext';
import {
  ELECTION_COMMITTEE_MIN,
  ELECTION_COMMITTEE_MAX,
} from '../data/elections';
import '../styles/ClubShared.css';

// IBARA YA 32 — Election Committee (3–5 members)
// Forms an oversight committee for branch elections. Members cannot be
// candidates in any election they oversee.

const formatDate = (iso) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch (e) {
    return iso;
  }
};

export default function ClubElectionCommittee() {
  const { branchId } = useParams();
  const navigate = useNavigate();
  const {
    branchById,
    universities,
    membersForBranch,
    committeeForBranch,
    formElectionCommittee,
    currentClubLeader,
  } = useClub();

  const branch = branchById(branchId);
  const uni = universities.find((u) => u.id === branch?.universityId);
  const activeCommittee = committeeForBranch(branch?.id);

  const activeMembers = useMemo(() => {
    if (!branch) return [];
    return membersForBranch(branch.id, null, 'active');
  }, [branch, membersForBranch]);

  const [selected, setSelected] = useState(activeCommittee?.members.map((m) => m.memberId) || []);

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

  const toggleMember = (memberId) => {
    setSelected((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const result = formElectionCommittee({
      branchId: branch.id,
      members: selected,
      formedBy: currentClubLeader?.id || null,
    });
    if (!result.ok) {
      alert(result.error);
      return;
    }
    navigate(`/club/branches/${branch.id}/elections`);
  };

  return (
    <ClubLayout user={currentClubLeader} userRole="leader">
      <div className="club-public-page">
      <header className="club-public-header">
        <div className="club-public-header-inner">
          <BrandHeader
            compact
            title="Election Committee"
            subtitle={`${branch.name} · IBARA YA 32`}
          />
          <div className="club-public-header-actions">
            <button
              className="club-btn-secondary"
              type="button"
              onClick={() => navigate(`/club/branches/${branch.id}/elections`)}
            >
              ← Elections
            </button>
          </div>
        </div>
      </header>

      <main className="club-public-main">
        <section className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <h2 className="card-title">Committee responsibilities</h2>
            <span className="card-link">3–5 members · IBARA YA 32</span>
          </div>
          <ol className="club-duty-list">
            <li><strong>Receive and verify</strong> nomination forms and confirm eligibility.</li>
            <li><strong>Announce</strong> the election schedule and rules.</li>
            <li><strong>Oversee campaign ethics</strong> — ensure fair play.</li>
            <li><strong>Conduct voting</strong> and count ballots.</li>
            <li><strong>Announce results</strong> and handle initial complaints.</li>
          </ol>
          <p className="club-footnote" style={{ marginTop: 14 }}>
            The Election Committee is formed before an election is announced and
            stands until the election is closed. Members of the committee cannot
            stand as candidates in any election they oversee.
          </p>
        </section>

        <div className="club-branch-grid-2">
          {/* Selection */}
          <section className="card">
            <div className="card-header">
              <h2 className="card-title">Select committee members</h2>
              <span className="card-link">
                {selected.length}/{ELECTION_COMMITTEE_MAX} chosen
              </span>
            </div>
            <form onSubmit={handleSubmit}>
              <p className="club-form-sublabel">
                Choose between {ELECTION_COMMITTEE_MIN} and {ELECTION_COMMITTEE_MAX}{' '}
                active members of {uni?.shortName}.
              </p>
              {activeMembers.length === 0 ? (
                <p className="club-empty">
                  No active members yet — registration must be approved first.
                </p>
              ) : (
                <div className="club-member-list" style={{ maxHeight: 380, overflowY: 'auto' }}>
                  {activeMembers.map((m) => {
                    const isSelected = selected.includes(m.id);
                    return (
                      <label
                        key={m.id}
                        className={`club-member-row ${isSelected ? 'is-selected' : ''}`}
                        style={{ cursor: 'pointer' }}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleMember(m.id)}
                          disabled={!isSelected && selected.length >= ELECTION_COMMITTEE_MAX}
                        />
                        <div className="club-member-avatar">
                          {m.fullName
                            .split(' ')
                            .map((p) => p[0])
                            .filter(Boolean)
                            .slice(0, 2)
                            .join('')
                            .toUpperCase()}
                        </div>
                        <div className="club-member-info">
                          <p className="club-member-name">{m.fullName}</p>
                          <p className="club-member-meta">
                            {m.regNumber || m.staffId || m.email}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}

              <button
                type="submit"
                className="club-btn-primary"
                disabled={
                  selected.length < ELECTION_COMMITTEE_MIN ||
                  selected.length > ELECTION_COMMITTEE_MAX
                }
                style={{ marginTop: 14 }}
              >
                {activeCommittee ? 'Replace committee' : 'Form committee'}
              </button>
            </form>
          </section>

          {/* Current committee */}
          <section className="card">
            <div className="card-header">
              <h2 className="card-title">Current committee</h2>
              <span className="card-link">
                {activeCommittee ? `${activeCommittee.members.length} members` : 'None yet'}
              </span>
            </div>
            {activeCommittee ? (
              <>
                <p className="club-form-sublabel">
                  Formed {formatDate(activeCommittee.formedAt)}
                </p>
                <div className="club-member-list">
                  {activeCommittee.members.map((m, idx) => {
                    const member = activeMembers.find((x) => x.id === m.memberId);
                    return (
                      <div key={idx} className="club-member-row">
                        <div className="club-member-avatar">
                          {member
                            ? member.fullName
                                .split(' ')
                                .map((p) => p[0])
                                .filter(Boolean)
                                .slice(0, 2)
                                .join('')
                                .toUpperCase()
                            : '?'}
                        </div>
                        <div className="club-member-info">
                          <p className="club-member-name">{member?.fullName || m.memberId}</p>
                          <p className="club-member-meta">
                            {member?.regNumber || member?.email || '—'}
                          </p>
                        </div>
                        <span className="club-badge club-badge-active">Committee</span>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <p className="club-empty">
                No active Election Committee. Form one before announcing the next election.
              </p>
            )}
          </section>
        </div>
      </main>
    </div>
    </ClubLayout>
  );
}