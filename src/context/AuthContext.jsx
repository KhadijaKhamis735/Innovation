import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

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

  const login = (email, role, firstName, lastName) => {
    setUser({
      id: 1,
      email,
      role,
      firstName,
      lastName,
      name: `${firstName} ${lastName}`,
    });
  };

  const logout = () => setUser(null);

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
                  innovatorId: user.id,
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
        opportunities,
        applyToOpportunity,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}