# Gate 18 · A história dos números (apresentação e vídeo)

Ajuste pedido após o gate 5: corrigir o "pisca" do número inicial, aumentar o hover e o clique com fontes maiores e fazer os próprios slides contarem uma história.

## O que mudou
- **Número inicial sem piscar.** Antes, a contagem trocava de unidade no meio (`740.3K` virava `2.7M`) e a largura do número mudava, fazendo o rótulo ao lado pular. Agora a contagem mantém prefixo, unidade e casas decimais finais e só interpola o valor, e a largura é reservada antes de animar. O valor final é sempre o do cálculo. Vale na abertura, em cada slide e no gancho do vídeo.
- **Hover e clique grandes.** Na apresentação, o cartão de detalhes (hover e clique) ocupa a coluna esquerda no lugar da história, com fontes bem maiores (título ~31 px, texto ~18 px a 1440 px de largura, antes ~12,5 px). Ele aparece também no simples hover (antes só no clique); a história volta sozinha quando você sai do item. O **texto dentro dos gráficos** (rótulos, eixos, rótulo de hover) também cresce ~32% durante a apresentação (Vizzu e gráficos de canvas próprio).
- **Storytelling.** Cada slide é um "ato" com: etiqueta numerada (ex.: `02 O LÍDER`), a frase que conta o achado com o número em destaque, o número gigante que a prova (contando de zero), o **cálculo verificável** (recolhível) e o **destaque no gráfico**. Roteiro gerado dos dados:
  1. **O panorama:** "900 registros somam 2,7 mi, repartidos em 8 grupos de “Categoria”."
  2. **O líder** (ou **O equilíbrio**, se nenhum grupo se destaca): "Eletrônicos lidera: 1,1 mi, 39% do total."
  3. **A concentração** (6+ grupos): "Os 3 maiores somam 69% do total; os outros 5 dividem 31%." Destaca os 3 no gráfico.
  4. **O contraste** (extremos com razão ≥ 3×): "Eletrônicos vale 13× Papelaria."
  5. **Os insights da peça** (pico, vale, virada, queda, tendência, domínio, ponto fora da curva, conversão, gargalo, caminho, comparação), cada um no seu ato, sem repetir o mesmo achado, com o item citado em destaque quando o gráfico tem um passo para ele.
  6. **Em resumo:** a cena final lista as frases da história.
  Para dispersão há "A relação" (correlação de Pearson com a leitura em palavras); para médias, o líder e o contraste usam os valores, sem participação.
- **O vídeo conta a mesma história:** etiqueta, frase e cálculo por cena (até 4 atos), resumo com as mesmas frases; troca de cenas mais limpa (a anterior sai rápido, a nova entra logo depois).
- Tempo de leitura por slide limitado a 9,5 s na reprodução automática.
- Funciona em português e inglês e no HTML exportado.

## Honestidade dos números
Nenhuma frase afirma algo sem o cálculo ao lado: participação = valor ÷ soma dos grupos; concentração = soma dos maiores ÷ soma; contraste = maior ÷ menor; correlação = r de Pearson (limiares |r| ≥ 0,7 forte e ≥ 0,4 moderada declarados na fórmula). Todo número de slide é parseável e aparece na frase (verificado por teste).

## Onde está
`src/story.js` (motor da história, textos PT/EN), `src/runtime.js` (`startPresentation`, `numParts`, `numFrame`, `presCountUp`), `src/charts.js` e `src/organism.js` (`csScaleFont`), `src/piece.js` (`vzStyle` com `P.textK`), `src/piece.css` (bloco "apresentação C"), `src/video.js` (`videoPlan`, contagem estável).

## Testado (Chrome headless)
- Contagem: amostras a cada 40 ms; unidade constante, valores só crescem, largura fixa, rótulo parado (`test/m/pres-count.js`).
- Histórias dos 9 arquivos de teste em PT e EN: nenhum `undefined`/`NaN`, cálculo em todos os slides, destaque sempre dentro da frase, sem frases repetidas (`test/m/story-check.js`).
- Capturas: slide do líder, cartão de hover e de clique grandes, celular em retrato (história e cálculo), vídeo com a história.
- Regressão sem erros: onboarding, privacidade, NPS, PWA offline, 5 histórias × todos os gráficos, 10 arquivos, apresentação em todos os 9 gráficos, reprodução automática, HTML exportado por `file://` com a apresentação nova, celular com toque.

## Limites
- Os atos gerados olham para totais por grupo; em peças sem um eixo de grupos (por exemplo, só dispersão) a história é mais curta (panorama + relação + insights).
- O destaque de vários grupos no gráfico existe no Vizzu e no Leque; nos demais gráficos de canvas, só quando há um passo para o item.
- Safari/iPhone de verdade continua sem teste.
