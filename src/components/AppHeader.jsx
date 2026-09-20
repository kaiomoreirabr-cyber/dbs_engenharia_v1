import { NavLink } from "react-router-dom";
import { LogOut } from "lucide-react";
import { NAV_TABS } from "./navTabs";
import { useAuth } from "../context/AuthContext";

export default function AppHeader() {
  const { signOut } = useAuth();

  return (
    <header className="app-header">
      <div className="app-header-brand">
        <img src="/logo-dbs.png" alt="DBS Engenharia" className="app-header-logo" />
        <div className="app-header-brand-text">
          <span className="app-header-name">DBS Engenharia</span>
          <span className="app-header-tagline">Frequência</span>
        </div>
      </div>

      <div className="app-header-right">
        <nav className="app-header-nav" aria-label="Navegação principal">
          {NAV_TABS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `app-header-nav-item${isActive ? " is-active" : ""}`}
            >
              <Icon size={16} strokeWidth={2.2} aria-hidden="true" />
              <span>{label.toUpperCase()}</span>
            </NavLink>
          ))}
        </nav>

        <button type="button" className="app-header-logout" onClick={signOut} aria-label="Sair" title="Sair do app">
          <LogOut size={16} strokeWidth={2.2} aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
