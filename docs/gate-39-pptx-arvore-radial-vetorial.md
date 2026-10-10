# Gate 39 — Árvore radial como desenho vetorial no PowerPoint

**Problema:** a Árvore radial não tem gráfico nativo equivalente no PowerPoint e saía como barras.

**Solução (piloto):** `pxVecOrganism` em `src/pptx.js` roda o mesmo `OrgEngine` do gráfico vivo (posição final, sem animação) e redesenha o resultado como formas do PowerPoint, num único grupo "Árvore radial":
- ligações curvas (formas livres com Bézier cúbica; uma por ramo/nó, mesmo traçado do canvas);
- uma elipse por bolha (cor da categoria, 30% de preenchimento, contorno, ponto central nas maiores), com texto alternativo "ramo · entidade · categoria · valor";
- nós, raiz, ramos com rótulo girado ao longo do ramo e legenda das categorias;
- nota abaixo: ramos, nós, cor e tamanho. Limite de 1500 bolhas (as maiores), avisado na nota.

Novos recursos de `PxSlide`: `shape`, `free`, `group`, e `rot`/`nowrap` em `text`.

**Limite assumido:** formas não têm "Editar dados". Cor, tamanho, posição e texto se editam no PowerPoint.

**Teste:** `test/m/pptx-make.js` (hash `lojas.csv||organism,...`) + `test/pptx-check.py` (agora reconhece desenhos agrupados). Aberto e exportado a PDF no PowerPoint real sem reparo; regressão de barras, linha, pizza, raios e rio sem mudança.

**Próximos:** Raios, Leque, Cordilheira, Rio, Funil, Bolhas agrupadas e os dois mapas.

## Etapa 2 — os outros oito gráficos (`src/pxvec.js`)

Em vez de portar cada gráfico à mão, o PPTX passa a **gravar os comandos de canvas** que cada gráfico já usa (`drawCsStatic` aceita qualquer contexto). `PxRec` é um contexto falso: acompanha matriz, estilos, `save/restore`, `Path2D` (substituído durante a gravação) e converte:
- círculos → elipses; caminhos (retas, Bézier, arcos) → formas livres; traços seguidos com o mesmo estilo → uma forma só;
- textos → caixas de texto reais (fonte do tema, rotação preservada);
- degradês lineares e radiais → preenchimentos em degradê (inclusive em contornos);
- tracejado → traço personalizado; imagem pequena do mapa de isolinhas → retângulos por trecho de células, recortados pelo contorno do Brasil;
- poeira decorativa de fundo é descartada (não é dado).

Cobre: **Raios, Leque, Cordilheira, Rio, Funil, Bolhas agrupadas, Mapa de bolhas e Mapa de isolinhas**. A Árvore radial mantém o desenho dedicado (nomes e texto alternativo por bolha). Se a gravação falhar, o slide cai no gráfico nativo de barras dos mesmos dados.

Verificado no PowerPoint real (PDF → PNG) para os 9 gráficos; regressão dos nativos igual. Dados de teste novos: `dados-teste/pontos-geo.csv` (latitude/longitude para o mapa de isolinhas). O mapa de isolinhas gera ~800 KB por slide (3,4 MB no arquivo de 4 slides).
