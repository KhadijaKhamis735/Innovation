// IBARA YA 35–37 — Meetings data model & constants
//
// 4 meeting types:
//   - general_meeting_ordinary  → Mkutano Mkuu wa Kawaida  (Ordinary General Meeting)
//   - general_meeting_extra    → Mkutano Mkuu Maalum      (Extraordinary General Meeting)
//   - executive_meeting        → Kamati Tendaji            (Executive Committee meeting)
//   - sub_committee            → Kamati Ndogo / Timu za Kazi

export const MEETING_TYPES = Object.freeze([
  {
    id: 'general_meeting_ordinary',
    label: 'Mkutano Mkuu wa Kawaida',
    labelEnglish: 'Ordinary General Meeting',
    shortLabel: 'General Meeting',
    frequency: 'At least once per term',
    quorum: '1/3 of active members',
    color: '#f97316',
    icon: '🏛️',
    description:
      'The supreme decision-making body of the branch. Passes plans, budgets, and major decisions.',
  },
  {
    id: 'general_meeting_extra',
    label: 'Mkutano Mkuu Maalum',
    labelEnglish: 'Extraordinary General Meeting',
    shortLabel: 'Extraordinary GM',
    frequency: 'As needed for urgent matters',
    quorum: '1/3 of active members',
    color: '#ef4444',
    icon: '⚡',
    description:
      'Convenes for urgent matters that cannot wait until the next ordinary meeting.',
  },
  {
    id: 'executive_meeting',
    label: 'Kamati Tendaji',
    labelEnglish: 'Executive Committee Meeting',
    shortLabel: 'Executive Meeting',
    frequency: 'At least monthly',
    quorum: 'More than half of members',
    color: '#0ea5e9',
    icon: '👥',
    description:
      'Operational meetings of the 7-member Executive Committee.',
  },
  {
    id: 'sub_committee',
    label: 'Kamati Ndogo / Timu za Kazi',
    labelEnglish: 'Sub-committee / Working Team',
    shortLabel: 'Working Team',
    frequency: 'Per task schedule',
    quorum: 'As determined by the team',
    color: '#a855f7',
    icon: '🛠️',
    description:
      'Meetings of sub-committees or working teams formed for specific activities.',
  },
]);

export function findMeetingType(id) {
  return MEETING_TYPES.find((t) => t.id === id) || null;
}

export const MEETING_STATUSES = Object.freeze([
  'scheduled',
  'ongoing',
  'completed',
  'cancelled',
]);

export const MEETING_STATUS_LABELS = Object.freeze({
  scheduled: 'Scheduled',
  ongoing: 'In progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
});

export const MEETING_STATUS_COLORS = Object.freeze({
  scheduled: '#3b82f6',
  ongoing: '#10b981',
  completed: '#6b7280',
  cancelled: '#ef4444',
});

// IBARA YA 36 — voting within meetings uses ordinary majority (≥50% of votes cast)
// unless a higher threshold is required by the constitution (e.g. amendments = 2/3).
export const DEFAULT_DECISION_THRESHOLD = 0.5;