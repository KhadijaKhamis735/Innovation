import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BrandHeader from '../components/BrandHeader';
import ClubLayout from "../components/ClubLayout";
import { useClub } from '../context/ClubContext';
import '../styles/ClubShared.css';

// IBARA YA 11 — Member Directory
// Searchable + filterable list of all members in a branch.

const CATEGORY_OPTIONS = [
  { id: 'all', label: 'All categories' },
  { id: 'student', label: 'Students' },
  { id: 'staff', label: 'University Staff' },
  { id: 'alumni', label: 'Alumni' },
  { id: 'corporate', label: 'Corporate / NGO' },
];

const STATUS_OPTIONS = [
  { id: 'all', label: 'All statuses' },
  { id: 'active', label: 'Active' },
  { id: 'pending', label: 'Pending' },
  { id: 'suspended', label: 'Suspended' },
  { id: 'withdrawn', label: 'Withdrawn' },
  { id: 'expelled', label: 'Expelled' },
  { id: 'rejected', label: 'Rejected' },
];

export default function ClubMemberDirectory() {
  const { branchId } = useParams();
  const navigate = useNavigate();
  const { branchById, universities, membersForBranch, branchStats } = useClub();

  const branch = branchById(branchId);
  const uni = universities.find((u) => u.id === branch?.universityId);

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');

  const filtered = useMemo(() => {
    if (!branch) return [];
    const q = search.trim().toLowerCase();
    return membersForBranch(
      branch.id,
      category === 'all' ? null : category,
      status === 'all' ? null : status
    ).filter((m) => {
      if (!q) return true;
      return (
        m.fullName.toLowerCase().includes(q) ||
        (m.email || '').toLowerCase().includes(q) ||
        (m.regNumber || '').toLowerCase().includes(q) ||
        (m.staffId || '').toLowerCase().includes(q) ||
        (m.organizationName || '').toLowerCase().includes(q)
      );
    });
  }, [branch, membersForBranch, search, category, status]);

  if (!branch) {
    return (
      <div className="club-public-page">
        <header className="club-public-header">
          <div className="club-public-header-inner">
            <BrandHeader compact title="Branch not found" />
            <button className="club-btn-secondary" type="button" onClick={() => navigate('/club/branches')}>
              ← Back to branches
            </button>
          </div>
        </header>
      </div>
    );
  }

  const stats = branchStats(branch.id);

  return (
    <ClubLayout userRole="member">
      <div className="club-public-page">
      <header className="club-public-header">
        <div className="club-public-header-inner">
          <BrandHeader
            compact
            title={`Members — ${branch.name}`}
            subtitle={`${uni?.name} · ${stats.total} total members`}
          />
          <div className="club-public-header-actions">
            <button className="club-btn-secondary" type="button" onClick={() => navigate(`/club/branches/${branch.id}`)}>
              ← Branch detail
            </button>
          </div>
        </div>
      </header>

      <main className="club-public-main">
        <section className="club-directory-filters">
          <input
            type="text"
            className="club-form-input"
            placeholder="Search by name, email, reg number, staff ID, or organization…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="club-filter-row">
            <label className="club-filter-label">
              Category
              <select
                className="club-form-input"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORY_OPTIONS.map((o) => (
                  <option key={o.id} value={o.id}>{o.label}</option>
                ))}
              </select>
            </label>
            <label className="club-filter-label">
              Status
              <select
                className="club-form-input"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.id} value={o.id}>{o.label}</option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section className="card">
          <div className="card-header">
            <h2 className="card-title">Directory</h2>
            <span className="card-link">{filtered.length} of {stats.total} members</span>
          </div>
          {filtered.length === 0 ? (
            <p className="club-empty">No members match your filters.</p>
          ) : (
            <div className="club-member-list">
              {filtered.map((m) => (
                <div key={m.id} className="club-member-row">
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
                      {CATEGORY_OPTIONS.find((c) => c.id === m.category)?.label || m.category}
                      {m.regNumber ? ` · ${m.regNumber}` : ''}
                      {m.staffId ? ` · ${m.staffId}` : ''}
                      {m.graduationYear ? ` · Class of ${m.graduationYear}` : ''}
                      {m.organizationName ? ` · ${m.organizationName}` : ''}
                    </p>
                    {m.bio ? <p className="club-member-bio">{m.bio}</p> : null}
                  </div>
                  <span className={`club-badge club-badge-${m.status}`}>
                    {m.status}
                  </span>
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