import { UNIVERSITIES } from '../context/clubSeed';
import '../styles/ClubShared.css';

// HARD CONSTRAINT (supervisor): exactly 4 universities permitted, no "Other".
// This component is the single UI surface that reads from UNIVERSITIES and
// renders ALL of them as cards. The constant is frozen at module load, so
// even programmatic mutation cannot add a 5th entry.

export default function UniversityPicker({ value, onChange }) {
  return (
    <div className="club-uni-grid">
      {UNIVERSITIES.map((uni) => {
        const selected = value === uni.id;
        return (
          <button
            type="button"
            key={uni.id}
            className={`club-uni-card ${selected ? 'selected' : ''}`}
            style={selected ? { borderColor: uni.primaryColor } : undefined}
            onClick={() => onChange(uni)}
          >
            <span
              className="club-uni-card-badge"
              style={
                selected
                  ? { background: uni.primaryColor, color: '#fff' }
                  : undefined
              }
            >
              {uni.shortName}
            </span>
            <h4 className="club-uni-card-name">{uni.name}</h4>
            <p className="club-uni-card-tagline">{uni.tagline}</p>
            {selected ? (
              <span className="club-uni-card-check">✓</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}