# Gate 14 · Painel de edição: abas, ícones dos gráficos e fontes

Segundo gate do plano "mobile → painel → apresentação → vídeo social".

## O que mudou
- **Painel em 3 abas** (desktop e folha do celular): **Gráfico** (os 17 gráficos), **Visual** (paleta, fundo, fontes, opções) e **Exportar** (apresentar, exportar, dados, feedback). Setas esquerda/direita trocam de aba; a aba escolhida persiste durante a edição.
- **Ícone em cada botão de gráfico** (17 SVGs desenhados em código, sem biblioteca, herdam a cor). O sugerido continua destacado em lima; os que pedem outros dados aparecem esmaecidos com o motivo.
- **Fontes em dropdown:** 21 pares em 4 estilos (Sóbrio, Editorial, Tecnológico, Expressivo). Cada opção aparece escrita na própria fonte, com o nome do par. Teclado: seta abre, setas/Home/End navegam, Esc fecha e devolve o foco; clicar fora fecha.
- **Fontes novas (18 famílias, licença OFL):** Inter, Manrope, DM Sans, IBM Plex Sans, Plus Jakarta Sans, Playfair Display, Source Serif 4, Source Sans 3, DM Serif Display, Instrument Serif, Libre Baskerville, Space Grotesk, JetBrains Mono, IBM Plex Mono, Space Mono, Sora, Outfit, Syne e Bebas Neue (somando Geist, Geist Mono e Lora, que já existiam). Subconjunto latino, woff2, só os pesos usados (592 KB). Fontes de peso único (DM Serif, Instrument Serif, Bebas) usam peso 400 no título para não ficar com negrito falso.
- **Decodificação sob demanda:** as fontes ficam embutidas no app, mas só são carregadas quando alguém escolhe ou abre o seletor.
- **HTML exportado leva só as fontes da peça** (por exemplo Playfair + Inter): 1,5 MB, abre por `file://` com CSP estrita, sem requisição externa. O PNG usa a mesma fonte e o mesmo peso do título.
- Projetos salvos antes continuam abrindo (as chaves `modern`, `editorial` e `tech` foram mantidas).

## Custo
`index.html` passou de 3,2 MB para 4,0 MB (as 18 famílias embutidas). O app continua 100% offline e sem CDN.

## Onde está
`scripts/fetch-fonts.mjs` (baixa as fontes; o resultado fica versionado em `vendor/fonts/lib`, o build não usa rede), `build.mjs` (gera `FONT_LIB`), `src/fontlib.js` (`fontEnsure`, `fontFaceCss`), `src/icons.js` (`chartIcon`), `src/piece.js` (`FONT_PAIRS`, `FONT_CATS`), `src/ui.js` (`panel`, `setFp`, ações `ptab`/`fp-toggle`/`font`), `src/styles.css` (bloco "painel em abas").

## Testado (Chrome headless)
Desktop: abas, 17 ícones, seletor com 21 opções em 4 grupos, fontes carregadas sob demanda, escolha aplicada ao título com o peso certo, teclado e clique fora. Celular (emulação com toque real): abrir a folha, trocar de aba, abrir o seletor, escolher fonte; sem rolagem horizontal. Exportação com Playfair + Inter aberta por `file://`. Regressão sem erros: onboarding, privacidade, NPS, PWA offline, 5 histórias × todos os gráficos, 10 arquivos de teste, toque no celular.
Roteiros: `test/m/desk-panel.js`, `test/m/fp-keys.js`, `test/m/font-export.js`, `test/m/steps-panel.mjs`.

## Limites (honestos)
- Os pares são sugestões curadas; não há busca livre em todo o Google Fonts (isso exigiria rede e quebraria o modo offline).
- Safari/iPhone de verdade continua sem teste (sem Simulator nesta máquina).
- Os ícones são esquemáticos; se quiser outro traço ou mais cor, ajusto em `src/icons.js`.
