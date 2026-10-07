const sleep = `const sl=ms=>new Promise(r=>setTimeout(r,ms));`;
const load = `const D=window.__datavix,S=D.S; S.user={guest:true}; S.br={audience:'director',decision:'prioritize',message:'Receita por categoria',story:'compare',tone:'tech',place:'screen'}; localStorage.setItem('dv-fan-tutorial','1'); D.loadBuffer('pedidos.csv', await (await fetch('/dados-teste/pedidos.csv')).arrayBuffer()); for(let i=0;i<80&&S.step!=='preview';i++) await sl(100);`;
export default [
  { name: 'f01-preview', js: `${sleep} ${load} return S.step`, wait: 1000 },
  { name: 'f02-mapping', js: `${sleep} window.__datavix.go('mapping'); return 'ok'`, wait: 900 },
  { name: 'f03-mapping-full', js: `return 'ok'`, full: true },
  { name: 'f04-privacy-modal', js: `${sleep} document.querySelector('.burger').click(); await sl(400); document.querySelector('#drawer [data-a=privacy]').click(); await sl(600); return 'modal=' + !!document.querySelector('.mdl') + ' menu=' + window.__datavix.S.menu`, wait: 700 },
  { name: 'f05-editor-light', js: `${sleep} document.querySelector('.mdl-x').click(); const D=window.__datavix,S=D.S; S.ui='light'; D.go('mapping'); await sl(300); document.querySelector('[data-a=generate]').click(); for(let i=0;i<80&&S.step!=='editor';i++) await sl(150); await sl(2500); return S.step`, wait: 1500 },
  { name: 'f06-present', js: `${sleep} document.querySelector('.mbar [data-a=present]').click(); await sl(2500); const p=document.querySelector('#piece'); return 'presenting=' + p.classList.contains('presenting') + ' sw=' + document.documentElement.scrollWidth`, wait: 1200 },
];
