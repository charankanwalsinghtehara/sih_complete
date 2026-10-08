import {
  Activity,
  Blocks,
  BookOpen,
  CheckCircle2,
  FileText,
  LayoutDashboard,
  Network,
  ShieldCheck,
  X
} from "lucide-react";

function Sidebar({
  activePage,
  onNavigate,
  mobileOpen
}) {
  const navigation = [
    {
      id: "dashboard",
      label: "Dashboard",
      description: "System overview",
      icon: LayoutDashboard
    },
    {
      id: "documents",
      label: "Documents",
      description: "Add & manage",
      icon: FileText
    },
    {
      id: "verification",
      label: "Verification",
      description: "Check integrity",
      icon: ShieldCheck
    },
    {
      id: "blockchain",
      label: "Blockchain",
      description: "View ledger",
      icon: Blocks
    },
    {
      id: "network",
      label: "Network",
      description: "Validator status",
      icon: Network
    },
    {
      id: "documentation",
      label: "Documentation",
      description: "Guides & reference",
      icon: BookOpen
    }
  ];

  return (
    <aside
      className={`sidebar ${
        mobileOpen
          ? "sidebar-mobile-open"
          : ""
      }`}
    >
      <div className="sidebar-brand">
        <div className="brand-logo">
          <ShieldCheck size={23} />
        </div>

        <div className="brand-copy">
          <div className="brand-name">
            SecureTrace
          </div>

          <div className="brand-tagline">
            EVIDENCE MANAGEMENT
          </div>
        </div>

        <button
          className="mobile-close"
          onClick={() => onNavigate(activePage)}
          aria-label="Close menu"
        >
          <X size={19} />
        </button>
      </div>

      <div className="sidebar-system">
        <span className="pulse-dot" />

        <div>
          <strong>
            Workspace ready
          </strong>

          <span>
            Local-first workspace
          </span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-label">
          MAIN MENU
        </div>

        {navigation.map((item) => {
          const Icon = item.icon;

          const active =
            activePage === item.id;

          return (
            <button
              key={item.id}
              className={`nav-item ${
                active
                  ? "nav-item-active"
                  : ""
              }`}
              onClick={() =>
                onNavigate(item.id)
              }
            >
              <span className="nav-icon">
                <Icon size={18} />
              </span>

              <span className="nav-content">
                <strong>
                  {item.label}
                </strong>

                <small>
                  {item.description}
                </small>
              </span>

              {active && (
                <span className="nav-active-line" />
              )}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-security">
        <div className="security-icon">
          <Activity size={17} />
        </div>

        <div>
          <strong>
            Integrity checks
          </strong>

          <span>
            SHA-256 enabled
          </span>
        </div>
      </div>

      <div className="sidebar-footer">
        <span>
          SECURETRACE
        </span>

        <span>
          v0.7.0
        </span>
      </div>
    </aside>
  );
}

export default Sidebar;