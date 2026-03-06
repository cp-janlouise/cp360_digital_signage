import React, { useEffect, useMemo, useRef, useState } from "react";
import { usePermissions } from "../security/permissionContext";

export type Screen = {
  id: string;
  name: string;
  location: string;
  pairingCode: string;
  pairingCodeExpiry: string;
  screenToken: string;
  status: "unpaired" | "online" | "offline";
  lastSeen?: string;
  campaignIds: string[];
  createdAt: string;
  updatedAt: string;
};

export type CampaignRef = {
  id: string;
  name: string;
  playlistName?: string;
  startDate: string;
  endDate: string;
};

type Props = {
  campaigns: CampaignRef[];
  onNavigateHome: () => void;
};

const LS_KEY              = "cp360_screens_v1";
const PAIRING_TTL_MINUTES = 15;
const CODE_CHARS          = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function uid(p = "scr")    { return `${p}_${Math.random().toString(16).slice(2)}_${Date.now()}`; }
function now()              { return new Date().toISOString(); }
function genPairingCode()   { return Array.from({ length: 6 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join(""); }
function genScreenToken()   { return `st_${Math.random().toString(36).slice(2)}_${Math.random().toString(36).slice(2)}_${Date.now()}`; }
function codeExpiry()       { return new Date(Date.now() + PAIRING_TTL_MINUTES * 60 * 1000).toISOString(); }
function isCodeExpired(s: Screen) { return new Date() > new Date(s.pairingCodeExpiry); }
function secsLeft(expiry: string) { return Math.max(0, Math.floor((new Date(expiry).getTime() - Date.now()) / 1000)); }
function fmtCountdown(s: number)  { return `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`; }

function load(): Screen[] { try { const r = localStorage.getItem(LS_KEY); return r ? JSON.parse(r) : []; } catch { return []; } }
function save(d: Screen[]) { try { localStorage.setItem(LS_KEY, JSON.stringify(d)); } catch {} }

function statusDot(s: Screen["status"]) { return s === "online" ? "#22c55e" : s === "offline" ? "#ef4444" : "#f59e0b"; }
function statusLabel(s: Screen) {
  if (s.status === "online")  return "Online";
  if (s.status === "offline") return "Offline";
  return isCodeExpired(s) ? "Code expired" : "Awaiting pairing";
}

const Screens: React.FC<Props> = ({ campaigns, onNavigateHome }) => {
  const { can } = usePermissions();
  const canCreate        = can("canCreateScreen");
  const canEdit          = can("canEditScreen");
  const canDelete        = can("canDeleteScreen");
  const canPair          = can("canPairScreen");
  const canAssignCampaign = can("canAssignPlaylistToScreen");

  const [screens, setScreens]       = useState<Screen[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch]         = useState("");
  const [tick, setTick]             = useState(0);
  const [showModal, setShowModal]   = useState(false);
  const [modalEditId, setModalEditId] = useState<string | null>(null);
  const [formName, setFormName]     = useState("");
  const [formLocation, setFormLocation] = useState("");
  const [showCmpPicker, setShowCmpPicker] = useState(false);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  void tick;

  useEffect(() => {
    const loaded = load();
    setScreens(loaded);
    if (loaded.length) setSelectedId(loaded[0].id);
    tickRef.current = setInterval(() => setTick(t => t + 1), 1000);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, []);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === LS_KEY && e.newValue) setScreens(JSON.parse(e.newValue));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => { save(screens); }, [screens]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? screens.filter(s => s.name.toLowerCase().includes(q) || s.location.toLowerCase().includes(q)) : screens;
  }, [screens, search]);

  const selected = useMemo(() => screens.find(s => s.id === selectedId) ?? null, [screens, selectedId]);
  const assignedCampaigns   = (selected?.campaignIds ?? []).map(id => campaigns.find(c => c.id === id)).filter(Boolean) as CampaignRef[];
  const unassignedCampaigns = campaigns.filter(c => !(selected?.campaignIds ?? []).includes(c.id));

  const openCreate = () => { setModalEditId(null); setFormName(""); setFormLocation(""); setShowModal(true); };
  const openEdit = (s: Screen) => { setModalEditId(s.id); setFormName(s.name); setFormLocation(s.location); setShowModal(true); };

  const confirmModal = () => {
    const name = formName.trim();
    if (!name) return alert("Please enter a screen name.");
    if (modalEditId) {
      setScreens(prev => prev.map(s => s.id === modalEditId ? { ...s, name, location: formLocation.trim(), updatedAt: now() } : s));
    } else {
      const screen: Screen = {
        id: uid(), name, location: formLocation.trim(),
        pairingCode: genPairingCode(), pairingCodeExpiry: codeExpiry(),
        screenToken: genScreenToken(), status: "unpaired",
        campaignIds: [], createdAt: now(), updatedAt: now(),
      };
      setScreens(prev => [screen, ...prev]);
      setSelectedId(screen.id);
    }
    setShowModal(false);
  };

  const deleteScreen = (id: string) => {
    if (!canDelete) return;
    if (!confirm("Delete this screen?")) return;
    setScreens(prev => { const next = prev.filter(s => s.id !== id); if (selectedId === id) setSelectedId(next[0]?.id ?? null); return next; });
  };

  const regenerateCode = (id: string) => {
    setScreens(prev => prev.map(s => s.id === id ? { ...s, pairingCode: genPairingCode(), pairingCodeExpiry: codeExpiry(), status: "unpaired", updatedAt: now() } : s));
  };

  const assignCampaign   = (cmpId: string) => { setScreens(prev => prev.map(s => s.id === selectedId ? { ...s, campaignIds: [...s.campaignIds, cmpId], updatedAt: now() } : s)); setShowCmpPicker(false); };
  const unassignCampaign = (cmpId: string) => { setScreens(prev => prev.map(s => s.id === selectedId ? { ...s, campaignIds: s.campaignIds.filter(id => id !== cmpId), updatedAt: now() } : s)); };

  return (
    <div className="playlistsRoot">
      <div className="topRow">
        <button className="homeButton" onClick={onNavigateHome}>HOME</button>
        <h1 className="pageTitle">Screens</h1>
        <div className="topActions">
          <input className="searchInput" placeholder="Search screens…" value={search} onChange={e => setSearch(e.target.value)} />
          {canCreate && (
            <button className="addCampaignBtn" onClick={openCreate}>+ REGISTER SCREEN</button>
          )}
        </div>
      </div>

      <div className="playlistsBody">
        <div className="playlistsSidebar">
          <div className="playlistsSidebarHeader">All Screens ({filtered.length})</div>
          {filtered.length === 0 ? (
            <div className="plEmptyList"><p>No screens registered.</p><button className="btnPrimary" onClick={openCreate}>Register one</button></div>
          ) : (
            <ul className="playlistList">
              {filtered.map(s => (
                <li key={s.id} className={`playlistListItem ${s.id === selectedId ? "playlistListItemActive" : ""}`} onClick={() => setSelectedId(s.id)}>
                  <div className="plItemInfo">
                    <span style={{ display:"flex", alignItems:"center", gap:6 }}>
                      <span style={{ width:8, height:8, borderRadius:"50%", background:statusDot(s.status), display:"inline-block", flexShrink:0 }} />
                      <span className="plItemName">{s.name}</span>
                    </span>
                    <span className="plItemMeta">{s.location || "No location"}</span>
                    <span className="plItemMeta">{statusLabel(s)}</span>
                  </div>
                  <div className="plItemActions">
                    {canEdit && (
                      <button className="btnIcon" onClick={e => { e.stopPropagation(); openEdit(s); }}>✎</button>
                    )}
                    {canDelete && (
                      <button className="btnIcon btnIconDanger" onClick={e => { e.stopPropagation(); deleteScreen(s.id); }}>✕</button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="playlistsDetail">
          {!selected ? (
            <div className="plDetailEmpty">Select or register a screen to get started.</div>
          ) : (
            <>
              <div className="plDetailHeader">
                <div>
                  <h2 className="plDetailName">{selected.name}</h2>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:4 }}>
                    <span style={{ width:8, height:8, borderRadius:"50%", background:statusDot(selected.status), display:"inline-block" }} />
                    <span style={{ fontSize:13, color:"#6b7280" }}>{statusLabel(selected)}</span>
                    {selected.lastSeen && <span style={{ fontSize:12, color:"#d1d5db" }}>· last seen {new Date(selected.lastSeen).toLocaleTimeString()}</span>}
                  </div>
                </div>
                {canEdit && (
                  <button className="btnPrimary" onClick={() => openEdit(selected)}>Edit</button>
                )}
              </div>

              <div className="cmpDetailBody">

                {/* Pairing code block */}
                <div className="scrPairingBlock">
                  <div className="scrPairingLeft">
                    <div className="scrPairingLabel">
                      {selected.status === "online" ? "Screen paired ✓" : isCodeExpired(selected) ? "Pairing code expired" : "Enter this code on your TV player"}
                    </div>

                    {selected.status !== "online" && (
                      <>
                        {!isCodeExpired(selected) ? (
                          <>
                            <div className="scrPairingCode">
                              {selected.pairingCode.split("").map((ch, i) => (
                                <span key={i} className="scrPairingChar">{ch}</span>
                              ))}
                            </div>
                            <div className="scrPairingCountdown">Expires in {fmtCountdown(secsLeft(selected.pairingCodeExpiry))}</div>
                          </>
                        ) : (
                          canPair && (
                            <button className="btnPrimary" style={{ marginTop:12 }} onClick={() => regenerateCode(selected.id)}>Generate New Code</button>
                          )
                        )}
                      </>
                    )}

                    {selected.status === "online" && canPair && (
                      <button className="btnGhost" style={{ fontSize:12, marginTop:10 }} onClick={() => regenerateCode(selected.id)}>Re-pair this screen</button>
                    )}
                  </div>

                  <div className="scrPairingRight">
                    <div className="scrPairingInstruction">
                      <div className="scrPairingStep"><span className="scrPairingNum">1</span>Open the <strong>CP360 Player</strong> on your TV or display device.</div>
                      <div className="scrPairingStep"><span className="scrPairingNum">2</span>Enter the 6-character pairing code shown on the left.</div>
                      <div className="scrPairingStep"><span className="scrPairingNum">3</span>This screen will appear as <strong>Online</strong> automatically once connected.</div>
                    </div>
                  </div>
                </div>

                <details className="scrTokenDetails">
                  <summary>Screen Token (developer / API use)</summary>
                  <code className="scrDeviceId">{selected.screenToken}</code>
                </details>

                <div className="cmpSection">
                  <div className="cmpSectionTitle">Location</div>
                  <div className="cmpValue">{selected.location || <em style={{ color:"#9ca3af" }}>Not specified</em>}</div>
                </div>

                <div className="cmpSection">
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                    <div className="cmpSectionTitle" style={{ marginBottom:0 }}>Assigned Campaigns</div>
                    {canAssignCampaign && (
                      <button className="addCampaignBtn" style={{ fontSize:12, padding:"4px 14px" }} onClick={() => setShowCmpPicker(true)} disabled={unassignedCampaigns.length === 0}>
                        + Assign Campaign
                      </button>
                    )}
                  </div>
                  {assignedCampaigns.length === 0 ? (
                    <div style={{ color:"#9ca3af", fontSize:13, padding:"12px 0" }}>No campaigns assigned. The player will show a "No content" screen.</div>
                  ) : (
                    <div className="scrCampaignList">
                      {assignedCampaigns.map(c => (
                        <div key={c.id} className="scrCampaignItem">
                          <div>
                            <div className="plItemName">{c.name}</div>
                            <div className="plItemMeta">{c.playlistName && <>{c.playlistName} · </>}{c.startDate} → {c.endDate}</div>
                          </div>
                          {canAssignCampaign && (
                            <button className="btnIcon btnIconDanger" onClick={() => unassignCampaign(c.id)}>✕</button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="cmpSection">
                  <div className="cmpSectionTitle">Registered</div>
                  <div className="cmpValue">{new Date(selected.createdAt).toLocaleString()}</div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modalOverlay" onClick={() => setShowModal(false)}>
          <div className="modalCard" onClick={e => e.stopPropagation()}>
            <h2 className="modalTitle">{modalEditId ? "Edit Screen" : "Register New Screen"}</h2>
            <div className="formGrid">
              <label className="formLabel">
                <span className="labelText">Screen Name</span>
                <input className="input" autoFocus value={formName} onChange={e => setFormName(e.target.value)} onKeyDown={e => e.key === "Enter" && confirmModal()} placeholder="e.g. Lobby Display A" />
              </label>
              <label className="formLabel">
                <span className="labelText">Location <span style={{ fontWeight:400, color:"#9ca3af" }}>(optional)</span></span>
                <input className="input" value={formLocation} onChange={e => setFormLocation(e.target.value)} placeholder="e.g. Floor 1 – Main Entrance" />
              </label>
            </div>
            {!modalEditId && (
              <div style={{ marginTop:12, padding:"10px 14px", background:"#f0f9ff", borderRadius:6, fontSize:13, color:"#0369a1" }}>
                A 6-character pairing code will be generated. Enter it on the TV player to connect.
              </div>
            )}
            <div className="modalActions">
              <button className="btnGhost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btnPrimary" onClick={confirmModal}>{modalEditId ? "Save Changes" : "Register & Get Code"}</button>
            </div>
          </div>
        </div>
      )}

      {showCmpPicker && (
        <div className="modalOverlay" onClick={() => setShowCmpPicker(false)}>
          <div className="modalCard" onClick={e => e.stopPropagation()}>
            <h2 className="modalTitle">Assign Campaign to {selected?.name}</h2>
            {unassignedCampaigns.length === 0 ? (
              <p style={{ color:"#9ca3af", textAlign:"center", padding:"16px 0" }}>All campaigns are already assigned.</p>
            ) : (
              <ul className="playlistList" style={{ maxHeight:320, overflowY:"auto", border:"1px solid #e5e7eb", borderRadius:6 }}>
                {unassignedCampaigns.map(c => (
                  <li key={c.id} className="playlistListItem" style={{ cursor:"pointer" }} onClick={() => assignCampaign(c.id)}>
                    <div className="plItemInfo">
                      <span className="plItemName">{c.name}</span>
                      <span className="plItemMeta">{c.startDate} → {c.endDate}</span>
                    </div>
                    <button className="btnPrimary" style={{ fontSize:12, padding:"4px 12px" }}>Assign</button>
                  </li>
                ))}
              </ul>
            )}
            <div className="modalActions"><button className="btnGhost" onClick={() => setShowCmpPicker(false)}>Close</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Screens;
