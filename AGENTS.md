# AgendaFlui — aplicativo

**Parado.** A API v1 do painel, que este app consome, foi removida; o app não funciona com o backend atual. Só mexa aqui para retomá-lo, depois que o `../painel` ganhar uma API nova. Textos em pt-BR.

## Regras

- JavaScript, Expo SDK 54, React Native 0.81, react-navigation 7, axios. Sem TypeScript nem expo-router. Dependência nova só com `npx expo install` e npm.
- Contrato da API: o do repositório irmão `../painel`, quando houver. Em dúvida sobre um campo, leia a rota de lá.
- Toda chamada à API passa por `src/api/client.js`. Nenhum `fetch` nem `axios` direto em tela, componente ou serviço.
- Tokens só no SecureStore (web: `localStorage`). Nunca em AsyncStorage, log, URL ou parâmetro de navegação. Sem `console.*` com dados de requisição, resposta, token, senha ou código.
- `X-Business` em toda requisição; dados de uma loja nunca aparecem com outra loja escolhida.
- `Idempotency-Key` ao criar agendamento, resgate e pedido, por `createIdempotencyKeys`.
- Marca: tokens de `src/theme/tokens.js` (fonte em `../branding/`), ícones Feather pelo componente `Icon`, cartão com borda fina e sem sombra. Sem cor fixa fora do tema. Informação nunca só por cor.
- Textos: frase curta, verbo na frente, "você". Termos da conta (profissional, cliente, pontos, clube) por `useTerms()`, nunca fixos.
- Ação sem rota na API: o botão some. Módulo desligado: a seção some, sem erro.
- A área da equipe mora em `src/staff/` e chama a API só pelo `staffApi` (`src/staff/api.js`): o token da equipe nunca vai para rotas de cliente, e o do cliente nunca para `/staff/*`. Um modo por vez no aparelho.
- Rotas só mudam em `src/navigation/routes.js`, junto com `tests/unit/routes.test.js`.
- Lógica nova tem teste Jest em `tests/unit/`, sem rede (`tests/helpers/fake-adapter.js`) e sem armazenamento real (`tests/helpers/memory-storage.js`).
- Sem termos do app antigo: `tests/unit/old-terms.test.js` varre o código e README/AGENTS.

## Verificação

```bash
npm test
npx expo export --platform web --output-dir dist/web
npx expo export --platform android --output-dir dist/android
```

Não use navegador, simulador nem `expo start` em verificações automáticas. Não commite `.env`, `dist/` nem `node_modules/`.
