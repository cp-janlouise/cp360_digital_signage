import React from "react";
import ManageOrganizations from "./Organizations";
import ManageLocations from "./Locations";
import ManageUsers from "./Users";
import '/src/frontend/styles/organizations.css';
import '/src/frontend/styles/locations.css';

type Props = {
  activeTab: "manageUsers" | "manageOrganizations" | "accounts" | "manageLocations";
  onNavigate: (
    view: "dashboard" | "accounts" | "manageUsers" | "manageOrganizations" | "manageLocations"
  ) => void;
};

const Accounts: React.FC<Props> = ({ activeTab, onNavigate }) => {
  const isHome = activeTab === "accounts";

  return (
    <div className="accountsHome">
      <div className="accountHead">ACCOUNTS</div>
      {isHome && (
        <div className="accountsTab">
          <div className="accountCardsGrid">
          <button className="accountChoiceCard" onClick={() => onNavigate("manageUsers")}>
            <h3>Manage Users</h3>
            <p>Add, view, and manage user accounts.</p>
          </button>

          <button
            className="accountChoiceCard"
            onClick={() => onNavigate("manageOrganizations")}
          >
            <h3>Manage Organizations</h3>
            <p>View and manage organizations.</p>
          </button>

          <button className="accountChoiceCard" onClick={() => onNavigate("manageLocations")}>
            <h3>Manage Locations</h3>
            <p>View and manage locations.</p>
          </button>
        </div>
      </div>
      )}
      

      {activeTab === "manageUsers" &&  (
        <ManageUsers onBack={() => onNavigate("accounts")} /> )}

      {activeTab === "manageOrganizations" && (
        <ManageOrganizations onBack={() => onNavigate("accounts")} />
      )}

      {activeTab === "manageLocations" && (
        <ManageLocations onBack={() => onNavigate("accounts")} />
      )}
    </div>
  );
};

export default Accounts;
