import React, { useEffect, useMemo, useState } from "react";
import {
  addOrganization,
  deleteOrganization,
  getOrganizations,
  subscribeOrganizations,
  type OrganizationItem,
  updateOrganization,
} from "../store/organizationsStore";
import '/src/frontend/styles/organizations.css';

type Props = {
  onBack: () => void;
};

// ── Inline SVG icons (matches Users.tsx style) ──────────────────────────────
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

// ── Component ────────────────────────────────────────────────────────────────
const ManageOrganizations: React.FC<Props> = ({ onBack }) => {
  const [search, setSearch] = useState("");
  const [orgs, setOrgs] = useState<OrganizationItem[]>(() => getOrganizations());

  // Add modal
  const [showAdd, setShowAdd] = useState(false);
  const [newOrg, setNewOrg] = useState({ name: "", description: "" });

  // View / Edit modals
  const [viewOrg, setViewOrg] = useState<OrganizationItem | null>(null);
  const [editOrg, setEditOrg] = useState<OrganizationItem | null>(null);
  const [editDraft, setEditDraft] = useState({ name: "", description: "" });

  // ── Subscriptions ────────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = subscribeOrganizations(() => setOrgs(getOrganizations()));
    return unsub;
  }, []);

  // ── Sync edit draft ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!editOrg) {
      setEditDraft({ name: "", description: "" });
      return;
    }
    setEditDraft({ name: editOrg.name, description: editOrg.description });
  }, [editOrg]);

  // ── Derived data ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return orgs;
    return orgs.filter(
      (o) =>
        o.name.toLowerCase().includes(q) ||
        o.description.toLowerCase().includes(q) ||
        o.organization_id.toLowerCase().includes(q)
    );
  }, [orgs, search]);

  // ── Actions ──────────────────────────────────────────────────────────────
  const openAdd = () => {
    setNewOrg({ name: "", description: "" });
    setShowAdd(true);
  };
  const closeAdd = () => {
    setShowAdd(false);
    setNewOrg({ name: "", description: "" });
  };

  const saveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrg.name.trim()) {
      alert("Organization name is required.");
      return;
    }
    const exists = orgs.some(
      (o) => o.name.trim().toLowerCase() === newOrg.name.trim().toLowerCase()
    );
    if (exists) {
      alert("An organization with that name already exists.");
      return;
    }
    addOrganization(newOrg);
    closeAdd();
  };

  const saveEdit = () => {
    if (!editOrg) return;
    if (!editDraft.name.trim()) {
      alert("Organization name is required.");
      return;
    }
    updateOrganization(editOrg.organization_id, {
      name: editDraft.name,
      description: editDraft.description,
    });
    setEditOrg(null);
  };

  const removeOrg = (org: OrganizationItem) => {
    const ok = confirm(`Delete organization "${org.name}"?`);
    if (!ok) return;
    deleteOrganization(org.organization_id);
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="ManageUsersHome">
      {/* Top row */}
      <div className="topRow">
        <button className="backBtn" onClick={onBack}>
          Back
        </button>
        <h1 className="manageUserTitle">Manage Organizations</h1>
        <div className="topActions">
          <input
            className="searchInput"
            placeholder="Search organization title or name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="addUserBtn" onClick={openAdd}>
            + ADD AN ORGANIZATION
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="viewPage">
        {filtered.length === 0 ? (
          <h2>No organizations yet.</h2>
        ) : (
          <div className="usersTableWrap">
            <table className="usersTable">
              <thead>
                <tr>
                  <th>Organization ID</th>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Created</th>
                  <th className="actionsCol">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((org) => (
                  <tr key={org.organization_id}>
                    <td>{org.organization_id}</td>
                    <td>{org.name}</td>
                    <td>{org.description || "—"}</td>
                    <td>{new Date(org.created_at).toLocaleString()}</td>
                    <td className="actionsCell">
                      <button
                        className="iconBtn"
                        type="button"
                        title="View"
                        onClick={() => setViewOrg(org)}
                      >
                        {Icon.view}
                      </button>
                      <button
                        className="iconBtn"
                        type="button"
                        title="Edit"
                        onClick={() => setEditOrg(org)}
                      >
                        {Icon.edit}
                      </button>
                      <button
                        className="iconBtn"
                        type="button"
                        title="Delete"
                        onClick={() => removeOrg(org)}
                      >
                        {Icon.trash}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── ADD ORGANIZATION MODAL ────────────────────────────────────────── */}
      {showAdd && (
        <div className="modalOverlay" onClick={closeAdd}>
          <div className="modalCard" onClick={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <h2 className="modalTitle">ADD ORGANIZATION</h2>
              <button className="modalCloseBtn" onClick={closeAdd} type="button">
                ✕
              </button>
            </div>
            <form className="modalBody" onSubmit={saveAdd}>
              <label htmlFor="orgName">Name:</label>
              <div className="inputGroupUsername">
                <input
                  id="orgName"
                  value={newOrg.name}
                  onChange={(e) => setNewOrg((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Enter organization name"
                />
              </div>

              <label htmlFor="orgDesc">Description:</label>
              <div className="inputGroupEmail">
                <input
                  id="orgDesc"
                  value={newOrg.description}
                  onChange={(e) => setNewOrg((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Enter description"
                />
              </div>

              <div className="modalFooter">
                <button className="cancelBtn" type="button" onClick={closeAdd}>
                  Cancel
                </button>
                <button className="saveUserBtn" type="submit">
                  Save Organization
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── VIEW ORGANIZATION MODAL ───────────────────────────────────────── */}
      {viewOrg && (
        <div className="modalOverlay" onClick={() => setViewOrg(null)}>
          <div className="modalCard" onClick={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <h2 className="modalTitle">VIEW ORGANIZATION</h2>
              <button
                className="modalCloseBtn"
                onClick={() => setViewOrg(null)}
                type="button"
              >
                ✕
              </button>
            </div>
            <div className="modalBody">
              <div className="kvGrid">
                <div className="kv">
                  <span>Organization ID</span>
                  <b>{viewOrg.organization_id}</b>
                </div>
                <div className="kv">
                  <span>Name</span>
                  <b>{viewOrg.name}</b>
                </div>
                <div className="kv">
                  <span>Description</span>
                  <b>{viewOrg.description || "—"}</b>
                </div>
                <div className="kv">
                  <span>Created</span>
                  <b>{new Date(viewOrg.created_at).toLocaleString()}</b>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT ORGANIZATION MODAL ───────────────────────────────────────── */}
      {editOrg && (
        <div className="modalOverlay" onClick={() => setEditOrg(null)}>
          <div className="modalCard" onClick={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <h2 className="modalTitle">EDIT ORGANIZATION</h2>
              <button
                className="modalCloseBtn"
                onClick={() => setEditOrg(null)}
                type="button"
              >
                ✕
              </button>
            </div>
            <div className="modalBody">
              <div className="editUserTop">
                <div className="editUserName">{editOrg.name}</div>
                <div className="editUserEmail">{editOrg.organization_id}</div>
              </div>

              <label htmlFor="editOrgName">Name</label>
              <div className="inputGroupUsername">
                <input
                  id="editOrgName"
                  value={editDraft.name}
                  onChange={(e) => setEditDraft((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Organization name"
                />
              </div>

              <label htmlFor="editOrgDesc">Description</label>
              <div className="inputGroupEmail">
                <input
                  id="editOrgDesc"
                  value={editDraft.description}
                  onChange={(e) => setEditDraft((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Description"
                />
              </div>

              <div className="modalFooter">
                <button
                  type="button"
                  className="cancelBtn"
                  onClick={() => setEditOrg(null)}
                >
                  Cancel
                </button>
                <button type="button" className="saveUserBtn" onClick={saveEdit}>
                  Save Changes
                </button>
              </div>

              <div className="editHint">
                Name and description can be changed here.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageOrganizations;
