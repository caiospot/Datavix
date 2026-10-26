// Servidor estático simples para olhar o site montado (dist/): node test/serve-dist.mjs [pasta] [porta]. Entende /pasta/ → /pasta/index.html e dá 404 com /404.html.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(process.argv[2] || new URL('../dist', import.meta.url).pathname), port = +(process.argv[3] || 8780);
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml' };
http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x'); let f = path.join(root, decodeURIComponent(u.pathname));
  if (!f.startsWith(root)) { res.statusCode = 403; return res.end('403'); }
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) { if (!u.pathname.endsWith('/')) { res.statusCode = 301; res.setHeader('Location', u.pathname + '/'); return res.end(); } f = path.join(f, 'index.html'); }
  if (!fs.existsSync(f)) { res.statusCode = 404; res.setHeader('Content-Type', types['.html']); return res.end(fs.existsSync(path.join(root, '404.html')) ? fs.readFileSync(path.join(root, '404.html')) : '404'); }
  res.setHeader('Content-Type', types[path.extname(f)] || 'application/octet-stream'); res.setHeader('Cache-Control', 'no-cache'); fs.createReadStream(f).pipe(res);
}).listen(port, '127.0.0.1', () => console.log(`dist em http://127.0.0.1:${port}/ (${root})`));
