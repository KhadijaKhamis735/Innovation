// Seed club resources (materials) and announcements.
// In production, materials would point to actual PDFs hosted on a CDN,
// and announcements would be authored by leadership.

export const seedMaterials = [
  {
    id: 'mat1',
    title: 'Innovation Toolkit — Ideation to MVP',
    type: 'PDF',
    description: '90-page playbook covering problem framing, prototyping, and pitching.',
    url: 'https://example.com/files/innovation-toolkit.pdf',
  },
  {
    id: 'mat2',
    title: 'Pitch Deck Template',
    type: 'Slides',
    description: 'Google Slides template used by past Demo Day winners.',
    url: 'https://example.com/files/pitch-deck-template',
  },
  {
    id: 'mat3',
    title: 'How to Talk to Users',
    type: 'Video',
    description: '30-min recorded workshop on user interviews.',
    url: 'https://example.com/videos/user-interviews',
  },
  {
    id: 'mat4',
    title: 'Funding Landscape in East Africa',
    type: 'Article',
    description: 'Overview of grants, angels, and accelerators active in the region.',
    url: 'https://example.com/articles/funding-ea',
  },
];

export const seedAnnouncements = [
  {
    id: 'ann1',
    title: 'Demo Day — Spring Cohort',
    body: 'Final list of presenting teams is up. Practice slots open this Friday at the Hub.',
    postedAt: '2026-06-25T09:00:00Z',
    author: 'Amina Mwangi (President)',
    pinned: true,
  },
  {
    id: 'ann2',
    title: 'New mentorship slots available',
    body: 'Three industry mentors (fintech, climate, health) have opened 2 slots each. DM the secretary to claim.',
    postedAt: '2026-06-22T14:30:00Z',
    author: 'Salma Rajab (Secretary)',
    pinned: false,
  },
  {
    id: 'ann3',
    title: 'Hackathon registration closes Friday',
    body: 'Green Hack 2026 — only 12 slots left. Form in the #club-hackathon channel.',
    postedAt: '2026-06-20T08:15:00Z',
    author: 'Hassan Kimathi (Events)',
    pinned: false,
  },
];

// Update seedLeadership: meetings now carry optional meetingLink so the
// detail screen can deep-link out to Google Meet / Zoom.