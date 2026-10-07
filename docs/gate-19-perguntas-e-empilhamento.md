# Gate 19 · Perguntas enxutas e correção do empilhamento (entrega "a" do novo plano de storytelling)

Primeira das três entregas combinadas depois do retorno sobre a apresentação: (a) corrigir o defeito de empilhamento e enxugar as perguntas de antes do upload; (b) tela "O que encontrei" e construtor guiado; (c) slides de diagnóstico, prioridades, plano de ação e decisão, com roteiro em cartões.

## Defeito corrigido: apresentações empilhadas
- **Causa:** o ouvinte de clique do botão "▶ Apresentar" de dentro do gráfico (`#orgpres`) era registrado de novo, no mesmo elemento, **a cada troca de gráfico** (`src/charts.js` e `src/organism.js`) e nunca removido. Depois de N trocas, um clique iniciava N apresentações empilhadas (a imagem mostrava 3). O mesmo valia para o botão "? Como usar".
- **Correção:** um único ouvinte por contêiner (o anterior é removido antes de registrar) e uma trava em `startPresentation`: se já existe uma apresentação ativa na peça, nenhuma outra é criada. O foco também sai do botão que abriu a apresentação.
- **Teste de regressão:** `test/m/steps-dup.mjs` troca de gráfico 4 vezes, clica em Apresentar com o mouse e aperta Espaço e Enter com teclas reais; antes dava 4 cópias, agora 1.

## Perguntas antes do upload: de 6 para 3
| Antes | Agora |
|---|---|
| Público | **Fica** |
| Decisão | **Fica** (define o roteiro e o que entra em tempo curto) |
| Mensagem principal | **Sai.** O título nasce dos dados e a pessoa edita no próprio título. Na entrega (b) a mensagem passa a ser escolhida depois da leitura da planilha. |
| Tipo de história | **Sai.** É inferido pelos dados (com data e medida, "evolução no tempo"; senão, "comparação"); o seletor de tipo de análise continua no mapeamento. |
| Tom visual | **Sai.** Vira "Estilo" (4 presets) na aba Visual do painel. |
| Onde será usada | **Sai.** Vira a chave "Fontes maiores (projetor)" na aba Visual. |
| — | **Novo: quanto tempo você tem?** (2, 5 ou 10+ minutos) |

- **Tempo disponível:** 2 minutos = 3 slides, 5 minutos = até 5, 10+ = história completa. O corte mantém o panorama e os atos que mais pesam para a decisão escolhida (investir prioriza tendência e virada; alertar prioriza queda e ponto fora da curva; priorizar prioriza líder, pico e virada).
- **Título automático** que acompanha o gráfico escolhido (por exemplo, "Valor por Categoria" no Leque, "Receita ao longo do tempo" na Cordilheira, "Fluxo de Valor" no Funil).
- As etapas seguintes foram renumeradas (upload 04, prévia 05, mapeamento 06) e os textos da landing e da tela inicial mudaram para "3 perguntas".
- **A história lê o agrupamento do gráfico escolhido** (categorias no Leque, lojas na Cordilheira, UFs na Árvore, regiões nos Raios), em vez de só o eixo do mapeamento. Assim, inferir "tempo" não faz a história perder o ranking por grupo.

## Onde está
`src/ui.js` (`OB`, `autoTitle`, ações `tone` e `big`, painel), `src/data.js` (`inferStory`), `src/story.js` (`storyGroups`, `storyCut`), `src/runtime.js` (trava e corte por tempo), `src/charts.js` e `src/organism.js` (ouvinte único), `src/i18n-charts.js`, `src/landing.js`, `src/piece.js` (`big` no `applyPieceCss`).

## Testado (Chrome headless)
Onboarding de 3 passos (PT), etapas renumeradas, inferência do tipo, título automático, estilo padrão; corte por tempo e por decisão; estilo e fontes maiores aplicados e desfeitos com Desfazer; reprodução do empilhamento antes e depois da correção; histórias de 9 arquivos em PT e EN sem texto inválido; regressão completa (privacidade, NPS, PWA offline, 5 histórias × todos os gráficos, 10 arquivos, apresentação em todos os gráficos, painel, celular com toque, janela do vídeo).

## Limites
- O estilo padrão agora é o "sóbrio corporativo" (claro). Mudar para outro é um clique na aba Visual; se preferir que o padrão seja o escuro, é uma linha.
- A mensagem principal ainda é só o título sugerido; a escolha guiada dela é a entrega (b).
- Safari/iPhone de verdade continua sem teste.
