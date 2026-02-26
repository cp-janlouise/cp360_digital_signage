import React from "react";
import "/src/frontend/styles/stage.css";
import type { Layout, MediaItem, SlotContent, SlotId } from "./Layouts";
import TopBar from "./TopBar";
import Ticker from "./Ticker";

const DEFAULT_FRAMES: Record<SlotId, { x: number; y: number; w: number; h: number }> = {
  hero:        { x: 0,    y: 0,  w: 66.5, h: 100 },
  rightTop:    { x: 66.5, y: 0,  w: 33.5, h: 50  },
  rightBottom: { x: 66.5, y: 50, w: 33.5, h: 50  },
};

function renderSlot(content: SlotContent, media: MediaItem[]) {
  if (content.kind === "empty") {
    return (
      <div className="cardInner center">
        <div className="muted">Empty slot</div>
      </div>
    );
  }

  if (content.kind === "widget") {
    return (
      <div className="cardInner center">
        <div className="muted">Widget: {(content as any).widget}</div>
      </div>
    );
  }

  const m = media.find((x) => x.id === (content as any).mediaId);
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
  const slotOrder: SlotId[] = layout.slotOrder?.length
    ? layout.slotOrder
    : ["hero", "rightTop", "rightBottom"];

  const slotFrames = layout.slotFrames ?? DEFAULT_FRAMES;

  return (
    <div className="stageRoot">
      <TopBar />

      <div className="stageCanvas">
        {slotOrder.map((slotId) => {
          const frame = slotFrames[slotId];
          const content = layout.slots[slotId];
          return (
            <div
              key={slotId}
              className="cardSlot"
              style={{
                position: "absolute",
                left:   `${frame.x}%`,
                top:    `${frame.y}%`,
                width:  `${frame.w}%`,
                height: `${frame.h}%`,
              }}
            >
              {renderSlot(content, mediaLibrary)}
            </div>
          );
        })}
      </div>

      <Ticker />
    </div>
  );
};

export default Stage;