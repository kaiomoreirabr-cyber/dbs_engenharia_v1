import { Users } from "lucide-react";
import PageHeader from "../components/PageHeader";
import ProjectSelect from "../components/ProjectSelect";
import EmployeeForm from "../components/EmployeeForm";
import EmployeeList from "../components/EmployeeList";

// ALTERAÇÃO: arquivo novo. Era a segunda aba do ManagementPanel.jsx; agora é
// a página "/equipe". A lista mostra funcionários de TODAS as obras (igual
// já funcionava antes), então não travamos a página quando não há obra
// "ativa" — só mostramos o seletor como atalho para pré-preencher a "Obra
// vinculada" no formulário mais rápido. O próprio EmployeeForm já avisa se
// nenhuma obra existir ainda.
export default function EquipePage() {
  return (
    <div className="page">
      <PageHeader icon={Users} eyebrow="Equipe" title="Funcionários" />
      <ProjectSelect />
      <EmployeeForm />
      <EmployeeList />
    </div>
  );
}
