// Na web não há cofre: os tokens ficam no localStorage do navegador, legível por qualquer script da mesma
// origem (limitação registrada no README). Por isso a web só deve rodar em origem própria, sem scripts de terceiros.
function storage() {
  try {
    return window.localStorage;
  } catch (error) {
    return null;
  }
}

export const secureStorage = {
  async getItem(key) {
    const s = storage();
    return s ? s.getItem(key) : null;
  },
  async setItem(key, value) {
    const s = storage();
    if (s) s.setItem(key, value);
  },
  async removeItem(key) {
    const s = storage();
    if (s) s.removeItem(key);
  },
};

export default secureStorage;
