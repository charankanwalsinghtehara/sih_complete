import { useState } from "react";

import Sidebar from "./components/Sidebar";
import Header from "./components/Header";

import Dashboard from "./pages/Dashboard";
import Documents from "./pages/Documents";
import Verification from "./pages/Verification";
import Blockchain from "./pages/Blockchain";
import Network from "./pages/Network";
import Documentation from "./pages/Documentation";

function App() {
  const [activePage, setActivePage] =
    useState("dashboard");

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const navigate = (page) => {
    setActivePage(page);
    setSidebarOpen(false);
  };

  const renderPage = () => {
    switch (activePage) {
      case "documents":
        return (
          <Documents
            onNavigate={navigate}
          />
        );

      case "verification":
        return (
          <Verification
            onNavigate={navigate}
          />
        );

      case "blockchain":
        return <Blockchain />;

      case "network":
        return <Network />;

      case "documentation":
        return <Documentation />;

      default:
        return (
          <Dashboard
            onNavigate={navigate}
          />
        );
    }
  };

  return (
    <div className="app-shell">
      <Sidebar
        activePage={activePage}
        onNavigate={navigate}
        mobileOpen={sidebarOpen}
      />

      {sidebarOpen && (
        <div
          className="mobile-overlay"
          onClick={() =>
            setSidebarOpen(false)
          }
        />
      )}

      <div className="main-area">
        <Header
          onMenuClick={() =>
            setSidebarOpen(true)
          }
        />

        <main className="page-content">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

export default App;