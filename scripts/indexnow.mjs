// Avisa o Bing e os demais buscadores do IndexNow (o Google não participa) que as páginas do sitemap mudaram. MANUAL: só envia com --send.
// Antes: crie uma chave (letras, números e hífen, 8 a 128 caracteres), defina a variável DATAVIX_INDEXNOW_KEY no GitHub, publique (o build grava /<chave>.txt na raiz) e só então rode:
//   node scripts/indexnow.mjs https://datavix.app SUA-CHAVE --send        (sem --send só mostra o que seria enviado)
import fs from 'node:fs';
const [origin, key] = process.argv.slice(2).filter(a => !a.startsWith('--')), send = process.argv.includes('--send');
if (!/^https:\/\/[a-z0-9.-]+$/.test(origin || '') || !/^[a-zA-Z0-9-]{8,128}$/.test(key || '')) { console.error('uso: node scripts/indexnow.mjs https://datavix.app CHAVE [--send]'); process.exit(1); }
const sm = fs.readFileSync(new URL('../dist/sitemap.xml', import.meta.url), 'utf8'), urlList = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
const body = { host: new URL(origin).host, key, keyLocation: `${origin}/${key}.txt`, urlList };
console.log(`${urlList.length} URLs; chave em ${body.keyLocation}`);
if (!send) { console.log('(simulação: nada foi enviado; use --send para enviar)'); process.exit(0); }
const kf = await fetch(body.keyLocation); if (!kf.ok || (await kf.text()).trim() !== key) { console.error('a chave ainda não está no ar em', body.keyLocation); process.exit(1); }
const r = await fetch('https://api.indexnow.org/indexnow', { method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8' }, body: JSON.stringify(body) });
console.log('IndexNow respondeu', r.status, r.status === 200 || r.status === 202 ? '(aceito)' : '(veja a resposta)');
