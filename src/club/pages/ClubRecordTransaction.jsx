import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BrandHeader from '../components/BrandHeader';
import ClubLayout from "../components/ClubLayout";
import { useClub } from '../context/ClubContext';
import '../styles/ClubShared.css';

// IBARA YA 38, 40 — Record Transaction (income or expense)

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
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export default function ClubRecordTransaction() {
  const { branchId } = useParams();
  const navigate = useNavigate();
  const {
    branchById,
    universities,
    walletsForBranch,
    recordTransaction,
    incomeCategories,
    expenseCategories,
    majorExpenseThreshold,
    currentStudent,
    currentClubLeader,
  } = useClub();

  const branch = branchById(branchId);
  const uni = universities.find((u) => u.id === branch?.universityId);
  const wallets = branch ? walletsForBranch(branch.id) : [];

  const [type, setType] = useState('expense');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(formatDate(new Date()));
  const [description, setDescription] = useState('');
  const [walletId, setWalletId] = useState(wallets[0]?.id || '');
  const [isReimbursement, setIsReimbursement] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');

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

  const cats = type === 'income' ? incomeCategories : expenseCategories;
  const isMajor = type === 'expense' && Number(amount) >= majorExpenseThreshold;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setFeedback('');
    if (!category) {
      setError('Please choose a category.');
      return;
    }
    const result = recordTransaction({
      branchId: branch.id,
      walletId: walletId || (wallets[0]?.id || null),
      type,
      category,
      amount,
      date,
      description,
      isReimbursement,
      recordedBy: currentStudent?.id || currentClubLeader?.id || null,
    });
    if (!result.ok) {
      setError(result.error || 'Could not save transaction.');
      return;
    }
    setFeedback(
      isMajor
        ? `Saved. Because this expense exceeds ${formatCurrency(majorExpenseThreshold)}, it's marked pending until the Executive Committee approves it.`
        : 'Transaction recorded ✓'
    );
    setTimeout(() => {
      navigate(`/club/branches/${branch.id}/treasury`);
    }, 1100);
  };

  return (
    <ClubLayout user={currentStudent || currentClubLeader} userRole="leader">
      <div className="club-public-page">
      <header className="club-public-header">
        <div className="club-public-header-inner">
          <BrandHeader compact title="Record Transaction" subtitle={`${branch.name} · IBARA YA 38, 40`} />
          <div className="club-public-header-actions">
            <button className="club-btn-secondary" type="button" onClick={() => navigate(`/club/branches/${branch.id}/treasury`)}>
              ← Treasury
            </button>
          </div>
        </div>
      </header>

      <main className="club-public-main">
        <div className="club-branch-grid-2">
          <section className="card">
            <div className="card-header">
              <h2 className="card-title">Transaction details</h2>
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
                <label className="club-form-label">Type *</label>
                <div className="club-asset-list" style={{ flexDirection: 'row' }}>
                  <label className="club-threshold-pill" style={{ flex: 1, textAlign: 'center', borderColor: type === 'income' ? '#22c55e' : undefined, background: type === 'income' ? '#22c55e' : undefined, color: type === 'income' ? '#fff' : undefined }}>
                    <input type="radio" name="t" value="income" checked={type === 'income'} onChange={() => { setType('income'); setCategory(''); }} style={{ marginRight: 6 }} />
                    Income
                  </label>
                  <label className="club-threshold-pill" style={{ flex: 1, textAlign: 'center', borderColor: type === 'expense' ? '#ef4444' : undefined, background: type === 'expense' ? '#ef4444' : undefined, color: type === 'expense' ? '#fff' : undefined }}>
                    <input type="radio" name="t" value="expense" checked={type === 'expense'} onChange={() => { setType('expense'); setCategory(''); }} style={{ marginRight: 6 }} />
                    Expense
                  </label>
                </div>
              </div>

              <div className="club-form-group">
                <label className="club-form-label">Category *</label>
                <select className="club-form-input" value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="">— Select a category —</option>
                  {cats.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.icon} {c.label} — {c.description}
                    </option>
                  ))}
                </select>
              </div>

              <div className="club-form-row-2">
                <div className="club-form-group">
                  <label className="club-form-label">Amount ({'TZS'}) *</label>
                  <input
                    type="number"
                    className="club-form-input"
                    min="1"
                    placeholder="e.g. 50000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
                <div className="club-form-group">
                  <label className="club-form-label">Date *</label>
                  <input
                    type="date"
                    className="club-form-input"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="club-form-group">
                <label className="club-form-label">Wallet</label>
                <select className="club-form-input" value={walletId} onChange={(e) => setWalletId(e.target.value)} disabled={wallets.length === 0}>
                  {wallets.length === 0 ? (
                    <option value="">No wallet — record anyway</option>
                  ) : null}
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.accountName} — {w.provider} · {w.accountNumber}
                    </option>
                  ))}
                </select>
              </div>

              <div className="club-form-group">
                <label className="club-form-label">Description *</label>
                <textarea
                  className="club-form-textarea"
                  rows={3}
                  placeholder="What is this transaction for? Include receipt details if available."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {type === 'expense' ? (
                <div className="club-asset-list">
                  <label className="club-asset-row">
                    <input
                      type="checkbox"
                      checked={isReimbursement}
                      onChange={(e) => setIsReimbursement(e.target.checked)}
                    />
                    <span>This is a reimbursement (member paid first, club pays back)</span>
                  </label>
                </div>
              ) : null}

              {isMajor ? (
                <div
                  className="club-error-box"
                  style={{ background: '#fff8f1', borderColor: '#fed7aa', color: '#9a3412' }}
                >
                  ⚠️ This amount exceeds the major-expense threshold ({formatCurrency(majorExpenseThreshold)}).
                  It will be saved as <strong>pending</strong> and require Executive Committee approval before it counts against the budget.
                </div>
              ) : null}

              <button type="submit" className="club-btn-primary" style={{ marginTop: 12 }}>
                Record transaction
              </button>
            </form>
          </section>

          {/* Reference */}
          <section className="card">
            <div className="card-header">
              <h2 className="card-title">Reference</h2>
              <span className="card-link">IBARA YA 38, 40</span>
            </div>
            <h3 style={{ fontSize: 14, margin: '0 0 8px' }}>Income sources</h3>
            <ul className="club-duty-list" style={{ marginBottom: 14 }}>
              {incomeCategories.map((c) => (
                <li key={c.id}>
                  <strong>{c.label}:</strong> {c.description}
                </li>
              ))}
            </ul>
            <h3 style={{ fontSize: 14, margin: '14px 0 8px' }}>Permitted expenses</h3>
            <ul className="club-duty-list">
              {expenseCategories.map((c) => (
                <li key={c.id}>
                  <strong>{c.label}:</strong> {c.description}
                </li>
              ))}
            </ul>
            <p className="club-footnote" style={{ marginTop: 14 }}>
              IBARA YA 40 — Funds must NOT be used for personal benefit, except
              for legitimate reimbursements with verified receipts.
            </p>
          </section>
        </div>
      </main>
    </div>
    </ClubLayout>
  );
}