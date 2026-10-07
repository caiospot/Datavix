const sleep = `const sl=ms=>new Promise(r=>setTimeout(r,ms));`;
const toEditor = `const D=window.__datavix,S=D.S; S.user={guest:true}; S.br={audience:'director',decision:'prioritize',message:'Receita por categoria',story:'compare',tone:'tech',place:'screen'}; localStorage.setItem('dv-fan-tutorial','1'); D.loadBuffer('pedidos.csv', await (await fetch('/dados-teste/pedidos.csv')).arrayBuffer()); for(let i=0;i<80&&S.step!=='preview';i++) await sl(100); D.go('mapping'); await sl(300); document.querySelector('[data-a=generate]').click(); for(let i=0;i<80&&S.step!=='editor';i++) await sl(150); await sl(2500);`;
export default [
  { name: 'v01-landing', js: `${sleep} await sl(600); return 'burger=' + (getComputedStyle(document.querySelector('.top-m')).display)` },
  { name: 'v02-editor', js: `${sleep} ${toEditor} return S.step + ' lay=' + document.querySelector('#piece').dataset.lay + ' mbar=' + getComputedStyle(document.querySelector('.mbar')).display`, wait: 1200 },
  { name: 'v03-sheet', js: `document.querySelector('.mbar [data-a=sheet-toggle]').click(); await new Promise(r=>setTimeout(r,900)); const v=document.querySelector('#vz').getBoundingClientRect(); return 'vz=' + Math.round(v.height)`, wait: 800 },
];
