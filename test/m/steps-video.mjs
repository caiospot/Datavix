const sleep = `const sl=ms=>new Promise(r=>setTimeout(r,ms));`;
const toEditor = `const D=window.__datavix,S=D.S; S.user={guest:true}; S.br={audience:'director',decision:'prioritize',message:'Receita por categoria',story:'compare',tone:'tech',place:'screen'}; for (const k of ['org','rays','river','fan','ridge','flow']) localStorage.setItem('dv-'+k+'-tutorial','1'); D.loadBuffer('pedidos.csv', await (await fetch('/dados-teste/pedidos.csv')).arrayBuffer()); for(let i=0;i<80&&S.step!=='preview';i++) await sl(100); D.go('mapping'); await sl(300); document.querySelector('[data-a=generate]').click(); for(let i=0;i<80&&S.step!=='editor';i++) await sl(150); await sl(2500);`;
export default [
  { name: 'v01', js: `${sleep} ${toEditor} return S.step`, wait: 500 },
  { name: 'v02-share-tab', pre: [{ tap: '.mbar [data-a=sheet-toggle]', wait: 900 }, { tap: '#ptab-share', wait: 500 }], js: `return 'btn=' + !!document.querySelector('[data-a=video]')`, wait: 400 },
  { name: 'v03-dialog', pre: [{ tap: '[data-a=video]', wait: 900 }], js: `const m=document.querySelector('.mdl'); const r=m.querySelector('.mdl-box').getBoundingClientRect(); return 'dialog h=' + Math.round(r.height) + ' sw=' + document.documentElement.scrollWidth + ' go=' + !!m.querySelector('[data-vd=go]')`, wait: 400 },
  { name: 'v04-recording', pre: [{ tap: '[data-vd=go]', wait: 5500 }], js: `const m=document.querySelector('.mdl'); const c=m.querySelector('.vd-stage').getBoundingClientRect(); return 'stage=' + Math.round(c.width) + 'x' + Math.round(c.height) + ' ' + m.querySelector('#vd-stat').textContent`, wait: 300 },
  { name: 'v05-abort', pre: [{ tap: '[data-vd=abort]', wait: 800 }], js: `return 'choose=' + !!document.querySelector('[data-vd=go]')`, wait: 300 },
];
