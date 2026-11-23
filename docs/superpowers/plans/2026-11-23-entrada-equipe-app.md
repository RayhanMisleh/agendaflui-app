# Entrada pelo link, marca da loja e área da equipe — app — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** O app (iOS, Android e web em `https://app.agendaflui.com.br`) abre pelo link da loja com a cara dela (logo, nome e cor), o link https abre o app instalado, a equipe entra pelo mesmo app ("Sou da equipe") e cuida da agenda do dia, e as telas ficam fluidas.

**Architecture:** A marca da loja vem de `GET /v1/business` (`brand.tokens`, já derivados no servidor com contraste AA) e vira a paleta clara do tema. A equipe ganha um segundo cliente da API (`staffApi`), criado pela mesma fábrica `createApiClient` com caminhos de sessão da equipe, tokens próprios no SecureStore e um modo guardado (`customer` | `staff`) no `businessStore`. As telas da equipe moram em `src/staff/` e usam os componentes de `src/components/ui/`.

**Tech Stack:** Expo SDK 54, React Native 0.81, JavaScript, react-navigation 7 (stack + bottom-tabs), axios, expo-secure-store, expo-notifications, expo-web-browser, Jest (`jest-expo`).

**Spec:** `../painel/docs/superpowers/specs/2026-11-23-entrada-equipe-app-design.md` (manda; substitui, no que conflitar, as decisões de 18/11 sobre paleta fixa, links universais e app da equipe). Estado do app: `docs/superpowers/specs/2026-11-18-reforma-app-design.md`. Contratos da API: Tasks 2, 9, 10 e 11 de `../painel/docs/superpowers/plans/2026-11-23-entrada-equipe-painel.md` (copiados nos blocos Interfaces abaixo). Rode cada parte do app depois da parte correspondente do painel estar commitada (os testes do app não tocam a rede, mas o contrato tem de existir).

## Global Constraints

- Regras do `AGENTS.md` valem em toda tarefa: JavaScript, sem TypeScript nem expo-router; dependência nova só com `npx expo install`; toda chamada à API pela fábrica de `src/api/client.js` (nenhum `fetch`/`axios` direto em tela, componente ou serviço); tokens só no SecureStore (web: `localStorage`), nunca em AsyncStorage, log, URL ou parâmetro de navegação; `X-Business` em toda requisição, menos `POST /v1/auth/staff/login`; rotas só mudam em `src/navigation/routes.js` junto com `tests/unit/routes.test.js`; sem cor fixa fora do tema; ícones Feather pelo `Icon`.
- Textos em pt-BR, voz da marca: frase curta, verbo na frente, "você". Termos da conta (profissional, cliente, pontos, clube) por `useTerms()`.
- Varredura de termos antigos (`tests/unit/old-terms.test.js`) continua vazia: nada de "voucher", "whatsapp"/`wa.me`, "coin" (cuidado com palavras que contêm essas letras), "sans" fora de `sans-serif`.
- Marca: depois de escolher a loja (link, código ou login da equipe), app e web mostram logo, nome e cor principal da loja; a Agenda Flui aparece só na entrada sem loja e no "Feito com Agenda Flui".
- Equipe: o app só faz o dia a dia (agenda, atendimento, bloqueio, cliente, perfil). Gestão (configurações, relatórios, equipe, produtos, prêmios, loja) não entra: o perfil tem "Abrir painel completo" → `https://painel.agendaflui.com.br` (`EXPO_PUBLIC_PAINEL_URL`, padrão esse).
- Um modo por vez no aparelho: cliente de uma loja OU equipe de uma loja. Entrar num modo apaga a sessão, o aparelho de push e o cache do outro.
- Variáveis do build (EAS/`.env`), nunca escritas em código nem em `app.json`/`eas.json` com valor: `EXPO_PUBLIC_APP_STORE_URL`, `EXPO_PUBLIC_PLAY_STORE_URL`, `EXPO_PUBLIC_PAINEL_URL`; para os arquivos de associação, `APPLE_TEAM_ID` e `ANDROID_CERT_SHA256` (lidas só pelo script de publicação web). Contas Apple/Google e credenciais de push são do dono.
- Movimento: só em resposta a ação ou para mostrar o que mudou; 150–250 ms; só opacidade e deslocamento/escala; com "reduzir movimento" do sistema ligado, sem animação.
- Testes: Jest em `tests/unit/*.test.js`, sem rede (`tests/helpers/fake-adapter.js`) e sem armazenamento real (`tests/helpers/memory-storage.js`). Telas sem teste automático. Sem navegador, simulador nem `expo start`.
- Verificação padrão (último passo de toda tarefa):

```bash
npm test
npx expo export --platform web --output-dir dist/web
npx expo export --platform android --output-dir dist/android
```

Esperado: testes verdes sem aviso novo; os dois `export` terminam sem erro (sem conta EAS e sem as variáveis do build).
- Commits locais em português (`tipo: descrição`), terminando com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Sem push. Não commite `.env`, `dist/` nem `node_modules/`.

## Review Focus

1. **Token no lugar errado**: token da equipe indo para `/v1/availability*` ou `/v1/business` (rotas de cliente/visitante recusam token ruim), token do cliente indo para `/v1/staff/*`, renovação da equipe chamando `/auth/customer/refresh`; entrar como equipe apaga a sessão de cliente e vice-versa. Testes na Task 4.
2. **Link de loja com a equipe logada** (app aberto ou na partida): ignorado com o aviso "Saia da conta da equipe para entrar como cliente.", sem trocar a loja nem derrubar a sessão. Teste na Task 5.
3. **Cor da loja ilegível ou tokens faltando** (cor muito clara, `tokens` ausente, valor fora de `#RRGGBB`): a paleta volta à da Agenda Flui; nunca texto sem contraste 4,5 sobre a cor. Testes na Task 1.
4. **Variáveis do build ausentes ou erradas** (URL de loja de apps sem https, team id fora do formato, impressão digital com tamanho errado): botão some quando a URL falta ou é inválida; arquivos de associação não são gerados sem as variáveis e o script falha com mensagem clara quando o valor existe mas é inválido. Testes nas Tasks 2 e 3.
5. **Profissional vendo o que não pode**: sem `view_all_agendas`, sem filtro de profissional e a agenda pede só a própria coluna; 403 ao abrir cliente ou atendimento vira mensagem na tela, sem quebrar; ação que o status não permite não aparece. Testes nas Tasks 6 e 7.

---

## Parte A — Marca da loja e link

### Task 1: Tons da cor da loja no tema

**Files:**
- Create: `src/theme/contrast.js`, `src/theme/storeBrand.js`, `tests/unit/store-brand.test.js`
- Modify: `src/theme/tokens.js` (chave `brandText` nas paletas clara e escura, igual a `brand`), `src/utils/theme.js` (`buildColors` repassa `brandText`), `src/utils/ThemeContext.js` (paleta clara = `storePalette(business)`), `App.js` (`BusinessProvider` passa a envolver `ThemeProvider`)

**Interfaces:**
- Consumes (API): `GET /v1/business` com `X-Business: <slug>`, sem login → `{ id, slug, name, timeZone, brand: { logoUrl, symbolUrl, primary, accent, material, tokens: { '--brand', '--brand-strong', '--brand-tint', '--on-brand', '--brand-text', … } }, terms, modules: { loyalty, banners, store }, rules }`.
- Produces:
  - `contrastRatio(a: string, b: string): number` (WCAG, `#RRGGBB`).
  - `storePalette(business: object | null, base = colors.light): object` — `base` com `brand`, `brandStrong`, `brandTint`, `onBrand`, `brandText` trocados por `tokens['--brand']`, `['--brand-strong']`, `['--brand-tint']`, `['--on-brand']`, `['--brand-text']`, só quando os cinco existem, são `#RRGGBB`, `contrastRatio(onBrand, brand) >= 4.5` e `contrastRatio(brandText, base.ground) >= 4.5`; senão `base` como veio.
  - O tema escuro continua com a paleta escura da Agenda Flui (o servidor só deriva o tema claro).

- [ ] **Step 1: Write the failing test**

```js
test("tokens válidos da loja trocam os cinco tons da marca", () => {
  const p = storePalette({ brand: { tokens: TOKENS_TERRACOTA } });
  expect(p.brand).toBe(TOKENS_TERRACOTA["--brand"]);
  expect(p.ground).toBe(colors.light.ground);
});
test("sem loja, sem tokens ou com valor fora de #RRGGBB: paleta da Agenda Flui", ...);
test("onBrand sem contraste 4,5 sobre brand: paleta da Agenda Flui", ...);
test("contrastRatio: preto e branco dá 21; cor igual dá 1", ...);
```

- [ ] **Step 2: Run** `npx jest tests/unit/store-brand.test.js` — Expected: FAIL ("Cannot find module").
- [ ] **Step 3: Implementar** `contrast.js`, `storePalette` e ligar no `ThemeContext` (memo por `business`). Confira que topo, entrada e perfil já mostram logo e nome da loja (`BrandLogo`, `EntryLayout`, `PerfilVisitante`); onde ainda houver cor fixa da Agenda Flui em tela com loja, troque por chave do tema.
- [ ] **Step 4: Run** — Expected: PASS.
- [ ] **Step 5: Verificação padrão e commit** (`feat: app usa os tons da cor da loja`)

### Task 2: Entrada web da loja com os botões das lojas de aplicativos

**Files:**
- Create: `src/components/entry/StoreBadges.js`
- Modify: `src/config.js`, `src/screens/IntroScreen.web.js`, `src/screens/LoginScreen.js` (só na web), `README.md` (variáveis novas)
- Test: `tests/unit/config.test.js`

**Interfaces:**
- Produces: `readConfig(env)` passa a devolver também `appStoreUrl: string | null`, `playStoreUrl: string | null` (de `EXPO_PUBLIC_APP_STORE_URL`, `EXPO_PUBLIC_PLAY_STORE_URL`; só `https://`, senão `null`) e `painelUrl: string` (de `EXPO_PUBLIC_PAINEL_URL`, padrão `https://painel.agendaflui.com.br`, sem barra final). `StoreBadges({ style })`: um botão por URL não nula ("Baixar na App Store", "Baixar no Google Play"), abre com `Linking.openURL`; sem nenhuma URL, não renderiza nada.

- [ ] **Step 1: Write the failing test**

```js
test("URLs das lojas de aplicativos: https vira o valor; vazio ou http vira null", ...);
test("painelUrl: padrão painel.agendaflui.com.br, sem barra no fim", ...);
```

- [ ] **Step 2: Run** `npx jest tests/unit/config.test.js` — Expected: FAIL.
- [ ] **Step 3: Implementar** — a entrada web da loja (`IntroScreen.web.js`) mostra o logo e o nome da loja (`BrandLogo` e `business.name`), Entrar / Criar conta, `StoreBadges`, a frase "No app você recebe os avisos dos seus horários." (só quando há ao menos um botão) e "Feito com Agenda Flui". O login na web também mostra `StoreBadges` e a frase, abaixo do formulário. Cite as variáveis no `config.js` por extenso (`process.env.EXPO_PUBLIC_...`).
- [ ] **Step 4: Run** — Expected: PASS.
- [ ] **Step 5: Verificação padrão e commit** (`feat: entrada web da loja com botões das lojas de aplicativos`)

### Task 3: Link https abre o app instalado

**Files:**
- Create: `scripts/well-known.js`, `tests/unit/well-known.test.js`, `tests/unit/app-json.test.js`
- Modify: `app.json`, `scripts/web-zip.js`, `public/.htaccess`, `docs/PUBLICACAO-WEB.md`

**Interfaces:**
- Produces:
  - `app.json`: `ios.associatedDomains: ["applinks:app.agendaflui.com.br"]`; `android.intentFilters: [{ "action": "VIEW", "autoVerify": true, "data": [{ "scheme": "https", "host": "app.agendaflui.com.br" }], "category": ["BROWSABLE", "DEFAULT"] }]`.
  - `wellKnownFiles(env: { APPLE_TEAM_ID?: string, ANDROID_CERT_SHA256?: string }): { path: string, content: string }[]` (CommonJS, para o script):
    - com `APPLE_TEAM_ID` (10 caracteres `A-Z0-9`): `.well-known/apple-app-site-association` = `{ "applinks": { "details": [{ "appIDs": ["<TEAM>.com.agendaflui.app"], "components": [{ "/": "/.well-known/*", "exclude": true }, { "/": "/*" }] }] } }`;
    - com `ANDROID_CERT_SHA256` (uma ou mais impressões separadas por vírgula, cada uma 32 pares hexadecimais com `:`): `.well-known/assetlinks.json` = `[{ "relation": ["delegate_permission/common.handle_all_urls"], "target": { "namespace": "android_app", "package_name": "com.agendaflui.app", "sha256_cert_fingerprints": [...] } }]`;
    - variável ausente ou vazia → o arquivo não entra na lista; valor presente e inválido → `throw new Error` com o nome da variável e o formato esperado (sem repetir o valor).
  - `web-zip.js` grava esses arquivos em `dist/web/` depois do export e antes do zip.
  - `.htaccess`: `apple-app-site-association` e `assetlinks.json` saem como `application/json` com `Cache-Control: no-cache`; `/.well-known/` que não existe dá 404 (não cai no `index.html`).
  - O app já trata `https://<host>/<slug>` em `parseStoreLink` e escuta `Linking` no `BusinessProvider`; nada muda ali.

- [ ] **Step 1: Write the failing tests**

```js
test("sem variáveis: nenhum arquivo", () => expect(wellKnownFiles({})).toEqual([]));
test("team id válido gera o AASA com o appID e sem abrir /.well-known no app", ...);
test("impressões válidas geram assetlinks com o pacote com.agendaflui.app", ...);
test("team id ou impressão inválidos: erro citando a variável e não o valor", ...);
test("app.json tem associatedDomains e intentFilter autoVerify para app.agendaflui.com.br", ...);
test(".htaccess serve o AASA como JSON e não reescreve /.well-known", ...); // lê public/.htaccess
```

- [ ] **Step 2: Run** `npx jest tests/unit/well-known.test.js tests/unit/app-json.test.js` — Expected: FAIL.
- [ ] **Step 3: Implementar** e documentar em `PUBLICACAO-WEB.md` (três linhas: quais variáveis, de onde o dono tira cada uma — ID do time Apple e SHA-256 do certificado de assinatura do Google Play — e que sem elas o link abre a web).
- [ ] **Step 4: Run** — Expected: PASS.
- [ ] **Step 5: Verificação padrão e commit** (`feat: link https da loja abre o app instalado`)

## Parte C — Área da equipe

### Task 4: Sessão da equipe (cliente da API, tokens e modo)

Revisão: Opus

**Files:**
- Create: `src/staff/api.js`, `src/api/staff.js`, `tests/unit/staff-client.test.js`, `tests/unit/staff-api.test.js`
- Modify: `src/api/client.js`, `src/session/tokenStore.js` (chave configurável), `src/business/businessStore.js` (modo), `src/services/notificationService.js` (alvo `staff`)
- Test: `tests/unit/client.test.js`, `tests/unit/token-store.test.js`, `tests/unit/business.test.js`, `tests/unit/devices.test.js`

**Interfaces:**
- Consumes (API, Tasks 10 e 11 do painel):
  - `POST /v1/auth/staff/login`, **sem** `X-Business`, `{ email, password }` → `{ tokens: { accessToken, accessExpiresAt, refreshToken, refreshExpiresAt }, member: { userId, membershipId, name, role: 'OWNER' | 'MANAGER' | 'PROFESSIONAL', professionalId }, business: { id, slug, name } }`; 401 `invalid_credentials`; 503 `business_unavailable`; 429.
  - Com `X-Business: <business.slug>`: `POST /v1/auth/staff/refresh` `{ refreshToken }` → `{ tokens }`; `POST /v1/auth/staff/logout` `{ refreshToken }` → 204; `GET /v1/staff/me` → `{ userId, membershipId, name, email, role, roleLabel, professionalId, capabilities: string[], notifyAllAppointments: boolean }`; `PATCH /v1/staff/me` `{ notifyAllAppointments: boolean }` → o mesmo (403 para profissional); `POST /v1/staff/devices` `{ platform, pushToken }` → 204; `DELETE /v1/staff/devices/{pushToken}` → 204.
- Produces:
  - `createApiClient({ ..., authPrefix = '/auth/customer/', refreshPath = '/auth/customer/refresh', anonymousPaths = [], noBusinessPaths = [] })` — sem as opções novas, comportamento igual ao de hoje. `anonymousPaths`: prefixos que nunca levam `Authorization`. `noBusinessPaths`: caminhos exatos que podem sair sem loja ativa (e então saem sem `X-Business`).
  - `createTokenStore(storage, { key = 'agendaflui.session' } = {})`.
  - `businessStore.getMode(): Promise<'customer' | 'staff' | null>`, `setMode(mode)`; `clear()` também limpa o modo.
  - `src/staff/api.js`: `staffTokenStore` (chave `agendaflui.staffSession`), `staffSessionTokens`, `staffApi = createApiClient({ baseURL, getSlug: getActiveSlug, tokens: staffSessionTokens, authPrefix: '/auth/staff/', refreshPath: '/auth/staff/refresh', anonymousPaths: ['/availability', '/business'], noBusinessPaths: ['/auth/staff/login'], onSessionEnded, onBusinessGone })`, `setStaffSessionHandlers({ onSessionEnded, onBusinessGone })`.
  - `src/api/staff.js` (todas por `staffApi.http`): `staffLogin({ email, password })`, `staffLogout(refreshToken, slug)` (com `X-Business` explícito), `getStaffMe()`, `setNotifyAll(value)`, `getAgenda({ from, to, professionalId })`, `getStaffAppointment(id)`, `confirmAppointment(id)`, `completeAppointment(id)`, `markNoShow(id)`, `cancelStaffAppointment(id, reason)`, `rescheduleStaffAppointment(id, { startsAt, professionalId })`, `freeSlots({ date, serviceIds, professionalId })` (`GET /availability`, sem token), `listStaffProfessionals()`, `createTimeBlock(input)`, `getStaffCustomer(id)`, `listCustomerAppointments(id, { scope, cursor })`.
  - `registerDevice({ target = 'customer' } = {})` / `unregisterDevice({ target = 'customer' } = {})`: com `target: 'staff'`, `/staff/devices` pelo `staffApi`.

- [ ] **Step 1: Write the failing tests**

```js
test("login da equipe sai sem X-Business e sem Authorization, mesmo sem loja ativa", ...);
test("rota da equipe leva o token da equipe e X-Business da loja ativa", ...);
test("/availability e /business nunca levam o token da equipe", ...);
test("401 session_invalid na equipe renova por /auth/staff/refresh, uma vez só para duas requisições", ...);
test("cliente sem as opções novas continua igual (refresh em /auth/customer/refresh)", ...);
test("tokens da equipe e do cliente ficam em chaves diferentes e não se apagam entre si", ...);
test("modo guardado volta igual; clear apaga o modo", ...);
test("cada função de src/api/staff.js chama o método e o caminho do contrato", ...);  // tabela com fakeAdapter
test("aparelho da equipe registra em /staff/devices e sai do aparelho no logout", ...);
```

- [ ] **Step 2: Run** `npx jest tests/unit/staff-client.test.js tests/unit/staff-api.test.js tests/unit/client.test.js` — Expected: FAIL.
- [ ] **Step 3: Implementar** sem mudar o comportamento do cliente de clientes.
- [ ] **Step 4: Run** `npm test` — Expected: PASS.
- [ ] **Step 5: Verificação padrão e commit** (`feat: sessão da equipe no app`)

### Task 5: "Sou cliente" ou "Sou da equipe", entrada da equipe e perfil

Revisão: Opus

**Files:**
- Create: `src/screens/BoasVindasScreen.js`, `src/staff/StaffSessionProvider.js`, `src/staff/StaffNavigator.js`, `src/staff/screens/EntradaEquipeScreen.js`, `src/staff/screens/AgendaEquipeScreen.js`, `src/staff/screens/PerfilEquipeScreen.js`, `tests/unit/staff-session.test.js`
- Modify: `src/navigation/routes.js`, `tests/unit/routes.test.js`, `App.js`, `src/business/BusinessProvider.js`, `AGENTS.md` (uma linha: a área da equipe mora em `src/staff/` e chama a API só pelo `staffApi`; o design de 23/11 manda onde conflitar com o de 18/11), `README.md`

**Interfaces:**
- Consumes: Task 4.
- Produces:
  - Rotas novas: raiz `BoasVindas`, `EntradaEquipe`, `Equipe`; pilha da equipe `EquipeTabs`, `Atendimento`, `Remarcar`, `BloquearHorario`, `ClienteEquipe`; abas da equipe `AgendaEquipe`, `PerfilEquipe`. Listas: `ROOT_ROUTES` ganha `"BoasVindas", "EntradaEquipe", "Equipe"` (no fim); `STAFF_STACK_ROUTES = ["EquipeTabs", "Atendimento", "Remarcar", "BloquearHorario", "ClienteEquipe"]`; `STAFF_TAB_ROUTES = ["AgendaEquipe", "PerfilEquipe"]`. As telas `Atendimento`, `Remarcar`, `BloquearHorario`, `ClienteEquipe` entram nas Tasks 6 e 7; até lá, os nomes ficam só no manifesto.
  - `initialRootRoute({ platform, hasBusiness, isAuthenticated, mode })`: `mode === 'staff'` → `Equipe`; sem loja → `BoasVindas`; o resto como hoje.
  - `useStaffSession()` → `{ status: 'loading' | 'none' | 'ready', member, profile, signIn(email, password), signOut(), refreshProfile() }`. `signIn`: login → se havia loja de cliente, sai dela (`leaveBusiness`) → grava tokens da equipe com o slug → `setMode('staff')` → escolhe a loja (`selectBusiness(slug)`, a marca carrega) → registra o aparelho (`target: 'staff'`). `signOut`: tira o aparelho, `staffLogout` (sem esperar a rede), apaga tokens, limpa a loja e o modo → `BoasVindas`.
  - Pura e testada: `decideIncomingLink(mode, currentSlug, incomingSlug)` → `'ignore_staff' | 'select' | 'confirm' | 'none'`; com `mode === 'staff'`, sempre `'ignore_staff'` (toast "Saia da conta da equipe para entrar como cliente.").

- [ ] **Step 1: Write the failing tests**

```js
test("manifesto: raiz, pilha e abas da equipe", ...);              // routes.test.js com as listas novas
test("initialRootRoute: modo equipe abre Equipe; sem loja abre BoasVindas", ...);
test("link de loja com a equipe logada é ignorado", () =>
  expect(decideIncomingLink("staff", "patas", "outra")).toBe("ignore_staff"));
test("signIn guarda a sessão da equipe, o modo e a loja; apaga a sessão de cliente", ...);  // provider com dependências injetadas
test("signOut apaga tokens, modo e loja mesmo sem rede", ...);
```

Para testar o provider sem tela, extraia a lógica para `createStaffSession(deps)` (funções puras sobre `{ http, tokens, businessStore, leaveBusiness, selectBusiness, registerDevice, unregisterDevice }`) e deixe o componente fino.

- [ ] **Step 2: Run** `npx jest tests/unit/staff-session.test.js tests/unit/routes.test.js` — Expected: FAIL.
- [ ] **Step 3: Telas**
  - `BoasVindas` (marca Agenda Flui, sem loja): "Sou cliente" → `CodigoLoja` (texto: "Use o link ou o código da sua loja"); "Sou da equipe" → `EntradaEquipe`.
  - `EntradaEquipe`: e-mail e senha (`EntryLayout`, `Field`), "Entrar"; erro do servidor como veio; "Esqueci a senha" abre `<painelUrl>/esqueci-a-senha` (`expo-web-browser`).
  - `Equipe` (`StaffNavigator`): abas Agenda e Perfil, com logo e nome da loja no topo. Nesta tarefa `AgendaEquipe` mostra a lista do dia (hora, cliente, serviços, situação) por `getAgenda({ from: hoje, to: hoje })`; a Task 6 a completa.
  - `PerfilEquipe`: nome, papel (`roleLabel`), loja; "Receber avisos de toda a loja" (interruptor, só com `view_all_agendas`, chama `setNotifyAll` e desfaz se falhar); "Abrir painel completo" (abre `painelUrl`); "Sair"; "Feito com Agenda Flui".
  - `App.js`: com `mode === 'staff'` a pilha raiz só tem `Equipe`; sem loja, `BoasVindas`, `CodigoLoja` e `EntradaEquipe`; com loja de cliente, como hoje. Push recebido no modo equipe mostra o toast com o nome da loja; tocar num aviso com `appointmentId` abre `Atendimento` (a rota passa a existir na Task 6; até lá, só abre a agenda).
- [ ] **Step 4: Run** `npm test` — Expected: PASS.
- [ ] **Step 5: Verificação padrão e commit** (`feat: equipe entra pelo app e cai direto na loja dela`)

### Task 6: Agenda da equipe e atendimento

**Files:**
- Create: `src/staff/agenda.js`, `src/staff/screens/AtendimentoScreen.js`, `src/staff/screens/RemarcarScreen.js`, `tests/unit/staff-agenda.test.js`
- Modify: `src/staff/screens/AgendaEquipeScreen.js`, `src/staff/StaffNavigator.js`, `src/utils/time.js` (se faltar ajudante de semana)

**Interfaces:**
- Consumes (API, já existentes): `GET /v1/staff/agenda?from=AAAA-MM-DD&to=AAAA-MM-DD[&professionalId]` → `{ days: [{ date, weekday, closed, closureReason, professionals: [{ id, name, active, archived, workingRanges, appointments: StaffAppointment[], blocks }] }] }` (quem não tem `view_all_agendas` recebe só a própria coluna); `GET /v1/staff/professionals` → `{ items: [{ id, name, … }] }`; `GET /v1/staff/appointments/{id}` → `StaffAppointment` = `{ id, status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELED' | 'NO_SHOW', startsAt, endsAt, local: { date, start, end }, customer: { id, name, phoneLabel }, professional: { id, name }, items: [{ serviceId, name, priceCents, durationMin }], totalCents, customerNote, notes, commissionCents, … }`; `POST /v1/staff/appointments/{id}/confirm|complete|no-show` (sem corpo); `POST …/cancel` `{ reason?: string | null }`; `POST …/reschedule` `{ startsAt: '<ISO com Z>', professionalId?: string | null }`; `GET /v1/availability?date&serviceIds=a,b&professionalId` (sem token) → horários livres.
- Produces (puras, em `src/staff/agenda.js`):
  - `agendaRange(view: 'day' | 'week', date: string): { from: string, to: string }` — semana de segunda a domingo que contém `date`.
  - `agendaDays(days, { professionalId } = {}): [{ date, closed, items: StaffAppointment[] }]` — itens de todas as colunas (ou só da escolhida), em ordem de início.
  - `appointmentActions(appt, nowIso): Array<'confirm' | 'complete' | 'no_show' | 'cancel' | 'reschedule'>` — `PENDING`: confirm, cancel, reschedule; `CONFIRMED`: cancel, reschedule e, depois do início, complete e no_show; outros: nenhuma.
  - `canFilterProfessionals(profile): boolean` — `capabilities` inclui `view_all_agendas`.

- [ ] **Step 1: Write the failing test**

```js
test("semana de segunda a domingo", () =>
  expect(agendaRange("week", "2026-11-26")).toEqual({ from: "2026-11-23", to: "2026-11-29" }));
test("dia: from e to iguais", ...);
test("agendaDays junta as colunas em ordem de início e filtra por profissional", ...);
test.each([...])("ações de %s antes e depois do início", ...);
test("profissional sem view_all_agendas não filtra", ...);
```

- [ ] **Step 2: Run** `npx jest tests/unit/staff-agenda.test.js` — Expected: FAIL.
- [ ] **Step 3: Telas** — Agenda: alternar Dia/Semana, voltar/avançar, "Hoje"; filtro por profissional só com `canFilterProfessionals`; dia fechado mostra o motivo; bloqueios aparecem na lista; botão "Bloquear horário" (destino da Task 7). Atendimento: horário, cliente (toque abre `ClienteEquipe`, Task 7), serviços, total, observação do cliente e anotação interna quando vierem; botões de `appointmentActions` (cancelar pede confirmação e motivo opcional). Remarcar: data, profissional (só com o filtro), horários livres por `freeSlots`; confirma e volta ao atendimento atualizado. 403/404 viram a mensagem do servidor na tela.
- [ ] **Step 4: Run** — Expected: PASS.
- [ ] **Step 5: Verificação padrão e commit** (`feat: agenda e atendimento da equipe no app`)

### Task 7: Bloquear horário e ficha do cliente

**Files:**
- Create: `src/staff/forms.js`, `src/staff/screens/BloquearHorarioScreen.js`, `src/staff/screens/ClienteEquipeScreen.js`, `tests/unit/staff-forms.test.js`
- Modify: `src/staff/StaffNavigator.js`, `src/staff/screens/AgendaEquipeScreen.js`, `src/staff/screens/AtendimentoScreen.js`

**Interfaces:**
- Consumes (API, já existentes): `POST /v1/staff/time-blocks` `{ professionalId, startDate: 'AAAA-MM-DD', startTime: 'HH:MM', endDate?, endTime: 'HH:MM' (aceita '24:00'), reason?: string | null }` → 201 `{ …, affectedAppointments: number }`; `GET /v1/staff/customers/{id}` → `{ id, name, email, phone, phoneLabel, avatarUrl, birthDate, isClubMember, origin, hasAppAccess, archived, createdAt, notes }`; `GET /v1/staff/customers/{id}/appointments?scope=upcoming|past[&cursor]` → `{ items: StaffAppointment[], nextCursor }`.
- Produces:
  - `blockInput(form: { professionalId, date, start, end, reason }): { ok: true, body } | { ok: false, fields: { [campo]: mensagem } }` — início antes do fim, hora `HH:MM`, motivo até 200 caracteres, vazio vira `null`.
  - `contactLinks(customer): Array<{ kind: 'phone' | 'email', label: string, url: string }>` — `tel:` com só dígitos e `+`; `mailto:`; sem dado, sem link.

- [ ] **Step 1: Write the failing test**

```js
test("bloqueio: fim antes do início volta erro no campo end", ...);
test("bloqueio válido monta o corpo do contrato com reason null quando vazio", ...);
test("contato: telefone vira tel: só com dígitos; sem e-mail, sem link de e-mail", ...);
```

- [ ] **Step 2: Run** `npx jest tests/unit/staff-forms.test.js` — Expected: FAIL.
- [ ] **Step 3: Telas** — Bloquear horário: profissional (o próprio, fixo; todos com o filtro), data, início, fim, motivo; depois de gravar, se `affectedAppointments > 0`, avisa "O bloqueio cobre N atendimentos marcados. Eles continuam na agenda." Cliente: nome, contato rápido (`contactLinks`, abre com `Linking`), "Cliente do clube" quando for, anotação interna, próximos e histórico com aquela loja (paginação por cursor). 403 vira a mensagem do servidor.
- [ ] **Step 4: Run** — Expected: PASS.
- [ ] **Step 5: Verificação padrão e commit** (`feat: bloquear horário e ficha do cliente no app da equipe`)

## Parte F — Fluidez

### Task 8: Transições, toque e "reduzir movimento"

**Files:**
- Create: `src/utils/motion.js`, `tests/unit/motion.test.js`
- Modify: `App.js`, `src/screens/Navigator.js`, `src/staff/StaffNavigator.js`, `src/components/ui/Button.js`, `src/components/ui/Card.js` (quando recebe `onPress`), `src/screens/AppointmentSuccessScreen.js`, `src/screens/RedemptionSuccessScreen.js`

**Interfaces:**
- Produces:
  - `useReduceMotion(): boolean` (`AccessibilityInfo.isReduceMotionEnabled` + evento `reduceMotionChanged`).
  - `stackScreenOptions({ platform, reduceMotion }): object` — `animationEnabled: !reduceMotion` em todas as plataformas (some o `Platform.OS !== 'android'`); Android com `CardStyleInterpolators.forFadeFromBottomAndroid`; web com o esmaecer de hoje; `transitionSpec` de abrir/fechar com 220 ms.
  - `pressFeedback(pressed: boolean, reduceMotion: boolean): object` — `{ opacity: 0.85, transform: [{ scale: 0.98 }] }` pressionado (só `opacity` com `reduceMotion`), `{}` solto.
  - `entranceDuration(reduceMotion: boolean): number` — 220, ou 0.

- [ ] **Step 1: Write the failing test**

```js
test("com reduzir movimento, sem animação de pilha em nenhuma plataforma", ...);
test("Android passa a animar a troca de tela", () =>
  expect(stackScreenOptions({ platform: "android", reduceMotion: false }).animationEnabled).toBe(true));
test("toque: escala e opacidade; com reduzir movimento, só opacidade", ...);
test("entrada das telas de sucesso: 220 ms ou 0", ...);
```

- [ ] **Step 2: Run** `npx jest tests/unit/motion.test.js` — Expected: FAIL.
- [ ] **Step 3: Implementar** — as pilhas usam `stackScreenOptions`; `Button` e `Card` tocáveis passam para `Pressable` com `pressFeedback`; telas de sucesso entram com `Animated` (opacidade e `translateY` de 12 px, `useNativeDriver`) por `entranceDuration`.
- [ ] **Step 4: Run** — Expected: PASS.
- [ ] **Step 5: Verificação padrão e commit** (`feat: transições e resposta ao toque no app, respeitando reduzir movimento`)

### Task 9: Esqueletos, puxar para atualizar e web centrada

**Files:**
- Create: `src/components/ui/ListSkeleton.js`, `src/components/WebFrame.js`, `tests/unit/web-frame.test.js`
- Modify: `src/screens/HistoricoAgendamentosScreen.js`, `src/screens/MeusPedidosScreen.js`, `src/screens/MinhaJornadaScreen.js`, `src/screens/ProductsScreen.js`, `src/screens/agendar/AgendarScreen.js`, `src/staff/screens/{AgendaEquipeScreen,ClienteEquipeScreen}.js`, `src/screens/Navigator.js` (a moldura web sai daqui), `App.js`

**Interfaces:**
- Produces:
  - `ListSkeleton({ rows = 4 })` — usa `Skeleton`, `accessibilityRole="progressbar"`, `accessibilityLabel="Carregando"`.
  - `webFrameStyle(windowWidth: number): object` — até 600 px: largura toda; acima: `maxWidth: 480` nas telas de entrada e `800` nas do app, centradas, com as bordas finas de hoje. `WebFrame({ variant: 'entry' | 'app', children })` aplica só na web.

- [ ] **Step 1: Write the failing test**

```js
test("celular: largura toda; computador: 480 na entrada e 800 no app, centrado", ...);
```

- [ ] **Step 2: Run** `npx jest tests/unit/web-frame.test.js` — Expected: FAIL.
- [ ] **Step 3: Implementar** — listas com dados remotos mostram `ListSkeleton` no primeiro carregamento (não a cada atualização) e `RefreshControl` para puxar e atualizar; todas as pilhas na web passam por `WebFrame` (a entrada também, hoje sem moldura).
- [ ] **Step 4: Run** — Expected: PASS.
- [ ] **Step 5: Verificação padrão e commit** (`feat: esqueletos, puxar para atualizar e web centrada`)
