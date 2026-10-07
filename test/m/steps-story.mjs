const sleep = `const sl=ms=>new Promise(r=>setTimeout(r,ms));`;
const toEditor = `const D=window.__datavix,S=D.S; S.user={guest:true}; S.br={audience:'director',decision:'prioritize',message:'Receita por categoria',story:'compare',tone:'tech',place:'screen'}; for (const k of ['org','rays','river','fan','ridge','flow']) localStorage.setItem('dv-'+k+'-tutorial','1'); D.loadBuffer('pedidos.csv', await (await fetch('/dados-teste/pedidos.csv')).arrayBuffer()); for(let i=0;i<80&&S.step!=='preview';i++) await sl(100); D.go('mapping'); await sl(300); document.querySelector('[data-a=generate]').click(); for(let i=0;i<80&&S.step!=='editor';i++) await sl(150); await sl(2500);`;
export default [
  { name: 's01', js: `${sleep} ${toEditor} return S.step`, wait: 500 },
  { name: 's02-intro', pre: [{ tap: '.mbar [data-a=present]', wait: 3500 }], js: `return 'intro'`, wait: 300 },
  { name: 's03-slide2', pre: [{ tap: '.pi-go', wait: 1500 }, { swipe: [300, 420, 60, 430] }], js: `await new Promise(r=>setTimeout(r,2200)); return document.querySelector('#pcount').textContent + ' | ' + document.querySelector('.pbody').innerText.replace(/\\n/g,' ').slice(0,90)`, wait: 300 },
  { name: 's04-slide3-calc', pre: [{ swipe: [300, 420, 60, 430] }, { tap: '.pcalc summary', wait: 500 }], js: `await new Promise(r=>setTimeout(r,1800)); return document.querySelector('#pcount').textContent`, wait: 300 },
];
