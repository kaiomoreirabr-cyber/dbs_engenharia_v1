import { NavLink } from "react-router-dom";
import { LogOut } from "lucide-react";
import { NAV_TABS } from "./navTabs";
import { useAuth } from "../context/AuthContext";

// ALTERAÇÃO: arquivo novo — barra de topo com a logo da DBS Engenharia.
// Antes não existia NENHUMA marca da empresa no app (nem no celular, nem
// no desktop) — esse componente resolve isso: fica sempre visível, em
// qualquer tamanho de tela, sem depender de nenhuma media query que possa
// escondê-la. No celular mostra só a marca (a navegação continua embaixo,
// em BottomNav.jsx, sem mudar esse fluxo). A partir de 900px de largura,
// os 5 destinos também aparecem aqui do lado direito — igual à referência
// que você mandou — e a barra fixa de baixo (BottomNav) some, pra não
// duplicar a navegação.
export default function AppHeader() {
  // ALTERAÇÃO: bloco novo — botão de sair. Fica sempre visível (celular e
  // desktop), já que agora o app exige login (ver AuthContext.jsx).
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
