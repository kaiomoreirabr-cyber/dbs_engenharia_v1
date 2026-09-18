import { useEffect, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, FileBarChart2, Copy, Check, Printer } from "lucide-react";
import { useApp } from "../context/AppContext";
import { useToast } from "../context/ToastContext";
import PageHeader from "../components/PageHeader";
import ProjectSelect from "../components/ProjectSelect";
import * as api from "../lib/api";
import {
  getAttendanceSlot,
  getWeekStartsBetween,
  getWorkingDatesBetween,
  isMonday,
  addWorkingDays,
  getPeriodEnd,
  normalizeClosingPeriod,
} from "../lib/dateUtils";
import { formatCurrency } from "../lib/format";

// ALTERAÇÃO: arquivo novo — substitui components/ReportPanel.jsx. Antes o
// relatório só aparecia depois de clicar em "Gerar relatório de pagamento"
// (um botão + rolar a tela até ele). Como agora é uma página própria
// ("/relatorios"), o relatório do período atual já aparece assim que o
// usuário entra na aba — um toque a menos no celular.
export default function RelatoriosPage() {
  const {
    activeProject,
    activeEmployees,
    closingPeriod,
    reportStartDate,
    reportEndDate,
    setReportDateRange,
  } = useApp();
  const { showError } = useToast();
  const [startDate, setStartDate] = useState(reportStartDate);
  const [endDate, setEndDate] = useState(reportEndDate);
  const [rows, setRows] = useState([]);
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => {
    setStartDate(reportStartDate);
    setEndDate(reportEndDate);
  }, [reportStartDate, reportEndDate]);

  useEffect(() => {
    if (!activeProject || !activeEmployees.length || !startDate || !endDate || startDate > endDate) {
      setRows([]);
      return undefined;
    }

    let cancelled = false;
    setReportLoading(true);
    const workingDates = getWorkingDatesBetween(startDate, endDate);
    const weekStarts = getWeekStartsBetween(startDate, endDate);

    const employeeIds = activeEmployees.map((employee) => employee.id);
    api.fetchAttendanceForReport(weekStarts, employeeIds).then(({ data, error }) => {
      if (cancelled) return;
      if (error) {
        showError("Não foi possível carregar as diárias deste intervalo.");
        setRows([]);
      } else {
        setRows(buildReportRows(activeEmployees, workingDates, data || []));
      }
      setReportLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [activeProject, activeEmployees, startDate, endDate, showError]);

  const handleStartDateChange = (event) => {
    const nextStartDate = event.target.value;
    if (!isMonday(nextStartDate)) {
      showError("O período só pode começar em uma segunda-feira.");
      return;
    }
    setStartDate(nextStartDate);
    if (nextStartDate) {
      const nextEndDate = normalizeClosingPeriod(activeProject?.closing_period) === "semanal"
        ? getPeriodEnd(nextStartDate, "semanal")
        : addWorkingDays(nextStartDate, 12);
      setEndDate(nextEndDate);
      setReportDateRange(nextStartDate, nextEndDate);
    }
  };

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
              <span className="print-closing-badge">
                FECHAMENTO {closingPeriod === "semanal" ? "SEMANAL" : "QUINZENAL"}
              </span>
              <span>
                Período de {formatDisplayDate(startDate)} a {formatDisplayDate(endDate)}
              </span>
            </div>
          </div>

          <div className="report-head-row">
            <div>
              <p className="eyebrow">Fechamento da chamada</p>
              <h2 className="form-title">Relatório de pagamento</h2>
              <div className="report-period-picker" aria-label="Período do relatório">
                <DatePickerField
                  label={`Início ${closingPeriod === "semanal" ? "semana" : "quinzena"}`}
                  value={startDate}
                  onChange={handleStartDateChange}
                  mondayOnly
                />
                <span className="report-period-separator">até</span>
                <DatePickerField label="Fim" value={endDate} readOnly />
              </div>
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
              Total consolidado do período
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

          <div className={`report-list${reportLoading ? " is-loading" : ""}`}>
            {reportLoading && (
              <span className="report-loading-indicator" role="status">
                Atualizando período...
              </span>
            )}
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

function buildReportRows(employees, workingDates, records) {
  const attendanceBySlot = new Map(
    records.map((record) => [
      `${record.employee_id}::${record.week_start}::${record.day}`,
      record.status,
    ])
  );

  return employees.map((employee) => {
    const statuses = workingDates.map((date) => {
      const { weekStart, day } = getAttendanceSlot(date);
      return attendanceBySlot.get(`${employee.id}::${weekStart}::${day}`) || "absent";
    });
    const full = statuses.filter((status) => status === "full").length;
    const half = statuses.filter((status) => status === "half").length;
    const absent = statuses.length - full - half;
    const total = full * employee.daily_rate + half * (employee.daily_rate / 2);
    return { employee, full, half, absent, total };
  });
}

function DatePickerField({ label, value, onChange, mondayOnly = false, readOnly = false }) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => getMonthDate(value));
  const pickerRef = useRef(null);
  const days = getCalendarDays(month);

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event) => {
      if (!pickerRef.current?.contains(event.target)) setOpen(false);
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

  const handleSelect = (date) => {
    if (!date) return;
    onChange({ target: { value: date } });
    setOpen(false);
  };

  return (
    <div ref={pickerRef} className="report-date-picker">
      <button
        type="button"
        className={`report-date-field${readOnly ? " is-read-only" : ""}`}
        onClick={() => !readOnly && setOpen((current) => !current)}
        aria-disabled={readOnly}
      >
        <span className="report-date-label">{label}</span>
        <span className="report-date-value">
          <strong>{formatDisplayDate(value)}</strong>
          {!readOnly && <CalendarDays className="report-date-icon" size={18} aria-hidden="true" />}
        </span>
      </button>
      {open && !readOnly && (
        <div className="report-calendar" role="dialog" aria-label={`Escolher ${label.toLowerCase()}`}>
          <div className="report-calendar-header">
            <button type="button" onClick={() => setMonth(shiftMonth(month, -1))} aria-label="Mês anterior">
              <ChevronLeft size={16} />
            </button>
            <strong>{formatMonth(month)}</strong>
            <button type="button" onClick={() => setMonth(shiftMonth(month, 1))} aria-label="Próximo mês">
              <ChevronRight size={16} />
            </button>
          </div>
          <div className="report-calendar-weekdays" aria-hidden="true">
            {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}
          </div>
          <div className="report-calendar-grid">
            {days.map((date, index) => (
              <button
                key={`${date || "empty"}-${index}`}
                type="button"
                disabled={!date || isOutsideMonth(date, month)}
                className={`${date === value ? "is-selected" : ""}${
                  date && isOutsideMonth(date, month) ? " is-outside-month" : ""
                }${date && mondayOnly && isMonday(date) ? " is-monday" : ""}${
                  date && mondayOnly && !isMonday(date) ? " is-invalid-start" : ""
                }`}
                onClick={() => handleSelect(date)}
              >
                {date ? Number(date.slice(-2)) : null}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function isOutsideMonth(isoDate, monthDate) {
  const monthPrefix = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, "0")}`;
  return !isoDate.startsWith(`${monthPrefix}-`);
}

function getMonthDate(isoDate) {
  const [year, month] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, 1);
}

function shiftMonth(date, amount) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function formatMonth(date) {
  return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

function getCalendarDays(month) {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const days = [];
  const previousMonth = new Date(month.getFullYear(), month.getMonth(), 0);
  for (let index = firstDay; index > 0; index -= 1) {
    const day = previousMonth.getDate() - index + 1;
    days.push(
      `${previousMonth.getFullYear()}-${String(previousMonth.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    );
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    days.push(
      `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    );
  }
  return days;
}

function formatDisplayDate(isoDate) {
  if (!isoDate) return "Selecione uma data";
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
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
