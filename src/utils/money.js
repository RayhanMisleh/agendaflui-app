// Valor em centavos (inteiro) como vem da API; nada de ponto flutuante.
export function formatCents(cents) {
  const value = Math.trunc(Number(cents)) || 0;
  const abs = Math.abs(value);
  const reais = String(Math.trunc(abs / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const rest = String(abs % 100).padStart(2, "0");
  return `${value < 0 ? "-" : ""}R$ ${reais},${rest}`;
}

export function durationLabel(minutes) {
  const total = Math.trunc(Number(minutes)) || 0;
  if (total <= 0) return "";
  const h = Math.trunc(total / 60);
  const m = total % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}
