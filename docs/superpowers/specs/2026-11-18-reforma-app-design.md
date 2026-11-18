# Reforma do app: marca Agenda Flui e API v1

## Intenção

O app de cliente da Sans vira o app de cliente do AgendaFlui. As mesmas telas e o mesmo fluxo de hoje (agendar, histórico, perfil, loja, prêmios, vouchers), com a marca Agenda Flui e falando com a API v1 do AgendaFlui (`https://api.agendaflui.com.br`). Cada cliente pertence à loja (conta) pela qual entrou, pelo link dela.

Decisão do dono (2026-11-18): "apenas refaça o branding do app já existente da Sans para a AgendaFlui. Não mude a estrutura de agendamento nem nada, cada login de cliente é associado à loja que ele entrou pelo link". Entre (1) só marca no servidor antigo e (2) marca + ligação na API nova com as mesmas telas, o dono escolheu **(2)**.

## Metas

- Mesma estrutura de navegação e de telas (abas, pilhas, ordem dos passos do agendamento, histórico, perfil, loja, prêmios, vouchers). Telas grandes podem ser divididas por dentro, sem mudar o que a pessoa vê nem a ordem.
- Visual da marca Agenda Flui (`../branding/AgendaFlui-Marca/`, tokens em `design-tokens/agenda-flui-tokens.json`; referência de tela na landing `../site/`): Água `#0B6E66`, Caramelo `#F2A93B` (nunca cor de texto), Tinta `#0F2A27`, Bolha `#D7EFEB`, Espuma `#F3F8F6`; Bricolage Grotesque (títulos) + Figtree (texto); cantos 10/16/28/pílula; cartões com borda fina sem sombra; Lucide ou ícones de traço equivalentes; voz curta, verbo na frente, "você".
- Termos da conta, não termos fixos: o nome dos pontos, do clube, do profissional e do cliente vêm de `GET /v1/business` (nunca "Sans Coins", "Barber", "barbeiro", "Sans Club"). Nome e logo da loja aparecem no topo; a marca Agenda Flui fica na entrada genérica e no "feito com Agenda Flui".
- Toda requisição pela API v1, com o contrato de `https://api.agendaflui.com.br/v1/openapi.json` (no repositório do painel: `src/server/api/routes-manifest.ts` e o OpenAPI gerado).

## Loja pelo link (como o app sabe a conta)

- O app é um só, compartilhado, com **chave de plataforma** (`X-App-Key`) e a conta no cabeçalho `X-Business` (o `slug`), como a spec §9.2 prevê. A chave vem da configuração do build (EAS/variável), nunca escrita no código.
- Entradas: link `agendaflui://loja/<slug>` (esquema novo no `app.json`) e, na versão web, o caminho `/<slug>`. Sem link, a primeira tela pede o código da loja (o `slug`) e confere em `GET /v1/businesses/{slug}`.
- Conferir o código da loja: não existe `GET /v1/businesses/{slug}`; o app chama `GET /v1/business` com `X-Business: <slug>` e trata 404 como "Não achamos essa loja. Confira o código.".
- A chave de plataforma vai dentro do app (em qualquer app, mesmo nativo, ela pode ser extraída): é um identificador, não um segredo. A proteção é a da API: origens web permitidas na chave (CORS) e limites por chave e IP. Uma chave só para nativo e web, com as origens do app web cadastradas nela.
- A conta escolhida fica guardada no aparelho. Login, cadastro, tokens e dados são daquela conta. Trocar de loja = sair e entrar pelo link/código de outra (com confirmação); os tokens da loja anterior são apagados.
- Links universais (`https://…` abrindo o app instalado) ficam fora: exigem arquivos de associação no domínio e os ids publicados do app.

## Sessão

- `POST /v1/auth/customer/*` (login, cadastro com verificação, redefinição de senha) com token de acesso curto e token de renovação rotativo. Tokens no `expo-secure-store` (na web, onde não há SecureStore, no armazenamento do navegador, com a limitação registrada). Renovação automática uma vez em 401, fila única de renovação (duas requisições não renovam ao mesmo tempo), e saída limpa quando a renovação falha.
- Push: registrar e apagar o aparelho por `/v1/me/devices` (no logout também).
- Excluir conta: `POST /v1/me/delete` com a senha (substitui o fluxo por código).

## Não-metas

- App da equipe (rotas `/v1/staff/*`): fica para depois.
- Mudar o fluxo, a ordem ou a estrutura das telas; criar telas novas além de "código da loja" e o que a API nova exija sem equivalente (ex.: confirmar troca de loja).
- Migrar para TypeScript ou para expo-router; trocar a biblioteca de navegação.
- Links universais, publicação nas lojas, modo escuro novo (o claro/escuro existente pode ficar se não atrapalhar; o padrão é o claro da marca).

## Anti-metas (fracasso mesmo funcionando)

- Sobrar "Sans", "Sans Coins", "Barber", "barbeiro", "sejasans", roxo `#6200EA` ou o logo antigo em qualquer tela, texto, asset ou configuração.
- Cliente de uma loja ver ou mexer em dado de outra; token guardado sem proteção no celular; chave da API ou do YouTube dentro do código.
- Uma tela do fluxo de hoje deixar de existir ou mudar de lugar.

## Restrições e decisões de quem escreveu (para o dono conferir)

- Nome "Agenda Flui", slug e identificador novos (`com.agendaflui.app`), versão 2.0.0. Consequência: nas lojas de aplicativos é um app novo, não uma atualização do app da Sans.
- Código continua em JavaScript, Expo SDK 54, react-navigation, axios. Um módulo único de cliente da API (`src/api/`) concentra base URL, cabeçalhos, renovação e erros (`{ error: { code, message, details } }` do contrato v1).
- Saem: `CoffeeScreen`, `PlayScreen`, `EpisodiosScreen`, `ShopScreen` órfãs, `data/mockData.js`, a integração com YouTube (`src/api/youtube.js` e a chave: o dono deve revogar a chave no Google), `/search` e `/app/settings/public` (sem equivalente).
- Prêmios: a v1 resgata pela lista (`/v1/loyalty/prizes` → `POST /v1/loyalty/redemptions`), o resgate nasce pendente e a equipe entrega no balcão pelo painel. O leitor de QR (`PrizeScannerScreen`) sai; o botão "Resgatar" fica na lista de prêmios e leva à mesma tela de sucesso de hoje, que passa a dizer "Mostre esta tela no balcão" com o resgate pendente. Cancelar resgate pendente pela rota `/cancel`.
- Foto de perfil: a v1 não guarda foto do cliente. O avatar mostra as iniciais (componente `Avatar` existente) e o botão de trocar foto sai.
- Ação sem equivalente na v1 (por exemplo, "tentar pagar de novo" quando não houver rota): o botão some, sem botão desativado nem erro. Pagar de novo um pedido aguardando pagamento é abrir o checkout outra vez, se a rota permitir.
- Ordem do agendamento: fica a ordem de hoje. Se a v1 pedir um dado em outra ordem (por exemplo, serviços antes do profissional para calcular a disponibilidade), o executor adapta por dentro da tela, sem trocar a ordem dos passos que a pessoa vê.
- EAS e ids: o executor só deixa `app.json` e `eas.json` prontos (nome, slug, ids, esquema, `projectId` vazio e variável para a chave). Criar o projeto EAS, os ids nas lojas e publicar é do dono.
- Loja: carrinho, endereço, frete e pedido nas rotas `/v1/store/*` e `/v1/me/addresses`; pagamento abre o checkout do Mercado Pago (`startCheckout` devolve a URL) e volta ao app por `agendaflui://`; `Idempotency-Key` em toda criação de pedido e resgate.
- Módulo desligado na conta (`404 module_disabled`): a aba/entrada correspondente some, sem erro na tela.
- Testes: o app hoje não tem nenhum. Entra Jest (preset do Expo) só para o cliente da API, a sessão (renovação e fila), a escolha da loja pelo link e os mapeamentos de dados; telas sem teste automático. Verificação: testes, `npx expo export` para web e Android sem erro, e varredura de termos antigos vazia.
- Sem navegador nem simulador nos agentes (o dono testa).

## O que fica para o executor

Divisão interna de `BarberScreen` e `PerfilScreen`; mapeamento campo a campo entre as telas e o contrato v1; ícones; textos de erro e vazio na voz da marca; como mostrar a loja atual no perfil.
