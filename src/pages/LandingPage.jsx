import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import "./LandingPage.css";

const features = [
  {
    icon: "🚀",
    title: "Launch Your Ideas",
    desc: "Create and manage innovation projects with structured tools. Track stages from Idea to MVP."
  },
  {
    icon: "🤝",
    title: "Connect with Funders",
    desc: "Find partners, funding, and mentorship from approved funders."
  },
  {
    icon: "📊",
    title: "Track Your Progress",
    desc: "Monitor applications, projects, and opportunities in a unified dashboard."
  },
  {
    icon: "🎯",
    title: "Smart Matching",
    desc: "Our system helps connect your projects with the right opportunities."
  },
];

const steps = [
  { num: "1", title: "Create Account", desc: "Sign up as Innovator or Funder" },
  { num: "2", title: "Build Profile", desc: "Add your projects or funding needs" },
  { num: "3", title: "Apply / Post", desc: "Submit for funding or post opportunities" },
  { num: "4", title: "Grow Together", desc: "Track funding and achieve goals" },
];

const stats = [
  { value: "1,200+", label: "Innovators" },
  { value: "340+", label: "Funders" },
  { value: "850+", label: "Projects" },
  { value: "96%", label: "Match Rate" },
];

export default function LandingPage() {
  return (
    <div className="landing">
      <Navbar />

      <section className="hero">
        <div className="hero-blob hero-blob-1" />
        <div className="hero-blob hero-blob-2" />
        <div className="hero-blob hero-blob-3" />
        <div className="hero-content">
          <span className="hero-badge">
            <span className="badge-dot"></span>
            Innovation Management System
          </span>
          <h1 className="hero-title">
            Where Ideas Meet <span className="hero-gradient">Opportunity</span>
          </h1>
          <p className="hero-desc">
            The unified platform bridging innovators and funders submit projects, discover funding opportunities, and track every step of your innovation journey.
          </p>
          <div className="hero-buttons">
            <Link to="/register" state={{ defaultRole: "innovator" }} className="btn-primary">
              Join as Innovator
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
            <Link to="/register" state={{ defaultRole: "funder" }} className="btn-secondary">
              Register as Funder
            </Link>
          </div>
          <p className="hero-note">
            Funders require <span>admin approval</span> before posting funding opportunities
          </p>
        </div>
      </section>

      <section className="stats-bar">
        {stats.map((s) => (
          <div key={s.label} className="stat-item">
            <p className="stat-value">{s.value}</p>
            <p className="stat-label">{s.label}</p>
          </div>
        ))}
      </section>

      <section className="features">
        <span className="section-tag">Features</span>
        <h2 className="section-title">Everything You Need</h2>
        <p className="section-sub">
          Built for innovators and funders to collaborate seamlessly
        </p>
        <div className="features-grid">
          {features.map((f) => (
            <div key={f.title} className="feature-card">
              <div className="feature-icon">{f.icon}</div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="how-it-works">
        <span className="section-tag">Process</span>
        <h2 className="section-title">How It Works</h2>
        <p className="section-sub">
          Get started in four simple steps
        </p>
        <div className="steps-container">
          {steps.map((step, index) => (
            <div key={step.num} className="step-card">
              <div className="step-number">{step.num}</div>
              <h3 className="step-title">{step.title}</h3>
              <p className="step-desc">{step.desc}</p>
              {index < steps.length - 1 && <span className="step-arrow">→</span>}
            </div>
          ))}
        </div>
      </section>

      <section className="cta">
        <div className="cta-content">
          <h2 className="cta-title">
            Ready to <span>Transform</span> Your Ideas?
          </h2>
          <p className="cta-sub">
            Join hundreds of innovators and funders already making an impact.
          </p>
          <Link to="/register" className="cta-btn">
            Create Free Account
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>

      <footer className="footer">
        <div className="footer-content">
          <div className="footer-logo">
            <div className="logo-icon">⚡</div>
            Innovation Management System
          </div>
          <div className="footer-links">
            <a href="#features">Features</a>
            <a href="#how-it-works">How It Works</a>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </div>
          <p className="footer-text">
            © 2025 Innovation Management System — Final Year Project
          </p>
        </div>
      </footer>
    </div>
  );
}