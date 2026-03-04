// ─────────────────────────────────────────────────────────────────────────────
// PermissionsContext.tsx
// ─────────────────────────────────────────────────────────────────────────────

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import {
  type Role,
  type Permission,
  getPermissions,
  ROLE_LABELS,
} from "./rolesConfig";

// ── Context shape ─────────────────────────────────────────────────────────────
interface PermissionsContextValue {
  role: Role;
  permissions: Permission;
  setRole: (role: Role) => void;
  can: (permission: keyof Permission) => boolean;
  roleLabel: string;
}

const PermissionsContext = createContext<PermissionsContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────
interface PermissionsProviderProps {
  children: React.ReactNode;
  initialRole?: Role;
}

export const PermissionsProvider: React.FC<PermissionsProviderProps> = ({
  children,
  initialRole = "viewer",
}) => {
  const [role, setRoleState] = useState<Role>(initialRole);

  // ✅ KEY FIX: sync state whenever initialRole changes (e.g. after login)
  useEffect(() => {
    setRoleState(initialRole);
  }, [initialRole]);

  const setRole = useCallback((nextRole: Role) => {
    setRoleState(nextRole);
  }, []);

  const permissions = getPermissions(role);

  const can = useCallback(
    (permission: keyof Permission) => permissions[permission],
    [permissions]
  );

  return (
    <PermissionsContext.Provider
      value={{ role, permissions, setRole, can, roleLabel: ROLE_LABELS[role] }}
    >
      {children}
    </PermissionsContext.Provider>
  );
};

// ── Hook ──────────────────────────────────────────────────────────────────────
export function usePermissions(): PermissionsContextValue {
  const ctx = useContext(PermissionsContext);
  if (!ctx) {
    throw new Error("usePermissions must be used inside <PermissionsProvider>");
  }
  return ctx;
}

// ── Guard component ───────────────────────────────────────────────────────────
interface PermissionGateProps {
  permission: keyof Permission;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  permission,
  fallback = null,
  children,
}) => {
  const { can } = usePermissions();
  return can(permission) ? <>{children}</> : <>{fallback}</>;
};
