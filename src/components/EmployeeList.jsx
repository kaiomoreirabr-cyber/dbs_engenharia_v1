import { useState } from "react";
import { Pencil } from "lucide-react";
import { useApp } from "../context/AppContext";
import { formatCurrency, getInitials } from "../lib/format";
import ConfirmButton from "./ConfirmButton";
import EditEmployeeModal from "./EditEmployeeModal";

export default function EmployeeList() {
  const { employees, projects, removeEmployee } = useApp();
  const [editingEmployee, setEditingEmployee] = useState(null);

  const projectName = (projectId) => projects.find((project) => project.id === projectId)?.name || "—";

  return (
    <div>
      <div className="list-header">
        <h2 className="form-title">Equipe cadastrada</h2>
        <span className="count-badge">{employees.length}</span>
      </div>

      {employees.length === 0 ? (
        <p className="empty-box">Nenhum funcionário cadastrado ainda.</p>
      ) : (
        <ul className="entity-list">
          {employees.map((employee) => (
            <li key={employee.id} className="entity-row">
              <div className="entity-info">
                <span className="entity-avatar" aria-label={employee.name}>
                  {getInitials(employee.name)}
                </span>
                <div className="entity-text">
                  <strong className="entity-name">{employee.name}</strong>
                  <span className="entity-meta">
                    {employee.role} · {projectName(employee.project_id)}
                  </span>
                </div>
              </div>
              <div className="entity-actions">
                <strong className="entity-rate">{formatCurrency(employee.daily_rate)}</strong>
                <button
                  type="button"
                  className="icon-action"
                  onClick={() => setEditingEmployee(employee)}
                  aria-label={`Editar funcionário ${employee.name}`}
                >
                  <Pencil size={15} />
                </button>
                <ConfirmButton
                  label="Excluir"
                  ariaLabel={`Excluir funcionário ${employee.name}`}
                  onConfirm={() => removeEmployee(employee.id)}
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      {editingEmployee && (
        <EditEmployeeModal employee={editingEmployee} onClose={() => setEditingEmployee(null)} />
      )}
    </div>
  );
}
