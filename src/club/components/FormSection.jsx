import '../styles/ClubShared.css';

export default function FormSection({ heading, subheading, notice, noticeKind = 'warning', children, compact = false }) {
  return (
    <section className={`club-form-section ${compact ? 'compact' : ''}`}>
      {heading ? <h1 className="club-form-heading">{heading}</h1> : null}
      {subheading ? <p className="club-form-subheading">{subheading}</p> : null}
      {notice ? (
        <div className={`club-notice ${noticeKind !== 'warning' ? noticeKind : ''}`}>
          {notice}
        </div>
      ) : null}
      {children}
    </section>
  );
}