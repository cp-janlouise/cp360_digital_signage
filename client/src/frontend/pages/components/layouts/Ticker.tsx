import React, { useEffect, useMemo, useRef, useState } from "react";
import "/src/frontend/styles/ticker.css";

const messages = [
  "REPRESENTING THE NEXT-GEN CX",
  "OUR CULTURE IS AT THE HEART OF OUR SUCCESS",
  "PEOPLE FIRST ALWAYS",
  "EMPATHY AT CORE",
  "CUSTOMER-CENTRIC EXCELLENCE",
  "EMPLOYEE WELLBEING MATTERS",
  "FOR THE PEOPLE, BY THE PEOPLE",
  "#RECORDYEAR",
  "#ONFIRE",
  "THIS IS MY YEAR",
];

export const Ticker: React.FC = () => {
  const contentRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const combined = useMemo(() => messages.join("   ✦   "), []);

  const [durationSec, setDurationSec] = useState<number>(30);

  useEffect(() => {
    const adjust = () => {
      const content = contentRef.current;
      const track = trackRef.current;
      if (!content || !track) return;

      // Same logic as your vanilla JS:
      // speed = contentWidth / 50  (seconds)
      const contentWidth = content.offsetWidth || 1000;
      const speed = contentWidth / 50;

      // Clamp so it never goes hyperspeed or glacier mode.
      const clamped = Math.max(12, Math.min(speed, 120));
      setDurationSec(clamped);
    };

    // fonts can affect width; wait for them if possible
    const doAdjust = () => adjust();

    if ((document as any).fonts?.ready) {
      (document as any).fonts.ready.then(doAdjust).catch(doAdjust);
    } else {
      doAdjust();
    }

    window.addEventListener("resize", adjust);
    return () => window.removeEventListener("resize", adjust);
  }, []);

  return (
    <div className="ticker-wrap" aria-label="Ticker">
      <div
        className="ticker-track"
        ref={trackRef}
        style={{ animationDuration: `${durationSec}s` }}
      >
        <div className="ticker-content" ref={contentRef}>
          {combined}
        </div>
        <div className="ticker-content">{combined}</div>
      </div>
    </div>
  );
};

export default Ticker;