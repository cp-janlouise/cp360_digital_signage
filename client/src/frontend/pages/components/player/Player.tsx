import React, { useCallback, useEffect, useRef, useState } from "react";
import TopBar from "../layouts/TopBar";
import Ticker from "../layouts/Ticker";

// ─────────────────────────────────────────────────────────────────────────────
// Types (mirrors the CMS data shapes stored in localStorage)
// ─────────────────────────────────────────────────────────────────────────────

type MediaType = "image" | "video" | "website" | "music";

type MediaItem = { id: string; type: MediaType; title: string; src: string; };

type SlotId = "hero" | "rightTop" | "rightBottom";
type SlotContent = { kind: "empty" } | { kind: "media"; mediaId: string } | { kind: "widget"; widget: string };

type Layout = {
  id: string; name: string;
  slots: Record<SlotId, SlotContent>;
  slotOrder?: SlotId[];
  slotFrames?: Record<SlotId, { x: number; y: number; w: number; h: number }>;
};

type PlaylistEntry = { entryId: string; mediaId: string; duration: number; };
type Playlist = {
  id: string; name: string; layoutId: string;
  slots: Partial<Record<SlotId, PlaylistEntry[]>>;
};

type Campaign = {
  id: string; name: string; playlistId: string;
  startDate: string; endDate: string;
  startTime: string; endTime: string;
  daysOfWeek: number[]; status: string;
};

type Screen = {
  id: string; name: string; pairingCode: string;
  pairingCodeExpiry: string; screenToken: string;
  status: "unpaired" | "online" | "offline";
  campaignIds: string[];
};

// ─────────────────────────────────────────────────────────────────────────────
// LocalStorage keys (must match CMS)
// ─────────────────────────────────────────────────────────────────────────────

const LS_SCREENS    = "cp360_screens_v1";
const LS_CAMPAIGNS  = "cp360_campaigns_v1";
const LS_PLAYLISTS  = "cp360_playlists_v2";
const LS_LAYOUTS    = "cp360_layouts_v1";
const LS_CONTENTS   = "cp360_contents_v1";
const LS_PLAYER_TOKEN = "cp360_player_token";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function loadLS<T>(key: string): T[] {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : []; } catch { return []; }
}
function saveLS(key: string, val: unknown) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

function isNowActive(c: Campaign): boolean {
  if (c.status !== "active") return false;
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10);
  if (dateStr < c.startDate || dateStr > c.endDate) return false;
  if (!c.daysOfWeek.includes(today.getDay())) return false;
  const nowMins = today.getHours() * 60 + today.getMinutes();
  const [sh, sm] = c.startTime.split(":").map(Number);
  const [eh, em] = c.endTime.split(":").map(Number);
  return nowMins >= sh * 60 + sm && nowMins < eh * 60 + em;
}

const DEFAULT_FRAMES: Record<SlotId, { x: number; y: number; w: number; h: number }> = {
  hero:        { x: 0,    y: 0,  w: 66.5, h: 100 },
  rightTop:    { x: 66.5, y: 0,  w: 33.5, h: 50  },
  rightBottom: { x: 66.5, y: 50, w: 33.5, h: 50  },
};

// ─────────────────────────────────────────────────────────────────────────────
// State machine
// ─────────────────────────────────────────────────────────────────────────────

type PlayerState =
  | { phase: "enter_code" }
  | { phase: "verifying" }
  | { phase: "error"; message: string }
  | { phase: "no_content"; screenName: string }
  | { phase: "playing"; screenName: string; layout: Layout; playlist: Playlist; media: MediaItem[] };

// ─────────────────────────────────────────────────────────────────────────────
// Root Player component
// ─────────────────────────────────────────────────────────────────────────────

const Player: React.FC = () => {
  const [state, setState] = useState<PlayerState>({ phase: "enter_code" });
  const [code, setCode]   = useState("");
  const pollRef           = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputsRef         = useRef<(HTMLInputElement | null)[]>([]);

  // ── On mount: check if already paired ───────────────────────────────────────
  useEffect(() => {
    const storedToken = localStorage.getItem(LS_PLAYER_TOKEN);
    if (storedToken) loadContentForToken(storedToken);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Poll for schedule every 30s when playing ─────────────────────────────────
  useEffect(() => {
    if (state.phase !== "playing" && state.phase !== "no_content") return;
    const token = localStorage.getItem(LS_PLAYER_TOKEN);
    if (!token) return;
    pollRef.current = setInterval(() => loadContentForToken(token), 30_000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase]);

  // ── Pairing ──────────────────────────────────────────────────────────────────
  const handlePair = () => {
    const entered = code.trim().toUpperCase();
    if (entered.length !== 6) return;
    setState({ phase: "verifying" });

    const screens: Screen[] = loadLS(LS_SCREENS);
    const screen = screens.find(s => s.pairingCode === entered);

    if (!screen) {
      setState({ phase: "error", message: "Code not found. Check the CMS and try again." });
      return;
    }
    if (new Date() > new Date(screen.pairingCodeExpiry)) {
      setState({ phase: "error", message: "This code has expired. Generate a new one in the CMS." });
      return;
    }

    // Mark screen as online
    const updated = screens.map(s =>
      s.id === screen.id
        ? { ...s, status: "online" as const, lastSeen: new Date().toISOString() }
        : s
    );
    saveLS(LS_SCREENS, updated);
    saveLS(LS_PLAYER_TOKEN, screen.screenToken);

    loadContentForToken(screen.screenToken);
  };

  // ── Load content for this screen token ───────────────────────────────────────
  const loadContentForToken = useCallback((token: string) => {
    const screens: Screen[]   = loadLS(LS_SCREENS);
    const screen = screens.find(s => s.screenToken === token);
    if (!screen) {
      localStorage.removeItem(LS_PLAYER_TOKEN);
      setState({ phase: "enter_code" });
      return;
    }

    // Update lastSeen
    saveLS(LS_SCREENS, screens.map(s => s.id === screen.id ? { ...s, status: "online" as const, lastSeen: new Date().toISOString() } : s));

    const campaigns: Campaign[] = loadLS(LS_CAMPAIGNS);
    const activeCampaign = screen.campaignIds
      .map(id => campaigns.find(c => c.id === id))
      .filter(Boolean)
      .find(c => isNowActive(c!)) as Campaign | undefined;

    if (!activeCampaign) {
      setState({ phase: "no_content", screenName: screen.name });
      return;
    }

    const playlists: Playlist[] = loadLS(LS_PLAYLISTS);
    const playlist = playlists.find(p => p.id === activeCampaign.playlistId);
    if (!playlist) {
      setState({ phase: "no_content", screenName: screen.name });
      return;
    }

    const layouts: Layout[] = loadLS(LS_LAYOUTS);
    const layout = layouts.find(l => l.id === playlist.layoutId);
    if (!layout) {
      setState({ phase: "no_content", screenName: screen.name });
      return;
    }

    const media: MediaItem[] = loadLS(LS_CONTENTS);

    setState({ phase: "playing", screenName: screen.name, layout, playlist, media });
  }, []);

  const handleUnpair = () => {
    if (!confirm("Unpair this player? You will need to enter a new pairing code.")) return;
    const token = localStorage.getItem(LS_PLAYER_TOKEN);
    if (token) {
      const screens: Screen[] = loadLS(LS_SCREENS);
      saveLS(LS_SCREENS, screens.map(s => s.screenToken === token ? { ...s, status: "offline" as const } : s));
    }
    localStorage.removeItem(LS_PLAYER_TOKEN);
    if (pollRef.current) clearInterval(pollRef.current);
    setState({ phase: "enter_code" });
    setCode("");
  };

  // ── Individual digit input for pairing code ───────────────────────────────────
  const handleDigitInput = (i: number, val: string) => {
    const char = val.toUpperCase().slice(-1);
    const chars = code.toUpperCase().padEnd(6, " ").split("");
    chars[i] = char || " ";
    const next = chars.join("").trimEnd();
    setCode(next);
    if (char && i < 5) inputsRef.current[i + 1]?.focus();
  };

  const handleDigitKey = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace") {
      const chars = code.toUpperCase().padEnd(6, " ").split("");
      chars[i] = " ";
      setCode(chars.join("").trimEnd());
      if (i > 0) inputsRef.current[i - 1]?.focus();
    }
    if (e.key === "Enter") handlePair();
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render phases
  // ─────────────────────────────────────────────────────────────────────────

  if (state.phase === "enter_code" || state.phase === "verifying" || state.phase === "error") {
    return (
      <div className="playerRoot playerPairingScreen">
        <div className="playerPairingCard">
          <div className="playerLogo">CP360</div>
          <div className="playerPairingTitle">Pair this display</div>
          <div className="playerPairingSubtitle">
            Create a screen in the CMS to get a 6-character code, then enter it below.
          </div>

          <div className="playerCodeInputRow">
            {Array.from({ length: 6 }).map((_, i) => (
              <input
                key={i}
                ref={el => { inputsRef.current[i] = el; }}
                className="playerCodeChar"
                maxLength={1}
                value={(code.toUpperCase()[i] ?? "").trim()}
                onChange={e => handleDigitInput(i, e.target.value)}
                onKeyDown={e => handleDigitKey(i, e)}
                onFocus={e => e.target.select()}
                disabled={state.phase === "verifying"}
              />
            ))}
          </div>

          {state.phase === "error" && (
            <div className="playerPairingError">{state.message}</div>
          )}

          <button
            className="playerPairBtn"
            onClick={handlePair}
            disabled={code.trim().length < 6 || state.phase === "verifying"}
          >
            {state.phase === "verifying" ? "Connecting…" : "Connect"}
          </button>

          <div className="playerPairingHint">
            Go to <strong>Screens</strong> in the CMS → Register a screen → Enter the code shown there.
          </div>
        </div>
      </div>
    );
  }

  if (state.phase === "no_content") {
    return (
      <div className="playerRoot playerNoContent">
        <div className="playerNoContentInner">
          <div className="playerLogo">CP360</div>
          <div className="playerNoContentTitle">{state.screenName}</div>
          <div className="playerNoContentMsg">No active content scheduled right now.</div>
          <div className="playerNoContentSub">The player will automatically load content when a campaign goes live.</div>
          <button className="playerUnpairBtn" onClick={handleUnpair}>Unpair</button>
        </div>
      </div>
    );
  }

  // ── Playing ──────────────────────────────────────────────────────────────────
  const { layout, playlist, media, screenName } = state;
  const slotOrder = layout.slotOrder?.length ? layout.slotOrder : (["hero"] as SlotId[]);
  const slotFrames = layout.slotFrames ?? DEFAULT_FRAMES;

  return (
    <div className="playerRoot playerPlayingRoot">

      {/* ── TopBar — identical to the Layout Stage ── */}
      <TopBar />

      {/* ── Slot canvas — fills remaining vertical space ── */}
      <div className="playerCanvas">
        {slotOrder.map(slotId => {
          const frame   = slotFrames[slotId] ?? DEFAULT_FRAMES[slotId];
          const entries = playlist.slots[slotId] ?? [];
          return (
            <div key={slotId}
              className="playerSlot"
              style={{ left:`${frame.x}%`, top:`${frame.y}%`, width:`${frame.w}%`, height:`${frame.h}%` }}>
              {entries.length > 0
                ? <SlotPlayer entries={entries} mediaLibrary={media} />
                : <div className="playerSlotEmpty" />}
            </div>
          );
        })}
      </div>

      {/* ── Ticker — identical to the Layout Stage ── */}
      <Ticker />

      {/* ── HUD — fades in on mouse move ── */}
      <HUD screenName={screenName} onUnpair={handleUnpair} />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SlotPlayer — manages one slot's entry sequence
// ─────────────────────────────────────────────────────────────────────────────

function SlotPlayer({ entries, mediaLibrary }: { entries: PlaylistEntry[]; mediaLibrary: MediaItem[] }) {
  const [index, setIndex] = useState(0);
  const timerRef          = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentEntry = entries[index % entries.length];
  const currentMedia = mediaLibrary.find(m => m.id === currentEntry?.mediaId);

  const advance = useCallback(() => {
    setIndex(i => (i + 1) % entries.length);
  }, [entries.length]);

  // Start duration timer whenever entry/media changes (skip for video — handled by onEnded)
  useEffect(() => {
    if (!currentEntry || !currentMedia) return;
    if (currentMedia.type === "video") return; // video uses onEnded + fallback

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(advance, currentEntry.duration * 1000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [index, currentEntry, currentMedia, advance]);

  // Video: advance on end, but also enforce max duration as fallback
  const handleVideoEnd = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    advance();
  }, [advance]);

  useEffect(() => {
    if (!currentEntry || !currentMedia || currentMedia.type !== "video") return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(advance, currentEntry.duration * 1000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [index, currentEntry, currentMedia, advance]);

  if (!currentMedia) {
    return <div className="playerSlotEmpty"><span>Media unavailable</span></div>;
  }

  return (
    <div className="playerSlotContent">
      {currentMedia.type === "image" && (
        <img key={currentEntry.entryId} src={currentMedia.src} alt={currentMedia.title} className="playerMedia playerMediaImg" />
      )}
      {currentMedia.type === "video" && (
        <video key={currentEntry.entryId} src={currentMedia.src} className="playerMedia playerMediaVideo"
          autoPlay muted playsInline onEnded={handleVideoEnd} />
      )}
      {currentMedia.type === "website" && (
        <iframe key={currentEntry.entryId} src={currentMedia.src} className="playerMedia playerMediaIframe"
          title={currentMedia.title} sandbox="allow-scripts allow-same-origin" />
      )}
      {currentMedia.type === "music" && (
        <div className="playerMusicSlide">
          <div className="playerMusicIcon">♪</div>
          <div className="playerMusicTitle">{currentMedia.title}</div>
          <audio key={currentEntry.entryId} src={currentMedia.src} autoPlay onEnded={handleVideoEnd} />
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HUD — fades in on mouse move, fades out after 3 seconds of idle
// ─────────────────────────────────────────────────────────────────────────────

function HUD({ screenName, onUnpair }: { screenName: string; onUnpair: () => void }) {
  const [visible, setVisible] = useState(false);
  const hideRef               = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = () => {
    setVisible(true);
    if (hideRef.current) clearTimeout(hideRef.current);
    hideRef.current = setTimeout(() => setVisible(false), 3000);
  };

  useEffect(() => {
    window.addEventListener("mousemove", show);
    window.addEventListener("touchstart", show);
    return () => { window.removeEventListener("mousemove", show); window.removeEventListener("touchstart", show); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={`playerHUD ${visible ? "playerHUDVisible" : ""}`}>
      <div className="playerHUDName">CP360 · {screenName}</div>
      <button className="playerHUDUnpair" onClick={onUnpair}>Unpair</button>
    </div>
  );
}

export default Player;
