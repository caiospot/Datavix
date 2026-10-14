# Gate 54 — Galeria de modelos (local, aguardando aprovação)

Sétimo portão de `docs/especificacao-modelos-e-abas.md` (§7). A janela de texto "Que história contar?" (portão 44) virou uma **galeria visual**, no estilo da galeria de modelos do Google Planilhas, e a janela de texto continua existindo como "lista".

## O que mudou
1. **Miniatura com os dados da própria planilha** (`src/modelgallery.js`): cada cartão mostra um slide em miniatura desenhado com rótulos e valores reais, não uma imagem genérica.
   | Modelo | Miniatura |
   |---|---|
   | Face a face | linha do tempo das entidades, com o período sem registro tracejado |
   | Comparativo, Ranking, Composição, Geografia | barras com as 5 maiores categorias e seus totais (ou médias, se a medida é média) |
   | Evolução no tempo, Antes e depois | linha da medida por período, do primeiro ao último |
   | Distribuição | histograma de 12 faixas, do mínimo ao máximo |
   | Relação | pontos reais das duas medidas |
   | Funil | contagem real de cada etapa |
   | Meta e desempenho | realizado × meta por grupo, com o atingimento |
   | Geografia por latitude e longitude | os pontos reais |
   | Panorama | a miniatura do modelo mais forte da planilha |
   A miniatura só **descreve** (totais e formas); quem afirma achados é o roteiro, que passa pelo validador. Os totais são calculados com a mesma regra de soma ou média do gráfico, sobre todas as linhas (35 ms para 100 mil linhas).
2. **Sequência de slides** de cada modelo, em etiquetas numeradas (a do arco do modelo; no Face a face, a do roteiro real da planilha: "A pergunta, Linha do tempo, …").
3. **Em destaque, o que serve**: "Serve para esta planilha" traz até 3 modelos, o primeiro já marcado, com a forma dos dados ("Segmento: 2 valores · Receita"; no Face a face, "2 entidades × 5 métricas × 6 períodos").
4. **Todos os modelos, por grupo**: Comparar (Face a face, Comparativo), Ao longo do tempo (Evolução, Antes e depois), Quem pesa (Ranking, Composição), Planejamento (Meta e desempenho, Funil), Explorar (Distribuição, Relação, Geografia) e Panorama. Os possíveis são cartões selecionáveis; os que a planilha não sustenta ficam **apagados, com o motivo** ("falta uma coluna de datas com pelo menos 4 períodos").
5. **Galeria ou lista**: botões na janela; em telas com menos de 760 px a janela abre como lista (sem miniaturas, em coluna) e a escolha fica lembrada no navegador.
6. **Escolher**: um clique marca, o botão "Contar esta história" confirma e o clique duplo escolhe direto. "Panorama" continua como saída.
7. **Pelo painel**: o botão "Ver galeria de modelos" (seção História) abre a galeria com o modelo atual marcado; fechar sem escolher não muda nada. Com um só modelo possível, a galeria não abre sozinha depois de gerar.

## Acessibilidade
Cartões são botões com `aria-pressed`; os indisponíveis são `aria-disabled` e não recebem foco; cada miniatura tem um texto para leitor de tela ("Miniatura do modelo X com os dados da planilha: …"); grupos têm títulos; em tela pequena as miniaturas somem e os textos permanecem.

## Correções no caminho
- A ação do botão do painel não pode começar com `story-`: o construtor de roteiro captura esse prefixo (`mg-open`).
- O ambiente de histórias guardava os textos no idioma da primeira abertura; agora a chave inclui o idioma.
- A elegibilidade de Geografia por categoria devolvia a coluna `undefined`; agora devolve a coluna certa.

## Fora deste portão
- Pré-visualização maior ao passar o mouse e miniaturas animadas.
- Miniatura de Antes e depois com o marco desenhado (precisa da data escolhida).
- Reabrir projetos salvos sem a planilha: a janela cai para a lista (sem miniaturas).

## Testes
`test/m/gallery-run.js` (novo): galeria aberta depois de gerar, recomendados com miniatura e sequência, **título, maior valor e períodos conferidos de forma independente na planilha**, indisponíveis apagados com o motivo da elegibilidade, ordem dos grupos, Panorama, texto para leitor de tela, alternância galeria/lista com memória, clique e clique duplo, botão do painel (modelo atual marcado, Esc sem efeito, escolher Panorama), Funil com as contagens reais, Meta com realizado × meta, Geografia com pontos, Face a face da F1 (entidades, períodos, tracejados, sequência do roteiro por fases) e inglês. `test/m/gallery-mobile.js` (novo, 420 px): abre como lista, cabe na tela, troca para galeria, escolhe e aplica. Os testes de história dos portões 44 a 47 continuam passando com a nova janela.
