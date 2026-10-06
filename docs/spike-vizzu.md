# Spike Vizzu (gate 2, passo 1)

Data: 2026-10-04. Vizzu 0.18.0 (Apache-2.0). Testado no navegador do app, servido por localhost.

## Resultado: APROVADO. Seguimos com Vizzu (núcleo) + D3 (gráficos especiais)

| Teste | Resultado |
|---|---|
| Arquivo único com JS + WASM embutidos (base64) | `spike.html` = 605 KB |
| Requisições externas | 0 |
| Carga do módulo / init do gráfico | 25–87 ms / 82–166 ms |
| Morph entre barras, empilhadas, linha, área, bolhas e race | 6/6 sem erro, ~1,2 s por transição |
| Tema (fundo, fonte, paleta, eixos, legenda) por `animate({style})` | OK |
| Remover marca "VIZZU" do canvas (`logo.width = 0`) | OK |
| Clique numa bolha isola a série (`filter` animado) | OK |
| Tooltip nativo (`feature('tooltip')`) | habilitado; falta estilizar |

## Como embutir (usado no spike e no export)
- JS e WASM em base64 dentro de `<script type="text/plain">`.
- JS vira `Blob` + `import(blobURL)`; WASM vira `Blob` e entra por `Vizzu.options({ wasmUrl })`.
- Exige CSP que permita `blob:`.

## Pegadinhas da API 0.18
- Construtor: `new Vizzu({ element: HTMLElement })` (não `container`).
- Estilo: `title.backgroundColor` e `plot.backgroundColor` não existem; o fundo vai em `style.backgroundColor`.
- Bolhas vêm com linhas-guia por padrão; desligar nos presets.

## Pendente
- Medir os 100 mil pontos (agregação antes do Vizzu).
- Estilizar tooltip, que o Vizzu desenha no canvas.
- Testar zoom em séries temporais (filtro por intervalo + brush).
- Testar o export com a rede desligada, em `file://`.
