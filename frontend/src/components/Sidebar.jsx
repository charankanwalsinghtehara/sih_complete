import {
  Activity,
  Blocks,
  BookOpen,
  FileText,
  LayoutDashboard,
  Network,
  ShieldCheck,
  X
} from "lucide-react";

const iconMap = {
  dashboard: LayoutDashboard,
  documents: FileText,
  verification: ShieldCheck,
  blockchain: Blocks,
  network: Network,
  documentation: BookOpen
};

function Sidebar({
  activePage,
  onNavigate,
  mobileOpen,
  navigation,
  brandName = "SecureTrace"
}) {
  const navItems = navigation || [
    {
      id: "dashboard",
      label: "Dashboard",
      description: "System overview",
      icon: "dashboard"
    },
    {
      id: "documents",
      label: "Documents",
      description: "Add & manage",
      icon: "documents"
    },
    {
      id: "verification",
      label: "Verification",
      description: "Check integrity",
      icon: "verification"
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
            {brandName}
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

        {navItems.map((item) => {
          const Icon = iconMap[item.icon] || ShieldCheck;
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