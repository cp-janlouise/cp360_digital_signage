import { useState } from "react";
import LoginCard from "./frontend/pages/components/login/Login";
import Dashboard from "./frontend/pages/components/dashboard/Dashboard";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return isLoggedIn ? (
    <Dashboard onLogout={() => setIsLoggedIn(false)} />
  ) : (
    <LoginCard onLoginSuccess={() => setIsLoggedIn(true)} />
  );
}

export default App;
