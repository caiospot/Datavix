// Servidor só para testes: serve a pasta e recebe POST /save?name=arquivo (grava em test/out/).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(new URL('..', import.meta.url).pathname);
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.csv': 'text/csv; charset=latin1', '.png': 'image/png', '.zip': 'application/zip', '.xlsx': 'application/octet-stream' };
http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  if (req.method === 'POST' && u.pathname === '/save') {
    const name = path.basename(u.searchParams.get('name') || 'out.bin'); const chunks = [];
    req.on('data', c => chunks.push(c)).on('end', () => { fs.writeFileSync(path.join(root, 'test/out', name), Buffer.concat(chunks)); res.end('ok'); });
    return;
  }
  if (u.pathname === '/nps') { // simula o Google Apps Script nos testes: grava cada envio e confere o token
    if (req.method === 'POST') { const chunks = []; req.on('data', c => chunks.push(c)).on('end', () => { const body = Buffer.concat(chunks).toString(); if (process.env.NPS_FAIL) { res.statusCode = 503; return res.end('fail'); } fs.appendFileSync(path.join(root, 'test/out/nps.jsonl'), body + '\n'); res.end('{"ok":true}'); }); return; }
    res.setHeader('Content-Type', 'text/plain'); return res.end(fs.existsSync(path.join(root, 'test/out/nps.jsonl')) ? fs.readFileSync(path.join(root, 'test/out/nps.jsonl')) : '');
  }
  const f = path.join(root, decodeURIComponent(u.pathname === '/' ? '/index.html' : u.pathname));
  if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.statusCode = 404; return res.end('404'); }
  res.setHeader('Content-Type', types[path.extname(f)] || 'application/octet-stream'); fs.createReadStream(f).pipe(res);
}).listen(8768, () => console.log('test server :8768'));
