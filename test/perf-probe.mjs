// Medição de carga em celular (Slow 4G simulado, CPU 4x mais lenta, tela de 412 px): FCP, LCP, CLS, TBT aproximado e bytes. Serve a pasta com gzip. Uso: node test/perf-probe.mjs <pasta> [caminho] [segundos]  (ex.: node test/perf-probe.mjs dist / 10)
import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
const DIR = path.resolve(process.argv[2]), URLP = process.argv[3] || '/', WAIT = +(process.argv[4] || 40), PORT = 8795, CH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const mime = { html: 'text/html; charset=utf-8', js: 'text/javascript', webmanifest: 'application/manifest+json', png: 'image/png', css: 'text/css', svg: 'image/svg+xml', webp: 'image/webp', txt: 'text/plain; charset=utf-8', xml: 'application/xml', ico: 'image/x-icon', woff2: 'font/woff2' };
const gz = new Map();
const srv = http.createServer((q, s) => { const u = new URL(q.url, 'http://x'); let p = decodeURIComponent(u.pathname); if (p.endsWith('/')) p += 'index.html'; const f = path.join(DIR, p); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { s.statusCode = 404; return s.end('404'); }
  const ext = f.split('.').pop(); s.setHeader('Content-Type', mime[ext] || 'application/octet-stream'); s.setHeader('Cache-Control', 'no-cache');
  if (/gzip/.test(q.headers['accept-encoding'] || '') && ['html', 'js', 'css', 'svg', 'txt', 'xml'].includes(ext)) { if (!gz.has(f)) gz.set(f, zlib.gzipSync(fs.readFileSync(f), { level: 6 })); s.setHeader('Content-Encoding', 'gzip'); return s.end(gz.get(f)); } fs.createReadStream(f).pipe(s); }).listen(PORT);
const port = 9600 + Math.floor(Math.random() * 200), proc = spawn(CH, ['--headless=new', '--disable-gpu', '--no-first-run', `--remote-debugging-port=${port}`, `--user-data-dir=/tmp/chr-perf-${port}`, 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let targets; for (let i = 0; i < 40; i++) { try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if (targets.length) break; } catch (e) { /* subindo */ } await sleep(250); }
const ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl); await new Promise(r => (ws.onopen = r));
let id = 0, bytes = 0, reqs = 0; const pend = new Map();
ws.onmessage = m => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } else if (d.method === 'Network.loadingFinished') { bytes += d.params.encodedDataLength; reqs++; } };
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
await send('Page.enable'); await send('Network.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 412, height: 823, deviceScaleFactor: 2.625, mobile: true });
await send('Network.setUserAgentOverride', { userAgent: 'Mozilla/5.0 (Linux; Android 11; moto g power (2022)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36' });
await send('Emulation.setCPUThrottlingRate', { rate: 4 });
await send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 1.6 * 1024 * 1024 / 8, uploadThroughput: 750 * 1024 / 8 });
await send('Page.addScriptToEvaluateOnNewDocument', { source: `(() => { const m = window.__m = { fcp: 0, lcp: 0, lcpEl: '', cls: 0, lt: [] };
  try { new PerformanceObserver(l => { for (const e of l.getEntries()) if (e.name === 'first-contentful-paint') m.fcp = e.startTime; }).observe({ type: 'paint', buffered: true }); } catch (e) {}
  try { new PerformanceObserver(l => { for (const e of l.getEntries()) { m.lcp = e.startTime; m.lcpEl = (e.element ? e.element.tagName + (e.element.className ? '.' + String(e.element.className).slice(0, 30) : '') : '') + ' ' + (e.size || 0); } }).observe({ type: 'largest-contentful-paint', buffered: true }); } catch (e) {}
  try { new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) m.cls += e.value; }).observe({ type: 'layout-shift', buffered: true }); } catch (e) {}
  try { new PerformanceObserver(l => { for (const e of l.getEntries()) m.lt.push([Math.round(e.startTime), Math.round(e.duration)]); }).observe({ type: 'longtask', buffered: true }); } catch (e) {} })()` });
const t0 = Date.now(); await send('Page.navigate', { url: `http://127.0.0.1:${PORT}${URLP}` });
await sleep(WAIT * 1000);
const r = await send('Runtime.evaluate', { expression: "JSON.stringify({ m: window.__m, nav: (() => { const n = performance.getEntriesByType('navigation')[0]; return n ? { dcl: Math.round(n.domContentLoadedEventEnd), load: Math.round(n.loadEventEnd), ttfb: Math.round(n.responseStart), transfer: n.transferSize } : null; })(), title: document.title, text: document.body ? document.body.innerText.replace(/\\\\s+/g, ' ').slice(0, 80) : '' })", returnByValue: true });
const d = JSON.parse(r.result.result.value), m = d.m; const tbt = m.lt.filter(([s]) => s >= m.fcp).reduce((a, [, dur]) => a + Math.max(0, dur - 50), 0);
console.log(JSON.stringify({ url: URLP, FCP_s: +(m.fcp / 1000).toFixed(1), LCP_s: +(m.lcp / 1000).toFixed(1), LCP_elemento: m.lcpEl, CLS: +m.cls.toFixed(3), TBT_ms: Math.round(tbt), tarefas_longas: m.lt.length, DCL_s: d.nav && +(d.nav.dcl / 1000).toFixed(1), load_s: d.nav && +(d.nav.load / 1000).toFixed(1), KB_transferidos: Math.round(bytes / 1024), requisicoes: reqs, titulo: d.title, texto: d.text }, null, 1));
ws.close(); proc.kill('SIGKILL'); srv.close(); process.exit(0);
