// Funções utilitárias para validação
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Senha da conta: de 10 a 200 caracteres (o servidor confere de novo).
export const validatePassword = (password) => {
  return typeof password === "string" && password.length >= 10 && password.length <= 200;
};

// Código de verificação: 6 dígitos.
export const validateCode = (code) => {
  return typeof code === "string" && /^\d{6}$/.test(code.trim());
};

// Função para debounce
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};
