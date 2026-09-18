import { useState } from "react";
import Modal from "./Modal";
import { useApp } from "../context/AppContext";

export default function EditEmployeeModal({ employee, onClose }) {
  const { projects, editEmployee, savingEmployee } = useApp();
  const [form, setForm] = useState({
    name: employee.name,
    role: employee.role,
    dailyRate: String(employee.daily_rate),
    projectId: employee.project_id,
    pixKey: employee.pix_key,
  });

  const updateField = (field) => (event) =>
    setForm((current) => ({ ...current, [field]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    const result = await editEmployee(employee.id, form);
    if (result.ok) onClose();
  };

  return (
    <Modal
      title="Editar funcionário"
      onClose={onClose}
      footer={(
        <div className="modal-actions">
          <button type="button" className="secondary-button" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" form="edit-employee-form" className="primary-button" disabled={savingEmployee}>
            {savingEmployee ? "Salvando…" : "Salvar alterações"}
          </button>
        </div>
      )}
    >
      <form id="edit-employee-form" onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="span-2">
            <label className="field-label" htmlFor="edit-employee-name">
              Nome completo
            </label>
            <input
              id="edit-employee-name"
              className="field"
              type="text"
              value={form.name}
              onChange={updateField("name")}
              required
              maxLength={80}
            />
          </div>

          <div>
            <label className="field-label" htmlFor="edit-employee-role">
              Função / patente
            </label>
            <input
              id="edit-employee-role"
              className="field"
              type="text"
              value={form.role}
              onChange={updateField("role")}
              required
              maxLength={60}
            />
          </div>

          <div>
            <label className="field-label" htmlFor="edit-employee-rate">
              Valor da diária (R$)
            </label>
            <input
              id="edit-employee-rate"
              className="field"
              type="number"
              min="0.01"
              step="0.01"
              value={form.dailyRate}
              onChange={updateField("dailyRate")}
              required
            />
          </div>

          <div className="span-2">
            <label className="field-label" htmlFor="edit-employee-project">
              Obra vinculada
            </label>
            <select
              id="edit-employee-project"
              className="field"
              value={form.projectId}
              onChange={updateField("projectId")}
              required
            >
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          <div className="span-2">
            <label className="field-label" htmlFor="edit-employee-pix">
              Chave Pix do funcionário
            </label>
            <input
              id="edit-employee-pix"
              className="field"
              type="text"
              value={form.pixKey}
              onChange={updateField("pixKey")}
              required
              maxLength={140}
            />
          </div>
        </div>

      </form>
    </Modal>
  );
}
