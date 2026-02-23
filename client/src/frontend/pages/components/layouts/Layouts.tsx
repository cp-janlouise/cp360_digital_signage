import React, { useEffect, useMemo, useState } from "react";
import "/src/frontend/styles/layouts.css";
import TopBar from "./TopBar";
import Ticker from "./Ticker";

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

export type SlotContent =
  | { kind: "empty" }
  | { kind: "media"; mediaId: string }
  | { kind: "widget"; widget: WidgetKey };

export type Layout = {
  id: string;
  name: string;
  slots: Record<SlotId, SlotContent>;
  // Optional editor metadata: the visual order of slots and per-slot sizes (percentages)
  slotOrder?: SlotId[];
  slotSizes?: Record<SlotId, { width: number; height: number }>;
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
    name: "Untitled Layout",
    slots: {
      hero: { kind: "empty" },
      rightTop: { kind: "empty" },
      rightBottom: { kind: "widget", widget: "scorecard" },
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
  hero: { title: "Hero", subtitle: "Big left" },
  rightTop: { title: "Right Top", subtitle: "Top right" },
  rightBottom: { title: "Right Bottom", subtitle: "Bottom right" },
};

const Layouts: React.FC<Props> = ({ mediaLibrary, onUseLayout, onNavigateHome }) => {
  const [layouts, setLayouts] = useState<Layout[]>([]);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [showEditor, setShowEditor] = useState(false);
  const [draft, setDraft] = useState<Layout | null>(null);

  // Editor state
  const [activeSlot, setActiveSlot] = useState<SlotId>("hero");
  const [dragFrom, setDragFrom] = useState<SlotId | null>(null);

  // Media picker state
  const [mediaTab, setMediaTab] = useState<"all" | MediaType>("all");
  const [mediaSearch, setMediaSearch] = useState("");
  const [pickerSlot, setPickerSlot] = useState<SlotId | null>(null);

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
    setShowEditor(true);
  };

  const openEdit = (layout: Layout) => {
    // Deep copy to avoid mutating saved layout while editing
    const copy = JSON.parse(JSON.stringify(layout)) as Layout;
    setDraft(copy);
    setActiveSlot("hero");
    setMediaTab("all");
    setMediaSearch("");
    setShowEditor(true);
  };

  const closeEditor = () => {
    setShowEditor(false);
    setDraft(null);
    setDragFrom(null);
  };

  const saveDraft = () => {
    if (!draft) return;
    const name = draft.name.trim();
    if (!name) return alert("Please enter a layout name.");

    const updated: Layout = { ...draft, name, updatedAt: nowISO() };

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

  const quickSwapHeroRight = () => {
    // If you want hero content to appear on the right, swap hero with rightTop.
    // You can also swap with rightBottom. Up to you.
    swapSlotContents("hero", "rightTop");
    setActiveSlot("rightTop");
  };

  const clearSlot = (slot: SlotId) => updateSlot(slot, { kind: "empty" });

  const activeContent = draft?.slots[activeSlot] ?? { kind: "empty" as const };

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
              Tip: drag a slot onto another to swap what they display. Your Hero can “teleport” right. ✨
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
                    <span className="chip">Hero</span>
                    <span className="chip">Right Top</span>
                    <span className="chip">Right Bottom</span>
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
                <button className="btnPrimary" onClick={() => onUseLayout(selected)}>
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
              <div className="label">Layout name</div>
              <input
                className="input"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
            </label>

            <div className="editorHint">
              Top bar and ticker are shown as in the real stage. Edit the content area (drag slots, resize frames, assign media).
            </div>

            <div className="editorFrameWithSidebar">
              {/* Left sidebar: slot controls only (media library removed as requested) */}
              <aside className="editorSidebar">
                <div className="sidebarSection">
                  <div className="sidebarTitle">Slots</div>
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
                  onDragOver={(e) => e.preventDefault()}
                >
                  {(draft.slotOrder || ["hero", "rightTop", "rightBottom"]).map((slotId) => {
                    const content = draft.slots[slotId];
                    return (
                      <div
                        key={slotId}
                        data-slot={slotId}
                        className="canvasSlot"
                        onClick={() => setPickerSlot(slotId)} // open file picker for this slot
                        onDoubleClick={() => {
                          const el = document.getElementById(`slot-editor-${slotId}`);
                          if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
                        }}
                      >
                        <div className="canvasSlotHeader">{SLOT_META[slotId].title}</div>
                        <div className="canvasSlotBody">
                          {content.kind === "media" ? (
                            <img
                              src={getMedia(mediaLibrary, (content as any).mediaId)?.src}
                              alt={getMedia(mediaLibrary, (content as any).mediaId)?.title ?? ""}
                              style={{ maxWidth: "100%", maxHeight: "100%" }}
                            />
                          ) : (
                            <div className="canvasEmpty">Empty slot — click to choose media</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
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
                onClick={() => {
                  saveDraft();
                }}
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
  return (
    <div className="previewGrid">
      <PreviewCard title="Hero" content={layout.slots.hero} media={media} big />
      <PreviewCard title="Right Top" content={layout.slots.rightTop} media={media} />
      <PreviewCard title="Right Bottom" content={layout.slots.rightBottom} media={media} />
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

function MediaThumb({ media }: { media: MediaItem }) {
  if (media.type === "image") return <img className="mediaThumb" src={media.src} alt={media.title} />;
  if (media.type === "video") return <video className="mediaThumb" src={media.src} muted playsInline />;
  return (
    <div className="mediaThumbText">
      <div className="mediaThumbType">{media.type.toUpperCase()}</div>
    </div>
  );
}

export default Layouts;