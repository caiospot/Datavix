# NPS do Datavix → Google Sheets

O app envia as respostas da pesquisa para um **Google Apps Script** publicado na sua conta, que grava uma linha por resposta numa planilha sua. Não há servidor nosso no meio.

## O que é enviado (e o que nunca é)
- **Enviado:** nota (0–10) ou 👍/👎, comentário, e-mail (só se a pessoa marcar "pode entrar em contato"), idioma, tema, tipo de gráfico, se o app está instalado, faixas aproximadas (linhas e colunas da planilha, tamanho da tela), sistema e navegador, versão do app e um **código anônimo** gerado no navegador.
- **Nunca enviado:** a planilha, valores, nomes de colunas, nome do arquivo, título e insights.
- A pesquisa aparece só no app (não no HTML exportado). O botão "Enviar feedback" está no editor e no rodapé da landing.

## Instalação (uma vez, uns 10 minutos)
1. Crie uma planilha no Google Sheets (ex.: "Datavix · NPS").
2. Menu **Extensões → Apps Script**. Apague o conteúdo e cole `nps/apps-script/Code.gs`. Salve.
3. Na lista de funções escolha **setup** e clique em **Executar** (autorize quando pedir). Isso cria a aba **NPS** (cabeçalho) e a aba **Resumo** (NPS, distribuição, "o gráfico serviu?", NPS por tipo de gráfico e quem pediu contato).
4. **Configurações do projeto (engrenagem) → Propriedades do script → Adicionar:** nome `TOKEN`, valor uma senha qualquer (gere uma com `openssl rand -hex 16` no terminal).
5. **Implantar → Nova implantação → tipo "App da Web".** Executar como: **Eu**. Quem tem acesso: **Qualquer pessoa**. Copie o **URL** que termina em `/exec`.
6. Gere o app com o URL e o token:
   ```bash
   DATAVIX_NPS_URL="https://script.google.com/macros/s/XXXX/exec" DATAVIX_NPS_TOKEN="a-mesma-senha" node build.mjs
   ```
   O resultado vai para `index.html` e para a pasta `dist/`.
7. Teste: abra o app, gere uma peça, clique em **Enviar feedback** no painel do editor e responda. A linha deve aparecer na aba NPS.

Se você alterar o `Code.gs` depois, use **Implantar → Gerenciar implantações → editar → Nova versão** (o URL continua o mesmo).

## Quando a pergunta aparece
- **NPS (0–10):** depois de exportar ou sair da apresentação, **depois de 3 ações** (gerar, exportar, apresentar). No máximo **1 vez a cada 30 dias**; se a pessoa fechar no ×, só volta em **90 dias**.
- **"O gráfico sugerido serviu?" 👍/👎:** ~20 s depois de gerar a peça, e "A apresentação ficou como você queria?" ao sair da apresentação. No máximo 1 vez a cada 7 dias, até 4 vezes por pessoa.
- **Uma pergunta por sessão.** Nunca durante carregamento, mapeamento, tutorial, modal ou apresentação. Desligada com `?nonps` na URL ou quando o navegador envia "Do Not Track".

## Limites e cuidados (honestos)
- O **token é público** (está no código do app): serve para barrar tráfego aleatório, não é segredo. O script ainda valida formato e tamanho, limita **30 respostas por código a cada 6 h**, ignora reenvios do mesmo `rid` e neutraliza texto que começaria uma fórmula (`=`, `+`, `-`, `@`).
- Como o envio usa `no-cors`, o app **não consegue confirmar** a entrega: guarda a resposta numa fila local (IndexedDB) e reenvia quando houver rede. Bloqueadores de anúncio/privacidade podem impedir o envio.
- Cota gratuita do Apps Script: dezenas de milhares de execuções por dia; muito acima do necessário para NPS.
- **LGPD:** o código anônimo é pseudônimo (identifica o navegador, não a pessoa). E-mail só com consentimento explícito. Para atender um pedido de exclusão, a pessoa informa o código (aparece em "O que é enviado?") e você apaga as linhas com aquele `id`. Atualize a política de privacidade do site quando publicar.
