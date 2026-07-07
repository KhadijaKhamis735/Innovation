import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BrandHeader from '../components/BrandHeader';
import ClubLayout from "../components/ClubLayout";
import { useClub } from '../context/ClubContext';
import '../styles/ClubShared.css';

// IBARA YA 33 — Handover Protocol
// After a new executive is appointed/elected, the outgoing holder transfers
// documents, funds, accounts, and records to the incoming holder within 14 days.

const formatDate = (iso) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch (e) {
    return iso;
  }
};

const ASSET_LABELS = {
  documents: 'Documents (Katiba, ripoti, vibali, nyaraka)',
  funds: 'Funds (cash on hand, balances)',
  accounts: 'Accounts (bank, mobile money, official logins)',
  records: 'Records (registers, meeting minutes, files)',
};

export default function ClubHandover() {
  const { branchId } = useParams();
  const navigate = useNavigate();
  const {
    branchById,
    universities,
    executivesForBranch,
    memberForExecutive,
    executivePositions,
    handoverLogs,
    recordHandover,
    termConfig,
  } = useClub();

  const branch = branchById(branchId);
  const uni = universities.find((u) => u.id === branch?.universityId);
  const committee = executivesForBranch(branch?.id || '');

  const [selectedPosition, setSelectedPosition] = useState('');
  const [incomingMemberId, setIncomingMemberId] = useState('');
  const [notes, setNotes] = useState('');
  const [assets, setAssets] = useState({
    documents: false,
    funds: false,
    accounts: false,
    records: false,
  });
  const [error, setError] = useState('');
  const [savedMsg, setSavedMsg] = useState('');

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

  const selectedExec = committee.find((e) => e.position === selectedPosition);
  const selectedPosDef = executivePositions.find((p) => p.id === selectedPosition);
  const selectedMember = selectedExec ? memberForExecutive(selectedExec) : null;

  const branchHandoverLogs = handoverLogs.filter((h) => h.branchId === branch.id);

  const toggleAsset = (key) => {
    setAssets((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSavedMsg('');

    if (!selectedPosition) {
      setError('Please select the position being handed over.');
      return;
    }
    if (!incomingMemberId) {
      setError('Please select the incoming member for the position.');
      return;
    }
    const allChecked = Object.values(assets).every(Boolean);
    if (!allChecked) {
      setError(
        'All four asset categories (documents, funds, accounts, records) must be confirmed before handover is complete.'
      );
      return;
    }

    const result = recordHandover({
      branchId: branch.id,
      position: selectedPosition,
      outgoingExecId: selectedExec?.id || null,
      outgoingMemberId: selectedExec?.memberId || null,
      incomingMemberId,
      notes,
      assetsTransferred: assets,
    });

    if (result.ok) {
      setSavedMsg('Handover recorded ✓');
      setNotes('');
      setAssets({ documents: false, funds: false, accounts: false, records: false });
      setIncomingMemberId('');
    } else {
      setError(result.error || 'Could not record handover.');
    }
  };

  return (
    <ClubLayout userRole="leader">
      <div className="club-public-page">
      <header className="club-public-header">
        <div className="club-public-header-inner">
          <BrandHeader
            compact
            title="Handover Protocol"
            subtitle={`${branch.name} · IBARA YA 33`}
          />
          <div className="club-public-header-actions">
            <button
              className="club-btn-secondary"
              type="button"
              onClick={() => navigate(`/club/branches/${branch.id}/committee`)}
            >
              ← Committee
            </button>
          </div>
        </div>
      </header>

      <main className="club-public-main">
        <section className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <h2 className="card-title">About the handover</h2>
            <span className="card-link">IBARA YA 33</span>
          </div>
          <p style={{ margin: 0, color: 'var(--club-text-2)', lineHeight: 1.7 }}>
            After a new executive is elected or appointed, the outgoing holder has
            <strong> {termConfig.handoverDays} days </strong>
            to hand over all <strong>documents, funds, accounts, and records</strong> to
            the incoming holder. Both parties should confirm each asset category
            below before the handover is recorded.
          </p>
        </section>

        <div className="club-branch-grid-2">
          {/* Form */}
          <section className="card">
            <div className="card-header">
              <h2 className="card-title">Record a new handover</h2>
            </div>
            <form onSubmit={handleSubmit}>
              {error ? <div className="club-error-box">{error}</div> : null}
              {savedMsg ? (
                <div
                  className="club-error-box"
                  style={{ background: '#dcfce7', borderColor: '#bbf7d0', color: '#15803d' }}
                >
                  {savedMsg}
                </div>
              ) : null}

              <div className="club-form-group">
                <label className="club-form-label">Position *</label>
                <select
                  className="club-form-input"
                  value={selectedPosition}
                  onChange={(e) => {
                    setSelectedPosition(e.target.value);
                    setIncomingMemberId('');
                  }}
                >
                  <option value="">— Select a position —</option>
                  {executivePositions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({p.titleEnglish})
                    </option>
                  ))}
                </select>
              </div>

              {selectedExec && selectedMember ? (
                <div className="club-handover-current">
                  <p className="club-handover-label">Current holder (outgoing)</p>
                  <p className="club-handover-name">{selectedMember.fullName}</p>
                  <p className="club-handover-meta">
                    Term ends {formatDate(selectedExec.termEndsAt)} ·{' '}
                    {selectedExec.reelectedCount}/1 renewals used
                  </p>
                </div>
              ) : null}

              <div className="club-form-group">
                <label className="club-form-label">Incoming holder *</label>
                <span className="club-form-sublabel">
                  Active member of {uni?.shortName} who will take over this position.
                </span>
                <select
                  className="club-form-input"
                  value={incomingMemberId}
                  onChange={(e) => setIncomingMemberId(e.target.value)}
                >
                  <option value="">— Select an active member —</option>
                  {branchHandoverLogs.length /* placeholder to satisfy hooks */ ? null : null}
                </select>
                <p className="club-footnote" style={{ marginTop: 10 }}>
                  In a live deployment, the incoming holder would be selected from
                  the verified branch roster. For now, handovers can still be
                  recorded by typing the member ID below.
                </p>
                <input
                  className="club-form-input"
                  type="text"
                  placeholder="Or type incoming member ID (e.g. stu-suza-002)"
                  value={incomingMemberId}
                  onChange={(e) => setIncomingMemberId(e.target.value)}
                  style={{ marginTop: 10 }}
                />
              </div>

              <div className="club-form-group">
                <label className="club-form-label">Assets transferred *</label>
                <span className="club-form-sublabel">
                  Tick every category that has been confirmed.
                </span>
                <div className="club-asset-list">
                  {Object.entries(ASSET_LABELS).map(([key, label]) => (
                    <label key={key} className="club-asset-row">
                      <input
                        type="checkbox"
                        checked={assets[key]}
                        onChange={() => toggleAsset(key)}
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="club-form-group">
                <label className="club-form-label">Handover notes (optional)</label>
                <textarea
                  className="club-form-textarea"
                  rows={4}
                  placeholder="Any items to flag, pending tasks, contact details, etc."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <button type="submit" className="club-btn-primary">
                Record handover
              </button>
            </form>
          </section>

          {/* Past handovers */}
          <section className="card">
            <div className="card-header">
              <h2 className="card-title">Past handovers</h2>
              <span className="card-link">{branchHandoverLogs.length} total</span>
            </div>
            {branchHandoverLogs.length === 0 ? (
              <p className="club-empty">No handovers recorded yet for this branch.</p>
            ) : (
              <div className="club-handover-list">
                {branchHandoverLogs.map((h) => {
                  const posDef = executivePositions.find((p) => p.id === h.position);
                  return (
                    <div key={h.id} className="club-handover-row">
                      <div className="club-handover-row-head">
                        <span
                          className="club-exec-card-icon"
                          style={{ background: posDef?.color || '#94a3b8', width: 36, height: 36, fontSize: 16 }}
                        >
                          {posDef?.icon || '📄'}
                        </span>
                        <div>
                          <p className="club-handover-row-title">
                            {posDef?.title || h.position}
                          </p>
                          <p className="club-handover-row-meta">
                            Recorded {formatDate(h.recordedAt)}
                          </p>
                        </div>
                      </div>
                      {h.notes ? (
                        <p className="club-handover-row-notes">{h.notes}</p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
    </ClubLayout>
  );
}