import { staffApi } from "../staff/api";

// API da equipe na loja atual, sempre pelo cliente da equipe (token da equipe, nunca o do cliente).
const http = (path, config) => staffApi.http.request({ url: path, ...config });
const id = (value) => encodeURIComponent(value);

function compact(params) {
  const out = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined) out[key] = value;
  }
  return out;
}

// Sem X-Business e sem token: a loja vem na resposta. Devolve { tokens, member, business }.
export async function staffLogin({ email, password }) {
  const response = await http("/auth/staff/login", {
    method: "post",
    data: { email: String(email || "").trim().toLowerCase(), password },
  });
  return response.data;
}

// 204. A loja vai explícita: quando a requisição sair, a loja ativa já pode ter sido apagada.
export async function staffLogout(refreshToken, slug) {
  await http("/auth/staff/logout", { method: "post", data: { refreshToken }, headers: { "X-Business": slug } });
}

export async function getStaffMe() {
  return (await http("/staff/me", { method: "get" })).data;
}

// Só quem vê todas as agendas muda isso; o servidor responde 403 aos outros.
export async function setNotifyAll(value) {
  return (await http("/staff/me", { method: "patch", data: { notifyAllAppointments: Boolean(value) } })).data;
}

// Devolve { days }. Quem não vê todas as agendas recebe só a própria coluna.
export async function getAgenda({ from, to, professionalId }) {
  return (await http("/staff/agenda", { method: "get", params: compact({ from, to, professionalId }) })).data;
}

export async function getStaffAppointment(appointmentId) {
  return (await http(`/staff/appointments/${id(appointmentId)}`, { method: "get" })).data;
}

export async function confirmAppointment(appointmentId) {
  return (await http(`/staff/appointments/${id(appointmentId)}/confirm`, { method: "post" })).data;
}

export async function completeAppointment(appointmentId) {
  return (await http(`/staff/appointments/${id(appointmentId)}/complete`, { method: "post" })).data;
}

export async function markNoShow(appointmentId) {
  return (await http(`/staff/appointments/${id(appointmentId)}/no-show`, { method: "post" })).data;
}

export async function cancelStaffAppointment(appointmentId, reason) {
  const data = reason ? { reason } : {};
  return (await http(`/staff/appointments/${id(appointmentId)}/cancel`, { method: "post", data })).data;
}

export async function rescheduleStaffAppointment(appointmentId, { startsAt, professionalId }) {
  const data = { startsAt };
  if (professionalId !== undefined) data.professionalId = professionalId;
  return (await http(`/staff/appointments/${id(appointmentId)}/reschedule`, { method: "post", data })).data;
}

// Horários livres: rota pública, sem token. Devolve { date, durationMin, totalCents, slots }.
export async function freeSlots({ date, serviceIds, professionalId }) {
  const params = compact({ date, serviceIds: serviceIds.join(","), professionalId });
  return (await http("/availability", { method: "get", params })).data;
}

export async function listStaffProfessionals() {
  return (await http("/staff/professionals", { method: "get" })).data.items;
}

export async function createTimeBlock(input) {
  return (await http("/staff/time-blocks", { method: "post", data: input })).data;
}

export async function getStaffCustomer(customerId) {
  return (await http(`/staff/customers/${id(customerId)}`, { method: "get" })).data;
}

// scope: 'upcoming' | 'past'. Devolve { items, nextCursor }.
export async function listCustomerAppointments(customerId, { scope, cursor } = {}) {
  const params = compact({ scope, cursor });
  return (await http(`/staff/customers/${id(customerId)}/appointments`, { method: "get", params })).data;
}
