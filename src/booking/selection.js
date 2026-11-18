export const ANY_PROFESSIONAL = "any";

// Serviços que o profissional escolhido faz, na ordem de `services`; "qualquer profissional" mostra todos.
export function servicesFor(professionalId, professionals, services) {
  if (professionalId === ANY_PROFESSIONAL) return services;
  const professional = professionals.find((p) => p.id === professionalId);
  if (!professional) return [];
  const ids = new Set(professional.serviceIds || []);
  return services.filter((s) => ids.has(s.id));
}

// "Qualquer profissional" não manda professionalId: o servidor escolhe.
export function professionalParam(professionalId) {
  return !professionalId || professionalId === ANY_PROFESSIONAL ? null : professionalId;
}

export function canPickService(service, isClubMember) {
  return !service.clubOnly || Boolean(isClubMember);
}

// Corpo do agendamento (um só serviço) e a assinatura que decide a Idempotency-Key.
export function buildBooking({ serviceId, startsAt, professionalId }) {
  return { serviceIds: [serviceId], startsAt, professionalId: professionalParam(professionalId) };
}

export function bookingSignature(booking) {
  return JSON.stringify({
    serviceIds: booking.serviceIds,
    startsAt: booking.startsAt,
    professionalId: booking.professionalId,
  });
}

const STATUS = {
  PENDING: { label: "Aguardando confirmação", tone: "warning" },
  CONFIRMED: { label: "Confirmado", tone: "success" },
  COMPLETED: { label: "Concluído", tone: "neutral" },
  CANCELED: { label: "Cancelado", tone: "danger" },
  NO_SHOW: { label: "Falta", tone: "danger" },
};

// Situação em texto (a cor só acompanha, nunca é a única informação).
export function appointmentStatus(status) {
  return STATUS[status] || { label: "Situação indisponível", tone: "neutral" };
}
