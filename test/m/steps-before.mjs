const go = (s) => `const D=window.__datavix; D.S.user={guest:true}; D.go('${s}');`;
export default [
  { name: '01-landing', js: `await new Promise(r=>setTimeout(r,1500)); return 'ok'` },
  { name: '02-landing-scroll', js: `window.scrollTo(0, 1400); return 'ok'`, wait: 900 },
  { name: '03-onboarding', js: `${go('ob')} D.S.ob=0; D.go('ob'); return 'ok'` },
  { name: '04-upload', js: `${go('upload')} return 'ok'` },
  { name: '05-editor', js: `const D=window.__datavix,S=D.S; S.user={guest:true}; S.br={audience:'director',decision:'prioritize',message:'Teste',story:'compare',tone:'tech',place:'screen'}; D.loadBuffer('pedidos.csv', await (await fetch('/dados-teste/pedidos.csv')).arrayBuffer()); for(let i=0;i<80&&S.step!=='preview';i++) await new Promise(r=>setTimeout(r,100)); D.go('mapping'); await new Promise(r=>setTimeout(r,300)); document.querySelector('[data-a=generate]').click(); for(let i=0;i<80&&S.step!=='editor';i++) await new Promise(r=>setTimeout(r,150)); localStorage.setItem('dv-fan-tutorial','1'); return S.step`, wait: 3500 },
  { name: '06-editor-full', js: `return 'ok'`, full: true },
];
