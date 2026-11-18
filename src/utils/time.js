// Datas 'AAAA-MM-DD'. Fuso só aqui: o dia de hoje é o da conta (Intl), o resto é aritmética de calendário.
const MAX_RANGE_DAYS = 30;

export function localDateIn(timeZone, instant) {
  const date = instant instanceof Date ? instant : new Date(instant);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type) => parts.find((p) => p.type === type).value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function addDays(date, n) {
  const [y, m, d] = date.split("-").map(Number);
  const moved = new Date(Date.UTC(y, m - 1, d + n));
  return moved.toISOString().slice(0, 10);
}

export function bookingRange(timeZone, now, maxAdvanceDays) {
  const from = localDateIn(timeZone, now);
  const advance = Number.isFinite(maxAdvanceDays) && maxAdvanceDays > 0 ? maxAdvanceDays : MAX_RANGE_DAYS;
  return { from, to: addDays(from, Math.min(advance, MAX_RANGE_DAYS)) };
}

// Rótulos de um dia 'AAAA-MM-DD' da conta. É calendário puro (UTC só como suporte do Intl), sem fuso do aparelho.
function utcDay(date) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function formatDay(date) {
  return utcDay(date).toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
}

export function dayParts(date) {
  const day = utcDay(date);
  return {
    day: String(day.getUTCDate()),
    month: day.toLocaleDateString("pt-BR", { month: "short", timeZone: "UTC" }).replace(".", ""),
  };
}
