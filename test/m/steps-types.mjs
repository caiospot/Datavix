const sleep = `const sl=ms=>new Promise(r=>setTimeout(r,ms));`;
export default [
  { name: 'ty01', js: `${sleep} const errs=[]; console.error=(...a)=>errs.push(a.map(String).join(' ').slice(0,120)); window.addEventListener('error',e=>errs.push('ERR '+e.message));
    const D=window.__datavix,S=D.S; S.user={guest:true}; S.br={audience:'director',decision:'prioritize',message:'Teste',story:'compare',tone:'tech',place:'screen'}; for (const k of ['org','rays','river','fan','ridge','flow']) localStorage.setItem('dv-'+k+'-tutorial','1');
    D.loadBuffer('pedidos.csv', await (await fetch('/dados-teste/pedidos.csv')).arrayBuffer()); for(let i=0;i<80&&S.step!=='preview';i++) await sl(100); D.go('mapping'); await sl(300); document.querySelector('[data-a=generate]').click(); for(let i=0;i<80&&S.step!=='editor';i++) await sl(150); await sl(2500);
    const res=[]; const types=[...document.querySelectorAll('.panel .type:not(.off)')].map(b=>b.dataset.v);
    for (const t of types) { document.querySelector('.panel .type[data-v="'+t+'"]').click(); await sl(1800); const vz=document.querySelector('#vz').getBoundingClientRect(); res.push(t+':'+(document.documentElement.scrollWidth<=innerWidth?'ok':'W'+document.documentElement.scrollWidth)+'/'+Math.round(vz.width)+'x'+Math.round(vz.height)); }
    return res.join(' | ') + ' errs=' + JSON.stringify(errs)`, wait: 500 },
];
