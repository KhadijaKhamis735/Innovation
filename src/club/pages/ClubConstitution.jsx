import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BrandHeader from '../components/BrandHeader';
import ClubLayout from "../components/ClubLayout";
import { useClub } from '../context/ClubContext';
import { translate } from '../i18n/strings';
import '../styles/ClubShared.css';

// IBARA YA 46–48 — Constitution Viewer
// Displays the full 48-article text grouped by chapter (SURA), in Kiswahili
// primary + English summary. Working language toggle via `preferences.language`.

const formatDate = (iso) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  } catch (e) { return iso; }
};

export default function ClubConstitution() {
  const { branchId } = useParams();
  const navigate = useNavigate();
  const {
    branchById,
    universities,
    constitutionMeta,
    suraList,
    ibaraList,
    amendmentsForBranch,
    preferences,
    setLanguage,
    currentStudent,
    currentClubLeader,
  } = useClub();

  const branch = branchById(branchId);
  const uni = universities.find((u) => u.id === branch?.universityId);
  const isSw = preferences?.language === 'sw';

  const [openSura, setOpenSura] = useState(new Set([1, 2]));
  const [openIbara, setOpenIbara] = useState(null);

  const articlesByChapter = useMemo(() => {
    const map = {};
    ibaraList.forEach((a) => {
      if (!map[a.chapter]) map[a.chapter] = [];
      map[a.chapter].push(a);
    });
    return map;
  }, [ibaraList]);

  const branchAmendments = branch ? amendmentsForBranch(branch.id) : [];
  const canPropose = !!currentClubLeader || (currentStudent && currentStudent.status === 'active');

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

  const toggleSura = (id) => {
    setOpenSura((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <ClubLayout user={currentStudent || currentClubLeader} userRole="member">
      <div className="club-public-page">
      <header className="club-public-header">
        <div className="club-public-header-inner">
          <BrandHeader
            compact
            title={isSw ? 'Katiba ya Klabu' : 'Club Constitution'}
            subtitle={`${branch.name} · ${isSw ? 'Toleo' : 'Version'} ${constitutionMeta.version}`}
          />
          <div className="club-public-header-actions" style={{ flexWrap: 'wrap', gap: 8 }}>
            <button className="club-btn-secondary" type="button" onClick={() => navigate(`/club/branches/${branch.id}`)}>
              ← {isSw ? 'Tawi' : 'Branch'}
            </button>

            {/* Language toggle */}
            <div className="constitution-lang-toggle">
              <button
                type="button"
                className={`lang-pill ${!isSw ? 'is-active' : ''}`}
                onClick={() => setLanguage('en')}
              >
                EN
              </button>
              <button
                type="button"
                className={`lang-pill ${isSw ? 'is-active' : ''}`}
                onClick={() => setLanguage('sw')}
              >
                SW
              </button>
            </div>

            {canPropose ? (
              <>
                <button
                  type="button"
                  className="club-btn-primary club-btn-sm"
                  onClick={() => navigate(`/club/branches/${branch.id}/amendments/propose`)}
                >
                  {translate(preferences, 'proposeAmendment')}
                </button>
              </>
            ) : null}
          </div>
        </div>
      </header>

      <main className="club-public-main">
        {/* Hero */}
        <section className="constitution-hero">
          <h1 className="constitution-hero-title">
            {isSw ? constitutionMeta.title : constitutionMeta.titleEnglish}
          </h1>
          <p className="constitution-hero-meta">
            {isSw ? 'Toleo' : 'Version'} {constitutionMeta.version} · {isSw ? 'Imepitishwa' : 'Ratified'} {formatDate(constitutionMeta.ratifiedAt)} · {constitutionMeta.parentBody}
          </p>
          <p className="constitution-hero-summary">
            {isSw
              ? 'Hati hii ni ya matumizi ya ndani ya klabu na ithibitishwe pia kwa kuzingatia kanuni za chuo husika.'
              : 'This document is for internal club use and is also ratified with respect to university rules.'}
          </p>
        </section>

        <div className="constitution-grid">
          {/* Table of contents */}
          <aside className="constitution-toc">
            <h3 className="card-title" style={{ fontSize: 14 }}>
              {isSw ? 'Masura' : 'Chapters'}
            </h3>
            <nav className="constitution-toc-list">
              {suraList.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className="constitution-toc-row"
                  onClick={() => {
                    setOpenSura((prev) => new Set(prev).add(s.id));
                    setTimeout(() => {
                      const el = document.getElementById(`sura-${s.id}`);
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }, 50);
                  }}
                >
                  <span className="constitution-toc-num">{s.id}</span>
                  <span>
                    <strong>{isSw ? s.name : s.nameEnglish}</strong>
                    <span className="constitution-toc-range">
                      {isSw ? 'Ibara' : 'Art.'} {s.articles[0]}–{s.articles[s.articles.length - 1]}
                    </span>
                  </span>
                </button>
              ))}
            </nav>
          </aside>

          {/* Articles */}
          <div className="constitution-articles">
            {suraList.map((s) => {
              const open = openSura.has(s.id);
              const arts = articlesByChapter[s.id] || [];
              return (
                <section key={s.id} id={`sura-${s.id}`} className="constitution-sura">
                  <button
                    type="button"
                    className="constitution-sura-header"
                    onClick={() => toggleSura(s.id)}
                  >
                    <div>
                      <p className="constitution-sura-num">
                        {isSw ? 'Sura ya' : 'Chapter'} {s.id}
                      </p>
                      <h2 className="constitution-sura-title">
                        {isSw ? s.name : s.nameEnglish}
                      </h2>
                    </div>
                    <span className="constitution-sura-meta">
                      {arts.length} {isSw ? 'ibara' : 'articles'} · {open ? '−' : '+'}
                    </span>
                  </button>
                  {open ? (
                    <div className="constitution-ibara-list">
                      {arts.map((a) => (
                        <article key={a.number} className="constitution-ibara">
                          <header
                            className="constitution-ibara-header"
                            onClick={() => setOpenIbara(openIbara === a.number ? null : a.number)}
                          >
                            <span className="constitution-ibara-num">
                              {isSw ? 'Ibara' : 'Art.'} {a.number}
                            </span>
                            <span className="constitution-ibara-text">
                              {isSw ? a.kiswahili : a.english}
                            </span>
                          </header>
                          {openIbara === a.number ? (
                            <div className="constitution-ibara-detail">
                              <p className="constitution-ibara-bilingual">
                                <strong>{isSw ? 'Kiswahili' : 'Kiswahili'}:</strong> {a.kiswahili}
                              </p>
                              <p className="constitution-ibara-bilingual">
                                <strong>English:</strong> {a.english}
                              </p>

                              {branchAmendments.filter((amd) => amd.articleNumber === a.number).length > 0 ? (
                                <div className="constitution-amendments">
                                  <p className="constitution-amendments-title">
                                    {isSw ? 'Marekebisho' : 'Amendments'} ({isSw ? 'Ibara' : 'Art.'} {a.number})
                                  </p>
                                  {branchAmendments
                                    .filter((amd) => amd.articleNumber === a.number)
                                    .map((amd) => (
                                      <div key={amd.id} className="constitution-amendment-row">
                                        <span className="club-badge">{amd.status}</span>
                                        <p className="constitution-amendment-text">{amd.proposedText}</p>
                                        {amd.rationale ? (
                                          <p className="constitution-amendment-meta">— {amd.rationale}</p>
                                        ) : null}
                                      </div>
                                    ))}
                                </div>
                              ) : null}
                            </div>
                          ) : null}
                        </article>
                      ))}
                    </div>
                  ) : null}
                </section>
              );
            })}
          </div>
        </div>

        {branchAmendments.length > 0 ? (
          <section className="card" style={{ marginTop: 20 }}>
            <div className="card-header">
              <h2 className="card-title">{translate(preferences, 'amendmentHistory')}</h2>
              <span className="card-link">{branchAmendments.length} {isSw ? 'marekebisho' : 'amendments'}</span>
            </div>
            <div className="constitution-amendments-list">
              {branchAmendments.map((amd) => (
                <div key={amd.id} className="constitution-amendment-row" style={{ borderBottom: '1px dashed var(--club-border)', padding: '10px 0' }}>
                  <span
                    className={`club-badge ${amd.status === 'passed' ? 'club-badge-active' : amd.status === 'rejected' ? 'club-badge-suspended' : 'club-badge-pending'}`}
                  >
                    {isSw ? 'Ibara' : 'Art.'} {amd.articleNumber} · {amd.status}
                  </span>
                  <p className="constitution-amendment-text">{amd.proposedText}</p>
                  <p className="constitution-amendment-meta">
                    {isSw ? 'Imewasilishwa' : 'Proposed'} {formatDate(amd.proposedAt)} · {isSw ? 'For' : 'For'} {amd.votesFor} · {isSw ? 'Against' : 'Against'} {amd.votesAgainst}
                  </p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <p className="club-footnote" style={{ marginTop: 20 }}>
          {isSw
            ? 'IBARA YA 48.3 — Lugha ya kazi ya Katiba hii ni Kiswahili. Toleo la Kiswahili lina nguvu ya kisheria.'
            : 'IBARA YA 48.3 — The working language of this Constitution is Kiswahili. The Swahili version is the authoritative text.'}
        </p>
      </main>
    </div>
    </ClubLayout>
  );
}