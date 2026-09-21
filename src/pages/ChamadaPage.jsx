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

  const [weekIndex, setWeekIndex] = useState(0);
  const [day, setDay] = useState(getTodayDayKey);

  useEffect(() => {
    setWeekIndex((current) => (current > reportWeekStarts.length - 1 ? 0 : current));
  }, [reportWeekStarts]);

  const currentWeekStart = reportWeekStarts[weekIndex] || reportWeekStarts[0];
  const periodLabel = closingPeriod === "quinzenal" ? "Quinzena" : "Semana";
  const currentWeek = getWeekStart();
  const current = closingPeriod === "semanal"
    ? reportStartDate === currentWeek
    : reportStartDate <= currentWeek && currentWeek <= reportEndDate;

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

  const handleReturnToCurrentPeriod = () => {
    const currentReportStart = getWeekStart();
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
                <DatePickerField
                  label="Início"
                  value={reportStartDate}
                  onChange={handleReportStartChange}
                  mondayOnly
                  tone="start"
                />
                <span className="attendance-report-dates-separator">até</span>
                <DatePickerField label="Fim" value={reportEndDate} readOnly tone="end" />
              </div>
              {!current && (
                <button
                  type="button"
                  className="week-today-link"
                  onClick={handleReturnToCurrentPeriod}
                >
                  voltar para período atual
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

function DatePickerField({ label, value, onChange, mondayOnly = false, readOnly = false, tone }) {
  const { showError } = useToast();
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
    if (mondayOnly && !isMonday(date)) {
      showError("O periodo deve iniciar em uma segunda-feira.");
      return;
    }
    onChange({ target: { value: date } });
    setOpen(false);
  };

  return (
    <div ref={pickerRef} className={`report-date-picker attendance-date-picker date-tone-${tone}`}>
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
            {["D", "S", "T", "Q", "Q", "S", "S"].map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}
          </div>
          <div className="report-calendar-grid">
            {days.map((date, index) => (
              <button
                key={`${date || "empty"}-${index}`}
                type="button"
                disabled={!date || isOutsideMonth(date, month)}
                className={`${date === value ? "is-selected" : ""}${date && isOutsideMonth(date, month) ? " is-outside-month" : ""}${date && mondayOnly && !isMonday(date) ? " is-invalid-start" : ""}`}
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
    days.push(`${previousMonth.getFullYear()}-${String(previousMonth.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    days.push(`${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
  }
  return days;
}

function formatDisplayDate(isoDate) {
  if (!isoDate) return "Selecione uma data";
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}
