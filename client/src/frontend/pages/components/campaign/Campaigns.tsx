import React, { useEffect, useMemo, useState } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────
export type Campaign = {
  id: string;
  name: string;
  playlistId: string;
  startDate: string;   // "YYYY-MM-DD"
  endDate: string;
  startTime: string;   // "HH:MM"
  endTime: string;
  daysOfWeek: number[]; // 0=Sun … 6=Sat
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
};

export type PlaylistRef = {
  id: string;
  name: string;
  layoutName?: string;
};

type Props = {
  playlists: PlaylistRef[];
  onNavigateHome: () => void;
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const LS_KEY = "cp360_campaigns_v1";
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function uid() { return `cmp_${Math.random().toString(16).slice(2)}_${Date.now()}`; }
function now() { return new Date().toISOString(); }
function todayStr() { return new Date().toISOString().slice(0, 10); }

function load(): Campaign[] {
  try { const r = localStorage.getItem(LS_KEY); return r ? JSON.parse(r) : []; }
  catch { return []; }
}
function save(data: Campaign[]) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch {}
}

function emptyCampaign(): Omit<Campaign, "id" | "createdAt" | "updatedAt"> {
  return {
    name: "",
    playlistId: "",
    startDate: todayStr(),
    endDate: todayStr(),
    startTime: "08:00",
    endTime: "20:00",
    daysOfWeek: [1, 2, 3, 4, 5],
    status: "active",
  };
}

function isActive(c: Campaign): boolean {
  if (c.status !== "active") return false;
  const today = todayStr();
  return c.startDate <= today && today <= c.endDate;
}

// ── Component ─────────────────────────────────────────────────────────────────
const Campaigns: React.FC<Props> = ({ playlists, onNavigateHome }) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Create modal
  const [showModal, setShowModal]   = useState(false);
  const [modalEditId, setModalEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyCampaign());

  useEffect(() => {
    const loaded = load();
    setCampaigns(loaded);
    if (loaded.length) setSelectedId(loaded[0].id);
  }, []);

  useEffect(() => { save(campaigns); }, [campaigns]);

  // ── Derived ──────────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? campaigns.filter(c => c.name.toLowerCase().includes(q)) : campaigns;
  }, [campaigns, search]);

  const selected = useMemo(() => campaigns.find(c => c.id === selectedId) ?? null, [campaigns, selectedId]);

  // ── CRUD ─────────────────────────────────────────────────────────────────────
  const openCreate = () => {
    setModalEditId(null);
    setForm({ ...emptyCampaign(), playlistId: playlists[0]?.id ?? "" });
    setShowModal(true);
  };

  const openEdit = (c: Campaign) => {
    setModalEditId(c.id);
    setForm({
      name: c.name, playlistId: c.playlistId,
      startDate: c.startDate, endDate: c.endDate,
      startTime: c.startTime, endTime: c.endTime,
      daysOfWeek: c.daysOfWeek, status: c.status,
    });
    setShowModal(true);
  };

  const confirmModal = () => {
    if (!form.name.trim()) return alert("Please enter a campaign name.");
    if (!form.playlistId)  return alert("Please select a playlist.");
    if (form.startDate > form.endDate) return alert("End date must be on or after start date.");
    if (form.daysOfWeek.length === 0) return alert("Select at least one active day.");

    if (modalEditId) {
      setCampaigns(prev => prev.map(c =>
        c.id === modalEditId ? { ...c, ...form, name: form.name.trim(), updatedAt: now() } : c
      ));
    } else {
      const campaign: Campaign = {
        id: uid(), ...form, name: form.name.trim(),
        createdAt: now(), updatedAt: now(),
      };
      setCampaigns(prev => [campaign, ...prev]);
      setSelectedId(campaign.id);
    }
    setShowModal(false);
  };

  const deleteCampaign = (id: string) => {
    if (!confirm("Delete this campaign?")) return;
    setCampaigns(prev => {
      const next = prev.filter(c => c.id !== id);
      if (selectedId === id) setSelectedId(next[0]?.id ?? null);
      return next;
    });
  };

  const toggleStatus = (id: string) => {
    setCampaigns(prev => prev.map(c =>
      c.id === id
        ? { ...c, status: c.status === "active" ? "inactive" : "active", updatedAt: now() }
        : c
    ));
  };

  const toggleDay = (day: number) => {
    setForm(f => ({
      ...f,
      daysOfWeek: f.daysOfWeek.includes(day)
        ? f.daysOfWeek.filter(d => d !== day)
        : [...f.daysOfWeek, day].sort(),
    }));
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  const playlistName = (id: string) => playlists.find(p => p.id === id)?.name ?? "(missing playlist)";

  return (
    <div className="playlistsRoot">
      <div className="topRow">
        <button className="homeButton" onClick={onNavigateHome}>HOME</button>
        <h1 className="pageTitle">Campaigns</h1>
        <div className="topActions">
          <input className="searchInput" placeholder="Search campaigns…" value={search}
            onChange={e => setSearch(e.target.value)} />
          <button className="addCampaignBtn" onClick={openCreate}>+ NEW CAMPAIGN</button>
        </div>
      </div>

      {playlists.length === 0 && (
        <div className="plWarningBanner">
          ⚠ No playlists found. Create a playlist before building campaigns.
        </div>
      )}

      <div className="playlistsBody">
        {/* ── Sidebar ── */}
        <div className="playlistsSidebar">
          <div className="playlistsSidebarHeader">All Campaigns ({filtered.length})</div>
          {filtered.length === 0 ? (
            <div className="plEmptyList">
              <p>No campaigns yet.</p>
              <button className="btnPrimary" onClick={openCreate}>Create one</button>
            </div>
          ) : (
            <ul className="playlistList">
              {filtered.map(c => (
                <li key={c.id}
                  className={`playlistListItem ${c.id === selectedId ? "playlistListItemActive" : ""}`}
                  onClick={() => setSelectedId(c.id)}>
                  <div className="plItemInfo">
                    <span className="plItemName">{c.name}</span>
                    <span className="plItemMeta">{playlistName(c.playlistId)}</span>
                    <span className="plItemMeta">{c.startDate} → {c.endDate}</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                    <span className={`cmpStatusBadge ${isActive(c) ? "cmpStatusActive" : "cmpStatusInactive"}`}>
                      {isActive(c) ? "LIVE" : c.status === "inactive" ? "OFF" : "SCHEDULED"}
                    </span>
                    <div className="plItemActions">
                      <button className="btnIcon" title="Edit" onClick={e => { e.stopPropagation(); openEdit(c); }}>✎</button>
                      <button className="btnIcon btnIconDanger" title="Delete" onClick={e => { e.stopPropagation(); deleteCampaign(c.id); }}>✕</button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ── Detail ── */}
        <div className="playlistsDetail">
          {!selected ? (
            <div className="plDetailEmpty">Select or create a campaign to view details.</div>
          ) : (
            <>
              <div className="plDetailHeader">
                <div>
                  <h2 className="plDetailName">{selected.name}</h2>
                  <span className={`cmpStatusBadge ${isActive(selected) ? "cmpStatusActive" : "cmpStatusInactive"}`} style={{ marginTop: 4, display: "inline-block" }}>
                    {isActive(selected) ? "● LIVE NOW" : selected.status === "inactive" ? "● OFF" : "● SCHEDULED"}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btnGhost" onClick={() => toggleStatus(selected.id)}>
                    {selected.status === "active" ? "Deactivate" : "Activate"}
                  </button>
                  <button className="btnPrimary" onClick={() => openEdit(selected)}>Edit</button>
                </div>
              </div>

              <div className="cmpDetailBody">
                <div className="cmpSection">
                  <div className="cmpSectionTitle">Playlist</div>
                  <div className="cmpValue">{playlistName(selected.playlistId)}</div>
                </div>

                <div className="cmpSection">
                  <div className="cmpSectionTitle">Schedule</div>
                  <div className="cmpScheduleGrid">
                    <div className="cmpScheduleItem">
                      <span className="cmpScheduleLabel">Date Range</span>
                      <span className="cmpValue">{selected.startDate} → {selected.endDate}</span>
                    </div>
                    <div className="cmpScheduleItem">
                      <span className="cmpScheduleLabel">Time Window</span>
                      <span className="cmpValue">{selected.startTime} – {selected.endTime}</span>
                    </div>
                  </div>
                </div>

                <div className="cmpSection">
                  <div className="cmpSectionTitle">Active Days</div>
                  <div className="cmpDayChips">
                    {DAY_NAMES.map((d, i) => (
                      <span key={i} className={`cmpDayChip ${selected.daysOfWeek.includes(i) ? "cmpDayChipOn" : ""}`}>
                        {d}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="cmpSection">
                  <div className="cmpSectionTitle">Created</div>
                  <div className="cmpValue">{new Date(selected.createdAt).toLocaleString()}</div>
                </div>
                <div className="cmpSection">
                  <div className="cmpSectionTitle">Last Updated</div>
                  <div className="cmpValue">{new Date(selected.updatedAt).toLocaleString()}</div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Modal ── */}
      {showModal && (
        <div className="modalOverlay" onClick={() => setShowModal(false)}>
          <div className="modalCard" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <h2 className="modalTitle">{modalEditId ? "Edit Campaign" : "New Campaign"}</h2>
            <div className="formGrid">
              <label className="formLabel">
                <span className="labelText">Campaign Name</span>
                <input className="input" autoFocus value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. February Promo" />
              </label>

              <label className="formLabel">
                <span className="labelText">Playlist</span>
                <select className="select" value={form.playlistId}
                  onChange={e => setForm(f => ({ ...f, playlistId: e.target.value }))}>
                  {playlists.length === 0
                    ? <option value="">— No playlists available —</option>
                    : playlists.map(p => <option key={p.id} value={p.id}>{p.name}</option>)
                  }
                </select>
              </label>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <label className="formLabel">
                  <span className="labelText">Start Date</span>
                  <input className="input" type="date" value={form.startDate}
                    onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
                </label>
                <label className="formLabel">
                  <span className="labelText">End Date</span>
                  <input className="input" type="date" value={form.endDate}
                    onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
                </label>
                <label className="formLabel">
                  <span className="labelText">Start Time</span>
                  <input className="input" type="time" value={form.startTime}
                    onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} />
                </label>
                <label className="formLabel">
                  <span className="labelText">End Time</span>
                  <input className="input" type="time" value={form.endTime}
                    onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} />
                </label>
              </div>

              <div className="formLabel">
                <span className="labelText">Active Days</span>
                <div className="cmpDayChips" style={{ marginTop: 6 }}>
                  {DAY_NAMES.map((d, i) => (
                    <button key={i} type="button"
                      className={`cmpDayChip ${form.daysOfWeek.includes(i) ? "cmpDayChipOn" : ""}`}
                      style={{ cursor: "pointer" }}
                      onClick={() => toggleDay(i)}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <label className="formLabel">
                <span className="labelText">Status</span>
                <select className="select" value={form.status}
                  onChange={e => setForm(f => ({ ...f, status: e.target.value as any }))}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </label>
            </div>

            <div className="modalActions">
              <button className="btnGhost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btnPrimary" onClick={confirmModal}>
                {modalEditId ? "Save Changes" : "Create Campaign"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Campaigns;
