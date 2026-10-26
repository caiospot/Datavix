# Datavix

**Tudo vira dado.** Transforme planilhas (.xlsx, .xls, .csv) em dataviz executivo, animado e interativo. Tudo roda no navegador: a planilha nunca sai do seu computador.

Site: https://datavix.app (hospedagem Hostinger): landing e páginas de conteúdo em português (`/`) e inglês (`/en/`); o app fica em `/app/`. O endereço antigo, https://caiospot.github.io/Datavix/ (GitHub Pages), vira só uma página de aviso que leva para o site novo.

## Desenvolvimento

```bash
node build.mjs          # gera index.html (o app, arquivo único), test/dev.html e dist/ (o site completo)
node test/serve-dist.mjs dist 8780   # olha o site montado em http://127.0.0.1:8780/
```

Sem dependências de npm. Bibliotecas embutidas em `vendor/` (Vizzu, PapaParse, SheetJS).

Estrutura do `dist/`: `/` e `/en/` (landing), páginas de conteúdo, `/app/` (o app, noindex, com service worker, manifesto e ícones próprios), `robots.txt`, `sitemap.xml`, `llms.txt`. O código do site está em `site/` (gerador, CSS, textos em `content-pt.mjs` e `content-en.mjs`). SEO: `docs/seo.md`.

## Publicação

Cada push na `main` roda dois fluxos em `.github/workflows/`:
- `hostinger.yml`: build para a Hostinger (`DATAVIX_HOST=hostinger`, `DATAVIX_SITE=datavix.app`) e atualização da branch `hostinger`, que o Git da Hostinger copia para `public_html`. Passo a passo da migração e decisões: `docs/migracao-hostinger.md`.
- `pages.yml`: GitHub Pages, só com a página de aviso do endereço antigo (`DATAVIX_LEGACY=1`).

Conferências (rodar antes de publicar): `node test/seo-check.mjs` (SEO do site montado), `node test/seo-render.mjs` (layout, imagens e fontes no Chrome), `node test/hostinger-check.mjs` (Apache local + Chrome), `node test/migration-sw.mjs` (quem tinha o app na raiz passa para `/app/`), `node test/pwa-update.mjs` (instalação e atualização do app). Depois de publicar: `node test/hostinger-check.mjs --url=https://datavix.app`.

NPS opcional: veja `nps/LEIA-ME.md`. Para ligá-lo, crie os secrets `DATAVIX_NPS_URL` e `DATAVIX_NPS_TOKEN` no repositório. Sem eles o app funciona normalmente, sem o NPS.

Documentação das entregas em `docs/`.
