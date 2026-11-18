import { api } from "./index";

// Agenda do cliente na loja atual (serviços, profissionais, horários e agendamentos). Os horários e rótulos
// já vêm prontos no fuso da loja; o app não calcula fuso.

function compact(params) {
  const out = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined) out[key] = value;
  }
  return out;
}

export async function listServices() {
  const response = await api.http.get("/services");
  return response.data.items;
}

// Cada profissional traz `serviceIds`.
export async function listProfessionals() {
  const response = await api.http.get("/professionals");
  return response.data.items;
}

// Devolve [{ date, weekday, available }].
export async function availableDays({ from, to, serviceIds, professionalId }) {
  const response = await api.http.get("/availability/days", {
    params: compact({ from, to, serviceIds: serviceIds.join(","), professionalId }),
  });
  return response.data.items;
}

// Devolve { date, durationMin, totalCents, slots: [{ startsAt, label, professionalIds }] }.
export async function availableSlots({ date, serviceIds, professionalId }) {
  const response = await api.http.get("/availability", {
    params: compact({ date, serviceIds: serviceIds.join(","), professionalId }),
  });
  return response.data;
}

// A mesma chave nas novas tentativas do mesmo pedido (createIdempotencyKeys).
export async function createAppointment({ serviceIds, startsAt, professionalId, customerNote }, idempotencyKey) {
  const body = { serviceIds, startsAt };
  if (professionalId !== undefined) body.professionalId = professionalId;
  if (customerNote !== undefined) body.customerNote = customerNote;
  const response = await api.http.post("/appointments", body, { headers: { "Idempotency-Key": idempotencyKey } });
  return response.data;
}

export async function nextAppointment() {
  const response = await api.http.get("/appointments/next");
  return response.data.appointment || null;
}

// scope: 'upcoming' | 'past'. Devolve { items, nextCursor }.
export async function listAppointments({ scope, cursor }) {
  const response = await api.http.get("/appointments", { params: compact({ scope, cursor }) });
  return response.data;
}

export async function cancelAppointment(id) {
  const response = await api.http.post(`/appointments/${encodeURIComponent(id)}/cancel`);
  return response.data;
}

// A v1 só troca horário e profissional (o serviço fica).
export async function rescheduleAppointment(id, { startsAt, professionalId }) {
  const body = { startsAt };
  if (professionalId !== undefined) body.professionalId = professionalId;
  const response = await api.http.post(`/appointments/${encodeURIComponent(id)}/reschedule`, body);
  return response.data;
}
