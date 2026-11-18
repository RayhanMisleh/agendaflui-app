import { api } from "./index";

export async function getMe() {
  const response = await api.http.get("/me");
  return response.data;
}

// Só nome, telefone e nascimento mudam por aqui; o resto é da equipe.
export async function updateMe({ name, phone, birthDate }) {
  const body = {};
  if (name !== undefined) body.name = name;
  if (phone !== undefined) body.phone = phone;
  if (birthDate !== undefined) body.birthDate = birthDate;
  const response = await api.http.patch("/me", body);
  return response.data;
}

// 204. A senha atual é conferida pelo servidor.
export async function changePassword({ current, next }) {
  await api.http.put("/me/password", { current, next });
}

// 204. Confirma com a senha; os dados pessoais são anonimizados.
export async function deleteAccount(password) {
  await api.http.post("/me/delete", { password });
}
