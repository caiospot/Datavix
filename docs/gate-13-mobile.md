# Gate 13 · Mobile (menu burger e estrutura geral)

Primeiro gate do plano "mobile → painel → apresentação → vídeo social".

## O que mudou
- **Menu burger** (≤ 900 px): a barra do topo fica só com logo, ação principal (Começar / Salvar) e o burger. A **gaveta** traz navegação da landing, Salvar, Meus projetos, Novo, Instalar app, idioma, tema, Enviar feedback, Privacidade e Sair. Fecha ao escolher um item, no overlay, no ✕ e com Esc; o foco volta ao burger.
- **iPhone/iPad:** o Safari não oferece o botão de instalar, então a gaveta mostra "Instalar no iPhone" com o passo a passo (Compartilhar → Adicionar à Tela de Início).
- **Editor no celular:** o gráfico vem logo abaixo do título (antes ficava depois dos insights). O painel virou uma **folha** que sobe de baixo (arrastar a alça para baixo ou ✕ fecha); com ela aberta o gráfico encolhe para continuar visível. Barra inferior fixa: Desfazer, Refazer, Editar, Apresentar.
- **Celular deitado:** a folha abre como painel lateral e a barra inferior fica mais fina.
- **Toque:** tocar num item fixa o cartão de detalhes, que sobe como cartão flutuante na base da tela (antes a página rolava até o fim). Alvos de toque maiores, campos com 16 px (o iOS não dá zoom ao focar), áreas seguras do iPhone (`viewport-fit=cover`), modais viram folhas na base.
- **HTML exportado** ganha o mesmo layout estreito (gráfico primeiro, cartão flutuante) quando aberto no celular.
- Corrigidos: barra do topo estourando a largura (a página chegava a 736 px em tela de 390), blocos do gráfico encolhendo a 201 px no layout estreito, Esc fechando dois modais empilhados.

## Onde está
`src/ui.js` (`header`, `editor`, `setMenu`, `setSheet`, `openIosInstall`), `src/styles.css` (bloco "celular e tablet vertical"), `src/piece.css` (layout `narrow` e cartão flutuante), `src/pwa.js` (`pwaIosCanAdd`), `src/i18n-charts.js` (textos `menu_*`, `m_*`, `sheet_*`).

## Testado
Chrome headless com emulação de celular (`test/mshot.mjs`, toque real via CDP, 390×844, 820×1180, 844×390): sem rolagem horizontal em nenhuma tela; burger, overlay, cartão fixado, arrastar a folha e escolher gráfico por toque; todos os gráficos disponíveis cabem em 342 px sem erro; tema claro; modal de privacidade; HTML exportado sem recurso externo. Desktop sem mudança (onboarding, privacidade, NPS, PWA offline e regress 5 histórias × todos os gráficos, sem erros).
Roteiros em `test/m/*.mjs`. Uso: `node test/mshot.mjs <url> <pasta> test/m/steps-after.mjs [LxA]`.

## Limites (honestos)
- **Safari/iPhone de verdade não foi testado:** o Simulator do iOS não está instalado nesta máquina (só as ferramentas de linha de comando do Xcode). O Chrome emulado não reproduz tudo do WebKit (barra de endereço dinâmica, teclado, gestos). Precisa de um teste num aparelho real.
- A apresentação no celular ainda é a antiga (só mantém o gráfico e a navegação); será refeita nos gates de Apresentação.
- Gráficos de muitos itens (Leque com 900 barras) ficam densos em 342 px; o toque acerta bem menos que o mouse. O ajuste fino por gráfico fica para depois.
