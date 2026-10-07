export default [
  { name: 'x01-export-mobile', js: `await new Promise(r=>setTimeout(r,2500)); const p=document.querySelector('#piece'); return 'lay=' + (p&&p.dataset.lay) + ' vzH=' + Math.round(document.querySelector('#vz').getBoundingClientRect().height) + ' ext=' + performance.getEntriesByType('resource').filter(r=>!r.name.startsWith('blob:')&&!r.name.startsWith('data:')).length`, wait: 1200 },
  { name: 'x02-export-tap', pre: [0.34,0.4,0.46,0.52,0.58].map(y => ({ tap: '#vz canvas', at: [0.3, y], wait: 500 })), js: `const c=document.querySelector('#pcard'); return 'card=' + c.className + ' pos=' + getComputedStyle(c).position + ' scrollY=' + Math.round(scrollY)`, wait: 600 },
];
