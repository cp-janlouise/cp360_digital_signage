import React, { useState } from "react";
import "/src/frontend/styles/login.css";
import logo from "/src/frontend/images/lg_cp360_white.png";
import "bootstrap/dist/css/bootstrap.min.css";
import { type Role } from "../security/rolesConfig";

// ── Mock user accounts (replace with real API call later) ─────────────────────
const USERS: Record<string, { password: string; role: Role }> = {
  superadmin: { password: "admin123",   role: "superAdmin"     },
  admin:      { password: "admin123",   role: "admin"          },
  editor:     { password: "editor123",  role: "contentManager" },
  viewer:     { password: "viewer123",  role: "viewer"         },
  bonn:       { password: "123",        role: "superAdmin"     }, // existing account
};

interface LoginCardProps {
  onLoginSuccess: (role: Role) => void;
}

const LoginCard: React.FC<LoginCardProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");

  const handleLogin = () => {
    setError("");
    const key  = username.trim().toLowerCase();
    const user = USERS[key];

    if (!username || !password) {
      setError("Please enter your username and password.");
      return;
    }

    if (!user || user.password !== password) {
      setError("Invalid username or password. Please try again.");
      return;
    }

    onLoginSuccess(user.role);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <div className="loginWrapper">
      <div className="loginCard">
        <div className="logo">
          <img src={logo} alt="CP360-Logo" />
        </div>

        <form className="login-form" onSubmit={(e) => e.preventDefault()}>
          <h4 className="login-title">Welcome to CP360!</h4>

          {error && (
            <div style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#dc2626",
              padding: "8px 12px",
              borderRadius: "8px",
              fontSize: "13px",
              marginBottom: "10px",
              textAlign: "center",
            }}>
              {error}
            </div>
          )}

          <div className="username-input-group">
            <input
              className="username-input"
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyPress={handleKeyPress}
            />
          </div>

          <div className="password-input-group">
            <input
              className="password-input"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
            />
          </div>

          <button className="login-button" type="button" onClick={handleLogin}>
            LOGIN
          </button>

          {/* Dev hint — remove in production */}
          {/* <div style={{
            marginTop: "16px",
            padding: "10px 14px",
            background: "rgba(255,255,255,0.06)",
            borderRadius: "8px",
            fontSize: "11px",
            color: "rgba(255,255,255,0.45)",
            lineHeight: 1.8,
          }}>
            <div style={{ fontWeight: 700, marginBottom: "4px", color: "rgba(255,255,255,0.6)" }}>
              Demo accounts:
            </div>
            <div>superadmin / admin123 → Super Admin</div>
            <div>admin / admin123 → Administrator</div>
            <div>editor / editor123 → Content Manager</div>
            <div>viewer / viewer123 → Viewer / Auditor</div>
          </div> */}
        </form>
      </div>
    </div>
  );
};

export default LoginCard;
