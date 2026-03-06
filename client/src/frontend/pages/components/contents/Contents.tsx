import React, { useEffect, useMemo, useRef, useState } from "react";
import { usePermissions } from "../security/permissionContext";

// ── Types ─────────────────────────────────────────────────────────────────────
export type MediaType    = "image" | "video" | "website" | "music";
export type ContentTab   = "all" | MediaType;
export type ContentStatus = "pending" | "approved" | "archived";

export type MediaItem = {
  id:             string;
  type:           MediaType;
  title:          string;
  src:            string;
  file?:          File;
  createdAt:      string;
  uploadedBy:     string;       // user ID of uploader
  uploadedByName: string;       // display name of uploader
  status:         ContentStatus;
};

type Props = {
  initialTab?:         ContentTab;
  initialItems?:       MediaItem[];
  onMediaItemsChange?: (items: MediaItem[]) => void;
  onNavigate?:         (view: "dashboard" | "accounts") => void;
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function makeId() {
  return `m_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}
function isValidUrl(url: string) {
  try { new URL(url); return true; } catch { return false; }
}
function prettyType(t: MediaType) {
  if (t === "website") return "Website URL";
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/** Reads the logged-in user from localStorage (set by your login flow). */
function getCurrentUser(): { id: string; name: string } {
  try {
    for (const key of ["cp360_session", "cp360_auth", "cp360_current_user"]) {
      const raw = localStorage.getItem(key);
      if (raw) {
        const p = JSON.parse(raw);
        if (p.id || p.userId) return { id: p.id ?? p.userId, name: p.username ?? p.name ?? "Unknown" };
      }
    }
  } catch {}
  return { id: "unknown", name: "Unknown" };
}

// ── Status visual config ──────────────────────────────────────────────────────
const STATUS_CFG: Record<ContentStatus, { label: string; bg: string; color: string; icon: string }> = {
  pending:  { label: "Pending",  bg: "#fef9c3", color: "#854d0e", icon: "bi-hourglass-split"  },
  approved: { label: "Approved", bg: "#dcfce7", color: "#166534", icon: "bi-check-circle-fill" },
  archived: { label: "Archived", bg: "#f1f5f9", color: "#64748b", icon: "bi-archive-fill"      },
};

// ── Storage ───────────────────────────────────────────────────────────────────
const LS_KEY = "cp360_contents_v1";

function loadStoredItems(): MediaItem[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((x: any) => x && typeof x === "object")
      .map((x: any) => ({
        id:             String(x.id    ?? makeId()),
        type:           x.type         as MediaType,
        title:          String(x.title ?? "Untitled"),
        src:            String(x.src   ?? ""),
        createdAt:      String(x.createdAt    ?? new Date().toISOString()),
        uploadedBy:     String(x.uploadedBy   ?? "unknown"),
        uploadedByName: String(x.uploadedByName ?? "Unknown"),
        status:         (["pending","approved","archived"].includes(x.status) ? x.status : "pending") as ContentStatus,
      }))
      .filter((x: any) => x.src && ["image","video","website","music"].includes(x.type));
  } catch { return []; }
}

function storeItems(items: MediaItem[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(
      items.map(({ id, type, title, src, createdAt, uploadedBy, uploadedByName, status }) =>
        ({ id, type, title, src, createdAt, uploadedBy, uploadedByName, status }))
    ));
  } catch {}
}

const DEFAULT_ITEMS: MediaItem[] = [{
  id: "demo_website", type: "website", title: "Example Website",
  src: "https://example.com", createdAt: new Date().toISOString(),
  uploadedBy: "superadmin-1", uploadedByName: "Super Admin", status: "approved",
}];

// ── Component ─────────────────────────────────────────────────────────────────
const Contents: React.FC<Props> = ({
  initialTab = "all", initialItems, onMediaItemsChange, onNavigate,
}) => {
  const { can }       = usePermissions();
  const currentUser   = useMemo(() => getCurrentUser(), []);

  const canUpload      = can("canUploadContent");
  const canEditOwn     = can("canEditOwnContent");
  const canEditAny     = can("canEditAnyContent");
  const canDeleteOwn   = can("canDeleteOwnContent");
  const canApprove     = can("canApproveContent");
  const canArchiveAny  = can("canArchiveAnyContent");
  const canHardDelete  = can("canHardDeleteContent");

  const [mediaItems, setMediaItems] = useState<MediaItem[]>(() => {
    if (initialItems?.length) return initialItems;
    const stored = loadStoredItems();
    return stored.length ? stored : DEFAULT_ITEMS;
  });

  const [activeTab,    setActiveTab]    = useState<ContentTab>(initialTab);
  const [statusFilter, setStatusFilter] = useState<"all" | ContentStatus>("all");
  const [search,       setSearch]       = useState("");
  const [showAdd,      setShowAdd]      = useState(false);
  const [newType,      setNewType]      = useState<MediaType>("image");
  const [newTitle,     setNewTitle]     = useState("");
  const [newSrc,       setNewSrc]       = useState("");
  const [editItem,     setEditItem]     = useState<MediaItem | null>(null);
  const [editTitle,    setEditTitle]    = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync to localStorage and notify parent (parent only gets approved items)
  useEffect(() => {
    storeItems(mediaItems);
    onMediaItemsChange?.(mediaItems.filter(m => m.status === "approved"));
  }, [mediaItems, onMediaItemsChange]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const statusCounts = useMemo(() => ({
    all:      mediaItems.length,
    pending:  mediaItems.filter(m => m.status === "pending").length,
    approved: mediaItems.filter(m => m.status === "approved").length,
    archived: mediaItems.filter(m => m.status === "archived").length,
  }), [mediaItems]);

  const typeCounts = useMemo(() => {
    const c: Record<ContentTab, number> = { all:0, image:0, video:0, website:0, music:0 };
    const base = statusFilter === "all"
      ? mediaItems.filter(m => canArchiveAny || canHardDelete ? true : m.status !== "archived")
      : mediaItems.filter(m => m.status === statusFilter);
    c.all = base.length;
    for (const m of base) c[m.type]++;
    return c;
  }, [mediaItems, statusFilter, canArchiveAny, canHardDelete]);

  const visibleItems = useMemo(() => {
    let items = mediaItems;
    if (statusFilter === "all") {
      if (!canArchiveAny && !canHardDelete) items = items.filter(m => m.status !== "archived");
    } else {
      items = items.filter(m => m.status === statusFilter);
    }
    if (activeTab !== "all") items = items.filter(m => m.type === activeTab);
    const q = search.trim().toLowerCase();
    if (q) items = items.filter(m =>
      m.title.toLowerCase().includes(q) ||
      m.src.toLowerCase().includes(q) ||
      m.type.toLowerCase().includes(q) ||
      m.uploadedByName.toLowerCase().includes(q)
    );
    return items;
  }, [mediaItems, activeTab, statusFilter, search, canArchiveAny, canHardDelete]);

  // ── Add form ──────────────────────────────────────────────────────────────
  const resetAddForm = () => {
    setNewType("image"); setNewTitle(""); setNewSrc(""); setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };
  useEffect(() => { if (!showAdd) resetAddForm(); }, [showAdd]);

  const handlePickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    setSelectedFile(file);
    if (!newTitle.trim()) setNewTitle(file.name.replace(/\.[^/.]+$/, ""));
    if      (file.type.startsWith("image/")) setNewType("image");
    else if (file.type.startsWith("video/")) setNewType("video");
    else if (file.type.startsWith("audio/")) setNewType("music");
  };

  const readAsDataUrl = (file: File) =>
    new Promise<string>((res, rej) => {
      const r = new FileReader();
      r.onload  = () => res(String(r.result ?? ""));
      r.onerror = () => rej(new Error("Failed to read file"));
      r.readAsDataURL(file);
    });

  const addItem = async () => {
    const title = newTitle.trim();
    if (!title) return alert("Please enter a title.");
    if (newType === "website") {
      const url = newSrc.trim();
      if (!url) return alert("Please enter a website URL.");
      if (!isValidUrl(url)) return alert("Please enter a valid URL (https://...)");
      setMediaItems(prev => [{
        id: makeId(), type: "website", title, src: url,
        createdAt: new Date().toISOString(),
        uploadedBy: currentUser.id, uploadedByName: currentUser.name,
        status: "pending",
      }, ...prev]);
      setShowAdd(false);
      return;
    }
    if (!selectedFile) return alert("Please choose a file.");
    if (newType === "image" && !selectedFile.type.startsWith("image/")) return alert("File is not an image.");
    if (newType === "video" && !selectedFile.type.startsWith("video/")) return alert("File is not a video.");
    if (newType === "music" && !selectedFile.type.startsWith("audio/")) return alert("File is not audio.");
    let previewUrl = "";
    try { previewUrl = await readAsDataUrl(selectedFile); }
    catch { return alert("Could not read that file."); }
    setMediaItems(prev => [{
      id: makeId(), type: newType, title, src: previewUrl, file: selectedFile,
      createdAt: new Date().toISOString(),
      uploadedBy: currentUser.id, uploadedByName: currentUser.name,
      status: "pending",
    }, ...prev]);
    setShowAdd(false);
  };

  // ── Actions ───────────────────────────────────────────────────────────────
  const approveItem   = (id: string) => setMediaItems(p => p.map(m => m.id === id ? {...m, status:"approved"} : m));
  const archiveItem   = (id: string) => setMediaItems(p => p.map(m => m.id === id ? {...m, status:"archived"} : m));
  const restoreItem   = (id: string) => setMediaItems(p => p.map(m => m.id === id ? {...m, status:"pending"}  : m));
  const hardDeleteItem = (id: string) => {
    if (!confirm("Permanently delete this content? This cannot be undone.")) return;
    setMediaItems(p => p.filter(m => m.id !== id));
  };

  const isOwner       = (item: MediaItem) => item.uploadedBy === currentUser.id;
  const canEditItem   = (item: MediaItem) => canEditAny || (canEditOwn && isOwner(item));
  const canDeleteItem = (item: MediaItem) => canHardDelete || canArchiveAny || (canDeleteOwn && isOwner(item));

  const openEdit = (item: MediaItem) => { setEditItem(item); setEditTitle(item.title); };
  const saveEdit = () => {
    if (!editItem) return;
    const t = editTitle.trim();
    if (!t) return alert("Title cannot be empty.");
    setMediaItems(p => p.map(m => m.id === editItem.id ? {...m, title: t} : m));
    setEditItem(null);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="contents">
      <div className="topRow">
        {onNavigate && <button className="homeButton" onClick={() => onNavigate("dashboard")}>Home</button>}
        <h1 className="accountsPageTitle">Contents</h1>
      </div>

      {/* Top bar */}
      <div className="contentsTop">
        <div className="contentsTitleWrap">
          <h1 className="contentsTitle">
            {activeTab === "all" ? "All Media" : prettyType(activeTab)}
          </h1>
          <div className="contentsSubtitle">
            {statusCounts.approved} approved &nbsp;·&nbsp;
            {statusCounts.pending} pending &nbsp;·&nbsp;
            {statusCounts.archived} archived
          </div>
        </div>
        <div className="contentsActions">
          <input
            className="contentsSearch" value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search title, url, type, uploader..."
          />
          {canUpload && (
            <button className="btnPrimary" onClick={() => setShowAdd(true)}>+ Add Media</button>
          )}
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="contentsTabs" style={{ borderBottom: "2px solid #e5e7eb" }}>
        {(["all","pending","approved","archived"] as const).map(s => {
          if (s === "archived" && !canArchiveAny && !canHardDelete) return null;
          const cfg = s !== "all" ? STATUS_CFG[s] : null;
          const count = s === "all" ? mediaItems.length : statusCounts[s];
          return (
            <button
              key={s}
              className={statusFilter === s ? "tabBtn tabBtnActive" : "tabBtn"}
              onClick={() => setStatusFilter(s)}
              style={statusFilter === s && cfg
                ? { borderBottom: `3px solid ${cfg.color}`, color: cfg.color }
                : undefined}
            >
              {s === "all" ? "All" : STATUS_CFG[s].label} ({count})
            </button>
          );
        })}
      </div>

      {/* Type filter tabs */}
      <div className="contentsTabs">
        {(["all","image","video","website","music"] as const).map(t => (
          <button
            key={t}
            className={activeTab === t ? "tabBtn tabBtnActive" : "tabBtn"}
            onClick={() => setActiveTab(t)}
          >
            {t === "all" ? `All Media (${typeCounts.all})` : `${prettyType(t as MediaType)} (${typeCounts[t as MediaType]})`}
          </button>
        ))}
      </div>

      {/* Pending approval banner — shown to admins when items need review */}
      {canApprove && statusCounts.pending > 0 && statusFilter !== "pending" && (
        <div style={{
          margin: "12px 0",
          padding: "12px 16px",
          background: "#fef9c3",
          border: "1px solid #fde047",
          borderRadius: "10px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: "13px",
          color: "#854d0e",
          fontWeight: 600,
        }}>
          <span>
            <i className="bi bi-hourglass-split" style={{ marginRight: 8 }} />
            {statusCounts.pending} item{statusCounts.pending !== 1 ? "s" : ""} awaiting your approval
          </span>
          <button
            className="btnPrimary"
            style={{ fontSize: 12, padding: "4px 14px", background: "#ca8a04" }}
            onClick={() => setStatusFilter("pending")}
          >
            Review Now
          </button>
        </div>
      )}

      {/* Grid */}
      <div className="contentsBody">
        {visibleItems.length === 0 ? (
          <div className="emptyState">
            <h2 className="emptyTitle">No results</h2>
            <p className="emptyText">
              {statusFilter !== "all"
                ? `No ${STATUS_CFG[statusFilter as ContentStatus]?.label ?? statusFilter} content found.`
                : activeTab === "all" ? "No media added yet." : `No ${activeTab} items found.`}
            </p>
          </div>
        ) : (
          <div className="mediaGrid">
            {visibleItems.map(item => (
              <MediaCard
                key={item.id}
                item={item}
                isOwner={isOwner(item)}
                canEdit={canEditItem(item)}
                canDelete={canDeleteItem(item)}
                canApprove={canApprove}
                canArchiveAny={canArchiveAny}
                canHardDelete={canHardDelete}
                onApprove={() => approveItem(item.id)}
                onArchive={() => archiveItem(item.id)}
                onRestore={() => restoreItem(item.id)}
                onHardDelete={() => hardDeleteItem(item.id)}
                onEdit={() => openEdit(item)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Add Media Modal ── */}
      {showAdd && canUpload && (
        <div className="modalOverlay" onClick={() => setShowAdd(false)}>
          <div className="modalCard" onClick={e => e.stopPropagation()}>
            <h2 className="modalTitle">Add Media</h2>
            <div style={{
              marginBottom: 14, padding: "10px 14px",
              background: "#fef9c3", borderRadius: 8,
              fontSize: 12, color: "#854d0e", fontWeight: 600,
            }}>
              <i className="bi bi-info-circle" style={{ marginRight: 6 }} />
              Content will be set to <strong>Pending</strong> and must be approved by an Admin before it goes live.
            </div>
            <div className="formGrid">
              <label className="formLabel">
                <span className="labelText">Type</span>
                <select className="select" value={newType} onChange={e => setNewType(e.target.value as MediaType)}>
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                  <option value="website">Website URL</option>
                  <option value="music">Music</option>
                </select>
              </label>
              <label className="formLabel">
                <span className="labelText">Title</span>
                <input className="input" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g. February Promo" />
              </label>
              <input
                ref={fileInputRef} type="file" className="hiddenFile"
                accept={newType === "image" ? "image/*" : newType === "video" ? "video/*" : newType === "music" ? "audio/*" : ""}
                onChange={handlePickFile}
              />
              {newType === "website" ? (
                <label className="formLabel">
                  <span className="labelText">Website URL</span>
                  <input className="input" value={newSrc} onChange={e => setNewSrc(e.target.value)} placeholder="https://example.com" />
                </label>
              ) : (
                <div className="fileRow">
                  <span className="labelText">File</span>
                  <div className="filePicker">
                    <button type="button" className="btnPrimary" onClick={() => fileInputRef.current?.click()}>Choose File</button>
                    <div className="fileName">{selectedFile ? selectedFile.name : "No file selected"}</div>
                  </div>
                  {selectedFile && <div className="fileMeta">{Math.round(selectedFile.size / 1024)} KB · {selectedFile.type}</div>}
                </div>
              )}
            </div>
            <div className="modalActions">
              <button className="btnGhost" onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="btnPrimary" onClick={addItem}>Upload (Pending Approval)</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Title Modal ── */}
      {editItem && (
        <div className="modalOverlay" onClick={() => setEditItem(null)}>
          <div className="modalCard" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <h2 className="modalTitle">Edit Title</h2>
            <div style={{ marginBottom: 12, fontSize: 12, color: "#6b7280" }}>
              Uploaded by {editItem.uploadedByName} · {new Date(editItem.createdAt).toLocaleDateString()}
            </div>
            <label className="formLabel">
              <span className="labelText">Title</span>
              <input
                className="input" autoFocus
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                onKeyDown={e => e.key === "Enter" && saveEdit()}
              />
            </label>
            <div className="modalActions">
              <button className="btnGhost" onClick={() => setEditItem(null)}>Cancel</button>
              <button className="btnPrimary" onClick={saveEdit}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── MediaCard ─────────────────────────────────────────────────────────────────
type CardProps = {
  item: MediaItem;
  isOwner: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canApprove: boolean;
  canArchiveAny: boolean;
  canHardDelete: boolean;
  onApprove: () => void;
  onArchive: () => void;
  onRestore: () => void;
  onHardDelete: () => void;
  onEdit: () => void;
};

function MediaCard({
  item, isOwner, canEdit, canDelete,
  canApprove, canArchiveAny, canHardDelete,
  onApprove, onArchive, onRestore, onHardDelete, onEdit,
}: CardProps) {
  const cfg = STATUS_CFG[item.status];

  return (
    <div className="mediaCard" style={{
      opacity: item.status === "archived" ? 0.6 : 1,
      outline: item.status === "pending"  ? "2px solid #fde047"
             : item.status === "approved" ? "2px solid #86efac"
             : "1px solid #e5e7eb",
    }}>
      {/* Title + status badge */}
      <div className="mediaCardTop">
        <div className="mediaCardTitle" title={item.title}>{item.title}</div>
        <span style={{
          background: cfg.bg, color: cfg.color,
          padding: "2px 8px", borderRadius: "999px",
          fontSize: 10, fontWeight: 700, flexShrink: 0,
        }}>
          <i className={`bi ${cfg.icon}`} style={{ marginRight: 3, fontSize: 9 }} />
          {cfg.label}
        </span>
      </div>

      {/* Uploader */}
      <div style={{ fontSize: 11, color: "#9ca3af", margin: "2px 0 6px", display: "flex", alignItems: "center", gap: 4 }}>
        <i className="bi bi-person-fill" style={{ fontSize: 10 }} />
        {item.uploadedByName}
        {isOwner && <span style={{ color: "#6366f1", fontWeight: 700 }}>(you)</span>}
      </div>

      <div className="mediaType">{prettyType(item.type)}</div>

      {/* Preview */}
      <div className="mediaPreviewWrap">
        {item.type === "image"   && <img className="imgPreview" src={item.src} alt={item.title} />}
        {item.type === "video"   && <video key={item.src} className="vidPreview" src={item.src} controls preload="metadata" playsInline />}
        {item.type === "music"   && <audio className="audioPreview" src={item.src} controls />}
        {item.type === "website" && <a className="linkPreview" href={item.src} target="_blank" rel="noreferrer">{item.src}</a>}
      </div>

      {/* Action row */}
      <div style={{ display: "flex", gap: 5, marginTop: 10, flexWrap: "wrap" }}>

        {/* Edit — own or any */}
        {canEdit && item.status !== "archived" && (
          <button className="btnGhost" style={{ fontSize: 11, padding: "3px 10px" }} onClick={onEdit}>
            <i className="bi bi-pencil" style={{ marginRight: 4 }} />Edit
          </button>
        )}

        {/* Approve — admin/superAdmin, only on pending */}
        {canApprove && item.status === "pending" && (
          <button className="btnPrimary" style={{ fontSize: 11, padding: "3px 10px", background: "#16a34a" }} onClick={onApprove}>
            <i className="bi bi-check-lg" style={{ marginRight: 4 }} />Approve
          </button>
        )}

        {/* Archive — admin (any) or content manager (own) */}
        {(canArchiveAny || (canDelete && isOwner)) && item.status !== "archived" && (
          <button className="btnGhost" style={{ fontSize: 11, padding: "3px 10px", color: "#d97706", borderColor: "#fde68a" }} onClick={onArchive}>
            <i className="bi bi-archive" style={{ marginRight: 4 }} />Archive
          </button>
        )}

        {/* Restore — admin/superAdmin only */}
        {canArchiveAny && item.status === "archived" && (
          <button className="btnGhost" style={{ fontSize: 11, padding: "3px 10px", color: "#2563eb", borderColor: "#bfdbfe" }} onClick={onRestore}>
            <i className="bi bi-arrow-counterclockwise" style={{ marginRight: 4 }} />Restore
          </button>
        )}

        {/* Hard delete — superAdmin only */}
        {canHardDelete && (
          <button className="btnGhost" style={{ fontSize: 11, padding: "3px 10px", color: "#dc2626", borderColor: "#fecaca" }} onClick={onHardDelete}>
            <i className="bi bi-trash3" style={{ marginRight: 4 }} />Delete
          </button>
        )}
      </div>
    </div>
  );
}

export default Contents;
