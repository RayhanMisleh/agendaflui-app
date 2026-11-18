import { validatePassword, validateCode, validateEmail } from "../../src/utils/helpers";

describe("validatePassword", () => {
  test("pede 10 caracteres ou mais", () => {
    expect(validatePassword("123456789")).toBe(false);
    expect(validatePassword("1234567890")).toBe(true);
  });

  test("aceita até 200 caracteres", () => {
    expect(validatePassword("a".repeat(200))).toBe(true);
    expect(validatePassword("a".repeat(201))).toBe(false);
  });

  test("vazio e fora de texto são recusados", () => {
    expect(validatePassword("")).toBe(false);
    expect(validatePassword(undefined)).toBe(false);
    expect(validatePassword(null)).toBe(false);
  });
});

describe("validateCode", () => {
  test("6 dígitos depois de aparar espaços", () => {
    expect(validateCode(" 123456 ")).toBe(true);
    expect(validateCode("000000")).toBe(true);
  });

  test("recusa letras, tamanho errado e vazio", () => {
    expect(validateCode("12345a")).toBe(false);
    expect(validateCode("12345")).toBe(false);
    expect(validateCode("1234567")).toBe(false);
    expect(validateCode("")).toBe(false);
    expect(validateCode(undefined)).toBe(false);
  });
});

describe("validateEmail", () => {
  test("continua aceitando e recusando como antes", () => {
    expect(validateEmail("ana@x.com")).toBe(true);
    expect(validateEmail("ana@x")).toBe(false);
  });
});
