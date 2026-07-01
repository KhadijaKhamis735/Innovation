// Seed projects that already exist in the Innovation system.
// When the club module is added, these same projects must be visible
// in MyProjectsScreen and in any "club projects" list. Keeping the
// shape here (plain JS) lets the context load it once at boot.

export const seedProjects = [
  {
    id: 1,
    zsaId: 'ZSA-INV-2025-001',
    name: 'Smart Water Monitor',
    category: 'IoT / Environment',
    phase: 'prototype',
    date: 'Mar 2025',
    ownerId: 1,
    source: 'innovator', // 'innovator' | 'club' — keeps origin visible
    description: 'IoT-based water quality monitoring system for rural communities.',
    completedMilestones: ['idea-1', 'idea-2', 'idea-3', 'proposal-1', 'proposal-2', 'proposal-3', 'prototype-1'],
  },
  {
    id: 2,
    zsaId: 'ZSA-INV-2025-002',
    name: 'AI Crop Disease Detector',
    category: 'AgriTech',
    phase: 'proposal',
    date: 'Jan 2025',
    ownerId: 1,
    source: 'innovator',
    description: 'Machine learning model to detect crop diseases from smartphone photos.',
    completedMilestones: ['idea-1', 'idea-2', 'idea-3'],
  },
];
