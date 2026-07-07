import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BrandHeader from '../components/BrandHeader';
import ClubLayout from "../components/ClubLayout";
import { useClub } from '../context/ClubContext';
import '../styles/ClubShared.css';

// IBARA YA 38 — Member Dues

const formatCurrency = (amount, currency = 'TZS') =>
  new Intl.NumberFormat('en-TZ', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);

const STATUS_OPTIONS = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'paid', label: 'Paid' },
  { id: 'overdue', label: 'Overdue' },
];

export default function ClubDuesCollection() {
  const { branchId } = useParams();
  const navigate = useNavigate();
  const {
    branchById,
    universities,
    membersForBranch,
    duesForBranch,
    createDuesAssessment,
    markDuePaid,
    students,
    currentClubLeader,
  } = useClub();

  const branch = branchById(branchId);
  const uni = universities.find((u) => u.id === branch?.universityId);
  const branchMembers = branch ? membersForBranch(branch.id, null, 'active') : [];
  const existingDues = branch ? duesForBranch(branch.id) : [];

  const [showAdd, setShowAdd] = useState(false);
  const [memberId, setMemberId] = useState('');
  const [amount, setAmount] = useState('5000');
  const [dueDate, setDueDate] = useState('');
  const [note, setNote] = useState('');
  const [filter, setFilter] = useState('all');
  const [feedback, setFeedback] = useState('');

  const today = new Date().toISOString().slice(0, 10);

  // Decorate existing dues with overdue flag
  const enriched = useMemo(() => {
    return existingDues.map((d) => {
      let computedStatus = d.status;
      if (d.status === 'pending' && d.dueDate && d.dueDate.slice(0, 10) < today) {
        computedStatus = 'overdue';
      }
      return { ...d, computedStatus };
    });
  }, [existingDues, today]);

  const visible = enriched.filter((d) => filter === 'all' || d.computedStatus === filter);

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

  const summary = {
    total: enriched.length,
    paid: enriched.filter((d) => d.status === 'paid').length,
    pending: enriched.filter((d) => d.computedStatus === 'pending').length,
    overdue: enriched.filter((d) => d.computedStatus === 'overdue').length,
    collected: enriched
      .filter((d) => d.status === 'paid')
      .reduce((s, d) => s + (d.amount || 0), 0),
  };

  const handleAdd = (e) => {
    e.preventDefault();
    if (!memberId) {
      setFeedback('Please choose a member.');
      return;
    }
    const result = createDuesAssessment({
      branchId: branch.id,
      memberId,
      amount,
      dueDate: dueDate || null,
      note,
    });
    if (!result.ok) {
      setFeedback(result.error || 'Could not record dues.');
      return;
    }
    setShowAdd(false);
    setMemberId('');
    setAmount('5000');
    setDueDate('');
    setNote('');
    setFeedback('Dues recorded ✓');
  };

  return (
    <ClubLayout user={currentClubLeader} userRole="leader">
      <div className="club-public-page">
      <header className="club-public-header">
        <div className="club-public-header-inner">
          <BrandHeader compact title="Member Dues" subtitle={`${branch.name} · IBARA YA 38`} />
          <div className="club-public-header-actions">
            <button className="club-btn-secondary" type="button" onClick={() => navigate(`/club/branches/${branch.id}/treasury`)}>
              ← Treasury
            </button>
            <button
              className="club-btn-primary"
              style={{ width: 'auto', padding: '12px 22px' }}
              onClick={() => setShowAdd((s) => !s)}
            >
              {showAdd ? 'Close' : '+ Assess dues'}
            </button>
          </div>
        </div>
      </header>

      <main className="club-public-main">
        {feedback ? (
          <div
            className="club-error-box"
            style={{ background: '#dcfce7', borderColor: '#bbf7d0', color: '#15803d' }}
          >
            {feedback}
          </div>
        ) : null}

        <section className="treasury-balance-hero" style={{ marginBottom: 20 }}>
          <div>
            <p className="treasury-balance-label">Collected this term</p>
            <h1 className="treasury-balance-amount">{formatCurrency(summary.collected)}</h1>
            <p className="treasury-balance-meta">
              {branchMembers.length} active members · {uni?.shortName}
            </p>
          </div>
          <div className="treasury-balance-breakdown" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <div className="treasury-balance-cell">
              <span className="treasury-balance-cell-label">Paid</span>
              <span className="treasury-balance-cell-amount is-income">{summary.paid}</span>
            </div>
            <div className="treasury-balance-cell">
              <span className="treasury-balance-cell-label">Pending</span>
              <span className="treasury-balance-cell-amount" style={{ color: '#b45309' }}>{summary.pending}</span>
            </div>
            <div className="treasury-balance-cell">
              <span className="treasury-balance-cell-label">Overdue</span>
              <span className="treasury-balance-cell-amount is-expense">{summary.overdue}</span>
            </div>
          </div>
        </section>

        {showAdd ? (
          <section className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <h2 className="card-title">Assess new dues</h2>
            </div>
            <form onSubmit={handleAdd}>
              <div className="club-form-row-2">
                <div className="club-form-group">
                  <label className="club-form-label">Member *</label>
                  <select className="club-form-input" value={memberId} onChange={(e) => setMemberId(e.target.value)}>
                    <option value="">— Select a member —</option>
                    {branchMembers.map((m) => (
                      <option key={m.id} value={m.id}>{m.fullName} — {m.regNumber || m.email}</option>
                    ))}
                  </select>
                </div>
                <div className="club-form-group">
                  <label className="club-form-label">Amount (TZS)</label>
                  <input type="number" className="club-form-input" value={amount} onChange={(e) => setAmount(e.target.value)} />
                </div>
              </div>
              <div className="club-form-row-2">
                <div className="club-form-group">
                  <label className="club-form-label">Due date</label>
                  <input type="date" className="club-form-input" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                </div>
                <div className="club-form-group">
                  <label className="club-form-label">Note (optional)</label>
                  <input type="text" className="club-form-input" value={note} onChange={(e) => setNote(e.target.value)} />
                </div>
              </div>
              <button type="submit" className="club-btn-primary">Save dues</button>
            </form>
          </section>
        ) : null}

        <section className="club-election-filters">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`club-election-filter ${filter === s.id ? 'is-active' : ''}`}
              onClick={() => setFilter(s.id)}
            >
              {s.label} ({s.id === 'all' ? enriched.length : enriched.filter((d) => d.computedStatus === s.id).length})
            </button>
          ))}
        </section>

        <section className="card">
          <div className="card-header">
            <h2 className="card-title">Dues ledger</h2>
            <span className="card-link">{visible.length} shown</span>
          </div>
          {visible.length === 0 ? (
            <p className="club-empty">No dues match this filter.</p>
          ) : (
            <div className="treasury-tx-list">
              {visible.map((d) => {
                const member = students.find((s) => s.id === d.memberId);
                return (
                  <div key={d.id} className="treasury-tx-row">
                    <div className="treasury-tx-icon" style={{ background: '#fff8f1' }}>
                      🪙
                    </div>
                    <div className="treasury-tx-body">
                      <p className="treasury-tx-title">{member?.fullName || d.memberId}</p>
                      <p className="treasury-tx-meta">
                        {d.dueDate ? `Due ${d.dueDate.slice(0, 10)} · ` : ''}
                        {d.note || ''}
                        {d.paidDate ? ` · Paid ${d.paidDate.slice(0, 10)}` : ''}
                      </p>
                    </div>
                    <span className="treasury-tx-amount is-expense">{formatCurrency(d.amount)}</span>
                    <span
                      className="club-badge"
                      style={{
                        background: d.computedStatus === 'paid' ? '#dcfce7' : d.computedStatus === 'overdue' ? '#fee2e2' : '#fef3c7',
                        color: d.computedStatus === 'paid' ? '#15803d' : d.computedStatus === 'overdue' ? '#b91c1c' : '#b45309',
                      }}
                    >
                      {d.computedStatus}
                    </span>
                    {d.status !== 'paid' ? (
                      <button
                        type="button"
                        className="club-btn-secondary club-btn-sm"
                        onClick={() => markDuePaid(d.id)}
                      >
                        Mark paid
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
    </ClubLayout>
  );
}