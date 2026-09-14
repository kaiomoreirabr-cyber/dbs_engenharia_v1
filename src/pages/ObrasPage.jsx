import { Building2 } from "lucide-react";
import PageHeader from "../components/PageHeader";
import ProjectForm from "../components/ProjectForm";
import ProjectList from "../components/ProjectList";

// ALTERAÇÃO: arquivo novo. Antes, cadastrar obra era uma das 2 abas dentro
// do painel "Cadastros" (ManagementPanel.jsx), compartilhando espaço com
// funcionários. Agora é a própria página "/obras" — no celular, ver o
// formulário de cadastro e a lista de obras já cadastradas cada um na sua
// tela cheia (em vez de dividido) é bem mais fácil de usar.
export default function ObrasPage() {
  return (
    <div className="page">
      <PageHeader icon={Building2} eyebrow="Obras" title="Cadastro de Obras" />
      <ProjectForm />
      <ProjectList />
    </div>
  );
}
