import React, { useState } from "react";
import "/src/frontend/styles/dashboard.css";
import logo from "/src/frontend/images/lg_cp360_white.png";
import "bootstrap/dist/css/bootstrap.min.css";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import 'bootstrap-icons/font/bootstrap-icons.css';
import Accounts from "../accounts/Accounts";

interface DashboardProps {
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  const [isCampaignsOpen, setIsCampaignsOpen] = useState(false);
  const [isContentsOpen, setIsContentsOpen] = useState(false);
  const [isAccountsOpen, setIsAccountsOpen] = useState(false);

  const [activeView, setActiveView] = useState<
    | "dashboard"
    | "accounts"
    | "manageUsers"
    | "manageOrganizations"
    | "campaigns"
    | "createCampaign"
    | "screens"
    | "contents"
    | "allMedia"
    | "images"
    | "videos"
    | "websiteUrl"
    | "music"
    | "playlists"
    | "layouts"
    | "user"
    | "addUser"
  >("dashboard");

  const handleLogout = () => onLogout();

  const renderMain = () => {
    switch (activeView) {
      case "dashboard":
        return (
          <div className="dashboardHome">
            <div className="topRow">
              <h1 className="pageTitle">Dashboard</h1>
              <div className="topActions">
                <input
                  className="searchInput"
                  placeholder="Search campaign title or name"
                />
              </div>
            </div>

            <div className="summaryCards">
              <div className="card">
                <div className="cardTitle">CAMPAIGNS</div>
                <div className="cardNumber">0</div>
                <div className="cardAction">Add Campaigns</div>
              </div>
              <div className="card">
                <div className="cardTitle">CONTENTS</div>
                <div className="cardNumber">0</div>
                <div className="cardAction">Add Contents</div>
              </div>
              <div className="card">
                <div className="cardTitle">SCREENS</div>
                <div className="cardNumber">0</div>
                <div className="cardAction">Add Screens</div>
              </div>
              <div className="card">
                <div className="cardTitle">PLAYLISTS</div>
                <div className="cardNumber">0</div>
                <div className="cardAction">Add Playlists</div>
              </div>
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
              { title: "Campaign A", start: "2026-02-12T10:00:00", 
                end: "2026-02-12T12:00:00", 
                description: "Campaign A scheduled from 10 AM to 12 PM. Please do not end it early." },
              { title: "Screen Rotation", 
                date: "2026-02-14" },
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
              <h1 className="pageTitle">Campaigns</h1>
              <div className="topActions">
                <input
                  className="searchInput"
                  placeholder="Search campaign title or name"
                />
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
              <h1 className="pageTitle">Screens</h1>
              <div className="topActions">
                <input
                  className="searchInput"
                  placeholder="Search screen title or name"
                />
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
          <div className="ContentsHome">
            <div className="topRow">
              <h1 className="pageTitle">Contents</h1>
              <div className="topActions">
                <input
                  className="searchInput"
                  placeholder="Search content title or name"
                />
                <button className="addCampaignBtn">+ ADD A CONTENT</button>
              </div>
            </div>
            <div className="viewPage">
              <h2>No contents available yet.</h2>
            </div>
          </div>
        );

        case "allMedia":
        return (
          <div className="content">
            <div className="viewPage">
              <div className="topRow">
                <h1 className="pageTitle">All Media</h1>
                <div className="topActions">
                  <input
                    className="searchInput"
                    placeholder="Search media title or name"
                  />
                </div>
              </div>
            </div>
          </div>
        );
      case "images":
        return (
          <div className="content">
            <div className="viewPage">
              <div className="topRow">
                <h1 className="pageTitle">Content</h1>
                <div className="topActions">
                  <input
                    className="searchInput"
                    placeholder="Search image title or name"
                  />
                </div>
              </div>
            </div>
            <div className="imagesContent"> IMAGES</div>
          </div>
        );

      case "videos":
        return (
          <div className="content">
            <div className="viewPage">
              <div className="topRow">
                <h1 className="pageTitle">Content</h1>
                <div className="topActions">
                  <input
                    className="searchInput"
                    placeholder="Search video title or name"
                  />
                </div>
              </div>
            </div>
            <div className="videosContent"> VIDEOS</div>
          </div>
        );
      case "websiteUrl":
        return (
          <div className="content">
            <div className="viewPage">
              <div className="topRow">
                <h1 className="pageTitle">Content</h1>
                <div className="topActions">
                  <input
                    className="searchInput"
                    placeholder="Search website URL title or name"
                  />
                </div>
              </div>
            </div>
            <div className="websiteUrlContent"> WEBSITE URLS</div>
          </div>
        );
      case "music":
        return (
          <div className="content">
            <div className="viewPage">
              <div className="topRow">
                <h1 className="pageTitle">Content</h1>
                <div className="topActions">
                  <input
                    className="searchInput"
                    placeholder="Search music title or name"
                  />
                </div>
              </div>
            </div>
            <div className="musicContent"> MUSIC</div>
          </div>
        );

      case "playlists":
        return (
          <div className="PlaylistsHome">
            <div className="topRow">
              <h1 className="pageTitle">Playlists</h1>
              <div className="topActions">
                <input
                  className="searchInput"
                  placeholder="Search playlist title or name"
                />
                <button className="addCampaignBtn">+ ADD A PLAYLIST</button>
              </div>
            </div>
            <div className="viewPage">
              <h2>No playlists available yet.</h2>
            </div>
          </div>
        );

        case "accounts":
        return <Accounts activeTab="accounts" onNavigate={(view) => setActiveView(view)} />;

        case "manageUsers":
        return <Accounts activeTab="manageUsers" onNavigate={(view) => setActiveView(view)} />;
        case "manageOrganizations":
        return <Accounts activeTab="manageOrganizations" onNavigate={(view) => setActiveView(view)} />; 

         

        case "layouts":
        return (
          <div className="LayoutsHome">
            <div className="topRow">
              <h1 className="pageTitle">Layouts</h1>
              <div className="topActions">
                <input
                  className="searchInput"
                  placeholder="Search layout title or name"
                />
                <button className="addCampaignBtn">+ ADD A LAYOUT</button>
              </div>
            </div>
            <div className="viewPage">
              <h2>No layouts available yet.</h2>
            </div>
          </div>
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
              setIsContentsOpen(false);
              setIsAccountsOpen(false);
              setActiveView("dashboard");
            }}
          >
            <i className="bi bi-grid"></i> <span className="userSize">DASHBOARD</span>
          </button>

          <button
            className={`navItem ${activeView === "campaigns" || activeView === "createCampaign" ? "active" : ""}`}
            onClick={() => {
              setIsCampaignsOpen((s) => !s);
              setIsContentsOpen(false);
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
              setIsContentsOpen(false);
              setIsAccountsOpen(false);
              setActiveView("screens");
            }}
          >
          <i className="bi bi-laptop"></i> <span className="userSize">SCREENS</span>

          </button>

          <button
            className={`navItem ${activeView === "contents" || activeView === "images" || activeView === "videos" || activeView === "websiteUrl" || activeView === "music" ? "active" : ""}`}
            onClick={() => {
              setIsCampaignsOpen(false);
              setIsContentsOpen((s) => !s);
              setIsAccountsOpen(false);
              setActiveView("contents");
            }}
          >
            <i className="bi bi-file-earmark"></i> <span className="userSize">CONTENTS</span>
          </button>

          {isContentsOpen && (
            <div className="submenu">
              <button
                className={`submenuItem ${activeView === "allMedia" ? "active" : ""}`}
                onClick={() => setActiveView("allMedia")}
              >
            <i className="bi bi-collection"></i> <span>ALL MEDIA</span>
              </button>
              <button
                className={`submenuItem ${activeView === "images" ? "active" : ""}`}
                onClick={() => setActiveView("images")}
              >
            <i className="bi bi-file-earmark-image"></i> <span>IMAGES</span>

              </button>
              <button
                className={`submenuItem ${activeView === "videos" ? "active" : ""}`}
                onClick={() => setActiveView("videos")}
              >
              <i className="bi bi-file-earmark-play"></i> <span>VIDEOS</span>
              </button>
              <button
                className={`submenuItem ${activeView === "websiteUrl" ? "active" : ""}`}
                onClick={() => setActiveView("websiteUrl")}
              >
              <i className="bi bi-globe"></i> <span>WEBSITE URL</span>
              </button>
              <button
                className={`submenuItem ${activeView === "music" ? "active" : ""}`}
                onClick={() => setActiveView("music")}
              >
              <i className="bi bi-file-earmark-music"></i> <span>MUSIC</span>
              </button>
            </div>
          )}

          <button
            className={`navItem ${activeView === "playlists" ? "active" : ""}`}
            onClick={() => {
              setIsCampaignsOpen(false);
              setIsContentsOpen(false);
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
              setIsContentsOpen(false);
              setIsAccountsOpen(false);
              setActiveView("layouts");
            }}
          >
             <i className="bi bi-grid-1x2"></i> <span className="userSize">LAYOUTS</span>
          </button> 
          <button
            className={`navItem ${activeView === "accounts" || activeView === "manageUsers" || activeView === "manageOrganizations" ? "active" : ""}`}
            onClick={() => {
              setIsCampaignsOpen(false);
              setIsContentsOpen(false);
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
            className={`navItem ${activeView === "user" ? "active" : ""}` }
            onClick={() => {
              setIsCampaignsOpen(false);
              setIsContentsOpen(false);
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
