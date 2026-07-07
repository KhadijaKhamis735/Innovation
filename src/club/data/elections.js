// IBARA YA 30–34 — Elections data model & constants
//
// An Election targets a single Executive Committee position and runs through
// a 4-stage lifecycle:
//   nominations_open → campaign → voting → closed
// Once closed, the highest-vote candidate is elected and the existing
// executive at that position is replaced via `appointExecutive`.
//
// All ballot data lives in a separate store (`club:ballots`) — the election
// record only stores aggregate counts (vote counts per candidate). This keeps
// the secret-ballot guarantee in the demo while still being auditable.

// Statuses used by IBARA YA 30, 32, 33
export const ELECTION_STATUSES = Object.freeze([
  'nominations_open',
  'campaign',
  'voting',
  'closed',
  'cancelled',
]);

// Eligibility per IBARA YA 31 — fields the candidate must declare
export const CANDIDACY_REQUIREMENTS = Object.freeze([
  'Active member of the branch',
  'Good academic and disciplinary standing per university rules',
  'Satisfactory participation in club activities (waivable for new branches)',
  'Willing to commit time to execute leadership duties',
  'Basic understanding of the club\'s goals and values',
]);

// Defaults for an election's stage durations (in days)
export const ELECTION_DEFAULTS = Object.freeze({
  nominationsDays: 7,
  campaignDays: 5,
  votingDays: 3,
});

// Election Committee size per IBARA YA 32 — 3 to 5 members
export const ELECTION_COMMITTEE_MIN = 3;
export const ELECTION_COMMITTEE_MAX = 5;

// IBARA YA 30 — voting rules
export const VOTING_RULES = Object.freeze({
  oneVotePerVoterPerPosition: true,
  // In a real system this would be homomorphic / verifiable; here we just
  // store ballots separately so the election record only sees totals.
  secretBallot: true,
  quorum: '1/3 of active members',
  tiebreaker: 're-vote',
});

export const ELECTION_STATUS_LABELS = Object.freeze({
  nominations_open: 'Nominations open',
  campaign: 'Campaign period',
  voting: 'Voting open',
  closed: 'Closed',
  cancelled: 'Cancelled',
});

export const ELECTION_STATUS_COLORS = Object.freeze({
  nominations_open: '#f59e0b',
  campaign: '#3b82f6',
  voting: '#10b981',
  closed: '#6b7280',
  cancelled: '#ef4444',
});