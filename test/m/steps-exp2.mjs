export default [
  { name: 'y01', js: `await new Promise(r=>setTimeout(r,2500)); const av=document.querySelector('.altview'); const cv=document.querySelector('#vz canvas'); const r=cv.getBoundingClientRect(); return JSON.stringify({av: !!av, org: av && av._org && Object.keys(av._org).slice(0,20), cv:[r.left,r.top,r.width,r.height], cvCount: document.querySelectorAll('#vz canvas').length, vis: [...document.querySelectorAll('#vz canvas')].map(c=>getComputedStyle(c).visibility+'/'+getComputedStyle(c).display+'/'+c.parentElement.className)})` },
];
