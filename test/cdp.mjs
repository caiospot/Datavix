// Abre uma página no Chrome headless (inclusive file://) e devolve o texto de #probe. Uso: node test/cdp.mjs <url> [segundos]
import { spawn } from 'node:child_process';
const url = process.argv[2], secs = +(process.argv[3] || 12), exprFile = process.argv[4];
const CH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const port = 9333 + Math.floor(Math.random() * 500);
const proc = spawn(CH, ['--headless=new', '--disable-gpu', '--no-first-run', `--remote-debugging-port=${port}`, `--user-data-dir=/tmp/chr-${port}`, 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let targets;
for (let i = 0; i < 40; i++) { try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if (targets.length) break; } catch (e) { /* ainda subindo */ } await sleep(250); }
const page = targets.find(t => t.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise(r => (ws.onopen = r));
let id = 0; const pend = new Map(), logs = [];
ws.onmessage = m => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } else if (d.method === 'Runtime.consoleAPICalled') logs.push(d.params.type + ': ' + d.params.args.map(a => a.value ?? a.description).join(' ')); else if (d.method === 'Runtime.exceptionThrown') logs.push('EXCECAO: ' + (d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text)); else if (d.method === 'Log.entryAdded') logs.push('log ' + d.params.entry.level + ': ' + d.params.entry.text + ' ' + (d.params.entry.url || '')); };
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
await send('Runtime.enable'); await send('Log.enable'); await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: +(process.env.W || 1440), height: +(process.env.H || 900), deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url });
await sleep(secs * 1000);
const fs = await import('node:fs');
const expr = exprFile ? fs.readFileSync(exprFile, 'utf8') : "document.getElementById('probe') ? document.getElementById('probe').textContent : '(sem probe) ' + document.body.innerText.slice(0,300)";
const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
if (process.env.SHOT) { const shot = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(process.env.SHOT, Buffer.from(shot.result.data, 'base64')); }
console.log(typeof r.result.result.value === 'string' ? r.result.result.value : JSON.stringify(r.result.result.value ?? r.result, null, 1));
if (logs.length) console.log('--- console ---\n' + logs.slice(0, 15).join('\n'));
ws.close(); proc.kill('SIGKILL'); process.exit(0);
