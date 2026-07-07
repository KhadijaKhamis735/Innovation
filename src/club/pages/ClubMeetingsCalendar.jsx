import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BrandHeader from '../components/BrandHeader';
import ClubLayout from "../components/ClubLayout";
import { useClub } from '../context/ClubContext';
import {
  MEETING_STATUS_LABELS,
  MEETING_STATUS_COLORS,
} from '../data/meetings';
import '../styles/ClubShared.css';

// IBARA YA 35 — Meetings Calendar
// Lists upcoming and past meetings for the branch, grouped by type.

const formatDateTime = (iso) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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

export default function ClubMeetingsCalendar() {
  const { branchId } = useParams();
  const navigate = useNavigate();
  const {
    branchById,
    universities,
    meetingsForBranch,
    meetingTypes,
    findMeetingType,
    quorumForMeeting,
    currentStudent,
    currentClubLeader,
  } = useClub();

  const branch = branchById(branchId);
  const uni = universities.find((u) => u.id === branch?.universityId);
  const all = branch ? meetingsForBranch(branch.id) : [];

  const [filter, setFilter] = useState('all');

  const filtered = useMemo(() => {
    if (filter === 'all') return all;
    if (filter === 'upcoming') return all.filter((m) => new Date(m.date).getTime() >= Date.now());
    if (filter === 'past') return all.filter((m) => new Date(m.date).getTime() < Date.now());
    return all.filter((m) => m.type === filter);
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

  const upcoming = all.filter((m) => new Date(m.date).getTime() >= Date.now() && m.status !== 'cancelled');
  const canSchedule = !!currentClubLeader || currentStudent?.status === 'active';

  return (
    <ClubLayout user={currentStudent || currentClubLeader} userRole="member">
      <div className="club-public-page">
      <header className="club-public-header">
        <div className="club-public-header-inner">
          <BrandHeader
            compact
            title="Meetings (Mikutano)"
            subtitle={`${branch.name} · IBARA YA 35–37`}
          />
          <div className="club-public-header-actions">
            <button
              className="club-btn-secondary"
              type="button"
              onClick={() => navigate(`/club/branches/${branch.id}/committee`)}
            >
              ← Committee
            </button>
            {canSchedule ? (
              <button
                className="club-btn-primary"
                style={{ width: 'auto', padding: '12px 22px' }}
                onClick={() => navigate(`/club/branches/${branch.id}/meetings/schedule`)}
              >
                + Schedule meeting
              </button>
            ) : null}
          </div>
        </div>
      </header>

      <main className="club-public-main">
        <section className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <h2 className="card-title">4 types of meetings</h2>
            <span className="card-link">IBARA YA 35</span>
          </div>
          <div className="club-meeting-types">
            {meetingTypes.map((t) => (
              <article key={t.id} className="club-meeting-type" style={{ borderLeftColor: t.color }}>
                <div className="club-meeting-type-icon">{t.icon}</div>
                <div>
                  <h3 className="club-meeting-type-name">{t.label}</h3>
                  <p className="club-meeting-type-sub">{t.labelEnglish}</p>
                  <p className="club-meeting-type-meta">Quorum: {t.quorum}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {upcoming.length > 0 ? (
          <section className="card" style={{ marginBottom: 20, borderLeft: '4px solid var(--club-orange)' }}>
            <div className="card-header">
              <h2 className="card-title">📅 Next up</h2>
              <span className="card-link">{upcoming.length} upcoming</span>
            </div>
            <NextUpCard meeting={upcoming[0]} findMeetingType={findMeetingType} quorumForMeeting={quorumForMeeting} navigate={navigate} branchId={branch.id} />
          </section>
        ) : null}

        <section className="club-election-filters">
          {[
            { id: 'all', label: `All (${all.length})` },
            { id: 'upcoming', label: `Upcoming (${all.filter((m) => new Date(m.date).getTime() >= Date.now()).length})` },
            { id: 'past', label: `Past (${all.filter((m) => new Date(m.date).getTime() < Date.now()).length})` },
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

        <section className="card">
          <div className="card-header">
            <h2 className="card-title">All meetings</h2>
            <span className="card-link">{filtered.length} shown</span>
          </div>
          {filtered.length === 0 ? (
            <p className="club-empty">No meetings match this filter.</p>
          ) : (
            <div className="club-meeting-list">
              {filtered.map((m) => {
                const type = findMeetingType(m.type);
                const status = m.status || 'scheduled';
                const statusColor = MEETING_STATUS_COLORS[status];
                const days = daysUntil(m.date);
                const quorum = quorumForMeeting(m);
                return (
                  <article
                    key={m.id}
                    className="club-meeting-row"
                    style={{ borderLeftColor: type?.color || '#94a3b8' }}
                  >
                    <div className="club-meeting-row-head">
                      <span
                        className="club-election-row-icon"
                        style={{ background: type?.color || '#94a3b8' }}
                      >
                        {type?.icon || '🗓️'}
                      </span>
                      <div className="club-meeting-row-body">
                        <p className="club-meeting-row-title">{m.title}</p>
                        <p className="club-meeting-row-meta">
                          {type?.shortLabel} · {formatDateTime(m.date)} · {m.location}
                          {m.isOnline && m.meetingUrl ? ' · Online' : ''}
                          {days !== null && days >= 0 ? ` · In ${days}d` : days !== null ? ` · ${-days}d ago` : ''}
                        </p>
                      </div>
                      <span
                        className="club-badge"
                        style={{ background: statusColor + '20', color: statusColor }}
                      >
                        {MEETING_STATUS_LABELS[status]}
                      </span>
                    </div>
                    <div className="club-meeting-row-foot">
                      <span className="club-meeting-row-quorum">
                        Quorum: <strong>{quorum.present}</strong>/{quorum.required}
                        {quorum.met ? ' ✅' : ' ⏳'}
                      </span>
                      <button
                        type="button"
                        className="club-btn-secondary club-btn-sm"
                        onClick={() => navigate(`/club/branches/${branch.id}/meetings/${m.id}`)}
                      >
                        Open →
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
    </ClubLayout>
  );
}

function NextUpCard({ meeting, findMeetingType, quorumForMeeting, navigate, branchId }) {
  const type = findMeetingType(meeting.type);
  const quorum = quorumForMeeting(meeting);
  const days = daysUntil(meeting.date);
  return (
    <div
      className="club-position-hero"
      style={{ background: `linear-gradient(135deg, ${type?.color}, ${type?.color}cc)` }}
    >
      <span className="club-position-hero-icon">{type?.icon || '🗓️'}</span>
      <div>
        <h3 className="club-position-hero-title">{meeting.title}</h3>
        <p className="club-position-hero-sub">
          {type?.labelEnglish} · {formatDateTime(meeting.date)}
        </p>
        <p className="club-position-hero-summary">
          {meeting.location} {meeting.isOnline ? '(Online)' : ''}
          {days !== null ? ` · ${days === 0 ? 'Today' : `in ${days} day${days === 1 ? '' : 's'}`}` : ''}
        </p>
        <div style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="club-btn-primary club-btn-sm"
            onClick={() => navigate(`/club/branches/${branchId}/meetings/${meeting.id}`)}
            style={{ width: 'auto' }}
          >
            Open meeting →
          </button>
          <button
            type="button"
            className="club-btn-secondary club-btn-sm"
            onClick={() => navigate(`/club/branches/${branchId}/meetings/${meeting.id}/attendance`)}
            style={{ width: 'auto' }}
          >
            Attendance ({quorum.present}/{quorum.required})
          </button>
        </div>
      </div>
    </div>
  );
}