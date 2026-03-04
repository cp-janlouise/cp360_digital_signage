import { useState, useEffect } from "react";
import LoginCard from "./frontend/pages/components/login/Login";
import Dashboard from "./frontend/pages/components/dashboard/Dashboard";
import { PermissionsProvider } from "./frontend/pages/components/security/permissionContext";
import { type Role } from "./frontend/pages/components/security/rolesConfig";
import { seedUserIfMissing } from "./frontend/pages/components/store/usersStore";

// ── Seed all demo/default users into the store on app boot ───────────────────
// This ensures they show up in ManageUsers for the Super Admin.
// In production, replace this with real API-fetched users.
const DEMO_USERS = [
  {
    id: "user-superadmin",
    username: "superadmin",
    email: "superadmin@cp360.dev",
    role: "superAdmin" as Role,
    organization_id: "Admin",
    status: "active" as const,
    createdAt: new Date("2024-01-01").toISOString(),
  },
  {
    id: "user-bonn",
    username: "bonn",
    email: "bonn@cp360.dev",
    role: "superAdmin" as Role,
    organization_id: "Admin",
    status: "active" as const,
    createdAt: new Date("2024-01-01").toISOString(),
  },
  {
    id: "user-admin",
    username: "admin",
    email: "admin@cp360.dev",
    role: "admin" as Role,
    organization_id: "Admin",
    status: "active" as const,
    createdAt: new Date("2024-01-02").toISOString(),
  },
  {
    id: "user-editor",
    username: "editor",
    email: "editor@cp360.dev",
    role: "contentManager" as Role,
    organization_id: "Admin",
    status: "active" as const,
    createdAt: new Date("2024-01-03").toISOString(),
  },
  {
    id: "user-viewer",
    username: "viewer",
    email: "viewer@cp360.dev",
    role: "viewer" as Role,
    organization_id: "Admin",
    status: "active" as const,
    createdAt: new Date("2024-01-04").toISOString(),
  },
];

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole]     = useState<Role>("viewer");

  // Seed demo users into the store once on mount
  useEffect(() => {
    DEMO_USERS.forEach((u) => seedUserIfMissing(u));
  }, []);

  const handleLoginSuccess = (role: Role) => {
    setUserRole(role);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserRole("viewer");
  };

  return (
    <PermissionsProvider initialRole={userRole}>
      {isLoggedIn ? (
        <Dashboard onLogout={handleLogout} onNavigate={() => {}} />
      ) : (
        <LoginCard onLoginSuccess={handleLoginSuccess} />
      )}
    </PermissionsProvider>
  );
}

export default App;
