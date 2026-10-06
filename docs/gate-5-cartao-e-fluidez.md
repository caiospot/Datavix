# Gate 5: cartão de detalhes, fluidez e tutorial (árvore radial)

Pedido do usuário (após testar com a planilha real): muitas colunas importantes + colunas de texto explicativo; cartão ao passar o mouse limpo, em colunas, com os dados à esquerda; seguir as animações e as proporções das bolhas do vídeo de referência; tutorial de abertura de até 4 etapas.

## O que mudou
- **Cartão de detalhes** (`.orgcard`): cabeçalho (categoria, entidade, valor em Doto), coluna "Dados" (colunas curtas) e coluna "Detalhes" (textos longos, até 4 linhas no hover). Sem textos longos vira coluna única. Desliza de bolha em bolha. Clicar na bolha fixa o cartão (texto completo, rolagem, botão ×, Esc fecha) e abre o ano. No celular, o cartão fixo ancora embaixo.
- **Dados do cartão**: `buildOrganism` guarda por bolha as colunas da linha (`leaf[6]`; em modo agregado, as 3 linhas de maior valor como amostra). Coluna de texto ou categoria com frases longas (média ≥ 60 ou máx. ≥ 140 caracteres) vai para a coluna "Detalhes". Teto de tamanho (~3,2 MB de texto por peça; corta o texto longo se passar).
- **Mapeamento**: chips "Colunas no cartão de detalhes" (¶ marca texto longo); padrão = todas menos as mapeadas. Sugestão de entidade/cor ignora categorias com frases longas; cor prefere 3–16 categorias.
- **Proporções** (medidas no vídeo): anéis 0,3 R (períodos), 0,65 R (entidades), 1 R (bolhas); raiz 0,045 R. Bolhas: área proporcional ao valor com referência no percentil 97, poucas gigantes (até 13% de R) e muitas pequenas; bolhas se sobrepõem translúcidas. Com valores quase iguais, o tamanho é limitado pelo espaço no anel.
- **Animação**: movimento em onda (quem muda de lugar sai com atraso conforme o ângulo, ~0–0,37 s), taxa por nó levemente diferente, opacidade de destaque suavizada (hover não "pisca"), recolhimento para o nó pai e brotamento dele, poeira de fundo em temas escuros, ranking com barras empilhadas por categoria, dica com contagem na legenda. `prefers-reduced-motion` desliga espera e transição.
- **Tutorial** (4 etapas, só na 1ª vez, botão "Como usar" sempre disponível): 1) bolha = registro; 2) mouse e clique (mostra o cartão de verdade); 3) filtros; 4) apresentar e exportar. Foco por spot animado. `?notut` desliga (testes).
- **Botões** "Apresentar" e "Como usar" no canto do gráfico (no HTML exportado também).

## Verificado (Chrome headless)
Planilha sintética `dados-teste/projetos.csv` (420 linhas, 11 colunas, 3 de texto longo): sugestão Data/Cliente/Setor/Valor; cartão com dados à esquerda e textos ao lado; fixar/fechar; filtro por categoria (quadro intermediário em onda e final); tutorial nas 4 etapas; HTML exportado (1,1 MB) abre por `file://` com CSP estrita, sem recursos externos, com cartão e tutorial; PNG com filtro; celular (390 px). Somas de `data-test` continuam batendo (R$ 115.670.246,76).

## Limites
- Em modo agregado (acima de 3.000 linhas) o cartão mostra a amostra das 3 maiores linhas da bolha, não todas.
- Ranking só destaca; hover em ramo (período) mostra cartão simples.
- Fotos/mídia nas bolhas e tela cheia sem painel não foram feitas.
