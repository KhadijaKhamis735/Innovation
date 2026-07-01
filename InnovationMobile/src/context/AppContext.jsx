import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';
import { seedProjects } from './data/seedProjects';
import { seedActivities } from './data/seedActivities';
import { seedLeadership, seedMeetings, OPEN_POSITIONS } from './data/seedLeadership';
import { seedMaterials, seedAnnouncements } from './data/seedResources';

// ─────────────────────────────────────────────────────────────
// AppContext
// ─────────────────────────────────────────────────────────────
// Single source of truth for: user identity, multi-role state,
// shared projects/applications (Innovation + Club), and club
// activities/participations.
//
// Why one context: a club-created project must appear in
// MyProjectsScreen and an innovation project must be usable when
// a club member applies to an opportunity. Two separate stores
// would force us to mirror data; one store keeps the integration
// guarantee for free.
// ─────────────────────────────────────────────────────────────

const AppContext = createContext(null);

const initialUser = {
  id: 1,
  firstName: 'Fatma',
  lastName: 'Hassan',
  email: 'fatma@udsm.ac.tz',
  // Club-specific fields (null until the user joins the club)
  universityId: null,
  universityName: null,
  regNumber: null,
  clubProfile: null, // { bio, skills, joinedAt }
  // Role model:
  //   roles[]        — every role the account has been granted
  //   activeRole     — the role whose UI is currently shown
  roles: ['innovator'],
  activeRole: 'innovator',
  // Club membership lifecycle:
  //   'none'         — has not joined the club
  //   'pending'      — applied, awaiting verification
  //   'active'       — verified club member
  membershipStatus: 'none',
};

export function AppProvider({ children }) {
  const [user, setUser] = useState(initialUser);
  const [projects, setProjects] = useState(seedProjects);
  const [applications, setApplications] = useState([]);
  const [activities] = useState(seedActivities);
  const [activityParticipations, setActivityParticipations] = useState([]);
  const [leadershipApps, setLeadershipApps] = useState([]);
  const [leadership] = useState(seedLeadership);
  const [meetings] = useState(seedMeetings);
  const [openPositions] = useState(OPEN_POSITIONS);
  const [materials] = useState(seedMaterials);
  const [announcements] = useState(seedAnnouncements);
  // projectEvidence — keyed by project id. Shape:
  //   [{ id, projectId, title, type ('doc'|'image'|'video'|'link'), url, addedAt, addedBy }]
  const [projectEvidence, setProjectEvidence] = useState([]);

  // ───── Auth / role actions ─────

  const register = useCallback(({ firstName, lastName, email, role = 'innovator' }) => {
    setUser((prev) => ({
      ...prev,
      firstName,
      lastName,
      email,
      roles: Array.from(new Set([...prev.roles, role])),
      activeRole: role,
    }));
  }, []);

  const setActiveRole = useCallback((role) => {
    setUser((prev) => (prev.roles.includes(role) ? { ...prev, activeRole: role } : prev));
  }, []);

  // ───── Club actions ─────

  // joinClub is the entry point called by ClubRegistrationScreen.
  // It stamps the membership as 'pending' and grants the 'clubMember' role
  // immediately — the user can browse the dashboard while verification is
  // in progress, but role-gated actions (e.g. apply to leadership) can
  // check membershipStatus === 'active' when they need it.
  const joinClub = useCallback(({ universityId, universityName, regNumber }) => {
    setUser((prev) => ({
      ...prev,
      universityId,
      universityName,
      regNumber,
      membershipStatus: 'pending',
      clubProfile: prev.clubProfile || { bio: '', skills: [], joinedAt: new Date().toISOString() },
      roles: Array.from(new Set([...prev.roles, 'clubMember'])),
    }));
  }, []);

  const updateClubProfile = useCallback((patch) => {
    setUser((prev) => ({
      ...prev,
      clubProfile: { ...(prev.clubProfile || {}), ...patch },
    }));
  }, []);

  // Simulate the admin-side verification. In a real app this would
  // be triggered by an admin dashboard, but for the demo we expose
  // a callable that flips pending → active.
  const verifyMembership = useCallback(() => {
    setUser((prev) => (prev.membershipStatus === 'pending' ? { ...prev, membershipStatus: 'active' } : prev));
  }, []);

  // ───── Projects (shared by Innovator + Club) ─────

  const addProject = useCallback((project) => {
    setProjects((prev) => [
      ...prev,
      {
        ...project,
        id: prev.length ? Math.max(...prev.map((p) => p.id)) + 1 : 1,
        ownerId: 1,
        source: 'club',
        date: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        completedMilestones: [],
      },
    ]);
  }, []);

  // ───── Activity participation (club) ─────

  const registerForActivity = useCallback((activityId) => {
    setActivityParticipations((prev) =>
      prev.find((p) => p.activityId === activityId && p.userId === 1)
        ? prev
        : [...prev, { activityId, userId: 1, joinedAt: new Date().toISOString() }],
    );
  }, []);

  // ───── Leadership applications (club) ─────

  const applyForLeadership = useCallback((application) => {
    setLeadershipApps((prev) => [
      ...prev,
      { ...application, id: Date.now(), userId: 1, status: 'pending', submittedAt: new Date().toISOString() },
    ]);
  }, []);

  // ───── Project evidence (club) ─────

  const addProjectEvidence = useCallback(({ projectId, title, type, url }) => {
    setProjectEvidence((prev) => [
      ...prev,
      {
        id: `ev-${Date.now()}`,
        projectId,
        title: title.trim(),
        type, // 'doc' | 'image' | 'video' | 'link'
        url: (url || '').trim(),
        addedAt: new Date().toISOString(),
        addedBy: 1,
      },
    ]);
  }, []);

  const removeProjectEvidence = useCallback((evidenceId) => {
    setProjectEvidence((prev) => prev.filter((e) => e.id !== evidenceId));
  }, []);

  // ───── Derived helpers ─────

  // isClubMember is a convenience boolean for components that need to
  // gate UI (e.g. "Join the club" CTA vs. "Open club dashboard").
  const isClubMember = user.roles.includes('clubMember');

  const value = useMemo(
    () => ({
      // state
      user,
      projects,
      applications,
      activities,
      activityParticipations,
      leadershipApps,
      leadership,
      meetings,
      openPositions,
      materials,
      announcements,
      projectEvidence,
      // derived
      isClubMember,
      // actions
      register,
      setActiveRole,
      joinClub,
      updateClubProfile,
      verifyMembership,
      addProject,
      registerForActivity,
      applyForLeadership,
      addProjectEvidence,
      removeProjectEvidence,
    }),
    [
      user,
      projects,
      applications,
      activities,
      activityParticipations,
      leadershipApps,
      leadership,
      meetings,
      openPositions,
      materials,
      announcements,
      projectEvidence,
      isClubMember,
      register,
      setActiveRole,
      joinClub,
      updateClubProfile,
      verifyMembership,
      addProject,
      registerForActivity,
      applyForLeadership,
      addProjectEvidence,
      removeProjectEvidence,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used inside <AppProvider>');
  }
  return ctx;
}
