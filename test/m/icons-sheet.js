(async () => { await new Promise(r => setTimeout(r, 1500));
  const d = document.createElement('div'); d.style.cssText = 'position:fixed;inset:0;z-index:99999;background:#151912;color:#eef0eb;display:grid;grid-template-columns:repeat(6,1fr);gap:14px;padding:24px;align-content:start;font:12px monospace';
  d.innerHTML = ALL_CHARTS.map(t => `<div style="text-align:center"><div style="background:#11140f;border:1px solid #272c23;border-radius:8px;padding:16px 0">${chartIcon(t).replace('width="48" height="32"', 'width="168" height="112"')}</div>${t}</div>`).join('');
  document.body.appendChild(d); return 'ok'; })()
