# Datavix
Dataviz platform

Plataforma de visualização de dados que roda 100% no navegador: carregue um CSV (ou use os dados de exemplo), escolha categoria, métrica e agregação, e explore gráficos de barras, linha e rosca com tooltips, KPIs e tabela.

## Estrutura
- `Product/` — aplicação estática (HTML/CSS/JS, sem build nem dependências)
- `.github/workflows/deploy.yml` — publica `Product/` no GitHub Pages a cada push em `main`

## Rodar localmente
```sh
cd Product && python3 -m http.server 8000
```

## Deploy
Em *Settings → Pages*, defina **Source: GitHub Actions**. Depois do merge em `main`, o workflow publica o site em `https://<usuario>.github.io/<repo>/`.
