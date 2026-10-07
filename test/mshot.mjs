// Captura telas em emulação de celular (toque, viewport móvel). Uso: node test/mshot.mjs <url> <pasta-saida> <passos.js> [LxA]
// passos.js: export default [{ name, js }]  (js roda na página; depois tira o print). Exibe o retorno de cada passo.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
const [url, out, stepsFile, dims] = process.argv.slice(2);
const [W, H] = (dims || '390x844').split('x').map(Number);
const CH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', port = 9333 + Math.floor(Math.random() * 500);
const proc = spawn(CH, ['--headless=new', '--disable-gpu', '--no-first-run', `--remote-debugging-port=${port}`, `--user-data-dir=/tmp/chr-${port}`, 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let targets; for (let i = 0; i < 40; i++) { try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if (targets.length) break; } catch (e) { /* subindo */ } await sleep(250); }
const ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl); await new Promise(r => (ws.onopen = r));
let id = 0; const pend = new Map(), logs = [];
ws.onmessage = m => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } else if (d.method === 'Runtime.consoleAPICalled' && /error|warn/.test(d.params.type)) logs.push(d.params.type + ': ' + d.params.args.map(a => a.value || a.description).join(' ').slice(0, 200)); else if (d.method === 'Runtime.exceptionThrown') logs.push('EXC ' + (d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text).slice(0, 200)); };
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
await send('Runtime.enable'); await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 2, mobile: true });
await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
await send('Emulation.setUserAgentOverride', { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1', platform: 'iPhone' });
await send('Page.navigate', { url }); await sleep(4000);
fs.mkdirSync(out, { recursive: true });
const steps = (await import(new URL(stepsFile, 'file://' + process.cwd() + '/'))).default;
const rect = async sel => (await send('Runtime.evaluate', { expression: `(()=>{const e=document.querySelector(${JSON.stringify(sel)}); if(!e) return null; const r=e.getBoundingClientRect(); return [r.left,r.top,r.width,r.height]})()`, returnByValue: true })).result.result.value;
let tid = 0; const touch = async (type, x, y) => { if (type === 'touchStart') tid++; return send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: tid }] }); };
async function act(a) {
  if (a.tap) { const r = await rect(a.tap); if (!r) { console.log('  (sem alvo: ' + a.tap + ')'); return; } const x = r[0] + r[2] * (a.at ? a.at[0] : .5), y = r[1] + r[3] * (a.at ? a.at[1] : .5); await touch('touchStart', x, y); await sleep(60); await touch('touchEnd'); await sleep(a.wait || 350); }
  if (a.drag) { const r = await rect(a.drag); if (!r) { console.log('  (sem alvo: ' + a.drag + ')'); return; } const x = r[0] + r[2] / 2; let y = r[1] + r[3] / 2; await touch('touchStart', x, y); for (let i = 1; i <= 8; i++) { y += (a.dy || 0) / 8; await touch('touchMove', x, y); await sleep(20); } await touch('touchEnd'); await sleep(500); }
  if (a.swipe) { const [x0, y0, x1, y1] = a.swipe; await touch('touchStart', x0, y0); for (let i = 1; i <= 8; i++) { await touch('touchMove', x0 + (x1 - x0) * i / 8, y0 + (y1 - y0) * i / 8); await sleep(20); } await touch('touchEnd'); await sleep(500); }
}
for (const s of steps) {
  for (const a of (s.pre || [])) await act(a);
  const r = await send('Runtime.evaluate', { expression: `(async()=>{${s.js}})()`, awaitPromise: true, returnByValue: true });
  await sleep(s.wait || 700);
  const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: !!s.full });
  fs.writeFileSync(`${out}/${s.name}.png`, Buffer.from(shot.result.data, 'base64'));
  const m = await send('Runtime.evaluate', { expression: 'JSON.stringify({sw:document.documentElement.scrollWidth,iw:innerWidth,sh:document.documentElement.scrollHeight})', returnByValue: true });
  console.log(s.name, r.result.exceptionDetails ? 'EXC ' + r.result.exceptionDetails.exception?.description : (r.result.result.value ?? ''), m.result.result.value);
}
if (logs.length) console.log('--- console ---\n' + logs.slice(0, 12).join('\n'));
ws.close(); proc.kill('SIGKILL'); process.exit(0);
