import { useEffect, useState } from "react";
import { UserPlus } from "lucide-react";
import { useApp } from "../context/AppContext";

const EMPTY_FORM = { name: "", role: "", dailyRate: "", projectId: "", pixKey: "" };

export default function EmployeeForm({ onCreated }) {
  const { projects, activeProjectId, addEmployee, savingEmployee } = useApp();
  const [form, setForm] = useState(() => ({ ...EMPTY_FORM, projectId: activeProjectId || "" }));

  // Mantém a obra do formulário alinhada com a obra selecionada na chamada.
  useEffect(() => {
    if (activeProjectId) {
      setForm((current) => ({ ...current, projectId: activeProjectId }));
    }
  }, [activeProjectId]);

  const updateField = (field) => (event) =>
    setForm((current) => ({ ...current, [field]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!projects.length) {
      return;
    }

    const result = await addEmployee(form);
    if (result.ok) {
      onCreated?.(result.employee);
      setForm({ ...EMPTY_FORM, projectId: form.projectId });
    }
  };

  return (
    <form className="form-card" onSubmit={handleSubmit}>
      <h2 className="form-title">Cadastrar funcionário</h2>
      <p className="form-helper">
        Informe a função, a diária e a chave Pix que serão usadas no fechamento.
      </p>

      {!projects.length && (
        <p className="inline-warning">Cadastre uma obra antes de adicionar funcionários.</p>
      )}

      <div className="form-grid">
        <div className="span-2">
          <label className="field-label" htmlFor="employee-name">
            Nome completo
          </label>
          <input
            id="employee-name"
            className="field"
            type="text"
            value={form.name}
            onChange={updateField("name")}
            required
            maxLength={80}
          />
        </div>

        <div>
          <label className="field-label" htmlFor="employee-role">
            Função / patente
          </label>
          <input
            id="employee-role"
            className="field"
            type="text"
            value={form.role}
            onChange={updateField("role")}
            required
            maxLength={60}
          />
        </div>

        <div>
          <label className="field-label" htmlFor="employee-rate">
            Valor da diária (R$)
          </label>
          <input
            id="employee-rate"
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
          <label className="field-label" htmlFor="employee-project">
            Obra vinculada
          </label>
          <select
            id="employee-project"
            className="field"
            value={form.projectId}
            onChange={updateField("projectId")}
            required
            disabled={!projects.length}
          >
            <option value="" disabled>
              Selecione a obra
            </option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>

        <div className="span-2">
          <label className="field-label" htmlFor="employee-pix">
            Chave Pix do funcionário
          </label>
          <input
            id="employee-pix"
            className="field"
            type="text"
            value={form.pixKey}
            onChange={updateField("pixKey")}
            required
            maxLength={140}
          />
          <p className="field-hint">A chave será exibida no fechamento para o pagamento.</p>
        </div>
      </div>

      <button
        type="submit"
        className="primary-button register-button"
        disabled={savingEmployee || !projects.length}
      >
        <UserPlus size={18} aria-hidden="true" />
        {savingEmployee ? "Cadastrando…" : "Cadastrar funcionário"}
      </button>
    </form>
  );
}
