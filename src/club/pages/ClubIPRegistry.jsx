import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BrandHeader from '../components/BrandHeader';
import ClubLayout from "../components/ClubLayout";
import { useClub } from '../context/ClubContext';
import '../styles/ClubShared.css';

// IBARA YA 44 — Intellectual Property Registry

const formatDate = (iso) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch (e) { return iso; }
};

export default function ClubIPRegistry() {
  const { branchId } = useParams();
  const navigate = useNavigate();
  const {
    branchById,
    universities,
    ipForBranch,
    ipTypes,
    registerIP,
    updateIPShowcaseConsent,
    students,
    currentStudent,
  } = useClub();

  const branch = branchById(branchId);
  const uni = universities.find((u) => u.id === branch?.universityId);
  const myInnovations = currentStudent ? ipForBranch(branch?.id || '').filter((i) => i.innovatorId === currentStudent.id) : [];
  const allBranch = branch ? ipForBranch(branch.id) : [];

  const [showRegister, setShowRegister] = useState(false);
  const [draft, setDraft] = useState({
    innovatorId: currentStudent?.id || '',
    title: '',
    description: '',
    type: 'idea',
    fundingSource: 'Self-funded',
    ownershipTerms: '',
    showcaseConsent: true,
  });
  const [feedback, setFeedback] = useState('');

  const enriched = useMemo(() => {
    return allBranch.map((i) => ({ ...i, innovator: students.find((s) => s.id === i.innovatorId) }));
  }, [allBranch, students]);

  if (!branch) {
    return (
      <div className="club-public-page">
        <header className="club-public-header">
          <div className="club-public-header-inner">
            <BrandHeader compact title="Branch not found" />
            <button className="club-btn-secondary" type="button" onClick={() => navigate('/club/branches')}>
              ← Branches
            </button>
          </div>
        </header>
      </div>
    );
  }

  const handleRegister = (e) => {
    e.preventDefault();
    if (!draft.innovatorId) {
      setFeedback('Please choose an innovator.');
      return;
    }
    const result = registerIP({
      branchId: branch.id,
      ...draft,
    });
    if (!result.ok) {
      setFeedback(result.error || 'Could not register.');
      return;
    }
    setShowRegister(false);
    setDraft({
      innovatorId: currentStudent?.id || '',
      title: '',
      description: '',
      type: 'idea',
      fundingSource: 'Self-funded',
      ownershipTerms: '',
      showcaseConsent: true,
    });
    setFeedback('Innovation registered ✓');
  };

  return (
    <ClubLayout user={currentStudent} userRole="member">
      <div className="club-public-page">
      <header className="club-public-header">
        <div className="club-public-header-inner">
          <BrandHeader compact title="IP Registry" subtitle={`${branch.name} · IBARA YA 44`} />
          <div className="club-public-header-actions">
            <button className="club-btn-secondary" type="button" onClick={() => navigate(`/club/branches/${branch.id}`)}>
              ← Branch
            </button>
            <button
              className="club-btn-primary"
              style={{ width: 'auto', padding: '12px 22px' }}
              onClick={() => setShowRegister((s) => !s)}
            >
              {showRegister ? 'Close' : '+ Register innovation'}
            </button>
          </div>
        </div>
      </header>

      <main className="club-public-main">
        {feedback ? (
          <div
            className="club-error-box"
            style={{ background: feedback.includes('✓') ? '#dcfce7' : '#fef2f2', borderColor: feedback.includes('✓') ? '#bbf7d0' : '#fecaca', color: feedback.includes('✓') ? '#15803d' : '#dc2626' }}
          >
            {feedback}
          </div>
        ) : null}

        <section className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <h2 className="card-title">Ownership rules</h2>
            <span className="card-link">IBARA YA 44</span>
          </div>
          <ol className="club-duty-list">
            <li><strong>Innovator keeps the IP.</strong> Ideas, prototypes, products, and services remain the property of the person who created them.</li>
            <li><strong>Club showcase needs consent.</strong> The club may only display or promote a member's work with their explicit written consent.</li>
            <li><strong>Funded projects get written terms.</strong> If a project is supported by ZSA, sponsors, or grants, ownership, revenue-share, and confidentiality must be agreed in writing <strong>before</strong> execution.</li>
          </ol>
        </section>

        {showRegister ? (
          <section className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <h2 className="card-title">Register a new innovation</h2>
            </div>
            <form onSubmit={handleRegister}>
              <div className="club-form-row-2">
                <div className="club-form-group">
                  <label className="club-form-label">Innovator *</label>
                  <select
                    className="club-form-input"
                    value={draft.innovatorId}
                    onChange={(e) => setDraft((d) => ({ ...d, innovatorId: e.target.value }))}
                  >
                    <option value="">— Select —</option>
                    {students
                      .filter((s) => s.universityId === branch.universityId)
                      .map((s) => (
                        <option key={s.id} value={s.id}>{s.fullName}</option>
                      ))}
                  </select>
                </div>
                <div className="club-form-group">
                  <label className="club-form-label">Type *</label>
                  <select
                    className="club-form-input"
                    value={draft.type}
                    onChange={(e) => setDraft((d) => ({ ...d, type: e.target.value }))}
                  >
                    {ipTypes.map((t) => (
                      <option key={t.id} value={t.id}>{t.icon} {t.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="club-form-group">
                <label className="club-form-label">Title *</label>
                <input
                  type="text"
                  className="club-form-input"
                  value={draft.title}
                  onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                />
              </div>
              <div className="club-form-group">
                <label className="club-form-label">Description *</label>
                <textarea
                  className="club-form-textarea"
                  rows={3}
                  value={draft.description}
                  onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                />
              </div>
              <div className="club-form-row-2">
                <div className="club-form-group">
                  <label className="club-form-label">Funding source</label>
                  <input
                    type="text"
                    className="club-form-input"
                    value={draft.fundingSource}
                    onChange={(e) => setDraft((d) => ({ ...d, fundingSource: e.target.value }))}
                  />
                </div>
                <div className="club-form-group">
                  <label className="club-form-label">Ownership terms</label>
                  <input
                    type="text"
                    className="club-form-input"
                    placeholder="e.g. Inventor retains 100% IP"
                    value={draft.ownershipTerms}
                    onChange={(e) => setDraft((d) => ({ ...d, ownershipTerms: e.target.value }))}
                  />
                </div>
              </div>
              <label className="club-asset-row">
                <input
                  type="checkbox"
                  checked={draft.showcaseConsent}
                  onChange={(e) => setDraft((d) => ({ ...d, showcaseConsent: e.target.checked }))}
                />
                <span>I consent to the club showcasing my work on its public channels.</span>
              </label>
              <button type="submit" className="club-btn-primary" style={{ marginTop: 14 }}>
                Register
              </button>
            </form>
          </section>
        ) : null}

        <section className="card">
          <div className="card-header">
            <h2 className="card-title">Branch IP registry</h2>
            <span className="card-link">{enriched.length} entries</span>
          </div>
          {enriched.length === 0 ? (
            <p className="club-empty">No innovations registered yet.</p>
          ) : (
            <div className="ip-registry-grid">
              {enriched.map((i) => {
                const typeDef = ipTypes.find((t) => t.id === i.type);
                return (
                  <article key={i.id} className="ip-registry-card">
                    <header className="ip-registry-card-head">
                      <span className="ip-registry-icon">{typeDef?.icon || '💡'}</span>
                      <div>
                        <h3 className="ip-registry-title">{i.title}</h3>
                        <p className="ip-registry-type">{typeDef?.label} · {formatDate(i.registeredAt)}</p>
                      </div>
                    </header>
                    <p className="ip-registry-desc">{i.description}</p>
                    <dl className="ip-registry-meta">
                      <div>
                        <dt>Innovator</dt>
                        <dd>{i.innovator?.fullName || i.innovatorId}</dd>
                      </div>
                      <div>
                        <dt>Funding</dt>
                        <dd>{i.fundingSource}</dd>
                      </div>
                      <div>
                        <dt>Ownership</dt>
                        <dd>{i.ownershipTerms}</dd>
                      </div>
                      <div>
                        <dt>Showcase</dt>
                        <dd>
                          {i.showcaseConsent ? (
                            <span className="club-badge club-badge-active">Consent granted</span>
                          ) : (
                            <span className="club-badge club-badge-pending">No consent</span>
                          )}
                        </dd>
                      </div>
                      <div>
                        <dt>Evidence hash</dt>
                        <dd style={{ fontFamily: 'monospace', fontSize: 11 }}>{i.evidenceHash}</dd>
                      </div>
                    </dl>
                    {currentStudent && i.innovatorId === currentStudent.id ? (
                      <button
                        type="button"
                        className="club-btn-secondary club-btn-sm"
                        style={{ marginTop: 10 }}
                        onClick={() => updateIPShowcaseConsent(i.id, !i.showcaseConsent)}
                      >
                        {i.showcaseConsent ? 'Revoke showcase consent' : 'Grant showcase consent'}
                      </button>
                    ) : null}
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