# Gate 40 — Landing nova, portão 1: hero com o quadro da ferramenta

**Cadastro lembrado:** depois do primeiro cadastro (e-mail guardado em `localStorage` `dv-signup`), o hero e a chamada final mostram só o botão "Começar agora" no lugar do campo com "Começar de graça". O botão abre as perguntas e recria a sessão com o e-mail lembrado.

**Hero (inspirado na composição do Linear, com o Design System do Datavix intacto: Geist/Doto, lime #d4ff00, textos atuais):**
- título à esquerda, texto + cadastro + chips à direita; abaixo, o **quadro da ferramenta** (borda fina de 1px, raio 12px, sem sombra externa) sobre um brilho suave.
- o quadro é HTML real (nítido, PT/EN): barra com "Não salvo / Salvar projeto" (neutro, para o cadastro seguir sendo o único botão lime), painel esquerdo (título, insight com "ver cálculo", período, categorias, receita por ano, receita por UF), coluna central (cartão "Visão geral" + lista) e o palco com a **Árvore radial viva** (mesmo `OrgEngine` do produto).
- **todos os números são calculados dos mesmos dados fictícios da árvore** (`lpStats`): registros, UFs, categorias, maior UF, insight de participação, totais por ano e por UF.
- interações: passar o mouse numa bolha ou numa linha da lista mostra o registro no cartão; os chips de categoria ligam/desligam cores no gráfico; a cada 3,2 s o ano em foco muda (a marca do período, o ponto do gráfico de linha e o cartão acompanham).
- a árvore só nasce quando o quadro aparece (cresce na vista) e pausa fora dela; movimento reduzido mostra o quadro estático.
- o hero fixo preso à rolagem e a árvore atrás do título saíram. Mobile: cartão + palco; painel esquerdo e lista escondidos.

**Testes:** `test/m/lp-frame.js` (quadro, canvas desenhado, detalhe ao passar o mouse, chip, foco mudando, sem estouro lateral, cadastro lembrado), `test/m/lp-mail.js` e `test/m/logout-run.js` seguem passando; `test/onboarding.js` agora parte do cadastro lembrado.

**Próximos portões:** 2 recomposição das demais seções (linhas alternadas, sem grade de 3 cartões, sem mudar textos); 3 mesmo quadro trocando de gráfico (Rio, Raios, Cordilheira).

## Portão 2 — demais seções recompostas (sem mudar nenhum texto)
- **Hero:** título, texto e cadastro voltaram a ficar **centralizados**, como antes; o quadro da ferramenta segue logo abaixo.
- **Como funciona:** os 4 passos viram **linhas que alternam texto e imagem** (esquerda/direita), separadas por linha fina; a imagem mostra a captura inteira, sem cortes de proporção.
- **Gráficos, Diferenciais e Públicos:** cabeçalho à esquerda (fixo ao rolar no desktop) e **lista em linhas** à direita, com bordas finas; fim das grades de 3 colunas. A etiqueta "Disponível" ficou neutra com um ponto lime, para o lime seguir só nas ações.
- **FAQ, chamada final e rodapé:** iguais. 96px de respiro entre seções. Mobile: uma coluna.
- Verificado em 1440 e 390 px, nos temas escuro e claro; sem estouro lateral; `lp-frame` e `lp-mail` seguem passando.

## Portão 3 — o quadro troca de gráfico (mesma planilha)
- Abas no topo do palco: **Árvore radial, Raios radiais, Rio vertical, Cordilheira isométrica**. Clicar troca o gráfico; sem clique, o gráfico muda sozinho a cada ~10 s (para quando a pessoa escolhe uma aba). A legenda abaixo do quadro acompanha ("Rio vertical com dados fictícios. Passe o mouse.").
- Os 4 gráficos usam os **construtores reais do produto** (`raysBuild`, `riverBuild`, `ridgeBuild`) sobre uma planilha sintética montada dos mesmos registros fictícios (`lpDs`: Ano, UF, Categoria, Receita, Data); nada é desenhado à mão.
- Os chips de categoria refazem o gráfico atual (na árvore, só ligam/desligam as cores); passar o mouse destaca no gráfico (na árvore também no cartão e na lista).
- Teste: `test/m/lp-charts.js` (abas, pixels desenhados em cada gráfico, chip, mouse, sem estouro lateral).

## Ajustes pós-portão 3 (pedido do usuário)
- **Como funciona virou carrossel** (inspirado no carrossel de extensões do Raycast): título agora "Quatro passos e a sua planilha" (EN: "Four steps and your spreadsheet"); 4 cartões com pedaços reais do produto, seguindo o texto de cada passo — 1) a pergunta "Para quem é a apresentação?" com as opções da ferramenta; 2) área de soltar a planilha, arquivo lido e colunas reconhecidas (nomes e contagem vêm dos dados fictícios); 3) a Árvore radial viva com o cartão de insight e "ver cálculo" (só roda quando o cartão aparece); 4) painel Exportar com paletas, Apresentar, HTML, PNG e ZIP. Pílulas 01–04, botões anterior/próximo, contador, teclado (← →) e rolagem por toque; o cartão seguinte aparece pela borda.
- **Para quem:** as mesmas 3 informações dentro de cartões, cada um com um pedaço do produto (tabela → barras; insight com cálculo; arquivos por cliente com paletas).
- **Hero:** halo claro e desfocado (lavanda, com toques de lime e azul) por trás do quadro da ferramenta, que some suavemente embaixo.
- Testes: `test/m/lp-how.js` (carrossel e cartões), além dos de hero, cadastro, gráficos e Sair.

## Gráficos em cartões e novos ícones
- **Seção Gráficos** agora segue o carrossel do "Como funciona" (mesmos cartões, pílulas 01–06, botões, contador e teclado): cada cartão tem ícone, nome, etiqueta "Disponível" (neutra, com ponto lime), o texto original e, embaixo, a **ilustração grande do gráfico** sobre um brilho na cor do cartão. A lista de "Também" continua abaixo, com os ícones novos. Carrossel agora é genérico (`.lp-how`), um código para as duas seções.
- **Ícones refeitos** (`src/icons.js`, 30 gráficos, ferramenta e site): mesma grade 48×32, formas preenchidas em camadas de opacidade da cor do texto e **um elemento de destaque** em lime (oliva no tema claro) por gráfico — a fatia, a barra, o raio ou a série principal. Árvore e Rio redesenhados com curvas suaves; Funil e Cordilheira reconstruídos; pizzas, roscas e mapas ganharam fatias separadas e contornos. Variável `--ia` controla o destaque.

## Correções (11/out)
- **Como funciona:** cartões 29% mais largos (380 → 490 px), título "Quatro passos até o Storytelling" (EN: "Four steps to Storytelling"), textos de cada passo reescritos para caber em 2 linhas (e limitados a 2 por CSS), sem as pílulas numéricas do topo. O cartão "Veja a animação" mostra agora os **Raios radiais** (motor real) numa caixa 25% menor, com o insight compacto em cima.
- **Gráficos:** no lugar dos ícones, **os gráficos reais da ferramenta animados** nos 6 cartões (Árvore radial, Raios, Rio, Leque, Cordilheira e Funil), com os mesmos dados fictícios; só rodam enquanto o cartão aparece e reagem ao mouse. Sem as pílulas numéricas.
- **Cadastro não chega à planilha:** no localhost o app grava no servidor de teste (`test/out/nps.jsonl`) e o `index.html` sem variáveis fica com o NPS desligado; só o build com `DATAVIX_NPS_URL`/`DATAVIX_NPS_TOKEN` fala com o Google, e o `Code.gs` novo precisa estar implantado. Novos: `.env.local` lido pelo `build.mjs` (fora do git) e `node nps/testar-cadastro.mjs [email]`, que testa o Apps Script de verdade e diz o que respondeu. Ver `nps/LEIA-ME.md`.
