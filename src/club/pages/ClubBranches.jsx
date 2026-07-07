import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import BrandHeader from '../components/BrandHeader';
import ClubLayout from '../components/ClubLayout';
import { useClub } from '../context/ClubContext';
import '../styles/ClubShared.css';

// IBARA YA 4 — Branch Locator
// Lists every active branch (Tawi) under ZSA coordination.
// Each card links into the per-branch detail page.

export default function ClubBranches() {
  const navigate = useNavigate();
  const { universities, clubs, branchStats, patronForBranch, zsaHQ } = useClub();
  const [search, setSearch] = useState('');

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return clubs
      .filter((c) => c.status !== 'dissolved')
      .filter((c) => {
        if (!q) return true;
        const uni = universities.find((u) => u.id === c.universityId);
        return (
          c.name.toLowerCase().includes(q) ||
          (uni?.name || '').toLowerCase().includes(q) ||
          (uni?.shortName || '').toLowerCase().includes(q)
        );
      });
  }, [clubs, universities, search]);

  return (
    <ClubLayout userRole="member">
      <div className="club-public-page">
      <header className="club-public-header">
        <div className="club-public-header-inner">
          <BrandHeader
            compact
            title="Club Branches"
            subtitle={`IBARA YA 4 — Branches (Matawi) under ${zsaHQ.name}`}
          />
          <div className="club-public-header-actions">
            <button className="club-btn-secondary" type="button" onClick={() => navigate('/club')}>
              ← Back to Club Hub
            </button>
          </div>
        </div>
      </header>

      <main className="club-public-main">
        <section className="club-public-hero">
          <h1 className="club-public-hero-title">Find your university's innovation branch.</h1>
          <p className="club-public-hero-sub">
            Each Zanzibar university hosts its own branch (Tawi) of the Startup Innovation Club,
            operating under the same constitution but with campus-level autonomy.
            The ZSA HQ in {zsaHQ.address} coordinates activities across all branches.
          </p>
          <div className="club-public-search">
            <input
              className="club-form-input"
              type="text"
              placeholder="Search by university name or short code…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </section>

        <section className="club-branch-grid">
          {visible.length === 0 ? (
            <div className="club-empty">
              <p>No branches match your search.</p>
            </div>
          ) : (
            visible.map((branch) => {
              const uni = universities.find((u) => u.id === branch.universityId);
              const patron = patronForBranch(branch.id);
              const stats = branchStats(branch.id);
              return (
                <article key={branch.id} className="club-branch-card">
                  <div className="club-branch-card-top" style={{ background: uni?.primaryColor }}>
                    <span className="club-branch-card-badge">{uni?.shortName}</span>
                    <span className="club-branch-card-status">
                      {branch.status === 'active' ? '🟢 Active' : '🟡 ' + branch.status}
                    </span>
                  </div>
                  <div className="club-branch-card-body">
                    <h3 className="club-branch-card-name">{branch.name}</h3>
                    <p className="club-branch-card-uni">{uni?.name}</p>
                    <p className="club-branch-card-tag">{uni?.tagline}</p>

                    <dl className="club-branch-card-stats">
                      <div>
                        <dt>Active members</dt>
                        <dd>{stats.active}</dd>
                      </div>
                      <div>
                        <dt>Pending</dt>
                        <dd>{stats.pending}</dd>
                      </div>
                      <div>
                        <dt>Patron (Mlezi)</dt>
                        <dd>{patron ? patron.fullName : 'Not assigned'}</dd>
                      </div>
                    </dl>

                    <button
                      type="button"
                      className="club-btn-primary"
                      onClick={() => navigate(`/club/branches/${branch.id}`)}
                    >
                      View branch →
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </section>
      </main>
      </div>
    </ClubLayout>
  );
}