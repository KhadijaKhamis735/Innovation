import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BrandHeader from '../components/BrandHeader';
import ClubLayout from "../components/ClubLayout";
import { useClub } from '../context/ClubContext';
import '../styles/ClubShared.css';

// IBARA YA 46 — Propose a Constitutional Amendment

export default function ClubProposeAmendment() {
  const { branchId } = useParams();
  const navigate = useNavigate();
  const {
    branchById,
    universities,
    ibaraList,
    proposeAmendment,
    currentStudent,
    currentClubLeader,
  } = useClub();

  const branch = branchById(branchId);
  const uni = universities.find((u) => u.id === branch?.universityId);
  const me = currentStudent || currentClubLeader;

  const [articleNumber, setArticleNumber] = useState('');
  const [proposedText, setProposedText] = useState('');
  const [rationale, setRationale] = useState('');
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');

  const selectedArticle = ibaraList.find((a) => a.number === Number(articleNumber));

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
    setError('');
    setFeedback('');
    if (!articleNumber) {
      setError('Choose an article to amend.');
      return;
    }
    if (!proposedText.trim()) {
      setError('Provide the proposed new text.');
      return;
    }
    const result = proposeAmendment({
      branchId: branch.id,
      articleNumber: Number(articleNumber),
      currentText: selectedArticle?.kiswahili || '',
      proposedText,
      rationale,
      proposedBy: me?.id || null,
    });
    if (!result.ok) {
      setError(result.error || 'Could not propose amendment.');
      return;
    }
    setFeedback('Amendment proposed ✓');
    setTimeout(() => {
      navigate(`/club/branches/${branch.id}/amendments/${result.amendment.id}`);
    }, 700);
  };

  return (
    <ClubLayout user={currentStudent || currentClubLeader} userRole="member">
      <div className="club-public-page">
      <header className="club-public-header">
        <div className="club-public-header-inner">
          <BrandHeader
            compact
            title="Propose Amendment"
            subtitle={`${branch.name} · IBARA YA 46`}
          />
          <div className="club-public-header-actions">
            <button className="club-btn-secondary" type="button" onClick={() => navigate(`/club/branches/${branch.id}/constitution`)}>
              ← Constitution
            </button>
          </div>
        </div>
      </header>

      <main className="club-public-main">
        <section className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <h2 className="card-title">Amendment rules</h2>
            <span className="card-link">IBARA YA 46</span>
          </div>
          <ol className="club-duty-list">
            <li>Proposers: Kamati Tendaji, Mlezi wa Klabu, or at least ⅓ of active members.</li>
            <li>The proposal is distributed to members for a sufficient period before the meeting.</li>
            <li>Passes with a ⅔ majority at a meeting with quorum.</li>
            <li>No amendment may violate national law, university rules, or the voluntary non-political status of the club.</li>
          </ol>
        </section>

        <section className="card">
          <div className="card-header">
            <h2 className="card-title">Propose an amendment</h2>
            <span className="card-link">{uni?.shortName}</span>
          </div>
          <form onSubmit={handleSubmit}>
            {error ? <div className="club-error-box">{error}</div> : null}
            {feedback ? (
              <div
                className="club-error-box"
                style={{ background: '#dcfce7', borderColor: '#bbf7d0', color: '#15803d' }}
              >
                {feedback}
              </div>
            ) : null}

            <div className="club-form-group">
              <label className="club-form-label">Article *</label>
              <select className="club-form-input" value={articleNumber} onChange={(e) => setArticleNumber(e.target.value)}>
                <option value="">— Choose an article —</option>
                {ibaraList.map((a) => (
                  <option key={a.number} value={a.number}>
                    Art. {a.number} — {a.english.slice(0, 80)}…
                  </option>
                ))}
              </select>
            </div>

            {selectedArticle ? (
              <div className="amendment-current-preview">
                <p className="amendment-diff-label">CURRENT (Kiswahili)</p>
                <p className="amendment-diff-text">{selectedArticle.kiswahili}</p>
                <p className="amendment-diff-label" style={{ marginTop: 12 }}>CURRENT (English)</p>
                <p className="amendment-diff-text">{selectedArticle.english}</p>
              </div>
            ) : null}

            <div className="club-form-group">
              <label className="club-form-label">Proposed new text *</label>
              <span className="club-form-sublabel">Replace the article text with this. Vote will compare both.</span>
              <textarea
                className="club-form-textarea"
                rows={5}
                value={proposedText}
                onChange={(e) => setProposedText(e.target.value)}
              />
            </div>

            <div className="club-form-group">
              <label className="club-form-label">Rationale</label>
              <textarea
                className="club-form-textarea"
                rows={3}
                placeholder="Why this change is needed."
                value={rationale}
                onChange={(e) => setRationale(e.target.value)}
              />
            </div>

            <button type="submit" className="club-btn-primary">Submit amendment for debate</button>
          </form>
        </section>
      </main>
    </div>
    </ClubLayout>
  );
}