import { Building2, CalendarCheck, Users, FileBarChart2, Wallet, Palette } from "lucide-react";

// ALTERAÇÃO: bloco novo — inclui a tela de gastos por obra na navegação.
// Cada obra segue com seu próprio resumo de custos, separado do relatório de
// pagamento da frequência (que continua em RelatóriosPage.jsx).
export const NAV_TABS = [
  { to: "/obras", label: "Obras", icon: Building2 },
  { to: "/chamada", label: "Chamada", icon: CalendarCheck },
  { to: "/equipe", label: "Equipe", icon: Users },
  { to: "/gastos", label: "Gastos", icon: Wallet },
  { to: "/relatorios", label: "Relatórios", icon: FileBarChart2 },
  { to: "/tema", label: "Tema", icon: Palette },
];
