import { pendingRegistration } from "../../src/auth/pendingRegistration";

afterEach(() => pendingRegistration.clear());

describe("pendingRegistration", () => {
  const data = { name: "Ana", email: "Ana@X.com ", phone: "", password: "senha-longa-1" };

  test("guarda os dados e devolve só para o mesmo e-mail", () => {
    pendingRegistration.set(data);
    expect(pendingRegistration.get("ana@x.com")).toEqual({ ...data, email: "ana@x.com" });
    expect(pendingRegistration.get(" ANA@x.com")).not.toBeNull();
    expect(pendingRegistration.get("outra@x.com")).toBeNull();
  });

  test("clear apaga tudo", () => {
    pendingRegistration.set(data);
    pendingRegistration.clear();
    expect(pendingRegistration.get("ana@x.com")).toBeNull();
  });

  test("sem cadastro em andamento devolve null", () => {
    expect(pendingRegistration.get("ana@x.com")).toBeNull();
  });
});
