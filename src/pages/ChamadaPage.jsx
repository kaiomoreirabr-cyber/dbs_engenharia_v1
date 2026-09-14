import { useEffect, useState } from "react";
import { CalendarCheck, ChevronLeft, ChevronRight, HardHat } from "lucide-react";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import PageHeader from "../components/PageHeader";
import ProjectSelect from "../components/ProjectSelect";
import {
  DAY_KEYS,
  DAY_LABELS,
  formatWeekRange,
  formatPeriodRange,
  isCurrentPeriod,
  getTodayDayKey,
} from "../lib/dateUtils";
import { formatCurrency, getInitials } from "../lib/format";

const STATUS_LABEL = { absent: "ausente", full: "diária completa", half: "meia diária" };

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
    periodStart,
    periodWeekStarts,
    closingPeriod,
    goToPreviousPeriod,
    goToNextPeriod,
    goToCurrentPeriod,
    summary,
  } = useApp();

  // Qual semana DENTRO do período está sendo mostrada (0 = primeira). Só
  // importa no modo quinzenal, que tem 2 semanas; no semanal é sempre 0.
  const [weekIndex, setWeekIndex] = useState(0);
  // Qual dia (seg..sáb) está selecionado. Começa já no dia de hoje.
  const [day, setDay] = useState(getTodayDayKey);

  // Se o período mudar (navegou, ou a obra trocou de quinzenal->semanal) e
  // o índice de semana escolhido não existir mais, volta pra semana 1.
  useEffect(() => {
    setWeekIndex((current) => (current > periodWeekStarts.length - 1 ? 0 : current));
  }, [periodWeekStarts]);

  const currentWeekStart = periodWeekStarts[weekIndex] || periodWeekStarts[0];
  const periodLabel = closingPeriod === "quinzenal" ? "Quinzena" : "Semana";
  const current = isCurrentPeriod(periodStart, closingPeriod);

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
              onClick={goToPreviousPeriod}
              aria-label={`${periodLabel} anterior`}
            >
              <ChevronLeft size={16} />
            </button>
            <div className="period-nav-label">
              <span>
                {periodLabel} de {formatPeriodRange(periodStart, closingPeriod)}
              </span>
              {!current && (
                <button type="button" className="week-today-link" onClick={goToCurrentPeriod}>
                  voltar para hoje
                </button>
              )}
            </div>
            <button
              type="button"
              className="icon-action"
              onClick={goToNextPeriod}
              aria-label={`Próxima ${periodLabel.toLowerCase()}`}
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* ALTERAÇÃO: bloco só aparece em obras quinzenais — escolhe qual
              das 2 semanas do período as abas de dia (abaixo) vão mostrar. */}
          {periodWeekStarts.length > 1 && (
            <div className="week-in-period-toggle" role="tablist" aria-label="Semana do período">
              {periodWeekStarts.map((weekStart, index) => (
                <button
                  key={weekStart}
                  type="button"
                  role="tab"
                  aria-selected={weekIndex === index}
                  className={`week-in-period-option${weekIndex === index ? " is-active" : ""}`}
                  onClick={() => setWeekIndex(index)}
                >
                  Semana {index + 1}
                  <span>{formatWeekRange(weekStart)}</span>
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
                    onClick={() => toggleAttendance(employee.id, currentWeekStart, day)}
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
