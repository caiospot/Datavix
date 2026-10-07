const sleep = `const sl=ms=>new Promise(r=>setTimeout(r,ms));`;
const toFind = `const D=window.__datavix,S=D.S; S.user={guest:true}; S.br={audience:'director',decision:'prioritize',time:'full',message:'',story:null,tone:null,place:null}; for (const k of ['org','rays','river','fan','ridge','flow']) localStorage.setItem('dv-'+k+'-tutorial','1'); D.loadBuffer('pedidos.csv', await (await fetch('/dados-teste/pedidos.csv')).arrayBuffer()); for(let i=0;i<80&&S.step!=='preview';i++) await sl(100); D.go('mapping'); await sl(300); document.querySelector('[data-a=generate]').click(); for(let i=0;i<80&&S.step!=='find';i++) await sl(150); await sl(500);`;
export default [
  { name: 'f01-find', js: `${sleep} ${toFind} return S.step + ' sw=' + document.documentElement.scrollWidth`, wait: 500 },
  { name: 'f02-pick', pre: [{ tap: '.fd-card:nth-child(3) .fd-main' }], js: `return 'center=' + window.__datavix.S.find.center`, wait: 300 },
  { name: 'f03-guide', pre: [{ tap: '[data-a=fd-guide]', wait: 700 }], js: `return window.__datavix.S.step + ' ' + document.querySelector('.prog .lbl').textContent`, wait: 300 },
  { name: 'f04-chip', pre: [{ tap: '.sb-chip', wait: 400 }], js: `return document.querySelector('#sb-msg').value.slice(0, 60)`, wait: 300 },
  { name: 'f05-ev', pre: [{ tap: '[data-a=sb-next]', wait: 600 }, { tap: '.sb-list .fd-card:nth-child(2) .fd-main', wait: 400 }], js: `return 'ev=' + window.__datavix.S.sb.ev.length + ' sw=' + document.documentElement.scrollWidth`, wait: 400 },
  { name: 'f06-plan', pre: [{ tap: '[data-a=sb-next]', wait: 500 }, { tap: '[data-a=sb-next]', wait: 500 }, { tap: '[data-a=sb-next]', wait: 500 }, { tap: '[data-a=sb-next]', wait: 600 }], js: `return document.querySelector('.sb-screen h2').textContent.replace(/\\s+/g,' ') + ' sw=' + document.documentElement.scrollWidth`, wait: 400 },
];
