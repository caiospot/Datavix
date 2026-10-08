# Gate 23 · Roteiro em três perguntas, cartões e gráfico certo por slide (entrega 3)

Fecha o plano "qualquer planilha". O construtor guiado agora é curto, mostra o efeito das respostas dadas antes de subir a planilha e deixa a pessoa mexer no roteiro como em cartões.

## Em "O que encontrei"
- **Guiar em 3 perguntas** (principal), **Montar rápido** e **Modo detalhado (7 perguntas)**, que continua igual ao gate 20 (diagnóstico, implicações, prioridades e plano).

## As 3 perguntas (tela "Roteiro")
1. **Qual é a tese?** O ponto central escolhido vira a abertura da história. A pessoa escreve a frase dela; em branco, vale a frase calculada (com número e cálculo). "Trocar o ponto central" lista os 6 fatos mais indicados.
2. **Como vamos contar?** O roteiro já vem montado: o ponto central e as evidências que mais pesam para a decisão, na ordem em que a história se conta, no tamanho do tempo escolhido. Cada **cartão** mostra a etapa, a frase, o número em destaque e que visual vai aparecer (barras, destaque no gráfico, número e cálculo). Dá para **subir, descer, remover, reescrever a frase** (com "voltar à frase original") e **adicionar de volta** o que saiu. Uma linha mostra o **efeito das respostas dadas antes de subir a planilha**: "Pelo que você respondeu (Diretoria · priorizar · 5 minutos), montei 6 slides, cerca de 5 min…". O número em destaque e o cálculo nunca mudam com a edição da frase.
3. **O que você quer que decidam?** O pedido final, com sugestão. "Detalhar diagnóstico, prioridades e plano de ação" abre o modo detalhado mantendo o roteiro.

## Slide-tese
O primeiro cartão vira o slide **"A tese"**: a frase da pessoa (ou a calculada), o número do ponto central, o cálculo e **até 3 números das evidências** que sustentam a tese.

## Gráfico certo por slide (casos e pesquisas)
Taxa, impacto, onde varia, causas e termos ganham **visual próprio** no lugar do gráfico geral: barras animadas com a taxa ou a contagem de cada grupo e os totais (n de N), linha de referência com a taxa geral (onde varia) e a nota do que está sendo medido. Funciona na apresentação, no HTML exportado e no **vídeo** (as mesmas barras desenhadas no quadro).

## Outras mudanças
- Planilha **sem nenhum número para somar** é lida como "casos" (conta linhas) em vez de ficar sem mapeamento.
- `P.sb` ganhou `script`, `edits` e `thesis` (salvos no projeto e no HTML exportado); roteiros do modo detalhado seguem funcionando.
- Vídeo: textos longos de cálculo são cortados com reticências antes do valor.

## Testes
`test/m/script-run.js` (planilha sintética, rodar com `?find`): fluxo completo das 3 perguntas, reordenar, remover, voltar ao roteiro, editar frase, tese, pedido e visuais. Regressão dos testes anteriores e verificação visual em desktop e celular.

## Limites
- Os visuais próprios cobrem os atos de casos; nos demais atos continua o destaque no gráfico da peça.
- Não testado em Safari/iPhone real nem o envio do MP4 às redes.
