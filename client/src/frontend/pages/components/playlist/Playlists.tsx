import React, { useEffect, useMemo, useRef, useState } from "react";
import "/src/frontend/styles/playlists.css";
import { usePermissions } from "../security/permissionContext";

// ── Shared types (keep in sync with Layouts.tsx) ──────────────────────────────
export type SlotId = "hero" | "rightTop" | "rightBottom";

export type LayoutRef = {
  id: string;
  name: string;
  slotOrder: SlotId[];
};

export type MediaType = "image" | "video" | "website" | "music";
export type MediaItem = {
  id: string;
  type: MediaType;
  title: string;
  src: string;
};

// ── Playlist types ─────────────────────────────────────────────────────────────
export type PlaylistEntry = {
  entryId: string;
  mediaId: string;
  duration: number; // seconds shown in this slot before advancing
};

export type Playlist = {
  id: string;
  name: string;
  layoutId: string;                              // which layout this uses
  slots: Partial<Record<SlotId, PlaylistEntry[]>>; // per-slot sequences
  createdAt: string;
  updatedAt: string;
};

type Props = {
  mediaLibrary: MediaItem[];
  onNavigateHome: () => void;
};

// ── Constants ──────────────────────────────────────────────────────────────────
const LS_PLAYLISTS = "cp360_playlists_v2";
const LS_LAYOUTS   = "cp360_layouts_v1";

const SLOT_LABELS: Record<SlotId, string> = {
  hero:        "Panel 1 (Hero)",
  rightTop:    "Panel 2 (Top Right)",
  rightBottom: "Panel 3 (Bottom Right)",
};

const ALL_SLOTS: SlotId[] = ["hero", "rightTop", "rightBottom"];

// ── Helpers ────────────────────────────────────────────────────────────────────
function uid(p = "pl") { return `${p}_${Math.random().toString(16).slice(2)}_${Date.now()}`; }
function now() { return new Date().toISOString(); }

function load<T>(key: string): T[] {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : []; }
  catch { return []; }
}
function save(key: string, data: unknown) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
}

function totalSecs(entries: PlaylistEntry[]) {
  return entries.reduce((s, e) => s + e.duration, 0);
}
function fmtDur(s: number) {
  const m = Math.floor(s / 60); const sec = s % 60;
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
}

// ── Component ──────────────────────────────────────────────────────────────────
const Playlists: React.FC<Props> = ({ mediaLibrary, onNavigateHome }) => {
  const { can } = usePermissions();
  const canPreview = can("canPreviewPlaylist");
  const canCreate  = can("canCreatePlaylist");
  const canEdit    = can("canEditPlaylist");
  const canDelete  = can("canDeletePlaylist");
  const canAssign  = can("canAssignContent");
  const canTest    = can("canTestPlayback");

  // Preview / test state
  const [showPreview, setShowPreview]       = useState(false);
  const [previewSlot, setPreviewSlot]       = useState<SlotId>("hero");
  const [previewIdx, setPreviewIdx]         = useState(0);
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const previewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [layouts,   setLayouts]   = useState<LayoutRef[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Create / rename modal
  const [showModal, setShowModal]   = useState(false);
  const [modalName, setModalName]   = useState("");
  const [modalLayoutId, setModalLayoutId] = useState("");
  const [editingId, setEditingId]   = useState<string | null>(null);

  // Active slot tab in the detail panel
  const [activeSlot, setActiveSlot] = useState<SlotId>("hero");

  // Media picker
  const [showPicker, setShowPicker]     = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");
  const [pickerTab, setPickerTab]       = useState<"all" | MediaType>("all");

  // Drag-to-reorder within a slot
  const dragIdx = useRef<number | null>(null);

  // ── Bootstrap ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const pls = load<Playlist>(LS_PLAYLISTS);
    setPlaylists(pls);
    if (pls.length) setSelectedId(pls[0].id);

    // Pull layouts from Layouts' localStorage (read-only reference)
    const raw = load<any>(LS_LAYOUTS);
    setLayouts(
      raw.map((l: any) => ({
        id: l.id,
        name: l.name,
        slotOrder: l.slotOrder ?? ["hero"],
      }))
    );
  }, []);

  useEffect(() => { save(LS_PLAYLISTS, playlists); }, [playlists]);

  // ── Derived ──────────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? playlists.filter(p => p.name.toLowerCase().includes(q)) : playlists;
  }, [playlists, search]);

  const selected = useMemo(() => playlists.find(p => p.id === selectedId) ?? null, [playlists, selectedId]);

  const selectedLayout = useMemo(
    () => layouts.find(l => l.id === selected?.layoutId) ?? null,
    [layouts, selected]
  );

  const activeEntries: PlaylistEntry[] = selected?.slots?.[activeSlot] ?? [];

  const filteredMedia = useMemo(() => {
    let items = pickerTab === "all" ? mediaLibrary : mediaLibrary.filter(m => m.type === pickerTab);
    const q = pickerSearch.trim().toLowerCase();
    if (q) items = items.filter(m => m.title.toLowerCase().includes(q));
    return items;
  }, [mediaLibrary, pickerTab, pickerSearch]);

  // ── Playlist CRUD ────────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditingId(null);
    setModalName("");
    setModalLayoutId(layouts[0]?.id ?? "");
    setShowModal(true);
  };

  const openRename = (pl: Playlist) => {
    setEditingId(pl.id);
    setModalName(pl.name);
    setModalLayoutId(pl.layoutId);
    setShowModal(true);
  };

  const confirmModal = () => {
    const name = modalName.trim();
    if (!name) return;
    if (!modalLayoutId) return alert("Please select a layout.");

    if (editingId) {
      setPlaylists(prev => prev.map(p =>
        p.id === editingId ? { ...p, name, layoutId: modalLayoutId, updatedAt: now() } : p
      ));
    } else {
      const pl: Playlist = {
        id: uid(),
        name,
        layoutId: modalLayoutId,
        slots: {},
        createdAt: now(),
        updatedAt: now(),
      };
      setPlaylists(prev => [pl, ...prev]);
      setSelectedId(pl.id);
    }
    setShowModal(false);
  };

  const deletePlaylist = (id: string) => {
    if (!confirm("Delete this playlist?")) return;
    setPlaylists(prev => {
      const next = prev.filter(p => p.id !== id);
      if (selectedId === id) setSelectedId(next[0]?.id ?? null);
      return next;
    });
  };

  // ── Entry management ─────────────────────────────────────────────────────────
  const updateSlot = (slot: SlotId, entries: PlaylistEntry[]) => {
    setPlaylists(prev => prev.map(p =>
      p.id === selectedId
        ? { ...p, slots: { ...p.slots, [slot]: entries }, updatedAt: now() }
        : p
    ));
  };

  const addEntry = (mediaId: string) => {
    const entry: PlaylistEntry = { entryId: uid("e"), mediaId, duration: 10 };
    updateSlot(activeSlot, [...activeEntries, entry]);
  };

  const removeEntry = (entryId: string) => {
    updateSlot(activeSlot, activeEntries.filter(e => e.entryId !== entryId));
  };

  const setDuration = (entryId: string, duration: number) => {
    updateSlot(activeSlot, activeEntries.map(e => e.entryId === entryId ? { ...e, duration } : e));
  };

  const moveEntry = (from: number, to: number) => {
    const entries = [...activeEntries];
    const [item] = entries.splice(from, 1);
    entries.splice(to, 0, item);
    updateSlot(activeSlot, entries);
  };

  // ── Drag handlers ────────────────────────────────────────────────────────────
  const onDragStart = (i: number) => { dragIdx.current = i; };
  const onDragOver  = (e: React.DragEvent, i: number) => {
    e.preventDefault();
    if (dragIdx.current === null || dragIdx.current === i) return;
    moveEntry(dragIdx.current, i);
    dragIdx.current = i;
  };
  const onDragEnd = () => { dragIdx.current = null; };

  // ── Totals ───────────────────────────────────────────────────────────────────
  const playlistTotalItems = (pl: Playlist) =>
    ALL_SLOTS.reduce((n, s) => n + (pl.slots[s]?.length ?? 0), 0);

  const playlistTotalDur = (pl: Playlist) =>
    ALL_SLOTS.reduce((n, s) => n + totalSecs(pl.slots[s] ?? []), 0);

  // ── Preview helpers ──────────────────────────────────────────────────────────
  const openPreview = (pl: Playlist) => {
    setPreviewSlot("hero");
    setPreviewIdx(0);
    setPreviewPlaying(false);
    if (previewTimer.current) clearTimeout(previewTimer.current);
    setShowPreview(true);
  };

  const stopPreview = () => {
    if (previewTimer.current) clearTimeout(previewTimer.current);
    setPreviewPlaying(false);
    setShowPreview(false);
  };

  const previewEntries = (pl: Playlist | null) =>
    pl ? (pl.slots[previewSlot] ?? []) : [];

  const advancePreview = (pl: Playlist, dir: 1 | -1) => {
    const entries = previewEntries(pl);
    if (!entries.length) return;
    setPreviewIdx(i => (i + dir + entries.length) % entries.length);
  };

  const toggleAutoPlay = (pl: Playlist) => {
    if (previewPlaying) {
      if (previewTimer.current) clearTimeout(previewTimer.current);
      setPreviewPlaying(false);
      return;
    }
    setPreviewPlaying(true);
    const tick = (idx: number) => {
      const entries = previewEntries(pl);
      if (!entries.length) return;
      const dur = (entries[idx]?.duration ?? 5) * 1000;
      previewTimer.current = setTimeout(() => {
        const next = (idx + 1) % entries.length;
        setPreviewIdx(next);
        tick(next);
      }, dur);
    };
    tick(previewIdx);
  };


  // ── Render ───────────────────────────────────────────────────────────────────
  const slotsForLayout = selectedLayout?.slotOrder ?? ["hero"];

  return (
    <div className="playlistsRoot">
      {/* Top bar */}
      <div className="topRow">
        <button className="homeButton" onClick={onNavigateHome}>HOME</button>
        <h1 className="pageTitle">Playlists</h1>
        <div className="topActions">
          <input className="searchInput" placeholder="Search playlists…" value={search}
            onChange={e => setSearch(e.target.value)} />
          {canCreate && <button className="addCampaignBtn" onClick={openCreate}>+ NEW PLAYLIST</button>}
        </div>
      </div>

      {layouts.length === 0 && (
        <div className="plWarningBanner">
          ⚠ No layouts found. Create at least one layout before building playlists.
        </div>
      )}

      <div className="playlistsBody">
        {/* ── Left sidebar ── */}
        <div className="playlistsSidebar">
          <div className="playlistsSidebarHeader">All Playlists ({filtered.length})</div>

          {filtered.length === 0 ? (
            <div className="plEmptyList">
              <p>No playlists yet.</p>
              <button className="btnPrimary" onClick={openCreate}>Create one</button>
            </div>
          ) : (
            <ul className="playlistList">
              {filtered.map(pl => {
                const lyt = layouts.find(l => l.id === pl.layoutId);
                return (
                  <li key={pl.id}
                    className={`playlistListItem ${pl.id === selectedId ? "playlistListItemActive" : ""}`}
                    onClick={() => { setSelectedId(pl.id); setActiveSlot("hero"); }}>
                    <div className="plItemInfo">
                      <span className="plItemName">{pl.name}</span>
                      <span className="plItemMeta">
                        {lyt ? lyt.name : <em style={{ color: "#f87171" }}>layout deleted</em>}
                      </span>
                      <span className="plItemMeta">
                        {playlistTotalItems(pl)} item{playlistTotalItems(pl) !== 1 ? "s" : ""} · {fmtDur(playlistTotalDur(pl))}
                      </span>
                    </div>
                    <div className="plItemActions">
                      {canEdit && <button className="btnIcon" title="Rename" onClick={e => { e.stopPropagation(); openRename(pl); }}>✎</button>}
                      {canDelete && <button className="btnIcon btnIconDanger" title="Delete" onClick={e => { e.stopPropagation(); deletePlaylist(pl.id); }}>✕</button>}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* ── Right detail ── */}
        <div className="playlistsDetail">
          {!selected ? (
            <div className="plDetailEmpty">Select or create a playlist to get started.</div>
          ) : (
            <>
              {/* Header */}
              <div className="plDetailHeader">
                <div>
                  <h2 className="plDetailName">{selected.name}</h2>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
                    <span className="plLayoutBadge">
                      Layout: {selectedLayout ? selectedLayout.name : <em style={{ color: "#f87171" }}>deleted — please re-assign</em>}
                    </span>
                    {canEdit && <button className="btnGhost" style={{ fontSize: 12, padding: "2px 10px" }}
                      onClick={() => openRename(selected)}>
                      Change Layout
                    </button>}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", alignItems: "center" }}>
                    {canPreview && (
                      <button
                        className="btnGhost"
                        style={{ fontSize: 12, padding: "6px 14px", display: "flex", alignItems: "center", gap: 6, color: "#6366f1", borderColor: "#c7d2fe" }}
                        onClick={() => openPreview(selected)}
                        title="Preview this playlist"
                      >
                        <i className="bi bi-play-circle" style={{ fontSize: 14 }} />
                        Preview
                      </button>
                    )}
                    {canAssign && <button className="addCampaignBtn" onClick={() => {
                      setPickerSearch(""); setPickerTab("all"); setShowPicker(true);
                    }}>
                      + ADD MEDIA
                    </button>}
                  </div>
                  <div className="plDetailMeta" style={{ marginTop: 4 }}>
                    {playlistTotalItems(selected)} items · {fmtDur(playlistTotalDur(selected))} total
                  </div>
                </div>
              </div>

              {/* Slot tabs */}
              {selectedLayout && (
                <div className="plSlotTabs">
                  {slotsForLayout.map((slot) => {
                    const entries = selected.slots[slot] ?? [];
                    return (
                      <button key={slot}
                        className={`plSlotTab ${activeSlot === slot ? "plSlotTabActive" : ""}`}
                        onClick={() => setActiveSlot(slot)}>
                        {SLOT_LABELS[slot]}
                        <span className="plSlotCount">{entries.length}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Entry list */}
              {!selectedLayout ? (
                <div className="plEntriesEmpty">
                  This playlist's layout has been deleted. Edit the playlist to assign a new one.
                </div>
              ) : activeEntries.length === 0 ? (
                <div className="plEntriesEmpty">
                  <p>No media in <strong>{SLOT_LABELS[activeSlot]}</strong> yet.</p>
                  <p style={{ fontSize: 13, color: "#9ca3af" }}>
                    Click <strong>+ ADD MEDIA</strong> to start building this slot's sequence.
                  </p>
                </div>
              ) : (
                <div className="plEntriesList">
                  {activeEntries.map((entry, i) => {
                    const media = mediaLibrary.find(m => m.id === entry.mediaId);
                    return (
                      <div key={entry.entryId} className="plEntry"
                        draggable onDragStart={() => onDragStart(i)}
                        onDragOver={e => onDragOver(e, i)} onDragEnd={onDragEnd}>
                        <span className="plEntryHandle" title="Drag to reorder">⠿</span>
                        <span className="plEntryIndex">{i + 1}</span>

                        <div className="plEntryThumb">
                          {!media ? (
                            <div className="plThumbMissing">?</div>
                          ) : media.type === "image" ? (
                            <img src={media.src} alt={media.title} className="plThumbImg" />
                          ) : media.type === "video" ? (
                            <video src={media.src} className="plThumbImg" muted playsInline />
                          ) : (
                            <div className="plThumbIcon">
                              {media.type === "website" ? "🌐" : "🎵"}
                            </div>
                          )}
                        </div>

                        <div className="plEntryInfo">
                          <span className="plEntryTitle">{media ? media.title : "(missing media)"}</span>
                          <span className="plEntryType">{media ? media.type.toUpperCase() : "—"}</span>
                        </div>

                        <div className="plEntryDuration">
                          <label className="plDurationLabel">Duration (s)</label>
                          <input className="plDurationInput" type="number" min={1} max={3600}
                            value={entry.duration}
                            onChange={e => setDuration(entry.entryId, Math.max(1, Number(e.target.value)))} />
                        </div>

                        {canEdit && (
                          <div className="plEntryOrder">
                            <button className="btnIcon" title="Move up" disabled={i === 0}
                              onClick={() => moveEntry(i, i - 1)}>▲</button>
                            <button className="btnIcon" title="Move down" disabled={i === activeEntries.length - 1}
                              onClick={() => moveEntry(i, i + 1)}>▼</button>
                          </div>
                        )}

                        {canAssign && (
                          <button className="btnIcon btnIconDanger" title="Remove"
                            onClick={() => removeEntry(entry.entryId)}>✕</button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Create / Edit Modal ── */}
      {showModal && (
        <div className="modalOverlay" onClick={() => setShowModal(false)}>
          <div className="modalCard" onClick={e => e.stopPropagation()}>
            <h2 className="modalTitle">{editingId ? "Edit Playlist" : "New Playlist"}</h2>
            <div className="formGrid">
              <label className="formLabel">
                <span className="labelText">Name</span>
                <input className="input" autoFocus value={modalName}
                  onChange={e => setModalName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && confirmModal()}
                  placeholder="e.g. Morning Loop" />
              </label>
              <label className="formLabel">
                <span className="labelText">Layout</span>
                <select className="select" value={modalLayoutId}
                  onChange={e => setModalLayoutId(e.target.value)}>
                  {layouts.length === 0
                    ? <option value="">— No layouts available —</option>
                    : layouts.map(l => <option key={l.id} value={l.id}>{l.name}</option>)
                  }
                </select>
              </label>
            </div>
            <div className="modalActions">
              <button className="btnGhost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btnPrimary" onClick={confirmModal} disabled={!modalName.trim() || !modalLayoutId}>
                {editingId ? "Save" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Media Picker ── */}
      {showPicker && (
        <div className="modalOverlay" onClick={() => setShowPicker(false)}>
          <div className="modalCard" style={{ width: "85%", maxWidth: 900, maxHeight: "80vh", overflow: "auto" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div>
                <h2 className="modalTitle" style={{ margin: 0 }}>Add Media</h2>
                <div style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>
                  Adding to: <strong>{SLOT_LABELS[activeSlot]}</strong>
                </div>
              </div>
              <button className="btnGhost" onClick={() => setShowPicker(false)}>Close</button>
            </div>

            <div className="contentsTabs" style={{ marginBottom: 12 }}>
              {(["all", "image", "video", "website", "music"] as const).map(tab => (
                <button key={tab}
                  className={pickerTab === tab ? "tabBtn tabBtnActive" : "tabBtn"}
                  onClick={() => setPickerTab(tab)}>
                  {tab === "all" ? "All" : tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            <input className="contentsSearch" placeholder="Search…" value={pickerSearch}
              onChange={e => setPickerSearch(e.target.value)}
              style={{ marginBottom: 12, width: "100%" }} />

            {filteredMedia.length === 0 ? (
              <p style={{ color: "#9ca3af", textAlign: "center", padding: "32px 0" }}>
                No media found. Add items in Contents first.
              </p>
            ) : (
              <div className="mediaGrid">
                {filteredMedia.map(m => (
                  <div key={m.id} className="mediaCard" style={{ cursor: "pointer" }}
                    onClick={() => { addEntry(m.id); setShowPicker(false); }}>
                    <div className="mediaCardTop">
                      <div className="mediaCardTitle" title={m.title}>{m.title}</div>
                    </div>
                    <div className="mediaType">{m.type.toUpperCase()}</div>
                    <div className="mediaPreviewWrap">
                      {m.type === "image" && <img className="imgPreview" src={m.src} alt={m.title} />}
                      {m.type === "video" && <video className="vidPreview" src={m.src} muted playsInline />}
                      {m.type === "music"   && <div style={{ padding: 8, fontSize: 13 }}>🎵 {m.title}</div>}
                      {m.type === "website" && <a className="linkPreview" href={m.src} target="_blank" rel="noreferrer">{m.src}</a>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      {/* ── Preview Modal ── */}
      {showPreview && canPreview && selected && (() => {
        const entries = previewEntries(selected);
        const entry   = entries[previewIdx];
        const media   = entry ? mediaLibrary.find(m => m.id === entry.mediaId) : null;
        const slotsAvailable = (selectedLayout?.slotOrder ?? ["hero"]) as SlotId[];
        return (
          <div
            style={{
              position: "fixed", inset: 0, zIndex: 1000,
              background: "rgba(0,0,0,0.75)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
            onClick={stopPreview}
          >
            <div
              style={{
                background: "#1e293b", borderRadius: 16, padding: "24px 28px",
                width: "min(680px, 95vw)", maxHeight: "90vh", overflowY: "auto",
                boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
                display: "flex", flexDirection: "column", gap: 16,
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <h2 style={{ margin: 0, color: "#f1f5f9", fontSize: 18, fontWeight: 700 }}>
                    <i className="bi bi-play-circle-fill" style={{ color: "#6366f1", marginRight: 8 }} />
                    Preview: {selected.name}
                  </h2>
                  <div style={{ color: "#94a3b8", fontSize: 12, marginTop: 4 }}>
                    Simulated playback — not live on screen
                  </div>
                </div>
                <button
                  onClick={stopPreview}
                  style={{ background: "rgba(255,255,255,0.08)", border: "none", color: "#94a3b8", cursor: "pointer", width: 32, height: 32, borderRadius: 8, fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}
                >✕</button>
              </div>

              {/* Slot selector */}
              {slotsAvailable.length > 1 && (
                <div style={{ display: "flex", gap: 8 }}>
                  {slotsAvailable.map(slot => (
                    <button
                      key={slot}
                      onClick={() => { setPreviewSlot(slot); setPreviewIdx(0); }}
                      style={{
                        padding: "4px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600,
                        background: previewSlot === slot ? "#6366f1" : "rgba(255,255,255,0.08)",
                        color: previewSlot === slot ? "#fff" : "#94a3b8",
                      }}
                    >
                      {SLOT_LABELS[slot]}
                    </button>
                  ))}
                </div>
              )}

              {/* Media preview area */}
              <div style={{
                background: "#0f172a", borderRadius: 12, minHeight: 280,
                display: "flex", alignItems: "center", justifyContent: "center",
                overflow: "hidden", position: "relative",
              }}>
                {!entries.length ? (
                  <div style={{ color: "#475569", fontSize: 14, textAlign: "center", padding: 24 }}>
                    <i className="bi bi-collection-play" style={{ fontSize: 32, display: "block", marginBottom: 8 }} />
                    No media in this slot
                  </div>
                ) : !media ? (
                  <div style={{ color: "#ef4444", fontSize: 13 }}>Media not found in library</div>
                ) : (
                  <>
                    {media.type === "image"   && <img src={media.src} alt={media.title} style={{ maxWidth: "100%", maxHeight: 340, borderRadius: 8, objectFit: "contain" }} />}
                    {media.type === "video"   && <video key={media.src} src={media.src} controls autoPlay style={{ maxWidth: "100%", maxHeight: 340, borderRadius: 8 }} />}
                    {media.type === "music"   && (
                      <div style={{ textAlign: "center", color: "#e2e8f0" }}>
                        <i className="bi bi-music-note-beamed" style={{ fontSize: 48, color: "#818cf8", display: "block", marginBottom: 12 }} />
                        <div style={{ fontWeight: 600 }}>{media.title}</div>
                        <audio src={media.src} controls autoPlay style={{ marginTop: 12 }} />
                      </div>
                    )}
                    {media.type === "website" && (
                      <iframe src={media.src} title={media.title} style={{ width: "100%", height: 320, border: "none", borderRadius: 8 }} sandbox="allow-scripts allow-same-origin" />
                    )}

                    {/* Entry index badge */}
                    <div style={{
                      position: "absolute", top: 10, right: 10,
                      background: "rgba(0,0,0,0.6)", color: "#e2e8f0",
                      padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 600,
                    }}>
                      {previewIdx + 1} / {entries.length}
                    </div>
                  </>
                )}
              </div>

              {/* Media info */}
              {media && (
                <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#cbd5e1" }}>
                  <strong style={{ color: "#f1f5f9" }}>{media.title}</strong>
                  <span style={{ margin: "0 8px", color: "#475569" }}>·</span>
                  {media.type.toUpperCase()}
                  {entry && (
                    <>
                      <span style={{ margin: "0 8px", color: "#475569" }}>·</span>
                      <i className="bi bi-clock" style={{ marginRight: 4 }} />
                      {entry.duration}s
                    </>
                  )}
                </div>
              )}

              {/* Controls */}
              {canTest && entries.length > 0 && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
                  <button
                    onClick={() => advancePreview(selected, -1)}
                    style={{ background: "rgba(255,255,255,0.08)", border: "none", color: "#e2e8f0", cursor: "pointer", width: 40, height: 40, borderRadius: 10, fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}
                    title="Previous"
                  >
                    <i className="bi bi-skip-start-fill" />
                  </button>

                  <button
                    onClick={() => toggleAutoPlay(selected)}
                    style={{
                      background: previewPlaying ? "#dc2626" : "#6366f1",
                      border: "none", color: "#fff", cursor: "pointer",
                      padding: "8px 24px", borderRadius: 10, fontSize: 14, fontWeight: 700,
                      display: "flex", alignItems: "center", gap: 8,
                    }}
                    title={previewPlaying ? "Stop auto-advance" : "Auto-advance by duration"}
                  >
                    <i className={`bi ${previewPlaying ? "bi-stop-fill" : "bi-play-fill"}`} />
                    {previewPlaying ? "Stop" : "Auto Play"}
                  </button>

                  <button
                    onClick={() => advancePreview(selected, 1)}
                    style={{ background: "rgba(255,255,255,0.08)", border: "none", color: "#e2e8f0", cursor: "pointer", width: 40, height: 40, borderRadius: 10, fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}
                    title="Next"
                  >
                    <i className="bi bi-skip-end-fill" />
                  </button>
                </div>
              )}

              {/* All entries strip */}
              {entries.length > 1 && (
                <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
                  {entries.map((e, i) => {
                    const m = mediaLibrary.find(x => x.id === e.mediaId);
                    return (
                      <button
                        key={e.entryId}
                        onClick={() => setPreviewIdx(i)}
                        style={{
                          flexShrink: 0, width: 64, height: 48, borderRadius: 6, overflow: "hidden",
                          border: i === previewIdx ? "2px solid #6366f1" : "2px solid transparent",
                          background: "#0f172a", cursor: "pointer", padding: 0, position: "relative",
                        }}
                        title={m?.title ?? "Unknown"}
                      >
                        {m?.type === "image"   && <img src={m.src} alt={m.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                        {m?.type === "video"   && <video src={m.src} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                        {m?.type === "music"   && <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#818cf8", fontSize: 18 }}><i className="bi bi-music-note" /></div>}
                        {m?.type === "website" && <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: 10, textAlign: "center", padding: 2 }}>🌐</div>}
                        <div style={{ position: "absolute", bottom: 0, right: 0, background: "rgba(0,0,0,0.65)", color: "#fff", fontSize: 9, padding: "1px 4px", borderRadius: "4px 0 0 0" }}>{e.duration}s</div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default Playlists;
