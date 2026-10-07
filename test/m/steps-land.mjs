const go = id => `document.getElementById('${id}').scrollIntoView(); await new Promise(r=>setTimeout(r,900)); return 'ok'`;
export default [
  { name: 'l01-como', js: go('como') }, { name: 'l02-graficos', js: go('graficos') }, { name: 'l03-diferenciais', js: go('diferenciais') }, { name: 'l04-faq', js: go('faq') },
  { name: 'l05-footer', js: `window.scrollTo(0, document.body.scrollHeight); await new Promise(r=>setTimeout(r,900)); return 'ok'` },
];
