const sleep = `const sl=ms=>new Promise(r=>setTimeout(r,ms));`;
const toEditor = `const D=window.__datavix,S=D.S; S.user={guest:true}; S.br={audience:'director',decision:'prioritize',message:'Receita por categoria',story:'compare',tone:'tech',place:'screen'}; for (const k of ['org','rays','river','fan','ridge','flow']) localStorage.setItem('dv-'+k+'-tutorial','1'); D.loadBuffer('pedidos.csv', await (await fetch('/dados-teste/pedidos.csv')).arrayBuffer()); for(let i=0;i<80&&S.step!=='preview';i++) await sl(100); D.go('mapping'); await sl(300); document.querySelector('[data-a=generate]').click(); for(let i=0;i<80&&S.step!=='editor';i++) await sl(150); await sl(2500);`;
export default [
  { name: 'l01', js: `${sleep} ${toEditor} return S.step`, wait: 400 },
  { name: 'l02-intro', pre: [{ tap: '.mbar [data-a=present]', wait: 3200 }], js: `return 'ok'`, wait: 300 },
  { name: 'l03-insight', js: `const p=window.__datavix.S.piece.pres; await p.show(p.steps.findIndex(s=>/^i\\d/.test(s.id))); await new Promise(r=>setTimeout(r,2200)); return document.querySelector('#pcount').textContent + ' sw=' + document.documentElement.scrollWidth`, wait: 300 },
];
