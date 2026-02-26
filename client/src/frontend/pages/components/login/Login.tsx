
import React, { useState } from "react";
import "/src/frontend/styles/login.css";
import logo from "/src/frontend/images/lg_cp360_white.png";
import "bootstrap/dist/css/bootstrap.min.css";
// import { Link } from "react-router-dom";



interface LoginCardProps {
  onLoginSuccess: () => void;
}

const LoginCard: React.FC<LoginCardProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    if (username === "bonn" && password === "123") {
      onLoginSuccess();
    } else if (username === "bonn" && password !== "123") {
      alert("Invalid username or password. Please try again.");
    } else {
      alert("Please provide valid credentials.");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  return (
    <div className="loginWrapper">
      <div className="loginCard">
        <div className="logo">
          <img src={logo} alt="CP360-Logo" />
        </div>


        <form className="login-form">
            <h4 className="login-title">Welcome to CP360!</h4 >

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
            <button className="login-button" onClick={handleLogin}>
            LOGIN
            </button>
        
        </form>
            {/* <Link to="/register">Don't have an account? Register here</Link> */}
         </div> 
    </div>
  );
};

export default LoginCard;