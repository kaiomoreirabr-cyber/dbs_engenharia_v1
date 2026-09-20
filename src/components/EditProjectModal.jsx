import { useState } from "react";
import Modal from "./Modal";
import { useApp } from "../context/AppContext";
import { CLOSING_PERIODS, normalizeClosingPeriod } from "../lib/dateUtils";

export default function EditProjectModal({ project, onClose }) {
  const { editProject, savingProject } = useApp();
  const [name, setName] = useState(project.name);
  const [closingPeriod, setClosingPeriod] = useState(
    normalizeClosingPeriod(project.closing_period)
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    const result = await editProject(project.id, name, closingPeriod);
    if (result.ok) onClose();
  };

  return (
    <Modal
      title="Editar obra"
      onClose={onClose}
      footer={(
        <div className="modal-actions">
          <button type="button" className="secondary-button" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" form="edit-project-form" className="primary-button register-button" disabled={savingProject}>
            {savingProject ? "Salvando…" : "Salvar alterações"}
          </button>
        </div>
      )}
    >
      <form id="edit-project-form" onSubmit={handleSubmit}>
        <label className="field-label" htmlFor="edit-project-name">
          Nome da obra
        </label>
        <input
          id="edit-project-name"
          className="field"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          maxLength={80}
        />

        <fieldset className="period-fieldset">
          <legend className="field-label">Período de fechamento (pagamento)</legend>
          <div className="period-toggle" role="radiogroup" aria-label="Período de fechamento">
            {Object.values(CLOSING_PERIODS).map((option) => (
              <label
                key={option.value}
                className={`period-option${closingPeriod === option.value ? " is-selected" : ""}`}
              >
                <input
                  type="radio"
                  name="edit-closing-period"
                  value={option.value}
                  checked={closingPeriod === option.value}
                  onChange={() => setClosingPeriod(option.value)}
                />
                {option.label}
              </label>
            ))}
          </div>
        </fieldset>

      </form>
    </Modal>
  );
}
