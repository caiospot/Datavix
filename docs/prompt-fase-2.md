# Datavix, Fase 2: prompt de execução

## Contexto
Datavix ("Tudo vira dado.") transforma planilhas (.xlsx/.xls/.csv, lidas 100% no navegador) em dataviz executivo animado e interativo. Hoje: login simulado, onboarding de 6 perguntas, upload, mapeamento, geração animada, editor com painel lateral, exportação (HTML autocontido offline, PNG, ZIP de PNGs). Gráfico principal atual: Árvore radial (referência: projetos.ilumeo.com.br). Arquivo único (`node build.mjs` gera `index.html`), CSP estrita, zero requisições externas. Identidade: Geist, Geist Mono, Doto, lime #d4ff00, fundos #eef0eb/#0b0d0a, cantos de 8 px, botões pílula, títulos em caixa alta regular com uma palavra em negrito. PT/EN.

## Regras que não mudam
- Os números vêm sempre da planilha (sem editar células); insights só de cálculo verificável ("ver cálculo").
- Nada sai do navegador. Sem bibliotecas externas além das já embutidas (Vizzu, PapaParse, SheetJS).
- Cada entrega passa por teste no Chrome headless (inclusive `file://` com CSP) antes de ser reportada.
- Entrega em gates; o usuário valida cada gate.

## Decisões do usuário
1. Modal de Novo projeto: Salvar projeto / Não salvar / Cancelar. Botão Sair do menu: Salvar projeto / Não salvar.
2. Salvar só quando o usuário pedir (sem autosave); recentes = projetos salvos.
3. Editar mapeamento não edita valores de células.
4. Painel do editor recolhível; abaixo de 1280 px o cartão sobe para cima do gráfico.
5. As 3 colunas valem para todos os gráficos.
6. A sugestão de gráfico segue o formato dos dados.

---
## FASE A: estrutura e experiência

### A1. Loading
Tela inline no início do HTML (antes dos ~2,6 MB de scripts), removida quando fontes + motor estão prontos (mínimo ~600 ms para não piscar). Visual: fundo da UI, marca DATAVIX, mini-organismo de pontos lima que cresce da raiz para fora, linha "TUDO VIRA **DADO**" e etapas reais (fontes, motor, pronto). Também no HTML exportado (nome da peça). `prefers-reduced-motion`: estático.

### A2. Layout em 3 colunas (todos os gráficos)
- Coluna 1: título, fonte, insights com "ver cálculo", período, filtros do gráfico (no organismo: intervalo, legenda por categoria, mini-gráfico, ranking). Tudo empilhado, sem scroll horizontal (`overflow-x: hidden`, `min-width: 0`; reproduzir a causa antes de corrigir).
- Coluna 2: cartão fixo. Vazio = visão geral do gráfico; hover = prévia (textos cortados); clique = fixa, texto completo, × / Esc fecha. Dados curtos à esquerda, textos longos ao lado.
- Coluna 3: o gráfico (e a nota de rodapé).
- Larguras: 300 / 360 / resto. Peça < 1060 px: cartão acima do gráfico. < 720 px: tudo empilhado, cartão ancorado.
- Painel do editor recolhível (lembra a escolha).
- Gráficos Vizzu, calendário e KPI alimentam o cartão por hover/clique com o que sabem (valores agregados).
- Apresentação: tela cheia com título + gráfico + legenda da etapa (sem colunas).

### A3. Navegação e salvamento
- Logo DATAVIX volta à home (landing).
- Botão Sair no menu (encerra a sessão simulada e volta à landing).
- Estado "alterações não salvas". Ao tentar sair do projeto com alterações (logo, Novo projeto, Sair, fechar a aba): modal.
  - Novo projeto: Salvar projeto / Não salvar / Cancelar.
  - Sair: Salvar projeto / Não salvar.
  - Salvar pergunta o nome e grava no IndexedDB (só dados agregados da peça). Sem autosave.

### A4. Editar mapeamento (modal)
Modal com: mapeamento do gráfico atual (campos do gráfico + colunas do cartão), prévia dos dados (primeiras linhas, tipo da coluna, renomear, trocar tipo, excluir coluna), botão "Subir outra planilha". Ao aplicar, a peça é refeita mantendo paleta, fundo, fontes e título; desfazer disponível. Projetos abertos dos recentes (sem a planilha) pedem a planilha de novo.

### A5. Landing
Seções: hero (árvore radial ao vivo com dados sintéticos + CTA), como funciona (upload → mapeia → anima → exporta), galeria dos gráficos (placeholders de imagem marcados com o que entra), diferenciais (100% no navegador, HTML offline, insights com cálculo, animação orquestrada, contraste AA, PT/EN), casos de uso para analistas de dados, FAQ de privacidade, CTA final. Visual moderno e limpo na identidade Datavix; claro/escuro. Entrar = login simulado existente.

---
## FASE B: 5 novos gráficos (mesmo padrão da Árvore radial)
Arquitetura primeiro: separar a "casca" (3 colunas, cartão, filtros, tutorial, apresentação, exportação, mapeamento) do "motor" de cada gráfico, que implementa `suggest(cols)`, `build(ds, mapping)`, `layout/step/draw/pick`, `getState/setState`, `cardModel(item)`, `steps()`.

Sugestão por formato dos dados (substitui "organismo sempre primeiro"):
- período + entidade + valor (+ categoria): Árvore radial
- período + categoria + valor: Rio vertical
- entidade + valor + grupo: Raios radiais
- muitos itens + valor + categoria: Leque de barras
- entidade + tempo + valor (+ comparação de 2): Cordilheira isométrica
- 2 a 5 colunas de categoria em sequência (+ valor): Fluxo em funil

Ordem: Raios → Rio → Leque → Cordilheira → Fluxo.

1. **Raios radiais** (ref. idade mediana): um raio por entidade, comprimento = valor, cor = grupo, degradê que some no centro, rótulo na ponta, anotações por grupo. Hover destaca o raio e apaga os demais; filtro por grupo; ordenar por valor/nome. Animação: raios saem do centro em onda.
2. **Rio vertical** (ref. Asimov): período na vertical, categorias empilhadas e simétricas, grupos maiores por fora; linha pontilhada por período; semicírculos proporcionais com o total por categoria (também filtro). Hover numa faixa isola a categoria ao longo do tempo; cartão com valor, parcela, posição e registros do período.
3. **Leque de barras** (ref. 56 dias de comida): eixo vertical estreito à direita, barras horizontais saindo em leque, comprimento = valor, cor = categoria, até ~1500 itens. Ordenar por valor/ordem; filtro por categoria; hover mostra o rótulo no eixo.
4. **Cordilheira isométrica** (ref. 3 faixas azul/rosa): cadeias em projeção isométrica sobre grade, uma por entidade, altura = valor ao longo do tempo, duas cores para comparar dois valores de uma dimensão, facetas empilhadas opcionais. Hover levanta a cadeia; cartão com pico, total, variação.
5. **Fluxo em funil** (ref. Sankey vertical): camadas de cima para baixo, fitas em curva com degradê, números grandes em Doto por etapa, taxa de queda. Layout próprio (sem biblioteca). Hover em fita/nó destaca o caminho; clique filtra.

Cada gráfico: cartão com detalhes (curtos × textos longos), tutorial de até 4 etapas, passos de apresentação, PNG, HTML exportado offline, PT/EN, `prefers-reduced-motion`.

## Critérios de aceite (Fase A)
- Loading aparece antes do app e some sem piscar; HTML exportado também.
- 3 colunas sem scroll horizontal em 1440, 1280, 1024 e 390 px; cartão fixo na coluna 2 para todos os tipos de gráfico.
- Modais seguem exatamente as opções acima; nada some sem aviso; nada é salvo sem pedido.
- Editar mapeamento refaz a peça mantendo o estilo; subir outra planilha funciona.
- Landing completa em PT/EN, claro/escuro, sem recurso externo.
- Regressão: todos os gráficos nas 5 histórias, exportação HTML/PNG, somas conferidas.
