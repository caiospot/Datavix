# Datavix · Gate 3c, editor e projetos recentes (status em 2026-10-04)

Build: `node build.mjs` (index.html 2,4 MB; HTML exportado ~820 KB).

## Entregue
- **3 pares tipográficos** (título + corpo/gráfico): Geist, Lora + Geist, Geist Mono + Geist. Embutidos no arquivo. Valem para a peça, o gráfico, o PNG e o HTML exportado.
- **Elementos ligáveis**: legenda, grade, rótulos de valor, anotações (insights) e notas de rodapé. Rótulos já formatados no idioma da peça (`1,1 mi`, `208,1 mil`); aparecem quando o gráfico comporta (até 60 pontos).
- **Texto editável direto na peça**: título, subtítulo, nota de rodapé e cada insight. Insight editado ganha o selo "editado" e mantém o "ver cálculo" original. Cada insight pode ser removido. Se a pessoa remove, a peça não diz "nenhum insight confiável".
- **Desfazer/refazer** cobre tudo isso (tipografia, elementos, textos, remoção de insight).
- **Tooltip** com fundo, borda, fonte e cor da peça.
- **Projetos recentes** (IndexedDB): salvamento automático 1,2 s depois de cada mudança, até 20, lista na tela de entrada com abrir/apagar/apagar todos. Guarda só os dados agregados da peça (2 KB a algumas centenas de KB), nunca a planilha. Reabre com tipo, paleta, fundo, tipografia, opções e textos editados. Sem a planilha, "Editar mapeamento" pede o arquivo de novo.

## Verificado
Alternar cada elemento (config do Vizzu muda como esperado), trocar par tipográfico (Lora carregada), edição de 3 tipos de texto, remoção, desfazer/refazer em sequência, salvar, recarregar, listar e abrir projeto; HTML exportado respeita opções, tipografia e textos, 0 recursos externos; PNG com título em Lora.

## Não verificado
- Navegador em modo privado (o armazenamento falha em silêncio e os recentes simplesmente não aparecem).
- Safari/Firefox.
- Painel lateral em celular.

## Falta
Fase 1b: sunburst, sankey, mapa de UFs, small multiples. Anotações ancoradas nas barras. Abreviações dos eixos do Vizzu (`250 k`) ainda em inglês.

## Correção pós-teste real (2026-10-05): leitura do arquivo
Relato: a leitura travou em "Reading the file" com uma planilha real. Não consegui reproduzir com `.csv`, `.xlsx` (1 e 2 abas) nem `.xls` em Chrome por `file://` (testado com Chrome headless via `test/cdp.mjs`). O que foi endurecido:
- `.xlsx`: lê só os nomes das abas primeiro e depois só a aba escolhida, sem fórmulas/HTML/texto formatado (200 mil linhas, 73 MB: 4,5 s no Node).
- Tela de leitura: tempo decorrido, tamanho, aviso de demora (8 s), aviso de leitor sem resposta (4 s), botão Cancelar (recria o leitor depois).
- Se o navegador não consegue iniciar o leitor, a mensagem diz o que fazer.
- Bug corrigido: `go()` apagava mensagens de erro; arquivo corrompido/vazio voltava ao upload sem explicação. Senha/arquivo danificado agora tem mensagem própria.
- Datas seriais do Excel verificadas em 4 fusos horários.
Ferramentas: `test/cdp.mjs <url> <seg> [script.js]` roda a página no Chrome headless e avalia um roteiro; `node test/parse-test.mjs <arquivo> [aba]` lê um arquivo sem imprimir valores de células.
