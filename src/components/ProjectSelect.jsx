import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { useApp } from "../context/AppContext";

export default function ProjectSelect() {
  const { projects, activeProjectId, setActiveProjectId } = useApp();
  const [open, setOpen] = useState(false);
  const selectRef = useRef(null);
  const activeProject = projects.find((project) => project.id === activeProjectId) || projects[0];

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event) => {
      if (!selectRef.current?.contains(event.target)) setOpen(false);
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  if (!projects.length) return null;

  const handleSelect = (projectId) => {
    setActiveProjectId(projectId);
    setOpen(false);
  };

  return (
    <div ref={selectRef} className="project-select">
      <span className="project-select-label">Selecionar Empresa</span>
      <button
        type="button"
        className={`project-select-trigger${open ? " is-open" : ""}`}
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span>{activeProject.name}</span>
        <ChevronDown size={20} aria-hidden="true" />
      </button>
      {open && (
        <div className="project-select-menu" role="listbox" aria-label="Empresas disponíveis">
          {projects.map((project) => (
            <button
              key={project.id}
              type="button"
              role="option"
              aria-selected={project.id === activeProjectId}
              className={`project-select-option${project.id === activeProjectId ? " is-selected" : ""}`}
              onClick={() => handleSelect(project.id)}
            >
              {project.id === activeProjectId && <Check size={25} aria-hidden="true" />}
              <span>{project.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
