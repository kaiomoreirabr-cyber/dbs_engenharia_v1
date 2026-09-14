import { useState } from "react";
import { Building2, Pencil } from "lucide-react";
import { useApp } from "../context/AppContext";
import ConfirmButton from "./ConfirmButton";
import EditProjectModal from "./EditProjectModal";
// ALTERAÇÃO: importa CLOSING_PERIODS e normalizeClosingPeriod para mostrar,
// em cada linha da lista, se a obra é semanal ou quinzenal.
import { CLOSING_PERIODS, normalizeClosingPeriod } from "../lib/dateUtils";

export default function ProjectList() {
  const { projects, activeProjectId, setActiveProjectId, removeProject } = useApp();
  const [editingProject, setEditingProject] = useState(null);

  return (
    <div>
      <div className="list-header">
        <h2 className="form-title">Obras cadastradas</h2>
        <span className="count-badge">{projects.length}</span>
      </div>

      {projects.length === 0 ? (
        <p className="empty-box">Nenhuma obra cadastrada ainda. Comece criando sua primeira obra.</p>
      ) : (
        <ul className="entity-list">
          {projects.map((project) => {
            const isActive = project.id === activeProjectId;
            return (
              <li key={project.id} className="entity-row">
                <div className="entity-info">
                  <span className="entity-icon" aria-hidden="true">
                    <Building2 size={17} />
                  </span>
                  <strong className="entity-name">{project.name}</strong>
                  {/* ALTERAÇÃO: badge novo mostrando o período de fechamento
                      (Semanal ou Quinzenal) de cada obra cadastrada. */}
                  <span className="period-badge period-badge-list">
                    {CLOSING_PERIODS[normalizeClosingPeriod(project.closing_period)]?.label}
                  </span>
                </div>
                <div className="entity-actions">
                  <button
                    type="button"
                    className={`mini-action${isActive ? " is-active-state" : ""}`}
                    onClick={() => setActiveProjectId(project.id)}
                    disabled={isActive}
                  >
                    {isActive ? "Obra selecionada" : "Selecionar obra"}
                  </button>
                  <button
                    type="button"
                    className="icon-action"
                    onClick={() => setEditingProject(project)}
                    aria-label={`Editar obra ${project.name}`}
                  >
                    <Pencil size={15} />
                  </button>
                  <ConfirmButton
                    label="Excluir"
                    ariaLabel={`Excluir obra ${project.name}`}
                    onConfirm={() => removeProject(project.id)}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {editingProject && (
        <EditProjectModal project={editingProject} onClose={() => setEditingProject(null)} />
      )}
    </div>
  );
}
