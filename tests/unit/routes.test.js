import fs from "fs";
import path from "path";
import {
  ROUTES,
  ROOT_ROUTES,
  TAB_ROUTES,
  MAIN_STACK_ROUTES,
  PRODUCTS_STACK_ROUTES,
  ORDERS_STACK_ROUTES,
  BOOKING_STEPS,
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
      "NewUserEmailCode", "ConfirmarExclusao",
    ]);
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

  test("as pilhas da Loja e de Pedidos seguem o manifesto", () => {
    expect(sequence("src/screens/ProductsStack.js", "Stack")).toEqual(PRODUCTS_STACK_ROUTES);
    expect(sequence("src/screens/MeusPedidosStack.js", "Stack")).toEqual(ORDERS_STACK_ROUTES);
  });
});
