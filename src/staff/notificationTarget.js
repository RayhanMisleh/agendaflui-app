import { ROUTES } from "../navigation/routes";

// Aviso da equipe com atendimento: parâmetros para abrir a tela Atendimento, com a agenda por baixo. Sem atendimento: null.
export function appointmentTarget(response) {
  const request = response && response.notification && response.notification.request;
  const data = request && request.content && request.content.data;
  if (!data || !data.appointmentId) return null;
  return { screen: ROUTES.Atendimento, params: { appointmentId: String(data.appointmentId) }, initial: false };
}
