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

// ── Storage helpers (read-only, for live counts) ──────────────────────────────
function countFromLS(key: string): number {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r).length : 0; } catch { return 0; }
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
const Dashboard: React.FC<DashboardProps & Props> = ({ onLogout, onNavigate }) => {
  const [isCampaignsOpen, setIsCampaignsOpen] = useState(false);
  const [isAccountsOpen, setIsAccountsOpen]   = useState(false);
  const [_activeLayout, setActiveLayout]       = useState<Layout | null>(null);
  const [allMedia, setAllMedia]                = useState<MediaItem[]>(DEFAULT_MEDIA);

  const [activeView, setActiveView] = useState<
    | "dashboard" | "accounts" | "manageUsers" | "manageOrganizations" | "manageLocations"
    | "campaigns" | "createCampaign" | "screens" | "contents"
    | "playlists" | "layouts" | "user" | "player"
  >("dashboard");

  const isHome = activeView === "dashboard";

  const handleLogout = () => onLogout();

  const handleHome = () => {
    setIsCampaignsOpen(false);
    setIsAccountsOpen(false);
    setActiveView("dashboard");
    onNavigate("dashboard");
  };

  // ── Pull playlist and campaign refs from localStorage for passing down ───────
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
  }, [activeView]); // refresh when switching views

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

  // ── Render main ───────────────────────────────────────────────────────────────
  const renderMain = () => {
    switch (activeView) {

      case "dashboard":
        return (
          <div className="dashboardHome">
            <div className="topRow">
              <h1 className="pageTitle">Dashboard</h1>
            </div>

            <div className="summaryCards">
              <button className="card" onClick={() => setActiveView("campaigns")}>
                <div className="cardTitle">CAMPAIGNS</div>
                <div className="cardNumber">{countFromLS("cp360_campaigns_v1")}</div>
                <div className="cardAction">Manage Campaigns</div>
              </button>
              <button className="card" onClick={() => setActiveView("contents")}>
                <div className="cardTitle">CONTENTS</div>
                <div className="cardNumber">{countFromLS("cp360_contents_v1")}</div>
                <div className="cardAction">Add Contents</div>
              </button>
              <button className="card" onClick={() => setActiveView("screens")}>
                <div className="cardTitle">SCREENS</div>
                <div className="cardNumber">{countFromLS("cp360_screens_v1")}</div>
                <div className="cardAction">Manage Screens</div>
              </button>
              <button className="card" onClick={() => setActiveView("playlists")}>
                <div className="cardTitle">PLAYLISTS</div>
                <div className="cardNumber">{countFromLS("cp360_playlists_v2")}</div>
                <div className="cardAction">Manage Playlists</div>
              </button>
              <button className="card" onClick={() => setActiveView("layouts")}>
                <div className="cardTitle">LAYOUTS</div>
                <div className="cardNumber">{countFromLS("cp360_layouts_v1")}</div>
                <div className="cardAction">Manage Layouts</div>
              </button>
            </div>

            {/* Flow guide */}
            <div className="cmsFlowBanner">
              <span className="cmsFlowStep" onClick={() => setActiveView("contents")}>① Contents</span>
              <span className="cmsFlowArrow">→</span>
              <span className="cmsFlowStep" onClick={() => setActiveView("layouts")}>② Layouts</span>
              <span className="cmsFlowArrow">→</span>
              <span className="cmsFlowStep" onClick={() => setActiveView("playlists")}>③ Playlists</span>
              <span className="cmsFlowArrow">→</span>
              <span className="cmsFlowStep" onClick={() => setActiveView("campaigns")}>④ Campaigns</span>
              <span className="cmsFlowArrow">→</span>
              <span className="cmsFlowStep" onClick={() => setActiveView("screens")}>⑤ Screens</span>
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
                        .map((c: any) => ({
                          title: c.name,
                          start: c.startDate,
                          end: c.endDate,
                        }));
                    } catch { return []; }
                  })()}
                />
              </div>
            </div>
          </div>
        );

      case "campaigns":
        return (
          <Campaigns
            playlists={playlistRefs}
            onNavigateHome={handleHome}
          />
        );

      case "screens":
        return (
          <Screens
            campaigns={campaignRefs}
            onNavigateHome={handleHome}
          />
        );

      case "contents":
        return (
          <Contents
            initialTab="all"
            onNavigate={(view) => setActiveView(view as any)}
            onMediaItemsChange={(items: ContentsMediaItem[]) => {
              setAllMedia(items.map((m) => ({ id: m.id, type: m.type as any, title: m.title, src: m.src })));
            }}
          />
        );

      case "playlists":
        return (
          <Playlists
            mediaLibrary={allMedia}
            onNavigateHome={handleHome}
          />
        );

      case "layouts":
        return (
          <Layouts
            mediaLibrary={allMedia}
            onUseLayout={(layout) => setActiveLayout(layout)}
            onNavigateHome={handleHome}
          />
        );

      case "accounts":
        return <Accounts activeTab="accounts" onNavigate={(view) => setActiveView(view)} />;
      case "manageUsers":
        return <Accounts activeTab="manageUsers" onNavigate={(view) => setActiveView(view)} />;
      case "manageLocations":
        return <Accounts activeTab="manageLocations" onNavigate={(view) => setActiveView(view)} />;
      case "manageOrganizations":
        return <Accounts activeTab="manageOrganizations" onNavigate={(view) => setActiveView(view)} />;

      case "player":
        return <Player />;

      case "user":
        return (
          <div className="UserHome">
            <div className="topRow">
              <h1 className="pageTitle">User Information</h1>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // ── Sidebar ───────────────────────────────────────────────────────────────────
  return (
    <div className="dashboardRoot">
      <aside className="sidebar">
        <div className="sidebarTop">
          <img src={logo} alt="CP360 Logo" className="sidebarLogo" />
        </div>

        <nav className="sidebarNav">
          <button className={`navItem ${activeView === "dashboard" ? "active" : ""}`}
            onClick={() => { setIsCampaignsOpen(false); setIsAccountsOpen(false); setActiveView("dashboard"); }}>
            <i className="bi bi-grid"></i> <span className="userSize">DASHBOARD</span>
          </button>

          <button className={`navItem ${activeView === "campaigns" ? "active" : ""}`}
            onClick={() => { setIsCampaignsOpen(false); setIsAccountsOpen(false); setActiveView("campaigns"); }}>
            <i className="bi bi-flag"></i> <span className="userSize">CAMPAIGNS</span>
          </button>

          <button className={`navItem ${activeView === "screens" ? "active" : ""}`}
            onClick={() => { setIsCampaignsOpen(false); setIsAccountsOpen(false); setActiveView("screens"); }}>
            <i className="bi bi-laptop"></i> <span className="userSize">SCREENS</span>
          </button>

          <button className={`navItem ${activeView === "contents" ? "active" : ""}`}
            onClick={() => { setIsCampaignsOpen(false); setIsAccountsOpen(false); setActiveView("contents"); }}>
            <i className="bi bi-file-earmark"></i> <span className="userSize">CONTENTS</span>
          </button>

          <button className={`navItem ${activeView === "playlists" ? "active" : ""}`}
            onClick={() => { setIsCampaignsOpen(false); setIsAccountsOpen(false); setActiveView("playlists"); }}>
            <i className="bi bi-collection-play"></i> <span className="userSize">PLAYLISTS</span>
          </button>

          <button className={`navItem ${activeView === "layouts" ? "active" : ""}`}
            onClick={() => { setIsCampaignsOpen(false); setIsAccountsOpen(false); setActiveView("layouts"); }}>
            <i className="bi bi-grid-1x2"></i> <span className="userSize">LAYOUTS</span>
          </button>

          <button className={`navItem ${activeView === "accounts" || activeView === "manageUsers" || activeView === "manageOrganizations" ? "active" : ""}`}
            onClick={() => { setIsCampaignsOpen(false); setIsAccountsOpen((s) => !s); setActiveView("accounts"); }}>
            <i className="bi bi-person-rolodex"></i> <span className="userSize">ACCOUNTS</span>
          </button>

          {isAccountsOpen && (
            <div className="submenu">
              <button className={`submenuItem ${activeView === "manageUsers" ? "active" : ""}`}
                onClick={() => setActiveView("manageUsers")}>Manage Users</button>
            </div>
          )}
          {isAccountsOpen && (
            <div className="submenu">
              <button className={`submenuItem ${activeView === "manageOrganizations" ? "active" : ""}`}
                onClick={() => setActiveView("manageOrganizations")}>Manage Organizations</button>
            </div>
          )}
          {isAccountsOpen && (
            <div className="submenu">
              <button className={`submenuItem ${activeView === "manageLocations" ? "active" : ""}`}
                onClick={() => setActiveView("manageLocations")}>Manage Locations
                </button>
            </div>
          )}
        </nav>

        <button className={`navItem ${activeView === "player" ? "active" : ""}`}
          onClick={() => { setIsCampaignsOpen(false); setIsAccountsOpen(false); setActiveView("player"); }}>
          <i className="bi bi-tv"></i> <span className="userSize">PLAYER</span>
        </button>

        <button className={`navItem ${activeView === "user" ? "active" : ""}`}
          onClick={() => { setIsCampaignsOpen(false); setIsAccountsOpen(false); setActiveView("user"); }}>
          <i className="bi bi-person-circle"></i> <span className="userSize">USER</span>
        </button>

        <div className="sidebarBottom">
          <button className="logoutBtn" onClick={handleLogout}>Logout</button>
        </div>
      </aside>

      <main className="mainArea">{renderMain()}</main>
    </div>
  );
};

export default Dashboard;
