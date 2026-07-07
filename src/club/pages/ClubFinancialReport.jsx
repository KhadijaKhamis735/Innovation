import { useParams, useNavigate } from 'react-router-dom';
import BrandHeader from '../components/BrandHeader';
import ClubLayout from "../components/ClubLayout";
import { useClub } from '../context/ClubContext';
import '../styles/ClubShared.css';

// IBARA YA 41 — Financial Report (read-only summary for the General Meeting)

const formatCurrency = (amount, currency = 'TZS') =>
  new Intl.NumberFormat('en-TZ', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);

const formatDateTime = (iso) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch (e) { return iso; }
};

export default function ClubFinancialReport() {
  const { branchId } = useParams();
  const navigate = useNavigate();
  const {
    branchById,
    universities,
    transactionsForBranch,
    treasuryForBranch,
    expensesByCategory,
    incomeCategories,
    expenseCategories,
    auditLogs,
    currentStudent,
    currentClubLeader,
    requestAudit,
  } = useClub();

  const branch = branchById(branchId);
  const uni = universities.find((u) => u.id === branch?.universityId);
  const txs = branch ? transactionsForBranch(branch.id) : [];
  const treasury = branch ? treasuryForBranch(branch.id) : { balance: 0, income: 0, expense: 0 };
  const breakdown = branch ? expensesByCategory(branch.id) : {};
  const branchAudits = branch ? auditLogs.filter((a) => a.branchId === branch.id) : [];
  const canRequest = !!currentClubLeader || currentStudent?.status === 'active';

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

  const handleRequestAudit = () => {
    requestAudit({
      branchId: branch.id,
      requestedBy: currentClubLeader?.id || currentStudent?.id || null,
      scope: 'All transactions',
      note: 'Requested from the Financial Report page.',
    });
    alert('Audit requested. The Audit Log will reflect this.');
  };

  return (
    <ClubLayout user={currentStudent || currentClubLeader} userRole="member">
      <div className="club-public-page">
      <header className="club-public-header">
        <div className="club-public-header-inner">
          <BrandHeader compact title="Financial Report" subtitle={`${branch.name} · IBARA YA 41`} />
          <div className="club-public-header-actions">
            <button className="club-btn-secondary" type="button" onClick={() => navigate(`/club/branches/${branch.id}/treasury`)}>
              ← Treasury
            </button>
            <button className="club-btn-secondary" type="button" onClick={() => navigate(`/club/branches/${branch.id}/treasury/audit`)}>
              Audit log
            </button>
            {canRequest ? (
              <button className="club-btn-primary" style={{ width: 'auto', padding: '12px 22px' }} onClick={handleRequestAudit}>
                Request audit
              </button>
            ) : null}
          </div>
        </div>
      </header>

      <main className="club-public-main">
        <section className="card" style={{ marginBottom: 20 }}>
          <div className="club-header-line">
            <div>
              <h2 className="card-title">Summary</h2>
              <p className="club-member-meta">Period: cumulative to date · {uni?.name}</p>
            </div>
            <span className="card-link">Generated {formatDateTime(new Date().toISOString())}</span>
          </div>

          <div className="treasury-balance-hero" style={{ marginTop: 12 }}>
            <div>
              <p className="treasury-balance-label">Closing balance</p>
              <h1 className="treasury-balance-amount">{formatCurrency(treasury.balance, treasury.currency)}</h1>
            </div>
            <div className="treasury-balance-breakdown">
              <div className="treasury-balance-cell">
                <span className="treasury-balance-cell-label">Total income</span>
                <span className="treasury-balance-cell-amount is-income">+{formatCurrency(treasury.income, treasury.currency)}</span>
              </div>
              <div className="treasury-balance-cell">
                <span className="treasury-balance-cell-label">Total expenses</span>
                <span className="treasury-balance-cell-amount is-expense">-{formatCurrency(treasury.expense, treasury.currency)}</span>
              </div>
            </div>
          </div>
        </section>

        <div className="club-branch-grid-2">
          <section className="card">
            <div className="card-header">
              <h2 className="card-title">Income sources</h2>
            </div>
            {incomeCategories.map((c) => {
              const amt = txs.filter((t) => t.type === 'income' && t.category === c.id && t.status === 'approved').reduce((s, t) => s + t.amount, 0);
              if (amt === 0) return null;
              return (
                <div key={c.id} className="treasury-breakdown-row">
                  <span className="treasury-breakdown-icon">{c.icon}</span>
                  <span className="treasury-breakdown-label">{c.label}</span>
                  <span className="treasury-breakdown-amount">{formatCurrency(amt)}</span>
                </div>
              );
            })}
            {txs.filter((t) => t.type === 'income' && t.status === 'approved').length === 0 ? (
              <p className="club-empty">No approved income yet.</p>
            ) : null}
          </section>

          <section className="card">
            <div className="card-header">
              <h2 className="card-title">Expense categories</h2>
            </div>
            {expenseCategories.map((c) => {
              const amt = breakdown[c.id] || 0;
              if (amt === 0) return null;
              return (
                <div key={c.id} className="treasury-breakdown-row">
                  <span className="treasury-breakdown-icon">{c.icon}</span>
                  <span className="treasury-breakdown-label">{c.label}</span>
                  <span className="treasury-breakdown-amount">{formatCurrency(amt)}</span>
                </div>
              );
            })}
            {Object.keys(breakdown).length === 0 ? (
              <p className="club-empty">No approved expenses yet.</p>
            ) : null}
          </section>
        </div>

        <section className="card" style={{ marginTop: 20 }}>
          <div className="card-header">
            <h2 className="card-title">All approved transactions</h2>
            <span className="card-link">{txs.filter((t) => t.status === 'approved').length} approved</span>
          </div>
          <div className="treasury-tx-list">
            {txs.filter((t) => t.status === 'approved').slice(0, 30).map((t) => {
              const cat = [...incomeCategories, ...expenseCategories].find((c) => c.id === t.category);
              return (
                <div key={t.id} className="treasury-tx-row">
                  <span className="treasury-tx-icon" style={{ background: t.type === 'income' ? '#dcfce7' : '#fef2f2' }}>
                    {cat?.icon}
                  </span>
                  <div className="treasury-tx-body">
                    <p className="treasury-tx-title">{t.description || cat?.label}</p>
                    <p className="treasury-tx-meta">{cat?.label} · {formatDateTime(t.date)}</p>
                  </div>
                  <span className={`treasury-tx-amount ${t.type === 'income' ? 'is-income' : 'is-expense'}`}>
                    {t.type === 'income' ? '+' : '−'}{formatCurrency(t.amount, t.currency)}
                  </span>
                </div>
              );
            })}
            {txs.filter((t) => t.status === 'approved').length === 0 ? (
              <p className="club-empty">No approved transactions.</p>
            ) : null}
          </div>
        </section>

        <p className="club-footnote" style={{ marginTop: 16 }}>
          IBARA YA 41 — The Treasurer presents this report at each General Meeting. Members may ask questions
          about any item via the kistaarabu process described in the constitution.
        </p>

        {branchAudits.length > 0 ? (
          <section className="card" style={{ marginTop: 20 }}>
            <div className="card-header">
              <h2 className="card-title">Audit history</h2>
              <span className="card-link">{branchAudits.length} audit{branchAudits.length === 1 ? '' : 's'}</span>
            </div>
            <div className="treasury-tx-list">
              {branchAudits.map((a) => (
                <div key={a.id} className="treasury-tx-row">
                  <div className="treasury-tx-icon">🔍</div>
                  <div className="treasury-tx-body">
                    <p className="treasury-tx-title">Audit {a.status}</p>
                    <p className="treasury-tx-meta">{a.scope} · {formatDateTime(a.requestedAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </main>
    </div>
    </ClubLayout>
  );
}