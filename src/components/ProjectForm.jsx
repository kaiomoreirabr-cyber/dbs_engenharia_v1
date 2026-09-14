import { useState } from "react";
import { useApp } from "../context/AppContext";
// ALTERAÇÃO: importa a lista de períodos disponíveis (semanal/quinzenal) e o
// padrão sugerido (quinzenal, o mais usado na empresa) para montar o seletor.
import { CLOSING_PERIODS, DEFAULT_CLOSING_PERIOD } from "../lib/dateUtils";

export default function ProjectForm() {
  const { addProject, savingProject } = useApp();
  const [name, setName] = useState("");
  // ALTERAÇÃO: novo estado para o período de fechamento escolhido no
  // cadastro. Começa em "quinzenal" (DEFAULT_CLOSING_PERIOD) por ser o modo
  // de pagamento mais usado na empresa, mas o usuário pode trocar para
  // "semanal" antes de salvar.
  const [closingPeriod, setClosingPeriod] = useState(DEFAULT_CLOSING_PERIOD);

  const handleSubmit = async (event) => {
    event.preventDefault();
    // ALTERAÇÃO: passa o período escolhido para addProject.
    const result = await addProject(name, closingPeriod);
    if (result.ok) {
      setName("");
      // ALTERAÇÃO: mantém o período selecionado para o próximo cadastro
      // (a maioria das obras cadastradas em sequência costuma usar o mesmo
      // regime de pagamento), só o nome é limpo.
    }
  };

  return (
    <form className="form-card" onSubmit={handleSubmit}>
      <h2 className="form-title">Cadastrar obra</h2>
      <p className="form-helper">
        Crie uma obra para organizar a equipe e abrir a chamada de frequência.
      </p>

      <label className="field-label" htmlFor="project-name">
        Nome da obra
      </label>
      <input
        id="project-name"
        className="field"
        type="text"
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Ex.: Edifício Aurora"
        required
        maxLength={80}
      />

      {/* ALTERAÇÃO: bloco novo — seletor de período de fechamento (pagamento).
          Usa <fieldset>/<radio> para permitir escolher entre semanal e
          quinzenal, mantendo acessibilidade (navegação por teclado, leitor
          de tela agrupa as opções pelo <legend>). */}
      <fieldset className="period-fieldset">
        <legend className="field-label">Período de fechamento (pagamento)</legend>
        <p className="field-hint">
          Define de quantas em quantas semanas a chamada fecha para pagamento.
        </p>
        <div className="period-toggle" role="radiogroup" aria-label="Período de fechamento">
          {Object.values(CLOSING_PERIODS).map((option) => (
            <label
              key={option.value}
              className={`period-option${closingPeriod === option.value ? " is-selected" : ""}`}
            >
              <input
                type="radio"
                name="closing-period"
                value={option.value}
                checked={closingPeriod === option.value}
                onChange={() => setClosingPeriod(option.value)}
              />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>

      <button type="submit" className="primary-button" disabled={savingProject}>
        {savingProject ? "Cadastrando…" : "Cadastrar obra"}
      </button>
    </form>
  );
}
