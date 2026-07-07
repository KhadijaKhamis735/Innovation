// Hard-coded seed data for Club Management.
//
// HARD CONSTRAINT (supervisor): only the 4 universities below are permitted.
// `UNIVERSITIES` is exported as a frozen array — never mutate, never append.
// `UniversityPicker` is the single UI surface and reads from this exact list.

import { readJSON, writeJSON } from '../data/clubStorage';

export const UNIVERSITIES = Object.freeze([
  Object.freeze({
    id: 'suza',
    name: 'State University of Zanzibar (SUZA)',
    shortName: 'SUZA',
    regNumberPrefix: 'SUZA',
    primaryColor: '#0e4d8c',
    tagline: 'Innovation, Research & Community',
  }),
  Object.freeze({
    id: 'zanzibar',
    name: 'Zanzibar University',
    shortName: 'ZU',
    regNumberPrefix: 'ZU',
    primaryColor: '#0a1f3c',
    tagline: 'Heritage, Knowledge & Progress',
  }),
  Object.freeze({
    id: 'alsumait',
    name: 'Abdulrahman Al-Sumait University',
    shortName: 'SUMAIT',
    regNumberPrefix: 'SU',
    primaryColor: '#15803d',
    tagline: 'Science for Human Development',
  }),
  Object.freeze({
    id: 'kist',
    name: 'Karume Institute of Science and Technology',
    shortName: 'KIST',
    regNumberPrefix: 'KIST',
    primaryColor: '#b91c1c',
    tagline: 'Technology & Applied Sciences',
  }),
]);

export function findUniversity(id) {
  return UNIVERSITIES.find((u) => u.id === id) || null;
}

// ---------------------------------------------------------------------------
// IBARA YA 11 — Membership Categories
// 4 categories: student, staff, alumni, corporate
// ---------------------------------------------------------------------------
export const MEMBER_CATEGORIES = Object.freeze([
  Object.freeze({
    id: 'student',
    label: 'Student',
    description: 'Currently enrolled at the university. Full voting rights.',
    requiresRegNumber: true,
    requiresStaffId: false,
    icon: '🎓',
  }),
  Object.freeze({
    id: 'staff',
    label: 'University Staff',
    description: 'Faculty, researchers, or administrative staff. Advisory + voting.',
    requiresRegNumber: false,
    requiresStaffId: true,
    icon: '👨‍🏫',
  }),
  Object.freeze({
    id: 'alumni',
    label: 'Alumni',
    description: 'Graduates who continue supporting the innovation mission.',
    requiresRegNumber: false,
    requiresStaffId: false,
    requiresGraduationProof: true,
    icon: '🎖️',
  }),
  Object.freeze({
    id: 'corporate',
    label: 'Corporate / NGO Partner',
    description: 'External partners providing mentorship, funding, or incubation.',
    requiresRegNumber: false,
    requiresStaffId: false,
    requiresOrgName: true,
    icon: '🏢',
  }),
]);

// ---------------------------------------------------------------------------
// IBARA YA 16 — Membership Lifecycle Statuses
// none → registered → pending → active → (suspended | withdrawn | expelled)
// ---------------------------------------------------------------------------
export const MEMBERSHIP_STATUSES = Object.freeze([
  'pending',
  'active',
  'suspended',
  'expelled',
  'withdrawn',
  'rejected',
]);

// 4 Club Leaders — one per university. Plain passwords are intentional for demo.
// role: 'Mlezi' = Patron (faculty/staff supervisor) per IBARA YA 20
// role: 'Kamati Tendaji' = Executive Committee chair per IBARA YA 19
export const SEED_LEADERS = [
  {
    id: 'leader-suza',
    fullName: 'Dr. Asha Mbarak',
    email: 'leader.suza@zsa.zm',
    password: 'leader123',
    universityId: 'suza',
    role: 'Mlezi',
    phone: '+255 777 100 001',
  },
  {
    id: 'leader-zanzibar',
    fullName: 'Dr. Hamadi Juma',
    email: 'leader.zu@zsa.zm',
    password: 'leader123',
    universityId: 'zanzibar',
    role: 'Mlezi',
    phone: '+255 777 100 002',
  },
  {
    id: 'leader-alsumait',
    fullName: 'Dr. Salma Othman',
    email: 'leader.alsumait@zsa.zm',
    password: 'leader123',
    universityId: 'alsumait',
    role: 'Kamati Tendaji',
    phone: '+255 777 100 003',
  },
  {
    id: 'leader-kist',
    fullName: 'Dr. Khamis Said',
    email: 'leader.kist@zsa.zm',
    password: 'leader123',
    universityId: 'kist',
    role: 'Mlezi',
    phone: '+255 777 100 004',
  },
];

// ---------------------------------------------------------------------------
// IBARA YA 2 — Headquarters + IBARA YA 4 — Branch Structure
// ZSA HQ is in Mbweni. Each university hosts one branch (Tawi).
// ---------------------------------------------------------------------------
export const ZSA_HQ = Object.freeze({
  name: 'Zanzibar Startup Association (ZSA)',
  address: 'Mbweni, Zanzibar',
  role: 'National Coordination Office',
});

export const SEED_CLUBS = UNIVERSITIES.map((u, idx) => ({
  id: `club-${u.id}`,
  name: `${u.shortName} Innovation Club`,
  universityId: u.id,
  // IBARA YA 20 — each branch has a Patron (Mlezi)
  patronId: SEED_LEADERS[idx].id,
  // IBARA YA 4 — branch location info
  campus: 'Main Campus',
  address: `${u.shortName}, Zanzibar`,
  foundedAt: new Date('2026-01-15').toISOString(),
  status: 'active', // 'active' | 'suspended' | 'dissolved'
  charterSignedAt: new Date('2026-01-20').toISOString(),
  createdByAdmin: true,
  memberCount: 0,
}));

// ---------------------------------------------------------------------------
// Sample members covering all 4 categories (IBARA YA 11)
// ---------------------------------------------------------------------------
export const SEED_STUDENTS = [
  // Pending student
  {
    id: 'stu-suza-001',
    fullName: 'Mariam Hassan',
    email: 'mariam.suza@zsa.zm',
    password: 'student123',
    universityId: 'suza',
    category: 'student',
    regNumber: 'SUZA/2024/001',
    status: 'pending',
    registeredAt: new Date('2026-05-12').toISOString(),
  },
  // Pending student
  {
    id: 'stu-zu-001',
    fullName: 'Yusuf Abdalla',
    email: 'yusuf.zu@zsa.zm',
    password: 'student123',
    universityId: 'zanzibar',
    category: 'student',
    regNumber: 'ZU/2024/014',
    status: 'pending',
    registeredAt: new Date('2026-05-20').toISOString(),
  },
  // Active student
  {
    id: 'stu-suza-002',
    fullName: 'Zainab Khamis',
    email: 'zainab.suza@zsa.zm',
    password: 'student123',
    universityId: 'suza',
    category: 'student',
    regNumber: 'SUZA/2023/042',
    status: 'active',
    registeredAt: new Date('2026-04-02').toISOString(),
    verifiedBy: 'leader-suza',
    verifiedAt: new Date('2026-04-03').toISOString(),
    clubId: 'club-suza',
    skills: ['IoT', 'Embedded Systems', 'Agriculture'],
    bio: 'Final-year ICT student passionate about AgriTech.',
  },
  // Staff member
  {
    id: 'stu-suza-staff-001',
    fullName: 'Mr. Hassan Vuai',
    email: 'hassan.vuai@suza.ac.zm',
    password: 'staff123',
    universityId: 'suza',
    category: 'staff',
    staffId: 'SUZA-STAFF-0142',
    status: 'active',
    registeredAt: new Date('2026-03-15').toISOString(),
    verifiedBy: 'leader-suza',
    verifiedAt: new Date('2026-03-16').toISOString(),
    clubId: 'club-suza',
    skills: ['Mentorship', 'Research', 'Grant Writing'],
    bio: 'Faculty in Computer Science. Available for mentorship.',
  },
  // Alumni
  {
    id: 'stu-zu-alum-001',
    fullName: 'Salim Mohamed',
    email: 'salim.zu.alum@zsa.zm',
    password: 'alum123',
    universityId: 'zanzibar',
    category: 'alumni',
    graduationYear: '2023',
    status: 'active',
    registeredAt: new Date('2026-02-10').toISOString(),
    verifiedBy: 'leader-zanzibar',
    verifiedAt: new Date('2026-02-11').toISOString(),
    clubId: 'club-zanzibar',
    skills: ['Product Design', 'Mobile Dev', 'UX'],
    bio: 'ZU alumnus. Founder of a Zanzibar fintech startup.',
  },
  // Corporate partner
  {
    id: 'stu-kist-corp-001',
    fullName: 'Halima Rajab',
    email: 'halima@bluewave.co.tz',
    password: 'corp123',
    universityId: 'kist',
    category: 'corporate',
    organizationName: 'BlueWave Innovations Ltd',
    organizationRole: 'Programs Director',
    status: 'active',
    registeredAt: new Date('2026-01-25').toISOString(),
    verifiedBy: 'leader-kist',
    verifiedAt: new Date('2026-01-26').toISOString(),
    clubId: 'club-kist',
    skills: ['Incubation', 'Funding', 'Networks'],
    bio: 'Industry partner providing incubation slots for student startups.',
  },
];

// ---------------------------------------------------------------------------
// IBARA YA 35 — Sample upcoming meeting per branch so the calendar isn't empty.
// ---------------------------------------------------------------------------
const inDays = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(16, 0, 0, 0); // 4pm local
  return d.toISOString();
};

export const SEED_MEETINGS = [
  {
    id: 'meet-suza-001',
    branchId: 'club-suza',
    type: 'executive_meeting',
    title: 'July Executive Committee Meeting',
    agenda: 'Review term plan · approve July training calendar · discuss hackathon sponsor outreach',
    date: inDays(4),
    location: 'SUZA Main Campus, Innovation Hub',
    isOnline: false,
    meetingUrl: null,
    status: 'scheduled',
    convenedBy: null,
    notifiedAt: new Date().toISOString(),
    closedAt: null,
    minutesApprovedAt: null,
  },
  {
    id: 'meet-suza-002',
    branchId: 'club-suza',
    type: 'general_meeting_ordinary',
    title: 'Term Opening General Meeting',
    agenda: 'Welcome new members · present term plan · elect vacant positions (Makamu Mwenyekiti, Katibu, Mweka Hazina)',
    date: inDays(11),
    location: 'SUZA Auditorium',
    isOnline: false,
    meetingUrl: null,
    status: 'scheduled',
    convenedBy: null,
    notifiedAt: new Date().toISOString(),
    closedAt: null,
    minutesApprovedAt: null,
  },
  {
    id: 'meet-zu-001',
    branchId: 'club-zanzibar',
    type: 'executive_meeting',
    title: 'ZU EC Kick-off Meeting',
    agenda: 'Introduce term priorities · assign portfolio responsibilities',
    date: inDays(6),
    location: 'ZU Campus',
    isOnline: false,
    meetingUrl: null,
    status: 'scheduled',
    convenedBy: null,
    notifiedAt: new Date().toISOString(),
    closedAt: null,
    minutesApprovedAt: null,
  },
];

// ---------------------------------------------------------------------------
// IBARA YA 38–41 — Sample Treasury data per branch (one mobile-money wallet +
// a few representative transactions so the dashboard is not empty).
// ---------------------------------------------------------------------------
const isoDaysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
};

export const SEED_WALLETS = UNIVERSITIES.map((u) => ({
  id: `wallet-${u.id}`,
  branchId: `club-${u.id}`,
  type: 'mobile_money',
  accountName: `${u.shortName} Innovation Club`,
  accountNumber: '+255 777 200 ' + u.id.replace(/[a-z]/g, '').padEnd(3, '0').slice(0, 3),
  provider: 'M-Pesa',
  currency: 'TZS',
  signatories: [],
  active: true,
  createdAt: '2026-01-25T00:00:00.000Z',
}));

export const SEED_TRANSACTIONS = [
  // SUZA
  { id: 'tx-suza-001', branchId: 'club-suza', walletId: 'wallet-suza', type: 'income',  category: 'support',           amount: 200000, currency: 'TZS', date: isoDaysAgo(40), description: 'Quarterly support from ZSA', recordedBy: 'leader-suza', approvedBy: 'leader-suza', status: 'approved' },
  { id: 'tx-suza-002', branchId: 'club-suza', walletId: 'wallet-suza', type: 'expense', category: 'training',         amount: 45000,  currency: 'TZS', date: isoDaysAgo(28), description: 'Hackathon venue + refreshments', recordedBy: 'stu-suza-002', approvedBy: 'leader-suza', status: 'approved' },
  { id: 'tx-suza-003', branchId: 'club-suza', walletId: 'wallet-suza', type: 'expense', category: 'materials',        amount: 15000,  currency: 'TZS', date: isoDaysAgo(21), description: 'Banner printing + stationery', recordedBy: 'stu-suza-002', approvedBy: 'leader-suza', status: 'approved' },
  { id: 'tx-suza-004', branchId: 'club-suza', walletId: 'wallet-suza', type: 'income',  category: 'fundraising',      amount: 75000,  currency: 'TZS', date: isoDaysAgo(14), description: 'Demo day refreshments sale', recordedBy: 'stu-suza-002', approvedBy: 'leader-suza', status: 'approved' },
  { id: 'tx-suza-005', branchId: 'club-suza', walletId: 'wallet-suza', type: 'expense', category: 'logistics',        amount: 22000,  currency: 'TZS', date: isoDaysAgo(8),  description: 'Transport to industry partner visit', recordedBy: 'stu-suza-002', approvedBy: null,          status: 'pending' },
  { id: 'tx-suza-006', branchId: 'club-suza', walletId: 'wallet-suza', type: 'income',  category: 'sponsorship',      amount: 150000, currency: 'TZS', date: isoDaysAgo(3),  description: 'Local sponsor for July hackathon', recordedBy: 'leader-suza', approvedBy: 'leader-suza', status: 'approved' },
  // ZU
  { id: 'tx-zu-001', branchId: 'club-zanzibar', walletId: 'wallet-zanzibar', type: 'income',  category: 'support',      amount: 180000, currency: 'TZS', date: isoDaysAgo(35), description: 'ZSA termly grant', recordedBy: 'leader-zanzibar', approvedBy: 'leader-zanzibar', status: 'approved' },
  { id: 'tx-zu-002', branchId: 'club-zanzibar', walletId: 'wallet-zanzibar', type: 'expense', category: 'training',    amount: 60000,  currency: 'TZS', date: isoDaysAgo(15), description: 'Innovation workshop materials', recordedBy: 'stu-zu-alum-001', approvedBy: 'leader-zanzibar', status: 'approved' },
  // AlSumait
  { id: 'tx-sumait-001', branchId: 'club-alsumait', walletId: 'wallet-alsumait', type: 'income',  category: 'support',  amount: 250000, currency: 'TZS', date: isoDaysAgo(30), description: 'University kickstart grant', recordedBy: 'leader-alsumait', approvedBy: 'leader-alsumait', status: 'approved' },
  // KIST
  { id: 'tx-kist-001', branchId: 'club-kist', walletId: 'wallet-kist', type: 'income',  category: 'sponsorship', amount: 120000, currency: 'TZS', date: isoDaysAgo(22), description: 'Industry partner — BlueWave co-funding', recordedBy: 'stu-kist-corp-001', approvedBy: 'leader-kist', status: 'approved' },
  { id: 'tx-kist-002', branchId: 'club-kist', walletId: 'wallet-kist', type: 'expense', category: 'learning_materials', amount: 18000, currency: 'TZS', date: isoDaysAgo(10), description: 'Prototype lab consumables', recordedBy: 'stu-kist-corp-001', approvedBy: 'leader-kist', status: 'approved' },
];

// ---------------------------------------------------------------------------
// IBARA YA 44 — Sample IP registry entries
// ---------------------------------------------------------------------------
export const SEED_IP_ENTRIES = [
  {
    id: 'ip-suza-001',
    branchId: 'club-suza',
    innovatorId: 'stu-suza-002',
    title: 'Smart Irrigation Controller (Z-Farm)',
    description: 'IoT device that adjusts water flow based on soil moisture + weather forecast.',
    type: 'prototype',
    registeredAt: '2026-04-15T00:00:00.000Z',
    fundingSource: 'Self-funded + ZSA',
    ownershipTerms: 'Inventor retains 100% IP. Club showcase consent: yes.',
    showcaseConsent: true,
    evidenceHash: 'a1b2c3d4e5f6',
  },
  {
    id: 'ip-zu-001',
    branchId: 'club-zanzibar',
    innovatorId: 'stu-zu-alum-001',
    title: 'SpiceChain — Zanzibar spice traceability dApp',
    description: 'Mobile-first supply-chain traceability for clove and cinnamon exports.',
    type: 'service',
    registeredAt: '2026-03-22T00:00:00.000Z',
    fundingSource: 'ZU incubation',
    ownershipTerms: 'Inventor retains IP. Club promotion only.',
    showcaseConsent: true,
    evidenceHash: 'f6e5d4c3b2a1',
  },
];

// Seed a sample club project for the pre-verified SUZA student.
export const SEED_CLUB_PROJECTS = [
  {
    id: 'cp-seed-001',
    title: 'Smart Irrigation for Zanzibar Farms',
    description:
      'IoT-based irrigation controller that adjusts water flow based on soil moisture and weather forecasts.',
    category: 'AgriTech',
    phase: 'prototype',
    clubId: 'club-suza',
    universityId: 'suza',
    authorStudentId: 'stu-suza-002',
    authorName: 'Zainab Khamis',
    createdAt: new Date('2026-05-01').toISOString(),
    source: 'club',
    mirroredOpportunityId: 9001,
  },
];

// ---------------------------------------------------------------------------
// IBARA YA 19, 33 — Sample Executive Committee (Kamati Tendaji) members.
// One full 7-person committee per branch. Terms run 12 months (renewable once).
// `electedAt` is the start of the current term; `termEndsAt` = electedAt + 12mo.
// ---------------------------------------------------------------------------
export const SEED_EXECUTIVES = [
  // --- SUZA branch ---
  { id: 'exec-suza-chair',        branchId: 'club-suza',     memberId: 'stu-suza-002',  position: 'chair',               electedAt: '2026-01-20T00:00:00.000Z', termEndsAt: '2027-01-19T00:00:00.000Z', isInterim: false, reelectedCount: 0 },
  { id: 'exec-suza-vice',         branchId: 'club-suza',     memberId: null,            position: 'vice_chair',          electedAt: '2026-01-20T00:00:00.000Z', termEndsAt: '2027-01-19T00:00:00.000Z', isInterim: true,  reelectedCount: 0 },
  { id: 'exec-suza-secretary',    branchId: 'club-suza',     memberId: null,            position: 'secretary',           electedAt: '2026-01-20T00:00:00.000Z', termEndsAt: '2027-01-19T00:00:00.000Z', isInterim: true,  reelectedCount: 0 },
  { id: 'exec-suza-treasurer',    branchId: 'club-suza',     memberId: null,            position: 'treasurer',           electedAt: '2026-01-20T00:00:00.000Z', termEndsAt: '2027-01-19T00:00:00.000Z', isInterim: true,  reelectedCount: 0 },
  { id: 'exec-suza-programs',     branchId: 'club-suza',     memberId: null,            position: 'programs_officer',    electedAt: '2026-01-20T00:00:00.000Z', termEndsAt: '2027-01-19T00:00:00.000Z', isInterim: true,  reelectedCount: 0 },
  { id: 'exec-suza-innovation',   branchId: 'club-suza',     memberId: null,            position: 'innovation_officer',  electedAt: '2026-01-20T00:00:00.000Z', termEndsAt: '2027-01-19T00:00:00.000Z', isInterim: true,  reelectedCount: 0 },
  { id: 'exec-suza-comms',        branchId: 'club-suza',     memberId: null,            position: 'communications_officer', electedAt: '2026-01-20T00:00:00.000Z', termEndsAt: '2027-01-19T00:00:00.000Z', isInterim: true, reelectedCount: 0 },

  // --- ZU branch (mostly interim, one filled) ---
  { id: 'exec-zu-chair',          branchId: 'club-zanzibar', memberId: 'stu-zu-alum-001', position: 'chair',             electedAt: '2026-01-20T00:00:00.000Z', termEndsAt: '2027-01-19T00:00:00.000Z', isInterim: false, reelectedCount: 0 },
  { id: 'exec-zu-vice',           branchId: 'club-zanzibar', memberId: null,             position: 'vice_chair',        electedAt: '2026-01-20T00:00:00.000Z', termEndsAt: '2027-01-19T00:00:00.000Z', isInterim: true,  reelectedCount: 0 },
  { id: 'exec-zu-secretary',      branchId: 'club-zanzibar', memberId: null,             position: 'secretary',         electedAt: '2026-01-20T00:00:00.000Z', termEndsAt: '2027-01-19T00:00:00.000Z', isInterim: true,  reelectedCount: 0 },
  { id: 'exec-zu-treasurer',      branchId: 'club-zanzibar', memberId: null,             position: 'treasurer',         electedAt: '2026-01-20T00:00:00.000Z', termEndsAt: '2027-01-19T00:00:00.000Z', isInterim: true,  reelectedCount: 0 },
  { id: 'exec-zu-programs',       branchId: 'club-zanzibar', memberId: null,             position: 'programs_officer',  electedAt: '2026-01-20T00:00:00.000Z', termEndsAt: '2027-01-19T00:00:00.000Z', isInterim: true,  reelectedCount: 0 },
  { id: 'exec-zu-innovation',     branchId: 'club-zanzibar', memberId: null,             position: 'innovation_officer',electedAt: '2026-01-20T00:00:00.000Z', termEndsAt: '2027-01-19T00:00:00.000Z', isInterim: true,  reelectedCount: 0 },
  { id: 'exec-zu-comms',          branchId: 'club-zanzibar', memberId: null,             position: 'communications_officer', electedAt: '2026-01-20T00:00:00.000Z', termEndsAt: '2027-01-19T00:00:00.000Z', isInterim: true, reelectedCount: 0 },

  // --- SUMAIT branch ---
  { id: 'exec-alsumait-chair',    branchId: 'club-alsumait', memberId: null,             position: 'chair',             electedAt: '2026-01-20T00:00:00.000Z', termEndsAt: '2027-01-19T00:00:00.000Z', isInterim: true,  reelectedCount: 0 },
  { id: 'exec-alsumait-vice',     branchId: 'club-alsumait', memberId: null,             position: 'vice_chair',        electedAt: '2026-01-20T00:00:00.000Z', termEndsAt: '2027-01-19T00:00:00.000Z', isInterim: true,  reelectedCount: 0 },
  { id: 'exec-alsumait-secretary',branchId: 'club-alsumait', memberId: null,             position: 'secretary',         electedAt: '2026-01-20T00:00:00.000Z', termEndsAt: '2027-01-19T00:00:00.000Z', isInterim: true,  reelectedCount: 0 },
  { id: 'exec-alsumait-treasurer',branchId: 'club-alsumait', memberId: null,             position: 'treasurer',         electedAt: '2026-01-20T00:00:00.000Z', termEndsAt: '2027-01-19T00:00:00.000Z', isInterim: true,  reelectedCount: 0 },
  { id: 'exec-alsumait-programs', branchId: 'club-alsumait', memberId: null,             position: 'programs_officer',  electedAt: '2026-01-20T00:00:00.000Z', termEndsAt: '2027-01-19T00:00:00.000Z', isInterim: true,  reelectedCount: 0 },
  { id: 'exec-alsumait-innovation',branchId:'club-alsumait', memberId: null,             position: 'innovation_officer',electedAt: '2026-01-20T00:00:00.000Z', termEndsAt: '2027-01-19T00:00:00.000Z', isInterim: true,  reelectedCount: 0 },
  { id: 'exec-alsumait-comms',    branchId: 'club-alsumait', memberId: null,             position: 'communications_officer', electedAt: '2026-01-20T00:00:00.000Z', termEndsAt: '2027-01-19T00:00:00.000Z', isInterim: true, reelectedCount: 0 },

  // --- KIST branch ---
  { id: 'exec-kist-chair',        branchId: 'club-kist',     memberId: 'stu-kist-corp-001', position: 'chair',           electedAt: '2026-01-20T00:00:00.000Z', termEndsAt: '2027-01-19T00:00:00.000Z', isInterim: false, reelectedCount: 0 },
  { id: 'exec-kist-vice',         branchId: 'club-kist',     memberId: null,              position: 'vice_chair',      electedAt: '2026-01-20T00:00:00.000Z', termEndsAt: '2027-01-19T00:00:00.000Z', isInterim: true,  reelectedCount: 0 },
  { id: 'exec-kist-secretary',    branchId: 'club-kist',     memberId: null,              position: 'secretary',       electedAt: '2026-01-20T00:00:00.000Z', termEndsAt: '2027-01-19T00:00:00.000Z', isInterim: true,  reelectedCount: 0 },
  { id: 'exec-kist-treasurer',    branchId: 'club-kist',     memberId: null,              position: 'treasurer',       electedAt: '2026-01-20T00:00:00.000Z', termEndsAt: '2027-01-19T00:00:00.000Z', isInterim: true,  reelectedCount: 0 },
  { id: 'exec-kist-programs',     branchId: 'club-kist',     memberId: null,              position: 'programs_officer',electedAt: '2026-01-20T00:00:00.000Z', termEndsAt: '2027-01-19T00:00:00.000Z', isInterim: true,  reelectedCount: 0 },
  { id: 'exec-kist-innovation',   branchId: 'club-kist',     memberId: null,              position: 'innovation_officer',electedAt: '2026-01-20T00:00:00.000Z', termEndsAt: '2027-01-19T00:00:00.000Z', isInterim: true, reelectedCount: 0 },
  { id: 'exec-kist-comms',        branchId: 'club-kist',     memberId: null,              position: 'communications_officer', electedAt: '2026-01-20T00:00:00.000Z', termEndsAt: '2027-01-19T00:00:00.000Z', isInterim: true, reelectedCount: 0 },
];

const SEEDED_FLAG = 'club:seeded:v2';

export function ensureSeeded() {
  const seeded = readJSON(SEEDED_FLAG, false);
  if (seeded) return;

  writeJSON('club:universities', UNIVERSITIES.map((u) => ({ ...u })));
  writeJSON('club:memberCategories', MEMBER_CATEGORIES.map((c) => ({ ...c })));
  writeJSON('club:clubLeaders', SEED_LEADERS.map((l) => ({ ...l })));
  writeJSON('club:clubs', SEED_CLUBS.map((c) => ({ ...c })));
  writeJSON('club:students', SEED_STUDENTS.map((s) => ({ ...s })));
  writeJSON('club:clubProjects', SEED_CLUB_PROJECTS.map((p) => ({ ...p })));
  writeJSON('club:membershipHistory', []); // IBARA YA 16 — audit trail
  writeJSON('club:executives', SEED_EXECUTIVES.map((e) => ({ ...e })));
  writeJSON('club:handoverLogs', []); // IBARA YA 33 — 14-day handover trail
  writeJSON('club:elections', []); // IBARA YA 30–34 — elections
  writeJSON('club:ballots', []); // IBARA YA 30 — secret ballots (encrypted-like wrapper)
  writeJSON('club:electionCommittees', []); // IBARA YA 32 — 3–5 member committee
  writeJSON('club:meetings', SEED_MEETINGS.map((m) => ({ ...m }))); // IBARA YA 35 — meetings
  writeJSON('club:meetingAttendance', []); // IBARA YA 35 — attendance records
  writeJSON('club:meetingMinutes', []); // IBARA YA 37 — minutes
  writeJSON('club:meetingDecisions', []); // IBARA YA 36 — in-meeting decisions

  // Phase 5 — Treasury, Ethics, IP, Discipline
  writeJSON('club:wallets', SEED_WALLETS.map((w) => ({ ...w }))); // IBARA YA 39
  writeJSON('club:transactions', SEED_TRANSACTIONS.map((t) => ({ ...t }))); // IBARA YA 38, 40
  writeJSON('club:budgets', []); // IBARA YA 39
  writeJSON('club:dues', []); // IBARA YA 38
  writeJSON('club:auditLogs', []); // IBARA YA 41
  writeJSON('club:codeOfConductSignatures', []); // IBARA YA 42
  writeJSON('club:conflicts', []); // IBARA YA 43
  writeJSON('club:ipRegistry', SEED_IP_ENTRIES.map((e) => ({ ...e }))); // IBARA YA 44
  writeJSON('club:disciplinaryCases', []); // IBARA YA 45

  // Phase 6 — Constitutional Lifecycle
  writeJSON('club:amendments', []); // IBARA YA 46
  writeJSON('club:amendmentVotes', []); // IBARA YA 46 — secret ballots (2/3 majority)
  writeJSON('club:dissolutions', []); // IBARA YA 47
  writeJSON('club:onboardingPlans', []); // IBARA YA 48
  writeJSON('club:preferences', { language: 'en' }); // IBARA YA 48.3 — working language toggle
  writeJSON(SEEDED_FLAG, true);
}