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
  type Role,
  type UserItem,
  deleteUser,
} from "../store/usersStore";

type Props = {
  onBack: () => void;
};

type SelectBaseProps = {
  id: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  children: React.ReactNode;
  placeholder: string;
  className?: string;
};

const SelectInput: React.FC<SelectBaseProps> = ({
  id,
  value,
  onChange,
  children,
  placeholder,
  className,
}) => {
  return (
    <select id={id} value={value} onChange={onChange} required className={className}>
      <option value="" disabled hidden>
        {placeholder}
      </option>
      {children}
    </select>
  );
};

type StatusToggleProps = {
  checked: boolean;
  disabled?: boolean;
  onChange: (nextChecked: boolean) => void;
  ariaLabel: string;
};

const StatusToggle: React.FC<StatusToggleProps> = ({
  checked,
  disabled,
  onChange,
  ariaLabel,
}) => {
  return (
    <button
      type="button"
      className={[
        "statusToggle",
        checked ? "statusToggle--on" : "statusToggle--off",
        disabled ? "statusToggle--disabled" : "",
      ].join(" ")}
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
};

// Simple inline SVG icons (no extra deps)
const Icon = {
  view: (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 5c5.5 0 9.6 4.6 10.8 6.1.3.4.3.9 0 1.3C21.6 13.9 17.5 18.5 12 18.5S2.4 13.9 1.2 12.4c-.3-.4-.3-.9 0-1.3C2.4 9.6 6.5 5 12 5Zm0 2c-3.9 0-7.3 3.2-8.6 4.8C4.7 13.3 8.1 16.5 12 16.5s7.3-3.2 8.6-4.8C19.3 10.2 15.9 7 12 7Zm0 1.5A3.5 3.5 0 1 1 12 15a3.5 3.5 0 0 1 0-7Zm0 2A1.5 1.5 0 1 0 12 13a1.5 1.5 0 0 0 0-3Z"
      />
    </svg>
  ),
  edit: (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M3 17.3V21h3.7L17.8 9.9l-3.7-3.7L3 17.3Zm2.1 1.6 9-9 1.6 1.6-9 9H5.1ZM20.7 7c.4-.4.4-1 0-1.4l-2.3-2.3c-.4-.4-1-.4-1.4 0l-1.8 1.8 3.7 3.7L20.7 7Z"
      />
    </svg>
  ),
  trash: (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M9 3h6l1 2h4v2H4V5h4l1-2Zm1 7h2v9h-2v-9Zm4 0h2v9h-2v-9ZM7 10h2v9H7v-9Z"
      />
    </svg>
  ),
};

const ManageUsers: React.FC<Props> = ({ onBack }) => {
  // Your "protected" user id
  const currentUserId = "superadmin-1";

  // You currently hardcode this, keeping it.
  const isSuperAdmin = true;

  const [users, setUsers] = useState<UserItem[]>(() => getUsers());
  const [userSearch, setUserSearch] = useState("");

  const [orgs, setOrgs] = useState<OrganizationItem[]>(() => getOrganizations());

  // Filters
  const [roleFilter, setRoleFilter] = useState<"all" | Role>("all");
  const [orgFilter, setOrgFilter] = useState<"all" | string>("all");

  useEffect(() => {
    const unsubOrg = subscribeOrganizations(() => setOrgs(getOrganizations()));
    return unsubOrg;
  }, []);

  useEffect(() => {
    seedUserIfMissing({
      id: currentUserId,
      username: "Super Admin",
      email: "superadmin@local.dev",
      role: "admin",
      organization_id: "Admin",
      status: "active",
      createdAt: new Date().toISOString(),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgs]);

  useEffect(() => {
    const unsub = subscribeUsers(() => setUsers(getUsers()));
    return unsub;
  }, []);

  const orgById = useMemo(() => {
    const map = new Map<string, OrganizationItem>();
    // FIX: your original used o.organization_id as key but typed orgs as OrganizationItem.
    // Most stores use `id`, but your UI uses `organization_id` elsewhere.
    // So: support both safely.
    for (const o of orgs as any[]) {
      const key = o.organization_id ?? o.id;
      if (key) map.set(key, o as OrganizationItem);
    }
    return map;
  }, [orgs]);

  const [newUser, setNewUser] = useState<{
    username: string;
    email: string;
    role: Role | "";
    organization_id: string;
    status: "active" | "inactive";
  }>({
    username: "",
    email: "",
    role: "",
    organization_id: "",
    status: "active",
  });

  const [showAddUser, setShowAddUser] = useState(false);

  // Lightweight modals for actions
  const [viewUser, setViewUser] = useState<UserItem | null>(null);
  const [editUser, setEditUser] = useState<UserItem | null>(null);

  // ✅ Keep draft non-null only when modal is open
  const [editDraft, setEditDraft] = useState<{ role: Role; organization_id: string } | null>(
    null
  );

  useEffect(() => {
    if (!editUser) {
      setEditDraft(null);
      return;
    }
    setEditDraft({
      role: editUser.role,
      organization_id: editUser.organization_id,
    });
  }, [editUser]);

  const openAddUserModal = () => setShowAddUser(true);

  const closeAddUserModal = () => {
    setShowAddUser(false);
    setNewUser({
      username: "",
      email: "",
      role: "",
      organization_id: "",
      status: "active",
    });
  };

  const saveUser = (e: React.FormEvent) => {
    e.preventDefault();

    const username = newUser.username.trim();
    const email = newUser.email.trim();

    if (!username || !email || !newUser.role || !newUser.organization_id) {
      alert("Please fill in all fields.");
      return;
    }

    try {
      addUser({
        username,
        email,
        role: newUser.role,
        organization_id: newUser.organization_id,
        status: newUser.status,
      });
      closeAddUserModal();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to add user.";
      alert(msg);
    }
  };

  const setUserStatus = (userId: string, status: "active" | "inactive") => {
    updateUser(userId, { status });
  };

  const clearFilters = () => {
    setRoleFilter("all");
    setOrgFilter("all");
  };

  const filteredUsers = useMemo(() => {
    const q = userSearch.toLowerCase().trim();
    return users.filter((u) => {
      const orgName = orgById.get(u.organization_id)?.name ?? "";

      const matchesSearch =
        !q ||
        u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q) ||
        orgName.toLowerCase().includes(q) ||
        u.status.toLowerCase().includes(q);

      const matchesRole = roleFilter === "all" ? true : u.role === roleFilter;
      const matchesOrg = orgFilter === "all" ? true : u.organization_id === orgFilter;

      return matchesSearch && matchesRole && matchesOrg;
    });
  }, [users, userSearch, orgById, roleFilter, orgFilter]);

  const activeFiltersCount = (roleFilter !== "all" ? 1 : 0) + (orgFilter !== "all" ? 1 : 0);

  const handleDelete = (u: UserItem) => {
    // ✅ Protect SuperAdmin row from deletion
    if (u.id === currentUserId) return;

    const ok = confirm(`Delete user "${u.username}"?`);
    if (!ok) return;

    deleteUser(u.id);
  };

  // ✅ Centralized "protected row" logic
  const isProtectedRow = (u: UserItem) => u.id === currentUserId;

  return (
    <div className="ManageUsersHome">
      <div className="topRow">
        <button className="backBtn" onClick={onBack}>
          Back
        </button>

        <h1 className="manageUserTitle">Manage Users</h1>

        <div className="topActions">
          <input
            className="searchInput"
            placeholder="Search user title or name"
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
          />
          <button className="addUserBtn" onClick={openAddUserModal}>
            + ADD A USER
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="filtersBar">
        <div className="filtersLeft">
          <div className="filterPill">
            <span className="filterLabel">Role</span>
            <select
              className="filterSelect"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as "all" | Role)}
            >
              <option value="all">All</option>
              <option value="admin">Admin</option>
              <option value="tLeader">Team Leader</option>
            </select>
          </div>

          <div className="filterPill">
            <span className="filterLabel">Organization</span>
            <select
              className="filterSelect"
              value={orgFilter}
              onChange={(e) => setOrgFilter(e.target.value)}
            >
              <option value="all">All</option>
              {orgs.map((o: any) => (
                <option key={o.organization_id ?? o.id} value={o.organization_id ?? o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="filtersRight">
          {activeFiltersCount > 0 && <span className="filtersCount">{activeFiltersCount} filter(s)</span>}
          <button
            type="button"
            className="filtersClearBtn"
            onClick={clearFilters}
            disabled={activeFiltersCount === 0}
          >
            Clear
          </button>
        </div>
      </div>

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
                  const isSelf = u.id === currentUserId;
                  const protectedRow = isProtectedRow(u);

                  // Your current rule: superadmin can toggle others, but not self
                  const canToggle = isSuperAdmin && !isSelf;

                  const orgName = orgById.get(u.organization_id)?.name ?? "—";

                  return (
                    <tr key={u.id}>
                      <td>{u.username}</td>
                      <td>{u.email}</td>
                      <td>{u.role === "admin" ? "Admin" : "Team Leader"}</td>
                      <td>{orgName}</td>

                      <td>
                        {isSuperAdmin ? (
                          <>
                            <StatusToggle
                              checked={u.status === "active"}
                              disabled={!canToggle}
                              ariaLabel={
                                isSelf
                                  ? `Your status is ${u.status}. You cannot change your own status.`
                                  : `Toggle status for ${u.username}`
                              }
                              onChange={(nextChecked) =>
                                setUserStatus(u.id, nextChecked ? "active" : "inactive")
                              }
                            />
                            {isSelf && (
                              <div className="statusLockHint">
                                Locked for self-protection. You cannot change your own status.
                              </div>
                            )}
                          </>
                        ) : u.status === "active" ? (
                          <span className="statusActive">Active</span>
                        ) : (
                          <span className="statusInactive">Inactive</span>
                        )}
                      </td>

                      <td>{new Date(u.createdAt).toLocaleString()}</td>

                      {/* ✅ Action icons */}
                      <td className="actionsCell">
                        <button
                          className="iconBtn"
                          type="button"
                          title="View"
                          onClick={() => setViewUser(u)}
                        >
                          {Icon.view}
                        </button>

                        <button
                          className="iconBtn"
                          type="button"
                          title={protectedRow ? "Super Admin cannot be edited" : "Edit"}
                          onClick={() => {
                            if (protectedRow) return;
                            setEditUser(u);
                          }}
                          disabled={protectedRow}
                          style={
                            protectedRow
                              ? { opacity: 0.4, cursor: "not-allowed" }
                              : undefined
                          }
                        >
                          {Icon.edit}
                        </button>

                        <button
                          className="iconBtn"
                          type="button"
                          title={protectedRow ? "Super Admin cannot be deleted" : "Delete"}
                          onClick={() => handleDelete(u)}
                          disabled={protectedRow}
                          style={
                            protectedRow
                              ? { opacity: 0.4, cursor: "not-allowed" }
                              : undefined
                          }
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

      {/* Add User modal (unchanged) */}
      {showAddUser && (
        <div className="modalOverlay" onClick={closeAddUserModal}>
          <div className="modalCard" onClick={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <h2 className="modalTitle">ADD USER</h2>
              <button className="modalCloseBtn" onClick={closeAddUserModal} type="button">
                ✕
              </button>
            </div>

            <form onSubmit={saveUser} className="modalBody">
              <label htmlFor="username">Username:</label>
              <div className="inputGroupUsername">
                <input
                  id="username"
                  type="text"
                  value={newUser.username}
                  onChange={(e) => setNewUser((p) => ({ ...p, username: e.target.value }))}
                  placeholder="Enter username"
                />
              </div>

              <label htmlFor="email">Email:</label>
              <div className="inputGroupEmail">
                <input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser((p) => ({ ...p, email: e.target.value }))}
                  placeholder="Enter email"
                />
              </div>

              <label htmlFor="role">Role:</label>
              <div className="inputGroupRole">
                <SelectInput
                  id="role"
                  value={newUser.role}
                  onChange={(e) => setNewUser((p) => ({ ...p, role: e.target.value as Role }))}
                  placeholder="SELECT ROLE"
                >
                  <option value="admin">ADMIN</option>
                  <option value="tLeader">TEAM LEADER</option>
                </SelectInput>
              </div>

              <label htmlFor="organization">Organization:</label>
              <div className="inputGroupOrganization">
                <SelectInput
                  id="organization"
                  value={newUser.organization_id}
                  onChange={(e) => setNewUser((p) => ({ ...p, organization_id: e.target.value }))}
                  placeholder={orgs.length ? "SELECT ORGANIZATION" : "ADD ORGS FIRST"}
                >
                  {orgs.map((o: any) => (
                    <option key={o.organization_id ?? o.id} value={o.organization_id ?? o.id}>
                      {o.name}
                    </option>
                  ))}
                </SelectInput>
              </div>

              <label htmlFor="status">Status</label>
              <div className="inputGroupStatus">
                <select
                  id="status"
                  value={newUser.status}
                  onChange={(e) =>
                    setNewUser((p) => ({
                      ...p,
                      status: e.target.value as "active" | "inactive",
                    }))
                  }
                  required
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="modalFooter">
                <button type="button" className="cancelBtn" onClick={closeAddUserModal}>
                  Cancel
                </button>
                <button type="submit" className="saveUserBtn">
                  Save User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View modal (lightweight) */}
      {viewUser && (
        <div className="modalOverlay" onClick={() => setViewUser(null)}>
          <div className="modalCard" onClick={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <h2 className="modalTitle">VIEW USER</h2>
              <button className="modalCloseBtn" onClick={() => setViewUser(null)} type="button">
                ✕
              </button>
            </div>
            <div className="modalBody">
              <div className="kvGrid">
                <div className="kv">
                  <span>Username</span>
                  <b>{viewUser.username}</b>
                </div>
                <div className="kv">
                  <span>Email</span>
                  <b>{viewUser.email}</b>
                </div>
                <div className="kv">
                  <span>Role</span>
                  <b>{viewUser.role}</b>
                </div>
                <div className="kv">
                  <span>Organization</span>
                  <b>{orgById.get(viewUser.organization_id)?.name ?? "—"}</b>
                </div>
                <div className="kv">
                  <span>Status</span>
                  <b>{viewUser.status}</b>
                </div>
                <div className="kv">
                  <span>Created</span>
                  <b>{new Date(viewUser.createdAt).toLocaleString()}</b>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editUser && editDraft && (
        <div className="modalOverlay" onClick={() => setEditUser(null)}>
          <div className="modalCard" onClick={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <h2 className="modalTitle">EDIT USER</h2>
              <button className="modalCloseBtn" onClick={() => setEditUser(null)} type="button">
                ✕
              </button>
            </div>

            <div className="modalBody">
              <div className="editUserTop">
                <div className="editUserName">{editUser.username}</div>
                <div className="editUserEmail">{editUser.email}</div>
              </div>

              <label htmlFor="editRole">Role</label>
              <div className="inputGroupRole">
                <select
                  id="editRole"
                  value={editDraft.role}
                  onChange={(e) =>
                    setEditDraft((p) => (p ? { ...p, role: e.target.value as Role } : p))
                  }
                  required
                >
                  <option value="admin">ADMIN</option>
                  <option value="tLeader">TEAM LEADER</option>
                </select>
              </div>

              <label htmlFor="editOrg">Organization</label>
              <div className="inputGroupOrganization">
                <select
                  id="editOrg"
                  value={editDraft.organization_id}
                  onChange={(e) =>
                    setEditDraft((p) => (p ? { ...p, organization_id: e.target.value } : p))
                  }
                  required
                >
                  <option value="" disabled>
                    SELECT ORGANIZATION
                  </option>
                  {orgs.map((o: any) => (
                    <option key={o.organization_id ?? o.id} value={o.organization_id ?? o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="modalFooter">
                <button type="button" className="cancelBtn" onClick={() => setEditUser(null)}>
                  Cancel
                </button>

                <button
                  type="button"
                  className="saveUserBtn"
                  onClick={() => {
                    // ✅ Double-safety: even if somehow opened, block edit on protected row
                    if (editUser.id === currentUserId) {
                      alert("Super Admin cannot be edited.");
                      return;
                    }

                    if (!editDraft.organization_id) {
                      alert("Please select an organization.");
                      return;
                    }

                    updateUser(editUser.id, {
                      role: editDraft.role,
                      organization_id: editDraft.organization_id,
                    });

                    setEditUser(null);
                  }}
                >
                  Save Changes
                </button>
              </div>

              <div className="editHint">Only role and organization can be changed here.</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUsers;