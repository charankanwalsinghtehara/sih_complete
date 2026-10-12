import { useEffect, useState } from "react";

import Sidebar from "./components/Sidebar";
import Header from "./components/Header";

import Dashboard from "./pages/Dashboard";
import Documents from "./pages/Documents";
import Verification from "./pages/Verification";
import Blockchain from "./pages/Blockchain";
import Network from "./pages/Network";
import Documentation from "./pages/Documentation";

import { getCurrentUser, loginUser, signupUser } from "./services/api";

const adminNavigation = [
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
  },
  {
    id: "blockchain",
    label: "Blockchain",
    description: "View ledger",
    icon: "blockchain"
  },
  {
    id: "network",
    label: "Network",
    description: "Validator status",
    icon: "network"
  },
  {
    id: "documentation",
    label: "Documentation",
    description: "Guides & reference",
    icon: "documentation"
  }
];

const userNavigation = [
  {
    id: "dashboard",
    label: "Dashboard",
    description: "Overview",
    icon: "dashboard"
  },
  {
    id: "verification",
    label: "Verify",
    description: "Check evidence",
    icon: "verification"
  },
  {
    id: "documents",
    label: "Documents",
    description: "My records",
    icon: "documents"
  }
];

function App() {
  const [token, setToken] = useState(() => localStorage.getItem("securetrace_jwt") || "");
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem("securetrace_user");
    if (!saved) return null;

    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  });

  const [selectedPanel, setSelectedPanel] = useState(
    () => {
      const savedUser = localStorage.getItem("securetrace_user");

      if (!savedUser) {
        return null;
      }

      try {
        const user = JSON.parse(savedUser);
        return user?.role === "admin" ? "admin" : "user";
      } catch {
        return null;
      }
    }
  );

  const [activePage, setActivePage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      localStorage.removeItem("securetrace_jwt");
      return;
    }

    localStorage.setItem("securetrace_jwt", token);
  }, [token]);

  useEffect(() => {
    if (!currentUser) {
      localStorage.removeItem("securetrace_user");
      return;
    }

    localStorage.setItem("securetrace_user", JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    if (!token) {
      return;
    }

    getCurrentUser().then((response) => {
      if (response?.user) {
        setCurrentUser(response.user);
        setSelectedPanel(response.user.role === "admin" ? "admin" : "user");
      }
    }).catch(() => {
      localStorage.removeItem("securetrace_jwt");
      localStorage.removeItem("securetrace_user");
      setToken("");
      setCurrentUser(null);
      setSelectedPanel(null);
    });
  }, [token]);

  const currentNavigation =
    selectedPanel === "user"
      ? userNavigation
      : adminNavigation;

  const handleAuthSubmit = async (formValues) => {
    setAuthLoading(true);
    setAuthError("");

    try {
      const response =
        authMode === "login"
          ? await loginUser(formValues)
          : await signupUser(formValues);

      setToken(response.token);
      setCurrentUser(response.user);
      setSelectedPanel(response.user.role === "admin" ? "admin" : "user");
      setActivePage(response.user.role === "admin" ? "dashboard" : "verification");
    } catch (error) {
      setAuthError(error.message || "Authentication failed");
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = () => {
    setToken("");
    setCurrentUser(null);
    setSelectedPanel(null);
    setAuthMode("login");
  };

  const navigate = (page) => {
    const allowedPages = currentNavigation.map((item) => item.id);
    const safePage = allowedPages.includes(page) ? page : allowedPages[0];
    setActivePage(safePage);
    setSidebarOpen(false);
  };

  const renderPage = () => {
    switch (activePage) {
      case "documents":
        return <Documents onNavigate={navigate} />;
      case "verification":
        return <Verification onNavigate={navigate} />;
      case "blockchain":
        return <Blockchain />;
      case "network":
        return <Network />;
      case "documentation":
        return <Documentation />;
      default:
        return <Dashboard onNavigate={navigate} />;
    }
  };

  if (!token || !currentUser) {
    return (
      <AuthScreen
        authMode={authMode}
        setAuthMode={setAuthMode}
        authError={authError}
        authLoading={authLoading}
        onSubmit={handleAuthSubmit}
      />
    );
  }

  return (
    <div className="app-shell">
      <Sidebar
        activePage={activePage}
        onNavigate={navigate}
        mobileOpen={sidebarOpen}
        navigation={currentNavigation}
        brandName={selectedPanel === "user" ? "User Portal" : "Admin Console"}
      />

      {sidebarOpen && (
        <div className="mobile-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="main-area">
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          panelLabel={selectedPanel === "user" ? "User workspace" : "Admin workspace"}
          onSwitchPanel={logout}
          switchLabel="Logout"
        />

        <main className="page-content">{renderPage()}</main>
      </div>
    </div>
  );
}

function AuthScreen({ authMode, setAuthMode, authError, authLoading, onSubmit }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "user"
  });

  const handleInput = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (authMode === "login") {
      onSubmit({ email: form.email, password: form.password });
      return;
    }

    onSubmit({
      name: form.name,
      email: form.email,
      password: form.password,
      role: form.role
    });
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-kicker">SECURETRACE</div>
          <h1>{authMode === "login" ? "Welcome back" : "Create an account"}</h1>
          <p>
            {authMode === "login"
              ? "Sign in to continue to your SecureTrace workspace."
              : "Register to access the protected evidence system."}
          </p>
        </div>

        <div className="auth-tabs">
          <button
            type="button"
            className={authMode === "login" ? "auth-tab active" : "auth-tab"}
            onClick={() => setAuthMode("login")}
          >
            Login
          </button>
          <button
            type="button"
            className={authMode === "signup" ? "auth-tab active" : "auth-tab"}
            onClick={() => setAuthMode("signup")}
          >
            Sign up
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {authMode === "signup" && (
            <>
              <label className="auth-field">
                <span>Name</span>
                <input name="name" value={form.name} onChange={handleInput} placeholder="John Doe" required />
              </label>

              <label className="auth-field">
                <span>Role</span>
                <select name="role" value={form.role} onChange={handleInput}>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </label>
            </>
          )}

          <label className="auth-field">
            <span>Email</span>
            <input name="email" type="email" value={form.email} onChange={handleInput} placeholder="you@example.com" required />
          </label>

          <label className="auth-field">
            <span>Password</span>
            <input name="password" type="password" value={form.password} onChange={handleInput} placeholder="••••••••" required minLength={6} />
          </label>

          {authError && <div className="auth-error">{authError}</div>}

          <button type="submit" className="auth-submit" disabled={authLoading}>
            {authLoading ? "Please wait..." : authMode === "login" ? "Login" : "Create account"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default App;