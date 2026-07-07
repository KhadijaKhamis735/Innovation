import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BrandHeader from '../components/BrandHeader';
import ClubLayout from "../components/ClubLayout";
import { useClub } from '../context/ClubContext';
import '../styles/ClubShared.css';

// IBARA YA 37 — Meeting Minutes Editor (Kumbukumbu)
// Secretary edits structured minutes: agenda item → discussion → decision →
// responsible + deadline.

export default function ClubMeetingMinutes() {
  const { branchId, meetingId } = useParams();
  const navigate = useNavigate();
  const {
    branchById,
    universities,
    meetingById,
    minutesForMeeting,
    saveMinutes,
    currentStudent,
    currentClubLeader,
  } = useClub();

  const branch = branchById(branchId);
  const uni = universities.find((u) => u.id === branch?.universityId);
  const meeting = meetingById(meetingId);
  const stored = meeting ? minutesForMeeting(meeting.id) : null;

  const [items, setItems] = useState(stored?.items || []);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    if (stored) setItems(stored.items || []);
  }, [stored]);

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

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        agendaItem: '',
        discussion: '',
        decision: '',
        responsible: '',
        deadline: '',
      },
    ]);
  };

  const updateItem = (idx, patch) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };

  const removeItem = (idx) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const seedFromAgenda = () => {
    if (!meeting.agenda) return;
    const lines = meeting.agenda
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length === 0) return;
    setItems((prev) => [
      ...prev.filter((it) => it.agendaItem.trim()),
      ...lines.map((text, i) => ({
        id: `seed-${Date.now()}-${i}`,
        agendaItem: text,
        discussion: '',
        decision: '',
        responsible: '',
        deadline: '',
      })),
    ]);
  };

  const save = () => {
    saveMinutes({
      meetingId: meeting.id,
      items: items.filter((it) => it.agendaItem.trim() || it.discussion.trim() || it.decision.trim()),
      recordedBy: currentStudent?.id || currentClubLeader?.id || null,
    });
    setFeedback('Minutes saved ✓');
    setTimeout(() => {
      navigate(`/club/branches/${branch.id}/meetings/${meeting.id}`);
    }, 700);
  };

  return (
    <ClubLayout user={currentStudent || currentClubLeader} userRole="member">
      <div className="club-public-page">
      <header className="club-public-header">
        <div className="club-public-header-inner">
          <BrandHeader
            compact
            title="Meeting Minutes"
            subtitle={`${meeting.title} · IBARA YA 37`}
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
            <h2 className="card-title">About minutes</h2>
            <span className="card-link">IBARA YA 37</span>
          </div>
          <p style={{ margin: 0, color: 'var(--club-text-2)', lineHeight: 1.6 }}>
            Record the discussion and outcome of each agenda item. The Secretary
            prepares the minutes; the Chair approves them at the next meeting.
            Approved minutes become part of the club's official record.
          </p>
        </section>

        <section className="card">
          <div className="card-header">
            <h2 className="card-title">Kumbukumbu</h2>
            <span className="card-link">{items.length} item{items.length === 1 ? '' : 's'}</span>
          </div>

          {items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <p className="club-empty" style={{ marginBottom: 14 }}>
                No items yet. {meeting.agenda ? 'Seed from the agenda or add manually.' : 'Add the first item.'}
              </p>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                {meeting.agenda ? (
                  <button
                    type="button"
                    className="club-btn-primary club-btn-sm"
                    onClick={seedFromAgenda}
                  >
                    Seed from agenda
                  </button>
                ) : null}
                <button
                  type="button"
                  className="club-btn-secondary club-btn-sm"
                  onClick={addItem}
                >
                  + Add item
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {items.map((it, idx) => (
                <div key={it.id || idx} className="club-minutes-editor-item">
                  <div className="club-minutes-editor-head">
                    <span className="club-minutes-editor-num">#{idx + 1}</span>
                    <button
                      type="button"
                      className="club-btn-ghost-danger"
                      style={{ width: 'auto', padding: '6px 12px', fontSize: 12 }}
                      onClick={() => removeItem(idx)}
                    >
                      Remove
                    </button>
                  </div>
                  <div className="club-form-group">
                    <label className="club-form-label">Agenda item</label>
                    <input
                      type="text"
                      className="club-form-input"
                      placeholder="e.g. Approve term budget"
                      value={it.agendaItem}
                      onChange={(e) => updateItem(idx, { agendaItem: e.target.value })}
                    />
                  </div>
                  <div className="club-form-group">
                    <label className="club-form-label">Discussion</label>
                    <textarea
                      className="club-form-textarea"
                      rows={3}
                      placeholder="What was discussed? Key points raised."
                      value={it.discussion}
                      onChange={(e) => updateItem(idx, { discussion: e.target.value })}
                    />
                  </div>
                  <div className="club-form-group">
                    <label className="club-form-label">Decision (if any)</label>
                    <textarea
                      className="club-form-textarea"
                      rows={2}
                      placeholder="e.g. Motion passed — approve Ksh 50,000 for July training."
                      value={it.decision}
                      onChange={(e) => updateItem(idx, { decision: e.target.value })}
                    />
                  </div>
                  <div className="club-form-row-2">
                    <div className="club-form-group">
                      <label className="club-form-label">Responsible</label>
                      <input
                        type="text"
                        className="club-form-input"
                        placeholder="Name or position"
                        value={it.responsible}
                        onChange={(e) => updateItem(idx, { responsible: e.target.value })}
                      />
                    </div>
                    <div className="club-form-group">
                      <label className="club-form-label">Deadline</label>
                      <input
                        type="date"
                        className="club-form-input"
                        value={it.deadline ? it.deadline.slice(0, 10) : ''}
                        onChange={(e) => updateItem(idx, { deadline: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                <button type="button" className="club-btn-secondary club-btn-sm" onClick={addItem}>
                  + Add item
                </button>
                {meeting.agenda && items.length === 0 ? (
                  <button type="button" className="club-btn-secondary club-btn-sm" onClick={seedFromAgenda}>
                    Seed from agenda
                  </button>
                ) : null}
              </div>
            </div>
          )}

          <button
            type="button"
            className="club-btn-primary"
            style={{ marginTop: 18 }}
            onClick={save}
          >
            Save minutes
          </button>
        </section>
      </main>
    </div>
    </ClubLayout>
  );
}