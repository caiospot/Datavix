const sleep = `const sl=ms=>new Promise(r=>setTimeout(r,ms));`;
const toEditor = `const D=window.__datavix,S=D.S; S.user={guest:true}; S.br={audience:'director',decision:'prioritize',message:'Receita por categoria',story:'compare',tone:'tech',place:'screen'}; for (const k of ['org','rays','river','fan','ridge','flow']) localStorage.setItem('dv-'+k+'-tutorial','1'); D.loadBuffer('pedidos.csv', await (await fetch('/dados-teste/pedidos.csv')).arrayBuffer()); for(let i=0;i<80&&S.step!=='preview';i++) await sl(100); D.go('mapping'); await sl(300); document.querySelector('[data-a=generate]').click(); for(let i=0;i<80&&S.step!=='editor';i++) await sl(150); await sl(2500);`;
export default [
  { name: 'p01-sheet-chart', js: `${sleep} ${toEditor} return S.step`, pre: [], wait: 800 },
  { name: 'p02-open', pre: [{ tap: '.mbar [data-a=sheet-toggle]', wait: 900 }], js: `return 'sheet=' + window.__datavix.S.sheet`, wait: 700 },
  { name: 'p03-style-tab', pre: [{ tap: '#ptab-style', wait: 500 }], js: `return 'tab=' + window.__datavix.S.ptab`, wait: 500 },
  { name: 'p04-fp-open', pre: [{ tap: '.fp-btn', wait: 900 }], js: `const l=document.querySelector('.fp-list'); return 'open=' + !l.hidden + ' h=' + Math.round(l.getBoundingClientRect().height)`, wait: 600 },
  { name: 'p05-fp-pick', pre: [{ tap: '.fp-o[data-v=sora]', wait: 1500 }], js: `const S=window.__datavix.S; return 'pair=' + S.piece.fontPair + ' open=' + S.fpOpen + ' sheet=' + S.sheet`, wait: 600 },
  { name: 'p06-share-tab', pre: [{ tap: '#ptab-share', wait: 500 }], js: `return 'ok'`, wait: 400 },
];
