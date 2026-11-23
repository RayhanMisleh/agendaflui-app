import fs from "fs";
import path from "path";
import {
  ROUTES,
  ROOT_ROUTES,
  TAB_ROUTES,
  MAIN_STACK_ROUTES,
  PRODUCTS_STACK_ROUTES,
  ORDERS_STACK_ROUTES,
  STAFF_STACK_ROUTES,
  STAFF_TAB_ROUTES,
  BOOKING_STEPS,
  initialRootRoute,
} from "../../src/navigation/routes";

const root = path.join(__dirname, "..", "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

// Nomes (ROUTES.X) de cada <Componente ... name={ROUTES.X}, na ordem do texto.
const sequence = (file, component) => {
  const text = read(file);
  const re = new RegExp(`<${component}\\.Screen[^>]*?name=\\{ROUTES\\.(\\w+)\\}`, "gs");
  return [...text.matchAll(re)].map((m) => m[1]);
};

describe("manifesto de rotas", () => {
  test("listas fixas", () => {
    expect(ROOT_ROUTES).toEqual([
      "CodigoLoja", "Intro", "Navigator", "Login", "SignUp", "RecuperarSenha",
      "NewUserEmailCode", "ConfirmarExclusao", "BoasVindas", "EntradaEquipe", "Equipe",
    ]);
    expect(STAFF_STACK_ROUTES).toEqual(["EquipeTabs", "Atendimento", "Remarcar", "BloquearHorario", "ClienteEquipe"]);
    expect(STAFF_TAB_ROUTES).toEqual(["AgendaEquipe", "PerfilEquipe"]);
    expect(TAB_ROUTES).toEqual(["Agendar", "Loja", "Perfil"]);
    expect(MAIN_STACK_ROUTES).toEqual([
      "MainTabs", "AppointmentSuccess", "HistoricoAgendamentos", "AlterarSenha",
      "MeusPedidos", "Carrinho", "RedemptionSuccess", "MinhaJornada",
    ]);
    expect(PRODUCTS_STACK_ROUTES).toEqual(["ProductsList", "SingleProduct"]);
    expect(ORDERS_STACK_ROUTES).toEqual(["MeusPedidosList", "PedidoDetalhes"]);
    expect(BOOKING_STEPS).toEqual(["profissional", "servico", "data", "horario"]);
  });

  test("ROUTES: valor igual ao nome", () => {
    expect(Object.keys(ROUTES)).toEqual([
      "CodigoLoja", "Intro", "Navigator", "Login", "SignUp", "RecuperarSenha",
      "NewUserEmailCode", "ConfirmarExclusao", "MainTabs", "Agendar", "Loja",
      "Perfil", "AppointmentSuccess", "HistoricoAgendamentos", "AlterarSenha",
      "MeusPedidos", "Carrinho", "RedemptionSuccess", "MinhaJornada",
      "ProductsList", "SingleProduct", "MeusPedidosList", "PedidoDetalhes",
      "BoasVindas", "EntradaEquipe", "Equipe", "EquipeTabs", "Atendimento", "Remarcar",
      "BloquearHorario", "ClienteEquipe", "AgendaEquipe", "PerfilEquipe",
    ]);
    for (const [key, value] of Object.entries(ROUTES)) expect(value).toBe(key);
  });

  test("a pilha raiz de App.js segue ROOT_ROUTES", () => {
    expect(sequence("App.js", "Stack")).toEqual(ROOT_ROUTES);
  });

  test("as abas e a pilha principal de Navigator.js seguem o manifesto", () => {
    expect(sequence("src/screens/Navigator.js", "Tab")).toEqual(TAB_ROUTES);
    expect(sequence("src/screens/Navigator.js", "Stack")).toEqual(MAIN_STACK_ROUTES);
  });

  test("as abas da equipe seguem o manifesto e a pilha da equipe começa pelas abas", () => {
    expect(sequence("src/staff/StaffNavigator.js", "Tab")).toEqual(STAFF_TAB_ROUTES);
    const stack = sequence("src/staff/StaffNavigator.js", "Stack");
    expect(stack).toEqual(STAFF_STACK_ROUTES.slice(0, stack.length));
    expect(stack[0]).toBe("EquipeTabs");
  });

  test("as pilhas da Loja e de Pedidos seguem o manifesto", () => {
    expect(sequence("src/screens/ProductsStack.js", "Stack")).toEqual(PRODUCTS_STACK_ROUTES);
    expect(sequence("src/screens/MeusPedidosStack.js", "Stack")).toEqual(ORDERS_STACK_ROUTES);
  });
});

describe("primeira tela da pilha raiz", () => {
  test("sem loja escolhida abre BoasVindas, na web e no celular", () => {
    for (const platform of ["web", "ios", "android"]) {
      for (const isAuthenticated of [true, false]) {
        expect(initialRootRoute({ platform, hasBusiness: false, isAuthenticated })).toBe("BoasVindas");
        expect(initialRootRoute({ platform, hasBusiness: false, isAuthenticated, mode: "customer" })).toBe("BoasVindas");
      }
    }
  });

  test("modo equipe abre Equipe, em qualquer plataforma", () => {
    for (const platform of ["web", "ios", "android"]) {
      for (const isAuthenticated of [true, false]) {
        expect(initialRootRoute({ platform, hasBusiness: true, isAuthenticated, mode: "staff" })).toBe("Equipe");
      }
    }
  });

  test("com loja: web sem login na Intro; logado ou no celular no Navigator", () => {
    expect(initialRootRoute({ platform: "web", hasBusiness: true, isAuthenticated: false })).toBe("Intro");
    expect(initialRootRoute({ platform: "web", hasBusiness: true, isAuthenticated: true })).toBe("Navigator");
    expect(initialRootRoute({ platform: "ios", hasBusiness: true, isAuthenticated: false })).toBe("Navigator");
    expect(initialRootRoute({ platform: "android", hasBusiness: true, isAuthenticated: true })).toBe("Navigator");
  });

  test("App.js usa a função e a tela escolhida sempre está na pilha", () => {
    const app = read("App.js");
    expect(app).toContain("initialRouteName={initialRootRoute(");
    expect(app).not.toMatch(/initialRouteName=\{Platform/);
  });
});
