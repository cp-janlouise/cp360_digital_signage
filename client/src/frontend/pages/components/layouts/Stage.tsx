import React from "react";
import "/src/frontend/styles/stage.css";
import type { Layout, MediaItem, SlotContent } from "./Layouts";

function ScorecardWidget() {
  return (
    <div className="cardInner center">
      <div className="bigTitle">SCORECARD</div>
      <div className="fakeChart" />
      <div className="fakeLines" />
    </div>
  );
}

function PlaceholderWidget() {
  return (
    <div className="cardInner center">
      <div className="bigTitle">WIDGET</div>
      <div className="muted">Placeholder</div>
    </div>
  );
}

function renderSlot(content: SlotContent, media: MediaItem[]) {
  if (content.kind === "empty") {
    return (
      <div className="cardInner center">
        <div className="muted">Empty slot</div>
      </div>
    );
  }

  if (content.kind === "widget") {
    if (content.widget === "scorecard") return <ScorecardWidget />;
    return <PlaceholderWidget />;
  }

  const m = media.find((x) => x.id === content.mediaId);
  if (!m) {
    return (
      <div className="cardInner center">
        <div className="muted">Media not found</div>
      </div>
    );
  }

  if (m.type === "image") return <img className="mediaFill" src={m.src} alt={m.title} />;
  if (m.type === "video")
    return <video className="mediaFill" src={m.src} autoPlay muted loop playsInline />;

  if (m.type === "website") {
    return (
      <div className="cardInner center">
        <div className="bigTitle">WEBSITE</div>
        <div className="muted">{m.src}</div>
      </div>
    );
  }

  if (m.type === "music") {
    return (
      <div className="cardInner center">
        <div className="bigTitle">MUSIC</div>
        <div className="muted">{m.title}</div>
        <audio controls src={m.src} />
      </div>
    );
  }

  return null;
}

type Props = {
  layout: Layout;
  mediaLibrary: MediaItem[];
};

const Stage: React.FC<Props> = ({ layout, mediaLibrary }) => {
  return (
    <div className="stageGrid">
      <div className="cardSlot hero">{renderSlot(layout.slots.hero, mediaLibrary)}</div>
      <div className="cardSlot rightTop">{renderSlot(layout.slots.rightTop, mediaLibrary)}</div>
      <div className="cardSlot rightBottom">
        {renderSlot(layout.slots.rightBottom, mediaLibrary)}
      </div>
    </div>
  );
};

export default Stage;