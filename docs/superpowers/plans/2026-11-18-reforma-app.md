# Reforma do app (marca Agenda Flui e API v1) — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** O app de cliente da Sans vira o app de cliente do AgendaFlui: as mesmas telas e o mesmo fluxo (agendar, histórico, perfil, loja, prêmios), com a marca Agenda Flui, falando só com a API v1 e com cada cliente preso à loja (conta) pela qual entrou.

**Architecture:** Um cliente único da API (`src/api/client.js`) põe `X-App-Key`, `X-Business` e o token em toda requisição, renova o token uma vez em 401 com fila única e traduz o erro do contrato v1. A loja escolhida (slug) e a sessão (tokens no SecureStore, gravados junto com o slug) vivem em `src/business/` e `src/session/`, expostas por `BusinessProvider` e `AuthProvider`. Cada área (agenda, conta, fidelidade, banners, loja) tem um módulo fino em `src/api/` e as telas existentes trocam a fonte dos dados sem trocar de lugar.

**Tech Stack:** Expo SDK 54, React Native 0.81, JavaScript, react-navigation 7, axios. Entram: `expo-secure-store`, `expo-crypto`, `expo-web-browser`, `@expo-google-fonts/bricolage-grotesque`, `@expo-google-fonts/figtree`, `@expo/vector-icons` (Feather), `jest` + `jest-expo`. Saem: `react-native-vector-icons`, `@react-native-vector-icons/fontawesome6`, `expo-camera`, `expo-image-picker`, `expo-location`, `expo-document-picker`, `expo-blur`, `react-native-dotenv`, `react-native-signature-canvas`, `react-native-webview`.

**Spec:** `docs/superpowers/specs/2026-11-18-reforma-app-design.md` (manda em tudo; o coordenador atualizou a linha de vouchers: **vouchers saem do app**). Contrato: OpenAPI gerado em `../painel` (`src/server/api/routes-manifest.ts`, as rotas em `src/app/api/v1/**/route.ts`, `src/server/api/{define-route,cors,errors}.ts`). Marca: `../branding/AgendaFlui-Marca/` (tokens em `design-tokens/agenda-flui-tokens.json`, `logos/png`, manual em PDF) e a landing `../site/` (só leitura). Direção visual já aplicada ao painel: `../painel/docs/superpowers/specs/2026-11-17-redesenho-marca-design.md`.

## Global Constraints

- Mesma navegação e mesmas telas, na mesma ordem: abas Agendar, Loja, Perfil; pilhas e passos do agendamento como hoje (profissional → serviço → data → horário → confirmar). Telas grandes podem ser divididas por dentro sem mudar o que a pessoa vê nem a ordem. Telas novas só "Código da loja" e a confirmação de troca de loja. O manifesto `src/navigation/routes.js` e o teste `tests/unit/routes.test.js` fixam isso; só as tarefas que o plano manda mudam a lista.
- Cores (tokens da marca, tema claro): Água `#0B6E66` (brand), `#08534D` (brand-strong), Bolha `#D7EFEB` (brand-tint), `#FFFFFF` (on-brand), Caramelo `#F2A93B` (nunca cor de texto; texto sobre ele em ink), `#FCEBD0` (caramelo-tint), Espuma `#F3F8F6` (ground), `#FFFFFF` (surface), Tinta `#0F2A27` (ink), `#4A615D` (ink-muted), `#D3E2DE` (line), `#1E8A4C` (success), `#C8412F` (danger). Escuro: os valores `dark` do JSON de tokens. Padrão: claro.
- Fontes: Bricolage Grotesque (títulos e números grandes, 600/700) e Figtree (texto e interface, 400/500/600/700), pelos pacotes `@expo-google-fonts/*` (pesos estáticos; o TTF variável da marca não troca peso no Android). Horários com `fontVariant: ['tabular-nums']`.
- Cantos 10 (campos, chips) / 16 (cartões) / 28 (blocos de destaque) / pílula (botões, selos). Cartão com borda fina (`line`) e sem sombra; só o que flutua (modal, folha) tem sombra.
- Ícones de traço: Feather (`@expo/vector-icons`), pelo componente `Icon`. Nada de MaterialIcons nem FontAwesome no fim.
- Voz: frase curta, verbo na frente, "você", sem maiúsculas gritadas em botão nem rótulo.
- Termos da conta, nunca fixos: profissional, cliente, pontos e clube vêm de `GET /v1/business` (`terms`), por `useTerms()`; nome e logo da loja no topo; a marca Agenda Flui só na entrada genérica (código da loja, intro web) e no "Feito com Agenda Flui".
- Toda requisição pela API v1 (`<EXPO_PUBLIC_API_URL>/v1`, padrão `https://api.agendaflui.com.br`), só por `src/api/client.js`. Nenhum `fetch` nem `axios` direto em tela, componente ou serviço. Erro do contrato: `{ error: { code, reason?, message, fields?, details? } }`; a mensagem do servidor já é pt-BR e vai para a pessoa como está.
- Chave de plataforma em `EXPO_PUBLIC_APP_KEY` (EAS/`.env`), nunca escrita no código nem em `app.json`/`eas.json`. Conta no cabeçalho `X-Business` (slug) em TODA requisição, inclusive auth.
- Tokens só no `expo-secure-store` (na web, `localStorage`, limitação registrada no README). Nunca em AsyncStorage, log, URL, parâmetro de navegação nem mensagem de erro. Nenhum `console.log` de corpo de requisição ou resposta.
- Uma loja por vez: sessão, carrinho, aparelho de push e cache da conta são da loja atual; trocar de loja apaga tudo isso.
- `Idempotency-Key` em toda criação de agendamento, resgate e pedido; a mesma chave nas novas tentativas do mesmo pedido, chave nova depois de sucesso ou quando o conteúdo muda.
- Módulo desligado (`business.modules.*` falso, ou `404` com `error.code = "module_disabled"`): a aba/seção/entrada some, sem erro na tela.
- Ação sem rota na v1: o botão some (sem botão desativado nem erro).
- Sem vouchers: nenhuma tela, chamada (`/v1/vouchers`, `/v1/me/voucher-codes`) nem texto. Item de pedido de qualquer tipo aparece pelo `name` da linha.
- Saem: `CoffeeScreen`, `PlayScreen`, `EpisodiosScreen`, `ShopScreen`, `BaseView`, `data/mockData.js`, `src/api/youtube.js` (está fora do git e tem chave: apagar do disco), vouchers inteiros, leitor de QR, troca de foto, `/app/settings/public`, número de WhatsApp fixo, `patch_logos.js`, assets antigos.
- Código em JavaScript, sem TypeScript, sem expo-router, sem trocar a navegação. Nome "Agenda Flui", slug `agendaflui`, ids `com.agendaflui.app`, versão 2.0.0, esquema `agendaflui`.
- Testes: Jest com `jest-expo`, em `tests/unit/*.test.js`. Nenhum teste toca a rede (axios com adaptador falso de `tests/helpers/fake-adapter.js`) nem o armazenamento real (armazenamento em memória de `tests/helpers/memory-storage.js`). Telas sem teste automático. Nada de navegador nem simulador.
- Varredura de termos antigos vazia ao fim de cada tarefa (ver "Verificação padrão"). Única exceção permitida: `sans-serif` em CSS/estilo web.
- Entre tarefas o app só precisa compilar e passar na verificação: o funcionamento contra a API chega por área (2: loja e sessão, 3: entrada, 4: agenda e perfil, 5: fidelidade e banners, 6: loja). Módulo antigo de `src/api/` só é apagado quando nenhum arquivo o importa mais (`grep -rl "<módulo>" src App.js`); a tarefa dona de cada exclusão está na lista "Delete".
- Commits locais em português, terminando com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Sem push.

## Review Focus

1. **Token vazando ou sem renovação**: duas requisições recebem 401 `session_invalid` ao mesmo tempo → uma só chamada a `/v1/auth/customer/refresh` e as duas repetem com o token novo; a renovação falha com 401 → tokens apagados e a pessoa volta a visitante; 401 de `invalid_credentials`, `unknown_business` ou `invalid_app_key` nunca dispara renovação; token nunca em AsyncStorage nem em log. Testes na Tarefa 2.
2. **Cliente de uma loja vendo outra**: sessão gravada com o slug; ao carregar com outro slug ela é descartada; `X-Business` sempre o slug atual; trocar de loja (pelo perfil ou por link de outra loja, com confirmação) apaga tokens, carrinho, aparelho de push e cache; carrinho guardado por slug. Testes nas Tarefas 2 e 6.
3. **Termo antigo sobrando**: "Sans", "Sans Coins", "Barber", "barbeiro", "sejasans", roxo `#6200EA`, logo antigo, YouTube, WhatsApp fixo ou qualquer "voucher" em código, texto, asset ou configuração; termos da conta com plural certo ("1 ponto", "2 pontos"). Teste automático `tests/unit/old-terms.test.js` (Tarefa 1) e `tests/unit/terms.test.js` (Tarefa 3).
4. **Tela do fluxo sumindo ou mudando de ordem**: rotas da raiz, das abas, da pilha principal, da Loja e de Pedidos, e os passos do agendamento, iguais ao manifesto; Loja some só com o módulo desligado. Teste `tests/unit/routes.test.js` (Tarefa 1, ajustado pelas Tarefas 2, 4 e 5 só onde o plano manda).
5. **Pedido ou resgate duplicado**: toque duplo ou nova tentativa depois de queda de rede manda a mesma `Idempotency-Key`; conteúdo diferente (outro carrinho, outra cotação de frete, outro prêmio) gera chave nova; o botão fica bloqueado enquanto envia. Testes nas Tarefas 2, 5 e 6.

## Verificação padrão (o último passo de cada tarefa)

```bash
npm test
npx expo export --platform web --output-dir dist/web
npx expo export --platform android --output-dir dist/android
grep -rniIE "sans|sejasans|barber|barbeiro|barbearia|coin|6200ea|7c4dff|5000c9|youtube|whatsapp|wa\.me|voucher|lrm" App.js index.js app.json eas.json package.json src assets web 2>/dev/null | grep -viE "sans-serif"
ls assets | grep -iE "sans|lrm|coin|web-bg"
```

Esperado: testes verdes sem aviso, os dois `export` terminam sem erro (não precisam de conta EAS nem de `EXPO_PUBLIC_APP_KEY`), as duas varreduras sem saída. `dist/` já está no `.gitignore`. A Tarefa 7 estende a varredura a `README.md` e `AGENTS.md`.

## Mapa das telas antigas → API v1

| Tela (rota) | Hoje (API Sans) | Depois (v1) | Tarefa |
|---|---|---|---|
| CodigoLoja (nova, raiz) | — | `GET /v1/business` com `X-Business: <código>` | 2 |
| Intro (web), Login | `POST /login` | `POST /v1/auth/customer/login` | 3 |
| SignUp | `POST /sign-up` | `POST /v1/auth/customer/register` (202) | 3 |
| NewUserEmailCode | `PATCH /user-verify`, `POST /resend-verification` | `POST /v1/auth/customer/verify`; reenviar = `register` de novo com os mesmos dados | 3 |
| RecuperarSenha | `POST /reset-password` | `POST .../password/forgot` e, na mesma tela, `POST .../password/reset` (código + senha nova) | 3 |
| Agendar (ex-Barber), aba 1 | `/user/balance`, `/user/profile`, `/professionals`, `/services`, `/availability`, `POST /appointments`, `/appointments/next`, `PATCH .../cancel`, `PATCH .../reschedule` | `GET /v1/me`, `/v1/professionals`, `/v1/services`, `/v1/availability/days`, `/v1/availability`, `POST /v1/appointments`, `/v1/appointments/next`, `POST /v1/appointments/{id}/cancel`, `POST .../reschedule` | 4 |
| Agendar: saldo, prêmios, banners | `/user/balance`, `/prizes`, `/banners` | `GET /v1/loyalty/me`, `/v1/loyalty/prizes`, `POST /v1/loyalty/redemptions`, `GET /v1/banners` | 5 |
| AppointmentSuccess | parâmetros | parâmetros (agendamento v1) | 4 |
| HistoricoAgendamentos | `/appointments/me`, `PATCH cancel` | `GET /v1/appointments?scope=upcoming\|past` (cursor), `POST .../cancel` | 4 |
| Perfil | `/user/profile`, `PUT /user/profile`, `POST /user/avatar`, `/excluir-conta` | `GET`/`PATCH /v1/me`; foto sai | 4 |
| Perfil: saldo e ranking | `/user/profile`, `/users/ranking` | `GET /v1/loyalty/me`, `/v1/loyalty/ranking` | 5 |
| AlterarSenha | `PUT /reset-password` | `PUT /v1/me/password` (`current`, `next`) | 4 |
| ConfirmarExclusaoCode → ConfirmarExclusao | `/excluir-conta`, `/confirmar-exclusao-conta` | `POST /v1/me/delete` (`password`) | 4 |
| PrizeScanner | `POST /prizes/{id}/redeem` | sai; "Resgatar" na lista de prêmios | 5 |
| RedemptionSuccess | parâmetros | resgate devolvido; `POST /v1/loyalty/redemptions/{id}/cancel` | 5 |
| MinhaJornada | `/user/profile`, `/users/me/redemptions` | `GET /v1/loyalty/redemptions` (cursor), `/v1/loyalty/me`, cancelar pendente | 5 |
| Loja: ProductsList, SingleProduct | `/products`, `/app/settings/public`, `/products/{id}` | `GET /v1/store/categories`, `/v1/store/products` (cursor, `categoryId`), `/v1/store/products/{id}` | 6 |
| Carrinho | `/user/enderecos`, `/enderecos`, ViaCEP, `/frete/calcular`, `/pedidos`, `/payments` | `/v1/me/addresses` (GET/POST/PATCH/DELETE), `/v1/store/postal-codes/{cep}`, `/v1/store/options`, `POST /v1/store/shipping-quotes`, `POST /v1/store/orders`, `POST /v1/store/orders/{id}/checkout` | 6 |
| MeusPedidos, PedidoDetalhes | `/pedidos/usuario`, `/pedidos/{id}`, `PUT .../cancel`, `/payments` | `GET /v1/store/orders` (cursor), `/v1/store/orders/{id}`, `POST .../cancel`, `POST .../checkout` (se `canPay`) | 6 |
| Push | `POST /user/push-token` | `POST /v1/me/devices`, `DELETE /v1/me/devices/{pushToken}` | 4 |
| Logout | só local | `DELETE /v1/me/devices/{token}`, `POST /v1/auth/customer/logout` | 2 e 4 |
| ThemeContext | `/app/settings/public` (logos) | sai; logo da conta em `business.brand.logoUrl` | 1 e 2 |
| Vouchers, Coffee, Play, Episódios, Shop | `/vouchers`, YouTube, dados falsos | saem | 1 |

## Mapa de arquivos

```
index.js                                   registerRootComponent(App) (o "main" do package.json aponta para ele e hoje não existe)
App.js                                     fontes, provedores (Theme > Business > Auth), link da loja, pilha raiz
src/config.js                              readConfig(env) e config (URL da API, chave, links da marca)
src/theme/tokens.js                        cores claro/escuro, cantos, espaços, fontes, tipografia
src/utils/theme.js, src/utils/ThemeContext.js   mesmas exportações de hoje, valores da marca
src/navigation/routes.js                   ROUTES e as listas de rotas e passos (manifesto)
src/components/ui/{Icon,PointsDisplay,PointsIcon,...}.js
src/api/{client,errors,idempotency,index,business,auth,agenda,me,loyalty,banners,store}.js
src/session/{tokenStore,secureStorage,secureStorage.web}.js
src/business/{businessStore,storeLink,terms,BusinessProvider}.js
src/booking/selection.js, src/utils/time.js
src/loyalty/prizes.js
src/store/{order,checkout}.js, src/services/{cartService,notificationService}.js
src/screens/CodigoLojaScreen.js
src/screens/agendar/{AgendarScreen,ProximoHorario,EscolhaProfissional,EscolhaServico,EscolhaData,EscolhaHorario,ResumoReserva,SaldoPontos,Premios,Banners}.js
src/screens/perfil/{PerfilScreen,PerfilVisitante,CartaoPerfil,MenuConta,RankingCard}.js
tests/helpers/{fake-adapter,memory-storage}.js, tests/unit/*.test.js
```

---

### Task 1: Base — dependências, Jest, tema da marca, assets, configuração e limpeza

**Modelos:** implementador Sonnet, revisor Sonnet.

**Files:**
- Create: `index.js`, `src/theme/tokens.js`, `src/navigation/routes.js`, `src/components/ui/Icon.js`, `src/components/ui/PointsDisplay.js` (de `SansCoinsDisplay.js`), `src/components/ui/PointsIcon.js` (de `CoinIcon.js`), `assets/{icon,adaptive-icon,splash-icon,notification-icon,favicon,logo-horizontal,logo-horizontal-negativo,logo-simbolo}.png`, `.env.example`, `tests/helpers/memory-storage.js`, `tests/unit/{tokens,routes,old-terms}.test.js`
- Modify: `package.json`, `package-lock.json`, `app.json`, `eas.json`, `babel.config.js`, `.gitignore`, `App.js`, `src/utils/theme.js`, `src/utils/ThemeContext.js`, `src/screens/Navigator.js`, `src/components/{LoadingScreen,CustomHeader}.js`, toda tela com termo antigo; renomear `src/screens/BarberScreen.js` → `src/screens/agendar/AgendarScreen.js` e `src/api/barberApi.js` → `src/api/legado.js` (conteúdo antigo, identificadores sem "barber"; as Tarefas 4 e 5 esvaziam e apagam)
- Delete: `src/screens/{CoffeeScreen,PlayScreen,EpisodiosScreen,ShopScreen,BaseView,VouchersStack,VouchersScreen,SingleVoucherScreen}.js`, `src/api/vouchers.js`, `src/api/youtube.js` (do disco), `src/data/{mockData,assets}.js`, `src/components/ErrorBoundary.js` e todo arquivo que ninguém importa (conferir com `grep`), `patch_logos.js`, `web/index.css`, `assets/{Logo_Sans,logosansnobg,sanscoinsnobg,sansicon,sanslogo,lrm_logo,web-bg,favicon-rounded}.png`, as funções e trechos de voucher de `cartService.js`, `CarrinhoComponent.js`, `CarrinhoScreen.js` e `PedidoDetalhesScreen.js`

**Interfaces:**
- Produces:

```js
// src/theme/tokens.js
export const colors = { light: { brand, brandStrong, brandTint, onBrand, caramelo, carameloTint, ground, surface, ink, inkMuted, line, success, danger }, dark: { ...mesmas chaves } }
export const radius = { sm: 10, lg: 16, xl: 28, pill: 999 }
export const space = { 1: 4, 2: 8, 3: 16, 4: 24, 5: 40 }
export const fonts = { display: 'BricolageGrotesque_700Bold', displaySemi: 'BricolageGrotesque_600SemiBold', text: 'Figtree_400Regular', textMedium: 'Figtree_500Medium', textSemi: 'Figtree_600SemiBold', textBold: 'Figtree_700Bold' }
export const type = { title, h2, body, bodyStrong, small, caption, button, time }   // { fontFamily, fontSize, lineHeight, letterSpacing? }
// src/utils/theme.js: continua exportando `theme`, `createTextStyle`, `createButtonStyle`; as chaves antigas de cor
//   passam a apontar para a marca (primary→brand, background→ground, backgroundSecondary→ground, card→surface,
//   textPrimary/foreground→ink, textSecondary/textMuted→inkMuted, border→line, coins→caramelo, coinsBackground→carameloTint,
//   error/destructive→danger, success→success); `shadows.sm/md/card/button` viram {} (sem sombra), `shadows.lg` = sombra que flutua.
// src/utils/ThemeContext.js: useTheme() → { theme, changeTheme, themeMode } (sem `logos` nem `reloadLogos`); padrão 'light'
// src/components/ui/Icon.js
export default function Icon({ name, size = 20, color }) // Feather; cor padrão theme.colors.textPrimary
// src/components/ui/PointsDisplay.js
export default function PointsDisplay({ amount, label, size = 'md' }) // label vem de quem chama (termos da conta)
// src/navigation/routes.js
export const ROUTES = { CodigoLoja, Intro, Navigator, Login, SignUp, RecuperarSenha, NewUserEmailCode, ConfirmarExclusaoCode, MainTabs, Agendar, Loja, Perfil, AppointmentSuccess, HistoricoAgendamentos, AlterarSenha, MeusPedidos, Carrinho, PrizeScanner, RedemptionSuccess, MinhaJornada, ProductsList, SingleProduct, MeusPedidosList, PedidoDetalhes }  // valor = nome
export const ROOT_ROUTES = ['Intro', 'Navigator', 'Login', 'SignUp', 'RecuperarSenha', 'NewUserEmailCode', 'ConfirmarExclusaoCode']
export const TAB_ROUTES = ['Agendar', 'Loja', 'Perfil']
export const MAIN_STACK_ROUTES = ['MainTabs', 'AppointmentSuccess', 'HistoricoAgendamentos', 'AlterarSenha', 'MeusPedidos', 'Carrinho', 'PrizeScanner', 'RedemptionSuccess', 'MinhaJornada']
export const PRODUCTS_STACK_ROUTES = ['ProductsList', 'SingleProduct']
export const ORDERS_STACK_ROUTES = ['MeusPedidosList', 'PedidoDetalhes']
export const BOOKING_STEPS = ['profissional', 'servico', 'data', 'horario']
// tests/helpers/memory-storage.js
export function memoryStorage(initial = {}) // { getItem, setItem, removeItem } assíncronos + `dump()` para afirmar o conteúdo
```

Regras:
- Dependências com `npx expo install` (versões do SDK 54): `expo-secure-store expo-crypto expo-web-browser @expo-google-fonts/bricolage-grotesque @expo-google-fonts/figtree @expo/vector-icons jest-expo`; `npm i -D jest`. Remover as da linha "Saem" do Tech Stack que nenhuma tela usa mais NESTA tarefa (`react-native-vector-icons` e `expo-camera` ficam até as Tarefas 7 e 5; `expo-image-picker` e `expo-blur` até a 4/5). Usar npm (há `package-lock.json`): tirar o campo `packageManager` (pnpm) do `package.json`. `name` = `agendaflui-app`, `version` = `2.0.0`, `scripts.test` = `jest`, `jest` = `{ "preset": "jest-expo", "testMatch": ["<rootDir>/tests/**/*.test.js"] }`. `babel.config.js` só com `babel-preset-expo`.
- `index.js`: `registerRootComponent(App)` de `expo`. `App.js` carrega as fontes com `useFonts` dos dois pacotes e mostra `LoadingScreen` até prontas; título da janela web "Agenda Flui"; fundo `ground` (nada de `#111111`).
- `app.json`: `name` "Agenda Flui", `slug` "agendaflui", `version` "2.0.0", `scheme` "agendaflui", `icon` `./assets/icon.png`, splash `./assets/splash-icon.png` com fundo `#F3F8F6`, `ios.bundleIdentifier` e `android.package` `com.agendaflui.app`, `ios.buildNumber` "1", `android.versionCode` 1, `android.adaptiveIcon` (`./assets/adaptive-icon.png`, fundo `#F3F8F6`), notificação com `./assets/notification-icon.png` e cor `#0B6E66`, `web.name`/`shortName` "Agenda Flui", `web.favicon` `./assets/favicon.png`, plugins `expo-font`, `expo-secure-store`, `expo-notifications`. Sem `extra.eas.projectId` e sem `updates.url` (o dono roda `eas init`). `eas.json`: perfis `preview` e `production` com `"environment"` de mesmo nome e `env.EXPO_PUBLIC_API_URL = "https://api.agendaflui.com.br"`; a chave fica nas variáveis do EAS. `.env.example` com `EXPO_PUBLIC_API_URL=https://api.agendaflui.com.br` e `EXPO_PUBLIC_APP_KEY=`. `.gitignore`: tirar a linha do `youtube.js`, acrescentar `!.env.example`.
- Assets (script descartável em Python/PIL no scratchpad, fora do repositório; fonte `../branding/AgendaFlui-Marca/logos/png/`): `icon.png` 1024² opaco, símbolo `agendaflui-simbolo@4x.png` a 70% sobre `#F3F8F6`; `adaptive-icon.png` 1024² transparente, símbolo a 60% centrado; `splash-icon.png` = símbolo 1024² transparente; `notification-icon.png` 96² com o alfa do símbolo em branco; `favicon.png` 48²; `logo-horizontal.png` e `logo-horizontal-negativo.png` = `@2x`; `logo-simbolo.png` = `@2x`.
- Termos: trocar por palavras neutras provisórias o que hoje é fixo ("pontos", "clube", "profissional", "Agenda Flui" no lugar do nome da loja); as Tarefas 3–5 ligam aos termos da conta. Identificadores também (`selectedBarber` → `selectedProfessional`, `sansCoins` → `points`, `clubeSans` → `clubMember`). A aba "Barber" vira rota e rótulo "Agendar". O botão de WhatsApp do clube e o link `lrmsolutions` saem; o rodapé do perfil vira "Feito com Agenda Flui" (link `https://agendaflui.com.br`). Toda referência a `theme.logos` e aos PNG antigos (`CustomHeader`, `LoadingScreen`, telas de entrada, perfil) passa a `assets/logo-horizontal.png` (a Tarefa 2 troca pelo logo da conta quando houver). `CartService.clearAllCart()` continua existindo, sem a parte de vouchers.
- Visual: só o que muda sozinho pelo tema (cores, cantos, fim das sombras) e os componentes de `src/components/ui/` (Button pílula, Card com borda, Chip, SectionHeader com Bricolage, Skeleton em `line`). Cada tarefa seguinte refaz as próprias telas (fontes, ícones Feather, textos).
- `Navigator.js` e `App.js` usam `ROUTES.*` em todo `name=` e na mesma ordem das listas.

- [ ] **Step 1: Testes que falham** — `tokens.test.js`: `colors.light.brand === '#0B6E66'`, `caramelo === '#F2A93B'`, `ink === '#0F2A27'`, `brandTint === '#D7EFEB'`, `ground === '#F3F8F6'`, `colors.dark.brand === '#3CC4B4'`, `radius` = `{ sm: 10, lg: 16, xl: 28, pill: 999 }`, e as duas paletas têm as mesmas chaves. `routes.test.js`: as listas acima, exatamente; e, lendo o texto com `fs`, a sequência de `<Stack.Screen … name={ROUTES.X}` de `App.js` é `ROOT_ROUTES`, a de `<Tab.Screen … name={ROUTES.X}` de `Navigator.js` é `TAB_ROUTES`, a de `<Stack.Screen … name={ROUTES.X}` de `Navigator.js` é `MAIN_STACK_ROUTES`, e as de `ProductsStack.js` e `MeusPedidosStack.js` são as listas da Loja e de Pedidos (telas condicionais contam na ordem em que aparecem no texto). `old-terms.test.js`: percorre `App.js`, `index.js`, `app.json`, `eas.json`, `package.json`, `src/**` (texto) e os NOMES em `assets/`, e falha com o arquivo e a linha se casar `/sans|sejasans|barber|barbeiro|barbearia|coin|6200ea|7c4dff|5000c9|youtube|whatsapp|wa\.me|voucher|lrm/i` fora de `sans-serif`.
- [ ] **Step 2:** `npm test` → FALHA (guardar a saída).
- [ ] **Step 3:** Implementar dependências, configuração, assets, tema, ícone, renomeações, remoções e troca de termos.
- [ ] **Step 4:** Verificação padrão verde.
- [ ] **Step 5:** Commit: `feat: base da reforma (marca Agenda Flui, Jest e limpeza)`.

---

### Task 2: Cliente da API v1, sessão e escolha da loja — SENSÍVEL

**Modelos:** implementador Sonnet, revisor **Opus**.

**Files:**
- Create: `src/config.js`, `src/api/{client,errors,idempotency,index,business}.js`, `src/session/{tokenStore,secureStorage,secureStorage.web}.js`, `src/business/{businessStore,storeLink,BusinessProvider}.js`, `src/screens/CodigoLojaScreen.js`, `tests/helpers/fake-adapter.js`, `tests/unit/{config,errors,client,token-store,store-link,business,idempotency}.test.js`
- Modify: `src/components/AuthProvider.js` (reescrito), `App.js`, `src/navigation/routes.js` (raiz ganha `CodigoLoja` antes de `Intro`), `tests/unit/routes.test.js`, `src/api/apiConfig.js` (passa a só reexportar `api.http`, para os módulos antigos compilarem até serem trocados), `src/utils/config.js` (apagar; quem usa passa a `src/config.js`), `src/components/{CustomHeader,LoadingScreen}.js` (logo da conta)

**Interfaces:**
- Consumes: `memoryStorage` (Tarefa 1).
- Produces:

```js
// src/config.js
export function readConfig(env) // → { apiUrl, appKey, appKeyMissing, siteUrl: 'https://agendaflui.com.br', privacyUrl: siteUrl + '/privacidade', termsUrl: siteUrl + '/termos', scheme: 'agendaflui' }
export const config // readConfig({ EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL, EXPO_PUBLIC_APP_KEY: process.env.EXPO_PUBLIC_APP_KEY })
// src/api/errors.js
export class ApiError extends Error { status; code; reason; fields; requestId; retryAfterSec }
export const NETWORK_MESSAGE = 'Sem conexão. Confira a internet e tente de novo.'
export const TIMEOUT_MESSAGE = 'A conexão demorou demais. Tente de novo.'
export function toApiError(error) // AxiosError | qualquer → ApiError
export function isModuleDisabled(error) // status 404 e code 'module_disabled'
// src/session/tokenStore.js  (tokens = { accessToken, accessExpiresAt, refreshToken, refreshExpiresAt })
export function createTokenStore(storage) // → { load(slug): Promise<tokens|null>, save(slug, tokens), clear() }; chave 'agendaflui.session'
// src/session/secureStorage.js (SecureStore) e secureStorage.web.js (localStorage): { getItem, setItem, removeItem }
// src/business/businessStore.js (AsyncStorage)
export function createBusinessStore(storage) // → { getSlug(), setSlug(slug), getCached(), setCached(business), clear() }; chave 'agendaflui.business'
// src/business/storeLink.js
export function normalizeSlug(text) // trim, minúsculas; null se não casar /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/
export function parseStoreLink(url) // 'agendaflui://loja/<slug>' | 'http(s)://<host>/<slug>[/pedidos/<orderId>]' | '/<slug>[...]' → { slug, orderId: string|null } | null
export function decideStoreSwitch(currentSlug, incomingSlug) // → 'none' | 'select' | 'confirm'
// src/api/idempotency.js
export function newIdempotencyKey() // Crypto.randomUUID() de expo-crypto
export function createIdempotencyKeys(make = newIdempotencyKey) // → { keyFor(signature): string, done(signature): void }
// src/api/client.js
export function createApiClient({ baseURL, appKey, getSlug, tokens, onSessionEnded, onBusinessGone, adapter })
//   tokens = { get(): tokens|null, set(tokens): Promise, clear(): Promise }
//   → { http: AxiosInstance, refresh(): Promise<tokens> }   (http rejeita sempre com ApiError)
// src/api/index.js: `api` (o cliente da configuração), `setSessionHandlers({ onSessionEnded, onBusinessGone })`, `sessionTokens` (memória + tokenStore)
// src/api/business.js
export function fetchBusiness(http, slug) // GET /business com X-Business: slug; 401 'unknown_business' → ApiError com message 'Não achamos essa loja. Confira o código.'
// src/business/BusinessProvider.js
export function useBusiness() // → { status: 'loading'|'none'|'ready'|'unavailable', slug, business, selectBusiness(slug), switchBusiness() }
export function useTerms()    // → business?.terms (a Tarefa 3 completa com padrões)
// src/components/AuthProvider.js
export function useAuth() // → { isAuthenticated, isLoading, customer, startSession({ tokens, customer }), endSession() }
// tests/helpers/fake-adapter.js
export function fakeAdapter(handler) // handler(config) → { status, data, headers } | lança 'network' | 'timeout'
//   → adaptador do axios com `.calls` (lista de { method, url, headers, data, params }); status fora de 2xx rejeita com
//   `new AxiosError(..., config, null, response)` (adaptador próprio não passa pelo `validateStatus`); 'network' rejeita sem
//   `response`; 'timeout' rejeita com `code: 'ECONNABORTED'`.
```

Regras do cliente (`baseURL` = `config.apiUrl + '/v1'`, `timeout` 15 s):
- Toda requisição: `X-App-Key`, `X-Business: getSlug()`, `Content-Type: application/json`; `Authorization: Bearer <accessToken>` quando há tokens e a rota não é `/auth/customer/*`. Chamada sem slug escolhido rejeita sem ir à rede.
- 401 com `reason = 'session_invalid'` numa requisição que levou `Authorization` e ainda não foi repetida: chama `refresh()` e repete UMA vez com o token novo. `refresh()` guarda a promessa em andamento: chamadas simultâneas compartilham a mesma ida a `POST /auth/customer/refresh` (`{ refreshToken }`); grava o par novo antes de liberar a fila. Renovação recusada (qualquer 4xx) → `tokens.clear()`, `onSessionEnded()` e a requisição original rejeita com a mensagem "Sua sessão venceu. Entre de novo."; falha de rede na renovação → rejeita com `NETWORK_MESSAGE` e NÃO apaga os tokens.
- 401 com `reason = 'unknown_business'` → `onBusinessGone()`; `invalid_app_key`, `invalid_credentials` e qualquer 401 de `/auth/customer/*` → só rejeita.
- Erro vira `ApiError` com `message` do corpo (`error.message`), `code`, `reason`, `fields`, `requestId` (cabeçalho `x-request-id`) e `retryAfterSec` (`retry-after`); sem resposta → `NETWORK_MESSAGE`; `ECONNABORTED` → `TIMEOUT_MESSAGE`. Nada de `console.log` de requisição ou resposta.
- `tokenStore.save` grava `{ slug, ...tokens }` como um JSON; `load(slug)` devolve `null` (e apaga) se o slug gravado for outro ou o JSON estiver estragado.

Regras da loja:
- Partida: link inicial (`Linking.getInitialURL()`; na web, `window.location.href`) → `parseStoreLink`; senão o slug guardado; senão `status = 'none'` e a raiz mostra só `CodigoLoja`. Com slug: mostra o cache da conta na hora e busca `GET /v1/business` (503 `business_unavailable` → `status = 'unavailable'`, tela "Esta loja não está disponível agora."). Volta ao primeiro plano: busca de novo.
- `decideStoreSwitch`: sem loja → `'select'`; mesma loja → `'none'`; outra loja → `'confirm'`. Link de outra loja com o app aberto ou na partida → `Alert` "Trocar para <nome da loja nova>? Você sai da conta em <loja atual>." (Trocar / Ficar).
- `switchBusiness()` (e `onBusinessGone`): revoga a sessão (`POST /auth/customer/logout`, sem esperar), apaga tokens, carrinho (`CartService.clearAllCart()` por enquanto; a Tarefa 6 troca por `clearCartFor(slug)`), aparelho de push (a Tarefa 4 pluga o `unregisterDevice` aqui) e cache, e volta para `CodigoLoja`. Na raiz, `CodigoLoja` é a única tela com `status = 'none'` (telas condicionais do react-navigation, como no fluxo de login).
- `CodigoLojaScreen` (marca Agenda Flui: `logo-horizontal.png`, título "Qual é a sua loja?", campo "Código da loja", botão "Continuar", texto "O código está no link que a loja mandou para você."): `normalizeSlug` local ("Digite o código como a loja mandou: letras, números e hífen."), depois `fetchBusiness`; erro em texto abaixo do campo; sucesso → `selectBusiness`.
- `AuthProvider`: `isAuthenticated` = há tokens carregados para o slug atual; `startSession` grava tokens (tokenStore) e o `customer` (memória; o perfil vem de `/v1/me`); `endSession` = `POST /auth/customer/logout` com o refresh (sem esperar) + `tokens.clear()`. `onSessionEnded` do cliente chama o mesmo caminho sem a revogação.

- [ ] **Step 1: Testes que falham** (cliente sempre com `fakeAdapter`, armazenamento sempre `memoryStorage`):
  - `config`: sem variáveis → `apiUrl === 'https://api.agendaflui.com.br'`, `appKeyMissing === true`; `EXPO_PUBLIC_API_URL='https://x.test/'` → sem barra final.
  - `errors`: resposta 409 `{ error: { code: 'conflict', reason: 'slot_taken', message: 'Esse horário acabou de ser ocupado.' } }` → `ApiError` com os quatro campos; sem resposta → `NETWORK_MESSAGE`; `ECONNABORTED` → `TIMEOUT_MESSAGE`; `isModuleDisabled` só para 404 `module_disabled`.
  - `client`: cabeçalhos `X-App-Key`, `X-Business: patas` e `Authorization` presentes; `/auth/customer/login` sem `Authorization`; sem slug → rejeita e o adaptador não é chamado; **duas requisições simultâneas com 401 `session_invalid` → o adaptador recebe exatamente 1 `POST /auth/customer/refresh`, as duas repetem com o token novo e resolvem**; o par novo está no `tokenStore`; renovação 401 `invalid_refresh_token` → tokens apagados, `onSessionEnded` chamado 1 vez, original rejeita com "Sua sessão venceu. Entre de novo."; renovação sem rede → tokens mantidos; repetição que volta 401 de novo não renova outra vez; 401 `unknown_business` → `onBusinessGone` e sem renovação; 401 `invalid_credentials` em `/auth/customer/login` → sem renovação; nenhuma chamada a `console.log`.
  - `token-store`: `save('patas', t)` e `load('patas')` → `t`; `load('outra')` → `null` e o armazenamento fica vazio; JSON estragado → `null`; `clear()` apaga; nada é gravado fora da chave `agendaflui.session`.
  - `store-link`: `agendaflui://loja/Patas-e-Pelos` → `{ slug: 'patas-e-pelos', orderId: null }`; `https://app.agendaflui.com.br/patas/pedidos/<uuid>` → slug e `orderId`; `/patas` → slug; `agendaflui://outra/coisa`, `''`, `'/'`, `'/-x'`, slug com 65 caracteres → `null`; `decideStoreSwitch(null,'a')='select'`, `('a','a')='none'`, `('a','b')='confirm'`.
  - `business`: `fetchBusiness(http, 'patas')` manda `X-Business: patas`; 401 `unknown_business` → mensagem "Não achamos essa loja. Confira o código."; 200 → objeto da conta.
  - `idempotency`: mesma assinatura → mesma chave; outra assinatura → outra chave; depois de `done(assinatura)`, a mesma assinatura ganha chave nova; a chave casa `/^[A-Za-z0-9_-]{1,80}$/`.
  - `routes`: raiz = `['CodigoLoja', 'Intro', 'Navigator', 'Login', 'SignUp', 'RecuperarSenha', 'NewUserEmailCode', 'ConfirmarExclusaoCode']`.
- [ ] **Step 2:** `npm test` → FALHA (guardar a saída).
- [ ] **Step 3:** Implementar os módulos, os provedores, a tela e a ligação no `App.js`.
- [ ] **Step 4:** Verificação padrão verde.
- [ ] **Step 5:** Commit: `feat: cliente da API v1, sessão segura e loja pelo link`.

---

### Task 3: Entrada — login, cadastro com verificação, redefinição e termos da conta

**Modelos:** implementador Sonnet, revisor Sonnet.

**Files:**
- Create: `src/api/auth.js`, `src/business/terms.js`, `tests/unit/{auth-api,terms,validation}.test.js`
- Modify: `src/screens/{IntroScreen.web,LoginScreen,LoginScreen.web,SignUpScreen,SignUpScreen.web,NewUserEmailCodeScreen,NewUserEmailCodeScreen.web,RecuperarSenhaScreen,RecuperarSenhaScreen.web,CodigoLojaScreen}.js`, `src/business/BusinessProvider.js` (`useTerms` com padrões), `src/utils/helpers.js` (`validatePassword` ≥ 10, `validateCode`); `src/api/authApi.js` perde as funções que as telas de entrada usavam (fica só o que Perfil, exclusão e seletores da loja ainda importam)
- Delete: nada de `src/api/` ainda (`resetPasswordApi.js` sai na Tarefa 4, `authApi.js` na 6)

**Interfaces:**
- Consumes: `api.http`, `ApiError`, `useAuth().startSession`, `useBusiness()`.
- Produces:

```js
// src/api/auth.js (e-mail sempre trim + minúsculas)
export function login({ email, password })               // POST /auth/customer/login → { tokens, customer }
export function register({ name, email, phone, password }) // POST /auth/customer/register (202) → void; phone vazio → null
export function verify({ email, code })                  // POST /auth/customer/verify → { tokens, customer }
export function forgotPassword(email)                    // POST /auth/customer/password/forgot (202) → void
export function resetPassword({ email, code, password })  // POST /auth/customer/password/reset (204) → void
// src/business/terms.js
export const DEFAULT_TERMS = { professional: { singular: 'Profissional', plural: 'Profissionais' }, customer: { singular: 'Cliente', plural: 'Clientes' }, points: { singular: 'ponto', plural: 'pontos' }, club: 'Clube' }
export function termsOf(business)         // business?.terms completado campo a campo com DEFAULT_TERMS
export function pointsLabel(n, terms)     // '1 ponto', '0 pontos', '1.250 pontos' (milhar pt-BR)
// src/utils/helpers.js
export function validatePassword(p)       // ≥ 10 e ≤ 200 caracteres
export function validateCode(c)           // /^\d{6}$/ depois de trim
```

Regras:
- Login: sucesso → `startSession` e volta para `Navigator` (como hoje). Não existe mais "conta não verificada" no login (a conta só nasce no `verify`): o ramo `needVerification` sai. Erro → `ApiError.message` abaixo do formulário.
- Cadastro: nome, e-mail, telefone (opcional) e senha (mínimo 10 caracteres, dito no campo) → `register` → `NewUserEmailCode` com `{ email }`. Nome, telefone e senha para "Reenviar código" ficam num objeto em memória do módulo de cadastro (`pendingRegistration`), nunca em parâmetro de navegação nem armazenamento; sem ele (app reiniciado), "Reenviar código" leva de volta ao cadastro.
- Verificação: 6 dígitos → `verify` → `startSession` → `Navigator`. `invalid_code` mostra a mensagem do servidor.
- Redefinição (mesma tela, dois passos): e-mail → `forgotPassword` → "Se houver uma conta com esse e-mail, mandamos um código." → campos código + senha nova + confirmar → `resetPassword` → `Login` com aviso "Senha trocada. Entre com a senha nova.".
- Visual de entrada: Login, SignUp, NewUserEmailCode e RecuperarSenha mostram o logo da conta (`business.brand.logoUrl`; sem ele, o nome da loja em Bricolage) e, no rodapé, "Feito com Agenda Flui"; Intro web e CodigoLoja usam a marca Agenda Flui (sem `web-bg.jpg`: fundo `ground` com um bloco `brand-tint` de canto 28). Telas `.web.js` seguem as nativas nos textos e passos. Ícones Feather, fontes da marca, botões pílula.
- Termos: `useTerms()` devolve `termsOf(business)`; nenhuma tela escreve "ponto(s)", "clube", "profissional" ou "cliente" fixo a partir daqui (as Tarefas 4–5 trocam o que sobrou da Tarefa 1).

- [ ] **Step 1: Testes que falham** — `auth-api`: `login({ email: ' Ana@X.com ', password })` manda `{ email: 'ana@x.com', password }` para `/auth/customer/login` e devolve `{ tokens, customer }`; `register` com telefone `''` manda `phone: null`; `verify`, `forgotPassword` e `resetPassword` usam os caminhos e corpos do contrato; 422 com `fields.password` vira `ApiError.fields.password`. `terms`: `termsOf(null)` = `DEFAULT_TERMS`; `termsOf({ terms: { points: { singular: 'patinha', plural: 'patinhas' }, club: 'Clube Pet' } })` completa profissional e cliente; `pointsLabel(1, t) === '1 patinha'`, `pointsLabel(0, t) === '0 patinhas'`, `pointsLabel(1250, DEFAULT_TERMS) === '1.250 pontos'`. `validation`: `validatePassword('123456789')` falso, 10 caracteres verdadeiro; `validateCode(' 123456 ')` verdadeiro, `'12345a'` falso.
- [ ] **Step 2:** `npm test` → FALHA (guardar a saída).
- [ ] **Step 3:** Implementar `auth.js`, `terms.js`, os validadores e as telas de entrada.
- [ ] **Step 4:** Verificação padrão verde.
- [ ] **Step 5:** Commit: `feat: entrada do cliente na API v1 com a marca`.

---

### Task 4: Agendamento, histórico, próximo horário, perfil, push e excluir conta

**Modelos:** implementador Sonnet, revisor Sonnet.

**Files:**
- Create: `src/api/{agenda,me}.js`, `src/utils/time.js`, `src/booking/selection.js`, `src/screens/agendar/{ProximoHorario,EscolhaProfissional,EscolhaServico,EscolhaData,EscolhaHorario,ResumoReserva}.js`, `src/screens/perfil/{PerfilScreen,PerfilVisitante,CartaoPerfil,MenuConta}.js`, `tests/unit/{agenda-api,me-api,time,selection,devices}.test.js`; e, movidos SEM reescrever (a Tarefa 5 refaz), `src/screens/agendar/{SaldoPontos,Premios,Banners}.js` e `src/screens/perfil/RankingCard.js`, ainda com as funções de `src/api/legado.js`
- Modify: `src/api/legado.js` (saem as funções que nenhum arquivo importa mais depois desta tarefa; ficam as que as seções movidas e `MinhaJornada` ainda usam), `src/screens/agendar/AgendarScreen.js`, `src/screens/{AppointmentSuccessScreen,HistoricoAgendamentosScreen,AlterarSenhaScreen}.js`, `src/screens/ConfirmarExclusaoCodeScreen.js` → `src/screens/ConfirmarExclusaoScreen.js`, `src/services/notificationService.js`, `App.js` (listeners de push com o nome da loja), `src/business/BusinessProvider.js` (`switchBusiness` chama `unregisterDevice`), `src/navigation/routes.js` + `tests/unit/routes.test.js` (`ConfirmarExclusaoCode` → `ConfirmarExclusao`), `src/screens/Navigator.js` (Perfil aponta para `perfil/PerfilScreen`)
- Delete: `src/screens/PerfilScreen.js` (movido), `src/utils/dateUtils.js`, `src/api/resetPasswordApi.js`; dependência `expo-image-picker`

**Interfaces:**
- Consumes: `api.http`, `createIdempotencyKeys`, `useAuth`, `useBusiness`, `useTerms`, `pointsLabel`.
- Produces:

```js
// src/api/agenda.js
export function listServices()                                            // GET /services → items
export function listProfessionals()                                       // GET /professionals → items (cada um com serviceIds)
export function availableDays({ from, to, serviceIds, professionalId })   // GET /availability/days; serviceIds unidos por vírgula; professionalId omitido se nulo
export function availableSlots({ date, serviceIds, professionalId })      // GET /availability → { slots, totalCents, durationMin }
export function createAppointment({ serviceIds, startsAt, professionalId, customerNote }, idempotencyKey) // POST /appointments + Idempotency-Key
export function nextAppointment()                                         // GET /appointments/next → appointment | null
export function listAppointments({ scope, cursor })                       // GET /appointments → { items, nextCursor }
export function cancelAppointment(id)                                     // POST /appointments/{id}/cancel
export function rescheduleAppointment(id, { startsAt, professionalId })   // POST /appointments/{id}/reschedule
// src/api/me.js
export function getMe(); export function updateMe({ name, phone, birthDate }); export function changePassword({ current, next }); export function deleteAccount(password)
// src/utils/time.js
export function localDateIn(timeZone, instant)            // 'YYYY-MM-DD' no fuso da conta (Intl)
export function addDays(date, n)                          // aritmética de 'YYYY-MM-DD', sem fuso
export function bookingRange(timeZone, now, maxAdvanceDays) // { from: hoje local, to: from + min(maxAdvanceDays, 30) }
// src/booking/selection.js
export const ANY_PROFESSIONAL = 'any'
export function servicesFor(professionalId, professionals, services)   // 'any' → todos; senão os do profissional, na ordem dos serviços
export function professionalParam(professionalId)                       // 'any' → null
export function canPickService(service, isClubMember)                   // clubOnly exige sócio
// src/services/notificationService.js
export function registerDevice()    // pede permissão, pega o ExpoPushToken, POST /me/devices { platform, pushToken }, guarda o token em AsyncStorage 'agendaflui.pushToken'
export function unregisterDevice()  // DELETE /me/devices/{encodeURIComponent(token)} e apaga a chave; sem token guardado não chama a rede
```

Regras:
- `AgendarScreen` fica com o estado e a ordem; as seções viram componentes (`ProximoHorario`, as quatro `Escolha*` na ordem de `BOOKING_STEPS`, `ResumoReserva`). A ordem que a pessoa vê não muda. "Qualquer profissional" continua como primeira opção (`professionalId` omitido; o servidor escolhe). Serviço continua um só (`serviceIds: [id]`); serviço `clubOnly` aparece com selo "Só para <clube>" e não é selecionável por quem não é sócio (`/v1/me.isClubMember`). Datas: `availableDays` com `bookingRange(business.timeZone, agora, business.rules.maxAdvanceDays)`, só dias `available`; horários: `availableSlots`, rótulo `slot.label`. Confirmar → `createAppointment` com chave de `keyFor(JSON.stringify({ serviceIds, startsAt, professionalId }))`, `done` no sucesso, botão bloqueado enquanto envia; `409 slot_taken`/`slot_unavailable` → mensagem do servidor e recarrega os horários. Visitante que toca "Confirmar" vai para `Login` (como hoje).
- Remarcar ("Trocar horário"): a v1 só troca horário e profissional. No modo remarcar o serviço fica travado no do agendamento (o passo aparece, mostrando o serviço escolhido sem trocar); "Trocar horário ou serviço" vira "Trocar horário". Cancelar e remarcar só aparecem com `change.allowed`; fora do prazo, o texto `change.untilLabel`.
- `AppointmentSuccess` recebe o agendamento v1 (`local.date`, `local.start`, `professional.name`, `items[].name`, `totalCents`); o cartão de pontos fica para a Tarefa 5.
- `HistoricoAgendamentos`: os filtros de hoje ficam ("Todos", "Próximos", "Anteriores"); "Próximos" = `scope=upcoming`, "Anteriores" = `scope=past`, "Todos" = próximos seguidos dos anteriores; "Carregar mais" pelo `nextCursor`; situação em texto + ponto de cor (`PENDING` "Aguardando confirmação", `CONFIRMED` "Confirmado", `COMPLETED` "Concluído", `CANCELED` "Cancelado", `NO_SHOW` "Falta").
- Perfil (`perfil/`): mesmas seções e itens de hoje, na mesma ordem, menos "Suporte" (sem contato da loja na v1) e menos a troca de foto. Avatar: `me.avatarUrl` se houver, senão iniciais (`Avatar`). Editar nome e telefone por `updateMe`. Tema claro/escuro/sistema continua. Novo item "Trocar de loja" (antes de "Sair"), com confirmação, chamando `switchBusiness()`; o cartão mostra "Você está em <nome da loja>". Privacidade e Termos abrem `config.privacyUrl`/`config.termsUrl`. Sair: `unregisterDevice()` → `endSession()` → limpar o carrinho (`CartService.clearAllCart()`; a Tarefa 6 troca por `clearCartFor`) → aba Agendar (na web, `Intro`).
- `AlterarSenha`: campos "Senha atual", "Senha nova", "Repita a senha nova" → `changePassword`; sucesso volta com aviso "Senha trocada."
- `ConfirmarExclusao` (substitui o fluxo por código): texto do que acontece, campo "Sua senha", botão "Excluir minha conta" (danger) → `unregisterDevice()` → `deleteAccount(senha)` → apagar tokens e carrinho → aba Agendar com aviso "Sua conta foi excluída.". `wrong_password` → mensagem do servidor.
- Push: `registerDevice()` ao entrar e na partida com sessão (o servidor aceita repetição); `platform` = `Platform.OS` (`ios`, `android`, `web`); sem `projectId` do EAS ou em simulador, não registra e não mostra erro. Toast de notificação com o nome da loja. Canais Android com `lightColor` `#0B6E66`.

- [ ] **Step 1: Testes que falham** — `agenda-api`: `availableDays({ from: '2026-11-18', to: '2026-12-18', serviceIds: ['s1', 's2'], professionalId: null })` manda `serviceIds=s1,s2` e não manda `professionalId`; `createAppointment(body, 'k1')` manda `Idempotency-Key: k1` e o corpo `{ serviceIds, startsAt, professionalId }` sem campos a mais; `rescheduleAppointment('a1', { startsAt })` usa POST `/appointments/a1/reschedule`; `nextAppointment()` devolve `null` quando a resposta é `{ appointment: null }`. `me-api`: `changePassword` manda `{ current, next }` por PUT `/me/password`; `deleteAccount('x')` manda `{ password: 'x' }`. `time`: `localDateIn('America/Sao_Paulo', '2026-11-19T02:30:00Z') === '2026-11-18'`, `localDateIn('Asia/Tokyo', '2026-11-18T16:00:00Z') === '2026-11-19'`, `addDays('2026-12-31', 1) === '2027-01-01'`, `addDays('2028-02-28', 1) === '2028-02-29'`, `bookingRange('America/Sao_Paulo', instante, 90).to` = `from` + 30 dias. `selection`: `servicesFor('any', …)` = todos; `servicesFor('p1', …)` só os de `p1.serviceIds`, na ordem de `services`; `professionalParam('any') === null`; `canPickService({ clubOnly: true }, false) === false`. `devices`: `unregisterDevice()` sem token guardado não chama o adaptador; com token `ExponentPushToken[abc]` chama `DELETE /me/devices/ExponentPushToken%5Babc%5D` e apaga a chave. `routes`: raiz com `ConfirmarExclusao`.
- [ ] **Step 2:** `npm test` → FALHA (guardar a saída).
- [ ] **Step 3:** Implementar API, utilitários, telas e push.
- [ ] **Step 4:** Verificação padrão verde.
- [ ] **Step 5:** Commit: `feat: agenda, histórico e perfil na API v1`.

---

### Task 5: Fidelidade (pontos, prêmios, resgates, ranking, Minha Jornada) e banners

**Modelos:** implementador Sonnet, revisor Sonnet.

**Files:**
- Create: `src/api/{loyalty,banners}.js`, `src/loyalty/prizes.js`, `tests/unit/{loyalty-api,prizes,banners-api}.test.js`
- Modify (reescritos): `src/screens/agendar/{SaldoPontos,Premios,Banners}.js`, `src/screens/perfil/RankingCard.js`, `src/screens/agendar/AgendarScreen.js`, `src/screens/{RedemptionSuccessScreen,MinhaJornadaScreen,AppointmentSuccessScreen}.js`, `src/screens/perfil/{PerfilScreen,CartaoPerfil,MenuConta}.js`, `src/screens/Navigator.js`, `src/navigation/routes.js` + `tests/unit/routes.test.js` (sai `PrizeScanner`)
- Delete: `src/screens/PrizeScannerScreen.js`, `src/api/legado.js`; dependências `expo-camera` e `expo-blur`

**Interfaces:**
- Consumes: `api.http`, `createIdempotencyKeys`, `useTerms`, `pointsLabel`, `PointsDisplay`, `isModuleDisabled`.
- Produces:

```js
// src/api/loyalty.js
export function getMyLoyalty()                                          // GET /loyalty/me → { balance, clubMember, terms }
export function listPrizes()                                            // GET /loyalty/prizes → items
export function redeemPrize({ prizeId, expectedCostPoints }, idempotencyKey) // POST /loyalty/redemptions + Idempotency-Key → { redemption, balance }
export function listRedemptions({ cursor })                             // GET /loyalty/redemptions → { items, nextCursor }
export function cancelRedemption(id)                                    // POST /loyalty/redemptions/{id}/cancel → redemption
export function getRanking()                                            // GET /loyalty/ranking → { enabled, month, entries }
// src/api/banners.js
export function listBanners()                                           // GET /banners → items
// src/loyalty/prizes.js
export function prizeState(prize, balance)   // 'unavailable' (available falso) | 'insufficient' (balance < costPoints) | 'available'
export function redemptionStatusLabel(status) // PENDING 'Retire no balcão' | DELIVERED 'Entregue' | CANCELED 'Cancelado'
```

Regras:
- Tudo de fidelidade só com `business.modules.loyalty`; banners só com `business.modules.banners`; resposta `module_disabled` esconde a seção. Visitante vê prêmios (rota aceita só a chave), sem saldo, e "Resgatar" leva ao `Login`.
- `SaldoPontos` no topo do Agendar: `pointsLabel(balance, terms)` com `PointsDisplay`. `Banners`: carrossel de hoje com `imageUrl`; `linkUrl` abre no navegador.
- `Premios` (onde ficava "Clube de Recompensas"; título "Prêmios", subtítulo "Troque seus <pontos>"): cartão com nome, imagem, custo; estado por `prizeState` (insuficiente: "Faltam N <pontos>", sem botão desativado; indisponível: "Esgotado"). A v1 não exige clube para resgatar: a sobreposição "só para sócios" e o botão de WhatsApp saem. "Resgatar" → confirmação "Resgatar <prêmio> por N <pontos>?" → `redeemPrize` com `expectedCostPoints = prize.costPoints` e chave de `keyFor('prize:' + prize.id)` (`done` no sucesso), botão bloqueado enquanto envia → `RedemptionSuccess` com `{ redemption, balance }`. `409 insufficient_points`/`changed` → mensagem do servidor e recarrega prêmios e saldo.
- `RedemptionSuccess` (mesma tela de hoje): "Resgate feito", "Mostre esta tela no balcão", nome do prêmio, custo, `createdLabel`, situação; "Cancelar resgate" só com `PENDING` (confirmação → `cancelRedemption`); "Voltar ao início".
- `MinhaJornada` ("Histórico de Prêmios"): lista de `listRedemptions` com situação por `redemptionStatusLabel` + ponto de cor, "Carregar mais", cancelar pendente; sem dados falsos.
- Perfil: saldo no cartão; `RankingCard` só com `ranking.enabled` (título "Ranking do mês", `firstName`, `avatarUrl` ou iniciais, pontos); sem o destaque "você" e sem "sua posição" (a v1 não diz quem é o cliente); selo "<clube>" quando `clubMember`. Item "Histórico de Prêmios" só com o módulo.
- `AppointmentSuccess`: cartão "+N <pontos> quando o atendimento for concluído" com a soma de `rewardPoints` dos serviços, só com o módulo.

- [ ] **Step 1: Testes que falham** — `loyalty-api`: `redeemPrize({ prizeId: 'p1', expectedCostPoints: 300 }, 'k9')` manda `Idempotency-Key: k9` e `{ prizeId: 'p1', expectedCostPoints: 300 }`; as duas tentativas de um resgate cuja primeira resposta foi falha de rede saem com a MESMA chave (usar `createIdempotencyKeys` como a tela usa) e, depois de `done`, o próximo resgate do mesmo prêmio usa outra; `cancelRedemption('r1')` usa POST `/loyalty/redemptions/r1/cancel`; 404 `module_disabled` em `getRanking()` vira `ApiError` reconhecido por `isModuleDisabled`. `prizes`: `prizeState({ available: false, costPoints: 1 }, 99) === 'unavailable'`, `({ available: true, costPoints: 300 }, 299) === 'insufficient'`, `(…, 300) === 'available'`; os três rótulos. `banners-api`: devolve `items`. `routes`: pilha principal sem `PrizeScanner`.
- [ ] **Step 2:** `npm test` → FALHA (guardar a saída).
- [ ] **Step 3:** Implementar API, seções e telas.
- [ ] **Step 4:** Verificação padrão verde.
- [ ] **Step 5:** Commit: `feat: fidelidade e banners na API v1`.

---

### Task 6: Loja — produtos, carrinho, endereços, frete, pedidos e checkout — SENSÍVEL

**Modelos:** implementador Sonnet, revisor **Opus**.

**Files:**
- Create: `src/api/store.js`, `src/store/{order,checkout}.js`, `tests/unit/{store-api,cart,order}.test.js`
- Modify: `src/services/cartService.js` (reescrito), `src/screens/{ProductsScreen,SingleProductScreen,CarrinhoScreen,MeusPedidosScreen,PedidoDetalhesScreen}.js`, `src/components/{CarrinhoComponent,CustomHeader,EnderecoSelector,FreteSelector,FinalizarCompraModal,ConfirmModal}.js`, `src/screens/Navigator.js` (aba Loja só com `business.modules.store`), `App.js` (link `/<slug>/pedidos/<id>` abre o pedido), `src/business/BusinessProvider.js`, `src/screens/perfil/PerfilScreen.js` e `src/screens/ConfirmarExclusaoScreen.js` (todos passam a `clearCartFor(slug)`)
- Delete: `src/api/{products,pedidosApi,pedidoDetalhesApi,paymentsApi,enderecosApi,freteApi,authApi,apiConfig}.js`, `src/services/cepService.js`, `src/components/{PaymentDataSelector,PaymentMethodSelector}.js`

**Interfaces:**
- Consumes: `api.http`, `createIdempotencyKeys`, `useBusiness`, `parseStoreLink` (com `orderId`), `config`.
- Produces:

```js
// src/api/store.js
export function listCategories(); export function listProducts({ categoryId, search, cursor }); export function getProduct(id)
export function getStoreOptions()                    // GET /store/options
export function lookupPostalCode(cep)                // GET /store/postal-codes/{só dígitos} → { address, unavailable }
export function listAddresses(); export function createAddress(a); export function updateAddress(id, a); export function deleteAddress(id)
export function quoteShipping({ addressId, lines })  // POST /store/shipping-quotes → { pickup, options, shippingError }
export function createOrder({ lines, delivery, note }, idempotencyKey) // POST /store/orders + Idempotency-Key
export function listOrders({ status, cursor }); export function getOrder(id)
export function cancelOrder(id, reason)              // POST /store/orders/{id}/cancel
export function startCheckout(id, returnUrl)         // POST /store/orders/{id}/checkout { returnUrl? } → { checkoutUrl, expiresLabel }
// src/services/cartService.js
export function createCart(storage, slug)  // chave `agendaflui.cart.<slug>` → { items(), add(product, qty), setQuantity(productId, qty), remove(productId), clear(), count(), totalCents() }
//   item = { productId, name, imageUrl, unitPriceCents (= finalPriceCents), maxQuantity, quantity }
export function clearCartFor(storage, slug)
// src/store/order.js
export function toOrderLines(items)            // [{ productId, quantity }]
export function buildDelivery(choice)          // { method: 'PICKUP' } | { method: 'SHIPPING', addressId, quoteToken }
export function orderSignature(lines, delivery) // texto estável (linhas ordenadas por productId)
export function checkoutReturnUrl({ platform, origin, slug, orderId }) // web: `${origin}/${slug}/pedidos/${orderId}`; nativo: null
export function formatCents(cents)             // 'R$ 1.234,50'
export function orderStatusLabel(order)        // AWAITING_PAYMENT 'Aguardando pagamento' | PAID por fulfillmentStatus ('Pago', 'Pronto para retirar', 'Enviado', 'Entregue') | CANCELED 'Cancelado' | EXPIRED 'Prazo de pagamento vencido'
// src/store/checkout.js
export function openCheckout(checkoutUrl)      // nativo: WebBrowser.openBrowserAsync, resolve ao fechar; web: window.location.assign
```

Regras:
- Produtos: categorias em chips (de `listCategories`, sem lista fixa), "Carregar mais" pelo cursor; preço `finalPriceCents` com `priceCents` riscado quando há `promoPriceCents`; `available` falso = "Esgotado" sem botão. Quantidade de 1 a `maxQuantity`.
- Carrinho guardado só por slug (AsyncStorage `agendaflui.cart.<slug>`), nunca preço de servidor confiado: o total mostrado é estimativa, o pedido devolve o valor de verdade e a tela mostra o devolvido. Sair, trocar de loja e excluir conta chamam `clearCartFor`.
- Entrega pela `getStoreOptions()`: "Retirar na loja" (com as instruções) e/ou "Receber em casa" (endereços + frete). Endereço: CEP pelo `lookupPostalCode` (`unavailable` → digita tudo); o cadastro de endereço reaproveita `EnderecoSelector`. Frete: `quoteShipping` com o endereço; cada opção mostra nome, prazo e preço; `shippingError` aparece em texto e a retirada segue disponível. `payment.available` falso → aviso "A loja ainda não recebe pagamentos pelo app." e sem botão de finalizar.
- O passo de CPF e de forma de pagamento sai (o Mercado Pago pergunta no checkout). `FinalizarCompraModal` vira o resumo: itens, entrega, frete, total → "Fazer pedido".
- Pedido: `createOrder` com chave de `keyFor(orderSignature(lines, delivery))`; botão bloqueado enquanto envia; falha de rede ou 5xx → "Tentar de novo" reenvia com a MESMA chave; sucesso → `done`, carrinho limpo, `startCheckout(order.id, checkoutReturnUrl(...))` → `openCheckout`. `409 quote_expired`/`invalid_quote` → recota o frete; `409 too_many_open_orders` e `out_of_stock` → mensagem do servidor.
- Volta do pagamento: nativo, quando o navegador fecha, abre `PedidoDetalhes` do pedido e busca de novo; web, o `returnUrl` traz `/<slug>/pedidos/<id>` e o `App.js` abre `MeusPedidos > PedidoDetalhes`. (A v1 só aceita `returnUrl` http(s) com origem liberada na chave; `agendaflui://` não serve.)
- Pedidos: lista com `orderStatusLabel`, número, `createdLabel` e total; detalhe com itens (pelo `name`, qualquer que seja o tipo), entrega, `trackingCode`, `pickupInstructions`, `expiresLabel`; "Pagar agora" só com `canPay` (`startCheckout` devolve o mesmo endereço); "Cancelar pedido" só com `canCancel` (confirmação → `cancelOrder`). Sem "tentar pagar de novo" fora disso.

- [ ] **Step 1: Testes que falham** — `cart`: `createCart(storage, 'patas').add({ id: 'p1', finalPriceCents: 1990, maxQuantity: 3, … }, 2)` grava só em `agendaflui.cart.patas`; somar até passar de 3 fica em 3; `setQuantity('p1', 0)` remove; `totalCents()` = soma de `unitPriceCents × quantity`; o carrinho de `'outra'` começa vazio; `clearCartFor(storage, 'patas')` não toca `agendaflui.cart.outra`. `order`: `toOrderLines` só com `productId` e `quantity`; `buildDelivery({ method: 'SHIPPING', addressId: 'a1', quoteToken: 't' })` exato; `orderSignature` igual para as mesmas linhas em outra ordem e diferente com outro `quoteToken`; `checkoutReturnUrl({ platform: 'web', origin: 'https://app.agendaflui.com.br', slug: 'patas', orderId: 'o1' }) === 'https://app.agendaflui.com.br/patas/pedidos/o1'` e `platform: 'ios'` → `null`; `formatCents(123450) === 'R$ 1.234,50'` (comparar sem depender do espaço do Intl: normalizar ` `); os rótulos de `orderStatusLabel`. `store-api`: `createOrder(body, 'k1')` manda `Idempotency-Key: k1` e o corpo sem `priceCents`, `totalCents` nem `shippingCents`; **primeira tentativa sem rede e segunda com sucesso saem com a mesma chave; outro carrinho sai com outra**; `lookupPostalCode('80010-000')` chama `/store/postal-codes/80010000`; `startCheckout('o1', null)` manda corpo sem `returnUrl`; `cancelOrder('o1', null)` usa POST `/store/orders/o1/cancel`; nenhuma função chama caminho com `voucher`.
- [ ] **Step 2:** `npm test` → FALHA (guardar a saída).
- [ ] **Step 3:** Implementar API, carrinho, pedido, checkout e telas.
- [ ] **Step 4:** Verificação padrão verde.
- [ ] **Step 5:** Commit: `feat: loja e checkout na API v1`.

---

### Task 7: Fechamento — varredura final, README, AGENTS.md e export

**Modelos:** implementador Sonnet, revisor Sonnet. Depois desta tarefa, a revisão do ramo inteiro (o coordenador escolhe o modelo; sugestão: Opus).

**Files:**
- Modify: `README.md`, `AGENTS.md`, `package.json`/`package-lock.json` (sai `react-native-vector-icons` e o que sobrou sem uso), `tests/unit/old-terms.test.js` (passa a varrer também `README.md` e `AGENTS.md`), qualquer arquivo que a varredura apontar
- Delete: arquivos sem importação que restarem (conferir cada `src/**` com `grep -rl "<nome>" src App.js`)

Regras:
- `grep -rn "react-native-vector-icons\|MaterialIcons\|MaterialCommunityIcons" src App.js` vazio (tudo em `Icon`/Feather); `grep -rnE "axios\.|fetch\(" src` só em `src/api/client.js`; `grep -rn "AsyncStorage" src` sem nenhuma chave de token; `grep -rn "console.log" src` vazio.
- `README.md` (até 60 linhas): o que é o app; como rodar (`npm install`, `.env` a partir do `.env.example`, `npx expo start`); como entrar numa loja (`agendaflui://loja/<slug>`, na web `/<slug>`, ou o código); testes e verificação (os comandos da "Verificação padrão"); limitações (tokens no `localStorage` na web; a origem do app web precisa estar liberada na chave de plataforma; o servidor web precisa devolver o `index.html` para `/<slug>` e `/<slug>/pedidos/<id>`; volta do pagamento no celular é pelo fechamento do navegador); o que é do dono (`eas init`, `eas env:create --name EXPO_PUBLIC_APP_KEY`, ids nas lojas, revogar a chave antiga do YouTube no Google). `AGENTS.md`: regras deste repositório para agentes (as Global Constraints essenciais em até 30 linhas, apontando o design e este plano), sem citar `../site/AGENTS.md`.

- [ ] **Step 1:** Ampliar `old-terms.test.js` para `README.md` e `AGENTS.md` → rodar → FALHA (README e AGENTS atuais citam o app antigo/`../site`).
- [ ] **Step 2:** Reescrever README e AGENTS.md, tirar dependências e arquivos sem uso, resolver o que as buscas acima apontarem.
- [ ] **Step 3:** Verificação padrão verde, com a varredura incluindo `README.md AGENTS.md`; `npm ls react-native-vector-icons` vazio.
- [ ] **Step 4:** Commit: `docs: README e regras do app AgendaFlui`.

---

## Decisões do plano (para o coordenador conferir)

1. **Loja desconhecida é 401, não 404**: a API responde `401 unknown_business` para slug inexistente com chave de plataforma. O app trata esse 401 como "Não achamos essa loja" e nunca tenta renovar o token por ele.
2. **Volta do Mercado Pago**: `returnUrl` só aceita `http(s)` com origem liberada na chave; `agendaflui://` é recusado (422). No celular o checkout abre no navegador do app e, ao fechar, o app abre e atualiza o pedido; na web volta para `/<slug>/pedidos/<id>`. Para voltar por `agendaflui://` seria preciso uma página https da plataforma que redirecione (fora deste plano).
3. **`CodigoLoja` na Tarefa 2** (não na 3): a raiz precisa dela para existir sem loja; a Tarefa 3 só ajusta o visual junto das outras telas de entrada.
4. **Reenviar código** = chamar o cadastro de novo com os mesmos dados (a v1 não tem rota de reenvio); os dados ficam só em memória. Login não tem mais o caminho "conta não verificada".
5. **Senha mínima 10** (era 6), código de 6 dígitos; trocar senha pede a atual.
6. **Remarcar não troca serviço** (a v1 só aceita horário e profissional): no modo remarcar o passo de serviço aparece travado e o botão vira "Trocar horário".
7. **Clube não trava prêmios nem ranking**: a v1 deixa qualquer cliente resgatar com pontos; a sobreposição "só para sócios" e o WhatsApp fixo saem. O clube só trava serviços `clubOnly` e vira selo no perfil.
8. **Ranking sem "você"**: a v1 devolve só primeiro nome e pontos, sem identificar o cliente; o destaque e "sua posição" saem.
9. **Foto**: `/v1/me` tem `avatarUrl` (só leitura). O app mostra a foto quando existe e iniciais quando não; o botão de trocar sai.
10. **Suporte sai do perfil** (a v1 não tem contato da loja); Privacidade e Termos apontam para `agendaflui.com.br`. O crédito "LRM Solutions" e o logo dela saem; o rodapé vira "Feito com Agenda Flui".
11. **Cores da conta ignoradas**: `/v1/business.brand` traz `primary`/`accent` da loja, mas o app usa a paleta Agenda Flui fixa; da loja só nome e logo (como a spec manda).
12. **Ícones Feather** de `@expo/vector-icons` (traço, já vem com o Expo) em vez de `lucide-react-native` (que exigiria `react-native-svg`).
13. **Fontes por `@expo-google-fonts`** (pesos estáticos) em vez dos TTF variáveis do pacote da marca, por causa do Android.
14. **npm** (há `package-lock.json`); o campo `packageManager: pnpm` sai. O `main` do `package.json` aponta para `index.js`, que hoje não existe: a Tarefa 1 cria.
15. **CPF e escolha de forma de pagamento saem do carrinho** (o Checkout Pro do Mercado Pago pergunta); ViaCEP direto sai (CEP pela API).
16. **Disponibilidade em até 31 dias** por chamada (`/availability/days` limita), mesmo que a conta permita agendar mais longe.
