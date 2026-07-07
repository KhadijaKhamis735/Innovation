import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BrandHeader from '../components/BrandHeader';
import ClubLayout from "../components/ClubLayout";
import { useClub } from '../context/ClubContext';
import '../styles/ClubShared.css';

// IBARA YA 39 — Budget Planner
// Set term totals + per-category allocations, with live "spent" tracked against approvals.

const formatCurrency = (amount, currency = 'TZS') => {
  try {
    return new Intl.NumberFormat('en-TZ', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
  } catch (e) {
    return `${currency} ${amount.toLocaleString()}`;
  }
};

export default function ClubBudgetPlanner() {
  const { branchId } = useParams();
  const navigate = useNavigate();
  const {
    branchById,
    universities,
    expenseCategories,
    treasuryForBranch,
    budgetForBranch,
    createBudget,
    expensesByCategory,
    currentClubLeader,
  } = useClub();

  const branch = branchById(branchId);
  const uni = universities.find((u) => u.id === branch?.universityId);
  const treasury = branch ? treasuryForBranch(branch.id) : { income: 0, expense: 0, balance: 0 };
  const existing = branch ? budgetForBranch(branch.id) : null;
  const spentByCat = branch ? expensesByCategory(branch.id) : {};

  const [period, setPeriod] = useState(existing?.period || 'Term budget');
  const [totalIncome, setTotalIncome] = useState(existing?.totalIncome || Math.max(treasury.income, 200000));
  const [allocations, setAllocations] = useState(
    existing?.categories?.length > 0
      ? existing.categories
      : expenseCategories.map((c) => ({
          name: c.label,
          category: c.id,
          allocated: 20000,
        }))
  );

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

  const totalAllocated = allocations.reduce((s, a) => s + Number(a.allocated || 0), 0);
  const remaining = Number(totalIncome) - totalAllocated;

  const updateAllocation = (idx, value) => {
    setAllocations((prev) => prev.map((a, i) => (i === idx ? { ...a, allocated: Number(value) || 0 } : a)));
  };

  const submit = (e) => {
    e.preventDefault();
    if (remaining < 0) {
      alert(`Allocations exceed planned income by ${formatCurrency(-remaining, treasury.currency)}.`);
      return;
    }
    createBudget({
      branchId: branch.id,
      period,
      totalIncome: Number(totalIncome),
      totalExpense: totalAllocated,
      categories: allocations,
      approvedBy: currentClubLeader?.id || null,
    });
    navigate(`/club/branches/${branch.id}/treasury`);
  };

  return (
    <ClubLayout user={currentClubLeader} userRole="leader">
      <div className="club-public-page">
      <header className="club-public-header">
        <div className="club-public-header-inner">
          <BrandHeader compact title="Budget Planner" subtitle={`${branch.name} · IBARA YA 39`} />
          <div className="club-public-header-actions">
            <button className="club-btn-secondary" type="button" onClick={() => navigate(`/club/branches/${branch.id}/treasury`)}>
              ← Treasury
            </button>
          </div>
        </div>
      </header>

      <main className="club-public-main">
        <form onSubmit={submit} className="card" style={{ marginBottom: 20 }}>
          <div className="club-branch-grid-2">
            <div>
              <div className="club-form-group">
                <label className="club-form-label">Budget period *</label>
                <input type="text" className="club-form-input" value={period} onChange={(e) => setPeriod(e.target.value)} />
              </div>
              <div className="club-form-group">
                <label className="club-form-label">Planned income (TZS)</label>
                <input
                  type="number"
                  className="club-form-input"
                  value={totalIncome}
                  onChange={(e) => setTotalIncome(e.target.value)}
                />
              </div>
            </div>
            <div>
              <h3 className="card-title" style={{ fontSize: 14, marginTop: 0 }}>Summary</h3>
              <dl className="club-exec-card-meta">
                <div><dt>Income target</dt><dd>{formatCurrency(totalIncome, treasury.currency)}</dd></div>
                <div><dt>Total allocated</dt><dd>{formatCurrency(totalAllocated, treasury.currency)}</dd></div>
                <div>
                  <dt>Remaining</dt>
                  <dd style={{ color: remaining < 0 ? '#b91c1c' : '#15803d' }}>
                    {formatCurrency(remaining, treasury.currency)}
                  </dd>
                </div>
                <div><dt>Already spent</dt><dd>{formatCurrency(treasury.expense, treasury.currency)}</dd></div>
              </dl>
            </div>
          </div>
        </form>

        <section className="card">
          <div className="card-header">
            <h2 className="card-title">Category allocations</h2>
            <span className="card-link">{allocations.length} categories</span>
          </div>
          <div className="treasury-budget-grid">
            {allocations.map((a, idx) => {
              const spent = spentByCat[a.category] || 0;
              const pct = a.allocated > 0 ? Math.min(100, (spent / a.allocated) * 100) : 0;
              return (
                <div key={a.category} className="treasury-budget-row">
                  <div className="treasury-budget-row-head">
                    <span className="treasury-budget-name">{a.name}</span>
                    <span className="treasury-budget-amounts">
                      <span className="is-spent">{formatCurrency(spent, treasury.currency)}</span>
                      {' / '}
                      <span className="is-alloc">{formatCurrency(a.allocated, treasury.currency)}</span>
                    </span>
                  </div>
                  <div className="treasury-breakdown-bar">
                    <div className="treasury-breakdown-fill" style={{ width: `${pct}%`, background: pct > 90 ? '#ef4444' : 'var(--club-orange)' }} />
                  </div>
                  <input
                    type="number"
                    className="club-form-input"
                    value={a.allocated}
                    onChange={(e) => updateAllocation(idx, e.target.value)}
                    style={{ marginTop: 8 }}
                  />
                </div>
              );
            })}
          </div>

          <button type="button" className="club-btn-primary" style={{ marginTop: 16 }} onClick={submit}>
            Save budget
          </button>
        </section>
      </main>
    </div>
    </ClubLayout>
  );
}