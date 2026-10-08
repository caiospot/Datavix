# Gate 22 · Modo casos e pesquisas (entrega 2)

Quando a leitura da planilha (gate 21) conclui que **cada linha é um caso ou uma resposta**, o Datavix passa a contar a história com **taxas, impacto, causas e termos**, nunca com somas inventadas. Tudo sai de contagens das linhas, com o cálculo ao lado ("ver cálculo").

## Atos novos (aparecem em "O que encontrei", na apresentação, no HTML exportado e no vídeo)
- **A taxa** (`c_rate`): "SIM em 56% das respostas válidas (50 de 89)". Só entram respostas válidas (SIM + NÃO); em branco, "não se aplica" e outras respostas ficam fora e o cálculo mostra quantas ficaram. Barra com SIM e NÃO.
- **O impacto** (`c_impact`): a taxa de cada sim/não **dentro de cada resposta do resultado principal** ("quando o caso é resolvido, o cliente rechama em 10%; quando não, em 43%"), com a diferença em p.p. Só grupos com 8+ respostas válidas e diferença de 10 p.p. ou mais; até 3 impactos. O resultado principal é a coluna sim/não com nome de resolução/sucesso, ou a de mais respostas válidas.
- **Onde varia** (`c_where`): por categoria (jornada, canal, região...), a menor e a maior taxa do resultado, com os números de cada grupo e a amplitude; só categorias com amplitude de 15 p.p. ou mais, até 2.
- **As causas** (`c_cause`): ranking das respostas mais frequentes das colunas de causa/motivo (até 5), com contagem e participação entre as linhas preenchidas. Slide em lista numerada.
- **O que se repete** (`c_terms`): palavras mais citadas no texto livre mais informativo (voz do cliente, comentário...). Conta **linhas** que contêm a palavra; ignora conectivos e palavras presentes em mais de 45% das linhas; variações da mesma palavra contam à parte (dito no cálculo).

## Como o app lê as respostas (tela "Como li a sua planilha")
Nas colunas sim/não há agora a lista **"Como contei cada resposta"**: cada resposta distinta, com quantas linhas, e a escolha *conta como SIM / conta como NÃO / fora da conta*. É onde a pessoa corrige leituras como "Resolvido com sucesso" ou "Cliente não quer opinar".

## Outras mudanças
- O panorama de planilha de contagem diz "132 registros entre nov/24 e set/26", em vez de "somam".
- Em casos, o líder/concentração/contraste por grupo perdem prioridade frente às taxas ao cortar por tempo.
- Nomes de colunas em CAIXA ALTA viram frase nos slides; telas com cálculo longo escondem o total fixo para não sobrepor.
- `P.cases` guarda só números e rótulos (vai no projeto salvo e no HTML exportado); a frase é montada no idioma da tela.

## Testes
`test/read-check.js` (planilha sintética de casos): papéis, tipo, unificação, mapeamento por contagem e os cinco atos (taxa 36/90 válidas, impacto, causa, termos). Regressão: files-all, types-all e org-run idênticos ao gate 21. Aceite com a planilha real (fora do repositório): resolução 50 de 89 válidas (56%); satisfeito 91% × 50%; rechama 10% × 43%; causa principal "Problema já havia sido resolvido" 9 de 39 (23%).

## Limites conhecidos
- O gráfico ao lado dos atos de casos ainda é o gráfico geral da peça (sem destaque do grupo): a entrega 3 propõe o gráfico certo para cada slide.
- A leitura "SIM/NÃO" é por texto (PT e EN). Respostas que não sejam sim/não ficam fora da taxa até a pessoa classificá-las.
