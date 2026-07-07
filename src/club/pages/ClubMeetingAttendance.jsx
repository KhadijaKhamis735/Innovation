import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BrandHeader from '../components/BrandHeader';
import ClubLayout from "../components/ClubLayout";
import { useClub } from '../context/ClubContext';
import '../styles/ClubShared.css';

// IBARA YA 35 — Mark / Manage Attendance
// Secretary (or any exec) checks off active members present at the meeting.

export default function ClubMeetingAttendance() {
  const { branchId, meetingId } = useParams();
  const navigate = useNavigate();
  const {
    branchById,
    universities,
    meetingById,
    membersForBranch,
    attendanceForMeeting,
    recordAttendance,
    quorumForMeeting,
  } = useClub();

  const branch = branchById(branchId);
  const uni = universities.find((u) => u.id === branch?.universityId);
  const meeting = meetingById(meetingId);
  const storedAttendees = useMemo(
    () => (meeting ? attendanceForMeeting(meeting.id) : []),
    [meeting, attendanceForMeeting]
  );
  const activeMembers = useMemo(
    () => (branch ? membersForBranch(branch.id, null, 'active') : []),
    [branch, membersForBranch]
  );

  const [selected, setSelected] = useState(new Set(storedAttendees));
  const [search, setSearch] = useState('');
  const [feedback, setFeedback] = useState('');

  if (!branch || !meeting) {
    return (
      <div className="club-public-page">
        <header className="club-public-header">
          <div className="club-public-header-inner">
            <BrandHeader compact title="Meeting not found" />
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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return activeMembers;
    return activeMembers.filter(
      (m) => m.fullName.toLowerCase().includes(q) || (m.regNumber || '').toLowerCase().includes(q) || (m.email || '').toLowerCase().includes(q)
    );
  }, [activeMembers, search]);

  // Compute live quorum based on the currently selected set
  const livePresent = selected.size;
  const liveRequired = Math.max(
    1,
    Math.ceil(activeMembers.length / 3)
  );
  const liveMet = livePresent >= liveRequired;

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === activeMembers.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(activeMembers.map((m) => m.id)));
    }
  };

  const save = () => {
    recordAttendance(meeting.id, Array.from(selected));
    setFeedback('Attendance saved ✓');
    setTimeout(() => {
      navigate(`/club/branches/${branch.id}/meetings/${meeting.id}`);
    }, 600);
  };

  return (
    <ClubLayout userRole="member">
      <div className="club-public-page">
      <header className="club-public-header">
        <div className="club-public-header-inner">
          <BrandHeader
            compact
            title="Mark Attendance"
            subtitle={`${meeting.title} · IBARA YA 35`}
          />
          <div className="club-public-header-actions">
            <button
              className="club-btn-secondary"
              type="button"
              onClick={() => navigate(`/club/branches/${branch.id}/meetings/${meeting.id}`)}
            >
              ← Meeting
            </button>
          </div>
        </div>
      </header>

      <main className="club-public-main">
        {feedback ? (
          <div className="club-error-box" style={{ background: '#dcfce7', borderColor: '#bbf7d0', color: '#15803d' }}>
            {feedback}
          </div>
        ) : null}

        <section className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <h2 className="card-title">Quorum meter</h2>
            <span className="card-link">{uni?.shortName}</span>
          </div>
          <div className="club-quorum-meter">
            <div className="club-quorum-meter-track">
              <div
                className="club-quorum-meter-fill"
                style={{
                  width: `${Math.min(100, (livePresent / Math.max(1, liveRequired)) * 100)}%`,
                  background: liveMet ? '#22c55e' : 'var(--club-orange)',
                }}
              />
            </div>
            <p className="club-quorum-meter-label">
              <strong>{livePresent}</strong> present · {liveRequired} required (1/3 of {activeMembers.length} active members)
              {liveMet ? ' ✅ Quorum met' : ' ⏳ Quorum not yet met'}
            </p>
          </div>
        </section>

        <section className="card">
          <div className="card-header">
            <h2 className="card-title">Active members</h2>
            <span className="card-link">{selected.size} of {activeMembers.length} selected</span>
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
            <input
              type="text"
              className="club-form-input"
              placeholder="Search members…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ flex: 1, minWidth: 200 }}
            />
            <button
              type="button"
              className="club-btn-secondary club-btn-sm"
              onClick={selectAll}
            >
              {selected.size === activeMembers.length ? 'Deselect all' : 'Select all'}
            </button>
          </div>

          {filtered.length === 0 ? (
            <p className="club-empty">No active members found.</p>
          ) : (
            <div className="club-member-list" style={{ maxHeight: 460, overflowY: 'auto' }}>
              {filtered.map((m) => {
                const isSelected = selected.has(m.id);
                return (
                  <label
                    key={m.id}
                    className={`club-member-row ${isSelected ? 'is-selected' : ''}`}
                    style={{ cursor: 'pointer' }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggle(m.id)}
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

          <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
            <button type="button" className="club-btn-primary" onClick={save}>
              Save attendance
            </button>
            <button
              type="button"
              className="club-btn-secondary club-btn-sm"
              onClick={() => setSelected(new Set())}
            >
              Clear
            </button>
          </div>
        </section>
      </main>
    </div>
    </ClubLayout>
  );
}