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
