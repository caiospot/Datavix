# Gate 37: correções da apresentação e do onboarding

1. **Voltar da tela "Suba a planilha"**: apontava para a pergunta 6 (de quando eram 6 perguntas) e quebrava; agora volta à última pergunta (`back-to`, ui.js).
2. **Textos editáveis na apresentação** (`runtime.js`): rótulo do slide, frase, linhas das listas, nota e o título do tema (abertura e fim) são editáveis na própria apresentação (clique e escreva; Enter ou sair do campo guarda; Esc sai do campo). O que a pessoa escreve fica em `P.sedits[id]`, entra no projeto salvo, no HTML exportado e no vídeo (`nvApplyEdits`, storyplan.js), e volta ao reabrir o slide. As teclas da apresentação ficam desligadas enquanto escreve. Ao fechar a apresentação aparece "Salvar este projeto?" (Salvar / Não salvar) se há algo não salvo (`askSaveAfterPresenting`; no build de teste só com `?asksave`).
3. **Cartão em cartões menores** (`cardcol.js`): o cartão de detalhes agora é uma grade de cartões de até 4 campos (e até 2 textos longos), com contador "DADOS 1/5". Vale no editor, na apresentação e no HTML exportado.
4. **Gráfico de barras dos atos (casos e pesquisas) maior** na apresentação: barras mais altas, texto até 32 px, rótulo curto em vez de truncado.
5. **Seleção por clique na apresentação**: o cartão só aparece com o clique (o passar do mouse não cobre mais o texto); até 2 pontos escolhidos viram um comparativo (A e B lado a lado, campos em comum em cartões de até 4 linhas); o terceiro clique troca o mais antigo, clicar no mesmo tira, × ou Esc fecham tudo, e **trocar de slide limpa a seleção** (vale só para o slide em que foi clicada). O destaque no gráfico acompanha o último ponto escolhido.
6. **"Pular" nas perguntas** (ui.js): cada pergunta tem "Pular"; todas puladas levam direto ao upload. Quem pulou as 4 perguntas ganha, ao apresentar, a apresentação com números e gráficos mas com os textos em branco, só com o placeholder "Digite aqui seu conteúdo" (`nvIsBlank`, `nvBlankSlides`); ao sair, o aviso de salvar.

## Testes
`test/m/onboarding-skip.js` (pular, voltar, upload com tudo nulo), `test/m/pres-edit.js` (edição, persistência entre slides, modo em branco com `#blank`), `test/m/pres-select.js` (1, 2 e 3 cliques, grupos de até 4 campos, limpeza ao trocar de slide), `test/m/pres-save.js` (`?asksave`). Regressão: `plan-run`, `pres-flow`, `pres.js`, `card-all` e HTML exportado em `file://`.

## Decisão a confirmar
O item "apresentação em branco" foi aplicado a quem **pulou as quatro perguntas**. Se for melhor valer para quem pulou qualquer uma, é uma linha em `nvIsBlank`.
