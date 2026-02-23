import React, { useState } from "react";
import "/src/frontend/styles/dashboard.css";
import "/src/frontend/styles/accounts.css";
import "/src/frontend/styles/contents.css";
import "/src/frontend/styles/layouts.css";
import "/src/frontend/styles/stage.css";

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

interface DashboardProps {
  onLogout: () => void;
}

type Props = {
  onNavigate: (
    view:
      | "dashboard"
      | "campaigns"
      | "contents"
      | "screens"
      | "playlists"
      | "accounts"
      | "layouts"
      | "user"
      | "manageUsers"
      | "manageOrganizations"
  ) => void;
};

const Dashboard: React.FC<DashboardProps & Props> = ({ onLogout, onNavigate }) => {
  const [isCampaignsOpen, setIsCampaignsOpen] = useState(false);
  const [isAccountsOpen, setIsAccountsOpen] = useState(false);
  const [activeLayout, setActiveLayout] = useState<Layout | null>(null);
  const [allMedia, setAllMedia] = useState<MediaItem[]>([]);

  const [activeView, setActiveView] = useState<
    | "dashboard"
    | "accounts"
    | "manageUsers"
    | "manageOrganizations"
    | "campaigns"
    | "createCampaign"
    | "screens"
    | "contents"
    | "playlists"
    | "layouts"
    | "user"
  >("dashboard");

  const isHome = activeView === "dashboard";

  const handleLogout = () => onLogout();

  const handleHome = () => {
    setIsCampaignsOpen(false);
    setIsAccountsOpen(false);
    setActiveView("dashboard");
    onNavigate("dashboard");
  };

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
                <div className="cardNumber">0</div>
                <div className="cardAction">Add Campaigns</div>
              </button>

              <button className="card" onClick={() => setActiveView("contents")}>
                <div className="cardTitle">CONTENTS</div>
                <div className="cardNumber">0</div>
                <div className="cardAction">Add Contents</div>
              </button>

              <button className="card" onClick={() => setActiveView("screens")}>
                <div className="cardTitle">SCREENS</div>
                <div className="cardNumber">0</div>
                <div className="cardAction">Add Screens</div>
              </button>

              <button className="card" onClick={() => setActiveView("playlists")}>
                <div className="cardTitle">PLAYLISTS</div>
                <div className="cardNumber">0</div>
                <div className="cardAction">Add Playlists</div>
              </button>

              <button className="card" onClick={() => setActiveView("layouts")}>
                <div className="cardTitle">LAYOUTS</div>
                <div className="cardNumber">0</div>
                <div className="cardAction">Manage Layouts</div>
              </button>
            </div>

            

            <div className="calendarSection">
              <h2 className="calendarTitle">Schedules:</h2>

              <div className="calendarCard">
                <FullCalendar
                  plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                  initialView="dayGridMonth"
                  headerToolbar={{
                    left: "prev,next today",
                    center: "title",
                    right: "dayGridMonth,timeGridWeek,timeGridDay",
                  }}
                  height="400px"
                  events={[
                    {
                      title: "Campaign A",
                      start: "2026-02-12T10:00:00",
                      end: "2026-02-12T12:00:00",
                      description:
                        "Campaign A scheduled from 10 AM to 12 PM. Please do not end it early.",
                    },
                    { title: "Screen Rotation", date: "2026-02-14" },
                  ]}
                />
              </div>
            </div>
          </div>
        );

      case "campaigns":
        return (
          <div className="CampaignsHome">
            <div className="topRow">
              {!isHome && (
                <button className="homeButton" onClick={handleHome}>
                  HOME
                </button>
              )}
              <h1 className="campaignsTitle">Campaigns</h1>

              <div className="topActions">
                <input className="searchInput" placeholder="Search campaign title or name" />
                <button className="addCampaignBtn">+ ADD A CAMPAIGN</button>
              </div>
            </div>

            <div className="viewPage">
              <h2>No campaigns available yet.</h2>
            </div>
          </div>
        );

      case "createCampaign":
        return (
          <div className="viewPage">
            <h2>Create Campaign</h2>
          </div>
        );

      case "screens":
        return (
          <div className="ScreensHome">
            <div className="topRow">
              {!isHome && (
                <button className="homeButton" onClick={handleHome}>
                  HOME
                </button>
              )}
              <h1 className="screensTitle">Screens</h1>
              <div className="topActions">
                <input className="searchInput" placeholder="Search screen title or name" />
                <button className="addCampaignBtn">+ ADD A SCREEN</button>
              </div>
            </div>

            <div className="viewPage">
              <h2>No screens available yet.</h2>
            </div>
          </div>
        );

      case "contents":
        return (
          <Contents
            initialTab="all"
            onNavigate={(view) => setActiveView(view as any)}
            onMediaItemsChange={(items: ContentsMediaItem[]) => {
              // ✅ Keep consistent shape for Layouts/Stage
              setAllMedia(
                items.map((m) => ({
                  id: m.id,
                  type: m.type as any,
                  title: m.title,
                  src: m.src,
                }))
              );
            }}
          />
        );

      case "accounts":
        return <Accounts activeTab="accounts" onNavigate={(view) => setActiveView(view)} />;

      case "manageUsers":
        return <Accounts activeTab="manageUsers" onNavigate={(view) => setActiveView(view)} />;

      case "manageOrganizations":
        return <Accounts activeTab="manageOrganizations" onNavigate={(view) => setActiveView(view)} />;

      case "layouts":
        return (
          <Layouts
            mediaLibrary={allMedia}
            onUseLayout={(layout) => setActiveLayout(layout)}
            onNavigateHome={handleHome}
          />
        );

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

  return (
    <div className="dashboardRoot">
      <aside className="sidebar">
        <div className="sidebarTop">
          <img src={logo} alt="CP360 Logo" className="sidebarLogo" />
        </div>

        <nav className="sidebarNav">
          <button
            className={`navItem ${activeView === "dashboard" ? "active" : ""}`}
            onClick={() => {
              setIsCampaignsOpen(false);
              setIsAccountsOpen(false);
              setActiveView("dashboard");
            }}
          >
            <i className="bi bi-grid"></i> <span className="userSize">DASHBOARD</span>
          </button>

          <button
            className={`navItem ${
              activeView === "campaigns" || activeView === "createCampaign" ? "active" : ""
            }`}
            onClick={() => {
              setIsCampaignsOpen((s) => !s);
              setIsAccountsOpen(false);
              setActiveView("campaigns");
            }}
          >
            <i className="bi bi-flag"></i> <span className="userSize">CAMPAIGNS</span>
          </button>

          {isCampaignsOpen && (
            <div className="submenu">
              <button
                className={`submenuItem ${activeView === "createCampaign" ? "active" : ""}`}
                onClick={() => setActiveView("createCampaign")}
              >
                Create Campaign
              </button>
            </div>
          )}

          <button
            className={`navItem ${activeView === "screens" ? "active" : ""}`}
            onClick={() => {
              setIsCampaignsOpen(false);
              setIsAccountsOpen(false);
              setActiveView("screens");
            }}
          >
            <i className="bi bi-laptop"></i> <span className="userSize">SCREENS</span>
          </button>

          <button
            className={`navItem ${activeView === "contents" ? "active" : ""}`}
            onClick={() => {
              setIsCampaignsOpen(false);
              setIsAccountsOpen(false);
              setActiveView("contents");
            }}
          >
            <i className="bi bi-file-earmark"></i> <span className="userSize">CONTENTS</span>
          </button>

          <button
            className={`navItem ${activeView === "playlists" ? "active" : ""}`}
            onClick={() => {
              setIsCampaignsOpen(false);
              setIsAccountsOpen(false);
              setActiveView("playlists");
            }}
          >
            <i className="bi bi-collection-play"></i> <span className="userSize">PLAYLISTS</span>
          </button>

          <button
            className={`navItem ${activeView === "layouts" ? "active" : ""}`}
            onClick={() => {
              setIsCampaignsOpen(false);
              setIsAccountsOpen(false);
              setActiveView("layouts");
            }}
          >
            <i className="bi bi-grid-1x2"></i> <span className="userSize">LAYOUTS</span>
          </button>

          <button
            className={`navItem ${
              activeView === "accounts" ||
              activeView === "manageUsers" ||
              activeView === "manageOrganizations"
                ? "active"
                : ""
            }`}
            onClick={() => {
              setIsCampaignsOpen(false);
              setIsAccountsOpen((s) => !s);
              setActiveView("accounts");
            }}
          >
            <i className="bi bi-person-rolodex"></i> <span className="userSize">ACCOUNTS</span>
          </button>

          {isAccountsOpen && (
            <div className="submenu">
              <button
                className={`submenuItem ${activeView === "manageUsers" ? "active" : ""}`}
                onClick={() => setActiveView("manageUsers")}
              >
                Manage Users
              </button>
            </div>
          )}

          {isAccountsOpen && (
            <div className="submenu">
              <button
                className={`submenuItem ${activeView === "manageOrganizations" ? "active" : ""}`}
                onClick={() => setActiveView("manageOrganizations")}
              >
                Manage Organizations
              </button>
            </div>
          )}
        </nav>

        <button
          className={`navItem ${activeView === "user" ? "active" : ""}`}
          onClick={() => {
            setIsCampaignsOpen(false);
            setIsAccountsOpen(false);
            setActiveView("user");
          }}
        >
          <i className="bi bi-person-circle"></i> <span className="userSize">USER</span>
        </button>

        <div className="sidebarBottom">
          <button className="logoutBtn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </aside>

      <main className="mainArea">{renderMain()}</main>
    </div>
  );
};

export default Dashboard;