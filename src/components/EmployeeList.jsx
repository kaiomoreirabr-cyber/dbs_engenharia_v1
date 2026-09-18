import { useEffect, useRef, useState } from "react";
import { Pencil } from "lucide-react";
import { useApp } from "../context/AppContext";
import { formatCurrency, getInitials } from "../lib/format";
import ConfirmButton from "./ConfirmButton";
import EditEmployeeModal from "./EditEmployeeModal";

export default function EmployeeList({ highlightedEmployeeId }) {
  const { activeEmployees, projects, activeProjectId, removeEmployee } = useApp();
  const [editingEmployee, setEditingEmployee] = useState(null);
  const rowRefs = useRef(new Map());

  const projectName = (projectId) => projects.find((project) => project.id === projectId)?.name || "—";
  const projectEmployees = activeEmployees;

  useEffect(() => {
    if (!highlightedEmployeeId) return undefined;
    const row = rowRefs.current.get(highlightedEmployeeId);
    row?.scrollIntoView({ behavior: "smooth", block: "center" });
    const timer = setTimeout(() => row?.classList.remove("is-newly-added"), 2800);
    row?.classList.add("is-newly-added");
    return () => clearTimeout(timer);
  }, [highlightedEmployeeId]);

  return (
    <div>
      <div className="list-header">
        <h2 className="form-title">Equipe cadastrada</h2>
        <span className="count-badge">{projectEmployees.length}</span>
      </div>

      {!activeProjectId ? (
        <p className="empty-box">Selecione uma obra para ver os funcionários.</p>
      ) : projectEmployees.length === 0 ? (
        <p className="empty-box">Nenhum funcionário cadastrado nesta obra.</p>
      ) : (
        <ul className="entity-list">
          {projectEmployees.map((employee) => (
            <li
              key={employee.id}
              ref={(element) => {
                if (element) rowRefs.current.set(employee.id, element);
                else rowRefs.current.delete(employee.id);
              }}
              className="entity-row"
            >
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
                    className="employee-action employee-edit-action"
                  onClick={() => setEditingEmployee(employee)}
                  aria-label={`Editar funcionário ${employee.name}`}
                >
                  <Pencil size={15} />
                    Editar
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
