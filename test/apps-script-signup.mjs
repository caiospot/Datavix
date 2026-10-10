// Roda o Code.gs com simulações do Google e confere o cadastro (aba Cadastros) e que a pesquisa continua igual. Uso: node test/apps-script-signup.mjs
import fs from 'node:fs'; import vm from 'node:vm';
const rows = { Cadastros: [['E-mails cadastrados']], NPS: [] }, cache = new Map(); let fails = 0;
const ok = (n, c) => { if (!c) { fails++; console.log('FALHOU', n); } else console.log('ok   ', n); };
const range = (aba, r, c, n) => ({ createTextFinder: t => { let m = true, mc = false; const f = { matchEntireCell: v => { m = v; return f; }, matchCase: v => { mc = v; return f; }, findNext: () => rows[aba].slice(r - 1, r - 1 + n).find(x => (mc ? x[c - 1] === t : String(x[c - 1]).toLowerCase() === String(t).toLowerCase())) || null }; return f; }, getValue: () => (rows[aba][0] || [])[c - 1] || '', setValue: v => { rows[aba][0][c - 1] = v; } });
const sheet = aba => ({ getLastRow: () => rows[aba].length, appendRow: l => rows[aba].push(l), setFrozenRows() {}, getRange: (a, b, c, d) => (typeof a === 'string' ? range(aba, 1, a === 'B1' ? 2 : 3, 1) : range(aba, a, b, c)) });
const ctx = { console, Date, JSON, Number, String, Math, Object,
  PropertiesService: { getScriptProperties: () => ({ getProperty: () => 'tok' }) },
  CacheService: { getScriptCache: () => ({ get: k => cache.get(k), put: (k, v) => cache.set(k, v) }) },
  LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
  ContentService: { MimeType: { JSON: 'json' }, createTextOutput: t => ({ t, setMimeType() { return this; } }) },
  SpreadsheetApp: { getActive: () => ({ getSheetByName: n => (rows[n] ? sheet(n) : null), insertSheet: n => { rows[n] = []; return sheet(n); } }) } };
vm.createContext(ctx); vm.runInContext(fs.readFileSync(new URL('../nps/apps-script/Code.gs', import.meta.url), 'utf8'), ctx);
const post = o => JSON.parse(vm.runInContext('doPost', ctx)({ postData: { contents: JSON.stringify(o) } }).t);
const base = { v: 1, id: 'abc', ev: 'signup', lang: 'pt', token: 'tok' };
let r = post({ ...base, rid: 'r1', email: 'Ana@Empresa.com' }); ok('grava', r.ok && rows.Cadastros.length === 2 && rows.Cadastros[1][0] === 'ana@empresa.com' && rows.Cadastros[1][2] === 'pt');
ok('cabeçalhos B e C criados', rows.Cadastros[0][1] === 'recebido_em' && rows.Cadastros[0][2] === 'idioma' && rows.Cadastros[0][0] === 'E-mails cadastrados');
r = post({ ...base, rid: 'r2', email: 'ANA@empresa.com' }); ok('não repete (maiúsculas)', r.ok && r.repetido && rows.Cadastros.length === 2);
r = post({ ...base, rid: 'r3', email: 'sem-arroba' }); ok('recusa e-mail inválido', !r.ok && r.error === 'formato');
r = post({ ...base, rid: 'r4', email: 'x'.repeat(250) + '@a.com' }); ok('recusa e-mail enorme', !r.ok);
r = post({ ...base, token: 'errado', rid: 'r5', email: 'b@b.com' }); ok('recusa token errado', !r.ok && r.error === 'token');
r = post({ ...base, rid: 'r6', email: '=cmd@x.com', id: 'zz' }); ok('fórmula neutralizada', r.ok && rows.Cadastros[2][0] === "'=cmd@x.com");
for (let i = 0; i < 6; i++) r = post({ ...base, id: 'spam', rid: 'm' + i, email: `u${i}@x.com` }); ok('limite por código', !r.ok && r.error === 'limite');
r = post({ v: 1, rid: 'n1', id: 'q', ev: 'nps', score: 9, token: 'tok' }); ok('NPS continua gravando', r.ok && rows.NPS.length === 1);
console.log(fails ? 'FALHAS: ' + fails : 'tudo certo'); process.exit(fails ? 1 : 0);
