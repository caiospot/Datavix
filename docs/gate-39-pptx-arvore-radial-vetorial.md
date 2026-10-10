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
