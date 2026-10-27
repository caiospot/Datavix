// Cliente mínimo do Chrome (CDP) para os scripts de imagens do site: abre uma página, roda JavaScript, tira captura (PNG ou WebP).
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export const CH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
export const sleep = ms => new Promise(r => setTimeout(r, ms));

export async function openChrome({ width = 1440, height = 900, scale = 1, mobile = false } = {}) {
  const port = 9600 + Math.floor(Math.random() * 300), dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dv-shot-'));
  const proc = spawn(CH, ['--headless=new', '--disable-gpu', '--no-first-run', '--hide-scrollbars', '--force-color-profile=srgb', `--remote-debugging-port=${port}`, `--user-data-dir=${dir}`, 'about:blank'], { stdio: 'ignore' });
  let targets; for (let i = 0; i < 60; i++) { try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if (targets.length) break; } catch (e) { /* subindo */ } await sleep(250); }
  const ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl); await new Promise(r => (ws.onopen = r));
  let id = 0; const pend = new Map(), logs = [];
  ws.onmessage = m => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } else if (d.method === 'Runtime.consoleAPICalled' && d.params.type === 'error') logs.push(d.params.args.map(a => a.value ?? a.description ?? '').join(' ').slice(0, 200)); else if (d.method === 'Log.entryAdded' && ['error', 'warning'].includes(d.params.entry.level)) logs.push('log: ' + String(d.params.entry.text).slice(0, 200) + (d.params.entry.url ? ' ' + d.params.entry.url : '')); };
  const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  await send('Page.enable'); await send('Runtime.enable'); await send('Log.enable');
  const view = async (w, h, s = 1, m = false) => send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: s, mobile: m });
  await view(width, height, scale, mobile);
  const ev = async (expr) => { const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }); if (r.result && r.result.exceptionDetails) throw new Error('JS: ' + (r.result.exceptionDetails.exception && r.result.exceptionDetails.exception.description || r.result.exceptionDetails.text)); return r.result && r.result.result ? r.result.result.value : undefined; };
  const goto = async url => { await send('Page.navigate', { url }); await sleep(1500); };
  const shot = async ({ format = 'png', quality = 85, clip, scale: cs, beyond = false } = {}) => { const p = { format, ...(format !== 'png' ? { quality } : {}), captureBeyondViewport: beyond }; if (clip) p.clip = { ...clip, scale: cs || 1 }; const r = await send('Page.captureScreenshot', p); return Buffer.from(r.result.data, 'base64'); };
  const close = async () => { try { ws.close(); } catch (e) { /* segue */ } proc.kill('SIGKILL'); await sleep(200); try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) { /* segue */ } };
  return { send, ev, goto, shot, view, close, logs };
}
