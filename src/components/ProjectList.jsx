import { useState } from "react";
import { Building2, Pencil } from "lucide-react";
import { useApp } from "../context/AppContext";
import ConfirmButton from "./ConfirmButton";
import EditProjectModal from "./EditProjectModal";
import { CLOSING_PERIODS, normalizeClosingPeriod } from "../lib/dateUtils";

export default function ProjectList() {
  const { projects, activeProjectId, setActiveProjectId, removeProject } = useApp();
  const [editingProject, setEditingProject] = useState(null);

  return (
    <div className="project-list-panel">
      <div className="list-header">
        <h2 className="form-title">Obras cadastradas</h2>
        <span className="count-badge">{projects.length}</span>
      </div>

      {projects.length === 0 ? (
        <p className="empty-box">Nenhuma obra cadastrada ainda. Comece criando sua primeira obra.</p>
      ) : (
        <>
          <p className="project-section-label">Obra selecionada</p>
          <ul className="entity-list">
            {projects.filter((project) => project.id === activeProjectId).map(renderProjectCard)}
          </ul>
          {projects.some((project) => project.id !== activeProjectId) && (
            <>
              <p className="project-section-label project-section-label-secondary">Outras obras</p>
              <ul className="entity-list">
                {projects.filter((project) => project.id !== activeProjectId).map(renderProjectCard)}
              </ul>
            </>
          )}
        </>
      )}

      {editingProject && (
        <EditProjectModal project={editingProject} onClose={() => setEditingProject(null)} />
      )}
    </div>
  );

  function renderProjectCard(project) {
    const isActive = project.id === activeProjectId;
    return (
      <li key={project.id} className={`entity-row project-entity-row${isActive ? " is-project-active" : ""}`}>
        <div className="project-entity-main">
          <div className="project-entity-title-row">
            <span className="entity-icon" aria-hidden="true"><Building2 size={17} /></span>
            <strong className="entity-name project-entity-name">{project.name}</strong>
            <span className="project-title-spacer" aria-hidden="true" />
          </div>
          <div className="project-entity-meta-row">
            <span className="period-badge period-badge-list">
              Período: {CLOSING_PERIODS[normalizeClosingPeriod(project.closing_period)]?.label}
            </span>
          </div>
        </div>
        <div className="entity-actions project-card-actions">
          {isActive ? <span className="project-card-placeholder" aria-hidden="true" /> : (
            <button type="button" className="mini-action project-card-button" onClick={() => setActiveProjectId(project.id)}>
              Selecionar obra
            </button>
          )}
          <button type="button" className="project-edit-action project-card-button" onClick={() => setEditingProject(project)} aria-label={`Editar obra ${project.name}`}>
            <Pencil size={15} /> Editar
          </button>
          <ConfirmButton label="Excluir" ariaLabel={`Excluir obra ${project.name}`} onConfirm={() => removeProject(project.id)} />
        </div>
      </li>
    );
  }
}
