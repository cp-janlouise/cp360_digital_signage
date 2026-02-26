import React, { useEffect, useMemo, useRef, useState } from "react";
import "/src/frontend/styles/layouts.css";
import TopBar from "./TopBar";
import Ticker from "./Ticker";
import Stage from "./Stage";

/** Keep types compatible with Contents.tsx */
export type MediaType = "image" | "video" | "website" | "music";

export type MediaItem = {
  id: string;
  type: MediaType;
  title: string;
  src: string;
};

export type WidgetKey = "scorecard" | "placeholder";

export type SlotId = "hero" | "rightTop" | "rightBottom";

type ResizeDir = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

export type SlotContent =
  | { kind: "empty" }
  | { kind: "media"; mediaId: string }
  | { kind: "widget"; widget: WidgetKey };

export type Layout = {
  id: string;
  name: string;
  slots: Record<SlotId, SlotContent>;
  // Optional editor metadata: the visual order of slots
  slotOrder?: SlotId[];

  /**
   * Optional editor metadata: draggable + resizable frame rectangles (percentages).
   * Values are in [0..100], relative to the editor canvas.
   */
  slotFrames?: Record<SlotId, { x: number; y: number; w: number; h: number }>;
  createdAt: string;
  updatedAt: string;
};

type Props = {
  mediaLibrary: MediaItem[];
  onUseLayout: (layout: Layout) => void;
  onNavigateHome: () => void;
};

const LS_KEY = "cp360_layouts_v1";

function uid(prefix = "layout") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function nowISO() {
  return new Date().toISOString();
}

function defaultLayout(): Layout {
  const t = nowISO();
  return {
    id: uid(),
    name: "",
    slots: {
      hero: { kind: "empty" },
      rightTop: { kind: "empty" },
      rightBottom: { kind: "widget", widget: "scorecard" },
    },
    slotOrder: ["hero"],
    slotFrames: {
      // 16:9-ish composition: big hero left, 2 stacked right slots
      hero: { x: 0, y: 0, w: 66.5, h: 100 },
      rightTop: { x: 66.5, y: 0, w: 33.5, h: 50 },
      rightBottom: { x: 66.5, y: 50, w: 33.5, h: 50 },
    },
    createdAt: t,
    updatedAt: t,
  };
}

function loadLayouts(): Layout[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLayouts(layouts: Layout[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(layouts));
  } catch {
    // ignore
  }
}

function getMedia(media: MediaItem[], id?: string) {
  if (!id) return null;
  return media.find((m) => m.id === id) ?? null;
}

function labelFor(content: SlotContent, media: MediaItem[]) {
  if (content.kind === "empty") return "Empty";
  if (content.kind === "widget") return `Widget: ${content.widget}`;
  const m = getMedia(media, content.mediaId);
  return m ? `Media: ${m.title}` : "Media: (missing)";
}

const SLOT_META: Record<SlotId, { title: string; subtitle: string }> = {
  hero: { title: "Panel 1", subtitle: "Big left" },
  rightTop: { title: "Panel 2", subtitle: "Top right" },
  rightBottom: { title: "Panel 3", subtitle: "Bottom right" },
};

const SLOT_ORDER_ALL: SlotId[] = ["hero", "rightTop", "rightBottom"];
const DEFAULT_FRAMES: Record<SlotId, { x: number; y: number; w: number; h: number }> = {
  hero: { x: 0, y: 0, w: 66.5, h: 100 },
  rightTop: { x: 66.5, y: 0, w: 33.5, h: 50 },
  rightBottom: { x: 66.5, y: 50, w: 33.5, h: 50 },
};

const RESERVED_NAME = "untitled layout";

const Layouts: React.FC<Props> = ({ mediaLibrary, onUseLayout, onNavigateHome }) => {
  const [layouts, setLayouts] = useState<Layout[]>([]);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [showEditor, setShowEditor] = useState(false);
  const [draft, setDraft] = useState<Layout | null>(null);
  const [activeLayout, setActiveLayout] = useState<Layout | null>(null);


  // Editor state
  const [activeSlot, setActiveSlot] = useState<SlotId>("hero");
  const [_dragFrom, setDragFrom] = useState<SlotId | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const interactionRef = useRef<
    | null
    | {
        kind: "move" | "resize";
        slot: SlotId;
        startX: number;
        startY: number;
        startFrame: { x: number; y: number; w: number; h: number };
        dir?: ResizeDir;
      }
  >(null);

  // Media picker state
  const [mediaTab, setMediaTab] = useState<"all" | MediaType>("all");
  const [mediaSearch, setMediaSearch] = useState("");
  const [pickerSlot, setPickerSlot] = useState<SlotId | null>(null);

  // Track whether the name field has been touched (for inline error display)
  const [nameTouched, setNameTouched] = useState(false);

  const addSlot = () => {
  if (!draft) return;
  const { slotOrder, slotFrames } = ensureFrames(draft);
  if (slotOrder.length >= 3) return; // no more slots available
  const next = SLOT_ORDER_ALL.find((s) => !slotOrder.includes(s))!;
  const newOrder = [...slotOrder, next];

  const updatedFrames = { ...slotFrames };
  if (slotOrder.length === 1) {
    updatedFrames.hero ={ x: 0, y: 0, w: 66.5, h: 100 };
  } 
  updatedFrames[next] = DEFAULT_FRAMES[next];
  setDraft({
    ...draft,
    slotOrder: newOrder,
    slotFrames: updatedFrames,
  });
  setActiveSlot(next);
};

const removeSlot = () => {
  if (!draft) return;
  const { slotOrder, slotFrames } = ensureFrames(draft);
  if (slotOrder.length <= 1) return;
  const removed = slotOrder[slotOrder.length - 1];
  const newOrder = slotOrder.slice(0, -1);

  // When going back to 1 slot, restore hero to full canvas
  const updatedFrames = { ...slotFrames };
  if (newOrder.length === 1) {
    updatedFrames.hero = { x: 0, y: 0, w: 100, h: 100 };
  }

  setDraft({ ...draft, slotOrder: newOrder, slotFrames: updatedFrames });
  if (activeSlot === removed) setActiveSlot(newOrder[newOrder.length - 1]);
}

  useEffect(() => {
    const loaded = loadLayouts();
    setLayouts(loaded);
    if (loaded.length) setSelectedId(loaded[0].id);
  }, []);

  useEffect(() => {
    saveLayouts(layouts);
  }, [layouts]);

  const filteredLayouts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return layouts;
    return layouts.filter((l) => l.name.toLowerCase().includes(q));
  }, [layouts, search]);

  const selected = useMemo(
    () => layouts.find((l) => l.id === selectedId) ?? null,
    [layouts, selectedId]
  );

  const openCreate = () => {
    setDraft(defaultLayout());
    setActiveSlot("hero");
    setMediaTab("all");
    setMediaSearch("");
    setNameTouched(false);
    setShowEditor(true);
  };

  const openEdit = (layout: Layout) => {
    // Deep copy to avoid mutating saved layout while editing
    const copy = JSON.parse(JSON.stringify(layout)) as Layout;
    setDraft(copy);
    setActiveSlot("hero");
    setMediaTab("all");
    setMediaSearch("");
    setNameTouched(false);
    setShowEditor(true);
  };

  const closeEditor = () => {
    setShowEditor(false);
    setDraft(null);
    setDragFrom(null);
    setNameTouched(false);
    interactionRef.current = null;
  };

  /** Returns a validation error string, or null if the name is valid. */
  const getNameError = (name: string, currentId: string): string | null => {
    const trimmed = name.trim();
    if (!trimmed) return "Please enter a layout name.";
    if (trimmed.toLowerCase() === RESERVED_NAME) {
      return 'Please rename your layout — "Untitled Layout" is not allowed.';
    }
    const isDuplicate = layouts.some(
      (l) => l.name.toLowerCase() === trimmed.toLowerCase() && l.id !== currentId
    );
    if (isDuplicate) return "A layout with this name already exists. Please use a unique name.";
    return null;
  };

  const saveDraft = () => {
    if (!draft) return;
    setNameTouched(true);

    const error = getNameError(draft.name, draft.id);
    if (error) return alert(error);

    const updated: Layout = { ...draft, name: draft.name.trim(), updatedAt: nowISO() };

    setLayouts((prev) => {
      const idx = prev.findIndex((p) => p.id === updated.id);
      if (idx === -1) return [updated, ...prev];
      const copy = [...prev];
      copy[idx] = updated;
      return copy;
    });

    setSelectedId(updated.id);
    closeEditor();
  };

  const removeLayout = (id: string) => {
    if (!confirm("Delete this layout?")) return;
    setLayouts((prev) => prev.filter((l) => l.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const updateSlot = (slot: SlotId, next: SlotContent) => {
    if (!draft) return;
    setDraft({
      ...draft,
      slots: {
        ...draft.slots,
        [slot]: next,
      },
    });
  };

  const swapSlotContents = (a: SlotId, b: SlotId) => {
    if (!draft) return;
    setDraft((prev) => {
      if (!prev) return prev;
      const nextSlots = { ...prev.slots };
      const temp = nextSlots[a];
      nextSlots[a] = nextSlots[b];
      nextSlots[b] = temp;
      return { ...prev, slots: nextSlots };
    });
  };


  const clearSlot = (slot: SlotId) => updateSlot(slot, { kind: "empty" });

  const ensureFrames = (l: Layout): Required<Pick<Layout, "slotFrames" | "slotOrder">> => {
    const slotOrder = l.slotOrder && l.slotOrder.length ? l.slotOrder : (["hero", "rightTop", "rightBottom"] as SlotId[]);
    const slotFrames =
      l.slotFrames ??
      ({
        hero: { x: 0, y: 0, w: 66.5, h: 100 },
        rightTop: { x: 66.5, y: 0, w: 33.5, h: 50 },
        rightBottom: { x: 66.5, y: 50, w: 33.5, h: 50 },
      } as const);
    return { slotOrder, slotFrames };
  };

  const clampFrame = (f: { x: number; y: number; w: number; h: number }) => {
    const minW = 18;
    const minH = 18;
    let w = Math.max(minW, Math.min(100, f.w));
    let h = Math.max(minH, Math.min(100, f.h));
    let x = Math.max(0, Math.min(100 - w, f.x));
    let y = Math.max(0, Math.min(100 - h, f.y));
    return { x, y, w, h };
  };

  const setFrame = (slot: SlotId, nextFrame: { x: number; y: number; w: number; h: number }) => {
    if (!draft) return;
    const { slotFrames, slotOrder } = ensureFrames(draft);
    setDraft({
      ...draft,
      slotOrder,
      slotFrames: {
        ...slotFrames,
        [slot]: clampFrame(nextFrame),
      },
    });
  };

  const beginMove = (slot: SlotId, e: React.PointerEvent) => {
    if (!draft) return;
    const { slotFrames } = ensureFrames(draft);
    const f = slotFrames[slot];
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    interactionRef.current = { kind: "move", slot, startX: e.clientX, startY: e.clientY, startFrame: { ...f } };
  };

  const beginResize = (slot: SlotId, dir: ResizeDir, e: React.PointerEvent) => {
    if (!draft) return;
    const { slotFrames } = ensureFrames(draft);
    const f = slotFrames[slot];
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    interactionRef.current = {
      kind: "resize",
      slot,
      dir,
      startX: e.clientX,
      startY: e.clientY,
      startFrame: { ...f },
    };
  };

  const onPointerMoveCanvas = (e: React.PointerEvent) => {
    const ctx = interactionRef.current;
    if (!ctx || !draft) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dxPct = ((e.clientX - ctx.startX) / rect.width) * 100;
    const dyPct = ((e.clientY - ctx.startY) / rect.height) * 100;

    if (ctx.kind === "move") {
      setFrame(ctx.slot, {
        ...ctx.startFrame,
        x: ctx.startFrame.x + dxPct,
        y: ctx.startFrame.y + dyPct,
      });
    } else {
      const dir = ctx.dir || "se";

      let x = ctx.startFrame.x;
      let y = ctx.startFrame.y;
      let w = ctx.startFrame.w;
      let h = ctx.startFrame.h;

      if (dir.includes("e")) w = ctx.startFrame.w + dxPct;
      if (dir.includes("s")) h = ctx.startFrame.h + dyPct;

      if (dir.includes("w")) {
        x = ctx.startFrame.x + dxPct;
        w = ctx.startFrame.w - dxPct;
      }

      if (dir.includes("n")) {
        y = ctx.startFrame.y + dyPct;
        h = ctx.startFrame.h - dyPct;
      }

      setFrame(ctx.slot, { x, y, w, h });
    }
  };

  const endPointer = () => {
    interactionRef.current = null;
  };


  const filteredMedia = useMemo(() => {
    const q = mediaSearch.trim().toLowerCase();
    let base = mediaLibrary;

    if (mediaTab !== "all") base = base.filter((m) => m.type === mediaTab);
    if (!q) return base;

    return base.filter((m) => {
      return (
        m.title.toLowerCase().includes(q) ||
        m.type.toLowerCase().includes(q) ||
        m.src.toLowerCase().includes(q)
      );
    });
  }, [mediaLibrary, mediaTab, mediaSearch]);

  if (activeLayout) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999 }}>
      <Stage layout={activeLayout} mediaLibrary={mediaLibrary} />
      <button
        onClick={() => setActiveLayout(null)}
        style={{
          position: "absolute",
          top: 12,
          right: 16,
          zIndex: 10000,
          background: "rgba(0,0,0,0.55)",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          padding: "6px 14px",
          cursor: "pointer",
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: 1,
        }}
      >
        ✕ EXIT
      </button>
    </div>
  );
}

  // Compute inline name error for the editor (only shown after user touches the field)
  const nameError = draft && nameTouched ? getNameError(draft.name, draft.id) : null;

  return (
    <div className="layoutsPage">
      <div className="layoutsHeader">
        <div className="layoutsHeaderLeft">
          <button className="btnGhost" onClick={onNavigateHome}>
            HOME
          </button>

          <div>
            <div className="layoutsH1">Layouts</div>
            <div className="layoutsSub">
              Tip: drag a slot onto another to swap what they display. Your Hero can "teleport" right. ✨
            </div>
          </div>
        </div>

        <div className="layoutsHeaderRight">
          <input
            className="input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search layouts..."
          />
          <button className="btnPrimary" onClick={openCreate}>
            + ADD A LAYOUT
          </button>
        </div>
      </div>

      <div className="layoutsGrid2">
        <div className="panel">
          <div className="panelTitle">Saved Layouts ({layouts.length})</div>

          {filteredLayouts.length === 0 ? (
            <div className="emptyBox">
              <div className="emptyTitle">No layouts</div>
              <div className="emptyText">Create one and assign what each slot displays.</div>
            </div>
          ) : (
            <div className="layoutList">
              {filteredLayouts.map((l) => (
                <button
                  key={l.id}
                  className={l.id === selectedId ? "layoutRow layoutRowActive" : "layoutRow"}
                  onClick={() => setSelectedId(l.id)}
                >
                  <div className="layoutRowTop">
                    <div className="layoutName" title={l.name}>
                      {l.name}
                    </div>
                    <div className="layoutMeta">{new Date(l.updatedAt).toLocaleString()}</div>
                  </div>

                  <div className="layoutRowChips">
                    <span className="chip">Panel 1</span>
                    <span className="chip">Panel 2</span>
                    <span className="chip">Panel 3</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="panel">
          <div className="panelTitle">Preview</div>

          {!selected ? (
            <div className="emptyBox">
              <div className="emptyTitle">Select a layout</div>
              <div className="emptyText">Choose one on the left to preview and edit.</div>
            </div>
          ) : (
            <>
              <LayoutPreview layout={selected} media={mediaLibrary} />

              <div className="rowActions">
                <button className="btnPrimary" onClick={() => {onUseLayout(selected); setActiveLayout(selected);}}>
                  USE THIS LAYOUT
                </button>
                <button className="btnGhost" onClick={() => openEdit(selected)}>
                  EDIT
                </button>
                <button className="btnDanger" onClick={() => removeLayout(selected.id)}>
                  DELETE
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {showEditor && draft && (
        <div className="modalOverlay" onClick={closeEditor}>
          <div className="modalCard editorModal" onClick={(e) => e.stopPropagation()}>
            <div className="modalTitle">Layout Editor</div>

            <label className="field">
              <div className="label">
                Layout name{" "}
                <span style={{ color: "#e53e3e", fontSize: 12 }}>* required, must be unique</span>
              </div>
              <input
                className="input"
                value={draft.name}
                onChange={(e) => {
                  setNameTouched(true);
                  setDraft({ ...draft, name: e.target.value });
                }}
                onBlur={() => setNameTouched(true)}
                style={
                  nameError
                    ? { borderColor: "#e53e3e", outline: "none", boxShadow: "0 0 0 2px rgba(229,62,62,0.2)" }
                    : undefined
                }
                placeholder='Untitled Layout'
              />
              {nameError && (
                <div style={{ color: "#e53e3e", fontSize: 12, marginTop: 4 }}>
                  ⚠ {nameError}
                </div>
              )}
            </label>

            <div className="editorHint">
              Top bar and ticker are shown as in the real stage. Edit the content area (drag slots, resize frames, assign media).
            </div>

            <div className="editorFrameWithSidebar">
              {/* Left sidebar: slot controls only (media library removed as requested) */}
              <aside className="editorSidebar">
  <div className="sidebarSection">
    <div className="sidebarTitle">Panels</div>

    {/* Slot count control */}
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 8,
      marginBottom: 12,
      padding: "6px 8px",
      background: "#f5f5f5",
      borderRadius: 6,
    }}>
      <button
        className="btnGhost"
        style={{ padding: "2px 10px", fontSize: 18, lineHeight: 1 }}
        disabled={(draft.slotOrder ?? ["hero"]).length <= 1}
        onClick={removeSlot}
        title="Remove last panel"
      >
        −
      </button>

      <div style={{ flex: 1, textAlign: "center", fontSize: 13 }}>
        <span style={{ fontWeight: 700, fontSize: 16 }}>
          {(draft.slotOrder ?? ["hero"]).length}
        </span>
        <span style={{ color: "#888" }}> / 3 panels</span>
      </div>

      <button
        className="btnGhost"
        style={{ padding: "2px 10px", fontSize: 18, lineHeight: 1 }}
        disabled={(draft.slotOrder ?? ["hero"]).length >= 3}
        onClick={addSlot}
        title="Add a panel"
      >
        ＋
      </button>
    </div>

    {/* Existing slot list — unchanged */}
    {(draft.slotOrder || ["hero", "rightTop", "rightBottom"]).map((slotId) => (
      <div id={`slot-editor-${slotId}`} key={slotId} className="slotEditorCompact">
        <div className="slotEditorHeader">{SLOT_META[slotId].title}</div>
        <div className="slotEditorBody">
          <div className="slotLabel">{labelFor(draft.slots[slotId], mediaLibrary)}</div>
          <div className="slotActions">
            <button
              className="btnGhost"
              onClick={() =>
                setDraft({ ...draft, slots: { ...draft.slots, [slotId]: { kind: "empty" } } })
              }
            >
              Clear
            </button>
            <button
              className="btnGhost"
              onClick={() => {
                const el = document.querySelector(`.canvasSlot[data-slot="${slotId}"]`);
                if (el) (el as HTMLElement).scrollIntoView({ behavior: "smooth", block: "center" });
              }}
            >
              Focus
            </button>
          </div>
        </div>
      </div>
    ))}
  </div>
</aside>

              {/* Editor main area: TopBar (fixed), Canvas (droppable, scrollable), Ticker (fixed) */}
              <div className="editorMain">
                <div className="editorTopbarWrap">
                  <TopBar />
                </div>

                <div
                  className="editorCanvasArea"
                  role="region"
                  aria-label="Layout canvas"
                  ref={canvasRef}
                  onPointerMove={onPointerMoveCanvas}
                  onPointerUp={endPointer}
                  onPointerCancel={endPointer}
                  onDragOver={(e) => e.preventDefault()}
                >
                  {(() => {
                    const { slotOrder, slotFrames } = ensureFrames(draft);
                    return slotOrder.map((slotId) => {
                      const content = draft.slots[slotId];
                      const frame = slotFrames[slotId];

                      return (
                        <div
                          key={slotId}
                          data-slot={slotId}
                          className={slotId === activeSlot ? "canvasFrame canvasFrameActive" : "canvasFrame"}
                          style={{
                            left: `${frame.x}%`,
                            top: `${frame.y}%`,
                            width: `${frame.w}%`,
                            height: `${frame.h}%`,
                          }}
                          onClick={() => setActiveSlot(slotId)}
                          onDoubleClick={() => {
                            const el = document.getElementById(`slot-editor-${slotId}`);
                            if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            const from = (e.dataTransfer.getData("text/slot") as SlotId) || null;
                            if (!from || from === slotId) return;
                            swapSlotContents(from, slotId);
                            setDragFrom(null);
                          }}
                        >
                          <div className="frameTitleBar" onPointerDown={(e) => beginMove(slotId, e)}>
                            <div className="frameTitle">
                              {SLOT_META[slotId].title}
                              <span className="frameHint">drag to move</span>
                            </div>

                            <div className="frameActions" 
                            //onPointerDown={(e) => e.stopPropagation()}
                            >
                              <button
                                className="frameBtn"
                                title="Swap contents: drag this onto another frame"
                                draggable
                                onDragStart={(e) => {
                                  setDragFrom(slotId);
                                  e.dataTransfer.setData("text/slot", slotId);
                                  e.dataTransfer.effectAllowed = "move";
                                }}
                                onDragEnd={() => setDragFrom(null)}
                              >
                                ⇄
                              </button>

                              <button
                                className="frameBtn"
                                title="Choose media"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPickerSlot(slotId);
                                }}
                              >
                                ＋
                              </button>

                              <button
                                className="frameBtn"
                                title="Clear"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  clearSlot(slotId);
                                }}
                              >
                                ✕
                              </button>
                            </div>
                          </div>

                          <div className="frameBody">
                            {content.kind === "media" ? (
                              <img
                                src={getMedia(mediaLibrary, (content as any).mediaId)?.src}
                                alt={getMedia(mediaLibrary, (content as any).mediaId)?.title ?? ""}
                                className="frameMedia"
                              />
                            ) : (
                              <div className="canvasEmpty">Empty — click ＋ to choose media</div>
                            )}
                          </div>

                          {/* Resize handles: corners + sides */}
                          <div className="frameHandle frameHandle--n" onPointerDown={(e) => beginResize(slotId, "n", e)} />
                          <div className="frameHandle frameHandle--s" onPointerDown={(e) => beginResize(slotId, "s", e)} />
                          <div className="frameHandle frameHandle--e" onPointerDown={(e) => beginResize(slotId, "e", e)} />
                          <div className="frameHandle frameHandle--w" onPointerDown={(e) => beginResize(slotId, "w", e)} />

                          <div className="frameHandle frameHandle--nw" onPointerDown={(e) => beginResize(slotId, "nw", e)} />
                          <div className="frameHandle frameHandle--ne" onPointerDown={(e) => beginResize(slotId, "ne", e)} />
                          <div className="frameHandle frameHandle--sw" onPointerDown={(e) => beginResize(slotId, "sw", e)} />
                          <div className="frameHandle frameHandle--se" onPointerDown={(e) => beginResize(slotId, "se", e)} />
                        </div>
                      );
                    });
                  })()}
                  {/* Inline picker modal (uses uploaded Content list) */}
                  {pickerSlot && (
                    <div
                      className="inlinePickerOverlay"
                      role="dialog"
                      aria-label="Choose media"
                      onClick={() => setPickerSlot(null)}
                      style={{
                        position: "fixed",
                        inset: 0,
                        background: "rgba(0,0,0,0.35)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 12000,
                      }}
                    >
                      <div
                        className="inlinePickerCard"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          width: "80%",
                          maxWidth: 900,
                          maxHeight: "70vh",
                          background: "#fff",
                          borderRadius: 8,
                          padding: 12,
                          overflow: "auto",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                          <div style={{ fontWeight: 700 }}>Choose media for {pickerSlot}</div>
                          <div>
                            <input
                              placeholder="Search media..."
                              value={mediaSearch}
                              onChange={(e) => setMediaSearch(e.target.value)}
                              style={{ marginRight: 8 }}
                            />
                            <button className="btnGhost" onClick={() => setPickerSlot(null)}>Close</button>
                          </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))", gap: 12 }}>
                          {filteredMedia.map((m) => (
                            <div key={m.id} className="pickerItem" style={{ border: "1px solid #eee", borderRadius: 6, padding: 8, cursor: "pointer" }}
                              onClick={() => {
                                setDraft({ ...draft!, slots: { ...draft!.slots, [pickerSlot]: { kind: "media", mediaId: m.id } } });
                                setPickerSlot(null);
                              }}
                            >
                              {m.type === "image" ? (
                                <img src={m.src} alt={m.title} style={{ width: "100%", height: 90, objectFit: "cover", borderRadius: 4 }} />
                              ) : (
                                <div style={{ width: "100%", height: 90, display: "flex", alignItems: "center", justifyContent: "center", background: "#fafafa", borderRadius: 4 }}>
                                  {m.type}
                                </div>
                              )}
                              <div style={{ marginTop: 8, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.title}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="editorTickerWrap">
                  <Ticker />
                </div>
              </div>
            </div>

            <div className="modalActions" style={{ marginTop: 12 }}>
              <button className="btnGhost" onClick={closeEditor}>
                Cancel
              </button>
              <button
                className="btnPrimary"
                onClick={saveDraft}
              >
                Save Layout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function LayoutPreview({ layout, media }: { layout: Layout; media: MediaItem[] }) {
  const slotOrder: SlotId[] = layout.slotOrder?.length
    ? layout.slotOrder
    : ["hero", "rightTop", "rightBottom"];

  const slotFrames: Record<SlotId, { x: number; y: number; w: number; h: number }> =
    layout.slotFrames ?? {
      hero: { x: 0, y: 0, w: 66.5, h: 100 },
      rightTop: { x: 66.5, y: 0, w: 33.5, h: 50 },
      rightBottom: { x: 66.5, y: 50, w: 33.5, h: 50 },
    };

  return (
    <div className="previewGrid" style={{ position: "relative", width: "100%", aspectRatio: "16/9" }}>
      {slotOrder.map((slotId) => {
        const frame = slotFrames[slotId];
        const content = layout.slots[slotId];
        return (
          <div
            key={slotId}
            style={{
              position: "absolute",
              left: `${frame.x}%`,
              top: `${frame.y}%`,
              width: `${frame.w}%`,
              height: `${frame.h}%`,
              boxSizing: "border-box",
              border: "1px solid #ddd",
              overflow: "hidden",
            }}
          >
            <div className="pCardTop" style={{ padding: "4px 6px" }}>
              <div className="pCardTitle">{SLOT_META[slotId].title}</div>
              <div className="pCardLabel">{labelFor(content, media)}</div>
            </div>
            <div className="pCardBody" style={{ height: "calc(100% - 28px)" }}>
              <MiniPreview content={content} media={media} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PreviewCard({
  title,
  content,
  media,
  big,
}: {
  title: string;
  content: SlotContent;
  media: MediaItem[];
  big?: boolean;
}) {
  return (
    <div className={big ? "pCard pCardBig" : "pCard"}>
      <div className="pCardTop">
        <div className="pCardTitle">{title}</div>
        <div className="pCardLabel">{labelFor(content, media)}</div>
      </div>

      <div className="pCardBody">
        <MiniPreview content={content} media={media} />
      </div>
    </div>
  );
}

function MiniPreview({ content, media }: { content: SlotContent; media: MediaItem[] }) {
  if (content.kind === "empty") return <div className="thumbPlaceholder">Empty</div>;
  if (content.kind === "widget") return <div className="thumbPlaceholder">Widget: {content.widget}</div>;

  const m = getMedia(media, content.mediaId);
  if (!m) return <div className="thumbPlaceholder">Missing media</div>;

  if (m.type === "image") return <img className="thumbImg" src={m.src} alt={m.title} />;
  if (m.type === "video") return <video className="thumbImg" src={m.src} muted playsInline />;

  return <div className="thumbPlaceholder">{m.type.toUpperCase()}: {m.title}</div>;
}


export default Layouts;
