const sleep = `const sl=ms=>new Promise(r=>setTimeout(r,ms));`;
const toEditor = `const D=window.__datavix,S=D.S; S.user={guest:true}; S.br={audience:'director',decision:'prioritize',message:'Receita por categoria',story:'compare',tone:'tech',place:'screen'}; for (const k of ['org','rays','river','fan','ridge','flow']) localStorage.setItem('dv-'+k+'-tutorial','1'); D.loadBuffer('pedidos.csv', await (await fetch('/dados-teste/pedidos.csv')).arrayBuffer()); for(let i=0;i<80&&S.step!=='preview';i++) await sl(100); D.go('mapping'); await sl(300); document.querySelector('[data-a=generate]').click(); for(let i=0;i<80&&S.step!=='editor';i++) await sl(150); await sl(2500);`;
export default [
  { name: 'q01-editor', js: `${sleep} ${toEditor} return S.step`, wait: 800 },
  { name: 'q02-intro', pre: [{ tap: '.mbar [data-a=present]', wait: 3200 }], js: `return 'intro=' + document.querySelector('#piece').classList.contains('pintro-on') + ' sw=' + document.documentElement.scrollWidth`, wait: 500 },
  { name: 'q03-start', pre: [{ tap: '.pi-go', wait: 2500 }], js: `return 'intro=' + document.querySelector('#piece').classList.contains('pintro-on') + ' ' + document.querySelector('#pcount').textContent`, wait: 500 },
  { name: 'q04-next', pre: [{ tap: '[data-p=next]', wait: 2500 }], js: `return document.querySelector('#pcount').textContent + ' | ' + document.querySelector('.pbody').innerText.replace(/\\n/g,' ').slice(0,60)`, wait: 500 },
  { name: 'q05-exit', pre: [{ tap: '[data-p=exit]', wait: 900 }], js: `return 'presenting=' + document.querySelector('#piece').classList.contains('presenting')`, wait: 500 },
];
