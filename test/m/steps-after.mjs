const sleep = `const sl=ms=>new Promise(r=>setTimeout(r,ms));`;
const toEditor = `const D=window.__datavix,S=D.S; S.user={guest:true}; S.br={audience:'director',decision:'prioritize',message:'Receita por categoria',story:'compare',tone:'tech',place:'screen'}; localStorage.setItem('dv-fan-tutorial','1'); D.loadBuffer('pedidos.csv', await (await fetch('/dados-teste/pedidos.csv')).arrayBuffer()); for(let i=0;i<80&&S.step!=='preview';i++) await sl(100); D.go('mapping'); await sl(300); document.querySelector('[data-a=generate]').click(); for(let i=0;i<80&&S.step!=='editor';i++) await sl(150); await sl(2500);`;
export default [
  { name: 'a01-landing', js: `${sleep} await sl(800); return 'ok'` },
  { name: 'a02-drawer', js: `${sleep} document.querySelector('.burger').click(); await sl(500); return document.querySelector('#drawer').className + ' sw=' + document.documentElement.scrollWidth` },
  { name: 'a03-drawer-closed-by-item', js: `${sleep} document.querySelector('#drawer [data-a=start]')?.click(); document.querySelector('#drawer a[data-a=anchor]').click(); await sl(900); return 'open=' + window.__datavix.S.menu + ' y=' + Math.round(scrollY)` },
  { name: 'a04-onboarding', js: `${sleep} const D=window.__datavix; D.S.user={guest:true}; D.S.ob=0; D.go('ob'); return 'ok'` },
  { name: 'a05-upload', js: `const D=window.__datavix; D.go('upload'); return 'ok'` },
  { name: 'a06-editor', js: `${sleep} ${toEditor} return S.step + ' lay=' + document.querySelector('#piece').dataset.lay`, wait: 1500 },
  { name: 'a07-editor-scrolled', js: `window.scrollTo(0, 560); return 'ok'`, wait: 700 },
  { name: 'a08-sheet', js: `${sleep} window.scrollTo(0,0); document.querySelector('.mbar [data-a=sheet-toggle]').click(); await sl(900); const v=document.querySelector('#vz').getBoundingClientRect(); return 'sheet=' + window.__datavix.S.sheet + ' vz=' + Math.round(v.top) + '..' + Math.round(v.bottom)`, wait: 900 },
  { name: 'a09-drawer-editor', js: `${sleep} document.querySelector('[data-a=sheet-close]').click(); await sl(500); document.querySelector('.burger').click(); await sl(500); return 'ok'` },
];
