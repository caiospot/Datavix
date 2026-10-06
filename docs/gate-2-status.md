# Datavix · Gate 2 (status em 2026-10-04)

Protótipo em `index.html` (arquivo único, 1,9 MB, tudo embutido). Fonte em `src/`, build com `node build.mjs`.

## Como rodar
- Abrir `index.html` direto no navegador, ou: `python3 -m http.server 8766` na pasta e abrir `http://localhost:8766/index.html`.
- `test/dev.html` é a mesma build com `connect-src 'self'`, só para testes com `fetch` dos arquivos de `dados-teste/`.
- Testes de Node: `node test/parse-test.mjs` (parser) e `node test/data-test.mjs` (motor de dados, confere soma contra valor independente).

## Entregue
- Entrada simulada (e-mail ou convidado), onboarding de 6 perguntas (PT/EN), upload `.xlsx/.xls/.csv` com arrastar e soltar.
- Parser em Web Worker: encoding (UTF-8/Latin-1), delimitador, números e datas pt-BR/en-US, UF, abas múltiplas, tipos corrigíveis, relatório de qualidade, política de vazios, alerta de dado pessoal e de data ambígua.
- Mapeamento sugerido pelo onboarding; agregação automática (mês quando há 12 a 120 meses; top N + Outros; grade 30x30 em dispersão grande).
- Gráficos (Vizzu, com morph): linha, área, barras, barras horizontais, empilhado 100%, dispersão, bolhas, histograma.
- Insights: pico, vale, maior salto, maior queda, tendência (janela inicial x final), participação dominante, outlier IQR. Todos com "ver cálculo". Sem cálculo possível: "Nenhum insight confiável nestes dados."
- Editor: tipo de gráfico (sugerido + alternativas), 6 paletas + cor de destaque, aviso de contraste AA, fundo claro/escuro/sólido/gradiente, título editável, desfazer/refazer (botões e Ctrl+Z).

## Medido
| Item | Resultado |
|---|---|
| 50 mil linhas (Latin-1, `;`): arquivo até preview | 1,95 s (navegador) |
| Cálculo da peça após o mapeamento | ~0,15 s |
| Soma do motor x soma independente (Python) | R$ 115.670.246,76 nos dois |
| `.xlsx` 2 abas, 2 mil linhas | 242 ms |
| Estado inicial do arquivo exportado | ainda não existe (gate 3) |

## Não verificado ainda
- Abrir `index.html` por `file://` com a rede desligada.
- Tempo de 2 min com pessoa real, sem ajuda.
- 100 mil linhas.
- Quadros intermediários das animações (verifiquei que rodam sem erro e preservam os dados).

## Limites conhecidos
- Eixos usam abreviação do Vizzu (`250 k`, `1 M`), não `mil/mi`.
- Insights ficam em cartões acima do gráfico, não ancorados nas barras.
- Fluxo (sankey) e mapa por UF caem em barras até a fase 1b.
- Fontes da peça: só Geist e Georgia (3 pares ficam para o gate 3).

## Gate 3 (próximo)
KPI cards, treemap, heatmap de calendário, bar chart race; modo apresentação; exportar HTML autossuficiente, PNG e PNG por etapa; filtros e ordenação; rótulos, legenda, grade, anotações editáveis; 3 pares tipográficos; projetos recentes (IndexedDB); zoom em séries temporais; tooltip estilizado.
