# AgendaFlui — aplicativo

**Parado.** O app depende da API v1 (`api.agendaflui.com.br`), que foi removida do backend. Hoje o Agenda Flui roda inteiro no navegador, em `app.agendaflui.com.br` (repositório `painel`). Este app não funciona com o backend atual.

Para retomar é preciso uma API nova no `painel` (autenticação, agenda, loja, clube, equipe) e adaptar `src/api/` e `src/staff/api.js` ao contrato dela. Hoje o `painel` usa sessão por cookie e ações no servidor, sem endpoints públicos para app nativo.

## O que é

Aplicativo para web, iOS e Android: o cliente de um negócio agenda horários, acompanha pontos e prêmios do clube e compra produtos; a equipe vê agenda e perfil. Expo SDK 54, React Native 0.81, JavaScript, react-navigation 7 e axios.

## Rodar

```bash
npm install
cp .env.example .env   # opcional
npx expo start
npm test
```

- `EXPO_PUBLIC_API_URL`: endereço da API (padrão `https://api.agendaflui.com.br`, que não existe mais).
- `EXPO_PUBLIC_APP_STORE_URL` e `EXPO_PUBLIC_PLAY_STORE_URL`: páginas nas lojas de aplicativos (só `https://`).
- `EXPO_PUBLIC_PAINEL_URL`: painel da equipe (padrão `https://painel.agendaflui.com.br`).

`npm run build:web` gera `dist/agendaflui-web.zip` (site estático; `scripts/web-zip.js`, `scripts/well-known.js` e `public/.htaccess`).

## Como funciona

- Entrada: link `agendaflui://loja/<slug>` (celular), `/<slug>` (web) ou código da loja na primeira tela. "Sou da equipe" entra com e-mail e senha.
- O aparelho guarda um modo por vez (cliente ou equipe); entrar num apaga a sessão do outro. Trocar de loja apaga sessão, carrinho e aparelho de push.
- Tokens: SecureStore no celular, `localStorage` na web.
- Os testes (`tests/unit/`) cobrem lógica e não usam rede, navegador nem simulador; telas não têm teste.

Regras para quem programa: `AGENTS.md`.
