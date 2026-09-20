import { useMemo, useRef, useState } from "react";
import { Wallet, Plus, Trash2, PencilLine, Printer, CheckCircle2 } from "lucide-react";
import { useApp } from "../context/AppContext";
import PageHeader from "../components/PageHeader";
import ProjectSelect from "../components/ProjectSelect";
import { formatCurrency } from "../lib/format";
import { useToast } from "../context/ToastContext";

const EMPTY_FORM = {
  description: "",
  category: "",
  quantity: "1",
  unitValue: "",
  total: "",
  spentAt: new Date().toISOString().slice(0, 10),
  notes: "",
  isSettled: false,
};

export default function GastosPage() {
  const { activeProject, activeProjectId, projectExpenses, addExpense, editExpense, removeExpense, toggleExpenseSettled, savingExpense } = useApp();
  const { showError } = useToast();
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const formRef = useRef(null);

  const pendingExpenses = useMemo(() => projectExpenses.filter((expense) => !expense.is_settled), [projectExpenses]);
  const pendingTotal = useMemo(
    () => pendingExpenses.reduce((sum, expense) => sum + Number(expense.total || 0), 0),
    [pendingExpenses]
  );

  const updateField = (field) => (event) => {
    const value = event.target.value;
    setForm((current) => {
      const next = { ...current, [field]: value };
      if (field === "quantity" || field === "unitValue") {
        const quantity = Number(next.quantity || 0);
        const unitValue = Number(next.unitValue || 0);
        next.total = (quantity * unitValue).toFixed(2);
      }
      return next;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!activeProjectId) {
      return;
    }

    const payload = {
      projectId: activeProjectId,
      description: form.description,
      category: form.category,
      quantity: Number(form.quantity || 0),
      unitValue: Number(form.unitValue || 0),
      total: Number(form.total || 0),
      spentAt: form.spentAt,
      notes: form.notes,
      isSettled: form.isSettled,
    };

    if (!payload.description || !payload.category || !payload.spentAt || payload.quantity <= 0 || payload.unitValue <= 0) {
      return;
    }

    const result = editingId
      ? await editExpense(editingId, payload)
      : await addExpense(payload);

    if (result?.ok) {
      setForm(EMPTY_FORM);
      setEditingId(null);
    }
  };

  const handleEdit = (expense) => {
    setEditingId(expense.id);
    setIsFormOpen(true);
    setForm({
      description: expense.description,
      category: expense.category,
      quantity: String(expense.quantity),
      unitValue: String(expense.unit_price),
      total: String(expense.total),
      spentAt: expense.spent_at?.slice(0, 10) || new Date().toISOString().slice(0, 10),
      notes: expense.notes || "",
      isSettled: Boolean(expense.is_settled),
    });
    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const handleDelete = async (id) => {
    await removeExpense(id);
    if (editingId === id) {
      setEditingId(null);
      setForm(EMPTY_FORM);
    }
  };

  const handlePrint = () => {
    if (!pendingExpenses.length) {
      showError("Nenhum gasto pendente para gerar o relatório.");
      return;
    }
    window.print();
  };

  return (
    <div className="page">
      <PageHeader icon={Wallet} eyebrow="Custos" title="Gastos por obra" />
      <ProjectSelect />

      {!activeProject ? (
        <p className="empty-box">Selecione uma obra para registrar e acompanhar os gastos.</p>
      ) : (
        <>
          <div className="summary-chip-row expense-summary" aria-label="Resumo de gastos da obra">
            <span className="summary-chip tone-full">
              <span className="chip-dot" aria-hidden="true" />
              {formatCurrency(pendingTotal)} Pendente
            </span>
            <span className="summary-chip tone-half">
              <span className="chip-dot" aria-hidden="true" />
              {pendingExpenses.length} pendentes
            </span>
            <button type="button" className="print-report-button" onClick={handlePrint}>
              <Printer size={16} aria-hidden="true" />
              Gerar relatório
            </button>
          </div>

          <button
            type="button"
            className="primary-button expense-add-button"
            onClick={() => setIsFormOpen((current) => !current)}
          >
            <Plus size={18} aria-hidden="true" />
            {isFormOpen ? "Fechar cadastro" : "Cadastrar gasto"}
          </button>

          <div className="print-letterhead expense-print-letterhead" aria-hidden="true">
            <div className="print-letterhead-brand">
              <img src="/logo-dbs.png" alt="" className="print-letterhead-mark" />
              <div>
                <strong>DBS ENGENHARIA</strong>
                <span>Relatório de gastos por obra</span>
              </div>
            </div>
            <div className="print-letterhead-meta">
              <span>Obra: {activeProject.name}</span>
              <span>Gerado em: {new Date().toLocaleString("pt-BR")}</span>
              <span className="print-closing-badge">GASTOS PENDENTES</span>
              <span className="expense-print-total">Total: {formatCurrency(pendingTotal)} ({pendingExpenses.length} itens)</span>
            </div>
          </div>

          {isFormOpen && <form ref={formRef} className="form-card" onSubmit={handleSubmit}>
            <h2 className="form-title">{editingId ? "Editar gasto" : "Cadastrar gasto"}</h2>
            <p className="form-helper">Registre materiais ou despesas vinculados a esta obra.</p>

            <div className="form-grid">
              <div className="span-2">
                <label className="field-label" htmlFor="expense-description">Nome do produto</label>
                <input
                  id="expense-description"
                  className="field"
                  type="text"
                  value={form.description}
                  onChange={updateField("description")}
                  placeholder="Ex.: Cimento, areia, tijolo, brita..."
                  required
                />
              </div>

              <div>
                <label className="field-label" htmlFor="expense-category">Categoria</label>
                <input
                  id="expense-category"
                  className="field"
                  type="text"
                  value={form.category}
                  onChange={updateField("category")}
                  placeholder="Ex.: Material"
                  required
                />
              </div>

              <div>
                <label className="field-label" htmlFor="expense-spentAt">Data</label>
                <input
                  id="expense-spentAt"
                  className="field"
                  type="date"
                  value={form.spentAt}
                  onChange={updateField("spentAt")}
                  required
                />
              </div>

              <div>
                <label className="field-label" htmlFor="expense-quantity">Quantidade</label>
                <input
                  id="expense-quantity"
                  className="field"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.quantity}
                  onChange={updateField("quantity")}
                  required
                />
              </div>

              <div>
                <label className="field-label" htmlFor="expense-unitValue">Valor unitário</label>
                <input
                  id="expense-unitValue"
                  className="field"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.unitValue}
                  onChange={updateField("unitValue")}
                  required
                />
              </div>

              <div>
                <label className="field-label" htmlFor="expense-total">Total</label>
                <input
                  id="expense-total"
                  className="field"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.total}
                  readOnly
                />
              </div>

              <div className="span-2">
                <label className="field-label" htmlFor="expense-notes">Descrição/observação</label>
                <textarea
                  id="expense-notes"
                  className="field field-textarea"
                  value={form.notes}
                  onChange={updateField("notes")}
                  rows={3}
                  placeholder="Ex.: Fornecedor Casa do Construtor..."
                />
              </div>
            </div>

            <div className="expense-form-actions">
              <button type="submit" className="primary-button register-button" disabled={savingExpense}>
                <Plus size={18} aria-hidden="true" />
                {savingExpense ? "Salvando…" : editingId ? "Salvar gasto" : "Registrar gasto"}
              </button>

              <button
                type="button"
                className="secondary-button expense-cancel-button"
                onClick={() => {
                  setEditingId(null);
                  setForm(EMPTY_FORM);
                  setIsFormOpen(false);
                }}
              >
                Fechar
              </button>
            </div>
          </form>}

          <div className="panel expense-list-panel">
            <div className="report-table-head" aria-hidden="true">
              <span>Nome do produto</span>
              <span>Categoria</span>
              <span>Qtd.</span>
              <span>Unitário</span>
              <span>Total</span>
              <span>Data</span>
              <span>Ações</span>
            </div>

              {projectExpenses.length === 0 ? (
              <p className="empty-box compact">Nenhum gasto cadastrado para esta obra.</p>
            ) : (
              <div className="expense-list">
                {projectExpenses.map((expense) => (
                  <div key={expense.id} className={`expense-row${expense.is_settled ? " is-settled" : ""}`}>
                    <strong data-label="Nome do produto">{expense.description}</strong>
                    <span data-label="Categoria">{expense.category}</span>
                    <span data-label="Quantidade">{Number(expense.quantity).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}</span>
                    <span className="expense-unit-price" data-label="Unitário">{formatCurrency(expense.unit_price)}</span>
                    <span data-label="Total" className="expense-total">{formatCurrency(expense.total)}</span>
                    <span data-label="Data">{expense.spent_at ? new Date(expense.spent_at).toLocaleDateString("pt-BR") : "—"}</span>
                    <span className="expense-notes" data-label="Descrição/observação">{expense.notes || "—"}</span>
                    <div className="expense-actions" data-label="Ações">
                      <button type="button" className="mini-action" onClick={() => handleEdit(expense)} aria-label="Editar gasto">
                        <PencilLine size={14} />
                        <span>Editar</span>
                      </button>
                      <button
                        type="button"
                        className={`mini-action settle-action${expense.is_settled ? " is-settled" : ""}`}
                        onClick={() => toggleExpenseSettled(expense.id)}
                        aria-label={expense.is_settled ? "Reabrir gasto para relatório" : "Dar baixa no gasto"}
                        title={expense.is_settled ? "Reabrir para relatório" : "Dar baixa"}
                      >
                        <CheckCircle2 size={14} />
                        <span>{expense.is_settled ? "Fechado" : "Aberto"}</span>
                      </button>
                      <button type="button" className="mini-action danger" onClick={() => handleDelete(expense.id)} aria-label="Excluir gasto">
                        <Trash2 size={14} />
                        <span>Excluir</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
