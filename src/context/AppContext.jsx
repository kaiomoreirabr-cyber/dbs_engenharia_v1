import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";
import * as api from "../lib/api";
import {
  getWeekStart,
  DAY_KEYS,
  // ALTERAÇÃO: novas funções de período (semanal/quinzenal), ver dateUtils.js
  getPeriodWeekStarts,
  getWeekStartsBetween,
  addWeeks,
  addPeriods,
  addWorkingDays,
  normalizePeriodStart,
  normalizeClosingPeriod,
} from "../lib/dateUtils";
import { validateProjectName, validateEmployee } from "../lib/validation";
import { useToast } from "./ToastContext";

const AppContext = createContext(null);

const ATTENDANCE_CYCLE = ["absent", "full", "half"];

// A chave da frequência agora inclui também a semana ("weekStart").
// Antes só existia "employeeId::day", o que funcionava enquanto só uma
// semana ficava em tela por vez. Como o período quinzenal mostra 2 semanas
// ao mesmo tempo, duas colunas diferentes podem ser "seg" (segunda da semana
// 1 e segunda da semana 2) — sem o weekStart na chave elas se sobrescreveriam.
function attendanceKey(employeeId, weekStart, day) {
  return `${employeeId}::${weekStart}::${day}`;
}

export function AppProvider({ children }) {
  const { showSuccess, showError } = useToast();

  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [activeProjectId, setActiveProjectId] = useState(null);
  // ALTERAÇÃO: "weekStart" virou "periodStart". Continua sendo a segunda-feira
  // que marca o INÍCIO do período em tela, mas agora o período pode abranger
  // 1 semana (semanal) ou 2 semanas (quinzenal) — ver "closingPeriod" e
  // "periodWeekStarts" logo abaixo, derivados a partir deste valor.
  const [periodStart, setPeriodStart] = useState(() => getWeekStart());
  const [reportStartDate, setReportStartDate] = useState(() => addWeeks(getWeekStart(), -1));
  const [reportEndDate, setReportEndDate] = useState(() => addWorkingDays(addWeeks(getWeekStart(), -1), 12));
  const [attendance, setAttendance] = useState(new Map());
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [pendingCells, setPendingCells] = useState(new Set());

  const [savingProject, setSavingProject] = useState(false);
  const [savingEmployee, setSavingEmployee] = useState(false);
  const [reportVisible, setReportVisible] = useState(false);

  const hasHydratedActiveProject = useRef(false);

  // ALTERAÇÃO: bloco novo. "activeProject" precisou subir para cá (antes só
  // existia lá embaixo, na seção "Derivados") porque os efeitos de tempo real
  // e de carregamento de frequência, logo abaixo, agora precisam saber o
  // período de fechamento da obra ativa (closingPeriod) para descobrir quais
  // semanas (periodWeekStarts) buscar no banco.
  const activeProject = useMemo(
    () => projects.find((project) => project.id === activeProjectId) || null,
    [projects, activeProjectId]
  );

  // ALTERAÇÃO: período de fechamento da obra ativa ("semanal" ou "quinzenal").
  // normalizeClosingPeriod garante um valor válido mesmo se a obra ainda não
  // tiver essa coluna preenchida (bancos antigos, antes da migração).
  const closingPeriod = normalizeClosingPeriod(activeProject?.closing_period);

  // ALTERAÇÃO: lista das segundas-feiras que compõem o período em tela.
  // Ex.: semanal -> ["2026-08-03"]; quinzenal -> ["2026-08-03", "2026-08-10"].
  const periodWeekStarts = useMemo(
    () => getPeriodWeekStarts(periodStart, closingPeriod),
    [periodStart, closingPeriod]
  );

  const reportWeekStarts = useMemo(
    () => getWeekStartsBetween(reportStartDate, reportEndDate).slice(0, 2),
    [reportStartDate, reportEndDate]
  );

  useEffect(() => {
    const normalizedStart = normalizePeriodStart(reportStartDate);
    const periodEnd = addWorkingDays(normalizedStart, closingPeriod === "semanal" ? 6 : 12);
    if (reportStartDate !== normalizedStart) setReportStartDate(normalizedStart);
    if (reportEndDate !== periodEnd) setReportEndDate(periodEnd);
    // Recalcula o fim apenas quando a obra ou o modo de fechamento muda.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProjectId, closingPeriod]);

  // ---------- Carga inicial ----------
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoadError(
        "Supabase não configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env e reinicie o app."
      );
      setInitialLoading(false);
      return;
    }

    (async () => {
      const [{ data: projectRows, error: projectError }, { data: employeeRows, error: employeeError }] =
        await Promise.all([api.fetchProjects(), api.fetchEmployees()]);

      if (projectError || employeeError) {
        setLoadError("Não foi possível carregar os dados. Verifique sua conexão e tente novamente.");
      } else {
        setProjects(projectRows || []);
        setEmployees(employeeRows || []);
      }

      setInitialLoading(false);
    })();
  }, []);

  // Seleciona automaticamente a primeira obra disponível ao carregar
  useEffect(() => {
    if (hasHydratedActiveProject.current || initialLoading) return;
    if (projects.length > 0) {
      setActiveProjectId(projects[0].id);
      hasHydratedActiveProject.current = true;
    }
  }, [projects, initialLoading]);

  // Se a obra ativa for excluída, cai para outra (ou nenhuma)
  useEffect(() => {
    if (activeProjectId && !projects.some((project) => project.id === activeProjectId)) {
      setActiveProjectId(projects[0]?.id ?? null);
    }
  }, [projects, activeProjectId]);

  // Esconde o relatório sempre que a obra ativa mudar
  useEffect(() => {
    setReportVisible(false);
  }, [activeProjectId]);

  // ---------- Realtime ----------
  useEffect(() => {
    if (!isSupabaseConfigured) return undefined;

    const channel = supabase
      .channel("obra-frequencia-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "projects" }, (payload) => {
        setProjects((current) => applyRealtimeChange(current, payload));
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "employees" }, (payload) => {
        setEmployees((current) => applyRealtimeChange(current, payload));
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "attendance_records" }, (payload) => {
        const row = payload.new?.week_start ? payload.new : payload.old;
        // ALTERAÇÃO: antes comparava com uma única semana (row.week_start !== weekStart).
        // Agora o período pode ter 2 semanas, então verificamos se a semana da
        // mudança está DENTRO da lista periodWeekStarts do período em tela.
        if (!row || !reportWeekStarts.includes(row.week_start)) return;
        const belongsToActiveProject = employees.some(
          (employee) => employee.id === row.employee_id && employee.project_id === activeProjectId
        );
        if (!belongsToActiveProject) return;
        setAttendance((current) => {
          const next = new Map(current);
          // ALTERAÇÃO: attendanceKey agora recebe também row.week_start.
          const key = attendanceKey(row.employee_id, row.week_start, row.day);
          if (payload.eventType === "DELETE") {
            next.delete(key);
          } else {
            next.set(key, payload.new.status);
          }
          return next;
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // ALTERAÇÃO: dependia de [weekStart], agora depende de periodWeekStarts
    // (que muda quando o período navega OU quando a obra ativa troca de
    // período de fechamento).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportWeekStarts, employees, activeProjectId]);

  // ---------- Frequência: carregar todas as semanas do período ----------
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    let cancelled = false;
    setAttendanceLoading(true);

    // ALTERAÇÃO: carrega todas as semanas do intervalo escolhido no relatório.
    // Antes buscava 1 semana; agora busca todas as semanas do período de uma vez
    // (1 semana se semanal, 2 semanas se quinzenal).
    const employeeIds = employees
      .filter((employee) => employee.project_id === activeProjectId)
      .map((employee) => employee.id);
    if (!activeProjectId || !employeeIds.length) {
      setAttendance(new Map());
      setAttendanceLoading(false);
      return undefined;
    }
    api.fetchAttendanceForWeeks(reportWeekStarts, employeeIds).then(({ data, error }) => {
      if (cancelled) return;
      if (error) {
        showError("Não foi possível carregar a chamada deste período.");
      } else {
        const next = new Map();
        (data || []).forEach((record) => {
          // ALTERAÇÃO: inclui record.week_start na chave para não misturar
          // o "seg" da semana 1 com o "seg" da semana 2 num período quinzenal.
          next.set(attendanceKey(record.employee_id, record.week_start, record.day), record.status);
        });
        setAttendance(next);
      }
      setAttendanceLoading(false);
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportWeekStarts, employees, activeProjectId]);

  // ---------- Obras ----------
  // ALTERAÇÃO: addProject agora recebe também "closingPeriod" (semanal ou
  // quinzenal), escolhido pelo usuário no ProjectForm, e repassa para a API.
  const addProject = useCallback(
    async (name, closingPeriod) => {
      const validationError = validateProjectName(name, projects);
      if (validationError) {
        showError(validationError);
        return { ok: false };
      }

      setSavingProject(true);
      const { data, error } = await api.createProject(name, closingPeriod);
      setSavingProject(false);

      if (error) {
        showError("Não foi possível cadastrar a obra. Tente novamente.");
        return { ok: false };
      }

      setProjects((current) => upsertById(current, data));
      setActiveProjectId(data.id);
      hasHydratedActiveProject.current = true;
      showSuccess(`Obra "${data.name}" cadastrada e aberta para chamada.`);
      return { ok: true };
    },
    [projects, showError, showSuccess]
  );

  // ALTERAÇÃO: editProject agora também recebe "closingPeriod", permitindo
  // trocar o período de fechamento de uma obra já cadastrada.
  const editProject = useCallback(
    async (id, name, closingPeriod) => {
      const validationError = validateProjectName(name, projects, id);
      if (validationError) {
        showError(validationError);
        return { ok: false };
      }

      setSavingProject(true);
      const { data, error } = await api.updateProject(id, name, closingPeriod);
      setSavingProject(false);

      if (error) {
        showError("Não foi possível atualizar a obra. Tente novamente.");
        return { ok: false };
      }

      setProjects((current) => upsertById(current, data));
      showSuccess("Obra atualizada com sucesso.");
      return { ok: true };
    },
    [projects, showError, showSuccess]
  );

  const removeProject = useCallback(
    async (id) => {
      const { error } = await api.deleteProject(id);
      if (error) {
        showError("Não foi possível excluir esta obra. Tente novamente.");
        return { ok: false };
      }

      setProjects((current) => current.filter((project) => project.id !== id));
      setEmployees((current) => current.filter((employee) => employee.project_id !== id));
      showSuccess("Obra excluída.");
      return { ok: true };
    },
    [showError, showSuccess]
  );

  // ---------- Funcionários ----------
  const addEmployee = useCallback(
    async (payload) => {
      const validationError = validateEmployee(payload, employees);
      if (validationError) {
        showError(validationError);
        return { ok: false };
      }

      setSavingEmployee(true);
      const { data, error } = await api.createEmployee(payload);
      setSavingEmployee(false);

      if (error) {
        showError("Não foi possível cadastrar o funcionário. Tente novamente.");
        return { ok: false };
      }

      setEmployees((current) => upsertById(current, data));
      setActiveProjectId(payload.projectId);
      showSuccess(`Funcionário "${data.name}" cadastrado com sucesso.`);
      return { ok: true, employee: data };
    },
    [employees, showError, showSuccess]
  );

  const editEmployee = useCallback(
    async (id, payload) => {
      const validationError = validateEmployee(payload, employees, id);
      if (validationError) {
        showError(validationError);
        return { ok: false };
      }

      setSavingEmployee(true);
      const { data, error } = await api.updateEmployee(id, payload);
      setSavingEmployee(false);

      if (error) {
        showError("Não foi possível atualizar o funcionário. Tente novamente.");
        return { ok: false };
      }

      setEmployees((current) => upsertById(current, data));
      showSuccess("Funcionário atualizado com sucesso.");
      return { ok: true };
    },
    [employees, showError, showSuccess]
  );

  const removeEmployee = useCallback(
    async (id) => {
      const { error } = await api.deleteEmployee(id);
      if (error) {
        showError("Não foi possível excluir este funcionário. Tente novamente.");
        return { ok: false };
      }

      setEmployees((current) => current.filter((employee) => employee.id !== id));
      showSuccess("Funcionário excluído.");
      return { ok: true };
    },
    [showError, showSuccess]
  );

  // ---------- Frequência ----------
  // ALTERAÇÃO: toggleAttendance agora recebe também "weekStart" (a semana
  // específica daquela coluna), já que um período quinzenal mostra colunas
  // de 2 semanas diferentes ao mesmo tempo. Antes só recebia (employeeId, day)
  // porque só existia uma semana em tela.
  const toggleAttendance = useCallback(
    async (employeeId, weekStart, day) => {
      const key = attendanceKey(employeeId, weekStart, day);
      const current = attendance.get(key) || "absent";
      const nextStatus = ATTENDANCE_CYCLE[(ATTENDANCE_CYCLE.indexOf(current) + 1) % ATTENDANCE_CYCLE.length];

      setAttendance((prev) => new Map(prev).set(key, nextStatus));
      setPendingCells((prev) => new Set(prev).add(key));

      const { error } = await api.upsertAttendance({
        employeeId,
        weekStart,
        day,
        status: nextStatus,
      });

      setPendingCells((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });

      if (error) {
        // reverte otimisticamente em caso de falha
        setAttendance((prev) => new Map(prev).set(key, current));
        showError("Não foi possível salvar a marcação. Tente novamente.");
      }
    },
    [attendance, showError]
  );

  // ALTERAÇÃO: goToPreviousWeek/goToNextWeek viraram goToPreviousPeriod/
  // goToNextPeriod e usam addPeriods (pula 1 semana no modo semanal, 2
  // semanas no modo quinzenal) em vez de addWeeks fixo. goToCurrentWeek virou
  // goToCurrentPeriod, mas continua voltando para a segunda-feira da semana
  // atual (o período de 1 ou 2 semanas é recalculado a partir dali).
  const goToPreviousPeriod = useCallback(
    () => setPeriodStart((current) => addPeriods(current, -1, closingPeriod)),
    [closingPeriod]
  );
  const goToNextPeriod = useCallback(
    () => setPeriodStart((current) => addPeriods(current, 1, closingPeriod)),
    [closingPeriod]
  );
  const goToCurrentPeriod = useCallback(() => setPeriodStart(getWeekStart()), []);

  const setReportDateRange = useCallback((startDate, endDate) => {
    setReportStartDate(normalizePeriodStart(startDate));
    setReportEndDate(endDate);
  }, []);

  const shiftReportRange = useCallback(
    (direction) => {
      const nextStart = closingPeriod === "semanal"
        ? addWeeks(reportStartDate, direction)
        : addWeeks(reportStartDate, direction * 2);
      const nextEnd = closingPeriod === "semanal"
        ? addWorkingDays(nextStart, 6)
        : addWorkingDays(nextStart, 12);
      setReportStartDate(nextStart);
      setReportEndDate(nextEnd);
    },
    [reportStartDate, closingPeriod]
  );

  // ---------- Derivados ----------
  // ALTERAÇÃO: "activeProject" foi movido para cima (perto do topo do
  // componente) — ver comentário lá. Removida a definição duplicada que
  // existia aqui.

  const activeEmployees = useMemo(
    () => employees
      .filter((employee) => employee.project_id === activeProjectId)
      .sort((left, right) => left.name.localeCompare(right.name, "pt-BR", { sensitivity: "base" })),
    [employees, activeProjectId]
  );

  // ALTERAÇÃO: getAttendanceStatus e isCellPending agora recebem "weekStart"
  // também, para bater com a nova assinatura de attendanceKey.
  const getAttendanceStatus = useCallback(
    (employeeId, weekStart, day) => attendance.get(attendanceKey(employeeId, weekStart, day)) || "absent",
    [attendance]
  );

  const isCellPending = useCallback(
    (employeeId, weekStart, day) => pendingCells.has(attendanceKey(employeeId, weekStart, day)),
    [pendingCells]
  );

  // ALTERAÇÃO: summary somava só os 6 dias de UMA semana (DAY_KEYS). Agora
  // percorre também periodWeekStarts, então num período quinzenal soma os
  // 12 dias (2 semanas x 6 dias) das duas semanas em tela.
  const summary = useMemo(() => {
    const counts = { full: 0, half: 0, absent: 0 };
    activeEmployees.forEach((employee) => {
      reportWeekStarts.forEach((weekStart) => {
        DAY_KEYS.forEach((day) => {
          const status = getAttendanceStatus(employee.id, weekStart, day);
          counts[status] += 1;
        });
      });
    });
    return counts;
  }, [activeEmployees, reportWeekStarts, getAttendanceStatus]);

  const firstFilledDay = useMemo(() => {
    const firstWeekStart = reportWeekStarts[0];
    if (!firstWeekStart) return null;

    const filledDays = reportWeekStarts.flatMap((weekStart, weekIndex) =>
      DAY_KEYS.flatMap((day) => {
        const filled = activeEmployees.some((employee) => {
          const status = getAttendanceStatus(employee.id, weekStart, day);
          return status === "full" || status === "half";
        });
        return filled ? [{ weekIndex, day }] : [];
      })
    );

    const firstWeekday = filledDays.find(({ day }) => day !== "sab") || null;
    const saturday = filledDays.find(({ day }) => day === "sab") || null;
    return { start: firstWeekday, end: saturday };
  }, [activeEmployees, reportWeekStarts, getAttendanceStatus]);

  // ALTERAÇÃO: buildReport agora soma os dias de TODAS as semanas do período
  // (periodWeekStarts), não só de uma semana fixa. No modo quinzenal, o
  // relatório de pagamento reflete as 2 semanas do período corretamente.
  const buildReport = useCallback(() => {
    return activeEmployees.map((employee) => {
      const days = periodWeekStarts.flatMap((weekStart) =>
        DAY_KEYS.map((day) => getAttendanceStatus(employee.id, weekStart, day))
      );
      const full = days.filter((status) => status === "full").length;
      const half = days.filter((status) => status === "half").length;
      const absent = days.filter((status) => status === "absent").length;
      const total = full * employee.daily_rate + half * (employee.daily_rate / 2);
      return { employee, full, half, absent, total };
    });
  }, [activeEmployees, periodWeekStarts, getAttendanceStatus]);

  const generateReport = useCallback(() => {
    if (!activeProject || !activeEmployees.length) {
      showError("Selecione uma obra com funcionários cadastrados para gerar o relatório.");
      return;
    }
    setReportVisible(true);
  }, [activeProject, activeEmployees, showError]);

  const value = {
    projects,
    employees,
    initialLoading,
    loadError,
    activeProjectId,
    activeProject,
    activeEmployees,
    setActiveProjectId,
    // ALTERAÇÃO: expõe os novos nomes/conceitos de período no lugar de
    // "weekStart" + goToPreviousWeek/goToNextWeek/goToCurrentWeek.
    periodStart,
    reportStartDate,
    reportEndDate,
    setReportDateRange,
      shiftReportRange,
    periodWeekStarts,
    reportWeekStarts,
    closingPeriod,
    attendanceLoading,
    goToPreviousPeriod,
    goToNextPeriod,
    goToCurrentPeriod,
    savingProject,
    savingEmployee,
    addProject,
    editProject,
    removeProject,
    addEmployee,
    editEmployee,
    removeEmployee,
    toggleAttendance,
    getAttendanceStatus,
    isCellPending,
    firstFilledDay,
    summary,
    buildReport,
    reportVisible,
    generateReport,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

function upsertById(list, item) {
  const exists = list.some((entry) => entry.id === item.id);
  return exists ? list.map((entry) => (entry.id === item.id ? item : entry)) : [...list, item];
}

function applyRealtimeChange(list, payload) {
  if (payload.eventType === "INSERT") {
    return upsertById(list, payload.new);
  }
  if (payload.eventType === "UPDATE") {
    return upsertById(list, payload.new);
  }
  if (payload.eventType === "DELETE") {
    return list.filter((entry) => entry.id !== payload.old.id);
  }
  return list;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp deve ser usado dentro de um AppProvider.");
  }
  return context;
}
