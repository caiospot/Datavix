/**
 * Datavix NPS: recebe as respostas do app e grava numa planilha do Google.
 * Também recebe os cadastros (ev 'signup': e-mail de quem começa a usar o app) e grava na aba Cadastros.
 * Instalação: veja nps/LEIA-ME.md. Resumo: cole este arquivo num projeto do Apps Script ligado à planilha,
 * rode setup() uma vez, defina a propriedade TOKEN e publique como "Aplicativo da Web".
 */
const ABA = 'NPS';
const ABA_CADASTROS = 'Cadastros'; // aba dos e-mails de quem começa a usar o app: coluna A "E-mails cadastrados", B recebido_em, C idioma
const COLUNAS = ['recebido_em', 'ts', 'ev', 'moment', 'score', 'comment', 'contact', 'email', 'topic', 'why', 'id', 'rid', 'lang', 'theme', 'app', 'mode', 'chart', 'suggested', 'switched', 'rows', 'cols', 'os', 'browser', 'screen', 'usage'];
const LIMITE_POR_CODIGO = 30; // respostas por código anônimo a cada 6 horas (anti-abuso)
const LIMITE_CADASTROS = 5; // cadastros por código anônimo a cada 6 horas

function doGet() { return saida_({ ok: true, service: 'datavix-nps' }); }

function doPost(e) {
  try {
    const raw = (e && e.postData && e.postData.contents) || '';
    if (!raw || raw.length > 6000) return saida_({ ok: false, error: 'tamanho' });
    const p = JSON.parse(raw);
    const token = PropertiesService.getScriptProperties().getProperty('TOKEN');
    if (token && p.token !== token) return saida_({ ok: false, error: 'token' });
    if (p.ev === 'signup') return cadastro_(p);
    if (p.v !== 1 || !p.rid || !p.id || !/^(nps|thumb)$/.test(p.ev)) return saida_({ ok: false, error: 'formato' });
    const nota = Number(p.score);
    if (!(nota >= 0 && nota <= 10)) return saida_({ ok: false, error: 'nota' });
    const cache = CacheService.getScriptCache(), chave = 'n_' + String(p.id).slice(0, 64), usados = Number(cache.get(chave) || 0);
    if (usados >= LIMITE_POR_CODIGO) return saida_({ ok: false, error: 'limite' });
    cache.put(chave, String(usados + 1), 21600);
    const lock = LockService.getScriptLock(); lock.waitLock(15000);
    try {
      const aba = abaNps_(), ultima = aba.getLastRow(), colRid = COLUNAS.indexOf('rid') + 1;
      // o app reenvia o que ficou na fila: o mesmo rid nunca entra duas vezes
      if (ultima > 1 && aba.getRange(2, colRid, ultima - 1, 1).createTextFinder(String(p.rid)).matchEntireCell(true).findNext()) return saida_({ ok: true, repetido: true });
      const linha = COLUNAS.map(c => c === 'recebido_em' ? new Date() : limpar_(c === 'why' ? (p.why || []).join(',') : p[c]));
      aba.appendRow(linha);
    } finally { lock.releaseLock(); }
    return saida_({ ok: true });
  } catch (err) { return saida_({ ok: false, error: 'erro' }); }
}

// cadastro: grava o e-mail na aba "Cadastros" (sem repetir o mesmo e-mail, sem diferenciar maiúsculas)
function cadastro_(p) {
  const email = String(p.email || '').trim().toLowerCase();
  if (p.v !== 1 || !p.rid || !p.id || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return saida_({ ok: false, error: 'formato' });
  const cache = CacheService.getScriptCache(), chave = 's_' + String(p.id).slice(0, 64), usados = Number(cache.get(chave) || 0);
  if (usados >= LIMITE_CADASTROS) return saida_({ ok: false, error: 'limite' });
  cache.put(chave, String(usados + 1), 21600);
  const lock = LockService.getScriptLock(); lock.waitLock(15000);
  try {
    const aba = abaCadastros_(), ultima = aba.getLastRow();
    if (ultima > 1 && aba.getRange(2, 1, ultima - 1, 1).createTextFinder(email).matchEntireCell(true).matchCase(false).findNext()) return saida_({ ok: true, repetido: true });
    aba.appendRow([limpar_(email), new Date(), limpar_(p.lang)]);
  } finally { lock.releaseLock(); }
  return saida_({ ok: true });
}
function abaCadastros_() {
  const ss = SpreadsheetApp.getActive(); let aba = ss.getSheetByName(ABA_CADASTROS);
  if (!aba) { aba = ss.insertSheet(ABA_CADASTROS); aba.appendRow(['E-mails cadastrados', 'recebido_em', 'idioma']); aba.setFrozenRows(1); }
  else { if (!aba.getRange('B1').getValue()) aba.getRange('B1').setValue('recebido_em'); if (!aba.getRange('C1').getValue()) aba.getRange('C1').setValue('idioma'); }
  return aba;
}

// texto vindo do navegador nunca vira fórmula na planilha (= + - @) e tem tamanho limitado
function limpar_(v) {
  if (v === undefined || v === null) return '';
  if (typeof v === 'boolean' || typeof v === 'number') return v;
  let s = String(v).slice(0, 600);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return s;
}
function saida_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function abaNps_() {
  const ss = SpreadsheetApp.getActive(); let aba = ss.getSheetByName(ABA);
  if (!aba) { aba = ss.insertSheet(ABA); aba.appendRow(COLUNAS); aba.setFrozenRows(1); }
  return aba;
}

/** Rode uma vez: cria a aba NPS (cabeçalho) e a aba Resumo (NPS, distribuição e "o gráfico serviu?"). */
function setup() {
  abaNps_(); abaCadastros_();
  const ss = SpreadsheetApp.getActive(); let r = ss.getSheetByName('Resumo'); if (!r) r = ss.insertSheet('Resumo'); r.clear();
  const c = n => 'NPS!' + String.fromCharCode(64 + COLUNAS.indexOf(n) + 1) + ':' + String.fromCharCode(64 + COLUNAS.indexOf(n) + 1);
  const ev = c('ev'), nota = c('score');
  r.getRange('A1:B8').setValues([
    ['Resumo do NPS', ''],
    ['Respostas de NPS', '=COUNTIFS(' + ev + ',"nps")'],
    ['Promotores (9 e 10)', '=COUNTIFS(' + ev + ',"nps",' + nota + ',">=9")'],
    ['Neutros (7 e 8)', '=COUNTIFS(' + ev + ',"nps",' + nota + ',">=7",' + nota + ',"<=8")'],
    ['Detratores (0 a 6)', '=COUNTIFS(' + ev + ',"nps",' + nota + ',"<=6")'],
    ['NPS (promotores − detratores, em %)', '=IFERROR((B3-B5)/B2*100,"")'],
    ['"O gráfico serviu?" (respostas)', '=COUNTIFS(' + ev + ',"thumb")'],
    ['"O gráfico serviu?" (% sim)', '=IFERROR(COUNTIFS(' + ev + ',"thumb",' + nota + ',1)/B7,"")'],
  ]);
  r.getRange('A10').setValue('NPS por tipo de gráfico');
  r.getRange('A11').setFormula('=IFERROR(QUERY(NPS!A2:Y,"select Col17, count(Col5), avg(Col5) where Col3=\'nps\' and Col17 is not null group by Col17 order by avg(Col5) desc label count(Col5) \'Respostas\', avg(Col5) \'Nota média\'",0),"")');
  r.getRange('D10').setValue('Quem pediu contato');
  r.getRange('D11').setFormula('=IFERROR(FILTER({NPS!B2:B,NPS!E2:E,NPS!F2:F,NPS!H2:H},NPS!G2:G=TRUE,NPS!H2:H<>""),"")');
  r.getRange('A1').setFontWeight('bold'); r.setColumnWidth(1, 300); r.setColumnWidth(4, 160);
}
