import { useState } from "react";
import { Building2 } from "lucide-react";
import { useApp } from "../context/AppContext";
import { CLOSING_PERIODS, DEFAULT_CLOSING_PERIOD } from "../lib/dateUtils";

export default function ProjectForm() {
  const { addProject, savingProject } = useApp();
  const [name, setName] = useState("");
  const [closingPeriod, setClosingPeriod] = useState(DEFAULT_CLOSING_PERIOD);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const result = await addProject(name, closingPeriod);
    if (result.ok) {
      setName("");
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

      <button type="submit" className="primary-button register-button" disabled={savingProject}>
        <Building2 size={18} aria-hidden="true" />
        {savingProject ? "Cadastrando…" : "Cadastrar obra"}
      </button>
    </form>
  );
}
