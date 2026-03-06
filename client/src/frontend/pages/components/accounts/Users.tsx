// ─────────────────────────────────────────────────────────────────────────────
// ManageUsers.tsx  (updated — 4-role support + permission-aware actions)
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useMemo, useState } from "react";
import {
  getOrganizations,
  subscribeOrganizations,
  type OrganizationItem,
} from "../store/organizationsStore";
import {
  addUser,
  getUsers,
  seedUserIfMissing,
  subscribeUsers,
  updateUser,
  deleteUser,
  type UserItem,
} from "../store/usersStore";

// ── Permissions ───────────────────────────────────────────────────────────────
import { usePermissions } from "../security/permissionContext";
import { type Role, ROLE_LABELS, ROLE_DESCRIPTIONS, ROLE_PERMISSIONS, type Permission  } from "../security/rolesConfig";

// Use the 4 canonical roles from rolesConfig
type UserRole = Role; // "superAdmin" | "admin" | "contentManager" | "viewer"

type Props = { onBack: () => void };

// ── Sub-components ────────────────────────────────────────────────────────────

type SelectBaseProps = {
  id: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  children: React.ReactNode;
  placeholder: string;
  className?: string;
};

const SelectInput: React.FC<SelectBaseProps> = ({ id, value, onChange, children, placeholder, className }) => (
  <select id={id} value={value} onChange={onChange} required className={className}>
    <option value="" disabled hidden>{placeholder}</option>
    {children}
  </select>
);

type StatusToggleProps = {
  checked: boolean;
  disabled?: boolean;
  onChange: (nextChecked: boolean) => void;
  ariaLabel: string;
};

const StatusToggle: React.FC<StatusToggleProps> = ({ checked, disabled, onChange, ariaLabel }) => (
  <button
    type="button"
    className={["statusToggle", checked ? "statusToggle--on" : "statusToggle--off", disabled ? "statusToggle--disabled" : ""].join(" ")}
    aria-label={ariaLabel}
    aria-pressed={checked}
    disabled={disabled}
    onClick={() => onChange(!checked)}
  >
    <span className="statusToggle__track" aria-hidden="true">
      <span className="statusToggle__thumb" />
    </span>
    <span className="statusToggle__text">{checked ? "Active" : "Inactive"}</span>
  </button>
);

const Icon = {
  view: <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 5c5.5 0 9.6 4.6 10.8 6.1.3.4.3.9 0 1.3C21.6 13.9 17.5 18.5 12 18.5S2.4 13.9 1.2 12.4c-.3-.4-.3-.9 0-1.3C2.4 9.6 6.5 5 12 5Zm0 2c-3.9 0-7.3 3.2-8.6 4.8C4.7 13.3 8.1 16.5 12 16.5s7.3-3.2 8.6-4.8C19.3 10.2 15.9 7 12 7Zm0 1.5A3.5 3.5 0 1 1 12 15a3.5 3.5 0 0 1 0-7Zm0 2A1.5 1.5 0 1 0 12 13a1.5 1.5 0 0 0 0-3Z"/></svg>,
  edit: <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3 17.3V21h3.7L17.8 9.9l-3.7-3.7L3 17.3Zm2.1 1.6 9-9 1.6 1.6-9 9H5.1ZM20.7 7c.4-.4.4-1 0-1.4l-2.3-2.3c-.4-.4-1-.4-1.4 0l-1.8 1.8 3.7 3.7L20.7 7Z"/></svg>,
  trash: <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M9 3h6l1 2h4v2H4V5h4l1-2Zm1 7h2v9h-2v-9Zm4 0h2v9h-2v-9ZM7 10h2v9H7v-9Z"/></svg>,
};

// Role badge colours
const ROLE_BADGE_STYLES: Record<UserRole, { background: string; color: string }> = {
  superAdmin:     { background: "#7c3aed", color: "#fff" },
  admin:          { background: "#2563eb", color: "#fff" },
  contentManager: { background: "#059669", color: "#fff" },
  viewer:         { background: "#d97706", color: "#fff" },
};

const RolePill: React.FC<{ role: UserRole }> = ({ role }) => {
  const style = ROLE_BADGE_STYLES[role] ?? { background: "#e5e7eb", color: "#374151" };
  return (
    <span style={{
      ...style,
      padding: "2px 10px",
      borderRadius: "999px",
      fontSize: "11px",
      fontWeight: 700,
      letterSpacing: "0.4px",
      display: "inline-block",
    }}>
      {ROLE_LABELS[role] ?? role}
    </span>
  );
};


// ── PermissionsCard ───────────────────────────────────────────────────────────
type PermGroup = {
  label: string;
  icon: string;
  color: string;
  bg: string;
  border: string;
  keys: (keyof Permission)[];
};

const PermissionsCard: React.FC<{
  userPerms: Permission;
  groups: PermGroup[];
}> = ({ userPerms, groups }) => {
  const [open, setOpen] = React.useState(false);

  const totalGranted = Object.values(userPerms).filter(Boolean).length;
  const totalPerms   = Object.values(userPerms).length;

  return (
    <div style={{
      border: "1px solid #e2e8f0",
      borderRadius: "12px",
      overflow: "hidden",
    }}>
      {/* Collapsible header */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 18px",
          background: open ? "#f8fafc" : "#fff",
          border: "none",
          cursor: "pointer",
          borderBottom: open ? "1px solid #e2e8f0" : "none",
          transition: "background 0.2s",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{
            width: "32px", height: "32px",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            borderRadius: "8px",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <i className="bi bi-shield-check" style={{ color: "#fff", fontSize: "14px" }} />
          </span>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontWeight: 700, fontSize: "14px", color: "#111827" }}>
              Permissions for this role
            </div>
            <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "1px" }}>
              {totalGranted} of {totalPerms} permissions granted
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* Progress bar */}
          <div style={{
            width: "80px", height: "6px",
            background: "#e5e7eb", borderRadius: "999px", overflow: "hidden",
          }}>
            <div style={{
              height: "100%",
              width: `${Math.round((totalGranted / totalPerms) * 100)}%`,
              background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
              borderRadius: "999px",
              transition: "width 0.4s",
            }} />
          </div>
          <i
            className={`bi bi-chevron-${open ? "up" : "down"}`}
            style={{ color: "#9ca3af", fontSize: "12px" }}
          />
        </div>
      </button>

      {/* Expandable body */}
      {open && (
        <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: "10px" }}>
          {groups.map((g) => {
            const granted = g.keys.filter((k) => userPerms[k]);
            const denied  = g.keys.filter((k) => !userPerms[k]);
            if (g.keys.length === 0) return null;

            return (
              <div key={g.label} style={{
                background: g.bg,
                border: `1px solid ${g.border}`,
                borderRadius: "10px",
                padding: "12px 14px",
              }}>
                {/* Group header */}
                <div style={{
                  display: "flex", alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "10px",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <i className={`bi ${g.icon}`} style={{ color: g.color, fontSize: "13px" }} />
                    <span style={{ fontWeight: 700, fontSize: "12px", color: g.color }}>
                      {g.label.toUpperCase()}
                    </span>
                  </div>
                  <span style={{
                    fontSize: "11px",
                    color: g.color,
                    fontWeight: 600,
                    opacity: 0.7,
                  }}>
                    {granted.length}/{g.keys.length}
                  </span>
                </div>

                {/* Permission pills */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                  {granted.map((k) => (
                    <span key={k} style={{
                      display: "inline-flex", alignItems: "center", gap: "4px",
                      background: "#fff",
                      border: `1px solid ${g.border}`,
                      color: g.color,
                      padding: "3px 10px",
                      borderRadius: "999px",
                      fontSize: "11px",
                      fontWeight: 600,
                    }}>
                      <i className="bi bi-check-circle-fill" style={{ fontSize: "10px", color: "#22c55e" }} />
                      {k.replace(/^can/, "").replace(/([A-Z])/g, " $1").trim()}
                    </span>
                  ))}
                  {denied.map((k) => (
                    <span key={k} style={{
                      display: "inline-flex", alignItems: "center", gap: "4px",
                      background: "rgba(255,255,255,0.4)",
                      border: "1px solid #e5e7eb",
                      color: "#9ca3af",
                      padding: "3px 10px",
                      borderRadius: "999px",
                      fontSize: "11px",
                      fontWeight: 500,
                      textDecoration: "line-through",
                      opacity: 0.6,
                    }}>
                      <i className="bi bi-x-circle-fill" style={{ fontSize: "10px", color: "#f87171" }} />
                      {k.replace(/^can/, "").replace(/([A-Z])/g, " $1").trim()}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ── ManageUsers ───────────────────────────────────────────────────────────────
const ManageUsers: React.FC<Props> = ({ onBack }) => {
  const currentUserId = "superadmin-1";
  const { can } = usePermissions();

  // Permission shortcuts for this view
  const canCreate = can("canManageUsers");
  const canEdit   = can("canManageUsers");
  const canDelete = can("canManageUsers");

  const [users, setUsers]     = useState<UserItem[]>(() => getUsers());
  const [orgs, setOrgs]       = useState<OrganizationItem[]>(() => getOrganizations());
  const [userSearch, setUserSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | UserRole>("all");
  const [orgFilter, setOrgFilter]   = useState<"all" | string>("all");

  useEffect(() => {
    const unsub = subscribeOrganizations(() => setOrgs(getOrganizations()));
    return unsub;
  }, []);

  useEffect(() => {
    void seedUserIfMissing({
      id: currentUserId,
      username: "Super Admin",
      email: "superadmin@local.dev",
      role: "superAdmin" as any,
      organization_id: "Admin",
      status: "active",
      createdAt: new Date().toISOString(),
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgs]);

  useEffect(() => {
  const unsub = subscribeOrganizations(() => setOrgs(getOrganizations()));
  return () => {
    if (typeof unsub === "function") unsub();
  };
}, []);

useEffect(() => {
  const unsub = subscribeUsers(() => setUsers(getUsers()));
  return () => {
    if (typeof unsub === "function") unsub();
  };
}, []);

  

  const orgById = useMemo(() => {
    const map = new Map<string, OrganizationItem>();
    for (const o of orgs as any[]) {
      const key = o.organization_id ?? o.id;
      if (key) map.set(key, o as OrganizationItem);
    }
    return map;
  }, [orgs]);

  // ── Add user form ──────────────────────────────────────────────────────────
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState<{
    username: string;
    email: string;
    role: UserRole | "";
    organization_id: string;
    status: "active" | "inactive";
  }>({ username: "", email: "", role: "", organization_id: "", status: "active" });

  const closeAddUserModal = () => {
    setShowAddUser(false);
    setNewUser({ username: "", email: "", role: "", organization_id: "", status: "active" });
  };

  const saveUser = (e: React.FormEvent) => {
    e.preventDefault();
    const username = newUser.username.trim();
    const email    = newUser.email.trim();
    if (!username || !email || !newUser.role || !newUser.organization_id) {
      alert("Please fill in all fields.");
      return;
    }
    try {
      addUser({ username, email, role: newUser.role as any, organization_id: newUser.organization_id, status: newUser.status });
      closeAddUserModal();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to add user.");
    }
  };

  // ── Modals ─────────────────────────────────────────────────────────────────
  const [viewUser, setViewUser] = useState<UserItem | null>(null);
  const [editUser, setEditUser] = useState<UserItem | null>(null);
  const [editDraft, setEditDraft] = useState<{ role: UserRole; organization_id: string } | null>(null);

  useEffect(() => {
    if (!editUser) { setEditDraft(null); return; }
    setEditDraft({ role: (editUser.role as UserRole) || "viewer", organization_id: editUser.organization_id });
  }, [editUser]);

  // ── Super Admin delete confirmation modal ──────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<UserItem | null>(null);
  const [deleteStep, setDeleteStep]     = useState<"confirm" | "reauth">("confirm");
  const [reauthPassword, setReauthPassword] = useState("");
  const [reauthError, setReauthError]   = useState("");

  const closeDeleteModal = () => {
    setDeleteTarget(null);
    setDeleteStep("confirm");
    setReauthPassword("");
    setReauthError("");
  };

  const superAdminCount = useMemo(
    () => users.filter((u) => u.role === "superAdmin").length,
    [users]
  );

  // ── Filters ────────────────────────────────────────────────────────────────
  const clearFilters = () => { setRoleFilter("all"); setOrgFilter("all"); };

  const filteredUsers = useMemo(() => {
    const q = userSearch.toLowerCase().trim();
    return users.filter((u) => {
      const orgName = orgById.get(u.organization_id)?.name ?? "";
      const matchesSearch = !q || [u.username, u.email, u.role, orgName, u.status].some((s) => s.toLowerCase().includes(q));
      const matchesRole   = roleFilter === "all" || u.role === roleFilter;
      const matchesOrg    = orgFilter  === "all" || u.organization_id === orgFilter;
      return matchesSearch && matchesRole && matchesOrg;
    });
  }, [users, userSearch, orgById, roleFilter, orgFilter]);

  const activeFiltersCount = (roleFilter !== "all" ? 1 : 0) + (orgFilter !== "all" ? 1 : 0);
  const isProtectedRow = (u: UserItem) => u.id === currentUserId;

  const handleDelete = (u: UserItem) => {
    if (!canDelete) return;

    // Self-delete is never allowed
    if (isProtectedRow(u)) return;

    const targetIsSuperAdmin = u.role === "superAdmin";

    // Only a Super Admin can delete another Super Admin
    if (targetIsSuperAdmin && !can("canManageUsers")) return;

    // Last Super Admin guard
    if (targetIsSuperAdmin && superAdminCount <= 1) {
      alert("Cannot delete the last Super Admin. Promote another user to Super Admin first.");
      return;
    }

    if (targetIsSuperAdmin) {
      // Use the multi-step modal for Super Admin deletions
      setDeleteTarget(u);
      setDeleteStep("confirm");
      return;
    }

    // Regular users — simple confirm
    if (!confirm(`Delete user "${u.username}"?`)) return;
    deleteUser(u.id);
  };

  const setUserStatus = (userId: string, status: "active" | "inactive") => updateUser(userId, { status });

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="ManageUsersHome">
      <div className="topRow">
        <button className="backBtn" onClick={onBack}>Back</button>
        <h1 className="manageUserTitle">Manage Users</h1>
        <div className="topActions">
          <input
            className="searchInput"
            placeholder="Search user title or name"
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
          />
          {canCreate && (
            <button className="addUserBtn" onClick={() => setShowAddUser(true)}>+ ADD A USER</button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="filtersBar">
        <div className="filtersLeft">
          <div className="filterPill">
            <span className="filterLabel">Role</span>
            <select className="filterSelect" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as "all" | UserRole)}>
              <option value="all">All</option>
              {(Object.keys(ROLE_LABELS) as UserRole[]).map((r) => (
                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
              ))}
            </select>
          </div>
          <div className="filterPill">
            <span className="filterLabel">Organization</span>
            <select className="filterSelect" value={orgFilter} onChange={(e) => setOrgFilter(e.target.value)}>
              <option value="all">All</option>
              {orgs.map((o: any) => (
                <option key={o.organization_id ?? o.id} value={o.organization_id ?? o.id}>{o.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="filtersRight">
          {activeFiltersCount > 0 && <span className="filtersCount">{activeFiltersCount} filter(s)</span>}
          <button className="filtersClearBtn" onClick={clearFilters} disabled={activeFiltersCount === 0}>Clear</button>
        </div>
      </div>

      {/* Table */}
      <div className="viewPage">
        {filteredUsers.length === 0 ? (
          <h2>No users yet.</h2>
        ) : (
          <div className="usersTableWrap">
            <table className="usersTable">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Organization</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th className="actionsCol">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => {
                  const isSelf      = u.id === currentUserId;
                  const protectedRow = isProtectedRow(u);
                  const canToggle   = !isSelf;
                  const orgName     = orgById.get(u.organization_id)?.name ?? "—";
                  const userRole    = u.role as UserRole;

                  return (
                    <tr key={u.id}>
                      <td>{u.username}</td>
                      <td>{u.email}</td>
                      <td><RolePill role={userRole} /></td>
                      <td>{orgName}</td>

                      <td>
                        <StatusToggle
                          checked={u.status === "active"}
                          disabled={!canToggle || !canEdit}
                          ariaLabel={isSelf ? "You cannot change your own status." : `Toggle status for ${u.username}`}
                          onChange={(nextChecked) => setUserStatus(u.id, nextChecked ? "active" : "inactive")}
                        />
                        {isSelf && <div className="statusLockHint">Locked for self-protection.</div>}
                      </td>

                      <td>{new Date(u.createdAt).toLocaleString()}</td>

                      <td className="actionsCell">
                        {/* View — always visible */}
                        <button className="iconBtn" type="button" title="View" onClick={() => setViewUser(u)}>
                          {Icon.view}
                        </button>

                        {/* Edit — only if permission */}
                        <button
                          className="iconBtn"
                          type="button"
                          title={!canEdit ? "No permission to edit" : protectedRow ? "Super Admin cannot be edited" : "Edit"}
                          onClick={() => { if (!canEdit || protectedRow) return; setEditUser(u); }}
                          disabled={!canEdit || protectedRow}
                          style={(!canEdit || protectedRow) ? { opacity: 0.35, cursor: "not-allowed" } : undefined}
                        >
                          {Icon.edit}
                        </button>

                        {/* Delete — only if permission */}
                        <button
                          className="iconBtn"
                          type="button"
                          title={!canDelete ? "No permission to delete" : protectedRow ? "Super Admin cannot be deleted" : "Delete"}
                          onClick={() => handleDelete(u)}
                          disabled={!canDelete || protectedRow}
                          style={(!canDelete || protectedRow) ? { opacity: 0.35, cursor: "not-allowed" } : undefined}
                        >
                          {Icon.trash}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {showAddUser && canCreate && (
        <div className="modalOverlay" onClick={closeAddUserModal}>
          <div className="modalCard" onClick={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <h2 className="modalTitle">ADD USER</h2>
              <button className="modalCloseBtn" onClick={closeAddUserModal} type="button">✕</button>
            </div>
            <form onSubmit={saveUser} className="modalBody">
              <label htmlFor="username">Username:</label>
              <div className="inputGroupUsername">
                <input id="username" type="text" value={newUser.username}
                  onChange={(e) => setNewUser((p) => ({ ...p, username: e.target.value }))}
                  placeholder="Enter username" />
              </div>

              <label htmlFor="email">Email:</label>
              <div className="inputGroupEmail">
                <input id="email" type="email" value={newUser.email}
                  onChange={(e) => setNewUser((p) => ({ ...p, email: e.target.value }))}
                  placeholder="Enter email" />
              </div>

              <label htmlFor="role">Role:</label>
              <div className="inputGroupRole">
                <SelectInput id="role" value={newUser.role}
                  onChange={(e) => setNewUser((p) => ({ ...p, role: e.target.value as UserRole }))}
                  placeholder="SELECT ROLE">
                  {(Object.keys(ROLE_LABELS) as UserRole[]).map((r) => (
                    <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                  ))}
                </SelectInput>
              </div>

              {/* Role description hint */}
              {newUser.role && (
                <div style={{
                  margin: "-4px 0 10px",
                  padding: "8px 12px",
                  background: "#f0f9ff",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "#0369a1",
                  lineHeight: 1.5,
                }}>
                  <strong>{ROLE_LABELS[newUser.role]}:</strong> {ROLE_DESCRIPTIONS[newUser.role]}
                </div>
              )}

              <label htmlFor="organization">Organization:</label>
              <div className="inputGroupOrganization">
                <SelectInput id="organization" value={newUser.organization_id}
                  onChange={(e) => setNewUser((p) => ({ ...p, organization_id: e.target.value }))}
                  placeholder={orgs.length ? "SELECT ORGANIZATION" : "ADD ORGS FIRST"}>
                  {orgs.map((o: any) => (
                    <option key={o.organization_id ?? o.id} value={o.organization_id ?? o.id}>{o.name}</option>
                  ))}
                </SelectInput>
              </div>

              <label htmlFor="status">Status</label>
              <div className="inputGroupStatus">
                <select id="status" value={newUser.status}
                  onChange={(e) => setNewUser((p) => ({ ...p, status: e.target.value as "active" | "inactive" }))} required>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="modalFooter">
                <button type="button" className="cancelBtn" onClick={closeAddUserModal}>Cancel</button>
                <button type="submit" className="saveUserBtn">Save User</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewUser && (() => {
        const userPerms = ROLE_PERMISSIONS[viewUser.role as UserRole];
        const PERM_GROUPS: { label: string; icon: string; color: string; bg: string; border: string; keys: (keyof typeof userPerms)[] }[] = [
          {
            label: "Campaigns",
            icon: "bi-flag",
            color: "#1d4ed8", bg: "#eff6ff", border: "#bfdbfe",
            keys: ["canViewCampaigns","canCreateCampaign","canEditCampaign","canDeleteCampaign","canOverrideSchedules","canEmergencyBroadcast"],
          },
          {
            label: "Screens",
            icon: "bi-laptop",
            color: "#0f766e", bg: "#f0fdfa", border: "#99f6e4",
            keys: ["canViewScreens","canCreateScreen","canEditScreen","canDeleteScreen","canDeactivateScreen","canPairScreen","canAssignPlaylistToScreen"],
          },
          {
            label: "Contents",
            icon: "bi-file-earmark",
            color: "#7c3aed", bg: "#faf5ff", border: "#ddd6fe",
            keys: ["canViewContents","canUploadContent","canEditContent","canDeleteContent"],
          },
          {
            label: "Playlists",
            icon: "bi-collection-play",
            color: "#b45309", bg: "#fffbeb", border: "#fde68a",
            keys: ["canViewPlaylists","canCreatePlaylist","canEditPlaylist","canDeletePlaylist","canAssignContent"],
          },
          {
            label: "Layouts",
            icon: "bi-grid-1x2",
            color: "#be185d", bg: "#fdf2f8", border: "#fbcfe8",
            keys: ["canViewLayouts","canCreateLayout","canEditLayout","canDeleteLayout"],
          },
          {
            label: "Accounts & Users",
            icon: "bi-person-rolodex",
            color: "#1e3a5f", bg: "#f0f4ff", border: "#c7d7f9",
            keys: ["canViewAccounts","canViewManageUsers","canViewManageOrganizations","canViewManageLocations","canManageUsers","canManageOrganizations","canManageLocations","canAssignRoles"],
          },
          {
            label: "System",
            icon: "bi-gear",
            color: "#374151", bg: "#f9fafb", border: "#e5e7eb",
            keys: ["canViewReports","canViewLogs","canModifySystemSettings","canViewPlayer"],
          },
        ];

        return (
          <div className="modalOverlay" onClick={() => setViewUser(null)}>
            <div
              className="modalCard"
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: "560px", width: "90vw", maxHeight: "88vh", display: "flex", flexDirection: "column" }}
            >
              {/* Header */}
              <div className="modalHeader">
                <h2 className="modalTitle">VIEW USER</h2>
                <button className="modalCloseBtn" onClick={() => setViewUser(null)} type="button">✕</button>
              </div>

              <div style={{ overflowY: "auto", padding: "20px" }}>
                {/* User info card */}
                <div style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px",
                  padding: "16px 18px",
                  marginBottom: "20px",
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                }}>
                  <div style={{
                    width: "48px", height: "48px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#fff", fontWeight: 800, fontSize: "18px", flexShrink: 0,
                  }}>
                    {viewUser.username.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: "16px", color: "#111827" }}>{viewUser.username}</div>
                    <div style={{ fontSize: "13px", color: "#6b7280", marginBottom: "6px" }}>{viewUser.email}</div>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                      <RolePill role={viewUser.role as UserRole} />
                      <span style={{
                        background: viewUser.status === "active" ? "#dcfce7" : "#fee2e2",
                        color: viewUser.status === "active" ? "#166534" : "#991b1b",
                        padding: "2px 10px", borderRadius: "999px",
                        fontSize: "11px", fontWeight: 600,
                      }}>
                        {viewUser.status === "active" ? "● Active" : "● Inactive"}
                      </span>
                    </div>
                  </div>
                  <div style={{ textAlign: "right", fontSize: "11px", color: "#9ca3af", flexShrink: 0 }}>
                    <div>Organization</div>
                    <div style={{ fontWeight: 600, color: "#374151", marginTop: "2px" }}>
                      {orgById.get(viewUser.organization_id)?.name ?? "—"}
                    </div>
                    <div style={{ marginTop: "6px" }}>Joined</div>
                    <div style={{ fontWeight: 600, color: "#374151", marginTop: "2px" }}>
                      {new Date(viewUser.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Permissions card */}
                <PermissionsCard userPerms={userPerms} groups={PERM_GROUPS} />
              </div>
            </div>
          </div>
        );
      })()}

      {/* Edit Modal */}
      {editUser && editDraft && canEdit && (
        <div className="modalOverlay" onClick={() => setEditUser(null)}>
          <div className="modalCard" onClick={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <h2 className="modalTitle">EDIT USER</h2>
              <button className="modalCloseBtn" onClick={() => setEditUser(null)} type="button">✕</button>
            </div>
            <div className="modalBody">
              <div className="editUserTop">
                <div className="editUserName">{editUser.username}</div>
                <div className="editUserEmail">{editUser.email}</div>
              </div>

              <label htmlFor="editRole">Role</label>
              <div className="inputGroupRole">
                <select id="editRole" value={editDraft.role}
                  onChange={(e) => setEditDraft((p) => p ? { ...p, role: e.target.value as UserRole } : p)} required>
                  {(Object.keys(ROLE_LABELS) as UserRole[]).map((r) => (
                    <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                  ))}
                </select>
              </div>

              {/* Role description hint */}
              <div style={{
                margin: "-4px 0 10px",
                padding: "8px 12px",
                background: "#faf5ff",
                borderRadius: "8px",
                fontSize: "12px",
                color: "#7c3aed",
                lineHeight: 1.5,
              }}>
                {ROLE_DESCRIPTIONS[editDraft.role]}
              </div>

              <label htmlFor="editOrg">Organization</label>
              <div className="inputGroupOrganization">
                <select id="editOrg" value={editDraft.organization_id}
                  onChange={(e) => setEditDraft((p) => p ? { ...p, organization_id: e.target.value } : p)} required>
                  <option value="" disabled>SELECT ORGANIZATION</option>
                  {orgs.map((o: any) => (
                    <option key={o.organization_id ?? o.id} value={o.organization_id ?? o.id}>{o.name}</option>
                  ))}
                </select>
              </div>

              <div className="modalFooter">
                <button type="button" className="cancelBtn" onClick={() => setEditUser(null)}>Cancel</button>
                <button type="button" className="saveUserBtn" onClick={() => {
                  if (editUser.id === currentUserId) { alert("Super Admin cannot be edited."); return; }
                  if (!editDraft.organization_id) { alert("Please select an organization."); return; }
                  updateUser(editUser.id, { role: editDraft.role as any, organization_id: editDraft.organization_id });
                  setEditUser(null);
                }}>
                  Save Changes
                </button>
              </div>

              <div className="editHint">Only role and organization can be changed here.</div>
            </div>
          </div>
        </div>
      )}

      
      {/* ── Super Admin Delete Modal ──────────────────────────────────────────── */}
      {deleteTarget && (
        <div className="modalOverlay" onClick={closeDeleteModal}>
          <div className="modalCard" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "420px" }}>
            <div className="modalHeader" style={{ borderBottom: "2px solid #dc2626" }}>
              <h2 className="modalTitle" style={{ color: "#dc2626", display: "flex", alignItems: "center", gap: "8px" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2Zm1 15h-2v-2h2v2Zm0-4h-2V7h2v6Z"/>
                </svg>
                Delete Super Admin
              </h2>
              <button className="modalCloseBtn" onClick={closeDeleteModal} type="button">✕</button>
            </div>

            <div className="modalBody">
              {deleteStep === "confirm" && (
                <>
                  <div style={{
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    borderRadius: "10px",
                    padding: "14px 16px",
                    marginBottom: "18px",
                    fontSize: "13px",
                    color: "#991b1b",
                    lineHeight: 1.6,
                  }}>
                    <strong>Warning:</strong> You are about to delete a Super Admin account.
                    This action is irreversible. Please confirm you want to proceed.
                  </div>

                  <div className="kvGrid" style={{ marginBottom: "18px" }}>
                    <div className="kv"><span>Username</span><b>{deleteTarget.username}</b></div>
                    <div className="kv"><span>Email</span><b>{deleteTarget.email}</b></div>
                    <div className="kv"><span>Role</span><RolePill role={deleteTarget.role as UserRole} /></div>
                  </div>

                  <div style={{ fontSize: "13px", color: "#6b7280", marginBottom: "20px" }}>
                    Remaining Super Admins after deletion: <strong style={{ color: superAdminCount - 1 === 1 ? "#d97706" : "#111" }}>{superAdminCount - 1}</strong>
                    {superAdminCount - 1 === 1 && (
                      <span style={{ color: "#d97706", marginLeft: "6px" }}>⚠ Only 1 will remain</span>
                    )}
                  </div>

                  <div className="modalFooter">
                    <button type="button" className="cancelBtn" onClick={closeDeleteModal}>Cancel</button>
                    <button
                      type="button"
                      className="saveUserBtn"
                      style={{ background: "#dc2626" }}
                      onClick={() => setDeleteStep("reauth")}
                    >
                      Continue →
                    </button>
                  </div>
                </>
              )}

              {deleteStep === "reauth" && (
                <>
                  <div style={{
                    fontSize: "13px",
                    color: "#374151",
                    marginBottom: "16px",
                    lineHeight: 1.6,
                  }}>
                    To confirm deletion of <strong>{deleteTarget.username}</strong>, please enter
                    your password.
                  </div>

                  <label htmlFor="reauthPwd" style={{ fontSize: "13px", fontWeight: 600, color: "#374151" }}>
                    Your Password
                  </label>
                  <div style={{ margin: "6px 0 8px" }}>
                    <input
                      id="reauthPwd"
                      type="password"
                      placeholder="Enter your password to confirm"
                      value={reauthPassword}
                      onChange={(e) => { setReauthPassword(e.target.value); setReauthError(""); }}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        border: reauthError ? "1px solid #dc2626" : "1px solid #d1d5db",
                        borderRadius: "8px",
                        fontSize: "14px",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                      autoFocus
                    />
                  </div>

                  {reauthError && (
                    <div style={{
                      background: "#fef2f2",
                      border: "1px solid #fecaca",
                      borderRadius: "8px",
                      padding: "8px 12px",
                      fontSize: "12px",
                      color: "#dc2626",
                      marginBottom: "12px",
                    }}>
                      {reauthError}
                    </div>
                  )}

                  <div className="modalFooter" style={{ marginTop: "8px" }}>
                    <button type="button" className="cancelBtn" onClick={() => setDeleteStep("confirm")}>
                      ← Back
                    </button>
                    <button
                      type="button"
                      className="saveUserBtn"
                      style={{ background: "#dc2626" }}
                      onClick={() => {
                        // Verify against the USERS map from Login (same source of truth)
                        const SUPERADMIN_PASSWORDS: Record<string, string> = {
                          "superadmin-1": "admin123",
                          "user-superadmin": "admin123",
                          "user-bonn": "123",
                        };
                        const expectedPwd = SUPERADMIN_PASSWORDS[currentUserId];
                        if (!reauthPassword) {
                          setReauthError("Please enter your password.");
                          return;
                        }
                        if (reauthPassword !== expectedPwd) {
                          setReauthError("Incorrect password. Please try again.");
                          return;
                        }
                        deleteUser(deleteTarget.id);
                        closeDeleteModal();
                      }}
                    >
                      Delete Permanently
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};



export default ManageUsers;
