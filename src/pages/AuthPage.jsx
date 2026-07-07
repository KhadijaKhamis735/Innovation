import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { UNIVERSITIES, MEMBER_CATEGORIES } from "../club/context/clubSeed";
import "./AuthPage.css";

const ROLE_OPTIONS = [
  { value: "innovator", label: "Innovator" },
  { value: "funder", label: "Funder (Organization)" },
  { value: "club_member", label: "Club Member" },
  { value: "club_leader", label: "Club Leader" },
  { value: "admin", label: "Admin" },
];

function splitName(fullName) {
  const parts = (fullName || "").trim().split(/\s+/).filter(Boolean);
  return { firstName: parts[0] || "", lastName: parts.slice(1).join(" ") || "" };
}

function PasswordField({ value, onChange, placeholder, autoComplete }) {
  const [show, setShow] = useState(false);
  return (
    <div className="auth-input-wrap">
      <input
        type={show ? "text" : "password"}
        placeholder={placeholder}
        className="auth-input"
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
      />
      <button
        type="button"
        className="auth-input-eye"
        onClick={() => setShow(!show)}
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
}

function LoginTab({ onSwitchTab }) {
  const { login, getDashboardPath } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError("Please fill in all fields.");
      return;
    }
    setError("");
    setLoading(true);
    setTimeout(() => {
      const result = login(form.email, form.password) || {};
      if (!result.ok) {
        setError(result.message || "Invalid email or password.");
        setLoading(false);
        return;
      }
      setLoading(false);
      // For club roles, do a hard navigation so ClubProvider mounts fresh
      // and reads the just-written `club:session`. SPA navigation (navigate)
      // is fine for innovator / funder / admin.
      if (result.user?.role === "club_member" || result.user?.role === "club_leader") {
        window.location.href = result.dashboardPath;
      } else {
        navigate(result.dashboardPath, { replace: true });
      }
    }, 400);
  };

  return (
    <form onSubmit={handleSubmit} className="auth-tab-form">
      {error && <div className="auth-error">{error}</div>}

      <div className="auth-field">
        <label className="auth-label">Email address</label>
        <input
          type="email"
          placeholder="mariam.suza@zsa.zm"
          className="auth-input"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          autoComplete="email"
        />
      </div>

      <div className="auth-field">
        <div className="auth-label-row">
          <label className="auth-label">Password</label>
          <button
            type="button"
            className="auth-link"
            onClick={() => onSwitchTab("forgot")}
          >
            Forgot password?
          </button>
        </div>
        <PasswordField
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          placeholder="Enter your password"
          autoComplete="current-password"
        />
      </div>

      <button type="submit" className="auth-submit" disabled={loading}>
        {loading ? "Signing in..." : "Sign In"}
      </button>

      <details className="auth-demo">
        <summary>Show demo credentials</summary>
        <table>
          <thead>
            <tr><th>Role</th><th>Email</th><th>Password</th></tr>
          </thead>
          <tbody>
            <tr><td>Innovator</td><td>innovator@innovationhub.com</td><td>innovator123</td></tr>
            <tr><td>Funder</td><td>funder@innovationhub.com</td><td>funder123</td></tr>
            <tr><td>Club Member</td><td>member@innovationhub.com</td><td>member123</td></tr>
            <tr><td>Club Leader</td><td>leader@innovationhub.com</td><td>leader123</td></tr>
            <tr><td>Admin</td><td>admin@innovationhub.com</td><td>admin123 (admin login)</td></tr>
          </tbody>
        </table>
      </details>

      <p className="auth-foot">
        New here?{" "}
        <button type="button" className="auth-link" onClick={() => onSwitchTab("register")}>
          Create an account
        </button>
      </p>

      <div className="auth-divider"><span>or</span></div>

      <p className="auth-foot auth-foot-muted">
        <button type="button" className="auth-link" onClick={() => onSwitchTab("forgot")}>
          Recover your password
        </button>
        {" "}using your email and account info
      </p>

      <p className="auth-admin-foot">
        <Link to="/admin/login" className="auth-link">Admin portal sign in →</Link>
      </p>
    </form>
  );
}

function RegisterTab({ onSwitchTab }) {
  const { register, getDashboardPath } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const defaultRole = location.state?.defaultRole || "innovator";
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    role: defaultRole,
    password: "",
    confirm: "",
    // Club-member-only fields (IBARA YA 11)
    universityId: "",
    memberCategory: "student",
    regNumber: "",
    staffId: "",
    graduationYear: "",
    organizationName: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isClubMember = form.role === "club_member";
  const isClubLeader = form.role === "club_leader";
  const isStudent = isClubMember && form.memberCategory === "student";
  const isStaff = isClubMember && form.memberCategory === "staff";
  const isAlumni = isClubMember && form.memberCategory === "alumni";
  const isCorporate = isClubMember && form.memberCategory === "corporate";

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.fullName.trim() || !form.email.trim() || !form.password) {
      setError("Please fill all required fields.");
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (form.password !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    // IBARA YA 11 / IBARA YA 20 — both club members and club leaders must
    // pick the university they belong to / will lead.
    if ((isClubMember || isClubLeader) && !form.universityId) {
      setError(isClubLeader
        ? "Please select which university you will lead."
        : "Please select your university so your Club Leader can verify you.");
      return;
    }
    if (isStudent && !form.regNumber.trim()) {
      setError("Registration number is required for student members — your Club Leader will verify it.");
      return;
    }
    if (isStaff && !form.staffId.trim()) {
      setError("Staff ID is required for university staff members.");
      return;
    }
    if (isAlumni && !form.graduationYear.trim()) {
      setError("Graduation year is required for alumni members.");
      return;
    }
    if (isCorporate && !form.organizationName.trim()) {
      setError("Organization name is required for corporate / NGO partners.");
      return;
    }
    setError("");

    if (form.role === "admin") {
      navigate("/admin/login");
      return;
    }

    const { firstName, lastName } = splitName(form.fullName);

    setLoading(true);
    setTimeout(() => {
      const result = register({
        email: form.email.trim().toLowerCase(),
        password: form.password,
        role: form.role,
        firstName,
        lastName,
        sector: "",
        // Pass-through club fields (ignored by other roles).
        universityId: (isClubMember || isClubLeader) ? form.universityId : "",
        memberCategory: isClubMember ? form.memberCategory : "",
        regNumber: isStudent ? form.regNumber.trim() : null,
        staffId: isStaff ? form.staffId.trim() : null,
        graduationYear: isAlumni ? form.graduationYear.trim() : null,
        organizationName: isCorporate ? form.organizationName.trim() : null,
      });

      if (!result.ok) {
        setError(result.message);
        setLoading(false);
        return;
      }

      if (result.user?.role === "club_member" || result.user?.role === "club_leader") {
        window.location.href = result.dashboardPath;
      } else {
        navigate(result.dashboardPath, { replace: true });
      }
    }, 400);
  };

  return (
    <form onSubmit={handleSubmit} className="auth-tab-form">
      {error && <div className="auth-error">{error}</div>}

      {form.role === "funder" && (
        <div className="auth-notice">
          <strong>Note:</strong> Funder accounts require admin approval before you can post funding opportunities.
        </div>
      )}
      {form.role === "admin" && (
        <div className="auth-notice">
          <strong>Note:</strong> Admin accounts can only be created by a super-user. You'll be redirected to the admin portal.
        </div>
      )}
      {isClubMember && (
        <div className="auth-notice">
          <strong>Verification:</strong> Your university Club Leader (Mlezi) will verify your registration number before you can post projects. Until then, your account is pending.
        </div>
      )}
      {isClubLeader && (
        <div className="auth-notice">
          <strong>Note:</strong> Pick the university branch you'll lead. Once registered, you'll be responsible for verifying student-registration numbers from that branch.
        </div>
      )}

      {/* ----- Full Name ----- */}
      <div className="auth-field">
        <label className="auth-label">Full Name *</label>
        <input
          type="text"
          placeholder="e.g. Mariam Hassan"
          className="auth-input"
          value={form.fullName}
          onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          autoComplete="name"
        />
      </div>

      {/* ----- Email ----- */}
      <div className="auth-field">
        <label className="auth-label">Email *</label>
        <input
          type="email"
          placeholder="you@example.com"
          className="auth-input"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          autoComplete="email"
        />
      </div>

      {/* ----- Role ----- */}
      <div className="auth-field">
        <label className="auth-label">Role *</label>
        <div className="auth-select-wrap">
          <select
            className="auth-input auth-select"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          >
            {ROLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <svg className="auth-select-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>

      {/* ----- University picker (club members AND club leaders) ----- */}
      {(isClubMember || isClubLeader) && (
        <div className="auth-field">
          <label className="auth-label">{isClubLeader ? "University you will lead *" : "University *"}</label>
          <div className="auth-select-wrap">
            <select
              className="auth-input auth-select"
              value={form.universityId}
              onChange={(e) => setForm({ ...form, universityId: e.target.value })}
            >
              <option value="">{isClubLeader ? "Select the university to lead…" : "Select your university…"}</option>
              {UNIVERSITIES.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
            <svg className="auth-select-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>
      )}

      {/* ----- Club-member-only fields (IBARA YA 11) ----- */}
      {isClubMember && (
        <>
          <div className="auth-field">
            <label className="auth-label">Membership category *</label>
            <div className="auth-select-wrap">
              <select
                className="auth-input auth-select"
                value={form.memberCategory}
                onChange={(e) => setForm({ ...form, memberCategory: e.target.value })}
              >
                {MEMBER_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
              <svg className="auth-select-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </div>

          {isStudent && (
            <div className="auth-field">
              <label className="auth-label">Registration Number *</label>
              <input
                type="text"
                placeholder="e.g. SUZA/2024/001"
                className="auth-input"
                value={form.regNumber}
                onChange={(e) => setForm({ ...form, regNumber: e.target.value })}
              />
            </div>
          )}

          {isStaff && (
            <div className="auth-field">
              <label className="auth-label">Staff ID *</label>
              <input
                type="text"
                placeholder="e.g. SUZA-STAFF-042"
                className="auth-input"
                value={form.staffId}
                onChange={(e) => setForm({ ...form, staffId: e.target.value })}
              />
            </div>
          )}

          {isAlumni && (
            <div className="auth-field">
              <label className="auth-label">Graduation Year *</label>
              <input
                type="text"
                placeholder="e.g. 2019"
                className="auth-input"
                value={form.graduationYear}
                onChange={(e) => setForm({ ...form, graduationYear: e.target.value })}
              />
            </div>
          )}

          {isCorporate && (
            <div className="auth-field">
              <label className="auth-label">Organization Name *</label>
              <input
                type="text"
                placeholder="e.g. Vodacom Tanzania"
                className="auth-input"
                value={form.organizationName}
                onChange={(e) => setForm({ ...form, organizationName: e.target.value })}
              />
            </div>
          )}
        </>
      )}

      {/* ----- Password + Confirm ----- */}
      <div className="auth-row-2">
        <div className="auth-field">
          <label className="auth-label">Password *</label>
          <PasswordField
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="Create password"
            autoComplete="new-password"
          />
        </div>
        <div className="auth-field">
          <label className="auth-label">Confirm *</label>
          <PasswordField
            value={form.confirm}
            onChange={(e) => setForm({ ...form, confirm: e.target.value })}
            placeholder="Confirm password"
            autoComplete="new-password"
          />
        </div>
      </div>

      <button type="submit" className="auth-submit" disabled={loading}>
        {loading ? (
          <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 1s linear infinite" }}>
              <circle cx="12" cy="12" r="10" strokeOpacity="0.3" />
              <path d="M12 2a10 10 0 0 1 10 10" />
            </svg>
            Creating account...
          </span>
        ) : (
          "Create Account"
        )}
      </button>

      <p className="auth-foot">
        Already have an account?{" "}
        <button type="button" className="auth-link" onClick={() => onSwitchTab("login")}>
          Login Here
        </button>
      </p>
    </form>
  );
}
function ForgotTab({ onSwitchTab }) {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const handleSendCode = (e) => {
    e.preventDefault();
    setError("");
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    setInfo(`A 6-digit recovery code has been sent to ${email}. (Demo code: 482917)`);
    setStep(2);
  };

  const handleVerify = (e) => {
    e.preventDefault();
    setError("");
    if (code !== "482917") {
      setError("Invalid code. Use the demo code 482917.");
      return;
    }
    setStep(3);
  };

  const handleReset = (e) => {
    e.preventDefault();
    setError("");
    if (newPwd.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (newPwd !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setInfo("Password reset successfully. You can now sign in.");
    setStep(4);
  };

  return (
    <div className="auth-tab-form">
      {error && <div className="auth-error">{error}</div>}
      {info && <div className="auth-info">{info}</div>}

      <ol className="auth-steps">
        <li className={step >= 1 ? "active" : ""}>1. Email</li>
        <li className={step >= 2 ? "active" : ""}>2. Verify</li>
        <li className={step >= 3 ? "active" : ""}>3. Reset</li>
      </ol>

      {step === 1 && (
        <form onSubmit={handleSendCode}>
          <p className="auth-tab-help">
            Use your registered email and we'll send a recovery code to reset your password.
          </p>
          <div className="auth-field">
            <label className="auth-label">Email address</label>
            <input
              type="email"
              placeholder="mariam.suza@zsa.zm"
              className="auth-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
          <button type="submit" className="auth-submit">Send Recovery Code</button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleVerify}>
          <p className="auth-tab-help">
            Enter the 6-digit code we sent to <strong>{email}</strong>. (Use <strong>482917</strong> for the demo.)
          </p>
          <div className="auth-field">
            <label className="auth-label">Verification code</label>
            <input
              type="text"
              placeholder="6-digit code"
              className="auth-input"
              value={code}
              maxLength={6}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>
          <button type="submit" className="auth-submit">Verify Code</button>
          <button
            type="button"
            className="auth-submit auth-submit-ghost"
            onClick={() => setStep(1)}
          >
            Use a different email
          </button>
        </form>
      )}

      {step === 3 && (
        <form onSubmit={handleReset}>
          <p className="auth-tab-help">
            Choose a new password for your account.
          </p>
          <div className="auth-field">
            <label className="auth-label">New password</label>
            <PasswordField
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
              placeholder="New password"
              autoComplete="new-password"
            />
          </div>
          <div className="auth-field">
            <label className="auth-label">Confirm new password</label>
            <PasswordField
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Confirm new password"
              autoComplete="new-password"
            />
          </div>
          <button type="submit" className="auth-submit">Reset Password</button>
        </form>
      )}

      {step === 4 && (
        <div className="auth-success">
          <div className="auth-success-icon">
            <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <h3>Password reset</h3>
          <p>Your password has been updated. You can now sign in.</p>
          <button
            type="button"
            className="auth-submit"
            onClick={() => onSwitchTab("login")}
          >
            Back to Sign In
          </button>
        </div>
      )}

      <p className="auth-foot auth-foot-muted">
        Remembered your password?{" "}
        <button type="button" className="auth-link" onClick={() => onSwitchTab("login")}>
          Login
        </button>
      </p>
    </div>
  );
}

const TABS = [
  { key: "login", label: "Sign In" },
  { key: "register", label: "Register" },
  { key: "forgot", label: "Forgot" },
];

export default function AuthPage({ initialTab = "login" }) {
  const [tab, setTab] = useState(initialTab);

  return (
    <div className="suza-auth">
      <div className="suza-auth-bg" />
      <Link to="/" className="suza-auth-home-btn" aria-label="Back to home">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        <span>Home</span>
      </Link>
      <div className="suza-auth-card">
        <aside className="suza-auth-left">
          <Link to="/" className="suza-auth-brand">
            <div className="suza-auth-brand-mark">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </div>
            <div>
              <div className="suza-auth-brand-name">Innovation Management</div>
              <div className="suza-auth-brand-sub">Innovation & Impact Portal</div>
            </div>
          </Link>

          <h2 className="suza-auth-left-title">One login for the whole ecosystem</h2>
          <p className="suza-auth-left-sub">
            Sign in with your email and password — we'll route you to the right dashboard based on your role
            (Innovator, Funder, Admin, Club Member, or Club Leader).
          </p>

          <ul className="suza-auth-perks">
            <li className="suza-auth-perk">
              <span className="suza-auth-perk-dot" />
              One login for all 5 user types
            </li>
            <li className="suza-auth-perk">
              <span className="suza-auth-perk-dot" />
              Innovators, funders & admins use the same form
            </li>
            <li className="suza-auth-perk">
              <span className="suza-auth-perk-dot" />
              Club members & club leaders sign in here too
            </li>
          </ul>

          <div className="suza-auth-left-foot">
            <span className="suza-auth-foot-dot" /> Secure innovation access portal
            <span style={{ marginLeft: "auto" }}>© 2026 Innovation Hub</span>
          </div>
        </aside>

        <section className="suza-auth-right">
          <div className="suza-auth-eyebrow">Access your dashboard</div>
          <h1 className="suza-auth-title">
            {tab === "login" && "Sign in"}
            {tab === "register" && "Register Your Account"}
            {tab === "forgot" && "Recover your password"}
          </h1>
          <p className="suza-auth-sub">
            {tab === "login" && "Enter your email and password — we'll take you to the right place."}
            {tab === "register" && "Please enter your personal details to create your account."}
            {tab === "forgot" && "Use your email and account info to recover your forgotten password."}
          </p>

          <div className="suza-auth-tabs" role="tablist">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={tab === t.key}
                className={`suza-auth-tab ${tab === t.key ? "active" : ""}`}
                onClick={() => setTab(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="suza-auth-panel">
            {tab === "login" && <LoginTab onSwitchTab={setTab} />}
            {tab === "register" && <RegisterTab onSwitchTab={setTab} />}
            {tab === "forgot" && <ForgotTab onSwitchTab={setTab} />}
          </div>
        </section>
      </div>
    </div>
  );
}
