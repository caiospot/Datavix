const sleep = `const sl=ms=>new Promise(r=>setTimeout(r,ms));`;
const toEditor = `const D=window.__datavix,S=D.S; S.user={guest:true}; S.br={audience:'director',decision:'prioritize',message:'Receita por categoria',story:'compare',tone:'tech',place:'screen'}; for (const k of ['org','rays','river','fan','ridge','flow']) localStorage.setItem('dv-'+k+'-tutorial','1'); D.loadBuffer('pedidos.csv', await (await fetch('/dados-teste/pedidos.csv')).arrayBuffer()); for(let i=0;i<80&&S.step!=='preview';i++) await sl(100); D.go('mapping'); await sl(300); document.querySelector('[data-a=generate]').click(); for(let i=0;i<80&&S.step!=='editor';i++) await sl(150); await sl(2500);`;
const cnt = `document.querySelector('#pcount').textContent`;
export default [
  { name: 'r01-editor', js: `${sleep} ${toEditor} return S.step`, wait: 600 },
  { name: 'r02-intro', pre: [{ tap: '.mbar [data-a=present]', wait: 3200 }], js: `return 'btns=' + [...document.querySelectorAll('.pintro .pi-btns button')].map(b=>b.textContent.trim()).join('|')`, wait: 400 },
  { name: 'r03-start', pre: [{ tap: '.pi-go', wait: 2200 }], js: `return ${cnt}`, wait: 300 },
  { name: 'r04-swipe-next', pre: [{ swipe: [300, 420, 60, 430] }, { swipe: [300, 420, 60, 430] }], js: `await new Promise(r=>setTimeout(r,2000)); return ${cnt}`, wait: 600 },
  { name: 'r05-swipe-prev', pre: [{ swipe: [60, 420, 300, 430] }], js: `await new Promise(r=>setTimeout(r,1500)); return ${cnt}`, wait: 400 },
  { name: 'r06-insight', js: `await window.__datavix.S.piece.pres.show(window.__datavix.S.piece.pres.steps.findIndex(s=>/^i\\d/.test(s.id))); await new Promise(r=>setTimeout(r,2200)); return ${cnt} + ' calcOpen=' + document.querySelector('.pcalc').open`, wait: 400 },
  { name: 'r07-calc-open', pre: [{ tap: '.pcalc summary', wait: 500 }], js: `return 'calcOpen=' + document.querySelector('.pcalc').open`, wait: 400 },
  { name: 'r08-outro', js: `await window.__datavix.S.piece.pres.show(window.__datavix.S.piece.pres.steps.length); await new Promise(r=>setTimeout(r,2000)); return ${cnt}`, wait: 500 },
  { name: 'r09-play-tap', pre: [{ tap: '.pouro [data-p=restart]', wait: 900 }, { tap: '.pi-auto', wait: 3500 }], js: `const p=window.__datavix.S.piece.pres; return 'playing=' + p.isPlaying() + ' ' + ${cnt}`, wait: 400 },
  { name: 'r10-exit', pre: [{ tap: '.pn-play', wait: 300 }, { tap: '[data-p=exit]', wait: 700 }], js: `return 'presenting=' + document.querySelector('#piece').classList.contains('presenting')`, wait: 300 },
];
