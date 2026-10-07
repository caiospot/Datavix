const sleep = `const sl=ms=>new Promise(r=>setTimeout(r,ms));`;
const toEditor = `const D=window.__datavix,S=D.S; S.user={guest:true}; S.br={audience:'director',decision:'prioritize',message:'Receita por categoria',story:'compare',tone:'tech',place:'screen'}; localStorage.setItem('dv-fan-tutorial','1'); D.loadBuffer('pedidos.csv', await (await fetch('/dados-teste/pedidos.csv')).arrayBuffer()); for(let i=0;i<80&&S.step!=='preview';i++) await sl(100); D.go('mapping'); await sl(300); document.querySelector('[data-a=generate]').click(); for(let i=0;i<80&&S.step!=='editor';i++) await sl(150); await sl(2500);`;
export default [
  { name: 't01-burger-tap', pre: [{ tap: '.burger' }], js: `return 'menu=' + window.__datavix.S.menu`, wait: 500 },
  { name: 't02-overlay-tap', pre: [{ tap: '.dr-ov', at: [0.02, 0.5] }], js: `return 'menu=' + window.__datavix.S.menu`, wait: 400 },
  { name: 't03-editor', js: `${sleep} ${toEditor} return S.step`, wait: 1200 },
  { name: 't04-tap-chart', pre: [0.34,0.4,0.46,0.52,0.58].map(y => ({ tap: '#vz canvas', at: [0.3, y], wait: 500 })), js: `const c=document.querySelector('#pcard'); const r=c.getBoundingClientRect(); return 'pcard class=' + c.className + ' pos=' + getComputedStyle(c).position + ' rect=' + Math.round(r.top) + '..' + Math.round(r.bottom) + ' scrollY=' + Math.round(scrollY) + ' | ' + c.innerText.replace(/\\n/g,' ').slice(0,80)`, wait: 600 },
  { name: 't05-close-card', pre: [{ tap: '#pcard .cardx' }], js: `return 'pcard=' + document.querySelector('#pcard').className`, wait: 400 },
  { name: 't06-sheet-tap', pre: [{ tap: '.mbar [data-a=sheet-toggle]' }], js: `return 'sheet=' + window.__datavix.S.sheet`, wait: 900 },
  { name: 't07-sheet-drag-close', pre: [{ drag: '#sheet-h .lbl', dy: 260 }], js: `return 'sheet=' + window.__datavix.S.sheet`, wait: 700 },
  { name: 't08-sheet-tap-choose', pre: [{ tap: '.mbar [data-a=sheet-toggle]' }, { tap: '.panel .type[data-v=hbars]', wait: 900 }], js: `return 'type=' + window.__datavix.S.piece.type + ' sheet=' + window.__datavix.S.sheet`, wait: 1200 },
];
