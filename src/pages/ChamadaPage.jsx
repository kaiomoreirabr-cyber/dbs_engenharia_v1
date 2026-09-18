import { useEffect, useRef, useState } from "react";
import { CalendarCheck, CalendarDays, ChevronLeft, ChevronRight, HardHat } from "lucide-react";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { useToast } from "../context/ToastContext";
import PageHeader from "../components/PageHeader";
import ProjectSelect from "../components/ProjectSelect";
import {
  DAY_KEYS,
  DAY_LABELS,
  getWeekEnd,
  getWeekStart,
  getTodayDayKey,
  addWorkingDays,
  getPeriodEnd,
  addWeeks,
  isMonday,
} from "../lib/dateUtils";
import { formatCurrency, getInitials } from "../lib/format";

const STATUS_LABEL = { absent: "ausente", full: "diária completa", half: "meia diária" };

function formatReportWeekRange(weekStart, reportStartDate, reportEndDate) {
  const start = weekStart < reportStartDate ? reportStartDate : weekStart;
  const weekEnd = getWeekEnd(weekStart);
  const end = weekEnd > reportEndDate ? reportEndDate : weekEnd;
  const format = (isoDate) => {
    const [, month, day] = isoDate.split("-");
    return `${day}/${month}`;
  };
  return `${format(start)} a ${format(end)}`;
}

// ALTERAÇÃO: arquivo novo — substitui AttendanceTable.jsx (que era uma
// tabela larga com 6 ou 12 colunas de dia lado a lado). No celular, uma
// tabela assim obriga a rolar pros lados o tempo todo. Aqui a marcação vira
// uma LISTA vertical de funcionários para UM dia por vez, e o dia é trocado
// por abas (SEG TER QUA...) — o padrão que já aparecia nas suas telas.
export default function ChamadaPage() {
  const {
    activeProject,
    activeEmployees,
    attendanceLoading,
    getAttendanceStatus,
    isCellPending,
    toggleAttendance,
    firstFilledDay,
    reportWeekStarts,
    closingPeriod,
    summary,
    reportStartDate,
    reportEndDate,
    setReportDateRange,
    shiftReportRange,
  } = useApp();
  const { showError } = useToast();

  // Qual semana DENTRO do período está sendo mostrada (0 = primeira). Só
  // importa no modo quinzenal, que tem 2 semanas; no semanal é sempre 0.
  const [weekIndex, setWeekIndex] = useState(0);
  // Qual dia (seg..sáb) está selecionado. Começa já no dia de hoje.
  const [day, setDay] = useState(getTodayDayKey);

  // Se o período mudar (navegou, ou a obra trocou de quinzenal->semanal) e
  // o índice de semana escolhido não existir mais, volta pra semana 1.
  useEffect(() => {
    setWeekIndex((current) => (current > reportWeekStarts.length - 1 ? 0 : current));
  }, [reportWeekStarts]);

  const currentWeekStart = reportWeekStarts[weekIndex] || reportWeekStarts[0];
  const periodLabel = closingPeriod === "quinzenal" ? "Quinzena" : "Semana";
  const currentWeek = getWeekStart();
  const current = reportStartDate <= currentWeek && currentWeek <= reportEndDate;

  const handleReportStartChange = (event) => {
    const nextStartDate = event.target.value;
    if (!isMonday(nextStartDate)) {
      showError("A chamada só pode começar em uma segunda-feira.");
      return;
    }
    const nextEndDate = closingPeriod === "semanal"
      ? getPeriodEnd(nextStartDate, closingPeriod)
      : addWorkingDays(nextStartDate, 12);
    setReportDateRange(nextStartDate, nextEndDate);
  };

  const handleReturnToToday = () => {
    const currentReportStart = addWeeks(getWeekStart(), -1);
    const currentReportEnd = closingPeriod === "semanal"
      ? getPeriodEnd(currentReportStart, closingPeriod)
      : addWorkingDays(currentReportStart, 12);
    const todayWeekIndex = reportWeekStarts.indexOf(getWeekStart());

    setReportDateRange(currentReportStart, currentReportEnd);
    setWeekIndex(todayWeekIndex >= 0 ? todayWeekIndex : 0);
    setDay(getTodayDayKey());
  };

  const handleAttendanceToggle = (employeeId) => {
    toggleAttendance(employeeId, currentWeekStart, day);
  };

  return (
    <div className="page">
      <PageHeader icon={CalendarCheck} eyebrow="Frequência diária" title={`Chamada da ${periodLabel}`} />
      <ProjectSelect />

      {!activeProject ? (
        <p className="empty-box">Selecione uma obra para iniciar a chamada.</p>
      ) : !activeEmployees.length ? (
        <p className="empty-box">Cadastre funcionários nesta obra para iniciar a chamada.</p>
      ) : (
        <>
          <div className="summary-chip-row" aria-label="Resumo da frequência do período">
            <span className="summary-chip tone-full">
              <span className="chip-dot" aria-hidden="true" />
              {summary.full} Completas
            </span>
            <span className="summary-chip tone-half">
              <span className="chip-dot" aria-hidden="true" />
              {summary.half} Meias
            </span>
            <span className="summary-chip tone-absent">
              <span className="chip-dot" aria-hidden="true" />
              {summary.absent} Ausências
            </span>
          </div>

          <div className="period-nav" role="group" aria-label={`Navegação entre ${periodLabel.toLowerCase()}s`}>
            <button
              type="button"
              className="icon-action"
              onClick={() => shiftReportRange(-1)}
              aria-label={`${periodLabel} anterior`}
            >
              <ChevronLeft size={16} />
            </button>
            <div className="period-nav-label">
              <div className="attendance-report-dates" aria-label="Período usado no relatório">
                <DateInputField
                  label="Início"
                  value={reportStartDate}
                  onChange={handleReportStartChange}
                  tone="start"
                />
                <span className="attendance-report-dates-separator">até</span>
                <DateInputField label="Fim" value={reportEndDate} readOnly tone="end" />
              </div>
              {!current && (
                <button
                  type="button"
                  className="week-today-link"
                  onClick={handleReturnToToday}
                >
                  voltar para hoje
                </button>
              )}
            </div>
            <button
              type="button"
              className="icon-action"
              onClick={() => shiftReportRange(1)}
              aria-label={`Próxima ${periodLabel.toLowerCase()}`}
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* ALTERAÇÃO: bloco só aparece em obras quinzenais — escolhe qual
              das 2 semanas do período as abas de dia (abaixo) vão mostrar. */}
          {reportWeekStarts.length > 1 && (
            <div className="week-in-period-toggle" role="tablist" aria-label="Semana do período">
              {reportWeekStarts.map((weekStart, index) => (
                <button
                  key={weekStart}
                  type="button"
                  role="tab"
                  aria-selected={weekIndex === index}
                  className={`week-in-period-option${weekIndex === index ? " is-active" : ""}`}
                  onClick={() => setWeekIndex(index)}
                >
                  Semana {index + 1}
                  <span>{formatReportWeekRange(weekStart, reportStartDate, reportEndDate)}</span>
                </button>
              ))}
            </div>
          )}

          <div className="day-tabs" role="tablist" aria-label="Dia da semana">
            {DAY_KEYS.map((dayKey) => (
              <button
                key={dayKey}
                type="button"
                role="tab"
                aria-selected={day === dayKey}
                className={`day-tab${day === dayKey ? " is-active" : ""}`}
                onClick={() => setDay(dayKey)}
              >
                {DAY_LABELS[dayKey]}
                {firstFilledDay.start?.weekIndex === weekIndex && firstFilledDay.start?.day === dayKey && (
                  <span className="day-tab-start-badge day-tab-start" aria-label="Início da quinzena">
                    <CalendarCheck size={11} aria-hidden="true" />
                    INÍCIO
                  </span>
                )}
                {weekIndex === reportWeekStarts.length - 1 && dayKey === "sab" && (
                    <span className="day-tab-start-badge day-tab-end" aria-label={`Fim da ${periodLabel.toLowerCase()}`}>
                    <CalendarCheck size={11} aria-hidden="true" />
                    FIM
                  </span>
                )}
              </button>
            ))}
          </div>

          <ul className="attendance-list">
            {activeEmployees.map((employee) => {
              const status = getAttendanceStatus(employee.id, currentWeekStart, day);
              const pending = isCellPending(employee.id, currentWeekStart, day);
              return (
                <li key={employee.id} className="attendance-row">
                  <div className="employee-cell">
                    <span className="avatar" aria-hidden="true">
                      {getInitials(employee.name)}
                    </span>
                    <div>
                      <p className="employee-cell-name">{employee.name}</p>
                      <p className="employee-cell-meta">
                        <span>{employee.role} · diária</span>
                        <span className="employee-cell-rate">{formatCurrency(employee.daily_rate)}</span>
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className={`attendance-button is-${status}${pending ? " is-pending" : ""}`}
                    onClick={() => handleAttendanceToggle(employee.id)}
                    disabled={attendanceLoading}
                    aria-label={`${employee.name}, ${DAY_LABELS[day]}: ${STATUS_LABEL[status]}`}
                  >
                    <span className="attendance-fill" aria-hidden="true" />
                    <HardHat className="attendance-icon" size={20} aria-hidden="true" />
                  </button>
                </li>
              );
            })}
          </ul>

          <Link to="/relatorios" className="primary-button attendance-report-link">
            Ver relatório de pagamento
          </Link>
        </>
      )}
    </div>
  );
}

function DateInputField({ label, value, onChange, readOnly = false, tone }) {
  const inputRef = useRef(null);

  return (
    <label className={`attendance-date-field date-tone-${tone}`}>
      <span>{label}</span>
      <input
        ref={inputRef}
        type="date"
        value={value}
        onChange={onChange}
        readOnly={readOnly}
        aria-readonly={readOnly}
      />
      {!readOnly && (
        <button
          type="button"
          className="attendance-calendar-button"
          onClick={() => inputRef.current?.showPicker?.() || inputRef.current?.click()}
          aria-label={`Escolher ${label.toLowerCase()}`}
          title="Editar data de início"
        >
          <CalendarDays size={15} aria-hidden="true" />
        </button>
      )}
    </label>
  );
}
