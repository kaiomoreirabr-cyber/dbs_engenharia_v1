import { normalize } from "./format";

export function validateProjectName(name, existingProjects, ignoreId = null) {
  const trimmed = (name || "").trim();

  if (!trimmed) {
    return "Informe o nome da obra.";
  }

  if (trimmed.length < 2) {
    return "O nome da obra deve ter pelo menos 2 caracteres.";
  }

  const duplicate = existingProjects.some(
    (project) => project.id !== ignoreId && normalize(project.name) === normalize(trimmed)
  );

  if (duplicate) {
    return "Já existe uma obra com este nome.";
  }

  return null;
}

export function validateEmployee(
  { name, role, dailyRate, projectId, pixKey },
  existingEmployees,
  ignoreId = null
) {
  if (!projectId) {
    return "Selecione a obra vinculada ao funcionário.";
  }

  if (!(name || "").trim()) {
    return "Informe o nome do funcionário.";
  }

  if (!(role || "").trim()) {
    return "Informe a função do funcionário.";
  }

  const rate = Number(dailyRate);
  if (!rate || Number.isNaN(rate) || rate <= 0) {
    return "Informe um valor de diária maior que zero.";
  }

  if (!(pixKey || "").trim()) {
    return "Informe a chave Pix do funcionário.";
  }

  const duplicate = existingEmployees.some(
    (employee) =>
      employee.id !== ignoreId &&
      employee.project_id === projectId &&
      normalize(employee.name) === normalize(name)
  );

  if (duplicate) {
    return "Já existe um funcionário com este nome cadastrado nesta obra.";
  }

  return null;
}
