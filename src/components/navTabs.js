import { Building2, CalendarCheck, Users, FileBarChart2, Palette } from "lucide-react";

// ALTERAÇÃO: arquivo novo — os 5 destinos de navegação, extraídos de
// BottomNav.jsx para uma lista única. Agora tanto a barra de baixo (celular)
// quanto a barra de cima nova (desktop, ver AppHeader.jsx) usam exatamente
// os mesmos itens, sem duplicar a lista em dois arquivos.
export const NAV_TABS = [
  { to: "/obras", label: "Obras", icon: Building2 },
  { to: "/chamada", label: "Chamada", icon: CalendarCheck },
  { to: "/equipe", label: "Equipe", icon: Users },
  { to: "/relatorios", label: "Relatórios", icon: FileBarChart2 },
  { to: "/tema", label: "Tema", icon: Palette },
];
