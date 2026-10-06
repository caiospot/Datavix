# Gate 6: Fase A (estrutura e experiência)

Pedido (2026-10-05): loading, coluna 1 sem scroll lateral, 3 colunas com cartão fixo, logo volta à home, Editar mapeamento em modal, modais de salvar/sair, landing, 5 novos gráficos (Fase B, ainda não feita). Decisões em `docs/prompt-fase-2.md`.

## Entregue
- **Loading** (`src/splash.css`, gerado em `build.mjs`): tela inline antes dos scripts pesados; mini-árvore radial em SVG animada só com CSS, etapas reais ("Preparando a interface…"), sai quando fontes e interface estão prontas (mínimo ~1,1 s no app, ~0,9 s no HTML exportado). `prefers-reduced-motion`: estática.
- **3 colunas para todos os gráficos**: coluna 1 (título, insights, controles do gráfico, filtros), coluna 2 (cartão fixo), coluna 3 (gráfico). Arranjo pela largura da peça: ≥1180 px 3 colunas; ≥760 px cartão acima do gráfico (altura fixa, sem "pular"); abaixo, empilhado. Coluna 1 com `overflow-x: hidden` e `min-width: 0` (sem scroll lateral). Painel do editor recolhível (botão ◨, lembra a escolha).
- **Cartão (`src/cardcol.js`)**: visão geral (vazio) → hover (prévia) → fixo (clique; × ou Esc). Alimentado por organismo (dados + textos longos), Vizzu (evento de ponteiro do marcador), calendário e KPI.
- **Navegação**: logo vai à home; botões Salvar projeto, Novo projeto e Sair; selo "Não salvo/Salvo". Sem autosave. Modais (`src/modal.js`): Novo projeto e logo = Salvar / Não salvar / Cancelar; Sair = Salvar / Não salvar; salvar pede o nome. Aviso do navegador ao fechar a aba com alterações.
- **Editar mapeamento (modal)**: mapeamento do gráfico, colunas do cartão, renomear e trocar o tipo das colunas, prévia dos dados, "Subir outra planilha". Aplicar refaz a peça mantendo paleta, fundo, fontes, títulos e tipo; toast com Desfazer. Cancelar restaura tudo. Sem editar valores de células.
- **Landing** (`src/landing.js`): hero com árvore radial ao vivo (dados fictícios, mesmo motor), como funciona (4 passos), gráficos (os 5 novos marcados "Em breve"), diferenciais, para quem, FAQ, CTA e rodapé; PT/EN, claro/escuro, placeholders de imagem marcados. Login simulado em modal.
- **Sugestão por formato dos dados**: árvore radial primeiro em tempo/comparação/composição; em relação e distribuição o gráfico nativo vem primeiro e a árvore é alternativa.

## Verificado (Chrome headless)
Layouts 1440 (painel aberto = cartão acima; recolhido = 3 colunas), 390 px; hover/fixar do cartão em organismo, barras, KPI, treemap; modais e salvamento; editar mapeamento + desfazer + trocar planilha; landing (desktop e celular) e login; regressão em 5 histórias × todos os tipos sem erro; HTML exportado (1,1 MB) por `file://` sem recurso externo, com cartão e apresentação; PNG; somas inalteradas (R$ 115.670.246,76).

## Limites
- Imagens da landing são placeholders.
- Vizzu: o cartão mostra o que o marcador expõe (categorias e valores), sem textos longos.
- Trocar planilha mantém papéis das colunas só se os nomes coincidirem.

## Ajustes (rodada 2)
- **Lista completa na coluna 2** (`createListCol` em `src/cardcol.js`): sempre visível abaixo do cartão, virtualizada (aguenta milhares de linhas), com busca (inclui os textos longos da linha) e ordenação (maior valor, nome, ordem original). Liga-se ao gráfico nos dois sentidos: passar o mouse numa linha destaca a bolha e abre o cartão; passar o mouse na bolha rola a lista até a linha; clicar fixa e abre o ano. Respeita filtros de categoria e intervalo. Também alimenta barras/linhas/treemap etc. (pontos do gráfico, com filtros ativos), calendário (dias) e indicadores. Setas e Enter funcionam na lista.
- **"Organizando seus dados"**: usa o mesmo loading da home (árvore em SVG, marca, barra), maior, com as 3 etapas em texto (~2,9 s). Troca de tela com View Transitions: a tela antiga recua e desfoca, a nova avança (sem suporte ou com movimento reduzido, troca direta).
- **Header da home**: nav translúcida com desfoque (transparente no topo), links centrais; hero sem caixa: texto centralizado grande, a árvore radial ocupa o fundo, sobe e se revela com a rolagem (texto recua, glow suave, legenda no fim). No celular e com movimento reduzido: texto e depois árvore, sem rolagem animada. Claro e escuro.

## Ajuste: modo Apresentação com lateral esquerda e logotipo (2026-10-05)
Pedido: ao clicar em Apresentar só aparecia o gráfico; incluir os dados principais na lateral esquerda e o logotipo DATAVIX no canto superior direito.
- Layout da apresentação (`src/piece.css`): grade de 2 colunas (lateral de 27vw, entre 300 e 480 px, e o gráfico). Lateral: título, fonte/período, insights com "ver cálculo" (respeita a chave de anotações) e o cartão de detalhes (visão geral do gráfico; mostra o item sob o mouse; a lista fica oculta). Legenda da etapa continua sob o gráfico.
- Logotipo (`.plogo` em `src/piece.js`): quadrado lima + DATAVIX em Geist Mono, canto superior direito, só na apresentação; o gráfico começa abaixo dele.
- Abaixo de 900 px: coluna única (título e fonte no alto, gráfico embaixo; insights e cartão ocultos).
- Vale para os 6 gráficos de canvas, os do Vizzu, calendário e KPI, e para o HTML exportado (mesmo CSS). Testado: Raios radiais, barras (Vizzu), 390 px, exportado em `file://`.

## Ajuste: entrada direta e "Outra coisa" no onboarding (2026-10-06)
- "Começar agora" (e o botão do cabeçalho) vai direto para a primeira pergunta do onboarding; o modal de login com "Entrar com link mágico" foi removido (a sessão simulada de convidado é criada automaticamente).
- Toda pergunta de escolha (público, decisão, história, tom, onde vai ser usado) ganhou a opção **Outra coisa**, tracejada, com um campo opcional ("Descreva do seu jeito"). Se a descrição traz uma palavra reconhecível (ex.: "funil" → Fluxo, "conselho" → Conselho, "telão" → Projetor), o Datavix usa a opção mais próxima; senão usa o padrão mais neutro (diretoria, priorizar, comparação, sóbrio corporativo, tela). A escolha "Outra coisa" e o texto ficam lembrados ao voltar. Teste: `test/onboarding.js`.
