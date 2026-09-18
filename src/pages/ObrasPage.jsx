import { Building2, Plus } from "lucide-react";
import { useState } from "react";
import PageHeader from "../components/PageHeader";
import ProjectForm from "../components/ProjectForm";
import ProjectList from "../components/ProjectList";

// ALTERAÇÃO: arquivo novo. Antes, cadastrar obra era uma das 2 abas dentro
// do painel "Cadastros" (ManagementPanel.jsx), compartilhando espaço com
// funcionários. Agora é a própria página "/obras" — no celular, ver o
// formulário de cadastro e a lista de obras já cadastradas cada um na sua
// tela cheia (em vez de dividido) é bem mais fácil de usar.
export default function ObrasPage() {
  const [formOpen, setFormOpen] = useState(false);

  return (
    <div className="page">
      <PageHeader icon={Building2} eyebrow="Obras" title="Obras" />
      <div className="project-register-toolbar">
        <button
          type="button"
          className="primary-button register-button"
          onClick={() => setFormOpen((current) => !current)}
        >
          <Plus size={18} aria-hidden="true" />
          {formOpen ? "Fechar cadastro" : "Cadastrar obra"}
        </button>
      </div>
      {formOpen && <ProjectForm />}
      <ProjectList />
    </div>
  );
}
