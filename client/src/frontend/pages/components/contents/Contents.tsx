import React, { useEffect, useMemo, useRef, useState } from "react";

export type MediaType = "image" | "video" | "website" | "music";
export type ContentTab = "all" | MediaType;

export type MediaItem = {
  id: string;
  type: MediaType;
  title: string;
  src: string; // website URL or blob URL for file-based media
  file?: File; // optional for later upload
  createdAt: string;
};

type Props = {
  initialTab?: ContentTab;
  initialItems?: MediaItem[];
  onNavigate?: (view: "dashboard" | "accounts") => void;
};

function makeId() {
  return `m_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function isValidUrl(url: string) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function prettyType(t: MediaType) {
  if (t === "website") return "Website URL";
  return t.charAt(0).toUpperCase() + t.slice(1);
}

const DEFAULT_ITEMS: MediaItem[] = [
  {
    id: "demo_website",
    type: "website",
    title: "Example Website",
    src: "https://example.com",
    createdAt: new Date().toISOString(),
  },
];

const Contents: React.FC<Props> = ({ initialTab = "all", initialItems, onNavigate }) => {

  const [mediaItems, setMediaItems] = useState<MediaItem[]>(
    initialItems ?? DEFAULT_ITEMS
  );
  const [activeTab, setActiveTab] = useState<ContentTab>(initialTab);
  const [search, setSearch] = useState("");

  const [showAdd, setShowAdd] = useState(false);
  const [newType, setNewType] = useState<MediaType>("image");
  const [newTitle, setNewTitle] = useState("");
  const [newSrc, setNewSrc] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const visibleItems = useMemo(() => {
    const byTab =
      activeTab === "all"
        ? mediaItems
        : mediaItems.filter((m) => m.type === activeTab);

    const q = search.trim().toLowerCase();
    if (!q) return byTab;

    return byTab.filter((m) => {
      return (
        m.title.toLowerCase().includes(q) ||
        m.src.toLowerCase().includes(q) ||
        m.type.toLowerCase().includes(q)
      );
    });
  }, [activeTab, mediaItems, search]);

  const counts = useMemo(() => {
    const base: Record<ContentTab, number> = {
      all: mediaItems.length,
      image: 0,
      video: 0,
      website: 0,
      music: 0,
    };
    for (const m of mediaItems) base[m.type] += 1;
    return base;
  }, [mediaItems]);

  const resetAddForm = () => {
    setNewType("image");
    setNewTitle("");
    setNewSrc("");
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

    if (file.type.startsWith("image/")) setNewType("image");
    else if (file.type.startsWith("video/")) setNewType("video");
    else if (file.type.startsWith("audio/")) setNewType("music");
  };

  const addItem = () => {
    const title = newTitle.trim();
    if (!title) return alert("Please enter a title.");

    if (newType === "website") {
      const url = newSrc.trim();
      if (!url) return alert("Please enter a website URL.");
      if (!isValidUrl(url)) return alert("Please enter a valid URL (https://...)");

      setMediaItems((prev) => [
        {
          id: makeId(),
          type: "website",
          title,
          src: url,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);

      setShowAdd(false);
      return;
    }

    if (!selectedFile) return alert("Please choose a file.");

    const isImage = selectedFile.type.startsWith("image/");
    const isVideo = selectedFile.type.startsWith("video/");
    const isAudio = selectedFile.type.startsWith("audio/");

    if (newType === "image" && !isImage) return alert("Selected file is not an image.");
    if (newType === "video" && !isVideo) return alert("Selected file is not a video.");
    if (newType === "music" && !isAudio) return alert("Selected file is not an audio.");

    const previewUrl = URL.createObjectURL(selectedFile);

    setMediaItems((prev) => [
      {
        id: makeId(),
        type: newType,
        title,
        src: previewUrl,
        file: selectedFile,
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);

    setShowAdd(false);
  };

  const removeItem = (id: string) => {
    setMediaItems((prev) => {
      const target = prev.find((m) => m.id === id);
      if (target?.file && target.src.startsWith("blob:")) {
        URL.revokeObjectURL(target.src);
      }
      return prev.filter((m) => m.id !== id);
    });
  };

  const tabLabel = activeTab === "all" ? "All Media" : prettyType(activeTab);

  return (
    <div className="contents">
      <div className="topRow">
        {onNavigate && (
          <button className="homeButton" onClick={() => onNavigate("dashboard")}>
            Home
          </button>
        )}
        <h1 className="accountsPageTitle">Contents</h1>
      </div>
        <div className="contentsTop">
    
        <div className="contentsTitleWrap">
          <h1 className="contentsTitle">{tabLabel}</h1>
          <div className="contentsSubtitle">
            Total stored in All Media: {counts.all}
          </div>
        </div>

        <div className="contentsActions">
          <input
            className="contentsSearch"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title, url, type..."
          />
          <button className="btnPrimary" onClick={() => setShowAdd(true)}>
            + Add Media
          </button>
        </div>
      </div>

      <div className="contentsTabs">
        <TabButton active={activeTab === "all"} onClick={() => setActiveTab("all")}>
          All Media ({counts.all})
        </TabButton>
        <TabButton active={activeTab === "image"} onClick={() => setActiveTab("image")}>
          Images ({counts.image})
        </TabButton>
        <TabButton active={activeTab === "video"} onClick={() => setActiveTab("video")}>
          Videos ({counts.video})
        </TabButton>
        <TabButton
          active={activeTab === "website"}
          onClick={() => setActiveTab("website")}
        >
          Website URL ({counts.website})
        </TabButton>
        <TabButton active={activeTab === "music"} onClick={() => setActiveTab("music")}>
          Music ({counts.music})
        </TabButton>
      </div>

      <div className="contentsBody">
        {visibleItems.length === 0 ? (
          <EmptyState activeTab={activeTab} />
        ) : (
          <div className="mediaGrid">
            {visibleItems.map((item) => (
              <MediaCard key={item.id} item={item} onRemove={() => removeItem(item.id)} />
            ))}
          </div>
        )}
      </div>

      {showAdd && (
        <div className="modalOverlay" onClick={() => setShowAdd(false)}>
          <div className="modalCard" onClick={(e) => e.stopPropagation()}>
            <h2 className="modalTitle">Add Media</h2>

            <div className="formGrid">
              <label className="formLabel">
                <span className="labelText">Type</span>
                <select
                  className="select"
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as MediaType)}
                >
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                  <option value="website">Website URL</option>
                  <option value="music">Music</option>
                </select>
              </label>

              <label className="formLabel">
                <span className="labelText">Title</span>
                <input
                  className="input"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. February Promo"
                />
              </label>

              <input
                ref={fileInputRef}
                type="file"
                className="hiddenFile"
                accept={
                  newType === "image"
                    ? "image/*"
                    : newType === "video"
                    ? "video/*"
                    : newType === "music"
                    ? "audio/*"
                    : ""
                }
                onChange={handlePickFile}
              />

              {newType === "website" ? (
                <label className="formLabel">
                  <span className="labelText">Website URL</span>
                  <input
                    className="input"
                    value={newSrc}
                    onChange={(e) => setNewSrc(e.target.value)}
                    placeholder="https://example.com"
                  />
                </label>
              ) : (
                <div className="fileRow">
                  <span className="labelText">File</span>

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
              )}
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

function EmptyState({ activeTab }: { activeTab: ContentTab }) {
  return (
    <div className="emptyState">
      <h2 className="emptyTitle">No results</h2>
      <p className="emptyText">
        {activeTab === "all"
          ? "No media has been added yet."
          : `No ${activeTab} items found in All Media.`}
      </p>
    </div>
  );
}

function MediaCard({
  item,
  onRemove,
}: {
  item: MediaItem;
  onRemove: () => void;
}) {
  return (
    <div className="mediaCard">
      <div className="mediaCardTop">
        <div className="mediaCardTitle" title={item.title}>
          {item.title}
        </div>

        <button className="btnIcon" onClick={onRemove} title="Remove">
          ✕
        </button>
      </div>

      <div className="mediaType">{prettyType(item.type)}</div>

      <div className="mediaPreviewWrap">
        {item.type === "image" && <img className="imgPreview" src={item.src} alt={item.title} />}

        {item.type === "video" && <video className="vidPreview" src={item.src} controls />}

        {item.type === "music" && <audio className="audioPreview" src={item.src} controls />}

        {item.type === "website" && (
          <a className="linkPreview" href={item.src} target="_blank" rel="noreferrer">
            {item.src}
          </a>
        )}
      </div>
    </div>
  );
}

export default Contents;
