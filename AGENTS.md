# AgendaFlui — aplicativo

Design: `docs/superpowers/specs/2026-11-18-reforma-app-design.md`. Plano: `docs/superpowers/plans/2026-11-18-reforma-app.md`. Textos em pt-BR.

## Regras

- JavaScript, Expo SDK 54, React Native 0.81, react-navigation 7, axios. Sem TypeScript nem expo-router. Dependência nova só com `npx expo install` e npm.
- Contrato da API: o repositório irmão `../painel` (`src/app/api/v1/**`, `src/server/api/`). Só leitura; em dúvida sobre um campo, leia a rota.
- Toda chamada à API passa por `src/api/client.js`. Nenhum `fetch` nem `axios` direto em tela, componente ou serviço.
- Tokens só no SecureStore (web: `localStorage`). Nunca em AsyncStorage, log, URL ou parâmetro de navegação. Sem `console.*` com dados de requisição, resposta, token, senha ou código.
- `X-Business` em toda requisição; dados de uma loja nunca aparecem com outra loja escolhida.
- `Idempotency-Key` ao criar agendamento, resgate e pedido, por `createIdempotencyKeys`.
- Marca: tokens de `src/theme/tokens.js` (fonte em `../branding/`), ícones Feather pelo componente `Icon`, cartão com borda fina e sem sombra. Sem cor fixa fora do tema. Informação nunca só por cor.
- Textos: frase curta, verbo na frente, "você". Termos da conta (profissional, cliente, pontos, clube) por `useTerms()`, nunca fixos.
- Ação sem rota na v1: o botão some. Módulo desligado: a seção some, sem erro.
- A área da equipe mora em `src/staff/` e chama a API só pelo `staffApi` (`src/staff/api.js`): o token da equipe nunca vai para `/availability`, `/business` nem rotas de cliente, e o do cliente nunca para `/staff/*`. Um modo por vez no aparelho (cliente ou equipe). O design de 23/11 (`../painel/docs/superpowers/specs/2026-11-23-entrada-equipe-app-design.md`) manda onde conflitar com o de 18/11.
- Rotas só mudam em `src/navigation/routes.js`, junto com `tests/unit/routes.test.js`.
- Lógica nova tem teste Jest em `tests/unit/`, sem rede (`tests/helpers/fake-adapter.js`) e sem armazenamento real (`tests/helpers/memory-storage.js`).
- Sem termos do app antigo: `tests/unit/old-terms.test.js` varre o código e a documentação.

## Verificação

```bash
npm test
npx expo export --platform web --output-dir dist/web
npx expo export --platform android --output-dir dist/android
```

Não use navegador, simulador nem `expo start` em verificações automáticas. Não commite `.env`, `dist/` nem `node_modules/`.
