// Seed leadership roster and upcoming meetings.
// Meetings are public to club members; roster is read-only
// (updates are admin-managed in a real backend).

export const seedLeadership = [
  { id: 'l1', name: 'Amina Mwangi',   role: 'President',         bio: 'Computer Science, year 4. Loves robotics.' },
  { id: 'l2', name: 'David Osei',     role: 'Vice President',    bio: 'Mechanical Engineering, year 3.' },
  { id: 'l3', name: 'Salma Rajab',    role: 'Secretary',         bio: 'Business Administration, year 2.' },
  { id: 'l4', name: 'Peter Lema',     role: 'Treasurer',         bio: 'Accounting, year 4.' },
  { id: 'l5', name: 'Joyce Banda',    role: 'Projects Lead',     bio: 'Electrical Engineering, year 3.' },
  { id: 'l6', name: 'Hassan Kimathi', role: 'Events Coordinator', bio: 'Communications, year 2.' },
];

export const seedMeetings = [
  {
    id: 'm1',
    title: 'Weekly general meeting',
    date: '2026-07-02',
    time: '17:00 - 18:00',
    location: 'Innovation Hub, Block A · Room 2',
    meetingLink: null,
    agenda: 'Budget review · Hackathon prep · Open floor',
    minutes: null,
  },
  {
    id: 'm2',
    title: 'Projects committee',
    date: '2026-07-09',
    time: '17:00 - 18:00',
    location: 'Innovation Hub, Block A · Room 2',
    meetingLink: null,
    agenda: 'Demo day run-through · Mentor pairing',
    minutes: null,
  },
  {
    id: 'm3',
    title: 'Leadership sync',
    date: '2026-07-16',
    time: '17:00 - 18:00',
    location: 'Online (Google Meet)',
    meetingLink: 'https://meet.google.com/abc-defg-hij',
    agenda: 'Sponsorship outreach · Q3 planning',
    minutes: null,
  },
  {
    id: 'm4',
    title: 'June general meeting',
    date: '2026-06-18',
    time: '17:00 - 18:00',
    location: 'Innovation Hub Auditorium',
    meetingLink: null,
    agenda: 'Q2 wrap-up · New budget vote',
    minutes: 'Budget for Q3 approved 9-2-1. New partnerships lead elected. Demo day confirmed for June 30.',
  },
];

export const OPEN_POSITIONS = [
  { id: 'p1', title: 'Marketing Lead',            description: 'Run social media, write weekly newsletters, and manage club branding.' },
  { id: 'p2', title: 'Partnerships Coordinator',  description: 'Reach out to potential sponsors and university departments.' },
  { id: 'p3', title: 'Tech Lead — Web',           description: 'Maintain the club website and internal tooling.' },
];