import { UserPlus, Users } from "lucide-react";
import { useState } from "react";
import PageHeader from "../components/PageHeader";
import ProjectSelect from "../components/ProjectSelect";
import EmployeeForm from "../components/EmployeeForm";
import EmployeeList from "../components/EmployeeList";

export default function EquipePage() {
  const [formOpen, setFormOpen] = useState(false);
  const [highlightedEmployeeId, setHighlightedEmployeeId] = useState(null);

  const handleEmployeeCreated = (employee) => {
    setFormOpen(false);
    setHighlightedEmployeeId(employee.id);
  };

  return (
    <div className="page">
      <PageHeader icon={Users} eyebrow="Equipe" title="Funcionários" />
      <ProjectSelect />
      <button
        type="button"
        className="primary-button employee-add-toggle"
        onClick={() => setFormOpen((current) => !current)}
      >
        <UserPlus size={17} />
        {formOpen ? "Fechar cadastro" : "Cadastrar funcionário"}
      </button>
      {formOpen && <EmployeeForm onCreated={handleEmployeeCreated} />}
      <EmployeeList highlightedEmployeeId={highlightedEmployeeId} />
    </div>
  );
}
