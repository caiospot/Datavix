# Gate 16 · Apresentação B: reprodução automática, resumo final e celular

Quarto gate do plano "mobile → painel → apresentação → vídeo social".

## O que mudou
- **Reprodução automática:** botão ▶/⏸ na barra de navegação, botão de velocidade (1×, 1,5×, 2×) e, na abertura, os botões "Começar" (manual) e "▶ Reproduzir". O tempo de cada passo vem do tamanho do texto (5 a 11 s, mais tempo quando há cálculo), dividido pela velocidade. O segmento atual da barra de progresso se enche durante o passo.
- **Pausa automática** ao clicar no gráfico (fixar um item) e quando a aba fica em segundo plano. Teclas: **P** (ou K) alterna reprodução, **Espaço** pausa durante a reprodução e avança quando parado, setas navegam, Home volta à abertura, End vai ao último passo.
- **Barra de progresso clicável:** clicar num segmento salta para aquele passo.
- **Cena final "Em resumo":** título, os insights da peça numerados (até 4; sem insight, os dados principais) e os botões "Rever" e "Sair". A reprodução automática termina aqui e para. O contador mostra "FIM".
- **Insight destaca o item citado:** se o gráfico tem um passo para o item da primeira linha do cálculo (por exemplo PED-0015 no Leque), o passo do insight reaproveita esse destaque. Sem passo equivalente, o gráfico fica na visão geral.
- **Celular:**
  - **Deslizar** para a esquerda avança e para a direita volta (não interfere em toques nos botões, no cartão nem no "ver cálculo").
  - Layout em retrato: legenda grande no alto, gráfico no meio, barra de navegação arredondada embaixo (alvos de 44 px), título em uma linha, cálculo recolhido em "ver cálculo +" (toque abre).
  - Celular deitado: duas colunas.
  - **Tela sempre acesa** durante a apresentação (Screen Wake Lock, onde o navegador oferece).
- **Correções:** o contêiner invisível do cartão (`.c2`) cobria a coluna esquerda e bloqueava cliques; o total fixo some na abertura e no resumo.
- Vale igualmente para o **HTML exportado** (offline).

## Onde está
`src/runtime.js` (`startPresentation`, `buildSteps`), `src/piece.css` (blocos "apresentação v2" e "apresentação B"), `src/i18n-charts.js` (`pres_*`).

## Testado (Chrome headless)
- Reprodução automática de ponta a ponta (2×): avança sozinha, chega ao resumo, para; pausa por Espaço, P, botão e clique no gráfico; velocidade; reinício; salto pela barra; setas a partir do último passo e do resumo; limpeza do DOM ao sair.
- Todos os passos de todos os 9 gráficos disponíveis (legenda não vazia, progresso correto).
- Cartão fixado no desktop (aparece, o × recebe o clique, o total reaparece).
- Celular em retrato com toque real: abrir, começar, deslizar para os dois lados, abrir o cálculo, resumo, reproduzir, pausar, sair; celular deitado.
- HTML exportado por `file://` com CSP estrita: abertura, teclado, resumo com os 2 insights, botões de reprodução, sem requisição externa.
- Regressão sem erros: onboarding, privacidade, NPS, PWA offline, 5 histórias × todos os gráficos, 10 arquivos, painel, toque no celular, testes de apresentação por gráfico.
Roteiros: `test/m/pres-auto.js`, `test/m/pres-pin.js`, `test/m/steps-pres2.mjs`, `test/m/steps-calc.mjs`, `test/m/steps-land.mjs`.

## Limites (honestos)
- O destaque do item no insight só existe nos gráficos que têm um passo para o item (Leque, Cordilheira, Rio); nos demais o passo do insight não destaca nada.
- A tela cheia (`requestFullscreen`) não existe no iPhone; a apresentação ocupa a janela inteira, mas a barra do Safari continua visível até o usuário rolar/ocultar.
- O bloqueio de tela depende do navegador (Chrome/Safari recentes, em https ou localhost).
- Safari/iPhone de verdade continua sem teste (sem Simulator nesta máquina).
