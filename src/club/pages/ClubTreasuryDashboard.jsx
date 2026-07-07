import { useParams, useNavigate } from 'react-router-dom';
import BrandHeader from '../components/BrandHeader';
import ClubLayout from "../components/ClubLayout";
import { useClub } from '../context/ClubContext';
import '../styles/ClubShared.css';

// IBARA YA 38–41 — Treasury Dashboard
// Shows balance, recent transactions, and quick links.

const formatCurrency = (amount, currency = 'TZS') => {
  try {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch (e) {
    return `${currency} ${amount.toLocaleString()}`;
  }
};

const formatDate = (iso) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch (e) { return iso; }
};

const STATUS_COLORS = {
  pending: '#f59e0b',
  approved: '#22c55e',
  rejected: '#ef4444',
};

export default function ClubTreasuryDashboard() {
  const { branchId } = useParams();
  const navigate = useNavigate();
  const {
    branchById,
    universities,
    transactionsForBranch,
    treasuryForBranch,
    expensesByCategory,
    walletsForBranch,
    expenseCategories,
    incomeCategories,
    budgetForBranch,
    currentStudent,
    currentClubLeader,
  } = useClub();

  const branch = branchById(branchId);
  const uni = universities.find((u) => u.id === branch?.universityId);
  const treasury = branch ? treasuryForBranch(branch.id) : { balance: 0, income: 0, expense: 0 };
  const txs = branch ? transactionsForBranch(branch.id).slice(0, 10) : [];
  const wallets = branch ? walletsForBranch(branch.id) : [];
  const breakdown = branch ? expensesByCategory(branch.id) : {};
  const budget = branch ? budgetForBranch(branch.id) : null;
  const canRecord = !!currentClubLeader || currentStudent?.status === 'active';

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

  const totalAllocated = budget?.categories?.reduce((s, c) => s + c.allocated, 0) || 0;

  return (
    <ClubLayout user={currentStudent || currentClubLeader} userRole="member">
      <div className="club-public-page">
      <header className="club-public-header">
        <div className="club-public-header-inner">
          <BrandHeader compact title="Treasury (Hazina)" subtitle={`${branch.name} · IBARA YA 38–41`} />
          <div className="club-public-header-actions">
            <button className="club-btn-secondary" type="button" onClick={() => navigate(`/club/branches/${branch.id}`)}>
              ← Branch
            </button>
            {canRecord ? (
              <>
                <button
                  className="club-btn-primary"
                  style={{ width: 'auto', padding: '12px 22px' }}
                  onClick={() => navigate(`/club/branches/${branch.id}/treasury/record`)}
                >
                  + Record transaction
                </button>
              </>
            ) : null}
          </div>
        </div>
      </header>

      <main className="club-public-main">
        {/* Balance hero */}
        <section className="treasury-balance-hero">
          <div>
            <p className="treasury-balance-label">Current Balance</p>
            <h1 className="treasury-balance-amount">{formatCurrency(treasury.balance, treasury.currency)}</h1>
            <p className="treasury-balance-meta">
              {treasury.totalTransactions} approved transactions · {uni?.shortName} branch wallet
            </p>
          </div>
          <div className="treasury-balance-breakdown">
            <div className="treasury-balance-cell">
              <span className="treasury-balance-cell-label">Income</span>
              <span className="treasury-balance-cell-amount is-income">+{formatCurrency(treasury.income, treasury.currency)}</span>
            </div>
            <div className="treasury-balance-cell">
              <span className="treasury-balance-cell-label">Expenses</span>
              <span className="treasury-balance-cell-amount is-expense">-{formatCurrency(treasury.expense, treasury.currency)}</span>
            </div>
          </div>
        </section>

        {/* Quick links */}
        <section className="treasury-quicklinks">
          <button
            className="treasury-quicklink"
            onClick={() => navigate(`/club/branches/${branch.id}/treasury/budget`)}
          >
            <span className="treasury-quicklink-icon">📊</span>
            <span className="treasury-quicklink-label">Budget planner</span>
            <span className="treasury-quicklink-meta">{budget ? 'Active budget' : 'No budget yet'}</span>
          </button>
          <button
            className="treasury-quicklink"
            onClick={() => navigate(`/club/branches/${branch.id}/treasury/dues`)}
          >
            <span className="treasury-quicklink-icon">🪙</span>
            <span className="treasury-quicklink-label">Member dues</span>
            <span className="treasury-quicklink-meta">Track contributions</span>
          </button>
          <button
            className="treasury-quicklink"
            onClick={() => navigate(`/club/branches/${branch.id}/treasury/report`)}
          >
            <span className="treasury-quicklink-icon">📑</span>
            <span className="treasury-quicklink-label">Financial report</span>
            <span className="treasury-quicklink-meta">Term-end summary</span>
          </button>
          <button
            className="treasury-quicklink"
            onClick={() => navigate(`/club/branches/${branch.id}/treasury/audit`)}
          >
            <span className="treasury-quicklink-icon">🔍</span>
            <span className="treasury-quicklink-label">Audit log</span>
            <span className="treasury-quicklink-meta">IBARA YA 41 transparency</span>
          </button>
        </section>

        <div className="club-branch-grid-2">
          {/* Wallets */}
          <section className="card">
            <div className="card-header">
              <h2 className="card-title">Wallets</h2>
              <span className="card-link">{wallets.length} account{wallets.length === 1 ? '' : 's'}</span>
            </div>
            {wallets.length === 0 ? (
              <p className="club-empty">No wallet registered yet.</p>
            ) : (
              wallets.map((w) => (
                <div key={w.id} className="treasury-wallet-row">
                  <div className="treasury-wallet-icon">
                    {w.type === 'bank' ? '🏦' : w.type === 'mobile_money' ? '📱' : '💵'}
                  </div>
                  <div className="treasury-wallet-body">
                    <p className="treasury-wallet-name">{w.accountName}</p>
                    <p className="treasury-wallet-meta">{w.provider} · {w.accountNumber}</p>
                  </div>
                  <span className="club-badge club-badge-active">{w.active ? 'Active' : 'Inactive'}</span>
                </div>
              ))
            )}
          </section>

          {/* Expense breakdown */}
          <section className="card">
            <div className="card-header">
              <h2 className="card-title">Expense breakdown</h2>
              <span className="card-link">By IBARA YA 40 category</span>
            </div>
            {Object.keys(breakdown).length === 0 ? (
              <p className="club-empty">No expenses yet.</p>
            ) : (
              expenseCategories.map((c) => {
                const amt = breakdown[c.id] || 0;
                const pct = treasury.expense > 0 ? (amt / treasury.expense) * 100 : 0;
                return (
                  <div key={c.id} className="treasury-breakdown-row">
                    <span className="treasury-breakdown-icon">{c.icon}</span>
                    <span className="treasury-breakdown-label">{c.label}</span>
                    <span className="treasury-breakdown-amount">{formatCurrency(amt, treasury.currency)}</span>
                    <div className="treasury-breakdown-bar">
                      <div className="treasury-breakdown-fill" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </section>
        </div>

        {/* Recent transactions */}
        <section className="card" style={{ marginTop: 20 }}>
          <div className="card-header">
            <h2 className="card-title">Recent transactions</h2>
            <span className="card-link">{txs.length} shown</span>
          </div>
          {txs.length === 0 ? (
            <p className="club-empty">No transactions yet.</p>
          ) : (
            <div className="treasury-tx-list">
              {txs.map((t) => {
                const cat = [...incomeCategories, ...expenseCategories].find((c) => c.id === t.category);
                const isIncome = t.type === 'income';
                return (
                  <div key={t.id} className="treasury-tx-row">
                    <span className="treasury-tx-icon" style={{ background: isIncome ? '#dcfce7' : '#fef2f2' }}>
                      {cat?.icon || (isIncome ? '⬆️' : '⬇️')}
                    </span>
                    <div className="treasury-tx-body">
                      <p className="treasury-tx-title">{t.description || cat?.label || t.category}</p>
                      <p className="treasury-tx-meta">
                        {cat?.label} · {formatDate(t.date)} · {t.status}
                      </p>
                    </div>
                    <span className={`treasury-tx-amount ${isIncome ? 'is-income' : 'is-expense'}`}>
                      {isIncome ? '+' : '−'}
                      {formatCurrency(t.amount, t.currency)}
                    </span>
                    {t.status === 'pending' ? (
                      <span className="club-badge" style={{ background: STATUS_COLORS.pending + '20', color: STATUS_COLORS.pending }}>
                        Pending
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <p className="club-footnote" style={{ marginTop: 16 }}>
          IBARA YA 40 — Club funds must NOT be used for personal benefit. Receipts
          must accompany any expense above the major-expense threshold ({formatCurrency(0, treasury.currency)} default), and the
          Executive Committee must approve them before disbursement.
        </p>
      </main>
    </div>
    </ClubLayout>
  );
}