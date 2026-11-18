import { api } from "./index";

// Entrada do cliente na loja atual (X-Business vem do cliente da API). O e-mail vai sempre aparado e em minúsculas.
function cleanEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function cleanPhone(phone) {
  const value = typeof phone === "string" ? phone.trim() : "";
  return value === "" ? null : value;
}

// Devolve { tokens, customer }.
export async function login({ email, password }) {
  const response = await api.http.post("/auth/customer/login", { email: cleanEmail(email), password });
  return response.data;
}

// 202: a conta só nasce quando o código chega em `verify`.
export async function register({ name, email, phone, password }) {
  await api.http.post("/auth/customer/register", {
    name: String(name || "").trim(),
    email: cleanEmail(email),
    phone: cleanPhone(phone),
    password,
  });
}

// Devolve { tokens, customer }.
export async function verify({ email, code }) {
  const response = await api.http.post("/auth/customer/verify", {
    email: cleanEmail(email),
    code: String(code || "").trim(),
  });
  return response.data;
}

// 202: a resposta é a mesma exista o e-mail ou não.
export async function forgotPassword(email) {
  await api.http.post("/auth/customer/password/forgot", { email: cleanEmail(email) });
}

// 204.
export async function resetPassword({ email, code, password }) {
  await api.http.post("/auth/customer/password/reset", {
    email: cleanEmail(email),
    code: String(code || "").trim(),
    password,
  });
}
