import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BrandHeader from '../components/BrandHeader';
import ClubLayout from "../components/ClubLayout";
import { useClub } from '../context/ClubContext';
import {
  ELECTION_STATUS_LABELS,
  ELECTION_STATUS_COLORS,
} from '../data/elections';
import '../styles/ClubShared.css';

// IBARA YA 30 — Elections Overview
// Lists all elections for a branch grouped by status (active, upcoming, closed).
// Active members can nominate / vote; the chair / patron can announce new ones.

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

const daysUntil = (iso) => {
  if (!iso) return null;
  const diff = new Date(iso).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

export default function ClubElectionsOverview() {
  const { branchId } = useParams();
  const navigate = useNavigate();
  const {
    branchById,
    universities,
    electionsForBranch,
    executivePositions,
    findPosition,
    currentStudent,
    currentClubLeader,
    activeElectionForPosition,
  } = useClub();

  const branch = branchById(branchId);
  const uni = universities.find((u) => u.id === branch?.universityId);
  const all = branch ? electionsForBranch(branch.id) : [];

  const [filter, setFilter] = useState('all');

  const filtered = useMemo(() => {
    if (filter === 'all') return all;
    if (filter === 'active') {
      return all.filter((e) => ['nominations_open', 'campaign', 'voting'].includes(e.status));
    }
    if (filter === 'closed') return all.filter((e) => e.status === 'closed');
    if (filter === 'cancelled') return all.filter((e) => e.status === 'cancelled');
    return all;
  }, [all, filter]);

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

  const activeElections = all.filter((e) =>
    ['nominations_open', 'campaign', 'voting'].includes(e.status)
  );
  const myStatus = currentStudent?.status;

  return (
    <ClubLayout user={currentStudent || currentClubLeader} userRole="member">
      <div className="club-public-page">
      <header className="club-public-header">
        <div className="club-public-header-inner">
          <BrandHeader
            compact
            title="Elections (Uchaguzi)"
            subtitle={`${branch.name} · IBARA YA 30–34`}
          />
          <div className="club-public-header-actions">
            <button
              className="club-btn-secondary"
              type="button"
              onClick={() => navigate(`/club/branches/${branch.id}/committee`)}
            >
              ← Committee
            </button>
            {(currentClubLeader || myStatus === 'active') ? (
              <button
                className="club-btn-primary"
                style={{ width: 'auto', padding: '12px 22px' }}
                onClick={() => navigate(`/club/branches/${branch.id}/elections/announce`)}
              >
                + Announce election
              </button>
            ) : null}
          </div>
        </div>
      </header>

      <main className="club-public-main">
        <section className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <h2 className="card-title">How elections work</h2>
            <span className="card-link">IBARA YA 30</span>
          </div>
          <ol className="club-duty-list">
            <li><strong>Announcement</strong> — The Patron or Chair announces a vacancy and the election timetable.</li>
            <li><strong>Nominations</strong> — Active members submit candidacy with a statement and availability (IBARA YA 31).</li>
            <li><strong>Campaign</strong> — Candidates share their manifestos; members can ask questions.</li>
            <li><strong>Voting</strong> — Secret ballot: each active member casts one vote. Quorum: 1/3 of active members.</li>
            <li><strong>Tally &amp; Install</strong> — The Election Committee tallies votes and installs the winner (IBARA YA 33).</li>
          </ol>
        </section>

        {/* Active elections highlight */}
        {activeElections.length > 0 ? (
          <section className="card" style={{ marginBottom: 20, borderLeft: '4px solid var(--club-orange)' }}>
            <div className="card-header">
              <h2 className="card-title">🟢 Active now</h2>
              <span className="card-link">{activeElections.length} in progress</span>
            </div>
            <div className="club-exec-grid">
              {activeElections.map((e) => {
                const pos = findPosition(e.position);
                const remaining = daysUntil(
                  e.status === 'nominations_open'
                    ? e.nominationsEndAt
                    : e.status === 'campaign'
                    ? e.campaignEndAt
                    : e.votingEndAt
                );
                return (
                  <article
                    key={e.id}
                    className="club-exec-card"
                    style={{ borderTopColor: ELECTION_STATUS_COLORS[e.status] }}
                  >
                    <div className="club-exec-card-top">
                      <span
                        className="club-exec-card-icon"
                        style={{ background: pos?.color || '#94a3b8' }}
                      >
                        {pos?.icon || '🗳️'}
                      </span>
                      <div>
                        <h3 className="club-exec-card-title">{pos?.title || e.position}</h3>
                        <p className="club-exec-card-sub">
                          {ELECTION_STATUS_LABELS[e.status]}
                          {remaining !== null && remaining > 0 ? ` · ${remaining}d left` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="club-exec-card-body">
                      <p className="club-member-meta">
                        {e.nominations.length} candidate{e.nominations.length === 1 ? '' : 's'} so far
                      </p>
                      <div className="club-exec-card-actions">
                        <button
                          type="button"
                          className="club-btn-primary club-btn-sm"
                          onClick={() => navigate(`/club/branches/${branch.id}/elections/${e.id}`)}
                        >
                          Open →
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ) : null}

        {/* Filter tabs */}
        <section className="club-election-filters">
          {[
            { id: 'all', label: `All (${all.length})` },
            { id: 'active', label: `Active (${activeElections.length})` },
            { id: 'closed', label: `Closed (${all.filter((e) => e.status === 'closed').length})` },
            { id: 'cancelled', label: `Cancelled (${all.filter((e) => e.status === 'cancelled').length})` },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              className={`club-election-filter ${filter === f.id ? 'is-active' : ''}`}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </section>

        {/* All elections list */}
        <section className="card">
          <div className="card-header">
            <h2 className="card-title">Elections history</h2>
            <span className="card-link">{filtered.length} shown</span>
          </div>
          {filtered.length === 0 ? (
            <p className="club-empty">No elections match this filter yet.</p>
          ) : (
            <div className="club-election-list">
              {filtered.map((e) => {
                const pos = findPosition(e.position);
                const winner = e.results?.winnerId
                  ? e.nominations.find((n) => n.candidateId === e.results.winnerId)
                  : null;
                const winnerName = winner
                  ? currentStudent?.id === winner.candidateId
                    ? currentStudent.fullName
                    : `Member ${winner.candidateId}`
                  : null;
                return (
                  <div key={e.id} className="club-election-row">
                    <div className="club-election-row-icon" style={{ background: pos?.color }}>
                      {pos?.icon || '🗳️'}
                    </div>
                    <div className="club-election-row-body">
                      <p className="club-election-row-title">
                        {pos?.title || e.position} — {ELECTION_STATUS_LABELS[e.status]}
                      </p>
                      <p className="club-election-row-meta">
                        Opened {formatDate(e.openedAt)} · {e.nominations.length} candidate{e.nominations.length === 1 ? '' : 's'} · {e.results?.totalBallots || 0} vote{e.results?.totalBallots === 1 ? '' : 's'} cast
                        {winnerName ? ` · 🏆 ${winnerName}` : ''}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="club-btn-secondary club-btn-sm"
                      onClick={() => navigate(`/club/branches/${branch.id}/elections/${e.id}`)}
                    >
                      Details →
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Vacant positions — opportunities to announce elections */}
        <VacantPositionsCard branch={branch} navigate={navigate} />
      </main>
    </div>
    </ClubLayout>
  );
}

function VacantPositionsCard({ branch, navigate }) {
  const { executivesForBranch, executivePositions } = useClub();
  const committee = executivesForBranch(branch.id);
  const occupiedPositions = new Set(committee.map((e) => e.position));
  const vacant = executivePositions.filter((p) => !occupiedPositions.has(p.id));
  if (vacant.length === 0) return null;
  return (
    <section className="card" style={{ marginTop: 20 }}>
      <div className="card-header">
        <h2 className="card-title">Vacant positions</h2>
        <span className="card-link">{vacant.length} unfilled</span>
      </div>
      <div className="club-exec-grid">
        {vacant.map((p) => (
          <div key={p.id} className="club-exec-card" style={{ borderTopColor: p.color }}>
            <div className="club-exec-card-top">
              <span className="club-exec-card-icon" style={{ background: p.color }}>
                {p.icon}
              </span>
              <div>
                <h3 className="club-exec-card-title">{p.title}</h3>
                <p className="club-exec-card-sub">{p.titleEnglish} · Vacant</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        className="club-btn-primary"
        style={{ marginTop: 14, width: 'auto', padding: '10px 18px' }}
        onClick={() => navigate(`/club/branches/${branch.id}/elections/announce`)}
      >
        Announce election for a vacant seat →
      </button>
    </section>
  );
}