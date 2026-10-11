// Testa o Apps Script de verdade: manda um cadastro de teste e mostra a resposta do Google.
// Uso: DATAVIX_NPS_URL="https://script.google.com/macros/s/XXXX/exec" DATAVIX_NPS_TOKEN="..." node nps/testar-cadastro.mjs [email]
// (ou coloque as duas variáveis num arquivo .env.local na raiz). Se der certo, o e-mail aparece na aba Cadastros.
import fs from 'node:fs';
try { for (const ln of fs.readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) { const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(ln); if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, ''); } } catch (e) { /* sem .env.local */ }
const url = process.env.DATAVIX_NPS_URL, token = process.env.DATAVIX_NPS_TOKEN || '';
if (!url) { console.log('Falta DATAVIX_NPS_URL (o URL do app da web, terminado em /exec).'); process.exit(1); }
if (!/^https:\/\/script\.google\.com\/macros\/s\/[\w-]{10,}\/exec$/.test(url)) { console.log('O URL não parece o do Apps Script. Ele deve ser igual a https://script.google.com/macros/s/AKfy.../exec (copie em Implantar > Gerenciar implantações). Recebi:', url); process.exit(1); }
if (!token || /COLE_AQUI|seu-token/i.test(token)) console.log('Aviso: o token está vazio ou é o texto de exemplo; se o script exige TOKEN, vai responder "token".');
const email = process.argv[2] || `teste+${Date.now().toString(36)}@datavix.app`;
const body = { v: 1, rid: 'teste-' + Math.random().toString(36).slice(2), id: 'teste-cadastro', ts: new Date().toISOString(), ev: 'signup', email, lang: 'pt', app: 'teste', token };
let r; try { r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body), redirect: 'follow' }); } catch (e) { console.log('Não consegui falar com o Google:', e.message); process.exit(1); }
const txt = await r.text(); console.log('HTTP', r.status, '| e-mail enviado:', email); console.log(txt.slice(0, 400));
let j = null; try { j = JSON.parse(txt); } catch (e) { /* não é JSON */ }
if (j && j.ok) console.log(j.repetido ? '\nOK, mas esse e-mail já existia na aba Cadastros.' : '\nOK: confira a aba Cadastros, deve ter uma linha nova.');
else if (j && j.error === 'formato') console.log('\nO script respondeu "formato": é o Code.gs ANTIGO. Cole o novo nps/apps-script/Code.gs e use Implantar > Gerenciar implantações > editar > Nova versão.');
else if (j && j.error === 'token') console.log('\nToken diferente da propriedade TOKEN do Apps Script.');
else if (j && j.error === 'limite') console.log('\nLimite de 5 cadastros por código a cada 6 h (use outro id ou espere).');
else console.log('\nResposta inesperada: confira se o URL é o do "App da Web" (Quem tem acesso: Qualquer pessoa).');
process.exit(j && j.ok ? 0 : 1);
