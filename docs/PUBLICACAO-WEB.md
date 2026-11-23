# Publicar a versão web na Hostinger

O app web é um site estático: `npm run build:web` gera `dist/web/` e `dist/agendaflui-web.zip`. O `.htaccess` (em `public/`, copiado pelo export) manda `/<loja>` e `/<loja>/pedidos/<id>` para o `index.html`, força HTTPS e põe cache longo nos arquivos com hash.

Endereço usado abaixo: `https://app.agendaflui.com.br`. Para outro, troque em todos os passos.

## 1. Chave do app (painel dev)

1. Em `https://dev.agendaflui.com.br` → Chaves e API → nova chave **de plataforma**.
2. Nome: `App web`. Origens permitidas: `https://app.agendaflui.com.br` (sem barra no fim).
   A mesma origem libera o CORS e a volta do pagamento do Mercado Pago (`returnUrl`).
3. Copie a chave mostrada (ela aparece uma vez só).

## 2. Gerar o zip

```bash
cp .env.example .env    # cole a chave em EXPO_PUBLIC_APP_KEY=
npm run build:web
```

Sem a chave o script para. A chave fica dentro do JavaScript do site (é um identificador, não um segredo); a proteção é a lista de origens.

## 3. Subdomínio na Hostinger (hPanel)

1. Sites → o site do domínio → Domínios → Subdomínios → criar `app`. A pasta sugerida é `public_html/app`.
2. O DNS do `agendaflui.com.br` já está na Hostinger: o hPanel cria o registro do subdomínio sozinho. Se existir um registro `A` antigo para `app` (Zona DNS), apague-o antes.
3. Segurança → SSL: confirme o certificado de `app.agendaflui.com.br` (pode levar alguns minutos).

## 4. Enviar os arquivos

Gerenciador de arquivos do hPanel:

1. Abra a pasta do subdomínio (`public_html/app`) e apague o que houver nela (ex.: `default.php`).
2. Enviar → `dist/agendaflui-web.zip` → clique com o botão direito → Extrair para a pasta atual.
3. Confira que `index.html`, `.htaccess`, `_expo/` e `assets/` estão direto na pasta (não dentro de outra pasta). Apague o zip.

Por FTP: envie o **conteúdo** de `dist/web/` (com o `.htaccess`, que é oculto) para a mesma pasta.

## 5. Conferir

- `https://app.agendaflui.com.br/<código-da-loja>` abre a loja e o login funciona.
- Recarregar a página numa tela interna não dá 404.
- Uma compra de teste volta para `/<loja>/pedidos/<id>` depois do Mercado Pago.

Erro de rede logo ao abrir: origem errada na chave (confira `https`, sem `www` e sem barra).

## Nova versão

`npm run build:web` e repetir o passo 4. Os arquivos antigos de `_expo/` podem ser apagados.
