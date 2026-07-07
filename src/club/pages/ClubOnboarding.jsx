import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BrandHeader from '../components/BrandHeader';
import { useClub } from '../context/ClubContext';
import { UNIVERSITIES, SEED_LEADERS, SEED_EXECUTIVES } from '../context/clubSeed';
import { ONBOARDING_STEPS } from '../data/constitution';
import { EXECUTIVE_POSITIONS } from '../data/executivePositions';
import '../styles/ClubShared.css';

// IBARA YA 48 — Branch onboarding wizard
// Multi-step: name → patron → interim committee → charter → language → activate.

const STEP_IDS = ['name', 'patron', 'interim', 'charter', 'language', 'go-live'];

const formatDate = (iso) => {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); } catch (e) { return iso; }
};

export default function ClubOnboarding() {
  const navigate = useNavigate();
  const {
    clubLeaders,
    startOnboardingPlan,
    completeOnboardingStep,
    activateBranchFromPlan,
    onboardingPlans,
    executivesForBranch,
    currentClubLeader,
  } = useClub();

  // Build a single combined view of all active onboarding plans (from any initiator).
  const activePlans = onboardingPlans.filter((p) => p.status !== 'activated' && p.status !== 'cancelled');

  const [draft, setDraft] = useState({
    branchName: '',
    universityId: UNIVERSITIES[0]?.id || '',
    campus: '',
    address: '',
    patronId: '',
    interim: EXECUTIVE_POSITIONS.reduce((acc, p) => ({ ...acc, [p.id]: '' }), {}),
    charterSigner: '',
    workingLanguage: 'sw',
  });

  const [stepIdx, setStepIdx] = useState(0);
  const [planId, setPlanId] = useState(null);
  const [feedback, setFeedback] = useState('');

  // Seed example: include the canonical seeded Patron list for convenience
  const availablePatrons = [...SEED_LEADERS, ...clubLeaders];

  const handleNext = async () => {
    if (stepIdx === 0) {
      if (!draft.branchName.trim() || !draft.universityId) {
        setFeedback('Branch name and university are required.');
        return;
      }
      // Start a plan
      const result = startOnboardingPlan({
        branchName: draft.branchName.trim(),
        universityId: draft.universityId,
        campus: draft.campus.trim(),
        address: draft.address.trim(),
        patronId: draft.patronId || null,
        initiatedBy: currentClubLeader?.id || null,
      });
      if (!result.ok) {
        setFeedback(result.error || 'Could not start plan.');
        return;
      }
      setPlanId(result.plan.id);
      completeOnboardingStep(result.plan.id, 'name', currentClubLeader?.id || null);
      setStepIdx(1);
      setFeedback('');
    } else if (stepIdx === 1) {
      if (!draft.patronId) {
        setFeedback('Choose a Patron.');
        return;
      }
      completeOnboardingStep(planId, 'patron', currentClubLeader?.id || null);
      setStepIdx(2);
      setFeedback('');
    } else if (stepIdx === 2) {
      completeOnboardingStep(planId, 'interim', currentClubLeader?.id || null);
      setStepIdx(3);
      setFeedback('');
    } else if (stepIdx === 3) {
      if (!draft.charterSigner.trim()) {
        setFeedback('Provide charter signer name.');
        return;
      }
      completeOnboardingStep(planId, 'charter', currentClubLeader?.id || null);
      setStepIdx(4);
      setFeedback('');
    } else if (stepIdx === 4) {
      completeOnboardingStep(planId, 'language', currentClubLeader?.id || null);
      setStepIdx(5);
      setFeedback('');
    } else if (stepIdx === 5) {
      const result = activateBranchFromPlan(planId, currentClubLeader?.id || null);
      if (!result.ok) {
        setFeedback(result.error || 'Activation failed.');
        return;
      }
      setFeedback('Branch activated ✓');
      setTimeout(() => navigate(`/club/branches/${result.branch.id}`), 800);
    }
  };

  const handleBack = () => setStepIdx((s) => Math.max(0, s - 1));

  // ─────────────────────────────────────────────────────────────────────────
  // Active onboarding plans (continuation of prior sessions)
  // ─────────────────────────────────────────────────────────────────────────
  const renderPlanResume = (plan) => {
    const uni = UNIVERSITIES.find((u) => u.id === plan.universityId);
    const completed = plan.steps.filter((s) => s.status === 'completed').length;
    return (
      <div key={plan.id} className="onboarding-resume-row">
        <div>
          <p className="onboarding-resume-name">{plan.branchName}</p>
          <p className="onboarding-resume-meta">{uni?.shortName} · {completed}/{plan.steps.length} steps · created {formatDate(plan.createdAt)}</p>
        </div>
        <button
          type="button"
          className="club-btn-primary club-btn-sm"
          onClick={() => {
            setPlanId(plan.id);
            // Resume at first pending step
            const idx = plan.steps.findIndex((s) => s.status !== 'completed');
            setStepIdx(Math.max(idx, 0));
            setDraft((d) => ({
              ...d,
              branchName: plan.branchName,
              universityId: plan.universityId,
              campus: plan.campus,
              address: plan.address,
              patronId: plan.patronId,
            }));
          }}
        >
          Resume →
        </button>
      </div>
    );
  };

  const currentStep = ONBOARDING_STEPS[stepIdx];

  return (
    <div className="club-public-page">
      <header className="club-public-header">
        <div className="club-public-header-inner">
          <BrandHeader compact title="New Branch Onboarding" subtitle="IBARA YA 48 — transitional provisions" />
          <div className="club-public-header-actions">
            <button className="club-btn-secondary" type="button" onClick={() => navigate('/club/branches')}>
              ← Branches
            </button>
          </div>
        </div>
      </header>

      <main className="club-public-main">
        {activePlans.length > 0 ? (
          <section className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <h2 className="card-title">Resume an in-progress onboarding</h2>
              <span className="card-link">{activePlans.length} active</span>
            </div>
            <div className="onboarding-resume-list">
              {activePlans.map(renderPlanResume)}
            </div>
          </section>
        ) : null}

        {/* Wizard */}
        <section className="onboarding-wizard">
          <ol className="onboarding-progress">
            {ONBOARDING_STEPS.map((s, idx) => (
              <li
                key={s.id}
                className={`onboarding-progress-step ${idx === stepIdx ? 'is-active' : idx < stepIdx ? 'is-done' : ''}`}
              >
                <span className="onboarding-progress-num">{idx + 1}</span>
                <span className="onboarding-progress-label">{s.label}</span>
              </li>
            ))}
          </ol>

          <div className="card onboarding-step-card">
            <div className="card-header">
              <h2 className="card-title">Step {stepIdx + 1}: {currentStep?.label}</h2>
            </div>
            <p style={{ color: 'var(--club-text-2)', marginBottom: 14 }}>{currentStep?.description}</p>

            {feedback ? (
              <div className="club-error-box" style={{ marginBottom: 12 }}>{feedback}</div>
            ) : null}

            {stepIdx === 0 ? (
              <>
                <div className="club-form-group">
                  <label className="club-form-label">Branch name *</label>
                  <input
                    type="text"
                    className="club-form-input"
                    placeholder="e.g. SUZA Innovation Club"
                    value={draft.branchName}
                    onChange={(e) => setDraft((d) => ({ ...d, branchName: e.target.value }))}
                  />
                </div>
                <div className="club-form-group">
                  <label className="club-form-label">University *</label>
                  <select
                    className="club-form-input"
                    value={draft.universityId}
                    onChange={(e) => setDraft((d) => ({ ...d, universityId: e.target.value }))}
                  >
                    {UNIVERSITIES.map((u) => (
                      <option key={u.id} value={u.id}>{u.shortName} — {u.name}</option>
                    ))}
                  </select>
                </div>
                <div className="club-form-row-2">
                  <div className="club-form-group">
                    <label className="club-form-label">Campus</label>
                    <input
                      type="text"
                      className="club-form-input"
                      value={draft.campus}
                      onChange={(e) => setDraft((d) => ({ ...d, campus: e.target.value }))}
                    />
                  </div>
                  <div className="club-form-group">
                    <label className="club-form-label">Address</label>
                    <input
                      type="text"
                      className="club-form-input"
                      value={draft.address}
                      onChange={(e) => setDraft((d) => ({ ...d, address: e.target.value }))}
                    />
                  </div>
                </div>
              </>
            ) : null}

            {stepIdx === 1 ? (
              <>
                <div className="club-form-group">
                  <label className="club-form-label">Patron (Mlezi wa Klabu) *</label>
                  <p className="club-form-sublabel">A faculty or staff member appointed by the university.</p>
                  <select
                    className="club-form-input"
                    value={draft.patronId}
                    onChange={(e) => setDraft((d) => ({ ...d, patronId: e.target.value }))}
                  >
                    <option value="">— Select a Patron —</option>
                    {availablePatrons.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.fullName} ({p.role}) — {p.email}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            ) : null}

            {stepIdx === 2 ? (
              <>
                <p className="club-form-sublabel">
                  Per IBARA YA 48, interim office bearers may be appointed for up to one term until a formal election.
                  Leave blank to use placeholders.
                </p>
                {EXECUTIVE_POSITIONS.map((p) => (
                  <div className="club-form-group" key={p.id}>
                    <label className="club-form-label">{p.title}</label>
                    <input
                      type="text"
                      className="club-form-input"
                      placeholder="Member name or ID (optional)"
                      value={draft.interim[p.id] || ''}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, interim: { ...d.interim, [p.id]: e.target.value } }))
                      }
                    />
                  </div>
                ))}
              </>
            ) : null}

            {stepIdx === 3 ? (
              <>
                <div className="club-form-group">
                  <label className="club-form-label">Charter signer *</label>
                  <span className="club-form-sublabel">The Patrons + Executive Committee confirm ratification of the constitution.</span>
                  <input
                    type="text"
                    className="club-form-input"
                    value={draft.charterSigner}
                    onChange={(e) => setDraft((d) => ({ ...d, charterSigner: e.target.value }))}
                    placeholder="Type the signer's full name"
                  />
                </div>
              </>
            ) : null}

            {stepIdx === 4 ? (
              <>
                <div className="club-form-group">
                  <label className="club-form-label">Working language</label>
                  <p className="club-form-sublabel">
                    Per IBARA YA 48, the working language of this Constitution is Kiswahili.
                    English translation is provided for partner reference.
                  </p>
                  <div className="club-asset-list">
                    <label className="club-asset-row">
                      <input
                        type="radio"
                        checked={draft.workingLanguage === 'sw'}
                        onChange={() => setDraft((d) => ({ ...d, workingLanguage: 'sw' }))}
                      />
                      <span><strong>Kiswahili</strong> — authoritative text per IBARA YA 48.</span>
                    </label>
                    <label className="club-asset-row">
                      <input
                        type="radio"
                        checked={draft.workingLanguage === 'en'}
                        onChange={() => setDraft((d) => ({ ...d, workingLanguage: 'en' }))}
                      />
                      <span><strong>English</strong> — bilingual mode (Kiswahili remains authoritative).</span>
                    </label>
                  </div>
                </div>
              </>
            ) : null}

            {stepIdx === 5 ? (
              <>
                <div className="onboarding-summary">
                  <h3 className="card-title" style={{ fontSize: 14, margin: 0 }}>Final review</h3>
                  <p className="onboarding-summary-row">
                    <span>Branch name</span>
                    <strong>{draft.branchName || '—'}</strong>
                  </p>
                  <p className="onboarding-summary-row">
                    <span>University</span>
                    <strong>{UNIVERSITIES.find((u) => u.id === draft.universityId)?.shortName || '—'}</strong>
                  </p>
                  <p className="onboarding-summary-row">
                    <span>Patron</span>
                    <strong>{availablePatrons.find((p) => p.id === draft.patronId)?.fullName || '—'}</strong>
                  </p>
                  <p className="onboarding-summary-row">
                    <span>Charter signer</span>
                    <strong>{draft.charterSigner || '—'}</strong>
                  </p>
                  <p className="onboarding-summary-row">
                    <span>Working language</span>
                    <strong>{draft.workingLanguage === 'sw' ? 'Kiswahili' : 'English (bilingual)'}</strong>
                  </p>
                </div>
              </>
            ) : null}

            <div className="onboarding-step-actions">
              {stepIdx > 0 ? (
                <button type="button" className="club-btn-secondary club-btn-sm" onClick={handleBack}>
                  ← Back
                </button>
              ) : <span />}
              <button
                type="button"
                className="club-btn-primary"
                onClick={handleNext}
              >
                {stepIdx === 5 ? '✓ Activate branch' : 'Continue →'}
              </button>
            </div>
          </div>
        </section>

        <p className="club-footnote" style={{ marginTop: 20 }}>
          IBARA YA 48 — After activation, the branch is added to the constitution's registry and benefits from full constitutional protection, including its own Executive Committee election cycle.
        </p>
      </main>
    </div>
  );
}