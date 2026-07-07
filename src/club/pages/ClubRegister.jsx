import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import BrandHeader from '../components/BrandHeader';
import FormSection from '../components/FormSection';
import UniversityPicker from '../components/UniversityPicker';
import { useClub } from '../context/ClubContext';
import './ClubAuth.css';

export default function ClubRegister() {
  const navigate = useNavigate();
  const { registerStudent, memberCategories } = useClub();

  // IBARA YA 11 — pick one of the 4 member categories
  const [category, setCategory] = useState('student');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [universityId, setUniversityId] = useState(null);

  // Category-specific fields (IBARA YA 12)
  const [regNumber, setRegNumber] = useState('');
  const [staffId, setStaffId] = useState('');
  const [graduationYear, setGraduationYear] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [organizationRole, setOrganizationRole] = useState('');
  const [bio, setBio] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const resetCategoryFields = (nextCategory) => {
    setRegNumber('');
    setStaffId('');
    setGraduationYear('');
    setOrganizationName('');
    setOrganizationRole('');
    setBio('');
  };

  const handleCategoryChange = (next) => {
    setCategory(next);
    resetCategoryFields(next);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim() || !email.trim() || !password || !universityId) {
      setError('Please fill all required fields and choose your university.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    // Category-specific required-field validation
    if (category === 'student' && !regNumber.trim()) {
      setError('Registration number is required for student membership.');
      return;
    }
    if (category === 'staff' && !staffId.trim()) {
      setError('Staff ID is required for university staff.');
      return;
    }
    if (category === 'alumni' && !graduationYear.trim()) {
      setError('Graduation year is required for alumni.');
      return;
    }
    if (category === 'corporate' && !organizationName.trim()) {
      setError('Organization name is required for corporate partners.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const result = registerStudent({
        fullName,
        email,
        password,
        universityId,
        category,
        regNumber,
        staffId,
        graduationYear,
        organizationName,
        organizationRole,
        bio,
      });
      setLoading(false);
      if (!result.ok) {
        setError(result.error || 'Could not register.');
        return;
      }
      navigate('/club/pending', { replace: true });
    }, 500);
  };

  return (
    <div className="club-auth-page">
      <aside className="club-auth-left">
        <span className="club-auth-blob club-auth-blob-1" />
        <span className="club-auth-blob club-auth-blob-2" />
        <span className="club-auth-blob club-auth-blob-3" />
        <div className="club-auth-brand">
          <div className="club-auth-brand-logo">⚡</div>
          <span className="club-auth-brand-name">Club Hub</span>
        </div>
        <h1 className="club-auth-left-title">
          Join your university's innovation club.
        </h1>
        <p className="club-auth-left-sub">
          Register with your university and choose your membership category.
          Once your Club Leader verifies you, you'll be able to participate in
          programs, projects, and innovation activities under the Startup
          Innovation Club constitution.
        </p>
        <ul className="club-auth-perks">
          <li>✅ Verified by your university's Club Leader (Mlezi)</li>
          <li>🎓 One of 4 approved Zanzibar universities</li>
          <li>👥 4 membership categories: students, staff, alumni, partners</li>
          <li>🚀 Your projects visible on the Innovation Hub</li>
        </ul>
      </aside>

      <div className="club-auth-right">
        <Link to="/club" className="club-auth-back-link">← Back to Club Hub</Link>
        <div className="club-auth-form-wrap">
          <div style={{ width: '100%', maxWidth: 520 }}>
            <BrandHeader
              title="Club Member Registration"
              subtitle="Create your account to join your university's club"
              compact
            />
            <FormSection
              heading="Create account"
              subheading="IBARA YA 11 — choose the membership category that fits your role."
              notice={<>Your account is held in a pending state until your university's Club Leader confirms your details. Full access unlocks after verification (IBARA YA 13).</>}
            >
              <form onSubmit={handleSubmit}>
                {error ? <div className="club-error-box">{error}</div> : null}

                {/* IBARA YA 11 — Membership category */}
                <div className="club-form-group">
                  <label className="club-form-label">Membership Category *</label>
                  <span className="club-form-sublabel">Choose the category that matches your relationship with the university.</span>
                  <div className="club-category-grid">
                    {memberCategories.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        className={`club-category-card ${category === c.id ? 'is-selected' : ''}`}
                        onClick={() => handleCategoryChange(c.id)}
                      >
                        <span className="club-category-icon">{c.icon}</span>
                        <span className="club-category-label">{c.label}</span>
                        <span className="club-category-desc">{c.description}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="club-form-group">
                  <label className="club-form-label">Full Name *</label>
                  <input
                    className="club-form-input"
                    type="text"
                    placeholder="e.g. Mariam Hassan"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    autoComplete="name"
                  />
                </div>

                <div className="club-form-group">
                  <label className="club-form-label">Email address *</label>
                  <input
                    className="club-form-input"
                    type="email"
                    placeholder="you@university.zm"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>

                <div className="club-form-row-2">
                  <div className="club-form-group">
                    <label className="club-form-label">Password *</label>
                    <div className="club-password-wrap">
                      <input
                        className="club-form-input"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="At least 6 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="new-password"
                      />
                      <button type="button" className="club-eye-btn" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? '🙈' : '👁️'}
                      </button>
                    </div>
                  </div>
                  <div className="club-form-group">
                    <label className="club-form-label">Confirm *</label>
                    <input
                      className="club-form-input"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Repeat password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      autoComplete="new-password"
                    />
                  </div>
                </div>

                <div className="club-form-group">
                  <label className="club-form-label">University *</label>
                  <span className="club-form-sublabel">Choose one of the 4 approved Zanzibar universities.</span>
                  <UniversityPicker value={universityId} onChange={(u) => setUniversityId(u.id)} />
                </div>

                {/* IBARA YA 12 — category-specific fields */}
                {category === 'student' ? (
                  <div className="club-form-group">
                    <label className="club-form-label">Student Registration Number *</label>
                    <span className="club-form-sublabel">Your university uses this to confirm you belong there (IBARA YA 12).</span>
                    <input
                      className="club-form-input"
                      type="text"
                      placeholder="e.g. SUZA/2024/001"
                      value={regNumber}
                      onChange={(e) => setRegNumber(e.target.value.toUpperCase())}
                      autoCapitalize="characters"
                      autoCorrect="off"
                      spellCheck={false}
                    />
                  </div>
                ) : null}

                {category === 'staff' ? (
                  <>
                    <div className="club-form-group">
                      <label className="club-form-label">Staff ID *</label>
                      <span className="club-form-sublabel">Issued by your university HR / faculty office.</span>
                      <input
                        className="club-form-input"
                        type="text"
                        placeholder="e.g. SUZA-STAFF-0142"
                        value={staffId}
                        onChange={(e) => setStaffId(e.target.value.toUpperCase())}
                      />
                    </div>
                    <div className="club-form-group">
                      <label className="club-form-label">Brief bio (optional)</label>
                      <textarea
                        className="club-form-textarea"
                        rows={3}
                        placeholder="e.g. Faculty of Computer Science — mentorship & research."
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                      />
                    </div>
                  </>
                ) : null}

                {category === 'alumni' ? (
                  <>
                    <div className="club-form-group">
                      <label className="club-form-label">Graduation Year *</label>
                      <span className="club-form-sublabel">Year you completed your studies at this university.</span>
                      <input
                        className="club-form-input"
                        type="number"
                        min="1990"
                        max="2099"
                        placeholder="e.g. 2023"
                        value={graduationYear}
                        onChange={(e) => setGraduationYear(e.target.value)}
                      />
                    </div>
                    <div className="club-form-group">
                      <label className="club-form-label">Brief bio (optional)</label>
                      <textarea
                        className="club-form-textarea"
                        rows={3}
                        placeholder="What you do now and how you'd like to support the club."
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                      />
                    </div>
                  </>
                ) : null}

                {category === 'corporate' ? (
                  <>
                    <div className="club-form-group">
                      <label className="club-form-label">Organization Name *</label>
                      <span className="club-form-sublabel">The company / NGO / incubator you represent.</span>
                      <input
                        className="club-form-input"
                        type="text"
                        placeholder="e.g. BlueWave Innovations Ltd"
                        value={organizationName}
                        onChange={(e) => setOrganizationName(e.target.value)}
                      />
                    </div>
                    <div className="club-form-group">
                      <label className="club-form-label">Your Role (optional)</label>
                      <input
                        className="club-form-input"
                        type="text"
                        placeholder="e.g. Programs Director"
                        value={organizationRole}
                        onChange={(e) => setOrganizationRole(e.target.value)}
                      />
                    </div>
                    <div className="club-form-group">
                      <label className="club-form-label">How you'd like to support (optional)</label>
                      <textarea
                        className="club-form-textarea"
                        rows={3}
                        placeholder="e.g. mentorship, incubation slots, funding, technical support."
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                      />
                    </div>
                  </>
                ) : null}

                <button type="submit" className="club-btn-primary" disabled={loading}>
                  {loading ? (
                    <span className="club-loading">
                      <span className="club-spinner" />
                      <span>Creating account…</span>
                    </span>
                  ) : (
                    <span>Register as {memberCategories.find((c) => c.id === category)?.label}</span>
                  )}
                </button>

                <p className="club-switch-text">
                  Already have an account?{' '}
                  <Link to="/club/login" state={{ role: 'student' }} className="club-switch-link">
                    Sign in
                  </Link>
                </p>
              </form>
            </FormSection>
          </div>
        </div>
      </div>
    </div>
  );
}