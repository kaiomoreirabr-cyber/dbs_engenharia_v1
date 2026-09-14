import { useApp } from "../context/AppContext";

// ALTERAÇÃO: arquivo novo. É o combo "OBRA SELECIONADA" que aparece no topo
// das páginas Chamada e Relatórios nas suas capturas de tela — deixa trocar
// de obra em 1 toque sem precisar ir até a página "Obras".
export default function ProjectSelect() {
  const { projects, activeProjectId, setActiveProjectId } = useApp();

  if (!projects.length) return null;

  return (
    <label className="project-select">
      <span className="project-select-label">Obra selecionada</span>
      <select
        className="field"
        value={activeProjectId || ""}
        onChange={(event) => setActiveProjectId(event.target.value)}
      >
        {projects.map((project) => (
          <option key={project.id} value={project.id}>
            {project.name}
          </option>
        ))}
      </select>
    </label>
  );
}
