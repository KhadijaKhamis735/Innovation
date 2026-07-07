import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { readJSON, writeJSON, remove as removeKey } from '../data/clubStorage';
import { UNIVERSITIES, findUniversity, ensureSeeded, MEMBER_CATEGORIES, ZSA_HQ } from './clubSeed';
import { EXECUTIVE_POSITIONS, findPosition, TERM } from '../data/executivePositions';
import {
  ELECTION_STATUSES,
  ELECTION_DEFAULTS,
  ELECTION_COMMITTEE_MIN,
  ELECTION_COMMITTEE_MAX,
} from '../data/elections';
import {
  MEETING_TYPES,
  MEETING_STATUSES,
  findMeetingType,
  DEFAULT_DECISION_THRESHOLD,
} from '../data/meetings';
import {
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES,
  ALL_CATEGORIES,
  WALLET_TYPES,
  IP_TYPES,
  SANCTION_LEVELS,
  SANCTION_STATUSES,
  CODE_OF_CONDUCT,
  DEFAULT_MAJOR_EXPENSE_THRESHOLD,
  CURRENCY,
} from '../data/treasury';
import {
  CONSTITUTION_META,
  IBARA_LIST,
  SURA_LIST,
  AMENDMENT_RULES,
  DISSOLUTION_RULES,
  ONBOARDING_STEPS,
} from '../data/constitution';

const STORAGE_KEYS = {
  students: 'club:students',
  leaders: 'club:clubLeaders',
  clubs: 'club:clubs',
  projects: 'club:clubProjects',
  session: 'club:session',
  membershipHistory: 'club:membershipHistory',
  memberCategories: 'club:memberCategories',
  executives: 'club:executives',
  handoverLogs: 'club:handoverLogs',
  elections: 'club:elections',
  ballots: 'club:ballots',
  electionCommittees: 'club:electionCommittees',
  meetings: 'club:meetings',
  meetingAttendance: 'club:meetingAttendance',
  meetingMinutes: 'club:meetingMinutes',
  meetingDecisions: 'club:meetingDecisions',

  // Phase 5 — Treasury, Ethics, IP, Discipline
  wallets: 'club:wallets',
  transactions: 'club:transactions',
  budgets: 'club:budgets',
  dues: 'club:dues',
  auditLogs: 'club:auditLogs',
  codeOfConductSignatures: 'club:codeOfConductSignatures',
  conflicts: 'club:conflicts',
  ipRegistry: 'club:ipRegistry',
  disciplinaryCases: 'club:disciplinaryCases',

  // Phase 6 — Constitutional lifecycle + persistence
  amendments: 'club:amendments',
  amendmentVotes: 'club:amendmentVotes',
  dissolutions: 'club:dissolutions',
  onboardingPlans: 'club:onboardingPlans',
  preferences: 'club:preferences',
};

const ClubContext = createContext(null);

function genId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function recordHistory(history, entry) {
  const next = [
    {
      id: genId('mh'),
      at: new Date().toISOString(),
      ...entry,
    },
    ...history,
  ];
  writeJSON(STORAGE_KEYS.membershipHistory, next);
  return next;
}

export function ClubProvider({ children }) {
  const [students, setStudents] = useState([]);
  const [clubLeaders, setClubLeaders] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [clubProjects, setClubProjects] = useState([]);
  const [currentStudent, setCurrentStudent] = useState(null);
  const [currentClubLeader, setCurrentClubLeader] = useState(null);
  const [membershipHistory, setMembershipHistory] = useState([]);
  const [executives, setExecutives] = useState([]);
  const [handoverLogs, setHandoverLogs] = useState([]);
  const [elections, setElections] = useState([]);
  const [ballots, setBallots] = useState([]);
  const [electionCommittees, setElectionCommittees] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [meetingAttendance, setMeetingAttendance] = useState([]);
  const [meetingMinutes, setMeetingMinutes] = useState([]);
  const [meetingDecisions, setMeetingDecisions] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [dues, setDues] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [codeOfConductSignatures, setCodeOfConductSignatures] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [ipRegistry, setIpRegistry] = useState([]);
  const [disciplinaryCases, setDisciplinaryCases] = useState([]);
  const [amendments, setAmendments] = useState([]);
  const [amendmentVotes, setAmendmentVotes] = useState([]);
  const [dissolutions, setDissolutions] = useState([]);
  const [onboardingPlans, setOnboardingPlans] = useState([]);
  const [preferences, setPreferences] = useState({ language: 'en' });

  // Hydrate from localStorage on mount and run one-time seed.
  useEffect(() => {
    ensureSeeded();
    setStudents(readJSON(STORAGE_KEYS.students, []));
    setClubLeaders(readJSON(STORAGE_KEYS.leaders, []));
    setClubs(readJSON(STORAGE_KEYS.clubs, []));
    setClubProjects(readJSON(STORAGE_KEYS.projects, []));
    setMembershipHistory(readJSON(STORAGE_KEYS.membershipHistory, []));
    setExecutives(readJSON(STORAGE_KEYS.executives, []));
    setHandoverLogs(readJSON(STORAGE_KEYS.handoverLogs, []));
    setElections(readJSON(STORAGE_KEYS.elections, []));
    setBallots(readJSON(STORAGE_KEYS.ballots, []));
    setElectionCommittees(readJSON(STORAGE_KEYS.electionCommittees, []));
    setMeetings(readJSON(STORAGE_KEYS.meetings, []));
    setMeetingAttendance(readJSON(STORAGE_KEYS.meetingAttendance, []));
    setMeetingMinutes(readJSON(STORAGE_KEYS.meetingMinutes, []));
    setMeetingDecisions(readJSON(STORAGE_KEYS.meetingDecisions, []));
    setWallets(readJSON(STORAGE_KEYS.wallets, []));
    setTransactions(readJSON(STORAGE_KEYS.transactions, []));
    setBudgets(readJSON(STORAGE_KEYS.budgets, []));
    setDues(readJSON(STORAGE_KEYS.dues, []));
    setAuditLogs(readJSON(STORAGE_KEYS.auditLogs, []));
    setCodeOfConductSignatures(readJSON(STORAGE_KEYS.codeOfConductSignatures, []));
    setConflicts(readJSON(STORAGE_KEYS.conflicts, []));
    setIpRegistry(readJSON(STORAGE_KEYS.ipRegistry, []));
    setDisciplinaryCases(readJSON(STORAGE_KEYS.disciplinaryCases, []));
    setAmendments(readJSON(STORAGE_KEYS.amendments, []));
    setAmendmentVotes(readJSON(STORAGE_KEYS.amendmentVotes, []));
    setDissolutions(readJSON(STORAGE_KEYS.dissolutions, []));
    setOnboardingPlans(readJSON(STORAGE_KEYS.onboardingPlans, []));
    setPreferences(readJSON(STORAGE_KEYS.preferences, { language: 'en' }));

    const session = readJSON(STORAGE_KEYS.session, null);
    if (session && session.kind === 'student') {
      const all = readJSON(STORAGE_KEYS.students, []);
      setCurrentStudent(all.find((s) => s.id === session.id) || null);
    } else if (session && session.kind === 'leader') {
      const all = readJSON(STORAGE_KEYS.leaders, []);
      setCurrentClubLeader(all.find((l) => l.id === session.id) || null);
    }
  }, []);

  // Bridge for the unified AuthContext: when AuthContext.login() writes
  // `club:session` to localStorage AFTER the provider has already mounted
  // (e.g. user signs in through the /login form, then SPA-navigates here),
  // we listen for that change and populate `currentStudent` /
  // `currentClubLeader` accordingly. The `storage` event covers cross-tab
  // writes; the same-tab fallback below catches in-process writes.
  useEffect(() => {
    const SESSION_KEY = 'club:session';
    const applySessionFromStorage = () => {
      try {
        const session = JSON.parse(window.localStorage.getItem(SESSION_KEY) || 'null');
        const studentsNow = readJSON(STORAGE_KEYS.students, []);
        const leadersNow = readJSON(STORAGE_KEYS.leaders, []);
        if (!session) {
          // Only clear if neither was set internally (don't override ClubContext's logoutClub).
          // We intentionally do nothing — letting the existing state stick.
          return;
        }
        if (session.kind === 'student') {
          const match = studentsNow.find((s) => s.id === session.id) || null;
          if (match) setCurrentStudent(match);
        } else if (session.kind === 'leader') {
          const match = leadersNow.find((l) => l.id === session.id) || null;
          if (match) setCurrentClubLeader(match);
        }
      } catch { /* ignore */ }
    };

    // Cross-tab updates.
    const onStorage = (e) => {
      if (e.key === SESSION_KEY) applySessionFromStorage();
    };
    window.addEventListener('storage', onStorage);

    // Same-tab updates: poll shortly. AuthContext writes happen in the same
    // tick as the navigation, so a short-interval poll covers the gap until
    // a navigation event picks up the new value via a fresh mount or until
    // the dashboard route forces a re-render.
    let cancelled = false;
    let attempts = 0;
    const tick = () => {
      if (cancelled) return;
      applySessionFromStorage();
      attempts += 1;
      if (attempts < 6) {
        setTimeout(tick, 100);
      }
    };
    setTimeout(tick, 50);

    return () => {
      cancelled = true;
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  // ---------- persistence helpers ----------
  const persistStudents = useCallback((next) => {
    setStudents(next);
    writeJSON(STORAGE_KEYS.students, next);
  }, []);
  const persistProjects = useCallback((next) => {
    setClubProjects(next);
    writeJSON(STORAGE_KEYS.projects, next);
  }, []);

  // ---------- session ----------
  const setSession = useCallback((kind, id) => {
    if (!kind) {
      removeKey(STORAGE_KEYS.session);
    } else {
      writeJSON(STORAGE_KEYS.session, { kind, id });
    }
  }, []);

  // =========================================================================
  // IBARA YA 11–13 — Membership Registration (all 4 categories)
  // =========================================================================
  const registerStudent = useCallback(
    (payload) => {
      const existing = students.find(
        (s) => s.email.toLowerCase() === payload.email.toLowerCase()
      );
      if (existing) {
        return { ok: false, error: 'An account with that email already exists.' };
      }

      // IBARA YA 12 — eligibility validation per category
      const category = payload.category || 'student';
      const catConfig = MEMBER_CATEGORIES.find((c) => c.id === category);
      if (!catConfig) return { ok: false, error: 'Invalid member category.' };

      if (category === 'student' && !payload.regNumber?.trim()) {
        return { ok: false, error: 'Student registration number is required.' };
      }
      if (category === 'staff' && !payload.staffId?.trim()) {
        return { ok: false, error: 'Staff ID is required.' };
      }
      if (category === 'alumni' && !payload.graduationYear?.trim()) {
        return { ok: false, error: 'Graduation year is required.' };
      }
      if (category === 'corporate' && !payload.organizationName?.trim()) {
        return { ok: false, error: 'Organization name is required.' };
      }

      // Reg-number prefix validation (only for students)
      if (category === 'student' && payload.universityId) {
        const uni = findUniversity(payload.universityId);
        if (uni && payload.regNumber && !payload.regNumber.toUpperCase().startsWith(uni.regNumberPrefix)) {
          return {
            ok: false,
            error: `Registration number must start with "${uni.regNumberPrefix}" for ${uni.shortName}.`,
          };
        }
      }

      const student = {
        id: genId('mbr'), // IBARA YA 11 — unified "member" id regardless of category
        fullName: payload.fullName.trim(),
        email: payload.email.trim(),
        password: payload.password,
        universityId: payload.universityId,
        category, // 'student' | 'staff' | 'alumni' | 'corporate'
        status: 'pending', // IBARA YA 13 — begins as pending
        registeredAt: new Date().toISOString(),
        // Category-specific fields
        regNumber: category === 'student' ? payload.regNumber.trim() : null,
        staffId: category === 'staff' ? payload.staffId.trim() : null,
        graduationYear: category === 'alumni' ? payload.graduationYear.trim() : null,
        organizationName: category === 'corporate' ? payload.organizationName.trim() : null,
        organizationRole: category === 'corporate' ? payload.organizationRole?.trim() || null : null,
        // Optional profile fields
        bio: payload.bio?.trim() || '',
        skills: [],
      };

      const next = [student, ...students];
      persistStudents(next);

      // IBARA YA 16 — audit trail entry
      const history = recordHistory(membershipHistory, {
        type: 'registered',
        memberId: student.id,
        category,
        universityId: student.universityId,
      });
      setMembershipHistory(history);

      setCurrentStudent(student);
      setSession('student', student.id);
      return { ok: true, student };
    },
    [students, persistStudents, setSession, membershipHistory]
  );

  const loginStudent = useCallback(
    (email, password) => {
      const match = students.find(
        (s) =>
          s.email.toLowerCase() === email.trim().toLowerCase() &&
          s.password === password
      );
      if (!match) return { ok: false, error: 'Invalid email or password.' };
      setCurrentStudent(match);
      setCurrentClubLeader(null);
      setSession('student', match.id);
      return { ok: true, student: match };
    },
    [students, setSession]
  );

  const loginClubLeader = useCallback(
    (email, password) => {
      const match = clubLeaders.find(
        (l) =>
          l.email.toLowerCase() === email.trim().toLowerCase() &&
          l.password === password
      );
      if (!match) return { ok: false, error: 'Invalid email or password.' };
      setCurrentClubLeader(match);
      setCurrentStudent(null);
      setSession('leader', match.id);
      return { ok: true, leader: match };
    },
    [clubLeaders, setSession]
  );

  const logoutClub = useCallback(() => {
    setCurrentStudent(null);
    setCurrentClubLeader(null);
    setSession(null, null);
  }, [setSession]);

  const refreshCurrentStudent = useCallback(() => {
    if (!currentStudent) return;
    const fresh = readJSON(STORAGE_KEYS.students, []).find(
      (s) => s.id === currentStudent.id
    );
    if (fresh) setCurrentStudent(fresh);
  }, [currentStudent]);

  // =========================================================================
  // IBARA YA 13–16 — Leader approval, suspension, expulsion, withdrawal
  // =========================================================================
  const approveMember = useCallback(
    (memberId, leaderId) => {
      const next = students.map((s) =>
        s.id === memberId
          ? {
              ...s,
              status: 'active', // IBARA YA 13
              verifiedBy: leaderId,
              verifiedAt: new Date().toISOString(),
              clubId: s.clubId || clubs.find((c) => c.universityId === s.universityId)?.id,
              activatedAt: new Date().toISOString(),
            }
          : s
      );
      persistStudents(next);
      if (currentStudent && currentStudent.id === memberId) {
        const fresh = next.find((s) => s.id === memberId);
        if (fresh) setCurrentStudent(fresh);
      }
      const history = recordHistory(membershipHistory, {
        type: 'approved',
        memberId,
        by: leaderId,
      });
      setMembershipHistory(history);
      return next.find((s) => s.id === memberId) || null;
    },
    [students, persistStudents, currentStudent, clubs, membershipHistory]
  );

  const rejectMember = useCallback(
    (memberId, leaderId, reason) => {
      const next = students.map((s) =>
        s.id === memberId
          ? {
              ...s,
              status: 'rejected', // IBARA YA 16
              verifiedBy: leaderId,
              verifiedAt: new Date().toISOString(),
              rejectionReason: reason?.trim() || 'Registration could not be verified.',
            }
          : s
      );
      persistStudents(next);
      if (currentStudent && currentStudent.id === memberId) {
        const fresh = next.find((s) => s.id === memberId);
        if (fresh) setCurrentStudent(fresh);
      }
      const history = recordHistory(membershipHistory, {
        type: 'rejected',
        memberId,
        by: leaderId,
        reason: reason?.trim() || '',
      });
      setMembershipHistory(history);
      return next.find((s) => s.id === memberId) || null;
    },
    [students, persistStudents, currentStudent, membershipHistory]
  );

  // IBARA YA 16 — voluntary withdrawal
  const withdrawMembership = useCallback(
    (memberId) => {
      const next = students.map((s) =>
        s.id === memberId
          ? {
              ...s,
              status: 'withdrawn',
              withdrawnAt: new Date().toISOString(),
            }
          : s
      );
      persistStudents(next);
      if (currentStudent && currentStudent.id === memberId) {
        const fresh = next.find((s) => s.id === memberId);
        if (fresh) setCurrentStudent(fresh);
      }
      const history = recordHistory(membershipHistory, {
        type: 'withdrawn',
        memberId,
      });
      setMembershipHistory(history);
      return next.find((s) => s.id === memberId) || null;
    },
    [students, persistStudents, currentStudent, membershipHistory]
  );

  // IBARA YA 16 — disciplinary suspension
  const suspendMember = useCallback(
    (memberId, leaderId, reason) => {
      const next = students.map((s) =>
        s.id === memberId
          ? {
              ...s,
              status: 'suspended',
              suspendedAt: new Date().toISOString(),
              suspendedBy: leaderId,
              suspensionReason: reason?.trim() || '',
            }
          : s
      );
      persistStudents(next);
      if (currentStudent && currentStudent.id === memberId) {
        const fresh = next.find((s) => s.id === memberId);
        if (fresh) setCurrentStudent(fresh);
      }
      const history = recordHistory(membershipHistory, {
        type: 'suspended',
        memberId,
        by: leaderId,
        reason: reason?.trim() || '',
      });
      setMembershipHistory(history);
      return next.find((s) => s.id === memberId) || null;
    },
    [students, persistStudents, currentStudent, membershipHistory]
  );

  // IBARA YA 16 — reinstate after suspension
  const reinstateMember = useCallback(
    (memberId, leaderId) => {
      const next = students.map((s) =>
        s.id === memberId
          ? {
              ...s,
              status: 'active',
              suspendedAt: null,
              suspendedBy: null,
              suspensionReason: null,
              reinstatedAt: new Date().toISOString(),
              reinstatedBy: leaderId,
            }
          : s
      );
      persistStudents(next);
      if (currentStudent && currentStudent.id === memberId) {
        const fresh = next.find((s) => s.id === memberId);
        if (fresh) setCurrentStudent(fresh);
      }
      const history = recordHistory(membershipHistory, {
        type: 'reinstated',
        memberId,
        by: leaderId,
      });
      setMembershipHistory(history);
      return next.find((s) => s.id === memberId) || null;
    },
    [students, persistStudents, currentStudent, membershipHistory]
  );

  // IBARA YA 16 — expulsion (terminal — member can no longer participate)
  const expelMember = useCallback(
    (memberId, leaderId, reason) => {
      const next = students.map((s) =>
        s.id === memberId
          ? {
              ...s,
              status: 'expelled',
              expelledAt: new Date().toISOString(),
              expelledBy: leaderId,
              expulsionReason: reason?.trim() || '',
            }
          : s
      );
      persistStudents(next);
      if (currentStudent && currentStudent.id === memberId) {
        const fresh = next.find((s) => s.id === memberId);
        if (fresh) setCurrentStudent(fresh);
      }
      const history = recordHistory(membershipHistory, {
        type: 'expelled',
        memberId,
        by: leaderId,
        reason: reason?.trim() || '',
      });
      setMembershipHistory(history);
      return next.find((s) => s.id === memberId) || null;
    },
    [students, persistStudents, currentStudent, membershipHistory]
  );

  // =========================================================================
  // IBARA YA 16 — Leader queue + decisions
  // =========================================================================
  const pendingQueueForLeader = useCallback(
    (leaderId) => {
      const leader = clubLeaders.find((l) => l.id === leaderId);
      if (!leader) return [];
      return students.filter(
        (s) => s.universityId === leader.universityId && s.status === 'pending'
      );
    },
    [clubLeaders, students]
  );

  const recentDecisionsForLeader = useCallback(
    (leaderId, limit = 5) => {
      const leader = clubLeaders.find((l) => l.id === leaderId);
      if (!leader) return [];
      return students
        .filter(
          (s) =>
            s.universityId === leader.universityId &&
            (s.status === 'active' || s.status === 'rejected')
        )
        .sort((a, b) => {
          const aTime = a.verifiedAt || a.registeredAt;
          const bTime = b.verifiedAt || b.registeredAt;
          return new Date(bTime).getTime() - new Date(aTime).getTime();
        })
        .slice(0, limit);
    },
    [clubLeaders, students]
  );

  // =========================================================================
  // IBARA YA 4 — Branch (Tawi) queries
  // =========================================================================
  const branchByUniversityId = useCallback(
    (universityId) => clubs.find((c) => c.universityId === universityId) || null,
    [clubs]
  );

  const branchById = useCallback(
    (branchId) => clubs.find((c) => c.id === branchId) || null,
    [clubs]
  );

  const patronForBranch = useCallback(
    (branchId) => {
      const branch = clubs.find((c) => c.id === branchId);
      if (!branch) return null;
      return clubLeaders.find((l) => l.id === branch.patronId) || null;
    },
    [clubs, clubLeaders]
  );

  const membersForBranch = useCallback(
    (branchId, category = null, status = null) => {
      return students.filter((s) => {
        if (s.clubId !== branchId) return false;
        if (category && s.category !== category) return false;
        if (status && s.status !== status) return false;
        return true;
      });
    },
    [students]
  );

  const branchStats = useCallback(
    (branchId) => {
      const list = membersForBranch(branchId);
      return {
        total: list.length,
        active: list.filter((s) => s.status === 'active').length,
        pending: list.filter((s) => s.status === 'pending').length,
        suspended: list.filter((s) => s.status === 'suspended').length,
        students: list.filter((s) => s.category === 'student').length,
        staff: list.filter((s) => s.category === 'staff').length,
        alumni: list.filter((s) => s.category === 'alumni').length,
        corporate: list.filter((s) => s.category === 'corporate').length,
      };
    },
    [membersForBranch]
  );

  // =========================================================================
  // Projects (Innovation bridge) — extended for IBARA YA 10
  // =========================================================================
  const createClubProject = useCallback(
    (payload, student) => {
      if (!student) return { ok: false, error: 'Not signed in.' };
      if (student.status !== 'active') {
        return { ok: false, error: 'Only active club members can post projects.' };
      }
      const university = findUniversity(student.universityId);
      const club = clubs.find((c) => c.universityId === student.universityId);
      const mirroredId = 9000 + clubProjects.length + 1;
      const project = {
        id: genId('cp'),
        title: payload.title.trim(),
        description: payload.description.trim(),
        category: payload.category || 'General',
        phase: payload.phase || 'idea',
        clubId: club?.id || null,
        universityId: student.universityId,
        authorStudentId: student.id,
        authorName: student.fullName,
        createdAt: new Date().toISOString(),
        source: 'club',
        mirroredOpportunityId: mirroredId,
        universityShortName: university?.shortName || '',
      };
      const next = [project, ...clubProjects];
      persistProjects(next);
      return { ok: true, project };
    },
    [clubProjects, persistProjects, students, clubs]
  );

  const projectsForStudent = useCallback(
    (studentId) => clubProjects.filter((p) => p.authorStudentId === studentId),
    [clubProjects]
  );

  const projectsForClub = useCallback(
    (clubId) => clubProjects.filter((p) => p.clubId === clubId),
    [clubProjects]
  );

  // =========================================================================
  // IBARA YA 17, 19, 23–29 — Executive Committee (Kamati Tendaji)
  // =========================================================================

  // Returns the 7-position committee for a branch, in constitutional order.
  const executivesForBranch = useCallback(
    (branchId) => {
      const list = executives.filter((e) => e.branchId === branchId);
      // Sort by position order in EXECUTIVE_POSITIONS
      const order = EXECUTIVE_POSITIONS.map((p) => p.id);
      return [...list].sort((a, b) => order.indexOf(a.position) - order.indexOf(b.position));
    },
    [executives]
  );

  // Lookup by position code for a given branch (returns null if vacant)
  const executiveForPosition = useCallback(
    (branchId, positionId) => {
      return executives.find((e) => e.branchId === branchId && e.position === positionId) || null;
    },
    [executives]
  );

  // Lookup the member record for an executive row
  const memberForExecutive = useCallback(
    (exec) => {
      if (!exec || !exec.memberId) return null;
      return students.find((s) => s.id === exec.memberId) || null;
    },
    [students]
  );

  // IBARA YA 31 — Check eligibility of a candidate for a position
  const canRunForPosition = useCallback(
    (memberId, branchId) => {
      const member = students.find((s) => s.id === memberId);
      if (!member) return { ok: false, error: 'Member not found.' };
      if (member.status !== 'active') {
        return { ok: false, error: 'Only active members can stand for election.' };
      }
      if (member.universityId !== branchId.replace('club-', '')) {
        return { ok: false, error: 'Member must belong to this branch.' };
      }
      return { ok: true };
    },
    [students]
  );

  // IBARA YA 19, 33 — Appoint or elect an executive member
  // In Phase 2 (no election system yet) this is used by leaders to populate
  // the committee; Phase 3 (elections) will wrap this with vote records.
  const appointExecutive = useCallback(
    ({ branchId, position, memberId, electedBy = 'appointment', reelectedCount = 0, isInterim = false }) => {
      const positionDef = findPosition(position);
      if (!positionDef) return { ok: false, error: 'Unknown position.' };

      // Replace any existing executive at this position in this branch
      const others = executives.filter(
        (e) => !(e.branchId === branchId && e.position === position)
      );
      const now = new Date();
      const endsAt = new Date(now);
      endsAt.setMonth(endsAt.getMonth() + TERM.durationMonths);

      const newExec = {
        id: genId('exec'),
        branchId,
        position,
        memberId: memberId || null,
        electedAt: now.toISOString(),
        termEndsAt: endsAt.toISOString(),
        isInterim: !!isInterim || !memberId,
        reelectedCount: reelectedCount || 0,
        electedBy, // 'election' | 'appointment' | 'by-election'
      };
      const next = [...others, newExec];
      setExecutives(next);
      writeJSON(STORAGE_KEYS.executives, next);

      const history = recordHistory(membershipHistory, {
        type: 'executive_appointed',
        branchId,
        position,
        memberId: memberId || null,
        electedBy,
      });
      setMembershipHistory(history);

      return { ok: true, executive: newExec };
    },
    [executives, membershipHistory]
  );

  // IBARA YA 34 — Remove an executive (resignation, removal, etc.)
  const removeExecutive = useCallback(
    (execId, reason = 'removed') => {
      const target = executives.find((e) => e.id === execId);
      const next = executives.filter((e) => e.id !== execId);
      setExecutives(next);
      writeJSON(STORAGE_KEYS.executives, next);

      if (target) {
        const history = recordHistory(membershipHistory, {
          type: 'executive_removed',
          branchId: target.branchId,
          position: target.position,
          memberId: target.memberId,
          reason,
        });
        setMembershipHistory(history);
      }
      return { ok: true };
    },
    [executives, membershipHistory]
  );

  // IBARA YA 33 — 14-day handover protocol
  // Records that the outgoing executive has transferred documents, funds,
  // accounts, and records to the incoming executive. Both sign.
  const recordHandover = useCallback(
    ({ branchId, position, outgoingExecId, incomingMemberId, outgoingMemberId, notes, assetsTransferred }) => {
      const now = new Date();
      const dueBy = new Date(now);
      dueBy.setDate(dueBy.getDate() + TERM.handoverDays);

      const entry = {
        id: genId('ho'),
        branchId,
        position,
        outgoingExecId: outgoingExecId || null,
        outgoingMemberId: outgoingMemberId || null,
        incomingMemberId: incomingMemberId || null,
        notes: notes?.trim() || '',
        assetsTransferred: assetsTransferred || {
          documents: false,
          funds: false,
          accounts: false,
          records: false,
        },
        recordedAt: now.toISOString(),
        dueBy: dueBy.toISOString(),
        completed: true,
      };
      const next = [entry, ...handoverLogs];
      setHandoverLogs(next);
      writeJSON(STORAGE_KEYS.handoverLogs, next);

      const history = recordHistory(membershipHistory, {
        type: 'handover_completed',
        branchId,
        position,
        outgoingMemberId,
        incomingMemberId,
      });
      setMembershipHistory(history);
      return { ok: true, handover: entry };
    },
    [handoverLogs, membershipHistory]
  );

  const handoverForExecutive = useCallback(
    (execId) => handoverLogs.find((h) => h.outgoingExecId === execId) || null,
    [handoverLogs]
  );

  // =========================================================================
  // IBARA YA 30–34 — Elections
  // =========================================================================

  // ---- Election lifecycle helpers ----
  const electionsForBranch = useCallback(
    (branchId) =>
      elections
        .filter((e) => e.branchId === branchId)
        .sort((a, b) => new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime()),
    [elections]
  );

  const electionById = useCallback(
    (id) => elections.find((e) => e.id === id) || null,
    [elections]
  );

  const activeElectionForPosition = useCallback(
    (branchId, positionId) =>
      elections.find(
        (e) =>
          e.branchId === branchId &&
          e.position === positionId &&
          ['nominations_open', 'campaign', 'voting'].includes(e.status)
      ) || null,
    [elections]
  );

  const nominationsForElection = useCallback(
    (electionId) =>
      elections.find((e) => e.id === electionId)?.nominations || [],
    [elections]
  );

  const ballotsForElection = useCallback(
    (electionId) => ballots.filter((b) => b.electionId === electionId),
    [ballots]
  );

  const hasVoted = useCallback(
    (electionId, voterId) =>
      ballots.some((b) => b.electionId === electionId && b.voterId === voterId),
    [ballots]
  );

  // IBARA YA 32 — Election Committee
  const committeeForBranch = useCallback(
    (branchId) =>
      electionCommittees.find((c) => c.branchId === branchId && c.active) || null,
    [electionCommittees]
  );

  const formElectionCommittee = useCallback(
    ({ branchId, members, formedBy }) => {
      if (!Array.isArray(members) || members.length < ELECTION_COMMITTEE_MIN || members.length > ELECTION_COMMITTEE_MAX) {
        return {
          ok: false,
          error: `Election Committee must have ${ELECTION_COMMITTEE_MIN}–${ELECTION_COMMITTEE_MAX} members.`,
        };
      }
      // Replace any active committee for the branch
      const others = electionCommittees.filter(
        (c) => !(c.branchId === branchId && c.active)
      );
      const committee = {
        id: genId('ec'),
        branchId,
        members: members.map((id) => ({ memberId: id })),
        formedBy: formedBy || null,
        formedAt: new Date().toISOString(),
        active: true,
      };
      const next = [committee, ...others];
      setElectionCommittees(next);
      writeJSON(STORAGE_KEYS.electionCommittees, next);
      return { ok: true, committee };
    },
    [electionCommittees]
  );

  // IBARA YA 30 — Announce an election (Patron / Chair only)
  const announceElection = useCallback(
    ({ branchId, position, committeeId, nominationsEndAt, campaignEndAt, votingEndAt, announcedBy }) => {
      const posDef = findPosition(position);
      if (!posDef) return { ok: false, error: 'Unknown position.' };

      // IBARA YA 30 — democratic, fair, secret-ballot or another approved system
      const now = new Date();
      const nomEnd = nominationsEndAt
        ? new Date(nominationsEndAt)
        : new Date(now.getTime() + ELECTION_DEFAULTS.nominationsDays * 86400000);
      const campEnd = campaignEndAt
        ? new Date(campaignEndAt)
        : new Date(nomEnd.getTime() + ELECTION_DEFAULTS.campaignDays * 86400000);
      const voteEnd = votingEndAt
        ? new Date(votingEndAt)
        : new Date(campEnd.getTime() + ELECTION_DEFAULTS.votingDays * 86400000);

      const election = {
        id: genId('elec'),
        branchId,
        position,
        committeeId: committeeId || null,
        status: 'nominations_open',
        nominationsEndAt: nomEnd.toISOString(),
        campaignEndAt: campEnd.toISOString(),
        votingEndAt: voteEnd.toISOString(),
        nominations: [],
        results: null,
        complaints: [],
        openedAt: now.toISOString(),
        announcedBy: announcedBy || null,
        closedAt: null,
      };
      const next = [election, ...elections];
      setElections(next);
      writeJSON(STORAGE_KEYS.elections, next);

      const history = recordHistory(membershipHistory, {
        type: 'election_announced',
        branchId,
        position,
        electionId: election.id,
        by: announcedBy,
      });
      setMembershipHistory(history);

      return { ok: true, election };
    },
    [elections, membershipHistory]
  );

  // IBARA YA 31 — Submit candidacy
  const submitNomination = useCallback(
    ({ electionId, candidateId, statement, experience, hoursPerWeek, secondedBy }) => {
      const election = elections.find((e) => e.id === electionId);
      if (!election) return { ok: false, error: 'Election not found.' };
      if (election.status !== 'nominations_open') {
        return { ok: false, error: 'Nominations are closed.' };
      }

      // IBARA YA 31 — eligibility
      const eligibility = canRunForPosition(candidateId, election.branchId);
      if (!eligibility.ok) return eligibility;

      if (election.nominations.some((n) => n.candidateId === candidateId)) {
        return { ok: false, error: 'You have already nominated yourself for this position.' };
      }

      const nomination = {
        id: genId('nom'),
        candidateId,
        statement: statement?.trim() || '',
        experience: experience?.trim() || '',
        hoursPerWeek: Number(hoursPerWeek) || 0,
        secondedBy: secondedBy || [], // IBARA YA 32 — seconder names
        nominatedAt: new Date().toISOString(),
      };

      const next = elections.map((e) =>
        e.id === electionId ? { ...e, nominations: [...e.nominations, nomination] } : e
      );
      setElections(next);
      writeJSON(STORAGE_KEYS.elections, next);

      const history = recordHistory(membershipHistory, {
        type: 'nomination_submitted',
        branchId: election.branchId,
        position: election.position,
        electionId,
        candidateId,
      });
      setMembershipHistory(history);

      return { ok: true, nomination };
    },
    [elections, canRunForPosition, membershipHistory]
  );

  // IBARA YA 30 — Move election between stages
  const advanceElectionStage = useCallback(
    (electionId, newStatus, actorId) => {
      const election = elections.find((e) => e.id === electionId);
      if (!election) return { ok: false, error: 'Election not found.' };
      const allowed = {
        nominations_open: ['campaign', 'cancelled'],
        campaign: ['voting', 'cancelled'],
        voting: ['closed', 'cancelled'],
        closed: [],
        cancelled: [],
      };
      if (!allowed[election.status]?.includes(newStatus)) {
        return { ok: false, error: `Cannot move from ${election.status} to ${newStatus}.` };
      }
      const next = elections.map((e) =>
        e.id === electionId
          ? { ...e, status: newStatus, closedAt: newStatus === 'closed' ? new Date().toISOString() : e.closedAt }
          : e
      );
      setElections(next);
      writeJSON(STORAGE_KEYS.elections, next);

      const history = recordHistory(membershipHistory, {
        type: 'election_stage_changed',
        branchId: election.branchId,
        position: election.position,
        electionId,
        from: election.status,
        to: newStatus,
        by: actorId,
      });
      setMembershipHistory(history);
      return { ok: true };
    },
    [elections, membershipHistory]
  );

  // IBARA YA 30 — Cast a secret ballot (stores only voterId + candidateId)
  const castBallot = useCallback(
    ({ electionId, voterId, candidateId }) => {
      const election = elections.find((e) => e.id === electionId);
      if (!election) return { ok: false, error: 'Election not found.' };
      if (election.status !== 'voting') {
        return { ok: false, error: 'Voting is not open.' };
      }

      // IBARA YA 30 — only active members can vote
      const voter = students.find((s) => s.id === voterId);
      if (!voter || voter.status !== 'active') {
        return { ok: false, error: 'Only active members can vote.' };
      }
      if (voter.universityId !== election.branchId.replace('club-', '')) {
        return { ok: false, error: 'Voters must belong to this branch.' };
      }
      if (ballots.some((b) => b.electionId === electionId && b.voterId === voterId)) {
        return { ok: false, error: 'You have already voted in this election.' };
      }
      const cand = election.nominations.find((n) => n.candidateId === candidateId);
      if (!cand) {
        return { ok: false, error: 'Candidate not on the ballot.' };
      }

      const ballot = {
        id: genId('blt'),
        electionId,
        voterId,
        candidateId,
        castAt: new Date().toISOString(),
      };
      const nextBallots = [...ballots, ballot];
      setBallots(nextBallots);
      writeJSON(STORAGE_KEYS.ballots, nextBallots);

      const history = recordHistory(membershipHistory, {
        type: 'ballot_cast',
        branchId: election.branchId,
        position: election.position,
        electionId,
        voterId,
        // Intentionally do NOT log candidateId here — secret ballot.
      });
      setMembershipHistory(history);
      return { ok: true, ballot };
    },
    [elections, ballots, students, membershipHistory]
  );

  // IBARA YA 30 — Tally votes and close the election
  const tallyAndClose = useCallback(
    (electionId, actorId) => {
      const election = elections.find((e) => e.id === electionId);
      if (!election) return { ok: false, error: 'Election not found.' };
      if (election.status !== 'voting') {
        return { ok: false, error: 'Election is not in voting stage.' };
      }
      const electionBallots = ballots.filter((b) => b.electionId === electionId);
      const counts = {};
      election.nominations.forEach((n) => { counts[n.candidateId] = 0; });
      electionBallots.forEach((b) => {
        if (counts[b.candidateId] !== undefined) counts[b.candidateId] += 1;
      });

      let winnerId = null;
      let winnerVotes = -1;
      let tied = false;
      Object.entries(counts).forEach(([cid, v]) => {
        if (v > winnerVotes) { winnerVotes = v; winnerId = cid; tied = false; }
        else if (v === winnerVotes && v > 0) { tied = true; }
      });

      // If tied, election status reverts to voting (re-vote per VOTING_RULES.tiebreaker)
      if (tied) {
        return {
          ok: false,
          tied: true,
          counts,
          message: 'Vote tie detected. The Election Committee must re-open voting for a run-off.',
        };
      }

      const results = {
        totalBallots: electionBallots.length,
        counts,
        winnerId: winnerVotes > 0 ? winnerId : null,
        winnerVotes,
        spoiledBallots: 0,
        closedAt: new Date().toISOString(),
        closedBy: actorId || null,
      };

      // Close election + persist winner. The committee (or admin) then triggers
      // appointExecutive separately if they want to swap the incumbent.
      const next = elections.map((e) =>
        e.id === electionId ? { ...e, status: 'closed', results, closedAt: new Date().toISOString() } : e
      );
      setElections(next);
      writeJSON(STORAGE_KEYS.elections, next);

      const history = recordHistory(membershipHistory, {
        type: 'election_closed',
        branchId: election.branchId,
        position: election.position,
        electionId,
        winnerId: results.winnerId,
        by: actorId,
      });
      setMembershipHistory(history);

      return { ok: true, results, election: next.find((e) => e.id === electionId) };
    },
    [elections, ballots, membershipHistory]
  );

  // After election closes, the committee / chair can install the winner.
  // This wraps `appointExecutive` so election results translate into office.
  const installElectionWinner = useCallback(
    (electionId, actorId) => {
      const election = elections.find((e) => e.id === electionId);
      if (!election || election.status !== 'closed' || !election.results?.winnerId) {
        return { ok: false, error: 'No winner to install.' };
      }
      const outgoing = executiveForPosition(election.branchId, election.position);
      const reelectedCount = (outgoing?.memberId === election.results.winnerId ? (outgoing?.reelectedCount || 0) : 0);
      const result = appointExecutive({
        branchId: election.branchId,
        position: election.position,
        memberId: election.results.winnerId,
        electedBy: 'election',
        reelectedCount,
      });
      if (result.ok && outgoing?.memberId) {
        const history = recordHistory(membershipHistory, {
          type: 'executive_replaced',
          branchId: election.branchId,
          position: election.position,
          outgoingMemberId: outgoing.memberId,
          incomingMemberId: election.results.winnerId,
          by: actorId,
        });
        setMembershipHistory(history);
      }
      return result;
    },
    [elections, executiveForPosition, appointExecutive, membershipHistory]
  );

  // IBARA YA 32 — File an election complaint
  const fileElectionComplaint = useCallback(
    ({ electionId, complainantId, text }) => {
      const election = elections.find((e) => e.id === electionId);
      if (!election) return { ok: false, error: 'Election not found.' };
      const trimmed = text?.trim();
      if (!trimmed) return { ok: false, error: 'Complaint text is required.' };
      const complaint = {
        id: genId('cmp'),
        complainantId,
        text: trimmed,
        filedAt: new Date().toISOString(),
        resolved: false,
        resolution: null,
      };
      const next = elections.map((e) =>
        e.id === electionId ? { ...e, complaints: [...(e.complaints || []), complaint] } : e
      );
      setElections(next);
      writeJSON(STORAGE_KEYS.elections, next);
      return { ok: true, complaint };
    },
    [elections]
  );

  const resolveElectionComplaint = useCallback(
    ({ electionId, complaintId, resolution, resolvedBy }) => {
      const next = elections.map((e) => {
        if (e.id !== electionId) return e;
        return {
          ...e,
          complaints: (e.complaints || []).map((c) =>
            c.id === complaintId
              ? { ...c, resolved: true, resolution: resolution?.trim() || 'Resolved.', resolvedBy, resolvedAt: new Date().toISOString() }
              : c
          ),
        };
      });
      setElections(next);
      writeJSON(STORAGE_KEYS.elections, next);
      return { ok: true };
    },
    [elections]
  );

  // IBARA YA 34 — Vote of no confidence against an executive
  const openVoteOfNoConfidence = useCallback(
    ({ branchId, position, initiatedBy, reason }) => {
      const target = executiveForPosition(branchId, position);
      if (!target) return { ok: false, error: 'No executive in this position to remove.' };
      const now = new Date();
      const votingEndAt = new Date(now.getTime() + ELECTION_DEFAULTS.votingDays * 86400000);

      const motion = {
        id: genId('vonc'),
        branchId,
        position,
        targetExecId: target.id,
        targetMemberId: target.memberId,
        initiatedBy: initiatedBy || null,
        reason: reason?.trim() || '',
        status: 'voting',
        openedAt: now.toISOString(),
        votingEndAt: votingEndAt.toISOString(),
        votesFor: [],    // memberIds voting to remove
        votesAgainst: [],// memberIds voting to retain
        closedAt: null,
      };
      const history = recordHistory(membershipHistory, {
        type: 'no_confidence_opened',
        branchId,
        position,
        targetMemberId: target.memberId,
        by: initiatedBy,
      });
      setMembershipHistory(history);
      return { ok: true, motion };
    },
    [executiveForPosition, membershipHistory]
  );

  // =========================================================================
  // IBARA YA 35–37 — Meetings (Mikutano)
  // =========================================================================

  // ---- Meeting queries ----
  const meetingsForBranch = useCallback(
    (branchId) =>
      meetings
        .filter((m) => m.branchId === branchId)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [meetings]
  );

  const meetingById = useCallback(
    (id) => meetings.find((m) => m.id === id) || null,
    [meetings]
  );

  const attendanceForMeeting = useCallback(
    (meetingId) => {
      const rec = meetingAttendance.find((a) => a.meetingId === meetingId);
      return rec?.attendees || [];
    },
    [meetingAttendance]
  );

  const minutesForMeeting = useCallback(
    (meetingId) => meetingMinutes.find((m) => m.meetingId === meetingId) || null,
    [meetingMinutes]
  );

  const decisionsForMeeting = useCallback(
    (meetingId) => meetingDecisions.filter((d) => d.meetingId === meetingId),
    [meetingDecisions]
  );

  // IBARA YA 35 — quorum counts
  const quorumForMeeting = useCallback(
    (meeting) => {
      if (!meeting) return { required: 0, present: 0, met: false };
      const branch = clubs.find((c) => c.id === meeting.branchId);
      if (!branch) return { required: 0, present: 0, met: false };

      const activeMembers = membersForBranch(branch.id, null, 'active');
      const present = attendanceForMeeting(meeting.id).length;

      const type = findMeetingType(meeting.type);
      let required;
      if (meeting.type === 'executive_meeting') {
        // More than half of the 7 executive seats
        const filled = executivesForBranch(branch.id).filter((e) => e.memberId).length;
        required = Math.floor(filled / 2) + 1;
      } else if (type?.quorum?.includes('1/3')) {
        required = Math.ceil(activeMembers.length / 3);
      } else {
        required = Math.max(2, Math.ceil(activeMembers.length / 4));
      }
      return { required, present, met: present >= required };
    },
    [clubs, membersForBranch, attendanceForMeeting, executivesForBranch]
  );

  // ---- Scheduling ----
  const scheduleMeeting = useCallback(
    ({ branchId, type, title, agenda, date, location, isOnline, meetingUrl, convenedBy }) => {
      const typeDef = findMeetingType(type);
      if (!typeDef) return { ok: false, error: 'Unknown meeting type.' };
      if (!title?.trim()) return { ok: false, error: 'Meeting title is required.' };
      if (!date) return { ok: false, error: 'Meeting date/time is required.' };

      const meeting = {
        id: genId('meet'),
        branchId,
        type,
        title: title.trim(),
        agenda: agenda?.trim() || '',
        date: new Date(date).toISOString(),
        location: location?.trim() || 'To be announced',
        isOnline: !!isOnline,
        meetingUrl: meetingUrl?.trim() || null,
        status: 'scheduled',
        convenedBy: convenedBy || null,
        notifiedAt: new Date().toISOString(),
        closedAt: null,
        minutesApprovedAt: null,
      };
      const next = [meeting, ...meetings];
      setMeetings(next);
      writeJSON(STORAGE_KEYS.meetings, next);

      const history = recordHistory(membershipHistory, {
        type: 'meeting_scheduled',
        branchId,
        meetingId: meeting.id,
        meetingType: type,
        by: convenedBy,
      });
      setMembershipHistory(history);
      return { ok: true, meeting };
    },
    [meetings, membershipHistory]
  );

  const notifyMembers = useCallback(
    (meetingId) => {
      const next = meetings.map((m) =>
        m.id === meetingId ? { ...m, notifiedAt: new Date().toISOString() } : m
      );
      setMeetings(next);
      writeJSON(STORAGE_KEYS.meetings, next);
      return { ok: true };
    },
    [meetings]
  );

  const startMeeting = useCallback(
    (meetingId, actorId) => {
      const next = meetings.map((m) =>
        m.id === meetingId ? { ...m, status: 'ongoing' } : m
      );
      setMeetings(next);
      writeJSON(STORAGE_KEYS.meetings, next);

      const meeting = next.find((m) => m.id === meetingId);
      if (meeting) {
        const history = recordHistory(membershipHistory, {
          type: 'meeting_started',
          branchId: meeting.branchId,
          meetingId,
          by: actorId,
        });
        setMembershipHistory(history);
      }
      return { ok: true };
    },
    [meetings, membershipHistory]
  );

  const cancelMeeting = useCallback(
    (meetingId, actorId, reason) => {
      const next = meetings.map((m) =>
        m.id === meetingId
          ? { ...m, status: 'cancelled', cancelledAt: new Date().toISOString(), cancellationReason: reason?.trim() || '' }
          : m
      );
      setMeetings(next);
      writeJSON(STORAGE_KEYS.meetings, next);

      const meeting = next.find((m) => m.id === meetingId);
      if (meeting) {
        const history = recordHistory(membershipHistory, {
          type: 'meeting_cancelled',
          branchId: meeting.branchId,
          meetingId,
          reason: reason?.trim() || '',
          by: actorId,
        });
        setMembershipHistory(history);
      }
      return { ok: true };
    },
    [meetings, membershipHistory]
  );

  // ---- Attendance (IBARA YA 35) ----
  const recordAttendance = useCallback(
    (meetingId, attendees) => {
      if (!Array.isArray(attendees)) return { ok: false, error: 'Attendees must be a list.' };
      const meeting = meetings.find((m) => m.id === meetingId);
      if (!meeting) return { ok: false, error: 'Meeting not found.' };
      const others = meetingAttendance.filter((a) => a.meetingId !== meetingId);
      const entry = {
        meetingId,
        attendees: [...new Set(attendees)],
        recordedAt: new Date().toISOString(),
      };
      const next = [entry, ...others];
      setMeetingAttendance(next);
      writeJSON(STORAGE_KEYS.meetingAttendance, next);
      return { ok: true, attendees: entry.attendees };
    },
    [meetings, meetingAttendance]
  );

  // ---- Minutes (IBARA YA 37) ----
  const saveMinutes = useCallback(
    ({ meetingId, items, recordedBy }) => {
      const existing = meetingMinutes.find((m) => m.meetingId === meetingId);
      const entry = {
        meetingId,
        items: items || [],
        recordedBy: recordedBy || null,
        recordedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      let next;
      if (existing) {
        next = meetingMinutes.map((m) => (m.meetingId === meetingId ? { ...entry, recordedAt: m.recordedAt } : m));
      } else {
        next = [entry, ...meetingMinutes];
      }
      setMeetingMinutes(next);
      writeJSON(STORAGE_KEYS.meetingMinutes, next);
      return { ok: true };
    },
    [meetingMinutes]
  );

  const approveMinutes = useCallback(
    (meetingId, approverId) => {
      const next = meetings.map((m) =>
        m.id === meetingId ? { ...m, minutesApprovedAt: new Date().toISOString(), status: 'completed', closedAt: m.closedAt || new Date().toISOString() } : m
      );
      setMeetings(next);
      writeJSON(STORAGE_KEYS.meetings, next);

      const meeting = next.find((m) => m.id === meetingId);
      if (meeting) {
        const history = recordHistory(membershipHistory, {
          type: 'minutes_approved',
          branchId: meeting.branchId,
          meetingId,
          by: approverId,
        });
        setMembershipHistory(history);
      }
      return { ok: true };
    },
    [meetings, membershipHistory]
  );

  // ---- Decisions / Voting (IBARA YA 36) ----
  const proposeDecision = useCallback(
    ({ meetingId, description, proposedBy, threshold }) => {
      if (!description?.trim()) return { ok: false, error: 'Decision description is required.' };
      const meeting = meetings.find((m) => m.id === meetingId);
      if (!meeting) return { ok: false, error: 'Meeting not found.' };
      const decision = {
        id: genId('dec'),
        meetingId,
        description: description.trim(),
        proposedBy: proposedBy || null,
        threshold: threshold ?? DEFAULT_DECISION_THRESHOLD,
        proposedAt: new Date().toISOString(),
        ballots: [], // memberId -> 'for' | 'against' | 'abstain'
        closedAt: null,
        outcome: null, // 'passed' | 'failed' | 'pending'
      };
      const next = [decision, ...meetingDecisions];
      setMeetingDecisions(next);
      writeJSON(STORAGE_KEYS.meetingDecisions, next);
      return { ok: true, decision };
    },
    [meetings, meetingDecisions]
  );

  const castMeetingVote = useCallback(
    (decisionId, voterId, choice) => {
      if (!['for', 'against', 'abstain'].includes(choice)) {
        return { ok: false, error: 'Vote choice must be for, against, or abstain.' };
      }
      const decision = meetingDecisions.find((d) => d.id === decisionId);
      if (!decision) return { ok: false, error: 'Decision not found.' };
      if (decision.closedAt) return { ok: false, error: 'Voting has closed.' };

      const voter = students.find((s) => s.id === voterId);
      if (!voter || voter.status !== 'active') {
        return { ok: false, error: 'Only active members can vote.' };
      }

      const filtered = decision.ballots.filter((b) => b.voterId !== voterId);
      const updated = {
        ...decision,
        ballots: [...filtered, { voterId, choice, castAt: new Date().toISOString() }],
      };
      const next = meetingDecisions.map((d) => (d.id === decisionId ? updated : d));
      setMeetingDecisions(next);
      writeJSON(STORAGE_KEYS.meetingDecisions, next);
      return { ok: true, decision: updated };
    },
    [meetingDecisions, students]
  );

  const closeDecision = useCallback(
    (decisionId, actorId) => {
      const decision = meetingDecisions.find((d) => d.id === decisionId);
      if (!decision) return { ok: false, error: 'Decision not found.' };
      if (decision.closedAt) return { ok: false, error: 'Decision already closed.' };

      // IBARA YA 36 — tie = chair casts deciding vote; we just resolve by
      // counting 'for' vs 'against' and applying the threshold.
      const forCount = decision.ballots.filter((b) => b.choice === 'for').length;
      const againstCount = decision.ballots.filter((b) => b.choice === 'against').length;
      const abstainCount = decision.ballots.filter((b) => b.choice === 'abstain').length;
      const considered = forCount + againstCount;
      const forRatio = considered > 0 ? forCount / considered : 0;
      const passed = forRatio >= (decision.threshold ?? DEFAULT_DECISION_THRESHOLD);

      const updated = {
        ...decision,
        closedAt: new Date().toISOString(),
        closedBy: actorId || null,
        outcome: passed ? 'passed' : 'failed',
        counts: { for: forCount, against: againstCount, abstain: abstainCount },
      };
      const next = meetingDecisions.map((d) => (d.id === decisionId ? updated : d));
      setMeetingDecisions(next);
      writeJSON(STORAGE_KEYS.meetingDecisions, next);

      // Approval of minutes / closing the meeting follows when its decisions
      // have all been tallied — the secretary can trigger that explicitly.
      return { ok: true, decision: updated };
    },
    [meetingDecisions]
  );

  // =========================================================================
  // IBARA YA 38–41 — Treasury (Hazina)
  // =========================================================================

  const walletsForBranch = useCallback(
    (branchId) => wallets.filter((w) => w.branchId === branchId),
    [wallets]
  );

  const transactionsForBranch = useCallback(
    (branchId) =>
      transactions
        .filter((t) => t.branchId === branchId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [transactions]
  );

  const createWallet = useCallback(
    ({ branchId, type, accountName, accountNumber, provider, currency = CURRENCY }) => {
      if (!accountName?.trim() || !accountNumber?.trim()) {
        return { ok: false, error: 'Account name and number are required.' };
      }
      const wallet = {
        id: genId('wlt'),
        branchId,
        type: type || 'mobile_money',
        accountName: accountName.trim(),
        accountNumber: accountNumber.trim(),
        provider: provider?.trim() || null,
        currency,
        signatories: [],
        active: true,
        createdAt: new Date().toISOString(),
      };
      const next = [wallet, ...wallets];
      setWallets(next);
      writeJSON(STORAGE_KEYS.wallets, next);
      return { ok: true, wallet };
    },
    [wallets]
  );

  // IBARA YA 40 — record a transaction (income or expense)
  const recordTransaction = useCallback(
    ({ branchId, walletId, type, category, amount, date, description, recordedBy, isReimbursement = false }) => {
      if (type !== 'income' && type !== 'expense') {
        return { ok: false, error: 'Transaction type must be income or expense.' };
      }
      if (!category) return { ok: false, error: 'Category is required.' };
      const numAmount = Number(amount);
      if (!numAmount || numAmount <= 0) return { ok: false, error: 'Amount must be positive.' };

      const validCats = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
      const cat = validCats.find((c) => c.id === category);
      if (!cat) return { ok: false, error: 'Unknown category for this transaction type.' };

      const isMajor = type === 'expense' && numAmount >= DEFAULT_MAJOR_EXPENSE_THRESHOLD;

      const tx = {
        id: genId('tx'),
        branchId,
        walletId: walletId || null,
        type,
        category,
        amount: numAmount,
        currency: CURRENCY,
        date: date ? new Date(date).toISOString() : new Date().toISOString(),
        description: description?.trim() || '',
        recordedBy: recordedBy || null,
        // Major expenses need approval (IBARA YA 39)
        status: isMajor ? 'pending' : 'approved',
        approvedBy: isMajor ? null : (recordedBy || null),
        receipts: [], // [fileUrl]
        isReimbursement: !!isReimbursement,
        createdAt: new Date().toISOString(),
      };
      const next = [tx, ...transactions];
      setTransactions(next);
      writeJSON(STORAGE_KEYS.transactions, next);
      return { ok: true, transaction: tx };
    },
    [transactions]
  );

  const approveTransaction = useCallback(
    (transactionId, approverId) => {
      const next = transactions.map((t) =>
        t.id === transactionId ? { ...t, status: 'approved', approvedBy: approverId, approvedAt: new Date().toISOString() } : t
      );
      setTransactions(next);
      writeJSON(STORAGE_KEYS.transactions, next);
      return { ok: true };
    },
    [transactions]
  );

  const rejectTransaction = useCallback(
    (transactionId, approverId, reason) => {
      const next = transactions.map((t) =>
        t.id === transactionId
          ? { ...t, status: 'rejected', approvedBy: approverId, rejectedAt: new Date().toISOString(), rejectionReason: reason?.trim() || '' }
          : t
      );
      setTransactions(next);
      writeJSON(STORAGE_KEYS.transactions, next);
      return { ok: true };
    },
    [transactions]
  );

  // IBARA YA 39 — derived balance & burn
  const treasuryForBranch = useCallback(
    (branchId) => {
      const list = transactions.filter((t) => t.branchId === branchId && t.status === 'approved');
      const income = list.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const expense = list.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      return {
        income,
        expense,
        balance: income - expense,
        currency: CURRENCY,
        totalTransactions: list.length,
      };
    },
    [transactions]
  );

  const expensesByCategory = useCallback(
    (branchId) => {
      const map = {};
      transactions
        .filter((t) => t.branchId === branchId && t.type === 'expense' && t.status === 'approved')
        .forEach((t) => {
          map[t.category] = (map[t.category] || 0) + t.amount;
        });
      return map;
    },
    [transactions]
  );

  // IBARA YA 39 — budgets (annual/term)
  const budgetForBranch = useCallback(
    (branchId) => {
      const list = budgets.filter((b) => b.branchId === branchId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return list[0] || null;
    },
    [budgets]
  );

  const createBudget = useCallback(
    ({ branchId, period, totalIncome, totalExpense, categories, approvedBy }) => {
      const budget = {
        id: genId('bdg'),
        branchId,
        period: period?.trim() || 'Current term',
        totalIncome: Number(totalIncome) || 0,
        totalExpense: Number(totalExpense) || 0,
        categories: (categories || []).map((c) => ({
          name: c.name,
          category: c.category || null,
          allocated: Number(c.allocated) || 0,
          spent: 0,
        })),
        approvedBy: approvedBy || null,
        createdAt: new Date().toISOString(),
      };
      const next = [budget, ...budgets];
      setBudgets(next);
      writeJSON(STORAGE_KEYS.budgets, next);
      return { ok: true, budget };
    },
    [budgets]
  );

  // IBARA YA 38 — member dues
  const duesForBranch = useCallback(
    (branchId) => dues.filter((d) => d.branchId === branchId),
    [dues]
  );

  const createDuesAssessment = useCallback(
    ({ branchId, memberId, amount, dueDate, note }) => {
      const due = {
        id: genId('due'),
        branchId,
        memberId,
        amount: Number(amount) || 0,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        note: note?.trim() || '',
        status: 'pending',
        paidDate: null,
        createdAt: new Date().toISOString(),
      };
      const next = [due, ...dues];
      setDues(next);
      writeJSON(STORAGE_KEYS.dues, next);
      return { ok: true, due };
    },
    [dues]
  );

  const markDuePaid = useCallback(
    (dueId, paymentTxId = null) => {
      const next = dues.map((d) =>
        d.id === dueId
          ? { ...d, status: 'paid', paidDate: new Date().toISOString(), paymentTxId }
          : d
      );
      setDues(next);
      writeJSON(STORAGE_KEYS.dues, next);
      return { ok: true };
    },
    [dues]
  );

  // IBARA YA 41 — audit log
  const requestAudit = useCallback(
    ({ branchId, requestedBy, scope, note }) => {
      const entry = {
        id: genId('aud'),
        branchId,
        requestedBy: requestedBy || null,
        scope: scope?.trim() || 'all',
        note: note?.trim() || '',
        status: 'requested',
        requestedAt: new Date().toISOString(),
        completedAt: null,
        findings: [],
      };
      const next = [entry, ...auditLogs];
      setAuditLogs(next);
      writeJSON(STORAGE_KEYS.auditLogs, next);
      return { ok: true, audit: entry };
    },
    [auditLogs]
  );

  const completeAudit = useCallback(
    (auditId, completedBy, findings) => {
      const next = auditLogs.map((a) =>
        a.id === auditId
          ? { ...a, status: 'completed', completedBy, completedAt: new Date().toISOString(), findings: findings || [] }
          : a
      );
      setAuditLogs(next);
      writeJSON(STORAGE_KEYS.auditLogs, next);
      return { ok: true };
    },
    [auditLogs]
  );

  // =========================================================================
  // IBARA YA 42 — Code of Conduct
  // =========================================================================
  const signCodeOfConduct = useCallback(
    ({ memberId, signatureText }) => {
      const existing = codeOfConductSignatures.find(
        (s) => s.memberId === memberId && s.version === CODE_OF_CONDUCT.version
      );
      if (existing) return { ok: false, error: 'You have already signed this version.', signature: existing };
      const sig = {
        id: genId('coc'),
        memberId,
        signatureText: signatureText?.trim() || memberId,
        version: CODE_OF_CONDUCT.version,
        signedAt: new Date().toISOString(),
      };
      const next = [sig, ...codeOfConductSignatures];
      setCodeOfConductSignatures(next);
      writeJSON(STORAGE_KEYS.codeOfConductSignatures, next);
      return { ok: true, signature: sig };
    },
    [codeOfConductSignatures]
  );

  const hasSignedConduct = useCallback(
    (memberId) =>
      codeOfConductSignatures.some(
        (s) => s.memberId === memberId && s.version === CODE_OF_CONDUCT.version
      ),
    [codeOfConductSignatures]
  );

  // =========================================================================
  // IBARA YA 43 — Conflict of interest disclosure
  // =========================================================================
  const declareConflict = useCallback(
    ({ memberId, decisionContext, nature, recused = false }) => {
      if (!nature?.trim()) return { ok: false, error: 'Describe the nature of the conflict.' };
      const entry = {
        id: genId('cnf'),
        memberId,
        decisionContext: decisionContext?.trim() || '',
        nature: nature.trim(),
        recused: !!recused,
        disclosedAt: new Date().toISOString(),
      };
      const next = [entry, ...conflicts];
      setConflicts(next);
      writeJSON(STORAGE_KEYS.conflicts, next);
      return { ok: true, conflict: entry };
    },
    [conflicts]
  );

  const conflictsForMember = useCallback(
    (memberId) => conflicts.filter((c) => c.memberId === memberId),
    [conflicts]
  );

  // =========================================================================
  // IBARA YA 44 — Intellectual property registry
  // =========================================================================
  const registerIP = useCallback(
    ({ branchId, innovatorId, title, description, type, fundingSource, ownershipTerms, showcaseConsent }) => {
      if (!title?.trim()) return { ok: false, error: 'Title is required.' };
      if (!description?.trim()) return { ok: false, error: 'Description is required.' };
      if (!IP_TYPES.some((t) => t.id === type)) return { ok: false, error: 'Invalid IP type.' };

      const innovator = students.find((s) => s.id === innovatorId);
      if (!innovator) return { ok: false, error: 'Innovator not found.' };

      // IBARA YA 44 — IP stays with innovator unless otherwise agreed
      const entry = {
        id: genId('ip'),
        branchId,
        innovatorId,
        title: title.trim(),
        description: description.trim(),
        type,
        fundingSource: fundingSource?.trim() || 'Self-funded',
        ownershipTerms:
          ownershipTerms?.trim() ||
          'Inventor retains 100% IP. Club showcase consent granted.',
        showcaseConsent: !!showcaseConsent,
        registeredAt: new Date().toISOString(),
        // Lightweight evidence hash so we can demonstrate immutability later
        evidenceHash: `ip-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      };
      const next = [entry, ...ipRegistry];
      setIpRegistry(next);
      writeJSON(STORAGE_KEYS.ipRegistry, next);

      // Mirror into membership history
      const history = recordHistory(membershipHistory, {
        type: 'ip_registered',
        branchId,
        innovatorId,
        ipId: entry.id,
      });
      setMembershipHistory(history);

      return { ok: true, entry };
    },
    [ipRegistry, students, membershipHistory]
  );

  const ipForBranch = useCallback(
    (branchId) => ipRegistry.filter((i) => i.branchId === branchId),
    [ipRegistry]
  );

  const ipForInnovator = useCallback(
    (memberId) => ipRegistry.filter((i) => i.innovatorId === memberId),
    [ipRegistry]
  );

  const updateIPShowcaseConsent = useCallback(
    (ipId, consent) => {
      const next = ipRegistry.map((i) =>
        i.id === ipId ? { ...i, showcaseConsent: !!consent, updatedAt: new Date().toISOString() } : i
      );
      setIpRegistry(next);
      writeJSON(STORAGE_KEYS.ipRegistry, next);
      return { ok: true };
    },
    [ipRegistry]
  );

  // =========================================================================
  // IBARA YA 45 — Disciplinary procedure
  // =========================================================================

  const fileComplaint = useCallback(
    ({ branchId, respondentId, complainantId, complaintText, evidence, sanctionRequested }) => {
      if (!complaintText?.trim()) return { ok: false, error: 'Complaint text is required.' };
      const respondent = students.find((s) => s.id === respondentId);
      if (!respondent) return { ok: false, error: 'Respondent not found in this branch.' };
      const case_ = {
        id: genId('case'),
        branchId,
        complainantId,
        respondentId,
        complaintText: complaintText.trim(),
        evidence: evidence || [],
        sanctionRequested: sanctionRequested || null,
        status: 'filed',
        filedAt: new Date().toISOString(),
        investigationNotes: '',
        hearingDate: null,
        sanction: null,
        sanctionAppliedAt: null,
        sanctionAppliedBy: null,
        appealText: null,
        appealFiledAt: null,
        appealDecision: null,
        appealResolvedAt: null,
      };
      const next = [case_, ...disciplinaryCases];
      setDisciplinaryCases(next);
      writeJSON(STORAGE_KEYS.disciplinaryCases, next);
      return { ok: true, case: case_ };
    },
    [disciplinaryCases, students]
  );

  const casesForBranch = useCallback(
    (branchId) => disciplinaryCases.filter((c) => c.branchId === branchId),
    [disciplinaryCases]
  );

  const caseById = useCallback(
    (id) => disciplinaryCases.find((c) => c.id === id) || null,
    [disciplinaryCases]
  );

  const casesForMember = useCallback(
    (memberId) =>
      disciplinaryCases.filter(
        (c) => c.respondentId === memberId || c.complainantId === memberId
      ),
    [disciplinaryCases]
  );

  const updateCaseStatus = useCallback(
    (caseId, status, patch = {}) => {
      const next = disciplinaryCases.map((c) =>
        c.id === caseId
          ? {
              ...c,
              ...patch,
              status,
              ...(status === 'hearing_scheduled' && !c.hearingDate ? { hearingDate: patch.hearingDate || new Date(Date.now() + 7 * 86400000).toISOString() } : {}),
            }
          : c
      );
      setDisciplinaryCases(next);
      writeJSON(STORAGE_KEYS.disciplinaryCases, next);
      return { ok: true };
    },
    [disciplinaryCases]
  );

  const applySanction = useCallback(
    ({ caseId, sanction, sanctionDetails, actorId }) => {
      const def = SANCTION_LEVELS.find((s) => s.id === sanction);
      if (!def) return { ok: false, error: 'Unknown sanction.' };

      const target = disciplinaryCases.find((c) => c.id === caseId);
      if (!target) return { ok: false, error: 'Case not found.' };

      // Apply corresponding side-effects to membership status (IBARA YA 16)
      if (sanction === 'suspension') {
        suspendMember(target.respondentId, actorId, sanctionDetails || 'Disciplinary suspension');
      } else if (sanction === 'expulsion') {
        expelMember(target.respondentId, actorId, sanctionDetails || 'Disciplinary expulsion');
      } else if (sanction === 'removal_from_office') {
        const exec = executivesForBranch(target.branchId).find((e) => e.memberId === target.respondentId);
        if (exec) removeExecutive(exec.id, 'sanction: removal_from_office');
      }

      const next = disciplinaryCases.map((c) =>
        c.id === caseId
          ? {
              ...c,
              status: 'resolved',
              sanction,
              sanctionDetails: sanctionDetails || def.description,
              sanctionAppliedAt: new Date().toISOString(),
              sanctionAppliedBy: actorId || null,
            }
          : c
      );
      setDisciplinaryCases(next);
      writeJSON(STORAGE_KEYS.disciplinaryCases, next);
      return { ok: true };
    },
    [disciplinaryCases, suspendMember, expelMember, removeExecutive, executivesForBranch]
  );

  const dismissCase = useCallback(
    (caseId, actorId, reason) => {
      const next = disciplinaryCases.map((c) =>
        c.id === caseId
          ? { ...c, status: 'dismissed', dismissedAt: new Date().toISOString(), dismissedBy: actorId, dismissalReason: reason?.trim() || '' }
          : c
      );
      setDisciplinaryCases(next);
      writeJSON(STORAGE_KEYS.disciplinaryCases, next);
      return { ok: true };
    },
    [disciplinaryCases]
  );

  const fileAppeal = useCallback(
    ({ caseId, memberId, appealText }) => {
      const trimmed = appealText?.trim();
      if (!trimmed) return { ok: false, error: 'Appeal text is required.' };
      const next = disciplinaryCases.map((c) =>
        c.id === caseId
          ? {
              ...c,
              status: 'appealed',
              appealText: trimmed,
              appealFiledAt: new Date().toISOString(),
            }
          : c
      );
      setDisciplinaryCases(next);
      writeJSON(STORAGE_KEYS.disciplinaryCases, next);
      return { ok: true };
    },
    [disciplinaryCases]
  );

  const resolveAppeal = useCallback(
    ({ caseId, decision, actorId, note }) => {
      const trimmedNote = note?.trim() || '';
      const next = disciplinaryCases.map((c) => {
        if (c.id !== caseId) return c;
        const newStatus = decision === 'uphold' ? 'appeal_upheld' : 'appeal_overturned';
        // IBARA YA 45 — if appeal is upheld (i.e. original sanction wrong), reinstate member
        if (decision === 'uphold' && c.respondentId) {
          reinstateMember(c.respondentId, actorId);
        }
        return {
          ...c,
          status: newStatus,
          appealDecision: decision,
          appealNote: trimmedNote,
          appealResolvedAt: new Date().toISOString(),
          appealResolvedBy: actorId || null,
        };
      });
      setDisciplinaryCases(next);
      writeJSON(STORAGE_KEYS.disciplinaryCases, next);
      return { ok: true };
    },
    [disciplinaryCases, reinstateMember]
  );

  // =========================================================================
  // IBARA YA 46 — Constitutional Amendments (⅔ majority)
  // =========================================================================

  const amendmentsForBranch = useCallback(
    (branchId) => amendments.filter((a) => a.branchId === branchId),
    [amendments]
  );

  const amendmentById = useCallback(
    (id) => amendments.find((a) => a.id === id) || null,
    [amendments]
  );

  const proposeAmendment = useCallback(
    ({ branchId, articleNumber, currentText, proposedText, rationale, proposedBy, quorumAtMeetingId }) => {
      if (!proposedText?.trim()) return { ok: false, error: 'Proposed text is required.' };
      if (articleNumber && !IBARA_LIST.find((a) => a.number === Number(articleNumber))) {
        return { ok: false, error: 'Unknown article number.' };
      }

      const amendment = {
        id: genId('amd'),
        branchId,
        articleNumber: Number(articleNumber) || null,
        currentText: currentText?.trim() || IBARA_LIST.find((a) => a.number === Number(articleNumber))?.kiswahili || '',
        proposedText: proposedText.trim(),
        rationale: rationale?.trim() || '',
        proposedBy: proposedBy || null,
        proposedAt: new Date().toISOString(),
        status: 'debating', // debating → voting → passed/rejected
        threshold: AMENDMENT_RULES.threshold,
        votesFor: 0,
        votesAgainst: 0,
        votesAbstain: 0,
        quorumAtMeetingId: quorumAtMeetingId || null,
        decidedAt: null,
        decidedAtMeetingId: null,
      };
      const next = [amendment, ...amendments];
      setAmendments(next);
      writeJSON(STORAGE_KEYS.amendments, next);

      const history = recordHistory(membershipHistory, {
        type: 'amendment_proposed',
        branchId,
        amendmentId: amendment.id,
        articleNumber: amendment.articleNumber,
        by: proposedBy,
      });
      setMembershipHistory(history);

      return { ok: true, amendment };
    },
    [amendments, membershipHistory]
  );

  const castAmendmentVote = useCallback(
    (amendmentId, voterId, choice) => {
      if (!['for', 'against', 'abstain'].includes(choice)) {
        return { ok: false, error: 'Choice must be for, against, or abstain.' };
      }
      const amendment = amendments.find((a) => a.id === amendmentId);
      if (!amendment) return { ok: false, error: 'Amendment not found.' };
      if (amendment.status !== 'voting' && amendment.status !== 'debating') {
        return { ok: false, error: 'Voting is not open.' };
      }

      const voter = students.find((s) => s.id === voterId);
      if (!voter || voter.status !== 'active') {
        return { ok: false, error: 'Only active members can vote on amendments.' };
      }

      // Re-vote replaces prior vote
      const filtered = amendmentVotes.filter(
        (v) => !(v.amendmentId === amendmentId && v.voterId === voterId)
      );
      const newBallot = {
        id: genId('av'),
        amendmentId,
        voterId,
        choice,
        castAt: new Date().toISOString(),
      };
      const nextVotes = [...filtered, newBallot];
      setAmendmentVotes(nextVotes);
      writeJSON(STORAGE_KEYS.amendmentVotes, nextVotes);
      return { ok: true };
    },
    [amendments, amendmentVotes, students]
  );

  const openAmendmentVoting = useCallback(
    (amendmentId, meetingId) => {
      const next = amendments.map((a) =>
        a.id === amendmentId ? { ...a, status: 'voting', votingOpenedAt: new Date().toISOString(), quorumAtMeetingId: meetingId || a.quorumAtMeetingId || null } : a
      );
      setAmendments(next);
      writeJSON(STORAGE_KEYS.amendments, next);
      return { ok: true };
    },
    [amendments]
  );

  const tallyAndCloseAmendment = useCallback(
    (amendmentId, decisionMeetingId) => {
      const amendment = amendments.find((a) => a.id === amendmentId);
      if (!amendment) return { ok: false, error: 'Amendment not found.' };

      const votes = amendmentVotes.filter((v) => v.amendmentId === amendmentId);
      const votesFor = votes.filter((v) => v.choice === 'for').length;
      const votesAgainst = votes.filter((v) => v.choice === 'against').length;
      const votesAbstain = votes.filter((v) => v.choice === 'abstain').length;
      const considered = votesFor + votesAgainst;
      const forRatio = considered > 0 ? votesFor / considered : 0;
      const passed = forRatio >= amendment.threshold;
      const status = passed ? 'passed' : 'rejected';

      const next = amendments.map((a) =>
        a.id === amendmentId
          ? { ...a, votesFor, votesAgainst, votesAbstain, status, decidedAt: new Date().toISOString(), decidedAtMeetingId: decisionMeetingId || null }
          : a
      );
      setAmendments(next);
      writeJSON(STORAGE_KEYS.amendments, next);

      const history = recordHistory(membershipHistory, {
        type: passed ? 'amendment_passed' : 'amendment_rejected',
        branchId: amendment.branchId,
        amendmentId,
        articleNumber: amendment.articleNumber,
      });
      setMembershipHistory(history);

      return { ok: true, passed, votesFor, votesAgainst, votesAbstain };
    },
    [amendments, amendmentVotes, membershipHistory]
  );

  const hasVotedOnAmendment = useCallback(
    (amendmentId, voterId) =>
      amendmentVotes.some((v) => v.amendmentId === amendmentId && v.voterId === voterId),
    [amendmentVotes]
  );

  const votesOnAmendment = useCallback(
    (amendmentId) => amendmentVotes.filter((v) => v.amendmentId === amendmentId),
    [amendmentVotes]
  );

  // =========================================================================
  // IBARA YA 47 — Dissolution (¾ majority + asset transfer)
  // =========================================================================

  const dissolutionForBranch = useCallback(
    (branchId) => dissolutions.find((d) => d.branchId === branchId) || null,
    [dissolutions]
  );

  const openDissolutionVote = useCallback(
    ({ branchId, reason, initiatedBy, assetRecipients }) => {
      if (!reason?.trim()) return { ok: false, error: 'A reason for dissolution is required.' };
      if (!Array.isArray(assetRecipients) || assetRecipients.length === 0) {
        return { ok: false, error: 'At least one asset recipient must be specified.' };
      }

      const dissolution = {
        id: genId('dis'),
        branchId,
        reason: reason.trim(),
        initiatedBy: initiatedBy || null,
        initiatedAt: new Date().toISOString(),
        threshold: DISSOLUTION_RULES.threshold,
        status: 'voting',
        assetRecipients,
        votesFor: 0,
        votesAgainst: 0,
        votesAbstain: 0,
        notificationsSent: false,
        executedAt: null,
      };
      const next = [dissolution, ...dissolutions];
      setDissolutions(next);
      writeJSON(STORAGE_KEYS.dissolutions, next);

      const history = recordHistory(membershipHistory, {
        type: 'dissolution_opened',
        branchId,
        dissolutionId: dissolution.id,
        by: initiatedBy,
      });
      setMembershipHistory(history);

      return { ok: true, dissolution };
    },
    [dissolutions, membershipHistory]
  );

  const castDissolutionVote = useCallback(
    (dissolutionId, voterId, choice) => {
      if (!['for', 'against', 'abstain'].includes(choice)) {
        return { ok: false, error: 'Choice must be for, against, or abstain.' };
      }
      const dissolution = dissolutions.find((d) => d.id === dissolutionId);
      if (!dissolution) return { ok: false, error: 'Dissolution motion not found.' };
      if (dissolution.status !== 'voting') return { ok: false, error: 'Voting is closed.' };

      // Re-vote: replace prior vote from same voter
      const existing = dissolutions.find((d) => d.id === dissolutionId);
      const others = dissolutions.filter((d) => d.id !== dissolutionId);
      const voter = students.find((s) => s.id === voterId);
      if (!voter || voter.status !== 'active') {
        return { ok: false, error: 'Only active members can vote.' };
      }
      const tally = existing.votes || [];
      const filtered = tally.filter((v) => v.voterId !== voterId);
      const nextTally = [...filtered, { voterId, choice, castAt: new Date().toISOString() }];
      const counted = nextTally.reduce(
        (acc, v) => {
          acc[v.choice] = (acc[v.choice] || 0) + 1;
          return acc;
        },
        { for: 0, against: 0, abstain: 0 }
      );
      const updated = { ...existing, votes: nextTally, ...counted };
      const next = [updated, ...others];
      setDissolutions(next);
      writeJSON(STORAGE_KEYS.dissolutions, next);
      return { ok: true };
    },
    [dissolutions, students]
  );

  const closeDissolution = useCallback(
    (dissolutionId, actorId) => {
      const d = dissolutions.find((x) => x.id === dissolutionId);
      if (!d) return { ok: false, error: 'Not found.' };
      const considered = (d.votesFor || 0) + (d.votesAgainst || 0);
      const forRatio = considered > 0 ? d.votesFor / considered : 0;
      const passed = forRatio >= d.threshold;
      const next = dissolutions.map((x) =>
        x.id === dissolutionId
          ? { ...x, status: passed ? 'passed' : 'rejected', closedAt: new Date().toISOString(), closedBy: actorId || null }
          : x
      );
      setDissolutions(next);
      writeJSON(STORAGE_KEYS.dissolutions, next);

      if (passed) {
        // Mark the branch as dissolved in the clubs table
        const clubsNext = clubs.map((c) => (c.id === d.branchId ? { ...c, status: 'dissolved', dissolvedAt: new Date().toISOString() } : c));
        setClubs(clubsNext);
        writeJSON(STORAGE_KEYS.clubs, clubsNext);
      }

      const history = recordHistory(membershipHistory, {
        type: passed ? 'dissolution_passed' : 'dissolution_rejected',
        branchId: d.branchId,
        dissolutionId,
      });
      setMembershipHistory(history);

      return { ok: true, passed };
    },
    [dissolutions, clubs, membershipHistory]
  );

  const sendDissolutionNotifications = useCallback(
    (dissolutionId) => {
      const next = dissolutions.map((d) =>
        d.id === dissolutionId ? { ...d, notificationsSent: true, notificationsSentAt: new Date().toISOString() } : d
      );
      setDissolutions(next);
      writeJSON(STORAGE_KEYS.dissolutions, next);
      return { ok: true };
    },
    [dissolutions]
  );

  // =========================================================================
  // IBARA YA 48 — Onboarding new branches
  // =========================================================================

  const onboardingPlanForBranch = useCallback(
    (branchId) => onboardingPlans.find((p) => p.branchId === branchId) || null,
    [onboardingPlans]
  );

  const startOnboardingPlan = useCallback(
    ({ branchName, universityId, campus, address, patronId, initiatedBy }) => {
      if (!branchName?.trim()) return { ok: false, error: 'Branch name is required.' };
      if (!universityId) return { ok: false, error: 'University is required.' };

      const plan = {
        id: genId('ob'),
        branchId: null, // assigned when go-live creates the club record
        branchName: branchName.trim(),
        universityId,
        campus: campus?.trim() || '',
        address: address?.trim() || '',
        patronId: patronId || null,
        initiatedBy: initiatedBy || null,
        createdAt: new Date().toISOString(),
        steps: ONBOARDING_STEPS.map((s) => ({
          id: s.id,
          label: s.label,
          description: s.description,
          status: s.id === 'name' ? 'completed' : 'pending',
        })),
        status: 'in_progress',
      };
      const next = [plan, ...onboardingPlans];
      setOnboardingPlans(next);
      writeJSON(STORAGE_KEYS.onboardingPlans, next);

      const history = recordHistory(membershipHistory, {
        type: 'onboarding_started',
        branchId: null,
        note: branchName.trim(),
      });
      setMembershipHistory(history);

      return { ok: true, plan };
    },
    [onboardingPlans, membershipHistory]
  );

  const completeOnboardingStep = useCallback(
    (planId, stepId, actorId) => {
      const next = onboardingPlans.map((p) => {
        if (p.id !== planId) return p;
        const steps = p.steps.map((s) =>
          s.id === stepId ? { ...s, status: 'completed', completedAt: new Date().toISOString(), completedBy: actorId || null } : s
        );
        const allDone = steps.every((s) => s.status === 'completed');
        return { ...p, steps, status: allDone ? 'completed' : 'in_progress', completedAt: allDone ? new Date().toISOString() : null };
      });
      setOnboardingPlans(next);
      writeJSON(STORAGE_KEYS.onboardingPlans, next);
      return { ok: true };
    },
    [onboardingPlans]
  );

  const activateBranchFromPlan = useCallback(
    (planId, actorId) => {
      const plan = onboardingPlans.find((p) => p.id === planId);
      if (!plan) return { ok: false, error: 'Plan not found.' };
      if (!plan.steps.every((s) => s.status === 'completed')) {
        return { ok: false, error: 'Complete every onboarding step before activation.' };
      }
      const newBranch = {
        id: `club-${plan.universityId}-${Date.now().toString(36)}`,
        name: plan.branchName,
        universityId: plan.universityId,
        patronId: plan.patronId,
        campus: plan.campus,
        address: plan.address,
        foundedAt: new Date().toISOString(),
        status: 'active',
        charterSignedAt: new Date().toISOString(),
        createdByAdmin: false,
      };
      const nextClubs = [newBranch, ...clubs];
      setClubs(nextClubs);
      writeJSON(STORAGE_KEYS.clubs, nextClubs);

      const nextPlans = onboardingPlans.map((p) =>
        p.id === planId ? { ...p, branchId: newBranch.id, status: 'activated', activatedAt: new Date().toISOString() } : p
      );
      setOnboardingPlans(nextPlans);
      writeJSON(STORAGE_KEYS.onboardingPlans, nextPlans);

      const history = recordHistory(membershipHistory, {
        type: 'branch_activated',
        branchId: newBranch.id,
        note: plan.branchName,
        by: actorId,
      });
      setMembershipHistory(history);

      return { ok: true, branch: newBranch };
    },
    [onboardingPlans, clubs, membershipHistory]
  );

  // =========================================================================
  // i18n + preferences (IBARA 48.3 — working language)
  // =========================================================================

  const setLanguage = useCallback(
    (language) => {
      if (!['en', 'sw'].includes(language)) return { ok: false };
      const next = { ...preferences, language };
      setPreferences(next);
      writeJSON(STORAGE_KEYS.preferences, next);
      return { ok: true };
    },
    [preferences]
  );

  // =========================================================================
  // Derived helpers
  // =========================================================================
  const isActive = useCallback(
    (studentId) => {
      const s = students.find((x) => x.id === studentId);
      return !!s && s.status === 'active';
    },
    [students]
  );

  const isVerified = useCallback(
    (studentId) => {
      const s = students.find((x) => x.id === studentId);
      return !!s && (s.status === 'active' || s.status === 'pending');
    },
    [students]
  );

  const statsForUniversity = useCallback(
    (universityId) => {
      const list = students.filter((s) => s.universityId === universityId);
      return {
        pending: list.filter((s) => s.status === 'pending').length,
        active: list.filter((s) => s.status === 'active').length,
        rejected: list.filter((s) => s.status === 'rejected').length,
        suspended: list.filter((s) => s.status === 'suspended').length,
        expelled: list.filter((s) => s.status === 'expelled').length,
        withdrawn: list.filter((s) => s.status === 'withdrawn').length,
        total: list.length,
      };
    },
    [students]
  );

  const historyForMember = useCallback(
    (memberId) => membershipHistory.filter((h) => h.memberId === memberId),
    [membershipHistory]
  );

  const value = useMemo(
    () => ({
      // Static config
      universities: UNIVERSITIES,
      memberCategories: MEMBER_CATEGORIES,
      executivePositions: EXECUTIVE_POSITIONS,
      findPosition,
      termConfig: TERM,
      zsaHQ: ZSA_HQ,
      findUniversity,

      // Phase 6 — Constitution
      constitutionMeta: CONSTITUTION_META,
      ibaraList: IBARA_LIST,
      suraList: SURA_LIST,
      amendmentRules: AMENDMENT_RULES,
      dissolutionRules: DISSOLUTION_RULES,
      onboardingSteps: ONBOARDING_STEPS,

      // State
      students,
      clubLeaders,
      clubs,
      clubProjects,
      currentStudent,
      currentClubLeader,
      membershipHistory,
      executives,
      handoverLogs,
      elections,
      ballots,
      electionCommittees,
      meetings,
      meetingAttendance,
      meetingMinutes,
      meetingDecisions,
      wallets,
      transactions,
      budgets,
      dues,
      auditLogs,
      codeOfConductSignatures,
      conflicts,
      ipRegistry,
      disciplinaryCases,
      amendments,
      amendmentVotes,
      dissolutions,
      onboardingPlans,
      preferences,
      amendments,
      amendmentVotes,
      dissolutions,
      onboardingPlans,
      preferences,
      elections,
      ballots,
      electionCommittees,
      meetings,
      meetingAttendance,
      meetingMinutes,
      meetingDecisions,
      wallets,
      transactions,
      budgets,
      dues,
      auditLogs,
      codeOfConductSignatures,
      conflicts,
      ipRegistry,
      disciplinaryCases,
      amendments,
      amendmentVotes,
      dissolutions,
      onboardingPlans,
      preferences,

      // Auth
      registerStudent,
      loginStudent,
      loginClubLeader,
      logoutClub,
      refreshCurrentStudent,

      // Lifecycle actions (IBARA YA 13, 16)
      approveMember,
      rejectMember,
      withdrawMembership,
      suspendMember,
      reinstateMember,
      expelMember,

      // Backwards-compat aliases (legacy student-only call sites)
      approveStudent: approveMember,
      rejectStudent: rejectMember,

      // Leader queue
      pendingQueueForLeader,
      recentDecisionsForLeader,

      // Phase 6 — Amendments + Dissolution + Onboarding
      amendmentsForBranch,
      amendmentById,
      proposeAmendment,
      openAmendmentVoting,
      castAmendmentVote,
      hasVotedOnAmendment,
      votesOnAmendment,
      tallyAndCloseAmendment,
      dissolutionForBranch,
      openDissolutionVote,
      castDissolutionVote,
      closeDissolution,
      sendDissolutionNotifications,
      onboardingPlanForBranch,
      startOnboardingPlan,
      completeOnboardingStep,
      activateBranchFromPlan,

      // i18n
      setLanguage,

      // Branches (IBARA YA 4)
      branchByUniversityId,
      branchById,
      patronForBranch,
      membersForBranch,
      branchStats,

      // Executive Committee (IBARA YA 17, 19, 23–29, 33)
      executivesForBranch,
      executiveForPosition,
      memberForExecutive,
      canRunForPosition,
      appointExecutive,
      removeExecutive,
      recordHandover,
      handoverForExecutive,
      electionsForBranch,
      electionById,
      activeElectionForPosition,
      nominationsForElection,
      ballotsForElection,
      hasVoted,
      committeeForBranch,
      formElectionCommittee,
      announceElection,
      submitNomination,
      advanceElectionStage,
      castBallot,
      tallyAndClose,
      installElectionWinner,
      fileElectionComplaint,
      resolveElectionComplaint,
      openVoteOfNoConfidence,
      meetingsForBranch,
      meetingById,
      attendanceForMeeting,
      minutesForMeeting,
      decisionsForMeeting,
      quorumForMeeting,
      scheduleMeeting,
      notifyMembers,
      startMeeting,
      cancelMeeting,
      recordAttendance,
      saveMinutes,
      approveMinutes,
      proposeDecision,
      castMeetingVote,
      closeDecision,
      walletsForBranch,
      transactionsForBranch,
      createWallet,
      recordTransaction,
      approveTransaction,
      rejectTransaction,
      treasuryForBranch,
      expensesByCategory,
      budgetForBranch,
      createBudget,
      duesForBranch,
      createDuesAssessment,
      markDuePaid,
      requestAudit,
      completeAudit,
      signCodeOfConduct,
      hasSignedConduct,
      declareConflict,
      conflictsForMember,
      registerIP,
      ipForBranch,
      ipForInnovator,
      updateIPShowcaseConsent,
      fileComplaint,
      casesForBranch,
      caseById,
      casesForMember,
      updateCaseStatus,
      applySanction,
      dismissCase,
      fileAppeal,
      resolveAppeal,

      // Executive Committee (IBARA YA 17, 19, 23–29, 33)
      executivesForBranch,
      executiveForPosition,
      memberForExecutive,
      canRunForPosition,
      appointExecutive,
      removeExecutive,
      recordHandover,
      handoverForExecutive,
      electionsForBranch,
      electionById,
      activeElectionForPosition,
      nominationsForElection,
      ballotsForElection,
      hasVoted,
      committeeForBranch,
      formElectionCommittee,
      announceElection,
      submitNomination,
      advanceElectionStage,
      castBallot,
      tallyAndClose,
      installElectionWinner,
      fileElectionComplaint,
      resolveElectionComplaint,
      openVoteOfNoConfidence,
      meetingsForBranch,
      meetingById,
      attendanceForMeeting,
      minutesForMeeting,
      decisionsForMeeting,
      quorumForMeeting,
      scheduleMeeting,
      notifyMembers,
      startMeeting,
      cancelMeeting,
      recordAttendance,
      saveMinutes,
      approveMinutes,
      proposeDecision,
      castMeetingVote,
      closeDecision,
      walletsForBranch,
      transactionsForBranch,
      createWallet,
      recordTransaction,
      approveTransaction,
      rejectTransaction,
      treasuryForBranch,
      expensesByCategory,
      budgetForBranch,
      createBudget,
      duesForBranch,
      createDuesAssessment,
      markDuePaid,
      requestAudit,
      completeAudit,
      signCodeOfConduct,
      hasSignedConduct,
      declareConflict,
      conflictsForMember,
      registerIP,
      ipForBranch,
      ipForInnovator,
      updateIPShowcaseConsent,
      fileComplaint,
      casesForBranch,
      caseById,
      casesForMember,
      updateCaseStatus,
      applySanction,
      dismissCase,
      fileAppeal,
      resolveAppeal,

      // Elections (IBARA YA 30–34)
      electionsForBranch,
      electionById,
      activeElectionForPosition,
      nominationsForElection,
      ballotsForElection,
      hasVoted,
      committeeForBranch,
      formElectionCommittee,
      announceElection,
      submitNomination,
      advanceElectionStage,
      castBallot,
      tallyAndClose,
      installElectionWinner,
      fileElectionComplaint,
      resolveElectionComplaint,
      openVoteOfNoConfidence,
      meetingsForBranch,
      meetingById,
      attendanceForMeeting,
      minutesForMeeting,
      decisionsForMeeting,
      quorumForMeeting,
      scheduleMeeting,
      notifyMembers,
      startMeeting,
      cancelMeeting,
      recordAttendance,
      saveMinutes,
      approveMinutes,
      proposeDecision,
      castMeetingVote,
      closeDecision,
      walletsForBranch,
      transactionsForBranch,
      createWallet,
      recordTransaction,
      approveTransaction,
      rejectTransaction,
      treasuryForBranch,
      expensesByCategory,
      budgetForBranch,
      createBudget,
      duesForBranch,
      createDuesAssessment,
      markDuePaid,
      requestAudit,
      completeAudit,
      signCodeOfConduct,
      hasSignedConduct,
      declareConflict,
      conflictsForMember,
      registerIP,
      ipForBranch,
      ipForInnovator,
      updateIPShowcaseConsent,
      fileComplaint,
      casesForBranch,
      caseById,
      casesForMember,
      updateCaseStatus,
      applySanction,
      dismissCase,
      fileAppeal,
      resolveAppeal,

      // Meetings (IBARA YA 35–37)
      meetingTypes: MEETING_TYPES,
      findMeetingType,
      meetingsForBranch,
      meetingById,
      attendanceForMeeting,
      minutesForMeeting,
      decisionsForMeeting,
      quorumForMeeting,
      scheduleMeeting,
      notifyMembers,
      startMeeting,
      cancelMeeting,
      recordAttendance,
      saveMinutes,
      approveMinutes,
      proposeDecision,
      castMeetingVote,
      closeDecision,
      walletsForBranch,
      transactionsForBranch,
      createWallet,
      recordTransaction,
      approveTransaction,
      rejectTransaction,
      treasuryForBranch,
      expensesByCategory,
      budgetForBranch,
      createBudget,
      duesForBranch,
      createDuesAssessment,
      markDuePaid,
      requestAudit,
      completeAudit,
      signCodeOfConduct,
      hasSignedConduct,
      declareConflict,
      conflictsForMember,
      registerIP,
      ipForBranch,
      ipForInnovator,
      updateIPShowcaseConsent,
      fileComplaint,
      casesForBranch,
      caseById,
      casesForMember,
      updateCaseStatus,
      applySanction,
      dismissCase,
      fileAppeal,
      resolveAppeal,

      // Phase 5 — Treasury, Ethics, IP, Discipline
      incomeCategories: INCOME_CATEGORIES,
      expenseCategories: EXPENSE_CATEGORIES,
      allCategories: ALL_CATEGORIES,
      walletTypes: WALLET_TYPES,
      ipTypes: IP_TYPES,
      sanctionLevels: SANCTION_LEVELS,
      sanctionStatuses: SANCTION_STATUSES,
      codeOfConduct: CODE_OF_CONDUCT,
      majorExpenseThreshold: DEFAULT_MAJOR_EXPENSE_THRESHOLD,
      currency: CURRENCY,
      wallets,
      transactions,
      budgets,
      dues,
      auditLogs,
      codeOfConductSignatures,
      conflicts,
      ipRegistry,
      disciplinaryCases,
      amendments,
      amendmentVotes,
      dissolutions,
      onboardingPlans,
      preferences,
      walletsForBranch,
      transactionsForBranch,
      createWallet,
      recordTransaction,
      approveTransaction,
      rejectTransaction,
      treasuryForBranch,
      expensesByCategory,
      budgetForBranch,
      createBudget,
      duesForBranch,
      createDuesAssessment,
      markDuePaid,
      requestAudit,
      completeAudit,
      signCodeOfConduct,
      hasSignedConduct,
      declareConflict,
      conflictsForMember,
      registerIP,
      ipForBranch,
      ipForInnovator,
      updateIPShowcaseConsent,
      fileComplaint,
      casesForBranch,
      caseById,
      casesForMember,
      updateCaseStatus,
      applySanction,
      dismissCase,
      fileAppeal,
      resolveAppeal,

      // Projects
      createClubProject,
      projectsForStudent,
      projectsForClub,

      // Derived
      isActive,
      isVerified,
      statsForUniversity,
      historyForMember,
    }),
    [
      students,
      clubLeaders,
      clubs,
      clubProjects,
      currentStudent,
      currentClubLeader,
      membershipHistory,
      executives,
      handoverLogs,
      elections,
      ballots,
      electionCommittees,
      meetings,
      meetingAttendance,
      meetingMinutes,
      meetingDecisions,
      wallets,
      transactions,
      budgets,
      dues,
      auditLogs,
      codeOfConductSignatures,
      conflicts,
      ipRegistry,
      disciplinaryCases,
      amendments,
      amendmentVotes,
      dissolutions,
      onboardingPlans,
      preferences,
      registerStudent,
      loginStudent,
      loginClubLeader,
      logoutClub,
      refreshCurrentStudent,
      approveMember,
      rejectMember,
      withdrawMembership,
      suspendMember,
      reinstateMember,
      expelMember,
      pendingQueueForLeader,
      recentDecisionsForLeader,
      amendmentsForBranch,
      amendmentById,
      proposeAmendment,
      openAmendmentVoting,
      castAmendmentVote,
      hasVotedOnAmendment,
      votesOnAmendment,
      tallyAndCloseAmendment,
      dissolutionForBranch,
      openDissolutionVote,
      castDissolutionVote,
      closeDissolution,
      sendDissolutionNotifications,
      onboardingPlanForBranch,
      startOnboardingPlan,
      completeOnboardingStep,
      activateBranchFromPlan,
      setLanguage,
      branchByUniversityId,
      branchById,
      patronForBranch,
      membersForBranch,
      branchStats,
      executivesForBranch,
      executiveForPosition,
      memberForExecutive,
      canRunForPosition,
      appointExecutive,
      removeExecutive,
      recordHandover,
      handoverForExecutive,
      electionsForBranch,
      electionById,
      activeElectionForPosition,
      nominationsForElection,
      ballotsForElection,
      hasVoted,
      committeeForBranch,
      formElectionCommittee,
      announceElection,
      submitNomination,
      advanceElectionStage,
      castBallot,
      tallyAndClose,
      installElectionWinner,
      fileElectionComplaint,
      resolveElectionComplaint,
      openVoteOfNoConfidence,
      meetingsForBranch,
      meetingById,
      attendanceForMeeting,
      minutesForMeeting,
      decisionsForMeeting,
      quorumForMeeting,
      scheduleMeeting,
      notifyMembers,
      startMeeting,
      cancelMeeting,
      recordAttendance,
      saveMinutes,
      approveMinutes,
      proposeDecision,
      castMeetingVote,
      closeDecision,
      walletsForBranch,
      transactionsForBranch,
      createWallet,
      recordTransaction,
      approveTransaction,
      rejectTransaction,
      treasuryForBranch,
      expensesByCategory,
      budgetForBranch,
      createBudget,
      duesForBranch,
      createDuesAssessment,
      markDuePaid,
      requestAudit,
      completeAudit,
      signCodeOfConduct,
      hasSignedConduct,
      declareConflict,
      conflictsForMember,
      registerIP,
      ipForBranch,
      ipForInnovator,
      updateIPShowcaseConsent,
      fileComplaint,
      casesForBranch,
      caseById,
      casesForMember,
      updateCaseStatus,
      applySanction,
      dismissCase,
      fileAppeal,
      resolveAppeal,
      createClubProject,
      projectsForStudent,
      projectsForClub,
      isActive,
      isVerified,
      statsForUniversity,
      historyForMember,
    ]
  );

  return <ClubContext.Provider value={value}>{children}</ClubContext.Provider>;
}

export function useClub() {
  const ctx = useContext(ClubContext);
  if (!ctx) {
    throw new Error('useClub must be used within a <ClubProvider>.');
  }
  return ctx;
}