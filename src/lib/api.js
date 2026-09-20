import { supabase, useMockData } from "./supabaseClient";
// ALTERAÇÃO: importa normalizeClosingPeriod para garantir que só gravamos
// 'semanal' ou 'quinzenal' no banco, mesmo que algo inesperado chegue aqui.
import { DAY_KEYS, normalizeClosingPeriod } from "./dateUtils";

const createId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `mock-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const mockProjects = [
  { id: "proj-001", name: "Residencial Aurora", closing_period: "quinzenal", created_at: new Date().toISOString() },
  { id: "proj-002", name: "Condomínio Sol Nascente", closing_period: "semanal", created_at: new Date().toISOString() },
];

const mockEmployees = [
  { id: "emp-001", project_id: "proj-001", name: "João Silva", role: "Pedreiro", daily_rate: 320, pix_key: "joao@pix.com", created_at: new Date().toISOString() },
  { id: "emp-002", project_id: "proj-001", name: "Carlos Lima", role: "Servente", daily_rate: 280, pix_key: "carlos@pix.com", created_at: new Date().toISOString() },
  { id: "emp-003", project_id: "proj-002", name: "Mateus Souza", role: "Carpinteiro", daily_rate: 350, pix_key: "mateus@pix.com", created_at: new Date().toISOString() },
];

const mockExpenses = [
  { id: "gasto-001", project_id: "proj-001", description: "Cimento", category: "Material", quantity: 25, unit_price: 32.5, total: 812.5, spent_at: "2026-09-18", notes: "Entrega do fornecedor A", is_settled: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "gasto-002", project_id: "proj-001", description: "Areia", category: "Material", quantity: 8, unit_price: 65, total: 520, spent_at: "2026-09-16", notes: "Carga para base", is_settled: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "gasto-003", project_id: "proj-002", description: "Lona", category: "Proteção", quantity: 3, unit_price: 120, total: 360, spent_at: "2026-09-14", notes: "Proteção externa", is_settled: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

const mockAttendance = [
  { id: "att-001", employee_id: "emp-001", week_start: "2026-09-14", day: "seg", status: "full" },
  { id: "att-002", employee_id: "emp-001", week_start: "2026-09-14", day: "ter", status: "full" },
  { id: "att-003", employee_id: "emp-001", week_start: "2026-09-14", day: "qua", status: "half" },
  { id: "att-004", employee_id: "emp-002", week_start: "2026-09-14", day: "seg", status: "absent" },
  { id: "att-005", employee_id: "emp-002", week_start: "2026-09-14", day: "ter", status: "full" },
  { id: "att-006", employee_id: "emp-003", week_start: "2026-09-14", day: "seg", status: "full" },
  { id: "att-007", employee_id: "emp-003", week_start: "2026-09-14", day: "qua", status: "full" },
];

export function getMockProjects() {
  return [...mockProjects];
}

export function getMockEmployees() {
  return [...mockEmployees];
}

export function getMockExpenses() {
  return [...mockExpenses];
}

/**
 * Camada de acesso a dados. Todas as funções retornam { data, error } e nunca
 * lançam exceções, para que a UI sempre saiba tratar o resultado de forma previsível.
 */

async function run(query) {
  if (useMockData) {
    return { data: query ?? null, error: null };
  }

  const { data, error } = await query;
  if (error) {
    // eslint-disable-next-line no-console
    console.error(error);
  }
  return { data: data ?? null, error };
}

// ---------- Obras ----------

export function fetchProjects() {
  if (useMockData) {
    return Promise.resolve({ data: getMockProjects(), error: null });
  }
  return run(supabase.from("projects").select("*").order("created_at", { ascending: true }));
}

export function createProject(name, closingPeriod) {
  if (useMockData) {
    const next = {
      id: createId(),
      name: name.trim(),
      closing_period: normalizeClosingPeriod(closingPeriod),
      created_at: new Date().toISOString(),
    };
    mockProjects.push(next);
    return Promise.resolve({ data: next, error: null });
  }

  return run(
    supabase
      .from("projects")
      .insert({ name: name.trim(), closing_period: normalizeClosingPeriod(closingPeriod) })
      .select()
      .single()
  );
}

export function updateProject(id, name, closingPeriod) {
  if (useMockData) {
    const index = mockProjects.findIndex((project) => project.id === id);
    if (index === -1) return Promise.resolve({ data: null, error: "not_found" });
    const next = { ...mockProjects[index], name: name.trim(), closing_period: normalizeClosingPeriod(closingPeriod) };
    mockProjects[index] = next;
    return Promise.resolve({ data: next, error: null });
  }

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
  if (useMockData) {
    const beforeLen = mockProjects.length;
    for (let index = mockProjects.length - 1; index >= 0; index -= 1) {
      if (mockProjects[index].id === id) mockProjects.splice(index, 1);
    }
    mockEmployees.splice(0, mockEmployees.length, ...mockEmployees.filter((employee) => employee.project_id !== id));
    mockExpenses.splice(0, mockExpenses.length, ...mockExpenses.filter((expense) => expense.project_id !== id));
    return Promise.resolve({ data: { deleted: beforeLen !== mockProjects.length }, error: null });
  }
  return run(supabase.from("projects").delete().eq("id", id));
}

// ---------- Funcionários ----------

export function fetchEmployees() {
  if (useMockData) {
    return Promise.resolve({ data: getMockEmployees(), error: null });
  }
  return run(supabase.from("employees").select("*").order("created_at", { ascending: true }));
}

export function createEmployee({ name, role, dailyRate, projectId, pixKey }) {
  if (useMockData) {
    const next = {
      id: createId(),
      name: name.trim(),
      role: role.trim(),
      daily_rate: Number(dailyRate),
      project_id: projectId,
      pix_key: pixKey.trim(),
      created_at: new Date().toISOString(),
    };
    mockEmployees.push(next);
    return Promise.resolve({ data: next, error: null });
  }

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
  if (useMockData) {
    const index = mockEmployees.findIndex((employee) => employee.id === id);
    if (index === -1) return Promise.resolve({ data: null, error: "not_found" });
    const next = {
      ...mockEmployees[index],
      name: name.trim(),
      role: role.trim(),
      daily_rate: Number(dailyRate),
      project_id: projectId,
      pix_key: pixKey.trim(),
    };
    mockEmployees[index] = next;
    return Promise.resolve({ data: next, error: null });
  }

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
  if (useMockData) {
    for (let index = mockEmployees.length - 1; index >= 0; index -= 1) {
      if (mockEmployees[index].id === id) mockEmployees.splice(index, 1);
    }
    return Promise.resolve({ data: { deleted: true }, error: null });
  }
  return run(supabase.from("employees").delete().eq("id", id));
}

// ---------- Gastos por obra ----------

export function fetchProjectExpenses() {
  if (useMockData) {
    return Promise.resolve({ data: getMockExpenses(), error: null });
  }
  return run(supabase.from("project_expenses").select("*").order("spent_at", { ascending: false }));
}

export function createProjectExpense({ projectId, description, category, quantity, unitValue, total, spentAt, notes, isSettled = false }) {
  if (useMockData) {
    const next = {
      id: createId(),
      project_id: projectId,
      description: description.trim(),
      category: category.trim(),
      quantity: Number(quantity),
      unit_price: Number(unitValue),
      total: Number(total),
      spent_at: spentAt,
      notes: (notes || "").trim(),
      is_settled: Boolean(isSettled),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockExpenses.push(next);
    return Promise.resolve({ data: next, error: null });
  }

  return run(
    supabase
      .from("project_expenses")
      .insert({
        project_id: projectId,
        description: description.trim(),
        category: category.trim(),
        quantity: Number(quantity),
        unit_price: Number(unitValue),
        total: Number(total),
        spent_at: spentAt,
        notes: (notes || "").trim(),
        is_settled: Boolean(isSettled),
      })
      .select()
      .single()
  );
}

export function updateProjectExpense(id, { projectId, description, category, quantity, unitValue, total, spentAt, notes, isSettled = false }) {
  if (useMockData) {
    const index = mockExpenses.findIndex((expense) => expense.id === id);
    if (index === -1) return Promise.resolve({ data: null, error: "not_found" });
    const next = {
      ...mockExpenses[index],
      project_id: projectId,
      description: description.trim(),
      category: category.trim(),
      quantity: Number(quantity),
      unit_price: Number(unitValue),
      total: Number(total),
      spent_at: spentAt,
      notes: (notes || "").trim(),
      is_settled: Boolean(isSettled),
      updated_at: new Date().toISOString(),
    };
    mockExpenses[index] = next;
    return Promise.resolve({ data: next, error: null });
  }

  return run(
    supabase
      .from("project_expenses")
      .update({
        project_id: projectId,
        description: description.trim(),
        category: category.trim(),
        quantity: Number(quantity),
        unit_price: Number(unitValue),
        total: Number(total),
        spent_at: spentAt,
        notes: (notes || "").trim(),
        is_settled: Boolean(isSettled),
      })
      .eq("id", id)
      .select()
      .single()
  );
}

export function deleteProjectExpense(id) {
  if (useMockData) {
    for (let index = mockExpenses.length - 1; index >= 0; index -= 1) {
      if (mockExpenses[index].id === id) mockExpenses.splice(index, 1);
    }
    return Promise.resolve({ data: { deleted: true }, error: null });
  }
  return run(supabase.from("project_expenses").delete().eq("id", id));
}

// ---------- Frequência ----------

export function fetchAttendanceForWeeks(weekStarts, employeeIds = []) {
  if (useMockData) {
    const filtered = mockAttendance.filter((record) => weekStarts.includes(record.week_start));
    const result = employeeIds.length ? filtered.filter((record) => employeeIds.includes(record.employee_id)) : filtered;
    return Promise.resolve({ data: result, error: null });
  }

  let query = supabase.from("attendance_records").select("*").in("week_start", weekStarts);
  if (employeeIds.length) query = query.in("employee_id", employeeIds);
  return run(query);
}

export function fetchAttendanceForReport(weekStarts, employeeIds = []) {
  if (useMockData) {
    const filtered = mockAttendance.filter((record) => weekStarts.includes(record.week_start));
    const result = employeeIds.length ? filtered.filter((record) => employeeIds.includes(record.employee_id)) : filtered;
    return Promise.resolve({ data: result, error: null });
  }

  let query = supabase.from("attendance_records").select("*").in("week_start", weekStarts);
  if (employeeIds.length) query = query.in("employee_id", employeeIds);
  return run(query);
}

export function upsertAttendance({ employeeId, weekStart, day, status }) {
  if (useMockData) {
    const existingIndex = mockAttendance.findIndex((record) => record.employee_id === employeeId && record.week_start === weekStart && record.day === day);
    if (existingIndex >= 0) {
      mockAttendance[existingIndex] = { ...mockAttendance[existingIndex], status, updated_at: new Date().toISOString() };
      return Promise.resolve({ data: mockAttendance[existingIndex], error: null });
    }
    const next = { id: createId(), employee_id: employeeId, week_start: weekStart, day, status, updated_at: new Date().toISOString() };
    mockAttendance.push(next);
    return Promise.resolve({ data: next, error: null });
  }

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
