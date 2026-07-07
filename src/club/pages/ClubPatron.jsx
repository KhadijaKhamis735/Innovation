import { useParams, useNavigate } from 'react-router-dom';
import BrandHeader from '../components/BrandHeader';
import ClubLayout from "../components/ClubLayout";
import PatronProfile from '../components/PatronProfile';
import { useClub } from '../context/ClubContext';
import '../styles/ClubShared.css';

// IBARA YA 20 — Branch Patron Detail
// Full page dedicated to the Mlezi wa Klabu: who they are, what they do,
// and the limits of their role per the constitution.

export default function ClubPatron() {
  const { branchId } = useParams();
  const navigate = useNavigate();
  const { branchById, universities, patronForBranch, executivesForBranch } = useClub();

  const branch = branchById(branchId);
  const uni = universities.find((u) => u.id === branch?.universityId);
  const patron = patronForBranch(branch?.id);
  const committee = branch ? executivesForBranch(branch.id) : [];

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

  return (
    <ClubLayout userRole="member">
      <div className="club-public-page">
      <header className="club-public-header">
        <div className="club-public-header-inner">
          <BrandHeader
            compact
            title="Patron (Mlezi wa Klabu)"
            subtitle={`${branch.name} · IBARA YA 20`}
          />
          <div className="club-public-header-actions">
            <button
              className="club-btn-secondary"
              type="button"
              onClick={() => navigate(`/club/branches/${branch.id}`)}
            >
              ← Branch detail
            </button>
            <button
              className="club-btn-secondary"
              type="button"
              onClick={() => navigate(`/club/branches/${branch.id}/committee`)}
            >
              View committee
            </button>
          </div>
        </div>
      </header>

      <main className="club-public-main">
        <div className="club-branch-grid-2">
          {/* Patron profile */}
          <section className="card">
            <div className="card-header">
              <h2 className="card-title">Profile</h2>
              <span className="card-link">Faculty / Staff supervisor</span>
            </div>
            <PatronProfile patron={patron} university={uni} />
            {patron ? (
              <div style={{ marginTop: 16 }}>
                <p className="club-patron-meta">🏛️ {uni?.name}</p>
                <p className="club-patron-meta">📍 {branch.address || branch.campus}</p>
              </div>
            ) : null}
          </section>

          {/* Role boundaries */}
          <section className="card">
            <div className="card-header">
              <h2 className="card-title">Role &amp; Boundaries</h2>
              <span className="card-link">IBARA YA 20</span>
            </div>
            <p style={{ margin: '0 0 14px', color: 'var(--club-text-2)', lineHeight: 1.7 }}>
              The Patron is appointed or recognized by the university to supervise
              and advise the club. The Patron is <strong>not</strong> part of the
              elected Executive Committee and does not vote on club decisions.
            </p>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--club-text)', margin: '0 0 8px' }}>
              The Patron may:
            </h3>
            <ul className="club-duty-list">
              <li>Provide academic advice and guidance to the Executive Committee.</li>
              <li>Oversee compliance with university rules and policies.</li>
              <li>Sign off on major club decisions and disciplinary matters.</li>
              <li>Lend institutional support when needed.</li>
              <li>Co-sign handover records (IBARA YA 33).</li>
            </ul>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--club-text)', margin: '16px 0 8px' }}>
              The Patron does NOT:
            </h3>
            <ul className="club-duty-list">
              <li>Hold a position in the elected Executive Committee (Kamati Tendaji).</li>
              <li>Cast votes in club elections or General Meetings.</li>
              <li>Directly manage club finances or programs.</li>
              <li>Override decisions of the Executive Committee or General Meeting.</li>
            </ul>
          </section>
        </div>

        {/* Context: how the Patron relates to the committee */}
        <section className="card" style={{ marginTop: 20 }}>
          <div className="card-header">
            <h2 className="card-title">Patron &amp; the Executive Committee</h2>
            <span className="card-link">{committee.length} executive positions</span>
          </div>
          <p style={{ margin: '0 0 14px', color: 'var(--club-text-2)', lineHeight: 1.7 }}>
            The Patron works alongside — but separately from — the 7 elected
            members of the Executive Committee. The Patron supervises and
            supports them, but the day-to-day leadership belongs to the
            Mwenyekiti (Chairperson) and the Kamati Tendaji.
          </p>
          <button
            type="button"
            className="club-btn-secondary"
            style={{ width: 'auto', padding: '10px 18px' }}
            onClick={() => navigate(`/club/branches/${branch.id}/committee`)}
          >
            See the full committee →
          </button>
        </section>
      </main>
    </div>
    </ClubLayout>
  );
}