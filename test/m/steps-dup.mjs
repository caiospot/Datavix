const sleep = `const sl=ms=>new Promise(r=>setTimeout(r,ms));`;
const toEditor = `const D=window.__datavix,S=D.S; S.user={guest:true}; S.br={audience:'director',decision:'prioritize',message:'Receita por categoria',story:'compare',tone:'tech',place:'screen'}; for (const k of ['org','rays','river','fan','ridge','flow']) localStorage.setItem('dv-'+k+'-tutorial','1'); D.loadBuffer('pedidos.csv', await (await fetch('/dados-teste/pedidos.csv')).arrayBuffer()); for(let i=0;i<80&&S.step!=='preview';i++) await sl(100); D.go('mapping'); await sl(300); document.querySelector('[data-a=generate]').click(); for(let i=0;i<80&&S.step!=='editor';i++) await sl(150); await sl(2500);`;
const count = `JSON.stringify({ pbody: document.querySelectorAll('.pbody').length, play: document.querySelectorAll('.pn-play').length, intro: document.querySelectorAll('.pintro').length, prog: document.querySelectorAll('.pprog').length, active: document.activeElement && (document.activeElement.dataset.a || document.activeElement.tagName), cnt: (document.querySelector('#pcount')||{}).textContent })`;
const switchTypes = `const sl2=ms=>new Promise(r=>setTimeout(r,ms)); for (const t of ['hbars','fan','organism','fan']) { const b=document.querySelector('.panel .type[data-v='+t+']'); if (b) { b.click(); await sl2(1800); } } return window.__datavix.S.piece.type`;
export default [
  { name: 'u01', js: `${sleep} ${toEditor} return S.step`, wait: 500 },
  { name: 'u01b-switch-charts', js: switchTypes, wait: 600 },
  { name: 'u02-click-present', pre: [{ click: '#orgpres', wait: 2800 }], js: `return ${count}`, wait: 200 },
  { name: 'u03-space-x3', pre: [{ key: 'Space', wait: 1200 }, { key: 'Space', wait: 1200 }, { key: 'Space', wait: 1200 }], js: `return ${count}`, wait: 200 },
  { name: 'u04-enter', pre: [{ key: 'Enter', wait: 1200 }], js: `return ${count}`, wait: 200 },
];
