// ─────────────────────────────────────────────────────────────────────────────
// Dashboard.tsx  (updated — role-aware)
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useMemo } from "react";
import "/src/frontend/styles/dashboard.css";
import "/src/frontend/styles/accounts.css";
import "/src/frontend/styles/contents.css";
import "/src/frontend/styles/layouts.css";
import "/src/frontend/styles/stage.css";
import "/src/frontend/styles/playlists.css";

import logo from "/src/frontend/images/lg_cp360_white.png";
import "bootstrap/dist/css/bootstrap.min.css";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import "bootstrap-icons/font/bootstrap-icons.css";

import Accounts from "../accounts/Accounts";
import Contents, { type MediaItem as ContentsMediaItem } from "../contents/Contents";
import Layouts, { type Layout, type MediaItem } from "../layouts/Layouts";
import Playlists from "../playlist/Playlists";
import Campaigns from "../campaign/Campaigns";
import Screens from "../screen/Screens";
import Player from "../player/Player";

// ── Permissions ───────────────────────────────────────────────────────────────
import { usePermissions } from "../security/permissionContext";
import { type Role, ROLE_LABELS, ROLE_DESCRIPTIONS } from "../security/rolesConfig";

// ── Types ─────────────────────────────────────────────────────────────────────
const DEFAULT_MEDIA: MediaItem[] = [
  { id: "demo_website", type: "website", title: "Example Website", src: "https://example.com" },
];

interface DashboardProps { onLogout: () => void; }
type Props = {
  onNavigate: (
    view:
      | "dashboard" | "campaigns" | "contents" | "screens"
      | "playlists" | "accounts" | "layouts" | "user"
      | "manageUsers" | "manageOrganizations" | "player"
  ) => void;
};

// ── Storage helpers ───────────────────────────────────────────────────────────
function countFromLS(key: string): number {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r).length : 0; } catch { return 0; }
}

// ── Read-only toast notification ─────────────────────────────────────────────
const ReadOnlyBanner: React.FC = () => {
  const [visible, setVisible] = React.useState(true);

  if (!visible) return null;

  return (
    <div style={{
      position: "fixed",
      top: "20px",
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 9999,
      background: "#1e293b",
      color: "#fbbf24",
      padding: "12px 20px",
      borderRadius: "12px",
      fontSize: "13px",
      fontWeight: 600,
      display: "flex",
      alignItems: "center",
      gap: "10px",
      boxShadow: "0 8px 32px rgba(0,0,0,0.25), 0 0 0 1px rgba(251,191,36,0.2)",
      animation: "slideDown 0.35s cubic-bezier(0.16,1,0.3,1)",
      whiteSpace: "nowrap",
    }}>
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateX(-50%) translateY(-12px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
      <span style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "28px",
        height: "28px",
        background: "rgba(251,191,36,0.15)",
        borderRadius: "8px",
        flexShrink: 0,
      }}>
        <i className="bi bi-eye-fill" style={{ fontSize: "13px" }} />
      </span>
      <div>
        <div style={{ fontSize: "12px", opacity: 0.7, fontWeight: 500, marginBottom: "1px" }}>
          READ-ONLY MODE
        </div>
        <div style={{ fontSize: "13px" }}>
          You have Viewer / Auditor access. No changes can be made.
        </div>
      </div>
      <button
        onClick={() => setVisible(false)}
        style={{
          marginLeft: "8px",
          background: "rgba(255,255,255,0.08)",
          border: "none",
          color: "#94a3b8",
          cursor: "pointer",
          width: "24px",
          height: "24px",
          borderRadius: "6px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "12px",
          flexShrink: 0,
        }}
        title="Dismiss"
      >
        ✕
      </button>
    </div>
  );
};

// ── Read-Only Wrapper ────────────────────────────────────────────────────────
// Blocks ALL clicks/interactions inside child components when readOnly=true.
// No need to modify each child component individually.
const ReadOnlyWrapper: React.FC<{ readOnly: boolean; children: React.ReactNode }> = ({
  readOnly,
  children,
}) => {
  if (!readOnly) return <>{children}</>;

  return (
    <div style={{ position: "relative" }}>
      {children}
      {/* Transparent intercept layer — catches all pointer events */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 50,
          cursor: "not-allowed",
          background: "transparent",
        }}
        title="You have read-only access and cannot make changes."
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      />
      {/* Floating badge so user knows why nothing works */}
      <div style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        zIndex: 100,
        background: "#1e293b",
        color: "#fbbf24",
        padding: "10px 16px",
        borderRadius: "10px",
        fontSize: "12px",
        fontWeight: 600,
        display: "flex",
        alignItems: "center",
        gap: "8px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
        pointerEvents: "none",
      }}>
        <i className="bi bi-lock-fill" />
        Read-Only — changes are disabled for your role
      </div>
    </div>
  );
};

// ── Access Denied placeholder ─────────────────────────────────────────────────
const AccessDenied: React.FC<{ message?: string }> = ({
  message = "You don't have permission to access this section.",
}) => (
  <div style={{
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "60vh",
    gap: "16px",
    color: "#6b7280",
  }}>
    <i className="bi bi-shield-lock-fill" style={{ fontSize: "64px", color: "#e5e7eb" }} />
    <h2 style={{ margin: 0, fontSize: "22px", color: "#374151" }}>Access Denied</h2>
    <p style={{ margin: 0, maxWidth: "380px", textAlign: "center", lineHeight: 1.6 }}>{message}</p>
  </div>
);

// ── Role badge pill ───────────────────────────────────────────────────────────
const ROLE_COLORS: Record<Role, { bg: string; color: string }> = {
  superAdmin:     { bg: "#7c3aed", color: "#fff" },
  admin:          { bg: "#2563eb", color: "#fff" },
  contentManager: { bg: "#059669", color: "#fff" },
  viewer:         { bg: "#d97706", color: "#fff" },
};

const RoleBadge: React.FC<{ role: Role }> = ({ role }) => {
  const { bg, color } = ROLE_COLORS[role];
  return (
    <span style={{
      background: bg,
      color,
      padding: "2px 10px",
      borderRadius: "999px",
      fontSize: "11px",
      fontWeight: 700,
      letterSpacing: "0.5px",
      textTransform: "uppercase",
    }}>
      {ROLE_LABELS[role]}
    </span>
  );
};


// ── Dashboard ─────────────────────────────────────────────────────────────────
const Dashboard: React.FC<DashboardProps & Props> = ({ onLogout, onNavigate }) => {
  const { role, can, permissions } = usePermissions();

  const [isCampaignsOpen, setIsCampaignsOpen] = useState(false);
  const [isAccountsOpen, setIsAccountsOpen]   = useState(false);
  const [_activeLayout, setActiveLayout]       = useState<Layout | null>(null);
  const [allMedia, setAllMedia]                = useState<MediaItem[]>(DEFAULT_MEDIA);

  const [activeView, setActiveView] = useState<
    | "dashboard" | "accounts" | "manageUsers" | "manageOrganizations" | "manageLocations"
    | "campaigns" | "createCampaign" | "screens" | "contents"
    | "playlists" | "layouts" | "user" | "player"
  >("dashboard");

  const handleLogout = () => onLogout();

  const handleHome = () => {
    setIsCampaignsOpen(false);
    setIsAccountsOpen(false);
    setActiveView("dashboard");
    onNavigate("dashboard");
  };

  const navigate = (view: typeof activeView) => {
    setIsCampaignsOpen(false);
    setIsAccountsOpen(false);
    setActiveView(view);
  };

  const playlistRefs = useMemo(() => {
    try {
      const raw = localStorage.getItem("cp360_playlists_v2");
      if (!raw) return [];
      const layoutsRaw = localStorage.getItem("cp360_layouts_v1");
      const layouts = layoutsRaw ? JSON.parse(layoutsRaw) : [];
      return JSON.parse(raw).map((p: any) => {
        const lyt = layouts.find((l: any) => l.id === p.layoutId);
        return { id: p.id, name: p.name, layoutName: lyt?.name };
      });
    } catch { return []; }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeView]);

  const campaignRefs = useMemo(() => {
    try {
      const raw = localStorage.getItem("cp360_campaigns_v1");
      if (!raw) return [];
      const playlistsRaw = localStorage.getItem("cp360_playlists_v2");
      const playlists = playlistsRaw ? JSON.parse(playlistsRaw) : [];
      return JSON.parse(raw).map((c: any) => {
        const pl = playlists.find((p: any) => p.id === c.playlistId);
        return { id: c.id, name: c.name, playlistName: pl?.name, startDate: c.startDate, endDate: c.endDate };
      });
    } catch { return []; }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeView]);

  // ── Render main ─────────────────────────────────────────────────────────────
  const renderMain = () => {
    switch (activeView) {

      case "dashboard":
        return (
          <div className="dashboardHome">
            <div className="topRow">
              <h1 className="pageTitle">Dashboard</h1>
              <RoleBadge role={role} />
            </div>

            <div className="summaryCards">
              {can("canViewCampaigns") && (
                <button className="card" onClick={() => setActiveView("campaigns")}>
                  <div className="cardTitle">CAMPAIGNS</div>
                  <div className="cardNumber">{countFromLS("cp360_campaigns_v1")}</div>
                  <div className="cardAction">Manage Campaigns</div>
                </button>
              )}
              {can("canViewContents") && (
                <button className="card" onClick={() => setActiveView("contents")}>
                  <div className="cardTitle">CONTENTS</div>
                  <div className="cardNumber">{countFromLS("cp360_contents_v1")}</div>
                  <div className="cardAction">Add Contents</div>
                </button>
              )}
              {can("canViewScreens") && (
                <button className="card" onClick={() => setActiveView("screens")}>
                  <div className="cardTitle">SCREENS</div>
                  <div className="cardNumber">{countFromLS("cp360_screens_v1")}</div>
                  <div className="cardAction">Manage Screens</div>
                </button>
              )}
              {can("canViewPlaylists") && (
                <button className="card" onClick={() => setActiveView("playlists")}>
                  <div className="cardTitle">PLAYLISTS</div>
                  <div className="cardNumber">{countFromLS("cp360_playlists_v2")}</div>
                  <div className="cardAction">Manage Playlists</div>
                </button>
              )}
              {can("canViewLayouts") && (
                <button className="card" onClick={() => setActiveView("layouts")}>
                  <div className="cardTitle">LAYOUTS</div>
                  <div className="cardNumber">{countFromLS("cp360_layouts_v1")}</div>
                  <div className="cardAction">Manage Layouts</div>
                </button>
              )}
            </div>

            {/* Flow guide — hide steps the user can't access */}
            <div className="cmsFlowBanner">
              {can("canViewContents") && (
                <><span className="cmsFlowStep" onClick={() => setActiveView("contents")}>① Contents</span><span className="cmsFlowArrow">→</span></>
              )}
              {can("canViewLayouts") && (
                <><span className="cmsFlowStep" onClick={() => setActiveView("layouts")}>② Layouts</span><span className="cmsFlowArrow">→</span></>
              )}
              {can("canViewPlaylists") && (
                <><span className="cmsFlowStep" onClick={() => setActiveView("playlists")}>③ Playlists</span><span className="cmsFlowArrow">→</span></>
              )}
              {can("canViewCampaigns") && (
                <><span className="cmsFlowStep" onClick={() => setActiveView("campaigns")}>④ Campaigns</span><span className="cmsFlowArrow">→</span></>
              )}
              {can("canViewScreens") && (
                <span className="cmsFlowStep" onClick={() => setActiveView("screens")}>⑤ Screens</span>
              )}
            </div>

            {/* Permission summary card */}
            <div style={{
              margin: "24px 0 0",
              padding: "16px 20px",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "12px",
              fontSize: "13px",
            }}>
              <div style={{ fontWeight: 700, marginBottom: "10px", color: "#1e293b", display: "flex", alignItems: "center", gap: "8px" }}>
                <i className="bi bi-shield-check" style={{ color: "#7c3aed" }} />
                Your Access Summary
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {(Object.entries(permissions) as [keyof typeof permissions, boolean][])
                  .filter(([, v]) => v)
                  .map(([k]) => (
                    <span key={k} style={{
                      background: "#e0f2fe",
                      color: "#0369a1",
                      padding: "3px 10px",
                      borderRadius: "999px",
                      fontSize: "11px",
                      fontWeight: 500,
                    }}>
                      {k.replace(/^can/, "").replace(/([A-Z])/g, " $1").trim()}
                    </span>
                  ))}
              </div>
            </div>

            <div className="calendarSection">
              <h2 className="calendarTitle">Schedules:</h2>
              <div className="calendarCard">
                <FullCalendar
                  plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                  initialView="dayGridMonth"
                  headerToolbar={{ left: "prev,next today", center: "title", right: "dayGridMonth,timeGridWeek,timeGridDay" }}
                  height="400px"
                  events={(() => {
                    try {
                      const raw = localStorage.getItem("cp360_campaigns_v1");
                      if (!raw) return [];
                      return JSON.parse(raw)
                        .filter((c: any) => c.status === "active")
                        .map((c: any) => ({ title: c.name, start: c.startDate, end: c.endDate }));
                    } catch { return []; }
                  })()}
                />
              </div>
            </div>
          </div>
        );

      case "campaigns":
        return can("canViewCampaigns")
          ? (
            <ReadOnlyWrapper readOnly={!can("canCreateCampaign")}>
              <Campaigns playlists={playlistRefs} onNavigateHome={handleHome} />
            </ReadOnlyWrapper>
          )
          : <AccessDenied message="You don't have permission to view Campaigns." />;

      case "screens":
        return can("canViewScreens")
          ? (
            <ReadOnlyWrapper readOnly={!can("canCreateScreen")}>
              <Screens campaigns={campaignRefs} onNavigateHome={handleHome} />
            </ReadOnlyWrapper>
          )
          : <AccessDenied message="You don't have permission to view Screens." />;

      case "contents":
        return can("canViewContents")
          ? (
            <ReadOnlyWrapper readOnly={!can("canUploadContent")}>
              <Contents
                initialTab="all"
                onNavigate={(view) => setActiveView(view as any)}
                onMediaItemsChange={(items: ContentsMediaItem[]) => {
                  setAllMedia(items.map((m) => ({ id: m.id, type: m.type as any, title: m.title, src: m.src })));
                }}
              />
            </ReadOnlyWrapper>
          )
          : <AccessDenied message="You don't have permission to view Contents." />;

      case "playlists":
        return can("canViewPlaylists")
          ? (
            <ReadOnlyWrapper readOnly={!can("canCreatePlaylist")}>
              <Playlists mediaLibrary={allMedia} onNavigateHome={handleHome} />
            </ReadOnlyWrapper>
          )
          : <AccessDenied message="You don't have permission to view Playlists." />;

      case "layouts":
        return can("canViewLayouts")
          ? (
            <ReadOnlyWrapper readOnly={!can("canCreateLayout")}>
              <Layouts mediaLibrary={allMedia} onUseLayout={(layout) => setActiveLayout(layout)} onNavigateHome={handleHome} />
            </ReadOnlyWrapper>
          )
          : <AccessDenied message="You don't have permission to view Layouts." />;

      case "accounts":
        return can("canViewAccounts")
          ? <Accounts activeTab="accounts" onNavigate={(view) => setActiveView(view)} />
          : <AccessDenied message="You don't have permission to view Accounts." />;

      case "manageUsers":
        return can("canViewManageUsers")
          ? <Accounts activeTab="manageUsers" onNavigate={(view) => setActiveView(view)} />
          : <AccessDenied message="You don't have permission to manage users." />;

      case "manageLocations":
        return can("canViewManageLocations")
          ? <Accounts activeTab="manageLocations" onNavigate={(view) => setActiveView(view)} />
          : <AccessDenied message="You don't have permission to manage locations." />;

      case "manageOrganizations":
        return can("canViewManageOrganizations")
          ? <Accounts activeTab="manageOrganizations" onNavigate={(view) => setActiveView(view)} />
          : <AccessDenied message="You don't have permission to manage organizations." />;

      case "player":
        return can("canViewPlayer") ? <Player /> : <AccessDenied />;

      case "user":
        return (
          <div className="UserHome">
            <div className="topRow">
              <h1 className="pageTitle">User Information</h1>
            </div>
            <div style={{ padding: "24px 0" }}>
              <RoleBadge role={role} />
              <p style={{ marginTop: "12px", color: "#6b7280", fontSize: "14px" }}>
                {ROLE_DESCRIPTIONS[role]}
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // ── Sidebar ─────────────────────────────────────────────────────────────────
  const isAccountsActive = ["accounts", "manageUsers", "manageOrganizations", "manageLocations"].includes(activeView);

  return (
    <div className="dashboardRoot">
      <aside className="sidebar">
        <div className="sidebarTop">
          <img src={logo} alt="CP360 Logo" className="sidebarLogo" />
        </div>

        <nav className="sidebarNav">
          {/* DASHBOARD — always visible */}
          <button
            className={`navItem ${activeView === "dashboard" ? "active" : ""}`}
            onClick={() => navigate("dashboard")}
          >
            <i className="bi bi-grid" /> <span className="userSize">DASHBOARD</span>
          </button>

          {/* CAMPAIGNS */}
          {can("canViewCampaigns") && (
            <button
              className={`navItem ${activeView === "campaigns" ? "active" : ""}`}
              onClick={() => navigate("campaigns")}
            >
              <i className="bi bi-flag" /> <span className="userSize">CAMPAIGNS</span>
            </button>
          )}

          {/* SCREENS */}
          {can("canViewScreens") && (
            <button
              className={`navItem ${activeView === "screens" ? "active" : ""}`}
              onClick={() => navigate("screens")}
            >
              <i className="bi bi-laptop" /> <span className="userSize">SCREENS</span>
            </button>
          )}

          {/* CONTENTS */}
          {can("canViewContents") && (
            <button
              className={`navItem ${activeView === "contents" ? "active" : ""}`}
              onClick={() => navigate("contents")}
            >
              <i className="bi bi-file-earmark" /> <span className="userSize">CONTENTS</span>
            </button>
          )}

          {/* PLAYLISTS */}
          {can("canViewPlaylists") && (
            <button
              className={`navItem ${activeView === "playlists" ? "active" : ""}`}
              onClick={() => navigate("playlists")}
            >
              <i className="bi bi-collection-play" /> <span className="userSize">PLAYLISTS</span>
            </button>
          )}

          {/* LAYOUTS */}
          {can("canViewLayouts") && (
            <button
              className={`navItem ${activeView === "layouts" ? "active" : ""}`}
              onClick={() => navigate("layouts")}
            >
              <i className="bi bi-grid-1x2" /> <span className="userSize">LAYOUTS</span>
            </button>
          )}

          {/* ACCOUNTS (+ sub-menu) */}
          {can("canViewAccounts") && (
            <>
              <button
                className={`navItem ${isAccountsActive ? "active" : ""}`}
                onClick={() => { setIsAccountsOpen((s) => !s); setActiveView("accounts"); }}
              >
                <i className="bi bi-person-rolodex" /> <span className="userSize">ACCOUNTS</span>
              </button>

              {isAccountsOpen && can("canViewManageUsers") && (
                <div className="submenu">
                  <button
                    className={`submenuItem ${activeView === "manageUsers" ? "active" : ""}`}
                    onClick={() => setActiveView("manageUsers")}
                  >
                    Manage Users
                  </button>
                </div>
              )}
              {isAccountsOpen && can("canViewManageOrganizations") && (
                <div className="submenu">
                  <button
                    className={`submenuItem ${activeView === "manageOrganizations" ? "active" : ""}`}
                    onClick={() => setActiveView("manageOrganizations")}
                  >
                    Manage Organizations
                  </button>
                </div>
              )}
              {isAccountsOpen && can("canViewManageLocations") && (
                <div className="submenu">
                  <button
                    className={`submenuItem ${activeView === "manageLocations" ? "active" : ""}`}
                    onClick={() => setActiveView("manageLocations")}
                  >
                    Manage Locations
                  </button>
                </div>
              )}
            </>
          )}
        </nav>

        {/* PLAYER */}
        {can("canViewPlayer") && (
          <button
            className={`navItem ${activeView === "player" ? "active" : ""}`}
            onClick={() => navigate("player")}
          >
            <i className="bi bi-tv" /> <span className="userSize">PLAYER</span>
          </button>
        )}

        {/* USER */}
        <button
          className={`navItem ${activeView === "user" ? "active" : ""}`}
          onClick={() => navigate("user")}
        >
          <i className="bi bi-person-circle" /> <span className="userSize">USER</span>
        </button>

        <div className="sidebarBottom">
          <button className="logoutBtn" onClick={handleLogout}>Logout</button>
        </div>
      </aside>

      <main className="mainArea">
        {role === "viewer" && <ReadOnlyBanner />}
        {renderMain()}
      </main>
    </div>
  );
};

export default Dashboard;
