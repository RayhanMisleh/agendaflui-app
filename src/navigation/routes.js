// Manifesto das rotas: a estrutura de telas não muda sem passar por aqui e por tests/unit/routes.test.js.
const names = [
  "CodigoLoja", "Intro", "Navigator", "Login", "SignUp", "RecuperarSenha",
  "NewUserEmailCode", "ConfirmarExclusao", "MainTabs", "Agendar", "Loja",
  "Perfil", "AppointmentSuccess", "HistoricoAgendamentos", "AlterarSenha",
  "MeusPedidos", "Carrinho", "RedemptionSuccess", "MinhaJornada",
  "ProductsList", "SingleProduct", "MeusPedidosList", "PedidoDetalhes",
  "BoasVindas", "EntradaEquipe", "Equipe", "EquipeTabs", "Atendimento", "Remarcar",
  "BloquearHorario", "ClienteEquipe", "AgendaEquipe", "PerfilEquipe",
];

export const ROUTES = Object.freeze(Object.fromEntries(names.map((n) => [n, n])));

export const ROOT_ROUTES = ["CodigoLoja", "Intro", "Navigator", "Login", "SignUp", "RecuperarSenha", "NewUserEmailCode", "ConfirmarExclusao", "BoasVindas", "EntradaEquipe", "Equipe"];
export const TAB_ROUTES = ["Agendar", "Loja", "Perfil"];
export const MAIN_STACK_ROUTES = ["MainTabs", "AppointmentSuccess", "HistoricoAgendamentos", "AlterarSenha", "MeusPedidos", "Carrinho", "RedemptionSuccess", "MinhaJornada"];
export const PRODUCTS_STACK_ROUTES = ["ProductsList", "SingleProduct"];
export const ORDERS_STACK_ROUTES = ["MeusPedidosList", "PedidoDetalhes"];
export const STAFF_STACK_ROUTES = ["EquipeTabs", "Atendimento", "Remarcar", "BloquearHorario", "ClienteEquipe"];
export const STAFF_TAB_ROUTES = ["AgendaEquipe", "PerfilEquipe"];
export const BOOKING_STEPS = ["profissional", "servico", "data", "horario"];

// Primeira tela da pilha raiz. Modo equipe abre a área da equipe; sem loja escolhida, a escolha entre cliente e
// equipe; com loja, a web sem login abre na Intro.
export function initialRootRoute({ platform, hasBusiness, isAuthenticated, mode }) {
  if (mode === "staff") return ROUTES.Equipe;
  if (!hasBusiness) return ROUTES.BoasVindas;
  return platform === "web" && !isAuthenticated ? ROUTES.Intro : ROUTES.Navigator;
}
