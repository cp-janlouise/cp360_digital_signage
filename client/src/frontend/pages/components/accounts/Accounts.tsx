import React, { useMemo, useState } from "react";

type Role = "admin" | "tLeader";

type UserItem = {
  id: string;
  username: string;
  email: string;
  role: Role;
  createdAt: string;
};

type Props = {
  activeTab: "manageUsers" | "manageOrganizations" | "accounts" | "manageLocations";
  onNavigate: (view: "dashboard" | "accounts" | "manageUsers" | "manageOrganizations" | "manageLocations") => void;
};

const Accounts: React.FC<Props> = ({ activeTab, onNavigate }) => {
    const isHome = activeTab === "accounts";
  const [users, setUsers] = useState<UserItem[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    role: "tLeader" as Role,
  });
  const [showAddUser, setShowAddUser] = useState(false);

  const openAddUserModal = () => setShowAddUser(true);

  const closeAddUserModal = () => {
    setShowAddUser(false);
    setNewUser({ username: "", email: "", role: "tLeader" });
  };

  const saveUser = (e: React.FormEvent) => {
    e.preventDefault();

    const username = newUser.username.trim();
    const email = newUser.email.trim();

    if (!username || !email) {
      alert("Please fill in all fields.");
      return;
    }

    const exists = users.some(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );
    if (exists) {
      alert("Email already exists.");
      return;
    }

    const item: UserItem = {
      id: crypto.randomUUID(),
      username,
      email,
      role: newUser.role,
      createdAt: new Date().toISOString(),
    };

    setUsers((prev) => [item, ...prev]);
    closeAddUserModal();
  };

  const filteredUsers = useMemo(() => {
    const q = userSearch.toLowerCase();
    return users.filter(
      (u) =>
        u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
    );
  }, [users, userSearch]);

  return (
    <div className="accountsHome">
      <div className="topRow">
         {!isHome ? (
           <button className="backBtn" onClick={() => onNavigate("accounts")}>Back</button>
         ) : (
           <button className="homeButton" onClick={() => onNavigate("dashboard")}>Home</button>
         )}
        <h1 className="accountsPageTitle">Accounts</h1>
      </div>
        {isHome && (
            
        <div className="accountCardsGrid">
          <button className="accountChoiceCard" onClick={() => onNavigate("manageUsers")}>
            <h3>Manage Users</h3>
            <p>Add, view, and manage user accounts.</p>
          </button>

          <button className="accountChoiceCard" onClick={() => onNavigate("manageOrganizations")}>
            <h3>Manage Organizations</h3>
            <p>View and manage organizations.</p>
          </button>

          <button className="accountChoiceCard" onClick={() => onNavigate("manageLocations")}>
            <h3>Manage Locations</h3>
            <p>View and manage locations.</p>
          </button>
        </div>
      )}


        {activeTab === "manageUsers" && (
        <div className="ManageUsersHome">
          <div className="topRow">
            <h1 className="manageUserTitle">Manage Users</h1>
            <div className="topActions">
              <input
                className="searchInput"
                placeholder="Search user title or name"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
              />
                 <button className="addUserBtn" onClick={openAddUserModal}>
                + ADD A USER
              </button>
            </div>
          </div>

          <div className="viewPage">
            {filteredUsers.length === 0 ? (
              <h2>No users yet.</h2>
            ) : (
              <div className="usersTableWrap">
                <table className="usersTable">
                  <thead>
                    <tr>
                      <th>Username</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => (
                      <tr key={u.id}>
                        <td>{u.username}</td>
                        <td>{u.email}</td>
                        <td>{u.role === "admin" ? "Admin" : "Team Leader"}</td>
                        <td>{new Date(u.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {showAddUser && (
            <div className="modalOverlay" onClick={closeAddUserModal}>
              <div className="modalCard" onClick={(e) => e.stopPropagation()}>
                <div className="modalHeader">
                  <h2 className="modalTitle">Add User</h2>
                  <button className="modalCloseBtn" onClick={closeAddUserModal}>
                    ✕
                  </button>
                </div>

                <form onSubmit={saveUser} className="modalBody">
                  <label htmlFor="username">Username:</label>
                  <div></div>
                  <div className="inputGroupUsername">
                    <input
                      id="username"
                      type="text"
                      value={newUser.username}
                      onChange={(e) =>
                        setNewUser((p) => ({ ...p, username: e.target.value }))
                      }
                      placeholder="Enter username"
                    />
                  </div>

                  <label htmlFor="email">Email:</label>
                  <div className="inputGroupEmail">
                    
                    <input
                      id="email"
                      type="email"
                      value={newUser.email}
                      onChange={(e) =>
                        setNewUser((p) => ({ ...p, email: e.target.value }))
                      }
                      placeholder="Enter email"
                    />
                  </div>

                  <label htmlFor="role">Role:</label>
                  <div className="inputGroupRole">
                    
                    <select
                      id="role"
                      value={newUser.role}
                      onChange={(e) =>
                        setNewUser((p) => ({
                          ...p,
                          role: e.target.value as Role,
                        }))
                      }
                    >
                      <option value="admin">Admin</option>
                      <option value="tLeader">Team Leader</option>
                    </select>
                  </div>

                  <div className="modalFooter">
                    <button type="button" className="cancelBtn" onClick={closeAddUserModal}>
                      Cancel
                    </button>
                    <button type="submit" className="saveUserBtn">
                      Save User
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )
    }

      {activeTab === "manageOrganizations" && (
        <div className="ManageUsersHome">
          <div className="topRow">
            <h1 className="manageUserTitle">Manage Organizations</h1>
            <div className="topActions">
              <input
                className="searchInput"
                placeholder="Search organization title or name"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
              />
                 <button className="addUserBtn" onClick={openAddUserModal}>
                + ADD AN ORGANIZATION
              </button>
            </div>
          </div>
        <div className="viewPage">
          <h2>No organizations yet.</h2>
        </div>
        </div>
      )}

      {activeTab === "manageLocations" && (
        <div className="ManageUsersHome">
          <div className="topRow">
            <h1 className="manageUserTitle">Manage Locations</h1>
            <div className="topActions">
              <input
                className="searchInput"
                placeholder="Search location title or name"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
              />
                 <button className="addUserBtn" onClick={openAddUserModal}>
                + ADD A LOCATION
              </button>
            </div>
          </div>
        <div className="viewPage">
          <h2>No locations yet.</h2>
        </div>
        </div>
      )}
    </div>
  );
};

export default Accounts;
