import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BrandHeader from '../components/BrandHeader';
import ClubLayout from "../components/ClubLayout";
import { useClub } from '../context/ClubContext';
import '../styles/ClubShared.css';

// IBARA YA 35, 36 — Schedule Meeting (Secretary / Mwenyekiti)
// Sets title, agenda, date, location, in-person or online.

const formatDateTimeLocal = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const defaultDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  d.setHours(16, 0, 0, 0);
  return formatDateTimeLocal(d);
};

export default function ClubScheduleMeeting() {
  const { branchId } = useParams();
  const navigate = useNavigate();
  const {
    branchById,
    universities,
    meetingTypes,
    scheduleMeeting,
    currentStudent,
    currentClubLeader,
  } = useClub();

  const branch = branchById(branchId);
  const uni = universities.find((u) => u.id === branch?.universityId);

  const [type, setType] = useState('executive_meeting');
  const [title, setTitle] = useState('');
  const [agenda, setAgenda] = useState('');
  const [date, setDate] = useState(defaultDate());
  const [location, setLocation] = useState(uni?.name || '');
  const [isOnline, setIsOnline] = useState(false);
  const [meetingUrl, setMeetingUrl] = useState('');
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

  const selectedType = meetingTypes.find((t) => t.id === type);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!title.trim()) {
      setError('Meeting title is required.');
      return;
    }
    if (!date) {
      setError('Meeting date/time is required.');
      return;
    }
    if (isOnline && !meetingUrl.trim()) {
      setError('Online meetings need a meeting URL.');
      return;
    }
    const result = scheduleMeeting({
      branchId: branch.id,
      type,
      title,
      agenda,
      date,
      location,
      isOnline,
      meetingUrl,
      convenedBy: currentClubLeader?.id || currentStudent?.id || null,
    });
    if (!result.ok) {
      setError(result.error || 'Could not schedule meeting.');
      return;
    }
    setSuccess('Meeting scheduled ✓');
    setTimeout(() => {
      navigate(`/club/branches/${branch.id}/meetings/${result.meeting.id}`);
    }, 600);
  };

  return (
    <ClubLayout user={currentStudent || currentClubLeader} userRole="leader">
      <div className="club-public-page">
      <header className="club-public-header">
        <div className="club-public-header-inner">
          <BrandHeader
            compact
            title="Schedule Meeting"
            subtitle={`${branch.name} · IBARA YA 35`}
          />
          <div className="club-public-header-actions">
            <button
              className="club-btn-secondary"
              type="button"
              onClick={() => navigate(`/club/branches/${branch.id}/meetings`)}
            >
              ← Calendar
            </button>
          </div>
        </div>
      </header>

      <main className="club-public-main">
        <div className="club-branch-grid-2">
          <section className="card">
            <div className="card-header">
              <h2 className="card-title">Meeting details</h2>
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
                <label className="club-form-label">Meeting type *</label>
                <div className="club-meeting-type-grid">
                  {meetingTypes.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className={`club-meeting-type-pill ${type === t.id ? 'is-selected' : ''}`}
                      style={{ borderColor: type === t.id ? t.color : 'var(--club-border)' }}
                      onClick={() => setType(t.id)}
                    >
                      <span className="club-meeting-type-pill-icon">{t.icon}</span>
                      <span>
                        <strong>{t.shortLabel}</strong>
                        <span className="club-meeting-type-pill-meta">{t.frequency}</span>
                      </span>
                    </button>
                  ))}
                </div>
                {selectedType ? (
                  <p className="club-footnote" style={{ marginTop: 10 }}>
                    {selectedType.description}
                  </p>
                ) : null}
              </div>

              <div className="club-form-group">
                <label className="club-form-label">Title *</label>
                <input
                  type="text"
                  className="club-form-input"
                  placeholder="e.g. July Executive Committee Meeting"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="club-form-group">
                <label className="club-form-label">Agenda</label>
                <span className="club-form-sublabel">
                  One topic per line — will be shared with attendees.
                </span>
                <textarea
                  className="club-form-textarea"
                  rows={5}
                  placeholder={'Review term plan\nApprove July training calendar\nDiscuss hackathon sponsors'}
                  value={agenda}
                  onChange={(e) => setAgenda(e.target.value)}
                />
              </div>

              <div className="club-form-row-2">
                <div className="club-form-group">
                  <label className="club-form-label">Date &amp; time *</label>
                  <input
                    type="datetime-local"
                    className="club-form-input"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
                <div className="club-form-group">
                  <label className="club-form-label">Location</label>
                  <input
                    type="text"
                    className="club-form-input"
                    placeholder={isOnline ? 'Online' : 'Room / Campus / City'}
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
              </div>

              <div className="club-form-group">
                <label className="club-form-label">Format</label>
                <div className="club-asset-list">
                  <label className="club-asset-row">
                    <input
                      type="checkbox"
                      checked={isOnline}
                      onChange={(e) => setIsOnline(e.target.checked)}
                    />
                    <span>Online meeting (provide URL below)</span>
                  </label>
                </div>
              </div>

              {isOnline ? (
                <div className="club-form-group">
                  <label className="club-form-label">Meeting URL</label>
                  <input
                    type="url"
                    className="club-form-input"
                    placeholder="https://meet.google.com/..."
                    value={meetingUrl}
                    onChange={(e) => setMeetingUrl(e.target.value)}
                  />
                </div>
              ) : null}

              <button type="submit" className="club-btn-primary">
                Schedule meeting
              </button>
            </form>
          </section>

          {/* Summary side */}
          <section className="card">
            <div className="card-header">
              <h2 className="card-title">Quick reference</h2>
              <span className="card-link">IBARA YA 35, 36</span>
            </div>
            <dl className="club-exec-card-meta">
              <div>
                <dt>Branch</dt>
                <dd>{branch.name}</dd>
              </div>
              <div>
                <dt>University</dt>
                <dd>{uni?.name}</dd>
              </div>
              <div>
                <dt>Selected type</dt>
                <dd>{selectedType?.label}</dd>
              </div>
              <div>
                <dt>Quorum required</dt>
                <dd>{selectedType?.quorum}</dd>
              </div>
              <div>
                <dt>Voting rule</dt>
                <dd>Majority of votes cast (tied → chair decides)</dd>
              </div>
              <div>
                <dt>Notice</dt>
                <dd>Members will be notified via in-app &amp; announcements</dd>
              </div>
            </dl>
            <p className="club-footnote" style={{ marginTop: 14 }}>
              IBARA YA 36 — During the meeting, the Chair can propose decisions
              and members vote. A simple majority (≥50%) of votes cast is
              sufficient unless a higher threshold applies (e.g. constitutional
              amendments require 2/3).
            </p>
          </section>
        </div>
      </main>
    </div>
    </ClubLayout>
  );
}