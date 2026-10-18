# Datavix

**Tudo vira dado.** Transforme planilhas (.xlsx, .xls, .csv) em dataviz executivo, animado e interativo. Tudo roda no navegador: a planilha nunca sai do seu computador.

Site: https://datavix.app (hospedagem Hostinger). O endereço antigo, https://caiospot.github.io/Datavix/ (GitHub Pages), segue no ar por enquanto.

## Desenvolvimento

```bash
node build.mjs          # gera index.html (arquivo único), dist/ (PWA) e test/dev.html
python3 -m http.server 8770 --directory dist
```

Sem dependências de npm. Bibliotecas embutidas em `vendor/` (Vizzu, PapaParse, SheetJS).

## Publicação

Cada push na `main` roda dois fluxos em `.github/workflows/`:
- `pages.yml`: build e publicação de `dist/` no GitHub Pages (o endereço de hoje).
- `hostinger.yml`: build para a Hostinger (`DATAVIX_HOST=hostinger`, `DATAVIX_SITE=datavix.app`) e atualização da branch `hostinger`, que o Git da Hostinger copia para `public_html`. Passo a passo da migração e decisões: `docs/migracao-hostinger.md`. Conferência local do build (Apache + Chrome): `node test/hostinger-check.mjs`.

NPS opcional: veja `nps/LEIA-ME.md`. Para ligá-lo, crie os secrets `DATAVIX_NPS_URL` e `DATAVIX_NPS_TOKEN` no repositório. Sem eles o app funciona normalmente, sem o NPS.

Documentação das entregas em `docs/`.
