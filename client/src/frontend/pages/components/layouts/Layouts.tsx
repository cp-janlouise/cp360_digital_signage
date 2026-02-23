import React, { useEffect, useMemo, useRef, useState } from "react";

export type LayoutItem = {
  id: string;
  title: string;
  thumbnailSrc?: string; // blob URL preview
  file?: File; // optional for later upload
  createdAt: string;
};

type Props = {
  initialItems?: LayoutItem[];
  onNavigate?: (view: "dashboard" | "accounts") => void;
};

function makeId() {
  return `l_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

const Layouts: React.FC<Props> = ({ initialItems, onNavigate }) => {
  const [layoutItems, setLayoutItems] = useState<LayoutItem[]>(initialItems ?? []);
  const [search, setSearch] = useState("");

  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const visibleItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return layoutItems;

    return layoutItems.filter((l) => l.title.toLowerCase().includes(q));
  }, [layoutItems, search]);

  const resetAddForm = () => {
    setNewTitle("");
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  useEffect(() => {
    if (!showAdd) resetAddForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAdd]);

  const openFileExplorer = () => fileInputRef.current?.click();

  const handlePickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;

    setSelectedFile(file);

    if (!newTitle.trim()) {
      setNewTitle(file.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const addItem = () => {
    const title = newTitle.trim();
    if (!title) return alert("Please enter a title.");

    let thumbUrl: string | undefined = undefined;
    if (selectedFile) {
      if (!selectedFile.type.startsWith("image/")) {
        return alert("Thumbnail must be an image file (png/jpg/webp/etc.).");
      }
      thumbUrl = URL.createObjectURL(selectedFile);
    }

    setLayoutItems((prev) => [
      {
        id: makeId(),
        title,
        thumbnailSrc: thumbUrl,
        file: selectedFile ?? undefined,
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);

    setShowAdd(false);
  };

  const removeItem = (id: string) => {
    setLayoutItems((prev) => {
      const target = prev.find((l) => l.id === id);
      if (target?.thumbnailSrc?.startsWith("blob:")) {
        URL.revokeObjectURL(target.thumbnailSrc);
      }
      return prev.filter((l) => l.id !== id);
    });
  };

  return (
    <div className="layouts">
      <div className="topRow">
        {onNavigate && (
          <button className="homeButton" onClick={() => onNavigate("dashboard")}>
            Home
          </button>
        )}
        <h1 className="layoutsPageTitle">Layouts</h1>

        <div className="layoutsActions">
          <input
            className="layoutsSearch"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search layout title..."
          />
          <button className="btnPrimary" onClick={() => setShowAdd(true)}>
            + Add Layout
          </button>
        </div>
      </div>

      <div className="layoutsTop">
        <div className="layoutsTitleWrap">
          <h1 className="layoutsTitle">All Layouts</h1>
          <div className="layoutsSubtitle">Total saved layouts: {layoutItems.length}</div>
        </div>

        
      </div>

      <div className="layoutsTabs">
        <TabButton active onClick={() => undefined}>
          All ({layoutItems.length})
        </TabButton>
      </div>

      <div className="layoutsBody">
        {visibleItems.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="layoutGrid">
            {visibleItems.map((item) => (
              <LayoutCard key={item.id} item={item} onRemove={() => removeItem(item.id)} />
            ))}
          </div>
        )}
      </div>

      {showAdd && (
        <div className="modalOverlay" onClick={() => setShowAdd(false)}>
          <div className="modalCard" onClick={(e) => e.stopPropagation()}>
            <h2 className="modalTitle">Add Layout</h2>

            <div className="formGrid">
              <label className="formLabel">
                <span className="labelText">Title</span>
                <input
                  className="input"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Lobby Screen"
                />
              </label>

              <input
                ref={fileInputRef}
                type="file"
                className="hiddenFile"
                accept="image/*"
                onChange={handlePickFile}
              />

              <div className="fileRow">
                <span className="labelText">Thumbnail (optional)</span>

                <div className="filePicker">
                  <button type="button" className="btnPrimary" onClick={openFileExplorer}>
                    Choose File
                  </button>

                  <div className="fileName">
                    {selectedFile ? selectedFile.name : "No file selected"}
                  </div>
                </div>

                {selectedFile && (
                  <div className="fileMeta">
                    {Math.round(selectedFile.size / 1024)} KB •{" "}
                    {selectedFile.type || "unknown type"}
                  </div>
                )}
              </div>
            </div>

            <div className="modalActions">
              <button className="btnGhost" onClick={() => setShowAdd(false)}>
                Cancel
              </button>
              <button className="btnPrimary" onClick={addItem}>
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button className={active ? "tabBtn tabBtnActive" : "tabBtn"} onClick={onClick}>
      {children}
    </button>
  );
}

function EmptyState() {
  return (
    <div className="emptyState">
      <h2 className="emptyTitle">No results</h2>
      <p className="emptyText">No layouts have been added yet.</p>
    </div>
  );
}

function LayoutCard({
  item,
  onRemove,
}: {
  item: LayoutItem;
  onRemove: () => void;
}) {
  return (
    <div className="layoutCard">
      <div className="layoutCardTop">
        <div className="layoutCardTitle" title={item.title}>
          {item.title}
        </div>

        <button className="btnIcon" onClick={onRemove} title="Remove">
          ✕
        </button>
      </div>

      <div className="layoutMeta">Created: {new Date(item.createdAt).toLocaleString()}</div>

      <div className="layoutPreviewWrap">
        {item.thumbnailSrc ? (
          <img className="layoutImgPreview" src={item.thumbnailSrc} alt={item.title} />
        ) : (
          <div className="layoutPlaceholder">No thumbnail</div>
        )}
      </div>
    </div>
  );
}

export default Layouts;