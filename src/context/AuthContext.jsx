import { createContext, useContext, useEffect, useState } from "react";
import { SEED_LEADERS, SEED_STUDENTS, ensureSeeded } from "../club/context/clubSeed";

const AuthContext = createContext(null);

const USERS_KEY = "innovation_users";
const SESSION_KEY = "innovation_session";

export const DASHBOARD_PATHS = {
  innovator: "/dashboard/innovator",
  funder: "/dashboard/funder",
  club_member: "/dashboard/club-member",
  club_leader: "/dashboard/club-leader",
  admin: "/admin/dashboard",
};

export const ROLE_LABELS = {
  innovator: "Innovator",
  funder: "Funder (Organization)",
  club_member: "Club Member",
  club_leader: "Club Leader",
  admin: "Admin",
};

export function getDashboardPath(role) {
  return DASHBOARD_PATHS[role] || DASHBOARD_PATHS.innovator;
}

// Demo / seed accounts so login requires real credentials for every role.
// Replace these with your real mock credentials when you swap in the backend.
//
// The club_member / club_leader accounts below mirror the credentials that
// `src/club/context/clubSeed.js` writes into `club:students` /
// `club:clubLeaders` on first run. Login against either of these triggers a
// `club:session` write so ClubContext recognises the current user.
export const DEMO_ACCOUNTS = [
  {
    id: "demo-innovator",
    email: "innovator@innovationhub.com",
    password: "innovator123",
    role: "innovator",
    firstName: "Sarah",
    lastName: "Mwakasege",
    name: "Sarah Mwakasege",
    sector: "",
    isDemo: true,
  },
  {
    id: "demo-funder",
    email: "funder@innovationhub.com",
    password: "funder123",
    role: "funder",
    firstName: "James",
    lastName: "Mwangi",
    name: "James Mwangi",
    sector: "Technology",
    isDemo: true,
  },
  // Club Member — mirrors SEED_STUDENTS in clubSeed.js (mariam.suza@zsa.zm)
  {
    id: "stu-suza-001",
    email: "mariam.suza@zsa.zm",
    password: "student123",
    role: "club_member",
    firstName: "Mariam",
    lastName: "Hassan",
    name: "Mariam Hassan",
    sector: "",
    isDemo: true,
  },
  // Club Leader — mirrors SEED_LEADERS in clubSeed.js (leader.suza@zsa.zm)
  {
    id: "leader-suza",
    email: "leader.suza@zsa.zm",
    password: "leader123",
    role: "club_leader",
    firstName: "Asha",
    lastName: "Mbarak",
    name: "Dr. Asha Mbarak",
    sector: "",
    isDemo: true,
  },
  // Admin is intentionally NOT here — the dedicated /admin/login handles it
  // with hardcoded credentials until the backend super-user flow is built.
];

function loadStoredUsers() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persistUsers(users) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function loadSession() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// Combines the seed demo accounts (read-only) with anything the user has
// registered through the form. Demo accounts always authenticate against
// their hardcoded passwords; registered accounts use the password they set
// during registration.
function allAccounts(registered) {
  return [
    ...DEMO_ACCOUNTS,
    ...registered.map((u) => ({ ...u, password: u.password })),
  ];
}

function findAccountByEmail(registered, email) {
  if (!email) return null;
  const normalized = email.toLowerCase();
  return (
    allAccounts(registered).find((u) => u.email.toLowerCase() === normalized) || null
  );
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => loadSession());
  const [registeredUsers, setRegisteredUsers] = useState(() => loadStoredUsers());

  // Sample opportunities
  const [opportunities, setOpportunities] = useState([
    {
      id: 1,
      title: "Innovation Grant 2026",
      org: "UNDP Tanzania",
      type: "Grant",
      description: "Funding support for innovative projects.",
      amount: "$5000",
      deadline: "2026-06-10",
      location: "Dar es Salaam",
      applicants: [],
      tags: ["Technology", "Startup"]
    },
    {
      id: 2,
      title: "Youth Innovation Challenge",
      org: "UNESCO",
      type: "Challenge",
      description: "Competition for young innovators.",
      amount: "$3000",
      deadline: "2026-07-01",
      location: "Online",
      applicants: [],
      tags: ["Innovation", "Youth"]
    }
  ]);

  useEffect(() => {
    // Don't overwrite the demo accounts if the user clears storage —
    // only persist records the user actually registered.
    const realRegistered = registeredUsers.filter((u) => !u.isDemo);
    persistUsers(realRegistered);
  }, [registeredUsers]);

  // Run the club subproject's seeder once on first mount. Without this,
  // signing in as a club role wouldn't have anything to look up in
  // `club:students` / `club:clubLeaders` until a Club page was visited.
  useEffect(() => {
    try { ensureSeeded(); } catch { /* ignore */ }
  }, []);

  // Persist session so the user stays signed in across page reloads/navigations.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (user) {
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    } else {
      window.localStorage.removeItem(SESSION_KEY);
    }
  }, [user]);

  /**
   * Authenticate against an email + password.
   * Returns { ok, user, dashboardPath, message } so the caller can route or
   * surface an error.
   *
   * Lookup order:
   *   1. Demo accounts (seed list above) — credentials are hardcoded here.
   *   2. Users registered through the Register form — credentials are stored
   *      in localStorage at registration time.
   *
   * Any other email is rejected with an "Invalid email or password" message.
   * Admin login is intentionally NOT routed through here; the dedicated
   * /admin/login flow handles it until the backend super-user flow is built.
   */
  const login = (email, password, role, firstName, lastName) => {
    const account = findAccountByEmail(registeredUsers, email);

    if (!account || (account.password || "") !== (password || "")) {
      return {
        ok: false,
        message: "Invalid email or password. Please check your credentials and try again.",
        dashboardPath: null,
      };
    }

    const newUser = {
      id: account.id,
      email: account.email,
      role: account.role,
      firstName: account.firstName || firstName || email.split("@")[0],
      lastName: account.lastName || lastName || "",
      name: account.name || `${account.firstName || ""} ${account.lastName || ""}`.trim() || email,
      sector: account.sector || "",
    };

    // Bridge: when a club role logs in via the unified form, write a
    // `club:session` entry so `ClubProvider`'s on-mount hydration populates
    // `currentStudent` / `currentClubLeader`. Existing dashboards read those,
    // so we don't need to touch the club subproject.
    //
    // We resolve the match against the imported SEED arrays directly so this
    // works even on a brand-new install where `ensureSeeded()` hasn't yet
    // populated localStorage.
    if (typeof window !== "undefined") {
      try {
        const email = account.email.toLowerCase();
        if (account.role === "club_member") {
          const match = SEED_STUDENTS.find(
            (s) => s.email && s.email.toLowerCase() === email
          );
          if (match) {
            // Make sure the seed is in localStorage so a later ClubProvider
            // mount can resolve `currentStudent`. (Idempotent.)
            const existing = JSON.parse(window.localStorage.getItem("club:students") || "[]");
            if (!existing.some((s) => s.id === match.id)) {
              window.localStorage.setItem("club:students", JSON.stringify([match, ...existing]));
            }
            window.localStorage.setItem(
              "club:session",
              JSON.stringify({ kind: "student", id: match.id })
            );
          }
        } else if (account.role === "club_leader") {
          const match = SEED_LEADERS.find(
            (l) => l.email && l.email.toLowerCase() === email
          );
          if (match) {
            const existing = JSON.parse(window.localStorage.getItem("club:clubLeaders") || "[]");
            if (!existing.some((l) => l.id === match.id)) {
              window.localStorage.setItem("club:clubLeaders", JSON.stringify([match, ...existing]));
            }
            window.localStorage.setItem(
              "club:session",
              JSON.stringify({ kind: "leader", id: match.id })
            );
          }
        }
      } catch { /* ignore */ }
    }

    setUser(newUser);
    return { ok: true, user: newUser, dashboardPath: getDashboardPath(account.role) };
  };

  const logoutClub = () => {
    if (typeof window !== "undefined") {
      try { window.localStorage.removeItem("club:session"); } catch { /* ignore */ }
    }
  };

  const register = ({
    email,
    password,
    role,
    firstName,
    lastName,
    sector,
    username,
    // Club-member-specific fields (ignored by other roles):
    universityId,
    memberCategory,
    regNumber,
    staffId,
    graduationYear,
    organizationName,
  }) => {
    const resolvedEmail = email || (username?.includes("@") ? username : username ? `${username}@innovation.local` : "");
    if (!resolvedEmail) {
      return { ok: false, message: "An email or username is required." };
    }
    if (!password) {
      return { ok: false, message: "Password is required." };
    }

    // Don't let registrations collide with a demo account.
    const demoConflict = DEMO_ACCOUNTS.find(
      (u) => u.email.toLowerCase() === resolvedEmail.toLowerCase()
    );
    if (demoConflict) {
      return { ok: false, message: "An account with this email already exists." };
    }

    const existing = findAccountByEmail(registeredUsers, resolvedEmail);
    if (existing) {
      return { ok: false, message: "An account with this email already exists." };
    }

    const newUser = {
      id: `reg-${Date.now()}`,
      email: resolvedEmail,
      username: username || resolvedEmail,
      password,
      role,
      firstName,
      lastName,
      name: `${firstName} ${lastName}`.trim(),
      sector: role === "funder" ? sector || "" : "",
      createdAt: new Date().toISOString(),
      // Carry club fields into the AuthContext record so an admin export /
      // debug view still has them.
      universityId: (role === "club_member" || role === "club_leader") ? (universityId || "") : "",
      memberCategory: role === "club_member" ? memberCategory || "student" : "",
      regNumber: role === "club_member" ? regNumber || null : null,
      staffId: role === "club_member" ? staffId || null : null,
      graduationYear: role === "club_member" ? graduationYear || null : null,
      organizationName: role === "club_member" ? organizationName || null : null,
    };

    setRegisteredUsers((prev) => [...prev, newUser]);

    // Bridge: for club-member registrations, also write the record into the
    // club subproject's `club:students` table so the Club Leader's pending
    // queue (which reads from `club:students`) sees the new applicant. New
    // applicants always start as `status: 'pending'` — IBARA YA 13 requires
    // explicit leader verification before they become `active`.
    if (role === "club_member" && typeof window !== "undefined") {
      try {
        const existingStudents = JSON.parse(window.localStorage.getItem("club:students") || "[]");
        const alreadyTracked = existingStudents.some(
          (s) => s.email && s.email.toLowerCase() === resolvedEmail.toLowerCase()
        );
        if (!alreadyTracked) {
          const studentRecord = {
            id: `reg-${Date.now()}`,
            fullName: `${firstName} ${lastName}`.trim(),
            email: resolvedEmail,
            password,
            universityId: universityId || "",
            category: memberCategory || "student",
            status: "pending",
            registeredAt: new Date().toISOString(),
            regNumber: memberCategory === "student" ? (regNumber || null) : null,
            staffId: memberCategory === "staff" ? (staffId || null) : null,
            graduationYear: memberCategory === "alumni" ? (graduationYear || null) : null,
            organizationName: memberCategory === "corporate" ? (organizationName || null) : null,
            skills: [],
          };
          window.localStorage.setItem(
            "club:students",
            JSON.stringify([studentRecord, ...existingStudents])
          );
          // Auto-pin club:session so the freshly registered student lands
          // directly in ClubProvider.currentStudent on the next page load.
          window.localStorage.setItem(
            "club:session",
            JSON.stringify({ kind: "student", id: studentRecord.id })
          );
        }
      } catch { /* ignore */ }
    }

    // Bridge: mirror a brand-new club_leader registration into
    // `club:clubLeaders` so ClubProvider.currentClubLeader resolves on the
    // very next mount. New leaders start with `role: 'Mlezi'` (IBARA YA 20
    // Patron) — admins can promote them later via the Executive Committee
    // tooling.
    if (role === "club_leader" && typeof window !== "undefined") {
      try {
        const existingLeaders = JSON.parse(window.localStorage.getItem("club:clubLeaders") || "[]");
        const alreadyTracked = existingLeaders.some(
          (l) => l.email && l.email.toLowerCase() === resolvedEmail.toLowerCase()
        );
        if (!alreadyTracked) {
          const leaderRecord = {
            id: `reg-${Date.now()}`,
            fullName: `${firstName} ${lastName}`.trim(),
            email: resolvedEmail,
            password,
            universityId: universityId || "",
            role: "Mlezi",
            phone: "",
          };
          window.localStorage.setItem(
            "club:clubLeaders",
            JSON.stringify([leaderRecord, ...existingLeaders])
          );
          // Auto-pin club:session so the freshly registered leader lands in
          // ClubProvider.currentClubLeader after the post-register navigation.
          window.localStorage.setItem(
            "club:session",
            JSON.stringify({ kind: "leader", id: leaderRecord.id })
          );
        }
      } catch { /* ignore */ }
    }

    const sessionUser = { ...newUser };
    delete sessionUser.password;
    setUser(sessionUser);
    return { ok: true, user: sessionUser };
  };

  const logout = () => {
    logoutClub();
    setUser(null);
  };

  // Apply function
  const applyToOpportunity = (opportunityId, formData) => {
    setOpportunities((prev) =>
      prev.map((opp) =>
        opp.id === opportunityId
          ? {
              ...opp,
              applicants: [
                ...opp.applicants,
                {
                  innovatorId: user?.id,
                  ...formData,
                },
              ],
            }
          : opp
      )
    );
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        logoutClub,
        register,
        registeredUsers,
        opportunities,
        applyToOpportunity,
        getDashboardPath,
        demoAccounts: DEMO_ACCOUNTS,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
