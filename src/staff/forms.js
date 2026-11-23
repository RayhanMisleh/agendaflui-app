// Validação dos formulários da equipe, sem rede. Mensagens em pt-BR, uma por campo.
const TIME = /^(\d{2}):(\d{2})$/;
const REASON_MAX = 200;

function minutes(value, { allowEnd = false } = {}) {
  const match = TIME.exec(String(value || "").trim());
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (allowEnd && h === 24 && m === 0) return 24 * 60;
  return h < 24 && m < 60 ? h * 60 + m : null;
}

function validDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ""));
  if (!match) return false;
  const [y, m, d] = match.slice(1).map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

// Corpo de POST /v1/staff/time-blocks (um dia só). Fim '24:00' vale; motivo vazio vira null.
export function blockInput(form) {
  const fields = {};
  const professionalId = String((form && form.professionalId) || "");
  const date = String((form && form.date) || "").trim();
  const start = String((form && form.start) || "").trim();
  const end = String((form && form.end) || "").trim();
  const reason = String((form && form.reason) || "").trim();

  if (!professionalId) fields.professionalId = "Escolha quem fica sem agenda.";
  if (!validDate(date)) fields.date = "Informe o dia como AAAA-MM-DD.";
  const startMin = minutes(start);
  const endMin = minutes(end, { allowEnd: true });
  if (startMin === null) fields.start = "Informe a hora de início como HH:MM.";
  if (endMin === null) fields.end = "Informe a hora final como HH:MM.";
  else if (startMin !== null && endMin <= startMin) fields.end = "A hora final precisa ser depois da inicial.";
  if (reason.length > REASON_MAX) fields.reason = `Use até ${REASON_MAX} caracteres.`;

  if (Object.keys(fields).length > 0) return { ok: false, fields };
  return { ok: true, body: { professionalId, startDate: date, startTime: start, endTime: end, reason: reason || null } };
}

// Formas rápidas de falar com o cliente. Sem dado, sem link.
export function contactLinks(customer) {
  const links = [];
  if (!customer) return links;
  const phone = String(customer.phone || "");
  const digits = phone.replace(/[^\d+]/g, "");
  if (/\d/.test(digits)) links.push({ kind: "phone", label: customer.phoneLabel || phone, url: `tel:${digits}` });
  const email = String(customer.email || "").trim();
  if (email) links.push({ kind: "email", label: email, url: `mailto:${email}` });
  return links;
}
