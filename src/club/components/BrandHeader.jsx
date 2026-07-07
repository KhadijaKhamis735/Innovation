import '../styles/ClubShared.css';

export default function BrandHeader({ title, subtitle, onBack, compact = false }) {
  return (
    <header className={`club-brand-header ${compact ? 'compact' : ''}`}>
      <div className="club-brand-logo">⚡</div>
      <div className="club-brand-text">
        <h2 className="club-brand-name">{title}</h2>
        {subtitle ? <p className="club-brand-tagline">{subtitle}</p> : null}
      </div>
      {onBack ? (
        <button className="club-brand-back" onClick={onBack} aria-label="Back">
          ←
        </button>
      ) : null}
    </header>
  );
}