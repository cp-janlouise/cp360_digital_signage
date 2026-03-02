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

const ManageOrganizations: React.FC<Props> = ({ onBack }) => {
  const [search, setSearch] = useState("");
  const [orgs, setOrgs] = useState<OrganizationItem[]>(() => getOrganizations());

  const [showAdd, setShowAdd] = useState(false);
  const [newOrg, setNewOrg] = useState({ name: "", description: "" });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState({ name: "", description: "" });

  useEffect(() => {
    const unsub = subscribeOrganizations(() => setOrgs(getOrganizations()));
    return unsub;
  }, []);

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

  const startEdit = (org: OrganizationItem) => {
    setEditingId(org.organization_id);
    setEditDraft({ name: org.name, description: org.description });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft({ name: "", description: "" });
  };

  const saveEdit = () => {
    if (!editingId) return;
    if (!editDraft.name.trim()) {
      alert("Organization name is required.");
      return;
    }
    updateOrganization(editingId, { name: editDraft.name, description: editDraft.description });
    cancelEdit();
  };

  const removeOrg = (org: OrganizationItem) => {
    const ok = confirm(`Delete organization "${org.name}"?`);
    if (!ok) return;
    deleteOrganization(org.organization_id);
  };

  return (
    <div className="ManageUsersHome">
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
                  <th style={{ width: 180 }}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((org) => {
                  const isEditing = editingId === org.organization_id;

                  return (
                    <tr key={org.organization_id}>
                      <td>{org.organization_id}</td>

                      <td>
                        {isEditing ? (
                          <input
                            value={editDraft.name}
                            onChange={(e) => setEditDraft((p) => ({ ...p, name: e.target.value }))}
                          />
                        ) : (
                          org.name
                        )}
                      </td>

                      <td>
                        {isEditing ? (
                          <input
                            value={editDraft.description}
                            onChange={(e) =>
                              setEditDraft((p) => ({ ...p, description: e.target.value }))
                            }
                          />
                        ) : (
                          org.description
                        )}
                      </td>

                      <td>{new Date(org.created_at).toLocaleString()}</td>

                      <td>
                        {isEditing ? (
                          <div style={{ display: "flex", gap: 8 }}>
                            <button className="saveUserBtn" type="button" onClick={saveEdit}>
                              Save
                            </button>
                            <button className="cancelBtn" type="button" onClick={cancelEdit}>
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: "flex", gap: 8 }}>
                            <button
                              className="addUserBtn"
                              type="button"
                              onClick={() => startEdit(org)}
                            >
                              Edit
                            </button>
                            <button
                              className="cancelBtn"
                              type="button"
                              onClick={() => removeOrg(org)}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAdd && (
        <div className="modalOverlay" onClick={closeAdd}>
          <div className="modalCard" onClick={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <h2 className="modalTitle">Add Organization</h2>
              <button className="modalCloseBtn" onClick={closeAdd} type="button">
                ✕
              </button>
            </div>

            <form className="modalBody" onSubmit={saveAdd}>
              <label htmlFor="orgName">Name</label>
              <div className="inputGroupUsername">
                <input
                  id="orgName"
                  value={newOrg.name}
                  onChange={(e) => setNewOrg((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Enter organization name"
                />
              </div>

              <label htmlFor="orgDesc">Description</label>
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
    </div>
  );
};

export default ManageOrganizations;