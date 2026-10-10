# Gate 31: caminho curto (4 perguntas → planilha → "Aguarde, estou entendendo a sua planilha" → editor)

Pedido: facilitar o onboarding ao máximo, sem inventar tela nova. Mudanças mínimas sobre o que já existia:
- Depois do upload, a prévia, a leitura, o mapeamento e o "o que encontrei" deixam de ser paradas. A leitura (`understandSheet`) já dá uma confiança (`alta`/`média`/`baixa`): com `alta` ou `média` o app aplica as unificações sugeridas, monta o mapeamento padrão e vai direto para a geração; só com `baixa` abre a tela "Como li a sua planilha" para confirmar.
- Tela de carregamento (a mesma da geração): "Aguarde, estou entendendo a sua planilha" com as etapas "Lendo as colunas", "Entendendo os dados", "Montando os gráficos"; texto quebra em duas linhas no celular.
- A geração abre direto no editor, com o gráfico sugerido e a lista de recomendados. "O que encontrei" e o roteiro continuam acessíveis pelo painel (aba Exportar, bloco da história). A apresentação usa a história automática (`buildStory`).
- Build de teste (`test/dev.html`) mantém a prévia para os testes antigos; `?auto` liga o caminho curto. Teste novo: `test/auto-run.js` (`?auto&sheets=...`).
