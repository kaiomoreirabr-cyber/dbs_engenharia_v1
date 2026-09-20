import { NavLink } from "react-router-dom";
import { NAV_TABS } from "./navTabs";

export default function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Navegação principal">
      {NAV_TABS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) => `bottom-nav-item${isActive ? " is-active" : ""}`}
        >
          <Icon size={22} strokeWidth={2.1} aria-hidden="true" />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
