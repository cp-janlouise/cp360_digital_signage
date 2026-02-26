// import React, { useEffect, useMemo, useState } from "react";
// import "/src/frontend/styles/layouts.css";

// import Stage from "../layouts/Stage";
// import type { Layout, MediaItem, Playlist, PlaylistItem, SlotId } from "../layouts/Layouts";

// type Props = {
//   mediaLibrary: MediaItem[];
//   onNavigateHome: () => void;
// };

// const LS_KEY_LAYOUTS = "cp360_layouts_v1";
// const LS_KEY_PLAYLISTS = "cp360_playlists_v1";

// function uid(prefix = "pl") {
//   return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
// }

// function nowISO() {
//   return new Date().toISOString();
// }

// function clampInt(n: number, min: number, max: number) {
//   const x = Number.isFinite(n) ? Math.round(n) : min;
//   return Math.max(min, Math.min(max, x));
// }

// function loadLayouts(): Layout[] {
//   try {
//     const raw = localStorage.getItem(LS_KEY_LAYOUTS);
//     if (!raw) return [];
//     const parsed = JSON.parse(raw);
//     return Array.isArray(parsed) ? (parsed as Layout[]) : [];
//   } catch {
//     return [];
//   }
// }

// function loadPlaylists(): Playlist[] {
//   try {
//     const raw = localStorage.getItem(LS_KEY_PLAYLISTS);
//     if (!raw) return [];
//     const parsed = JSON.parse(raw);
//     return Array.isArray(parsed) ? (parsed as Playlist[]) : [];
//   } catch {
//     return [];
//   }
// }

// function savePlaylists(items: Playlist[]) {
//   try {
//     localStorage.setItem(LS_KEY_PLAYLISTS, JSON.stringify(items));
//   } catch {
//     // ignore
//   }
// }

// function pickRotatingMediaId(items: PlaylistItem[] | undefined, nowMs: number) {
//   if (!items || items.length === 0) return null;
//   const durations = items.map((it) => Math.max(1, it.durationSec) * 1000);
//   const total = durations.reduce((a, b) => a + b, 0);
//   const t = nowMs % total;

//   let acc = 0;
//   for (let i = 0; i < items.length; i++) {
//     acc += durations[i];
//     if (t < acc) return items[i].mediaId;
//   }
//   return items[items.length - 1].mediaId;
// }

// function applyPlaylistToLayout(layout: Layout, playlist: Playlist | null, nowMs: number): Layout {
//   if (!playlist) return layout;
//   if (playlist.layoutId !== layout.id) return layout;

//   const slotOrder = layout.slotOrder ?? (Object.keys(layout.slots) as SlotId[]);
//   const next: Layout = { ...layout, slots: { ...layout.slots } };

//   for (const slotId of slotOrder) {
//     const list = playlist.slotItems?.[slotId] ?? [];
//     const mediaId = pickRotatingMediaId(list, nowMs);
//     if (mediaId) next.slots[slotId] = { kind: "media", mediaId };
//   }
//   return next;
// }

// /** Lightweight preview, avoids depending on Layouts.tsx internal helpers */
// function LayoutPreviewMini({ layout, media }: { layout: Layout; media: MediaItem[] }) {
//   const slotOrder = layout.slotOrder ?? (Object.keys(layout.slots) as SlotId[]);
//   const slotFrames =
//     layout.slotFrames ?? {
//       hero: { x: 0, y: 0, w: 66.5, h: 100 },
//       rightTop: { x: 66.5, y: 0, w: 33.5, h: 50 },
//       rightBottom: { x: 66.5, y: 50, w: 33.5, h: 50 },
//     };

//   const getThumb = (slotId: SlotId) => {
//     const content = layout.slots[slotId];
//     if (!content) return <div className="thumbPlaceholder">Empty</div>;
//     if (content.kind === "empty") return <div className="thumbPlaceholder">Empty</div>;
//     if (content.kind === "widget")
//       return <div className="thumbPlaceholder">Widget: {content.widget}</div>;

//     const m = media.find((x) => x.id === content.mediaId);
//     if (!m) return <div className="thumbPlaceholder">Missing media</div>;

//     if (m.type === "image") return <img className="thumbImg" src={m.src} alt={m.title} />;
//     if (m.type === "video") return <video className="thumbImg" src={m.src} muted playsInline />;

//     return <div className="thumbPlaceholder">{m.type.toUpperCase()}: {m.title}</div>;
//   };

//   return (
//     <div className="previewBox">
//       <div className="previewCanvas">
//         {slotOrder.map((slotId) => {
//           const f = slotFrames[slotId] ?? slotFrames.hero;
//           return (
//             <div
//               key={slotId}
//               className="previewSlot"
//               style={{
//                 left: `${f.x}%`,
//                 top: `${f.y}%`,
//                 width: `${f.w}%`,
//                 height: `${f.h}%`,
//               }}
//             >
//               <div className="previewSlotLabel">{slotId}</div>
//               <div className="previewThumb">{getThumb(slotId)}</div>
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );
// }

// const PlaylistPage: React.FC<Props> = ({ mediaLibrary, onNavigateHome }) => {
//   const [layouts, setLayouts] = useState<Layout[]>([]);
//   const [playlists, setPlaylists] = useState<Playlist[]>([]);
//   const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);

//   // picker modal
//   const [pickerOpen, setPickerOpen] = useState(false);
//   const [pickerSlot, setPickerSlot] = useState<SlotId | null>(null);
//   const [mediaTab, setMediaTab] = useState<"all" | "image" | "video" | "website" | "music">("all");
//   const [mediaSearch, setMediaSearch] = useState("");

//   // stage preview
//   const [stageLayout, setStageLayout] = useState<Layout | null>(null);

//   useEffect(() => {
//     const l = loadLayouts();
//     setLayouts(l);

//     const p = loadPlaylists();
//     setPlaylists(p);

//     setSelectedPlaylistId(p[0]?.id ?? null);
//   }, []);

//   useEffect(() => {
//     savePlaylists(playlists);
//   }, [playlists]);

//   const selectedPlaylist = useMemo(() => {
//     if (!selectedPlaylistId) return null;
//     return playlists.find((p) => p.id === selectedPlaylistId) ?? null;
//   }, [playlists, selectedPlaylistId]);

//   const selectedLayout = useMemo(() => {
//     if (!selectedPlaylist) return null;
//     return layouts.find((l) => l.id === selectedPlaylist.layoutId) ?? null;
//   }, [layouts, selectedPlaylist]);

//   const previewLayout = useMemo(() => {
//     if (!selectedLayout) return null;
//     return applyPlaylistToLayout(selectedLayout, selectedPlaylist, Date.now());
//   }, [selectedLayout, selectedPlaylist]);

//   const filteredMedia = useMemo(() => {
//     const q = mediaSearch.trim().toLowerCase();
//     let base = mediaLibrary;

//     if (mediaTab !== "all") base = base.filter((m) => m.type === mediaTab);

//     if (!q) return base;
//     return base.filter((m) => {
//       return (
//         m.title.toLowerCase().includes(q) ||
//         m.type.toLowerCase().includes(q) ||
//         m.src.toLowerCase().includes(q)
//       );
//     });
//   }, [mediaLibrary, mediaSearch, mediaTab]);

//   const playlistsByLayout = useMemo(() => {
//     const map = new Map<string, Playlist[]>();
//     for (const p of playlists) {
//       const arr = map.get(p.layoutId) ?? [];
//       arr.push(p);
//       map.set(p.layoutId, arr);
//     }
//     return map;
//   }, [playlists]);

//   const createPlaylist = () => {
//     if (layouts.length === 0) return alert("Create a layout first (Layouts tab), then create a playlist.");
//     const layoutId = layouts[0].id;
//     const t = nowISO();
//     const pl: Playlist = {
//       id: uid("pl"),
//       name: "New Playlist",
//       layoutId,
//       slotItems: {},
//       createdAt: t,
//       updatedAt: t,
//     };
//     setPlaylists((prev) => [pl, ...prev]);
//     setSelectedPlaylistId(pl.id);
//   };

//   const renamePlaylist = (name: string) => {
//     if (!selectedPlaylist) return;
//     setPlaylists((prev) =>
//       prev.map((p) => (p.id === selectedPlaylist.id ? { ...p, name, updatedAt: nowISO() } : p))
//     );
//   };

//   const changePlaylistLayout = (layoutId: string) => {
//     if (!selectedPlaylist) return;
//     setPlaylists((prev) =>
//       prev.map((p) => {
//         if (p.id !== selectedPlaylist.id) return p;
//         // Keep slotItems, but switching layouts can make some slots irrelevant. Not fatal, we just won’t render them.
//         return { ...p, layoutId, updatedAt: nowISO() };
//       })
//     );
//   };

//   const deletePlaylist = (id: string) => {
//     if (!confirm("Delete this playlist?")) return;
//     setPlaylists((prev) => prev.filter((p) => p.id !== id));
//     if (selectedPlaylistId === id) setSelectedPlaylistId(null);
//   };

//   const addToSlot = (slotId: SlotId, mediaId: string) => {
//     if (!selectedPlaylist) return;
//     setPlaylists((prev) =>
//       prev.map((p) => {
//         if (p.id !== selectedPlaylist.id) return p;
//         const next = structuredClone(p);
//         const list = (next.slotItems?.[slotId] ?? []) as PlaylistItem[];
//         list.push({ id: uid("pli"), mediaId, durationSec: 10 });
//         next.slotItems = { ...(next.slotItems ?? {}), [slotId]: list };
//         next.updatedAt = nowISO();
//         return next;
//       })
//     );
//   };

//   const removeFromSlot = (slotId: SlotId, itemId: string) => {
//     if (!selectedPlaylist) return;
//     setPlaylists((prev) =>
//       prev.map((p) => {
//         if (p.id !== selectedPlaylist.id) return p;
//         const next = structuredClone(p);
//         const list = ((next.slotItems?.[slotId] ?? []) as PlaylistItem[]).filter((x) => x.id !== itemId);
//         next.slotItems = { ...(next.slotItems ?? {}), [slotId]: list };
//         next.updatedAt = nowISO();
//         return next;
//       })
//     );
//   };

//   const setDuration = (slotId: SlotId, itemId: string, durationSec: number) => {
//     if (!selectedPlaylist) return;
//     setPlaylists((prev) =>
//       prev.map((p) => {
//         if (p.id !== selectedPlaylist.id) return p;
//         const next = structuredClone(p);
//         const list = (next.slotItems?.[slotId] ?? []) as PlaylistItem[];
//         next.slotItems = {
//           ...(next.slotItems ?? {}),
//           [slotId]: list.map((x) => (x.id === itemId ? { ...x, durationSec: clampInt(durationSec, 1, 3600) } : x)),
//         };
//         next.updatedAt = nowISO();
//         return next;
//       })
//     );
//   };

//   const moveItem = (slotId: SlotId, itemId: string, dir: -1 | 1) => {
//     if (!selectedPlaylist) return;
//     setPlaylists((prev) =>
//       prev.map((p) => {
//         if (p.id !== selectedPlaylist.id) return p;
//         const next = structuredClone(p);
//         const list = (next.slotItems?.[slotId] ?? []) as PlaylistItem[];
//         const idx = list.findIndex((x) => x.id === itemId);
//         const j = idx + dir;
//         if (idx < 0 || j < 0 || j >= list.length) return p;
//         const copy = list.slice();
//         const tmp = copy[idx];
//         copy[idx] = copy[j];
//         copy[j] = tmp;
//         next.slotItems = { ...(next.slotItems ?? {}), [slotId]: copy };
//         next.updatedAt = nowISO();
//         return next;
//       })
//     );
//   };

//   if (stageLayout) {
//     return (
//       <div style={{ position: "fixed", inset: 0, zIndex: 9999 }}>
//         <Stage layout={stageLayout} mediaLibrary={mediaLibrary} />
//         <button
//           onClick={() => setStageLayout(null)}
//           style={{
//             position: "absolute",
//             top: 12,
//             right: 16,
//             zIndex: 10000,
//             background: "rgba(0,0,0,0.55)",
//             color: "#fff",
//             border: "none",
//             borderRadius: 6,
//             padding: "8px 10px",
//             cursor: "pointer",
//           }}
//         >
//           Close preview
//         </button>
//       </div>
//     );
//   }

//   const slotOrder: SlotId[] =
//     selectedLayout?.slotOrder ?? (selectedLayout ? (Object.keys(selectedLayout.slots) as SlotId[]) : ["hero", "rightTop", "rightBottom"]);

//   return (
//     <div className="layoutsPage">
//       <div className="layoutsWrap">
//         <div className="layoutsHeader">
//           <div>
//             <div className="pageTitle">Playlists</div>
//             <div className="pageSub">
//               Build rotation per slot. Layout defines the “where”, playlist defines the “what next”. 🎛️
//             </div>
//           </div>

//           <div className="actions" style={{ display: "flex", gap: 10 }}>
//             <button className="btnGhost" onClick={onNavigateHome}>
//               HOME
//             </button>
//             <button className="btnPrimary" onClick={createPlaylist}>
//               + CREATE PLAYLIST
//             </button>
//           </div>
//         </div>

//         <div className="grid2">
//           {/* LEFT */}
//           <div className="panel">
//             <div className="panelTitle">All Playlists ({playlists.length})</div>

//             {playlists.length === 0 ? (
//               <div className="emptyBox">
//                 <div className="emptyTitle">No playlists yet</div>
//                 <div className="emptyText">
//                   Create one, bind it to a layout, then add media per slot. Your screens will thank you.
//                 </div>
//               </div>
//             ) : (
//               <div className="layoutList">
//                 {playlists.map((p) => {
//                   const layoutName = layouts.find((l) => l.id === p.layoutId)?.name ?? "(missing layout)";
//                   const isActive = p.id === selectedPlaylistId;
//                   const countSlots = Object.keys(p.slotItems ?? {}).length;

//                   return (
//                     <button
//                       key={p.id}
//                       className={isActive ? "layoutRow layoutRowActive" : "layoutRow"}
//                       onClick={() => setSelectedPlaylistId(p.id)}
//                     >
//                       <div className="layoutRowTop">
//                         <div className="layoutName">{p.name || "(untitled)"}</div>
//                         <div className="layoutMeta">{new Date(p.updatedAt).toLocaleDateString()}</div>
//                       </div>

//                       <div className="layoutRowChips" style={{ gap: 8 }}>
//                         <span className="chip">Layout: {layoutName}</span>
//                         <span className="chip">Slots: {countSlots}</span>
//                       </div>
//                     </button>
//                   );
//                 })}
//               </div>
//             )}
//           </div>

//           {/* RIGHT */}
//           <div className="panel">
//             <div className="panelTitle">Editor</div>

//             {!selectedPlaylist ? (
//               <div className="emptyBox">
//                 <div className="emptyTitle">Select a playlist</div>
//                 <div className="emptyText">Pick one on the left to edit, or create a new playlist.</div>
//               </div>
//             ) : (
//               <>
//                 <div className="playlistPanel" style={{ marginTop: 0 }}>
//                   <div className="playlistHeader">
//                     <div>
//                       <div className="playlistTitle">Playlist Details</div>
//                       <div className="playlistSub">Bind to a layout and manage items per slot.</div>
//                     </div>

//                     <div className="playlistHeaderActions">
//                       <button className="btnDanger" onClick={() => deletePlaylist(selectedPlaylist.id)}>
//                         Delete
//                       </button>
//                     </div>
//                   </div>

//                   <div className="playlistRow" style={{ alignItems: "stretch" }}>
//                     <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
//                       <div style={{ fontSize: 12, opacity: 0.8 }}>Name</div>
//                       <input
//                         className="input"
//                         value={selectedPlaylist.name}
//                         onChange={(e) => renamePlaylist(e.target.value)}
//                       />
//                     </div>

//                     <div style={{ display: "flex", flexDirection: "column", gap: 6, width: 320 }}>
//                       <div style={{ fontSize: 12, opacity: 0.8 }}>Layout</div>
//                       <select
//                         className="select"
//                         value={selectedPlaylist.layoutId}
//                         onChange={(e) => changePlaylistLayout(e.target.value)}
//                       >
//                         {layouts.length === 0 ? (
//                           <option value="">(no layouts)</option>
//                         ) : (
//                           layouts.map((l) => (
//                             <option key={l.id} value={l.id}>
//                               {l.name || "(untitled layout)"}
//                               {playlistsByLayout.get(l.id)?.length
//                                 ? ` • ${playlistsByLayout.get(l.id)!.length} playlist(s)`
//                                 : ""}
//                             </option>
//                           ))
//                         )}
//                       </select>
//                     </div>
//                   </div>

//                   <div style={{ marginTop: 14 }}>
//                     {!selectedLayout ? (
//                       <div className="emptyMini">This playlist points to a missing layout. Rebind it above.</div>
//                     ) : (
//                       <>
//                         <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
//                           <div>
//                             <div className="playlistTitle" style={{ fontSize: 16 }}>
//                               Preview
//                             </div>
//                             <div className="playlistSub" style={{ fontSize: 12 }}>
//                               Current rotation moment-in-time.
//                             </div>
//                           </div>

//                           <button
//                             className="btnPrimary"
//                             onClick={() => {
//                               const applied = applyPlaylistToLayout(selectedLayout, selectedPlaylist, Date.now());
//                               setStageLayout(applied);
//                             }}
//                           >
//                             Preview on Stage
//                           </button>
//                         </div>

//                         <div style={{ marginTop: 10 }}>
//                           <LayoutPreviewMini layout={previewLayout ?? selectedLayout} media={mediaLibrary} />
//                         </div>

//                         <div className="playlistSlots" style={{ marginTop: 16 }}>
//                           {slotOrder.map((slotId) => {
//                             const items = selectedPlaylist.slotItems?.[slotId] ?? [];
//                             return (
//                               <div key={slotId} className="playlistSlotCard">
//                                 <div className="playlistSlotTop">
//                                   <div className="playlistSlotName">{slotId}</div>
//                                   <button
//                                     className="btnGhost"
//                                     onClick={() => {
//                                       setPickerSlot(slotId);
//                                       setPickerOpen(true);
//                                       setMediaTab("all");
//                                       setMediaSearch("");
//                                     }}
//                                   >
//                                     + Add media
//                                   </button>
//                                 </div>

//                                 {items.length === 0 ? (
//                                   <div className="emptyMini">No items</div>
//                                 ) : (
//                                   <div className="playlistItems">
//                                     {items.map((it) => {
//                                       const m = mediaLibrary.find((x) => x.id === it.mediaId);
//                                       return (
//                                         <div key={it.id} className="playlistItem">
//                                           <div className="playlistItemMain">
//                                             <div className="playlistItemTitle">{m?.title ?? "Missing media"}</div>
//                                             <div className="playlistItemMeta">{m?.type ?? "?"}</div>
//                                           </div>

//                                           <div className="playlistItemControls">
//                                             <label className="durLabel">
//                                               <span>sec</span>
//                                               <input
//                                                 className="durInput"
//                                                 type="number"
//                                                 min={1}
//                                                 max={3600}
//                                                 value={it.durationSec}
//                                                 onChange={(e) => setDuration(slotId, it.id, Number(e.target.value))}
//                                               />
//                                             </label>

//                                             <button className="btnGhost" onClick={() => moveItem(slotId, it.id, -1)} title="Up">
//                                               ↑
//                                             </button>
//                                             <button className="btnGhost" onClick={() => moveItem(slotId, it.id, 1)} title="Down">
//                                               ↓
//                                             </button>

//                                             <button className="btnDanger" onClick={() => removeFromSlot(slotId, it.id)}>
//                                               Remove
//                                             </button>
//                                           </div>
//                                         </div>
//                                       );
//                                     })}
//                                   </div>
//                                 )}
//                               </div>
//                             );
//                           })}
//                         </div>
//                       </>
//                     )}
//                   </div>
//                 </div>
//               </>
//             )}
//           </div>
//         </div>

//         {/* Picker Modal */}
//         {pickerOpen && pickerSlot && selectedPlaylist && (
//           <div className="modalOverlay" onClick={() => setPickerOpen(false)}>
//             <div className="modal" onClick={(e) => e.stopPropagation()}>
//               <div className="modalTitle">Add Media to {pickerSlot}</div>

//               <div style={{ display: "flex", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
//                 <select className="select" value={mediaTab} onChange={(e) => setMediaTab(e.target.value as any)}>
//                   <option value="all">All</option>
//                   <option value="image">Images</option>
//                   <option value="video">Videos</option>
//                   <option value="website">Websites</option>
//                   <option value="music">Music</option>
//                 </select>

//                 <input
//                   className="input"
//                   placeholder="Search media..."
//                   value={mediaSearch}
//                   onChange={(e) => setMediaSearch(e.target.value)}
//                   style={{ flex: 1, minWidth: 220 }}
//                 />

//                 <button className="btnGhost" onClick={() => setPickerOpen(false)}>
//                   Close
//                 </button>
//               </div>

//               {filteredMedia.length === 0 ? (
//                 <div className="emptyBox">
//                   <div className="emptyTitle">No media found</div>
//                   <div className="emptyText">Add items in Contents, then come back here.</div>
//                 </div>
//               ) : (
//                 <div className="mediaGrid">
//                   {filteredMedia.map((m) => (
//                     <button
//                       key={m.id}
//                       className="mediaCard"
//                       onClick={() => {
//                         addToSlot(pickerSlot, m.id);
//                       }}
//                       title="Click to add"
//                     >
//                       <div className="mediaThumb">
//                         {m.type === "image" ? (
//                           <img src={m.src} alt={m.title} />
//                         ) : m.type === "video" ? (
//                           <video src={m.src} muted playsInline />
//                         ) : (
//                           <div className="mediaIcon">{m.type.toUpperCase()}</div>
//                         )}
//                       </div>
//                       <div className="mediaMeta">
//                         <div className="mediaTitle">{m.title}</div>
//                         <div className="mediaSub">{m.type}</div>
//                       </div>
//                     </button>
//                   ))}
//                 </div>
//               )}
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default PlaylistPage;