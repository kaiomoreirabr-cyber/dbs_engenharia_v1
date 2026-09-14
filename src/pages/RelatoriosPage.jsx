import { useState } from "react";
import { FileBarChart2, Copy, Check, Printer } from "lucide-react";
import { useApp } from "../context/AppContext";
import { useToast } from "../context/ToastContext";
import PageHeader from "../components/PageHeader";
import ProjectSelect from "../components/ProjectSelect";
import { formatPeriodRange } from "../lib/dateUtils";
import { formatCurrency } from "../lib/format";

// ALTERAÇÃO: arquivo novo — substitui components/ReportPanel.jsx. Antes o
// relatório só aparecia depois de clicar em "Gerar relatório de pagamento"
// (um botão + rolar a tela até ele). Como agora é uma página própria
// ("/relatorios"), o relatório do período atual já aparece assim que o
// usuário entra na aba — um toque a menos no celular.
export default function RelatoriosPage() {
  const { activeProject, activeEmployees, buildReport, periodStart, closingPeriod } = useApp();

  const periodLabel = closingPeriod === "quinzenal" ? "Quinzena" : "Semana";
  const rows = activeProject ? buildReport() : [];
  const totalConsolidado = rows.reduce((sum, row) => sum + row.total, 0);

  return (
    <div className="page">
      <PageHeader icon={FileBarChart2} eyebrow="Relatórios" title="Relatórios e Fechamento" />
      <ProjectSelect />

      {!activeProject ? (
        <p className="empty-box">Selecione uma obra para ver o fechamento.</p>
      ) : !activeEmployees.length ? (
        <p className="empty-box">Cadastre funcionários nesta obra para gerar o relatório.</p>
      ) : (
        <section className="panel report-panel" aria-live="polite">
          {/* ALTERAÇÃO: bloco novo — só aparece no PDF/impressão (ver
              .print-letterhead no index.css). Coloca o nome da empresa no
              relatório gerado, que antes saía sem nenhuma marca. */}
          <div className="print-letterhead" aria-hidden="true">
            <div className="print-letterhead-brand">
              <img src="/logo-dbs.png" alt="" className="print-letterhead-mark" />
              <div>
                <strong>DBS ENGENHARIA</strong>
                <span>Controle de Frequência de Obras</span>
              </div>
            </div>
            <div className="print-letterhead-meta">
              <span>{activeProject.name}</span>
              <span>
                {periodLabel} de {formatPeriodRange(periodStart, closingPeriod)}
              </span>
            </div>
          </div>

          <div className="report-head-row">
            <div>
              <p className="eyebrow">Fechamento da chamada</p>
              <h2 className="form-title">Relatório de pagamento</h2>
              <p className="form-helper">
                {periodLabel} de {formatPeriodRange(periodStart, closingPeriod)}
              </p>
            </div>
            <div className="report-head-actions">
              <span className="count-badge">{activeProject.name}</span>
              {/* ALTERAÇÃO: era um botão só com o ícone de impressora
                  (.icon-action) — trocado pelo botão vermelho completo, no
                  estilo enviado como referência. */}
              <button type="button" className="print-report-button" onClick={() => window.print()}>
                <Printer size={16} />
                Gerar Relatório
              </button>
            </div>
          </div>

          {/* ALTERAÇÃO: bloco novo — card de destaque com o total somado de
              todos os funcionários do período, igual ao "TOTAL CONSOLIDADO"
              que aparecia na sua captura de tela. */}
          <div className="total-consolidado-card">
            <span className="total-consolidado-label">
              Total consolidado da {periodLabel.toLowerCase()}
            </span>
            <strong className="total-consolidado-value">{formatCurrency(totalConsolidado)}</strong>
          </div>

          <div className="report-table-head" aria-hidden="true">
            <span>Funcionário · função</span>
            <span>Completas</span>
            <span>Meias</span>
            <span>Ausências</span>
            <span>A receber</span>
            <span>Chave Pix</span>
          </div>

          <div className="report-list">
            {rows.map(({ employee, full, half, absent, total }) => (
              <ReportRow
                key={employee.id}
                employee={employee}
                full={full}
                half={half}
                absent={absent}
                total={total}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function ReportRow({ employee, full, half, absent, total }) {
  const { showError } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!employee.pix_key) return;
    try {
      await navigator.clipboard.writeText(employee.pix_key);
      setCopied(true);
      setTimeout(() => setCopied(false), 1700);
    } catch {
      showError("Não foi possível copiar a chave Pix. Selecione e copie manualmente.");
    }
  };

  return (
    <div className="report-row">
      <strong data-label="Funcionário">
        {employee.name} · {employee.role}
      </strong>
      <span data-label="Completas">{full}</span>
      <span data-label="Meias">{half}</span>
      <span data-label="Ausências">{absent}</span>
      <span data-label="A receber" className="report-total">
        {formatCurrency(total)}
      </span>
      <div className="pix-box" data-label="Chave Pix">
        <span className="pix-value">{employee.pix_key || "Chave Pix não informada"}</span>
        <button
          type="button"
          className="copy-pix"
          onClick={handleCopy}
          disabled={!employee.pix_key}
          aria-label={`Copiar chave Pix de ${employee.name}`}
        >
          {copied ? <Check size={15} /> : <Copy size={15} />}
        </button>
      </div>
    </div>
  );
}
