# Gate 51 — Várias abas (local, aguardando aprovação)

Quarto portão de `docs/especificacao-modelos-e-abas.md` (§6.1 a 6.3 e 6.5). Antes, uma pasta de trabalho com várias abas pedia "Escolha a aba" e as outras eram ignoradas. Agora a pasta inteira é um projeto e cada aba tem um papel.

## O que mudou
1. **Leitura da pasta (`src/parser.worker.js`)**: uma única leitura de todas as abas devolve, por aba, só o necessário: tamanho, cabeçalho, proporção de texto, números e links, valores distintos das colunas de poucas categorias (para achar chaves em comum) e, nas abas de texto, as linhas na íntegra. Pastas acima de 12 MB seguem com o seletor simples de antes.
2. **Papéis sugeridos (`wbSuggest`, `src/workbook.js`)**
   - **Fontes e método**: até 3 colunas, quase só texto, e (30% das células com link **ou** nome com "fonte", "método", "notas", "leia-me"…).
   - **Perfil**: aba de texto com 3 ou mais colunas e até 80 linhas.
   - **Principal / Detalhe**: entre as abas com números, a Principal é a de grão mais grosso que tem uma aba mais fina (2× mais linhas ou mais) com **chaves em comum**; essa mais fina vira Detalhe. Sem relação, a Principal é a de mais números e as outras ficam em Ignorar.
   - **Ignorar**: aba oculta ou vazia.
3. **Tela "O que há nesta planilha"**: uma linha por aba (nome, tamanho, colunas, papel em menu e uma frase sobre o papel). Só uma aba pode ser Principal; escolher outra rebaixa a anterior a Detalhe. Sem Principal, o botão Continuar fica desligado e a tela avisa. Com **uma** aba útil só, a tela não aparece e a leitura segue com ela; CSV e planilhas de uma aba não mudam.
4. **Slide "Fontes e método"**: penúltimo slide quando existe uma aba de fontes. Mostra as células **exatamente como estão** (links incluídos), em duas colunas, com a contagem no lado esquerdo. Planos de 2 slides não levam Fontes; com o plano cheio, sai o slide de apoio menos importante. Vale para todos os modelos, não só o Face a face.
5. **Ressalvas na íntegra**: linhas da aba de fontes cujo item fala em limite, comparabilidade, ressalva ou aviso entram nos **Limites** do Face a face com o texto original ("Comparabilidade: …").
6. **Perfil do Face a face** vem da aba de Perfil (colunas com o nome das entidades); só entram linhas em que pelo menos duas entidades têm texto, nunca número com unidade.
7. **Painel do editor**: seção "Abas da planilha" com o papel de cada aba. Perfil, Fontes e Ignorar mudam o roteiro na hora; Principal e Detalhe aparecem fixos.
8. **Exportações**: PPTX desenha o slide Fontes em duas colunas; o vídeo mostra o texto do slide sem o gráfico geral; o HTML exportado leva os textos junto (`built.wbx`), sem precisar da planilha.

## Planilha da Fórmula 1 (4 abas)
Papéis sugeridos: **Sheet1 → Perfil**, **Comparativo 1989-94 → Principal**, **Fontes e método → Fontes**, **Resultados por GP → Detalhe**. O roteiro de 10 slides termina com … Limites (com a "Comparabilidade" idêntica à da aba) > **Fontes e método** (18 itens idênticos) > Síntese.

## Fora deste portão
- **Detalhe** fica guardada e ainda não entra na apresentação: a conciliação com a Principal e os slides corrida a corrida são do próximo portão.
- Trocar a aba Principal depois de gerar a apresentação exige voltar à tela de abas.
- A aba Perfil só alimenta o Face a face; em outros modelos, é guardada.

## Testes
`test/m/workbook-run.js` (novo): papéis das 4 abas da F1, tela e troca de papéis, Principal única, botão desligado sem Principal, `built.wbx`, Fontes penúltimo (10 e 5 slides) e ausente (2 slides), itens e links idênticos, Comparabilidade idêntica nos Limites, perfil sem alteração, painel (Fontes ↔ Ignorar refaz o roteiro), PPTX, pasta com aba oculta, vazia e notas (`dados-teste/pasta-abas.xlsx`, gerada por `gerar-pasta-abas.py`), pasta só com abas vazias, CSV sem tela.
