import { supabase } from "./supabaseClient";
// ALTERAÇÃO: importa normalizeClosingPeriod para garantir que só gravamos
// 'semanal' ou 'quinzenal' no banco, mesmo que algo inesperado chegue aqui.
import { DAY_KEYS, normalizeClosingPeriod } from "./dateUtils";

/**
 * Camada de acesso a dados. Todas as funções retornam { data, error } e nunca
 * lançam exceções, para que a UI sempre saiba tratar o resultado de forma previsível.
 */

async function run(query) {
  const { data, error } = await query;
  if (error) {
    // eslint-disable-next-line no-console
    console.error(error);
  }
  return { data: data ?? null, error };
}

// ---------- Obras ----------

export function fetchProjects() {
  return run(supabase.from("projects").select("*").order("created_at", { ascending: true }));
}

// ALTERAÇÃO: createProject agora recebe também o período de fechamento
// ("semanal" ou "quinzenal") escolhido no formulário e grava na coluna
// "closing_period". O parâmetro é opcional para não quebrar quem já chamava
// esta função sem o segundo argumento (cai no padrão quinzenal).
export function createProject(name, closingPeriod) {
  return run(
    supabase
      .from("projects")
      .insert({ name: name.trim(), closing_period: normalizeClosingPeriod(closingPeriod) })
      .select()
      .single()
  );
}

// ALTERAÇÃO: updateProject agora também atualiza o período de fechamento,
// permitindo trocar uma obra de semanal para quinzenal (ou vice-versa).
export function updateProject(id, name, closingPeriod) {
  return run(
    supabase
      .from("projects")
      .update({ name: name.trim(), closing_period: normalizeClosingPeriod(closingPeriod) })
      .eq("id", id)
      .select()
      .single()
  );
}

export function deleteProject(id) {
  return run(supabase.from("projects").delete().eq("id", id));
}

// ---------- Funcionários ----------

export function fetchEmployees() {
  return run(supabase.from("employees").select("*").order("created_at", { ascending: true }));
}

export function createEmployee({ name, role, dailyRate, projectId, pixKey }) {
  return run(
    supabase
      .from("employees")
      .insert({
        name: name.trim(),
        role: role.trim(),
        daily_rate: Number(dailyRate),
        project_id: projectId,
        pix_key: pixKey.trim(),
      })
      .select()
      .single()
  );
}

export function updateEmployee(id, { name, role, dailyRate, projectId, pixKey }) {
  return run(
    supabase
      .from("employees")
      .update({
        name: name.trim(),
        role: role.trim(),
        daily_rate: Number(dailyRate),
        project_id: projectId,
        pix_key: pixKey.trim(),
      })
      .eq("id", id)
      .select()
      .single()
  );
}

export function deleteEmployee(id) {
  return run(supabase.from("employees").delete().eq("id", id));
}

// ---------- Frequência ----------

// ALTERAÇÃO: antes buscava a frequência de UMA semana (.eq). Agora o período
// de fechamento pode ter 1 semana (semanal) ou 2 semanas (quinzenal), então a
// função passa a receber uma LISTA de "week_start" e usa .in(...) para buscar
// todas de uma vez. Quem chama passa periodWeekStarts (ver AppContext.jsx).
export function fetchAttendanceForWeeks(weekStarts, employeeIds = []) {
  let query = supabase.from("attendance_records").select("*").in("week_start", weekStarts);
  if (employeeIds.length) query = query.in("employee_id", employeeIds);
  return run(query);
}

export function fetchAttendanceForReport(weekStarts, employeeIds = []) {
  let query = supabase.from("attendance_records").select("*").in("week_start", weekStarts);
  if (employeeIds.length) query = query.in("employee_id", employeeIds);
  return run(query);
}

/** Grava (ou atualiza) a marcação de um dia. Usa upsert para evitar corrida de estados. */
export function upsertAttendance({ employeeId, weekStart, day, status }) {
  return run(
    supabase
      .from("attendance_records")
      .upsert(
        { employee_id: employeeId, week_start: weekStart, day, status, updated_at: new Date().toISOString() },
        { onConflict: "employee_id,week_start,day" }
      )
      .select()
      .single()
  );
}

export function isValidDay(day) {
  return DAY_KEYS.includes(day);
}
