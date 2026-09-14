import { NavLink } from "react-router-dom";
import { NAV_TABS } from "./navTabs";

// ALTERAÇÃO: arquivo novo. Barra fixa na parte de baixo da tela — é o que
// resolve o pedido de "navegar melhor entre uma página e outra no celular":
// os 5 destinos ficam sempre visíveis e a um toque de distância, com alvo
// de toque grande (o dedo não precisa acertar um botão pequeno), do jeito
// que apps de banco fazem. A partir de 900px de largura ela some — nas
// telas maiores a navegação passa a ficar em AppHeader.jsx, junto com a
// logo (ver esse arquivo), igual à referência que você mandou.
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
