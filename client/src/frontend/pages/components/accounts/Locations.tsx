import React, { useEffect, useMemo, useState } from "react";
import {
  getOrganizations,
  subscribeOrganizations,
  type OrganizationItem,
} from "../store/organizationsStore";
import {
  addLocation,
  deleteLocation,
  getLocations,
  subscribeLocations,
  updateLocation,
  type LocationItem,
} from "../store/locationsStore";

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
  screens: (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M4 5h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-6l1 2h2v2H7v-2h2l1-2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Zm0 2v8h16V7H4Z"
      />
    </svg>
  ),
  playlist: (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M4 6h14v2H4V6Zm0 4h14v2H4v-2Zm0 4h10v2H4v-2Zm16-3v6.2a2.8 2.8 0 1 1-2-2.7V10h2Z"
      />
    </svg>
  ),
};

// ── Draft types ──────────────────────────────────────────────────────────────
type LocationDraft = {
  organization_id: string;
  name: string;
  address: string;
};

const EMPTY_DRAFT: LocationDraft = { organization_id: "", name: "", address: "" };

// ── Component ────────────────────────────────────────────────────────────────
const ManageLocations: React.FC<Props> = ({ onBack }) => {
  const [locations, setLocations] = useState<LocationItem[]>(() => getLocations());
  const [orgs, setOrgs] = useState<OrganizationItem[]>(() => getOrganizations());
  const [search, setSearch] = useState("");
  const [orgFilter, setOrgFilter] = useState<"all" | string>("all");

  // Add modal
  const [showAdd, setShowAdd] = useState(false);
  const [newLoc, setNewLoc] = useState<LocationDraft>(EMPTY_DRAFT);

  // View / Edit modals
  const [viewLocation, setViewLocation] = useState<LocationItem | null>(null);
  const [editLocation, setEditLocation] = useState<LocationItem | null>(null);
  const [editDraft, setEditDraft] = useState<LocationDraft | null>(null);

  // ── Subscriptions ────────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = subscribeLocations(() => setLocations(getLocations()));
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = subscribeOrganizations(() => setOrgs(getOrganizations()));
    return unsub;
  }, []);

  // ── Sync edit draft ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!editLocation) {
      setEditDraft(null);
      return;
    }
    setEditDraft({
      organization_id: editLocation.organization_id ?? "",
      name: editLocation.name ?? "",
      address: editLocation.address ?? "",
    });
  }, [editLocation]);

  // ── Derived data ─────────────────────────────────────────────────────────
  const orgById = useMemo(() => {
    const map = new Map<string, OrganizationItem>();
    for (const o of orgs) map.set(o.organization_id, o);
    return map;
  }, [orgs]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return locations.filter((l) => {
      const orgName = orgById.get(l.organization_id)?.name ?? "";
      const matchesSearch =
        !q ||
        l.name.toLowerCase().includes(q) ||
        l.address.toLowerCase().includes(q) ||
        orgName.toLowerCase().includes(q);
      const matchesOrg =
        orgFilter === "all" ? true : l.organization_id === orgFilter;
      return matchesSearch && matchesOrg;
    });
  }, [locations, search, orgById, orgFilter]);

  const activeFiltersCount = orgFilter !== "all" ? 1 : 0;

  // ── Actions ──────────────────────────────────────────────────────────────
  const openAddModal = () => {
    setNewLoc(EMPTY_DRAFT);
    setShowAdd(true);
  };
  const closeAddModal = () => {
    setShowAdd(false);
    setNewLoc(EMPTY_DRAFT);
  };

  const saveLocation = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newLoc.name.trim();
    if (!name || !newLoc.organization_id) {
      alert("Please fill in all required fields.");
      return;
    }
    addLocation({ organization_id: newLoc.organization_id, name, address: newLoc.address });
    closeAddModal();
  };

  const handleDelete = (loc: LocationItem) => {
    const ok = confirm(`Delete location "${loc.name}"?`);
    if (!ok) return;
    deleteLocation(loc.location_id);
  };

  const saveEdit = () => {
    if (!editLocation || !editDraft) return;
    if (!editDraft.name.trim() || !editDraft.organization_id) {
      alert("Please fill in all required fields.");
      return;
    }
    updateLocation(editLocation.location_id, {
      organization_id: editDraft.organization_id,
      name: editDraft.name,
      address: editDraft.address,
    });
    setEditLocation(null);
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="ManageUsersHome">
      {/* Top row */}
      <div className="topRow">
        <button className="backBtn" onClick={onBack}>
          Back
        </button>
        <h1 className="manageUserTitle">Manage Locations</h1>
        <div className="topActions">
          <input
            className="searchInput"
            placeholder="Search location name or address"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="addUserBtn" onClick={openAddModal}>
            + ADD A LOCATION
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="filtersBar">
        <div className="filtersLeft">
          <div className="filterPill">
            <span className="filterLabel">Organization</span>
            <select
              className="filterSelect"
              value={orgFilter}
              onChange={(e) => setOrgFilter(e.target.value)}
            >
              <option value="all">All</option>
              {orgs.map((o) => (
                <option key={o.organization_id} value={o.organization_id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="filtersRight">
          {activeFiltersCount > 0 && (
            <span className="filtersCount">{activeFiltersCount} filter(s)</span>
          )}
          <button
            type="button"
            className="filtersClearBtn"
            onClick={() => setOrgFilter("all")}
            disabled={activeFiltersCount === 0}
          >
            Clear
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="viewPage">
        {filtered.length === 0 ? (
          <h2>No locations yet.</h2>
        ) : (
          <div className="usersTableWrap">
            <table className="usersTable">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Address</th>
                  <th>Organization</th>
                  <th>Created</th>
                  <th className="actionsCol">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((loc) => (
                  <tr key={loc.location_id}>
                    <td>{loc.name}</td>
                    <td>{loc.address || "—"}</td>
                    <td>{orgById.get(loc.organization_id)?.name ?? "—"}</td>
                    <td>{new Date(loc.created_at).toLocaleString()}</td>
                    <td className="actionsCell">
                      <button
                        className="iconBtn"
                        type="button"
                        title="View"
                        onClick={() => setViewLocation(loc)}
                      >
                        {Icon.view}
                      </button>
                      <button
                        className="iconBtn"
                        type="button"
                        title="Edit"
                        onClick={() => setEditLocation(loc)}
                      >
                        {Icon.edit}
                      </button>
                      {/* <button
                        className="iconBtn"
                        type="button"
                        title="Manage Screens"
                        onClick={() => {
                          
                        }}
                      >
                        {Icon.screens}
                      </button> */}
                      {/* <button
                        className="iconBtn"
                        type="button"
                        title="Assign Playlist"
                        onClick={() => {
                        
                        }}
                      >
                        {Icon.playlist}
                      </button> */}
                      <button
                        className="iconBtn"
                        type="button"
                        title="Delete"
                        onClick={() => handleDelete(loc)}
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

      {/* ── ADD LOCATION MODAL ─────────────────────────────────────────────── */}
      {showAdd && (
        <div className="modalOverlay" onClick={closeAddModal}>
          <div className="modalCard" onClick={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <h2 className="modalTitle">ADD LOCATION</h2>
              <button className="modalCloseBtn" onClick={closeAddModal} type="button">
                ✕
              </button>
            </div>

            <form onSubmit={saveLocation} className="modalBody">
              <label htmlFor="locName">Name:</label>
              <div className="inputGroupUsername">
                <input
                  id="locName"
                  type="text"
                  value={newLoc.name}
                  onChange={(e) => setNewLoc((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Enter location name"
                />
              </div>

              <label htmlFor="locAddress">Address:</label>
              <div className="inputGroupEmail">
                <input
                  id="locAddress"
                  type="text"
                  value={newLoc.address}
                  onChange={(e) => setNewLoc((p) => ({ ...p, address: e.target.value }))}
                  placeholder="Enter address"
                />
              </div>

              <label htmlFor="locOrg">Organization:</label>
              <div className="inputGroupOrganization">
                <select
                  id="locOrg"
                  value={newLoc.organization_id}
                  onChange={(e) =>
                    setNewLoc((p) => ({ ...p, organization_id: e.target.value }))
                  }
                  required
                >
                  <option value="" disabled hidden>
                    {orgs.length ? "SELECT ORGANIZATION" : "ADD ORGS FIRST"}
                  </option>
                  {orgs.map((o) => (
                    <option key={o.organization_id} value={o.organization_id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="modalFooter">
                <button type="button" className="cancelBtn" onClick={closeAddModal}>
                  Cancel
                </button>
                <button type="submit" className="saveUserBtn">
                  Save Location
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── VIEW LOCATION MODAL ────────────────────────────────────────────── */}
      {viewLocation && (
        <div className="modalOverlay" onClick={() => setViewLocation(null)}>
          <div className="modalCard" onClick={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <h2 className="modalTitle">VIEW LOCATION</h2>
              <button
                className="modalCloseBtn"
                onClick={() => setViewLocation(null)}
                type="button"
              >
                ✕
              </button>
            </div>
            <div className="modalBody">
              <div className="kvGrid">
                <div className="kv">
                  <span>Name</span>
                  <b>{viewLocation.name}</b>
                </div>
                <div className="kv">
                  <span>Address</span>
                  <b>{viewLocation.address || "—"}</b>
                </div>
                <div className="kv">
                  <span>Organization</span>
                  <b>{orgById.get(viewLocation.organization_id)?.name ?? "—"}</b>
                </div>
                <div className="kv">
                  <span>Created</span>
                  <b>{new Date(viewLocation.created_at).toLocaleString()}</b>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT LOCATION MODAL ────────────────────────────────────────────── */}
      {editLocation && editDraft && (
        <div className="modalOverlay" onClick={() => setEditLocation(null)}>
          <div className="modalCard" onClick={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <h2 className="modalTitle">EDIT LOCATION</h2>
              <button
                className="modalCloseBtn"
                onClick={() => setEditLocation(null)}
                type="button"
              >
                ✕
              </button>
            </div>

            <div className="modalBody">
              <div className="editUserTop">
                <div className="editUserName">{editLocation.name}</div>
                <div className="editUserEmail">{editLocation.address || "No address"}</div>
              </div>

              <label htmlFor="editLocName">Name</label>
              <div className="inputGroupUsername">
                <input
                  id="editLocName"
                  type="text"
                  value={editDraft.name}
                  onChange={(e) =>
                    setEditDraft((p) => (p ? { ...p, name: e.target.value } : p))
                  }
                  placeholder="Location name"
                />
              </div>

              <label htmlFor="editLocAddress">Address</label>
              <div className="inputGroupEmail">
                <input
                  id="editLocAddress"
                  type="text"
                  value={editDraft.address}
                  onChange={(e) =>
                    setEditDraft((p) => (p ? { ...p, address: e.target.value } : p))
                  }
                  placeholder="Address"
                />
              </div>

              <label htmlFor="editLocOrg">Organization</label>
              <div className="inputGroupOrganization">
                <select
                  id="editLocOrg"
                  value={editDraft.organization_id}
                  onChange={(e) =>
                    setEditDraft((p) =>
                      p ? { ...p, organization_id: e.target.value } : p
                    )
                  }
                  required
                >
                  <option value="" disabled>
                    SELECT ORGANIZATION
                  </option>
                  {orgs.map((o) => (
                    <option key={o.organization_id} value={o.organization_id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="modalFooter">
                <button
                  type="button"
                  className="cancelBtn"
                  onClick={() => setEditLocation(null)}
                >
                  Cancel
                </button>
                <button type="button" className="saveUserBtn" onClick={saveEdit}>
                  Save Changes
                </button>
              </div>

              <div className="editHint">
                Name, address, and organization can be changed here.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageLocations;
