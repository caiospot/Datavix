# Gate 20 · "O que encontrei" e construtor de história (entrega "b")

Segunda das três entregas do plano de storytelling. A entrega (c) fica com o roteiro em cartões (reordenar, apagar e editar frases) e o refinamento visual dos slides novos.

## O fluxo agora
Landing → 3 perguntas (público, decisão, tempo) → planilha → mapeamento → **O que encontrei** → (modo rápido ou guiado) → editor.

## Tela "O que encontrei"
- Lê a planilha já mapeada e mostra os **fatos candidatos** em cartões: etapa (ex.: "O líder"), frase, **número em destaque** e **cálculo** a um toque.
- Os candidatos incluem os insights que o limite do público cortaria e duas análises novas, ambas verificáveis: **quem explica a mudança do período** ("Sudeste explica 55% da alta") e **quem ganhou ou perdeu participação** ("Bebidas ganhou 6,0 p.p."), calculadas comparando a janela inicial com a final.
- O fato mais indicado para a **decisão** escolhida vem pré-selecionado com a etiqueta "Sugerido para a sua decisão" (investir sugere a tendência; alertar, a queda; priorizar, o pico ou o líder).
- Dois caminhos: **Montar rápido** (roteiro com o fato escolhido e as melhores evidências; o número de evidências segue o tempo escolhido) ou **Guiar minha história**.

## Construtor guiado: 7 perguntas, todas opcionais exceto a primeira ter um padrão
1. **Mensagem central:** parte do fato escolhido; 3 sugestões (marcadas como sugestão) ou texto livre. Vira o título da peça.
2. **Dados que embasam:** marcar até 5 evidências; cada uma vira um slide com número e cálculo.
3. **Diagnóstico:** "leituras" possíveis (Liderança forte, Dependência de poucos, Crescimento, Gargalo...), cada uma com o número que a sustenta, mais um campo livre. Aviso fixo: a planilha mostra o quê, não o porquê.
4. **Implicações:** até 3, nas suas palavras, com sugestões por decisão.
5. **Priorização:** escolhe o critério (onde concentrar, o que rever, onde cresce, onde cai, conforme os dados permitem); o app **ordena os grupos com o número ao lado** e a pessoa define quantos entram (1 a 5).
6. **Plano de ação:** até 3 ações com quem, quando e **qual número da planilha acompanha** a ação.
7. **Decisão pedida:** o slide final, com sugestão por decisão.
Cada pergunta tem "Pular", e há contagem do roteiro ("até aqui: 8 slides"). Ao concluir, o app informa os slides e o tempo estimado.

## Roteiro gerado
Panorama → centro → evidências → **diagnóstico** (com os números que o sustentam) → **o que isso significa** → **as prioridades** (ranking numerado, destaca os grupos no gráfico) → **o plano de ação** (cartões com quem, quando e o número que acompanha) → **a decisão**. O resumo final recapitula os últimos atos.

## Onde aparece
- **Apresentação** e **HTML exportado**: os mesmos slides, com layout próprio para cada tipo.
- **Vídeo:** até 5 atos (panorama, centro, diagnóstico, prioridades, decisão), com listas para prioridades e implicações.
- **Salvar e reabrir:** as respostas ficam na peça (`P.sb`); a troca de idioma refaz os textos do app, e o que a pessoa escreveu fica como escreveu.
- **Editar depois:** aba Exportar → "Editar história" (respostas preenchidas) e "Ver o que encontrei".

## Honestidade dos números
O app prova os fatos; o julgamento é da pessoa. Diagnóstico, implicações, plano e pedido são textos dela; as sugestões vêm sempre marcadas ("Sugestões, edite à vontade"); causas nunca são afirmadas. Todo número exibido vem de um cálculo com a fórmula à vista (participação, concentração, razão, contribuição, mudança de participação, crescimento por grupo).

## Onde está
`src/builder.js` (telas e lógica), `src/story.js` (fatos, `storyCandidates`, `storyReadings`, `storyPriority`, `storyMetrics`, `storySuggest`, `storyFromAnswers`), `src/runtime.js` (novos tipos de slide), `src/video.js`, `src/ui.js` (etapas `find` e `story`, painel), `src/piece.js` (`sb` salvo na peça).

## Testado (Chrome headless)
Fluxo completo (descoberta → 7 perguntas → editor → apresentação) em inglês e português; modo rápido; editar pelo painel com respostas preenchidas; salvar e reabrir; troca de idioma; HTML exportado por `file://` com 10 atos e resumo, sem requisição externa; celular com toque real (descoberta, escolha do centro, perguntas, evidências, plano); vídeo com o roteiro guiado; verificação de 36 combinações (9 arquivos × 2 idiomas × 2 decisões) sem texto inválido e com todos os tipos de slide. Regressão completa sem erros.
Roteiros: `test/m/builder-run.js`, `builder-extra.js`, `builder-check.js`, `export-sb.js`, `steps-find.mjs`.
Obs.: a versão de desenvolvimento (`dev.html`) pula a descoberta para manter os testes antigos; use `?find` para ligá-la.

## Limites
- O roteiro ainda não tem edição por cartões (reordenar, apagar, trocar a frase de cada slide): é a entrega (c).
- As sugestões de implicação, ação e decisão são genéricas por decisão (investir, cortar, priorizar, alertar, celebrar); não conhecem o negócio da pessoa.
- "Quem explica a mudança" e "participação" exigem uma matriz grupo × período (gráficos Rio ou Cordilheira); sem ela, esses dois fatos não aparecem.
- Safari/iPhone de verdade continua sem teste.
