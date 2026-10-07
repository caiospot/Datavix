# Gate 21 · "Como li a sua planilha" (entrega 1 do plano "qualquer planilha")

Princípio: o Datavix aceita **qualquer** planilha e decide os caminhos pelo **tipo de informação** de cada coluna, não por um arquivo específico. Esta entrega é a base; a entrega 2 (modo casos e pesquisas: taxas, impacto, causas) e a 3 (construtor guiado melhorado) partem dela.

## O fluxo agora
Landing → 3 perguntas → planilha → conferir dados → **Como li a sua planilha** → mapeamento → O que encontrei → editor. Rótulos de etapa: upload 04, dados 05, leitura 06, mapeamento 07.

## O que o app reconhece (src/understand.js, compartilhado nos nomes por valores + dicas de nome)
Cada coluna recebe um papel, decidido primeiro pelos **valores** (padrões) e só depois pelo nome:
- **Dado pessoal** (e-mail, CPF/CNPJ, telefone, nome de pessoa): **fora dos gráficos e da apresentação por padrão**, com aviso e amostra mascarada (`P••• S•••`). A pessoa pode liberar.
- **Identificador** (códigos, protocolos, textos curtos quase únicos como nome da unidade): serve de rótulo; nunca é somado nem usado para agrupar nas escolhas automáticas.
- **Texto livre** (frases, comentários, narrativas): fica nos detalhes, nunca vira eixo ou legenda.
- **Sim/não** (SIM, NÃO, "SIM (OUVIDORIA)", "Não resolvido", yes/no, N/A): base das taxas da entrega 2.
- **Categoria, lugar, data, número**; número ganha subtipo (valor e quantidade somam; nota, taxa e duração usam média).
- **Colunas vazias ou com um só valor** saem sozinhas.
- Texto que na verdade é número ("11 dias", "37") ou categoria que se repete (cidades) é reinterpretado automaticamente.

## Tipo da planilha: "O que é cada linha?"
**Casos ou respostas** (cada linha é um atendimento: o app **conta linhas** e nunca soma valores soltos), **Valores** (soma) ou **Resumo já somado**. A leitura é sugerida com o motivo ("7 colunas de sim/não; 35 de texto livre") e a pessoa pode trocar. Em casos, a data escolhida é a da resposta/registro, não metadado (início, conclusão, edição).

## Rótulos parecidos
Sugestões de unificação (maiúsculas/acentos/pontuação: "Purple/PURPLE", "Sem segmento."; prefixo de código só se for o mesmo código). As seguras vêm marcadas; variantes de sim/não escritas diferente ("Não resolvido" × "NÃO") ficam desmarcadas, a pessoa decide. Unificar muda só o agrupamento; a planilha e os números ficam intactos.

## Proteções (guardrails)
- Rótulos "não sei" (Sem grupo, N/A, Outros, Unknown...) nunca lideram, dominam ou entram em ranking de história.
- Identificador ou texto longo nunca vira rótulo automático de eixo/legenda; dado pessoal nunca entra nos gráficos por padrão.
- Em casos, nenhum gráfico escolhe automaticamente uma coluna para somar (antes: "VALOR DA ASSINATURA" somado).

## Regressão
`files-all` (9 planilhas de teste) idêntico ao gate 20; `test/read-run.js` imprime papel de cada coluna, tipo, unificações e mapeamento para todas as planilhas de teste. Aceite com a planilha real (Qualtrics, 132 casos), fora do repositório: 5 colunas pessoais retiradas, 2 identificadores, 35 de texto livre, 7 de sim/não, tipo "casos" e mapeamento por contagem.
