import React, { useEffect, useMemo, useState } from "react";
import "/src/frontend/styles/layouts.css";

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
  localStorage.setItem(LS_KEY, JSON.stringify(layouts));
}

const Layouts: React.FC<Props> = ({ mediaLibrary, onUseLayout, onNavigateHome }) => {
  const [layouts, setLayouts] = useState<Layout[]>([]);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [showEditor, setShowEditor] = useState(false);
  const [draft, setDraft] = useState<Layout | null>(null);

  useEffect(() => {
    setLayouts(loadLayouts());
  }, []);

  useEffect(() => {
    saveLayouts(layouts);
  }, [layouts]);

  const filtered = useMemo(() => {
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
    setShowEditor(true);
  };

  const openEdit = (layout: Layout) => {
    setDraft(JSON.parse(JSON.stringify(layout)));
    setShowEditor(true);
  };

  const closeEditor = () => {
    setShowEditor(false);
    setDraft(null);
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
              Layouts only replace the middle cards (top bar + ticker are constant).
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
          <button className="addLayout" onClick={openCreate}>
            + ADD A LAYOUT
          </button>
        </div>
      </div>

      <div className="layoutsGrid2">
        <div className="panel">
          <div className="panelTitle">Saved Layouts ({layouts.length})</div>

          {filtered.length === 0 ? (
            <div className="emptyBox">
              <div className="emptyTitle">No layouts</div>
              <div className="emptyText">Create one and assign what each card displays.</div>
            </div>
          ) : (
            <div className="layoutList">
              {filtered.map((l) => (
                <button
                  key={l.id}
                  className={l.id === selectedId ? "layoutRow layoutRowActive" : "layoutRow"}
                  onClick={() => setSelectedId(l.id)}
                >
                  <div className="layoutRowTop">
                    <div className="layoutName" title={l.name}>
                      {l.name}
                    </div>
                    <div className="layoutMeta">
                      {new Date(l.updatedAt).toLocaleString()}
                    </div>
                  </div>

                  <div className="layoutRowActions">
                    <span className="pill">Hero</span>
                    <span className="pill">RightTop</span>
                    <span className="pill">RightBottom</span>
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
          <div className="modalCard" onClick={(e) => e.stopPropagation()}>
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
              Pick what each card slot should display (media or widget).
            </div>

            <div className="slotEditorGrid">
              <SlotEditor
                slotId="hero"
                title="Hero (Big Left)"
                value={draft.slots.hero}
                media={mediaLibrary}
                onChange={(next) =>
                  setDraft({ ...draft, slots: { ...draft.slots, hero: next } })
                }
              />

              <SlotEditor
                slotId="rightTop"
                title="Right Top"
                value={draft.slots.rightTop}
                media={mediaLibrary}
                onChange={(next) =>
                  setDraft({ ...draft, slots: { ...draft.slots, rightTop: next } })
                }
              />

              <SlotEditor
                slotId="rightBottom"
                title="Right Bottom"
                value={draft.slots.rightBottom}
                media={mediaLibrary}
                onChange={(next) =>
                  setDraft({ ...draft, slots: { ...draft.slots, rightBottom: next } })
                }
                allowScorecard
              />
            </div>

            <div className="modalActions">
              <button className="btnGhost" onClick={closeEditor}>
                Cancel
              </button>
              <button className="btnPrimary" onClick={saveDraft}>
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
  const label = renderLabel(content, media);

  return (
    <div className={big ? "pCard pCardBig" : "pCard"}>
      <div className="pCardTop">
        <div className="pCardTitle">{title}</div>
        <div className="pCardLabel">{label}</div>
      </div>

      <div className="pCardBody">
        {content.kind === "media" ? (
          <Thumb mediaId={content.mediaId} media={media} />
        ) : content.kind === "widget" ? (
          <div className="thumbPlaceholder">Widget: {content.widget}</div>
        ) : (
          <div className="thumbPlaceholder">Empty</div>
        )}
      </div>
    </div>
  );
}

function Thumb({ mediaId, media }: { mediaId: string; media: MediaItem[] }) {
  const m = media.find((x) => x.id === mediaId);
  if (!m) return <div className="thumbPlaceholder">Missing media</div>;

  if (m.type === "image") return <img className="thumbImg" src={m.src} alt={m.title} />;
  if (m.type === "video") return <video className="thumbImg" src={m.src} muted playsInline />;

  return <div className="thumbPlaceholder">{m.type.toUpperCase()}: {m.title}</div>;
}

function SlotEditor({
  slotId,
  title,
  value,
  media,
  onChange,
  allowScorecard,
}: {
  slotId: SlotId;
  title: string;
  value: SlotContent;
  media: MediaItem[];
  onChange: (next: SlotContent) => void;
  allowScorecard?: boolean;
}) {
  return (
    <div className="slotBox">
      <div className="slotTop">
        <div>
          <div className="slotTitle">{title}</div>
          <div className="slotSub">{slotId}</div>
        </div>
        <div className="slotValue">{renderLabel(value, media)}</div>
      </div>

      <div className="slotControls">
        <button className="btnMini" onClick={() => onChange({ kind: "empty" })}>
          Clear
        </button>

        <select
          className="select"
          value={
            value.kind === "media"
              ? `media:${value.mediaId}`
              : value.kind === "widget"
              ? `widget:${value.widget}`
              : "empty"
          }
          onChange={(e) => {
            const v = e.target.value;

            if (v === "empty") return onChange({ kind: "empty" });

            if (v.startsWith("media:")) {
              return onChange({ kind: "media", mediaId: v.replace("media:", "") });
            }

            if (v.startsWith("widget:")) {
              return onChange({
                kind: "widget",
                widget: v.replace("widget:", "") as WidgetKey,
              });
            }
          }}
        >
          <option value="empty">Empty</option>

          <optgroup label="Media">
            {media.map((m) => (
              <option key={m.id} value={`media:${m.id}`}>
                {m.title} ({m.type})
              </option>
            ))}
          </optgroup>

          <optgroup label="Widgets">
            {allowScorecard && <option value="widget:scorecard">Scorecard</option>}
            <option value="widget:placeholder">Placeholder</option>
          </optgroup>
        </select>
      </div>
    </div>
  );
}

function renderLabel(content: SlotContent, media: MediaItem[]) {
  if (content.kind === "empty") return "Empty";
  if (content.kind === "widget") return `Widget: ${content.widget}`;
  const m = media.find((x) => x.id === content.mediaId);
  return m ? `Media: ${m.title}` : "Media: (missing)";
}

export default Layouts;