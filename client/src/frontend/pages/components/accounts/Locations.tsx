import React, { useEffect, useMemo, useState } from "react";
import {
  addLocation,
  deleteLocation,
  getLocations,
  subscribeLocations,
  type LocationItem,
  updateLocation,
} from "../store/locationsStore";
import { getOrganizations, subscribeOrganizations, type OrganizationItem } from "../store/organizationsStore";
import '/src/frontend/styles/locations.css';


type Props = {
  onBack: () => void;
};

const ManageLocations: React.FC<Props> = ({ onBack }) => {
  const [search, setSearch] = useState("");

  const [orgs, setOrgs] = useState<OrganizationItem[]>(() => getOrganizations());
  const [locations, setLocations] = useState<LocationItem[]>(() => getLocations());

  const orgById = useMemo(() => {
    const map = new Map<string, OrganizationItem>();
    for (const o of orgs) map.set(o.organization_id, o);
    return map;
  }, [orgs]);

  useEffect(() => {
    const unsubLoc = subscribeLocations(() => setLocations(getLocations()));
    const unsubOrg = subscribeOrganizations(() => setOrgs(getOrganizations()));
    return () => {
      unsubLoc();
      unsubOrg();
    };
  }, []);

  const [showAdd, setShowAdd] = useState(false);
  const [newLoc, setNewLoc] = useState({
    organization_id: "",
    name: "",
    address: "",
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState({
    organization_id: "",
    name: "",
    address: "",
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return locations;

    return locations.filter((l) => {
      const orgName = orgById.get(l.organization_id)?.name ?? "";
      return (
        l.name.toLowerCase().includes(q) ||
        l.address.toLowerCase().includes(q) ||
        l.location_id.toLowerCase().includes(q) ||
        orgName.toLowerCase().includes(q)
      );
    });
  }, [locations, search, orgById]);

  const openAdd = () => {
    setNewLoc({
      organization_id: orgs[0]?.organization_id ?? "",
      name: "",
      address: "",
    });
    setShowAdd(true);
  };

  const closeAdd = () => {
    setShowAdd(false);
    setNewLoc({ organization_id: "", name: "", address: "" });
  };

  const saveAdd = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newLoc.organization_id) {
      alert("Please select an organization first.");
      return;
    }
    if (!newLoc.name.trim()) {
      alert("Location name is required.");
      return;
    }
    if (!newLoc.address.trim()) {
      alert("Address is required.");
      return;
    }

    addLocation(newLoc);
    closeAdd();
  };

  const startEdit = (l: LocationItem) => {
    setEditingId(l.location_id);
    setEditDraft({
      organization_id: l.organization_id,
      name: l.name,
      address: l.address,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft({ organization_id: "", name: "", address: "" });
  };

  const saveEdit = () => {
    if (!editingId) return;

    if (!editDraft.organization_id) {
      alert("Organization is required.");
      return;
    }
    if (!editDraft.name.trim()) {
      alert("Location name is required.");
      return;
    }
    if (!editDraft.address.trim()) {
      alert("Address is required.");
      return;
    }

    updateLocation(editingId, {
      organization_id: editDraft.organization_id,
      name: editDraft.name,
      address: editDraft.address,
    });

    cancelEdit();
  };

  const removeLocation = (l: LocationItem) => {
    const ok = confirm(`Delete location "${l.name}"?`);
    if (!ok) return;
    deleteLocation(l.location_id);
  };

  return (
    <div className="ManageUsersHome">
      <div className="topRow">
        <button className="backBtn" onClick={onBack}>
          Back
        </button>

        <h1 className="manageUserTitle">Manage Locations</h1>

        <div className="topActions">
          <input
            className="searchInput"
            placeholder="Search location title or name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <button className="addUserBtn" onClick={openAdd} disabled={orgs.length === 0}>
            + ADD A LOCATION
          </button>
        </div>
      </div>

      <div className="viewPage">
        {orgs.length === 0 ? (
          <h2>No organizations found. Add an organization first.</h2>
        ) : filtered.length === 0 ? (
          <h2>No locations yet.</h2>
        ) : (
          <div className="usersTableWrap">
            <table className="usersTable">
              <thead>
                <tr>
                  <th>Location ID</th>
                  <th>Organization</th>
                  <th>Location Name</th>
                  <th>Address</th>
                  <th>Created</th>
                  <th style={{ width: 180 }}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((l) => {
                  const isEditing = editingId === l.location_id;
                  const orgName = orgById.get(l.organization_id)?.name ?? "—";

                  return (
                    <tr key={l.location_id}>
                      <td>{l.location_id}</td>

                      <td>
                        {isEditing ? (
                          <select
                            value={editDraft.organization_id}
                            onChange={(e) =>
                              setEditDraft((p) => ({ ...p, organization_id: e.target.value }))
                            }
                          >
                            {orgs.map((o) => (
                              <option key={o.organization_id} value={o.organization_id}>
                                {o.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          orgName
                        )}
                      </td>

                      <td>
                        {isEditing ? (
                          <input
                            value={editDraft.name}
                            onChange={(e) => setEditDraft((p) => ({ ...p, name: e.target.value }))}
                          />
                        ) : (
                          l.name
                        )}
                      </td>

                      <td>
                        {isEditing ? (
                          <input
                            value={editDraft.address}
                            onChange={(e) =>
                              setEditDraft((p) => ({ ...p, address: e.target.value }))
                            }
                          />
                        ) : (
                          l.address
                        )}
                      </td>

                      <td>{new Date(l.created_at).toLocaleString()}</td>

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
                            <button className="addUserBtn" type="button" onClick={() => startEdit(l)}>
                              Edit
                            </button>
                            <button
                              className="cancelBtn"
                              type="button"
                              onClick={() => removeLocation(l)}
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
              <h2 className="modalTitle">Add Location</h2>
              <button className="modalCloseBtn" onClick={closeAdd} type="button">
                ✕
              </button>
            </div>

            <form className="modalBody" onSubmit={saveAdd}>
              <label htmlFor="locOrg">Organization</label>
              <div className="inputGroupOrganization">
                <select
                  id="locOrg"
                  value={newLoc.organization_id}
                  onChange={(e) => setNewLoc((p) => ({ ...p, organization_id: e.target.value }))}
                  required
                >
                  <option value="" disabled hidden>
                    SELECT ORGANIZATION
                  </option>
                  {orgs.map((o) => (
                    <option key={o.organization_id} value={o.organization_id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>

              <label htmlFor="locName">Name</label>
              <div className="inputGroupUsername">
                <input
                  id="locName"
                  value={newLoc.name}
                  onChange={(e) => setNewLoc((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Enter location name"
                />
              </div>

              <label htmlFor="locAddress">Address</label>
              <div className="inputGroupEmail">
                <input
                  id="locAddress"
                  value={newLoc.address}
                  onChange={(e) => setNewLoc((p) => ({ ...p, address: e.target.value }))}
                  placeholder="Enter address"
                />
              </div>

              <div className="modalFooter">
                <button className="cancelBtn" type="button" onClick={closeAdd}>
                  Cancel
                </button>
                <button className="saveUserBtn" type="submit">
                  Save Location
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageLocations;