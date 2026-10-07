# Gate 15 · Apresentação A: cena de abertura, visual e transições

Terceiro gate do plano "mobile → painel → apresentação → vídeo social". A narrativa em passos mais rica, a reprodução automática e o gesto de deslizar ficam para o gate 4 (Apresentação B).

## O que mudou
- **Cena de abertura:** tela cheia com a linha de fonte, o título grande (na fonte do par escolhido) e o **número principal contando de zero até o valor** (Doto, na cor de destaque da peça), com a descrição do cálculo e o botão "Começar". O gráfico aparece desfocado ao fundo e entra em foco ao avançar. O valor final é sempre o do cálculo; a contagem só interpola a animação.
- **Gráfico como protagonista:** o gráfico ocupa a maior parte da tela. A coluna esquerda deixou de ser o editor em tela cheia (insights e cartão empilhados) e passou a mostrar, por passo, só o essencial.
- **Legenda grande por passo**, separada em título e detalhe (ex.: "Eletrônicos" e "105 itens · 1,1 mi"), com animação de entrada.
- **Passos de insight mostram o cálculo:** o título do cálculo, a fórmula e as linhas, logo abaixo da frase. Isso mantém a regra de que todo insight tem cálculo verificável à vista.
- **Visão geral** (passo 1): os dados principais (linhas, maior e menor categoria, quantidade de categorias etc.) em quatro blocos.
- **Total fixo** embaixo à esquerda (número principal pequeno) como contexto em todos os passos.
- **Barra de progresso** no topo (um segmento por passo), **brilho de fundo** que respira na cor de destaque, contador e botões de navegação mais legíveis, logotipo DATAVIX no canto superior direito.
- **Cartão de detalhes:** clicar num item no gráfico (ou na lista) ainda fixa o cartão; ele sobe sobre a coluna esquerda e some ao fechar. Visão geral e prévia por hover não ocupam mais espaço.
- **Navegação:** setas, espaço, Enter, PageUp/PageDown, Home (volta à abertura), End (último passo) e Esc. Voltar do primeiro passo retorna à abertura.
- **Celular em retrato:** layout simples (título, legenda e gráfico em coluna), com a abertura adaptada. O refinamento por toque (deslizar) fica para o gate 4.
- **Movimento reduzido:** com "reduzir movimento" no sistema, não há contagem, brilho nem animações de entrada.
- Vale também para o **HTML exportado**: a apresentação nova é a mesma, offline.

## Onde está
`src/runtime.js` (`startPresentation`, `presCountUp`, `buildSteps` agora leva `calc` nos insights), `src/piece.css` (bloco "apresentação v2"), `src/i18n-charts.js` (`pres_start`, `pres_keys`).

## Testado (Chrome headless)
Desktop: todos os 9 gráficos disponíveis para os dados de teste (abertura, todos os passos com legenda não vazia, progresso correto, voltar à abertura, sair sem deixar elementos no DOM); capturas de abertura, passo de categoria, passo de insight e visão geral; HTML exportado aberto por `file://` com CSP estrita (abertura em Playfair, número principal, teclado, passo final com cálculo, Esc, nenhuma requisição externa); celular em retrato com toque real (abrir, começar, avançar, sair). Regressão sem erros: onboarding, privacidade, NPS (inclui a pergunta ao sair da apresentação), PWA offline, 5 histórias × todos os gráficos, 10 arquivos, painel, toque no celular. Os testes de apresentação por gráfico (`test/*-pres.js`) passaram a ler a legenda da coluna nova.
Roteiros novos: `test/m/pres-flow.js`, `test/m/pres-step.js`, `test/m/export-pres.js`, `test/m/steps-pres.mjs`.

## Limites (honestos)
- Os passos ainda são os da versão anterior (por categoria, Top N, insights); a história guiada, o destaque do item citado no insight e a reprodução automática vêm no gate 4.
- A tela cheia (`requestFullscreen`) só funciona com gesto do usuário; nos testes automáticos ela é recusada e o layout vale do mesmo jeito.
- O aviso "ResizeObserver loop" do navegador já aparecia antes; é benigno.
- Safari/iPhone de verdade continua sem teste (sem Simulator nesta máquina).
