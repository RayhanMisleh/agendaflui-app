// Termos da conta (profissional, cliente, pontos, clube): vêm de GET /v1/business; o que faltar usa o padrão.
export const DEFAULT_TERMS = Object.freeze({
  professional: Object.freeze({ singular: "Profissional", plural: "Profissionais" }),
  customer: Object.freeze({ singular: "Cliente", plural: "Clientes" }),
  points: Object.freeze({ singular: "ponto", plural: "pontos" }),
  club: "Clube",
});

function text(value, fallback) {
  return typeof value === "string" && value.trim() !== "" ? value : fallback;
}

function pair(value, fallback) {
  const source = value && typeof value === "object" ? value : {};
  return { singular: text(source.singular, fallback.singular), plural: text(source.plural, fallback.plural) };
}

// Sempre devolve um objeto novo e completo, campo a campo.
export function termsOf(business) {
  const source = business && business.terms && typeof business.terms === "object" ? business.terms : {};
  return {
    professional: pair(source.professional, DEFAULT_TERMS.professional),
    customer: pair(source.customer, DEFAULT_TERMS.customer),
    points: pair(source.points, DEFAULT_TERMS.points),
    club: text(source.club, DEFAULT_TERMS.club),
  };
}

// '1 ponto', '0 pontos', '1.250 pontos'.
export function pointsLabel(n, terms) {
  const points = (terms && terms.points) || DEFAULT_TERMS.points;
  const value = Math.trunc(Number(n)) || 0;
  const grouped = String(Math.abs(value)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${value < 0 ? "-" : ""}${grouped} ${Math.abs(value) === 1 ? points.singular : points.plural}`;
}
