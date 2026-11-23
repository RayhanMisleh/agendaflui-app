# AgendaFlui — aplicativo

Aplicativo do AgendaFlui para web, iOS e Android. O cliente de um negócio agenda horários, acompanha pontos e prêmios do clube e, quando a loja está ligada, compra produtos. Fala com a API v1 do painel (`api.agendaflui.com.br`, contrato em `/v1/openapi.json`).

Expo SDK 54, React Native 0.81, JavaScript, react-navigation 7 e axios.

## Como rodar

```bash
npm install
cp .env.example .env   # preencha EXPO_PUBLIC_APP_KEY
npx expo start
```

- `EXPO_PUBLIC_API_URL`: endereço da API (padrão `https://api.agendaflui.com.br`).
- `EXPO_PUBLIC_APP_KEY`: chave de plataforma do app (web, iOS ou Android), gerada no painel. Sem ela o app avisa e não chama a API. Nunca commite o `.env`.

## Como entrar numa loja

- Link `agendaflui://loja/<slug>` no celular, ou `/<slug>` na web.
- Ou digitando o código da loja na primeira tela.

Trocar de loja apaga a sessão, o carrinho e o aparelho de push da loja anterior.

## Testes e verificação

Os testes não usam rede, navegador nem simulador.

```bash
npm test
npx expo export --platform web --output-dir dist/web
npx expo export --platform android --output-dir dist/android
```

Versão web para a Hostinger: `npm run build:web` gera `dist/agendaflui-web.zip` (passo a passo em `docs/PUBLICACAO-WEB.md`).

Lógica (cliente da API, sessão, loja, carrinho, pedido) tem teste em `tests/unit/`; telas não têm teste automático.

## Limitações

- Na web os tokens ficam no `localStorage`; no celular, no SecureStore.
- A origem do app web precisa estar liberada na chave de plataforma.
- O servidor web precisa devolver o `index.html` para `/<slug>` e `/<slug>/pedidos/<id>`.
- No celular, a volta do pagamento acontece quando a pessoa fecha o navegador.

## O que é do dono

- `eas init` e `eas env:create --name EXPO_PUBLIC_APP_KEY` (uma chave por plataforma).
- Preencher os ids das lojas de aplicativos.
- Revogar, no Google, a chave antiga do app anterior.

Regras para quem programa aqui: `AGENTS.md`.
