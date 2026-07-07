import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BrandHeader from '../components/BrandHeader';
import StatusPill from '../components/StatusPill';
import { useClub } from '../context/ClubContext';
import './ClubPending.css';

const formatDate = (iso) => {
  if (!iso) return '';
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

const CATEGORY_LABELS = {
  student: 'Student',
  staff: 'University Staff',
  alumni: 'Alumni',
  corporate: 'Corporate / NGO Partner',
};

export default function ClubPending() {
  const navigate = useNavigate();
  const {
    currentStudent,
    logoutClub,
    findUniversity,
    memberCategories,
    refreshCurrentStudent,
    withdrawMembership,
  } = useClub();

  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawConfirm, setWithdrawConfirm] = useState('');

  useEffect(() => {
    refreshCurrentStudent();
  }, [refreshCurrentStudent]);

  if (!currentStudent) {
    return (
      <div className="club-pending-page">
        <BrandHeader title="Awaiting verification" subtitle="Club Hub" />
        <div className="club-pending-content">
          <p>You are not signed in. Please sign in or register first.</p>
          <button
            className="club-btn-primary"
            onClick={() => navigate('/club/login', { replace: true })}
          >
            Go to sign in
          </button>
        </div>
      </div>
    );
  }

  const university = findUniversity(currentStudent.universityId);
  const isRejected = currentStudent.status === 'rejected';
  const isWithdrawn = currentStudent.status === 'withdrawn';
  const isSuspended = currentStudent.status === 'suspended';
  const catLabel =
    CATEGORY_LABELS[currentStudent.category] ||
    memberCategories.find((c) => c.id === currentStudent.category)?.label ||
    currentStudent.category;

  const handleLogout = () => {
    logoutClub();
    navigate('/club', { replace: true });
  };

  const handleWithdraw = () => {
    if (withdrawConfirm.trim().toUpperCase() !== 'WITHDRAW') {
      return;
    }
    withdrawMembership(currentStudent.id);
    setWithdrawing(false);
    setWithdrawConfirm('');
  };

  // IBARA YA 16 — show a different screen for suspended / withdrawn members
  if (isSuspended) {
    return (
      <div className="club-pending-page">
        <BrandHeader title="Membership Suspended" subtitle={`${currentStudent.fullName}`} />
        <div className="club-pending-content">
          <div className="club-pending-card rejected">
            <div className="club-pending-icon">⛔</div>
            <h1 className="club-pending-title">Your membership is suspended</h1>
            <p className="club-pending-body">
              IBARA YA 16 — Your Club Leader (Mlezi) has suspended your membership.
              You can review the reason and appeal to the General Meeting (Mkutano Mkuu).
            </p>
            {currentStudent.suspensionReason ? (
              <div className="club-pending-reason">
                <p className="club-pending-reason-label">Reason</p>
                <p className="club-pending-reason-text">{currentStudent.suspensionReason}</p>
              </div>
            ) : null}
          </div>
          <div className="club-pending-actions">
            <button className="club-btn-secondary" onClick={handleLogout}>
              Sign out
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isWithdrawn) {
    return (
      <div className="club-pending-page">
        <BrandHeader title="Membership Withdrawn" subtitle={`${currentStudent.fullName}`} />
        <div className="club-pending-content">
          <div className="club-pending-card pending">
            <div className="club-pending-icon">👋</div>
            <h1 className="club-pending-title">You've withdrawn from the club</h1>
            <p className="club-pending-body">
              Your membership was voluntarily withdrawn on{' '}
              {formatDate(currentStudent.withdrawnAt)}. You can re-register any time.
            </p>
          </div>
          <div className="club-pending-actions">
            <button className="club-btn-primary" onClick={() => navigate('/club/register')}>
              Re-register
            </button>
            <button className="club-btn-secondary" onClick={handleLogout}>
              Sign out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="club-pending-page">
      <BrandHeader
        title={isRejected ? 'Verification Rejected' : 'Awaiting Verification'}
        subtitle={`${currentStudent.fullName} · ${university?.shortName || ''}`}
      />
      <div className="club-pending-content">
        <div className={`club-pending-card ${isRejected ? 'rejected' : 'pending'}`}>
          <div className="club-pending-icon">{isRejected ? '⚠️' : '🕒'}</div>
          <h1 className="club-pending-title">
            {isRejected ? 'Verification was rejected' : 'Awaiting verification'}
          </h1>
          <p className="club-pending-body">
            {isRejected
              ? "Your Club Leader could not verify your account. You can review the reason below and re-register with the correct information."
              : `Your account is pending verification by your university's Club Leader (Mlezi). You'll get full access — including the ability to create Club Projects — once your details are verified.`}
          </p>
          <div className="club-pending-meta-row">
            <StatusPill status={currentStudent.status} />
            <span className="club-pending-meta-text">
              {isRejected ? 'Rejected' : 'Pending'} since{' '}
              {formatDate(currentStudent.registeredAt)}
            </span>
          </div>
        </div>

        {isRejected && currentStudent.rejectionReason ? (
          <div className="club-pending-reason">
            <p className="club-pending-reason-label">Reason from Club Leader</p>
            <p className="club-pending-reason-text">{currentStudent.rejectionReason}</p>
          </div>
        ) : null}

        <div className="club-pending-details">
          <h2 className="club-pending-details-title">Your registration</h2>
          <div className="club-pending-detail-row">
            <span className="club-pending-detail-key">Membership category</span>
            <span className="club-pending-detail-val">{catLabel}</span>
          </div>
          <div className="club-pending-detail-row">
            <span className="club-pending-detail-key">Full name</span>
            <span className="club-pending-detail-val">{currentStudent.fullName}</span>
          </div>
          <div className="club-pending-detail-row">
            <span className="club-pending-detail-key">Email</span>
            <span className="club-pending-detail-val">{currentStudent.email}</span>
          </div>
          <div className="club-pending-detail-row">
            <span className="club-pending-detail-key">University</span>
            <span className="club-pending-detail-val">{university?.name || '—'}</span>
          </div>
          {currentStudent.regNumber ? (
            <div className="club-pending-detail-row">
              <span className="club-pending-detail-key">Registration No.</span>
              <span className="club-pending-detail-val">{currentStudent.regNumber}</span>
            </div>
          ) : null}
          {currentStudent.staffId ? (
            <div className="club-pending-detail-row">
              <span className="club-pending-detail-key">Staff ID</span>
              <span className="club-pending-detail-val">{currentStudent.staffId}</span>
            </div>
          ) : null}
          {currentStudent.graduationYear ? (
            <div className="club-pending-detail-row">
              <span className="club-pending-detail-key">Graduation Year</span>
              <span className="club-pending-detail-val">{currentStudent.graduationYear}</span>
            </div>
          ) : null}
          {currentStudent.organizationName ? (
            <div className="club-pending-detail-row">
              <span className="club-pending-detail-key">Organization</span>
              <span className="club-pending-detail-val">
                {currentStudent.organizationName}
                {currentStudent.organizationRole ? ` (${currentStudent.organizationRole})` : ''}
              </span>
            </div>
          ) : null}
        </div>

        {/* IBARA YA 16 — voluntary withdrawal */}
        {!withdrawing ? (
          <div className="club-pending-actions">
            {isRejected ? (
              <button
                className="club-btn-primary"
                onClick={() => navigate('/club/register', { replace: true })}
              >
                Re-register
              </button>
            ) : null}
            <button className="club-btn-secondary" onClick={handleLogout}>
              Sign out
            </button>
            {!isRejected ? (
              <button
                className="club-btn-ghost-danger"
                onClick={() => setWithdrawing(true)}
              >
                Withdraw membership
              </button>
            ) : null}
          </div>
        ) : (
          <div className="club-pending-card rejected" style={{ marginTop: 16 }}>
            <h2 className="club-pending-title" style={{ fontSize: 18 }}>
              Confirm withdrawal
            </h2>
            <p className="club-pending-body">
              IBARA YA 16 — Withdrawing is voluntary. You can re-register later,
              but you'll need to be verified again. Type <strong>WITHDRAW</strong> below
              to confirm.
            </p>
            <input
              type="text"
              className="club-form-input"
              value={withdrawConfirm}
              onChange={(e) => setWithdrawConfirm(e.target.value)}
              placeholder="Type WITHDRAW"
            />
            <div className="club-pending-actions" style={{ marginTop: 14 }}>
              <button
                className="club-btn-primary"
                disabled={withdrawConfirm.trim().toUpperCase() !== 'WITHDRAW'}
                onClick={handleWithdraw}
              >
                Confirm withdrawal
              </button>
              <button
                className="club-btn-secondary"
                onClick={() => {
                  setWithdrawing(false);
                  setWithdrawConfirm('');
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}