import { addDays } from "../utils/time";

// Lógica pura da agenda da equipe. Datas 'AAAA-MM-DD' da conta; nada de fuso aqui.
function weekdayIndex(date) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0 = domingo
}

// 'day' é só o dia; 'week' vai da segunda ao domingo que contém a data.
export function agendaRange(view, date) {
  if (view !== "week") return { from: date, to: date };
  const sinceMonday = (weekdayIndex(date) + 6) % 7;
  const from = addDays(date, -sinceMonday);
  return { from, to: addDays(from, 6) };
}

// Dia anda de 1 em 1; semana de 7 em 7. `direction` é 1 (adiante) ou -1 (para trás).
export function shiftDate(view, date, direction) {
  return addDays(date, (view === "week" ? 7 : 1) * direction);
}

const byStart = (a, b) => String(a.startsAt).localeCompare(String(b.startsAt));

// Itens de todas as colunas do dia (ou só da escolhida), em ordem de início.
export function agendaDays(days, { professionalId } = {}) {
  return (days || []).map((day) => {
    const columns = (day.professionals || []).filter((column) => !professionalId || column.id === professionalId);
    const items = [];
    const blocks = [];
    for (const column of columns) {
      items.push(...(column.appointments || []));
      for (const block of column.blocks || []) blocks.push({ ...block, professionalName: column.name });
    }
    return {
      date: day.date,
      closed: Boolean(day.closed),
      closureReason: day.closureReason || null,
      items: items.sort(byStart),
      blocks: blocks.sort(byStart),
    };
  });
}

// Atendimentos e bloqueios do dia numa lista só, por início. Cada linha: { kind, value }.
export function agendaTimeline(day) {
  const rows = [
    ...day.items.map((value) => ({ kind: "appointment", value })),
    ...day.blocks.map((value) => ({ kind: "block", value })),
  ];
  return rows.sort((a, b) => byStart(a.value, b.value));
}

// O que a equipe pode fazer com o atendimento agora. Concluir e marcar falta só depois do início.
export function appointmentActions(appt, nowIso) {
  if (!appt) return [];
  if (appt.status === "PENDING") return ["confirm", "cancel", "reschedule"];
  if (appt.status === "CONFIRMED") {
    const started = new Date(appt.startsAt).getTime() <= new Date(nowIso).getTime();
    return started ? ["complete", "no_show", "cancel", "reschedule"] : ["cancel", "reschedule"];
  }
  return [];
}

// Só quem vê todas as agendas escolhe a agenda de outro profissional.
export function canFilterProfessionals(profile) {
  return Boolean(profile && Array.isArray(profile.capabilities) && profile.capabilities.includes("view_all_agendas"));
}
