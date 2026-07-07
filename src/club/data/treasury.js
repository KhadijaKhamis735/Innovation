// IBARA YA 38–41 — Treasury data model
//
// Income sources (IBARA 38):
//   - registration_fees  — registration fees & annual contributions
//   - sponsorship        — donations, sponsorships, grants, gifts
//   - fundraising        — event revenue, merchandise, fundraising
//   - support            — university, ZSA, or institutional support
//
// Permitted expense categories (IBARA 40):
//   - training           — trainings, workshops, hackathons, bootcamps
//   - materials          — program equipment, printing, internet, venue
//   - logistics          — transport, logistics for official activities
//   - learning_materials — mabango, branding, learning content
//   - project_support    — approved member project support
//   - operations         — ordinary operating expenses
//
// All amounts are recorded in Tanzanian Shillings (TZS) per the seed context.

export const INCOME_CATEGORIES = Object.freeze([
  { id: 'registration_fees', label: 'Registration Fees', description: 'Annual contributions approved by the General Meeting.', icon: '🪙' },
  { id: 'sponsorship', label: 'Sponsorship / Grant', description: 'Donations, sponsorships, grants, gifts from stakeholders.', icon: '🤝' },
  { id: 'fundraising', label: 'Fundraising', description: 'Revenue from events, merchandise, demos, exhibitions.', icon: '🎟️' },
  { id: 'support', label: 'Institutional Support', description: 'University, ZSA, or other institutional funding.', icon: '🏛️' },
]);

export const EXPENSE_CATEGORIES = Object.freeze([
  { id: 'training', label: 'Training & Events', description: 'Trainings, workshops, seminars, hackathons, bootcamps, club events.', icon: '🎓' },
  { id: 'materials', label: 'Materials & Venue', description: 'Program equipment, printing, internet, communication, venue, exhibition materials.', icon: '🛠️' },
  { id: 'logistics', label: 'Logistics', description: 'Transport, logistics, or essential services directly tied to official activities.', icon: '🚐' },
  { id: 'learning_materials', label: 'Learning Materials & Branding', description: 'Learning content, banners, event branding, documentation.', icon: '📚' },
  { id: 'project_support', label: 'Member Project Support', description: 'Approved support for member projects.', icon: '🚀' },
  { id: 'operations', label: 'Operations', description: 'Ordinary operating expenses in line with the club purpose.', icon: '⚙️' },
]);

export const ALL_CATEGORIES = Object.freeze([
  ...INCOME_CATEGORIES,
  ...EXPENSE_CATEGORIES,
]);

export const WALLET_TYPES = Object.freeze([
  { id: 'bank', label: 'Bank account', icon: '🏦' },
  { id: 'mobile_money', label: 'Mobile money', icon: '📱' },
  { id: 'cash', label: 'Cash on hand', icon: '💵' },
]);

export const TRANSACTION_STATUSES = Object.freeze([
  'pending',
  'approved',
  'rejected',
]);

// IBARA YA 39 — major-expense threshold. Above this value, transaction must be
// explicitly approved by the Executive Committee.
export const DEFAULT_MAJOR_EXPENSE_THRESHOLD = 50000; // TZS 50,000

export const CURRENCY = 'TZS';

// IBARA YA 44 — IP registry categories
export const IP_TYPES = Object.freeze([
  { id: 'idea', label: 'Idea', icon: '💭', description: 'Documented concept or proposal.' },
  { id: 'prototype', label: 'Prototype', icon: '🧪', description: 'Working model of the innovation.' },
  { id: 'product', label: 'Product', icon: '📦', description: 'Shippable product or service.' },
  { id: 'research', label: 'Research', icon: '🔬', description: 'Research output, paper, or dataset.' },
  { id: 'service', label: 'Service', icon: '🛎️', description: 'Recurring service or platform.' },
]);

// IBARA YA 45 — disciplinary sanctions
export const SANCTION_LEVELS = Object.freeze([
  {
    id: 'verbal_warning',
    label: 'Verbal warning',
    severity: 1,
    description: 'Documented conversation — first step for minor issues.',
  },
  {
    id: 'written_warning',
    label: 'Written warning',
    severity: 2,
    description: 'Formal letter placed in the member\'s record.',
  },
  {
    id: 'suspension',
    label: 'Suspension',
    severity: 3,
    description: 'Time-bounded loss of club access.',
  },
  {
    id: 'removal_from_office',
    label: 'Removal from office',
    severity: 4,
    description: 'Executive Committee seat is vacated.',
  },
  {
    id: 'expulsion',
    label: 'Expulsion',
    severity: 5,
    description: 'Permanent termination of branch membership.',
  },
]);

export const SANCTION_STATUSES = Object.freeze([
  'filed',     // complaint filed, not yet investigated
  'investigating', // committee gathering facts
  'hearing_scheduled', // accused has been heard
  'resolved',  // sanction applied
  'dismissed', // no sanction
  'appealed', // member appealed
  'appeal_upheld', // appeal succeeded, sanction reversed
  'appeal_overturned', // appeal failed, sanction stands
]);

// Code of Conduct section reference (IBARA YA 42)
export const CODE_OF_CONDUCT = Object.freeze({
  version: '1.0',
  ratifiedAt: '2026-01-20',
  principles: [
    'Treat everyone with respect — no discrimination based on gender, religion, ethnicity, ability, or field of study.',
    'Honor intellectual property rights, privacy, and peer contributions.',
    'Practice transparency in finances, decisions, and use of club resources.',
    'Communicate with dignity — no insults, harassment, threats, or abuse.',
    'Cooperate with peers, mentors, partners, and the wider community.',
    'Use innovation to solve real social and economic problems sustainably.',
  ],
});