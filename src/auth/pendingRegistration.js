// Dados do cadastro que espera o código. Só em memória: nunca em parâmetro de navegação nem em armazenamento.
let pending = null;

export const pendingRegistration = {
  set({ name, email, phone, password }) {
    pending = { name, email: String(email || "").trim().toLowerCase(), phone, password };
  },
  // Só devolve os dados se forem do e-mail pedido.
  get(email) {
    if (!pending) return null;
    return pending.email === String(email || "").trim().toLowerCase() ? pending : null;
  },
  clear() {
    pending = null;
  },
};
