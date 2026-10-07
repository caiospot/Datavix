const sleep = `const sl=ms=>new Promise(r=>setTimeout(r,ms));`;
export default [
  { name: 'o01', js: `${sleep} const D=window.__datavix,S=D.S; S.user={guest:true}; S.br={audience:'director',decision:'prioritize',message:'Teste',story:'time',tone:'tech',place:'screen'}; for (const k of ['org','rays','river','fan','ridge','flow']) localStorage.setItem('dv-'+k+'-tutorial','1');
    D.loadBuffer('pedidos.csv', await (await fetch('/dados-teste/pedidos.csv')).arrayBuffer()); for(let i=0;i<80&&S.step!=='preview';i++) await sl(100); D.go('mapping'); await sl(300); document.querySelector('[data-a=generate]').click(); for(let i=0;i<80&&S.step!=='editor';i++) await sl(150); await sl(2500);
    document.querySelector('.panel .type[data-v=organism]').click(); await sl(2200);
    const q=s=>{const e=document.querySelector(s); if(!e) return null; const r=e.getBoundingClientRect(); return s+':'+Math.round(r.left)+','+Math.round(r.top)+' '+Math.round(r.width)+'x'+Math.round(r.height)};
    return [q('#piece'),q('#vz'),q('.orgstage'),q('.orgstage canvas'),q('.orgside'),q('.side0'),q('.orgtools')].join(' | ')`, wait: 900 },
];
