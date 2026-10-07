const find = `const W=390; const out=[]; for (const e of document.querySelectorAll('body *')) { const r=e.getBoundingClientRect(); if (r.width && r.right>W+1 && !e.closest('svg') && getComputedStyle(e).position!=='fixed') out.push((e.id?'#'+e.id:'')+'.'+String(e.className).split(' ')[0]+'<'+e.tagName.toLowerCase()+'> right='+Math.round(r.right)); } return out.slice(0,14).join(' | ');`;
export default [
  { name: 'o-landing', js: `await new Promise(r=>setTimeout(r,800)); ${find}` },
  { name: 'o-ob', js: `const D=window.__datavix; D.S.user={guest:true}; D.S.ob=0; D.go('ob'); ${find}` },
  { name: 'o-upload', js: `const D=window.__datavix; D.go('upload'); ${find}` },
  { name: 'o-editor', js: `const D=window.__datavix,S=D.S; S.user={guest:true}; S.br={audience:'director',decision:'prioritize',message:'Teste',story:'compare',tone:'tech',place:'screen'}; localStorage.setItem('dv-fan-tutorial','1'); D.loadBuffer('pedidos.csv', await (await fetch('/dados-teste/pedidos.csv')).arrayBuffer()); for(let i=0;i<80&&S.step!=='preview';i++) await new Promise(r=>setTimeout(r,100)); D.go('mapping'); await new Promise(r=>setTimeout(r,300)); document.querySelector('[data-a=generate]').click(); for(let i=0;i<80&&S.step!=='editor';i++) await new Promise(r=>setTimeout(r,150)); await new Promise(r=>setTimeout(r,2500)); ${find}` },
];
