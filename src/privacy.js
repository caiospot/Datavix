/* Datavix: política de privacidade (PT/EN), aberta em modal pelo rodapé e pela pesquisa de satisfação.
   O texto descreve o que o código faz hoje: se mudar o que é guardado ou enviado, atualize aqui e PRIV_DATE. */
const PRIV_DATE = '2026-10-06';
const PRIV_ISSUES = 'https://github.com/caiospot/Datavix/issues';
const PRIV = {
  pt: {
    title: 'Política de Privacidade',
    upd: 'Atualizada em 6 de outubro de 2026',
    close: 'Fechar',
    link: 'Privacidade',
    sec: [
      ['Em resumo', [
        ['ul', [
          'A sua planilha é lida e processada no seu navegador. Ela não é enviada para nenhum servidor.',
          'Não usamos cookies, anúncios nem ferramentas de análise de uso (analytics).',
          'A única coisa que pode sair do seu navegador é a sua resposta à pesquisa de satisfação, e só se você decidir responder.',
        ]],
      ]],
      ['Quem é o responsável', [
        ['p', 'O Datavix é mantido por Caio (GitHub: caiospot), responsável pelo tratamento dos dados descritos aqui, nos termos da Lei Geral de Proteção de Dados (LGPD, Lei nº 13.709/2018).'],
      ]],
      ['O que fica só no seu navegador', [
        ['ul', [
          'A planilha: é lida por um leitor que roda no próprio navegador. O arquivo e o seu conteúdo não são enviados para nós nem para terceiros.',
          'Projetos recentes: ao salvar, o app guarda neste navegador (IndexedDB) um resumo da peça: os dados já agregados usados no gráfico, o título, o nome do arquivo e as configurações visuais, até 20 projetos. Isso pode incluir nomes de categorias e valores da sua planilha. Você apaga cada projeto no app ou limpando os dados do site no navegador.',
          'Preferências (localStorage): se o painel lateral fica aberto, quais tutoriais você já viu e, se a pesquisa de satisfação estiver ativa, um contador de uso e as datas das últimas perguntas.',
          'Uso offline: ao instalar o app (PWA), o navegador guarda uma cópia dos arquivos do Datavix para ele abrir sem internet.',
          'Arquivos exportados (HTML, PNG, ZIP) são salvos no seu computador. O HTML exportado contém os dados do gráfico, funciona sem internet e não carrega rastreadores. Pense bem antes de compartilhá-lo.',
        ]],
      ]],
      ['Pesquisa de satisfação (NPS e 👍/👎)', [
        ['p', 'Em alguns momentos o Datavix pergunta se você recomendaria o app ou se o gráfico sugerido serviu. É opcional e você pode fechar sem responder. Também dá para enviar feedback a qualquer hora pelo link "Enviar feedback".'],
        ['h', 'O que é enviado, se você responder'],
        ['ul', [
          'A nota e o comentário que você escrever.',
          'O seu e-mail, somente se você marcar que aceita contato.',
          'Idioma, tema, tipo de gráfico, se o app está instalado e a versão do app.',
          'Faixas aproximadas (linhas e colunas da planilha, tamanho da tela), sistema operacional e navegador.',
          'Um código anônimo gerado neste navegador, para a mesma pessoa não ser contada duas vezes. Ele identifica o navegador, não você, e muda se você limpar os dados do site.',
        ]],
        ['h', 'O que nunca é enviado'],
        ['ul', [
          'A planilha, os valores ou os nomes das colunas.',
          'O nome do arquivo, o título ou os insights da peça.',
          'Qualquer coisa dos projetos salvos.',
        ]],
        ['p', 'No campo de comentário, não escreva dados pessoais, sensíveis ou confidenciais.'],
        ['h', 'Para onde vai e por quanto tempo'],
        ['p', 'As respostas são gravadas numa planilha do Google do responsável, por meio de um Google Apps Script. O Google trata esses dados na infraestrutura dele, que pode ficar fora do Brasil (transferência internacional, art. 33 da LGPD). Como em qualquer conexão com a internet, o Google recebe o seu endereço IP; o Datavix não grava o IP na planilha.'],
        ['p', 'Usamos as respostas para melhorar o produto, entender se os gráficos sugeridos funcionam e, se você pediu, entrar em contato. Mantemos as respostas por até 24 meses; depois disso elas são apagadas ou anonimizadas. Não vendemos nem compartilhamos as respostas com terceiros.'],
        ['p', 'Base legal: o seu consentimento (art. 7º, I da LGPD). Responder é voluntário e você pode retirar o consentimento a qualquer momento, pedindo a exclusão.'],
      ]],
      ['Hospedagem e conexões', [
        ['p', 'O site é servido pelo GitHub Pages. Ao acessar o site, o GitHub pode registrar dados da requisição, como o endereço IP, segundo a política de privacidade dele. Depois de carregado, o Datavix não faz outras conexões além da resposta à pesquisa de satisfação (Google). As fontes e as bibliotecas vêm embutidas no app, sem CDN de terceiros.'],
      ]],
      ['Seus direitos', [
        ['p', 'Pela LGPD (art. 18) você pode pedir: confirmação de que tratamos seus dados, acesso, correção, anonimização, bloqueio ou eliminação, portabilidade, informação sobre com quem compartilhamos e a revogação do consentimento.'],
        ['p', 'Para exercer esses direitos sobre as respostas da pesquisa, entre em contato e informe o seu código anônimo (ele aparece em "O que é enviado?", na própria pesquisa) ou o e-mail que você deixou. Sem um dos dois não conseguimos localizar as suas respostas. Respondemos em até 15 dias.'],
        ['p', 'Os dados guardados no seu navegador estão sob o seu controle: você os apaga a qualquer momento. Se não ficar satisfeito, você também pode reclamar à Autoridade Nacional de Proteção de Dados (ANPD).'],
      ]],
      ['Crianças e adolescentes', [
        ['p', 'O Datavix não é direcionado a crianças e adolescentes e não coleta dados deles de forma intencional.'],
      ]],
      ['Segurança', [
        ['p', 'O site usa HTTPS e uma política de segurança de conteúdo (CSP) que impede o app de se conectar a outros endereços além dos necessários para a pesquisa. O acesso à planilha com as respostas é restrito ao responsável.'],
      ]],
      ['Alterações', [
        ['p', 'Se essa política mudar, atualizamos a data no topo. Mudanças relevantes são avisadas no próprio site.'],
      ]],
    ],
    ct_h: 'Contato',
    ct_mail: ['Para dúvidas e pedidos sobre seus dados, escreva para ', '.'],
    ct_gh: 'Para dúvidas e pedidos sobre seus dados, abra uma conversa em',
    ct_gh2: '(não escreva dados pessoais no texto público; peça um contato privado e responderemos).',
  },
  en: {
    title: 'Privacy Policy',
    upd: 'Updated on October 6, 2026',
    close: 'Close',
    link: 'Privacy',
    sec: [
      ['In short', [
        ['ul', [
          'Your spreadsheet is read and processed in your browser. It is not sent to any server.',
          'We use no cookies, ads or usage analytics.',
          'The only thing that can leave your browser is your answer to the satisfaction survey, and only if you choose to answer.',
        ]],
      ]],
      ['Who is responsible', [
        ['p', 'Datavix is maintained by Caio (GitHub: caiospot), who is responsible for the processing of the data described here under the Brazilian General Data Protection Law (LGPD, Law No. 13,709/2018).'],
      ]],
      ['What stays only in your browser', [
        ['ul', [
          'The spreadsheet: it is read by a reader running in the browser itself. The file and its contents are not sent to us or to third parties.',
          'Recent projects: when you save, the app keeps in this browser (IndexedDB) a summary of the piece: the already aggregated data used by the chart, the title, the file name and the visual settings, up to 20 projects. This may include category names and values from your spreadsheet. You delete each project in the app or by clearing the site data in your browser.',
          'Preferences (localStorage): whether the side panel is open, which tutorials you have already seen and, if the satisfaction survey is active, a usage counter and the dates of the last questions.',
          'Offline use: when you install the app (PWA), the browser keeps a copy of the Datavix files so it can open without internet.',
          'Exported files (HTML, PNG, ZIP) are saved to your computer. The exported HTML contains the chart data, works offline and loads no trackers. Think before sharing it.',
        ]],
      ]],
      ['Satisfaction survey (NPS and 👍/👎)', [
        ['p', 'At some moments Datavix asks whether you would recommend the app or whether the suggested chart worked. It is optional and you can close it without answering. You can also send feedback any time with the "Send feedback" link.'],
        ['h', 'What is sent, if you answer'],
        ['ul', [
          'The score and the comment you write.',
          'Your email, only if you tick that you agree to be contacted.',
          'Language, theme, chart type, whether the app is installed and the app version.',
          'Approximate ranges (spreadsheet rows and columns, screen size), operating system and browser.',
          'An anonymous code generated in this browser, so the same person is not counted twice. It identifies the browser, not you, and changes if you clear the site data.',
        ]],
        ['h', 'What is never sent'],
        ['ul', [
          'The spreadsheet, the values or the column names.',
          'The file name, the title or the insights of the piece.',
          'Anything from saved projects.',
        ]],
        ['p', 'In the comment field, do not write personal, sensitive or confidential data.'],
        ['h', 'Where it goes and for how long'],
        ['p', 'Answers are written to a Google spreadsheet owned by the maintainer, through a Google Apps Script. Google processes this data on its own infrastructure, which may be outside Brazil (international transfer, art. 33 of the LGPD). As with any internet connection, Google receives your IP address; Datavix does not write the IP to the spreadsheet.'],
        ['p', 'We use the answers to improve the product, to understand whether suggested charts work and, if you asked, to get in touch. We keep answers for up to 24 months; after that they are deleted or anonymized. We do not sell or share the answers with third parties.'],
        ['p', 'Legal basis: your consent (art. 7, I of the LGPD). Answering is voluntary and you can withdraw consent at any time by asking for deletion.'],
      ]],
      ['Hosting and connections', [
        ['p', 'The site is served by GitHub Pages. When you visit the site, GitHub may log request data such as the IP address, under its own privacy policy. Once loaded, Datavix makes no other connections besides the satisfaction survey answer (Google). Fonts and libraries are embedded in the app, with no third-party CDN.'],
      ]],
      ['Your rights', [
        ['p', 'Under the LGPD (art. 18) you may ask for: confirmation that we process your data, access, correction, anonymization, blocking or deletion, portability, information about who we share data with, and withdrawal of consent.'],
        ['p', 'To exercise these rights over survey answers, get in touch and give your anonymous code (shown in "What is sent?", inside the survey) or the email you left. Without one of them we cannot find your answers. We reply within 15 days.'],
        ['p', 'Data stored in your browser is under your control: delete it any time. If you are not satisfied, you may also complain to the Brazilian data protection authority (ANPD).'],
      ]],
      ['Children and teenagers', [
        ['p', 'Datavix is not aimed at children or teenagers and does not knowingly collect their data.'],
      ]],
      ['Security', [
        ['p', 'The site uses HTTPS and a content security policy (CSP) that keeps the app from connecting to addresses other than those needed for the survey. Access to the spreadsheet with the answers is restricted to the maintainer.'],
      ]],
      ['Changes', [
        ['p', 'If this policy changes, we update the date at the top. Relevant changes are announced on the site itself.'],
      ]],
    ],
    ct_h: 'Contact',
    ct_mail: ['For questions and requests about your data, write to ', '.'],
    ct_gh: 'For questions and requests about your data, open a conversation at',
    ct_gh2: '(do not write personal data in the public text; ask for a private contact and we will reply).',
  },
};
const privT = () => PRIV[LANG] || PRIV.pt;
function privBody() {
  const p = privT(), mail = window.__DV && window.__DV.contact;
  const blocks = p.sec.map(([h, items]) => `<h4 class="pv-h">${esc(h)}</h4>` + items.map(([k, v]) => k === 'ul' ? `<ul class="nc-list">${v.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : k === 'h' ? `<h5 class="pv-s">${esc(v)}</h5>` : `<p class="pv-p">${esc(v)}</p>`).join('')).join('');
  const contact = mail ? `<p class="pv-p">${esc(p.ct_mail[0])}<a href="mailto:${esc(mail)}">${esc(mail)}</a>${esc(p.ct_mail[1])}</p>` : `<p class="pv-p">${esc(p.ct_gh)} <a href="${PRIV_ISSUES}" target="_blank" rel="noopener noreferrer">${PRIV_ISSUES.replace('https://', '')}</a> ${esc(p.ct_gh2)}</p>`;
  return `<p class="note" style="margin:0 0 4px">${esc(p.upd)}</p>${blocks}<h4 class="pv-h">${esc(p.ct_h)}</h4>${contact}`;
}
function openPrivacy() {
  const p = privT();
  return modal({ title: esc(p.title), body: `<div class="pv">${privBody()}</div>`, actions: [{ label: p.close, v: null, kind: 'primary' }], onOpen: m => { m.querySelector('.mdl-box').style.width = 'min(680px, 100%)'; } });
}
