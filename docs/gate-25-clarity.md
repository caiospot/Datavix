# Gate 25 · Microsoft Clarity (com consentimento e sem ler a planilha)

O código do Clarity (projeto `yun6nstisc`) foi instalado, mas **no formato que preserva a promessa do produto** ("a planilha não sai do seu computador") e a LGPD:

- **Só no site publicado** (`caiospot.github.io`): testes locais, prévia na rede e o HTML exportado nunca carregam. Configuração em `build.mjs` (`DATAVIX_CLARITY_ID`, vazio desliga; `DATAVIX_CLARITY_HOST`).
- **Só depois do aceite.** A página inicial mostra um aviso (Aceitar, Recusar, Saiba mais). Recusar ou ignorar = nada é carregado. O rodapé tem "Análise de uso: ativada/desativada" para mudar a escolha; ao recusar depois de aceitar, o Clarity é parado e os cookies dele apagados.
- **O app não é gravado em texto.** Todas as telas do app (menos a página inicial) e a lista de projetos salvos levam `data-clarity-mask="True"`; o aviso também.
- **CSP** ampliada só para o Clarity (`www.clarity.ms`, `scripts.clarity.ms`, `*.clarity.ms`, `c.bing.com`).
- **Política de privacidade** (PT/EN) reescrita: nova seção "Análise de uso (Microsoft Clarity)" com o que pode e o que não é registrado, cookies, transferência internacional e base legal; resumo, armazenamento local, hospedagem e segurança atualizados; data 8/10/2026.

**Fazer no painel do Clarity:** Settings → Masking → modo **Strict** (segunda camada de proteção).

## Correção encontrada no caminho
O visual das barras dos atos de casos (gate 23) usava a classe `.pv`, a mesma da política de privacidade; as barras agora usam `.vz*`, sem conflito.

## Testes
`test/analytics-check.js` (sem config nada carrega; outro endereço nada carrega; aviso sem carregar; recusar; reabrir; aceitar insere a tag; app e inicial com e sem máscara). `test/privacy.js` (11 seções).
