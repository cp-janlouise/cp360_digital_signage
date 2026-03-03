import React, { useEffect, useMemo, useState } from "react";

type ScreenLike = {
  id: string;
  name?: string;
  status?: "active" | "offline";
  pendingUpdate?: boolean;
  playlistSynced?: boolean; // true = synced, false = out of sync
};

type HealthBadge = "good" | "warn" | "bad" | "neutral";

/**
 * Frontend-only “System Health” widget.
 * It tries to read screens from localStorage (cp360.screens.v1) if present,
 * otherwise it shows zeros and a “No data” hint.
 */
const SystemHealth: React.FC = () => {
  const [screens, setScreens] = useState<ScreenLike[]>(() => readScreens());

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "cp360.screens.v1") setScreens(readScreens());
    };

    const onCustom = () => setScreens(readScreens());

    window.addEventListener("storage", onStorage);
    window.addEventListener("cp360:screens:changed", onCustom as EventListener);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("cp360:screens:changed", onCustom as EventListener);
    };
  }, []);

  const stats = useMemo(() => {
  const total = screens.length;

  const activeScreens = screens.filter((s) => (s.status ?? "offline") === "active").length;
  const offlineScreens = screens.filter((s) => (s.status ?? "offline") === "offline").length;
  const pendingUpdates = screens.filter((s) => !!s.pendingUpdate).length;

  const syncedCount = screens.filter((s) => s.playlistSynced === true).length;
  const knownSyncCount = screens.filter((s) => typeof s.playlistSynced === "boolean").length;
  const outOfSyncCount = screens.filter((s) => s.playlistSynced === false).length;

  const syncText = knownSyncCount === 0 ? "—" : `${syncedCount}/${knownSyncCount} synced`;

  const activeBadge: HealthBadge = activeScreens > 0 ? "good" : "neutral";
  const offlineBadge: HealthBadge = offlineScreens > 0 ? "bad" : "good";
  const updatesBadge: HealthBadge = pendingUpdates > 0 ? "warn" : "good";
  const syncBadge: HealthBadge =
    knownSyncCount === 0 ? "neutral" : outOfSyncCount > 0 ? "warn" : "good";

  return {
    total,
    activeScreens,
    offlineScreens,
    pendingUpdates,
    syncText,
    activeBadge,
    offlineBadge,
    updatesBadge,
    syncBadge,
  };
}, [screens]);

  const hasAnyData = screens.length > 0;

  return (
    <section className="healthPanel" aria-label="System Health">
      <div className="healthPanelTop">
        <div className="healthTitleWrap">
          <div className="healthTitle">System Health</div>
          <div className="healthSubtitle">
            Live operational snapshot for your signage network
          </div>
        </div>

        <div className="healthMeta">
          <span className={"healthBadge healthBadge--" + (hasAnyData ? "good" : "neutral")}>
            {hasAnyData ? `${stats.total} screen(s) tracked` : "No screen data yet"}
          </span>
        </div>
      </div>

        <HealthCard
        icon="active"
        label="Active Screens"
        value={String(stats.activeScreens)}
        badge={stats.activeBadge}
        hint={screens.length ? "Online and reporting" : "Connect screens to populate"}
        />

        <HealthCard
        icon="offline"
        label="Offline Screens"
        value={String(stats.offlineScreens)}
        badge={stats.offlineBadge}
        hint={stats.offlineScreens > 0 ? "Needs attention" : "All good"}
        />

        <HealthCard
        icon="updates"
        label="Pending Updates"
        value={String(stats.pendingUpdates)}
        badge={stats.updatesBadge}
        hint={stats.pendingUpdates > 0 ? "Queued for deployment" : "None pending"}
        />

        <HealthCard
        icon="sync"
        label="Playlist Sync Status"
        value={stats.syncText}
        badge={stats.syncBadge}
        hint={stats.syncBadge === "warn" ? "Some screens out of sync" : "Up to date"}
        />
            </section>
        );
};

export default SystemHealth;

function readScreens(): ScreenLike[] {
  const raw = localStorage.getItem("cp360.screens.v1");
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as ScreenLike[];
  } catch {
    return [];
  }
}

type HealthCardProps = {
  icon: "active" | "offline" | "updates" | "sync";
  label: string;
  value: string;
  badge: "good" | "warn" | "bad" | "neutral";
  hint: string;
};

const HealthCard: React.FC<HealthCardProps> = ({ icon, label, value, badge, hint }) => {
  return (
    <div className="healthCard">
      <div className="healthCardTop">
        <div className="healthIcon" aria-hidden="true">
          {iconSvg(icon)}
        </div>
        <span className={"healthBadge healthBadge--" + badge}>{badgeLabel(badge)}</span>
      </div>

      <div className="healthValue">{value}</div>
      <div className="healthLabel">{label}</div>
      <div className="healthHint">{hint}</div>
    </div>
  );
};

function badgeLabel(b: "good" | "warn" | "bad" | "neutral") {
  if (b === "good") return "OK";
  if (b === "warn") return "Check";
  if (b === "bad") return "Alert";
  return "—";
}

function iconSvg(kind: "active" | "offline" | "updates" | "sync") {
  const common = { width: 18, height: 18, viewBox: "0 0 24 24" };
  if (kind === "active") {
    return (
      <svg {...common}>
        <path
          fill="currentColor"
          d="M12 2a10 10 0 1 0 .001 20.001A10 10 0 0 0 12 2Zm-1 14-4-4 1.4-1.4L11 13.2l5.6-5.6L18 9l-7 7Z"
        />
      </svg>
    );
  }
  if (kind === "offline") {
    return (
      <svg {...common}>
        <path
          fill="currentColor"
          d="M12 2a10 10 0 1 0 .001 20.001A10 10 0 0 0 12 2Zm4.6 13.2L15.2 16.6 12 13.4l-3.2 3.2-1.4-1.4L10.6 12 7.4 8.8l1.4-1.4L12 10.6l3.2-3.2 1.4 1.4L13.4 12l3.2 3.2Z"
        />
      </svg>
    );
  }
  if (kind === "updates") {
    return (
      <svg {...common}>
        <path
          fill="currentColor"
          d="M12 6V3l4 4-4 4V8a4 4 0 0 0-4 4H6a6 6 0 0 1 6-6Zm6 6a6 6 0 0 1-6 6v3l-4-4 4-4v3a4 4 0 0 0 4-4h2Z"
        />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path
        fill="currentColor"
        d="M12 4a8 8 0 1 0 8 8h-2a6 6 0 1 1-6-6V4Zm1 3h-2v6l5 3 1-1.7-4-2.3V7Z"
      />
    </svg>
  );
}