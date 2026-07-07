import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BrandHeader from '../components/BrandHeader';
import ClubLayout from "../components/ClubLayout";
import { useClub } from '../context/ClubContext';
import '../styles/ClubShared.css';

// IBARA YA 42 — Code of Conduct (read & sign)

const formatDate = (iso) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  } catch (e) { return iso; }
};

export default function ClubCodeOfConduct() {
  const { branchId } = useParams();
  const navigate = useNavigate();
  const {
    branchById,
    universities,
    codeOfConduct,
    codeOfConductSignatures,
    signCodeOfConduct,
    hasSignedConduct,
    students,
    currentStudent,
    currentClubLeader,
  } = useClub();

  const branch = branchById(branchId);
  const uni = universities.find((u) => u.id === branch?.universityId);
  const me = currentStudent || currentClubLeader;
  const alreadySigned = me ? hasSignedConduct(me.id) : false;
  const mySignature = alreadySigned
    ? codeOfConductSignatures.find((s) => s.memberId === me.id && s.version === codeOfConduct.version)
    : null;

  const [signatureText, setSignatureText] = useState(me?.fullName || '');
  const [feedback, setFeedback] = useState('');
  const [agreed, setAgreed] = useState(alreadySigned);

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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!me) {
      setFeedback('Please sign in to sign the Code of Conduct.');
      return;
    }
    if (!agreed) {
      setFeedback('Please tick the agreement box before signing.');
      return;
    }
    const result = signCodeOfConduct({
      memberId: me.id,
      signatureText,
    });
    if (!result.ok) {
      setFeedback(result.error || 'Could not record your signature.');
      return;
    }
    setFeedback('Thank you. Your signature has been recorded ✓');
  };

  // Members who already signed
  const signedForBranch = codeOfConductSignatures
    .filter((s) => s.version === codeOfConduct.version)
    .map((s) => ({ ...s, member: students.find((m) => m.id === s.memberId) }))
    .filter((s) => s.member?.clubId === branch.id || s.member?.universityId === branch.universityId);

  return (
    <ClubLayout user={currentStudent || currentClubLeader} userRole="member">
      <div className="club-public-page">
      <header className="club-public-header">
        <div className="club-public-header-inner">
          <BrandHeader compact title="Code of Conduct" subtitle={`${branch.name} · IBARA YA 42`} />
          <div className="club-public-header-actions">
            <button className="club-btn-secondary" type="button" onClick={() => navigate(`/club/branches/${branch.id}`)}>
              ← Branch
            </button>
          </div>
        </div>
      </header>

      <main className="club-public-main">
        <section className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <h2 className="card-title">Maadili ya Msingi</h2>
            <span className="card-link">Version {codeOfConduct.version} · ratified {formatDate(codeOfConduct.ratifiedAt)}</span>
          </div>
          <p style={{ margin: '0 0 12px', color: 'var(--club-text-2)', lineHeight: 1.6 }}>
            Every member of the Startup Innovation Club commits to the following
            principles. By signing, you affirm that you understand and will uphold them.
          </p>
          <ol className="club-duty-list">
            {codeOfConduct.principles.map((p, idx) => (
              <li key={idx}>{p}</li>
            ))}
          </ol>
        </section>

        {me ? (
          <section className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <h2 className="card-title">Sign as {me.fullName || currentClubLeader?.fullName}</h2>
              <span className="card-link">{alreadySigned ? 'Signed' : 'Not yet signed'}</span>
            </div>
            {alreadySigned ? (
              <div
                className="club-error-box"
                style={{ background: '#dcfce7', borderColor: '#bbf7d0', color: '#15803d' }}
              >
                ✓ You signed version {mySignature?.version} on{' '}
                {formatDate(mySignature?.signedAt)}.
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                {feedback ? (
                  <div
                    className="club-error-box"
                    style={{
                      background: feedback.includes('Thank') ? '#dcfce7' : '#fef2f2',
                      borderColor: feedback.includes('Thank') ? '#bbf7d0' : '#fecaca',
                      color: feedback.includes('Thank') ? '#15803d' : '#dc2626',
                    }}
                  >
                    {feedback}
                  </div>
                ) : null}
                <label className="club-asset-row" style={{ marginBottom: 12 }}>
                  <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
                  <span>I have read and agree to the Startup Innovation Club Code of Conduct v{codeOfConduct.version}.</span>
                </label>
                <div className="club-form-group">
                  <label className="club-form-label">Sign with your full name</label>
                  <input
                    type="text"
                    className="club-form-input"
                    value={signatureText}
                    onChange={(e) => setSignatureText(e.target.value)}
                  />
                </div>
                <button type="submit" className="club-btn-primary" disabled={!agreed}>
                  Sign Code of Conduct
                </button>
              </form>
            )}
          </section>
        ) : (
          <section className="card">
            <p className="club-empty">
              You must be signed in to sign the Code of Conduct.{' '}
              <button
                type="button"
                className="club-btn-secondary club-btn-sm"
                onClick={() => navigate('/club/login')}
              >
                Sign in
              </button>
            </p>
          </section>
        )}

        <section className="card">
          <div className="card-header">
            <h2 className="card-title">Signatures on record</h2>
            <span className="card-link">{signedForBranch.length} in {uni?.shortName}</span>
          </div>
          {signedForBranch.length === 0 ? (
            <p className="club-empty">No signatures recorded yet for this branch.</p>
          ) : (
            <div className="club-member-list">
              {signedForBranch.map((s) => (
                <div key={s.id} className="club-member-row">
                  <div className="club-member-avatar">
                    {s.member?.fullName
                      ?.split(' ')
                      .map((p) => p[0])
                      .filter(Boolean)
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()}
                  </div>
                  <div className="club-member-info">
                    <p className="club-member-name">{s.member?.fullName}</p>
                    <p className="club-member-meta">
                      Signed as "{s.signatureText}" on {formatDate(s.signedAt)}
                    </p>
                  </div>
                  <span className="club-badge club-badge-active">✓ Signed</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
    </ClubLayout>
  );
}