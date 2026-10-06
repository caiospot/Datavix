# Política de privacidade

Texto em `src/privacy.js` (PT/EN), aberto em modal pelo link **Privacidade** no rodapé da landing e por **O que é enviado?** na pesquisa de satisfação.

## Decisões que precisam ser suas
- **Prazo de guarda das respostas do NPS: 24 meses** (depois apagar ou anonimizar). É um valor sugerido; mude no texto se preferir.
- **Responsável:** aparece como "Caio (GitHub: caiospot)". Se tiver nome completo, CNPJ ou razão social, inclua em "Quem é o responsável".
- **Contato:** sem e-mail configurado, o texto aponta para as Issues do GitHub (e pede para não colocar dados pessoais no texto público). Para usar e-mail, crie a variável do repositório `DATAVIX_CONTACT_EMAIL` (Settings → Secrets and variables → Actions → Variables) e rode o deploy. Local: `DATAVIX_CONTACT_EMAIL=voce@exemplo.com node build.mjs`. O e-mail fica visível a qualquer visitante.
- Prazo de resposta a pedidos: **15 dias** (art. 19, II da LGPD).
- Recomendado: revisão de um advogado antes de divulgar o produto amplamente.

## O que o texto cobre (e onde está no código)
| Tema | Código |
|---|---|
| Planilha lida no navegador, sem envio | `parser.worker.js`, CSP sem `connect-src` externo |
| Projetos salvos (IndexedDB `datavix`, até 20) | `store.js` |
| localStorage (`dv-panel`, `dv-*-tutorial`, `dv-nps`) | `ui.js`, tutoriais, `nps.js` |
| Fila do NPS (IndexedDB `datavix-nps`) | `nps.js` |
| Cache offline do PWA | `pwa/sw.js` |
| Campos enviados no NPS | `npsPayload` em `nps.js` |
| Google Apps Script / planilha do responsável | `nps/apps-script/Code.gs` |
| Hospedagem GitHub Pages | `.github/workflows/pages.yml` |

## Manutenção
Se o app passar a guardar ou enviar algo novo (novo campo no NPS, analytics, outro serviço), atualize `src/privacy.js` e `PRIV_DATE`, e a data "Atualizada em" nos dois idiomas.

## Pedidos de exclusão
A pessoa informa o código anônimo (mostrado em "O que é enviado?") ou o e-mail deixado. Na planilha, filtre a coluna `id` (ou `email`) na aba NPS e apague as linhas.

## Teste
`test/privacy.js`: link no rodapé nos dois idiomas, modal com 10 seções, contato, Esc fecha só o modal de cima, atalho a partir de "O que é enviado?".
