# Datavix

**Tudo vira dado.** Transforme planilhas (.xlsx, .xls, .csv) em dataviz executivo, animado e interativo. Tudo roda no navegador: a planilha nunca sai do seu computador.

App: https://caiospot.github.io/Datavix/

## Desenvolvimento

```bash
node build.mjs          # gera index.html (arquivo único), dist/ (PWA) e test/dev.html
python3 -m http.server 8770 --directory dist
```

Sem dependências de npm. Bibliotecas embutidas em `vendor/` (Vizzu, PapaParse, SheetJS).

## Publicação

Cada push na `main` roda `.github/workflows/pages.yml`, que faz o build e publica `dist/` no GitHub Pages.

NPS opcional: veja `nps/LEIA-ME.md`. Para ligá-lo, crie os secrets `DATAVIX_NPS_URL` e `DATAVIX_NPS_TOKEN` no repositório. Sem eles o app funciona normalmente, sem o NPS.

Documentação das entregas em `docs/`.
