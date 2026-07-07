// IBARA YA 19 — The 7 Executive Committee (Kamati Tendaji) Positions
// Each position has duties per IBARA YA 23–29.
// IBARA YA 20 — The Patron (Mlezi) is separate (faculty/staff supervisor, non-voting).
// IBARA YA 33 — Each elected official serves a 1-year term, renewable once.

export const EXECUTIVE_POSITIONS = Object.freeze([
  {
    id: 'chair',
    code: 'chair',
    title: 'Mwenyekiti',
    titleEnglish: 'Chairperson',
    icon: '👑',
    color: '#f97316',
    ibara: '23',
    summary: 'Overall club leader; supervises execution of mission and represents the club.',
    duties: [
      'Provide overall leadership of the club and ensure its goals are implemented.',
      'Chair the General Meeting (Mkutano Mkuu) and Executive Committee meetings.',
      'Represent the club before the university, ZSA, partners, and other stakeholders.',
      'Supervise execution of decisions and motivate member participation.',
      'Track performance of fellow leaders and the overall health of the club.',
    ],
  },
  {
    id: 'vice_chair',
    code: 'vice_chair',
    title: 'Makamu Mwenyekiti',
    titleEnglish: 'Vice Chairperson',
    icon: '⭐',
    color: '#0ea5e9',
    ibara: '24',
    summary: 'Supports the Chair and assumes the role when the Chair is absent.',
    duties: [
      'Support the Chair in executing their duties.',
      'Coordinate special activities assigned by the Executive Committee.',
      'Assume the Chair role when the Chair is unavailable.',
      'Supervise follow-up on the execution of meeting decisions.',
    ],
  },
  {
    id: 'secretary',
    code: 'secretary',
    title: 'Katibu',
    titleEnglish: 'Secretary',
    icon: '📋',
    color: '#14b8a6',
    ibara: '25',
    summary: 'Manages records, communications, and all official documentation.',
    duties: [
      'Convene meetings in collaboration with the Chair.',
      'Prepare agendas, retain minutes, correspondence, and club registers.',
      'Manage official club communications inside and outside the university.',
      'Maintain copies of the constitution, reports, permits, and important club documents.',
    ],
  },
  {
    id: 'treasurer',
    code: 'treasurer',
    title: 'Mweka Hazina',
    titleEnglish: 'Treasurer',
    icon: '💰',
    color: '#22c55e',
    ibara: '26',
    summary: 'Manages all club finances, receipts, budgets, and accounts.',
    duties: [
      'Maintain records of all club income and expenses.',
      'Prepare budgets and financial reports for the Executive Committee and General Meeting.',
      'Receive, hold, and disburse funds following the established procedure.',
      'Manage receipts, vouchers, and records of the official club bank account or wallet.',
    ],
  },
  {
    id: 'programs_officer',
    code: 'programs_officer',
    title: 'Afisa Programu na Miradi',
    titleEnglish: 'Programs & Projects Officer',
    icon: '🚀',
    color: '#a855f7',
    ibara: '27',
    summary: 'Coordinates training programs, competitions, projects, and execution schedules.',
    duties: [
      'Prepare the calendar of programs, events, and projects of the club.',
      'Coordinate execution of trainings, competitions, exhibitions, visits, demo days, and related activities.',
      'Track project progress and prepare implementation reports.',
      'Collaborate with internal and external partners in activity execution.',
    ],
  },
  {
    id: 'innovation_officer',
    code: 'innovation_officer',
    title: 'Afisa Ubunifu, Mafunzo na Utafiti',
    titleEnglish: 'Innovation, Training & Research Officer',
    icon: '💡',
    color: '#eab308',
    ibara: '28',
    summary: 'Runs ideation, incubation, learning content, and applied research.',
    duties: [
      'Coordinate ideation, prototyping, business clinics, and learning sessions.',
      'Manage the club knowledge library on startups, business, technology, and research.',
      'Collect baseline data on member needs and challenge areas.',
      'Promote the development of products, services, or projects that may enter incubation or competitions.',
    ],
  },
  {
    id: 'communications_officer',
    code: 'communications_officer',
    title: 'Afisa Mawasiliano na Uhamasishaji',
    titleEnglish: 'Communications & Outreach Officer',
    icon: '📣',
    color: '#ec4899',
    ibara: '29',
    summary: 'Owns public communications, social media, branding, and member outreach.',
    duties: [
      'Manage club communications, posters, social media, and communication materials.',
      'Promote registration of new members and participation in activities.',
      'Preserve photos, testimonials, results, and success stories of the club.',
      'Coordinate public relations in collaboration with the Chair, Secretary, and Patron.',
    ],
  },
]);

export function findPosition(id) {
  return EXECUTIVE_POSITIONS.find((p) => p.id === id) || null;
}

// IBARA YA 33 — Term length and renewal limits
export const TERM = Object.freeze({
  durationMonths: 12,
  maxConsecutiveTerms: 2,
  handoverDays: 14,
});