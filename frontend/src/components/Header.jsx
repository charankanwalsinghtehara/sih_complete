import {
  Bell,
  Menu,
  ShieldCheck
} from "lucide-react";

import { useEffect, useState } from "react";

import { checkHealth } from "../services/api";

function Header({
  onMenuClick
}) {
  const [backendOnline, setBackendOnline] =
    useState(false);

  useEffect(() => {
    let mounted = true;

    checkHealth().then((result) => {
      if (mounted) {
        setBackendOnline(
          result.online
        );
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <header className="top-header">
      <div className="header-left">
        <button
          className="mobile-menu-button"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu size={21} />
        </button>

        <div>
          <div className="header-eyebrow">
            EVIDENCE WORKSPACE
          </div>

          <div className="header-title">
            Evidence integrity
          </div>
        </div>
      </div>

      <div className="header-right">
        <div className="header-connection">
          <span
            className={`connection-dot ${
              backendOnline
                ? "connection-online"
                : ""
            }`}
          />

          <div>
            <strong>
              {backendOnline
                ? "Service connected"
                : "Demo Mode"}
            </strong>

            <span>
              {backendOnline
                ? "API is responding"
                : "Using local demo data"}
            </span>
          </div>
        </div>

        <button
          className="header-icon-button"
          aria-label="Notifications"
        >
          <Bell size={18} />
        </button>

        <div className="header-profile">
          <div className="profile-avatar">
            <ShieldCheck size={17} />
          </div>

          <div className="profile-text">
            <strong>
              Workspace
            </strong>

            <span>
              Local session
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;