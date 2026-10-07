const sleep = `const sl=ms=>new Promise(r=>setTimeout(r,ms));`;
export default [
  { name: 'w01', js: `${sleep} const D=window.__datavix,S=D.S; S.user={guest:true}; S.br={audience:'director',decision:'prioritize',message:'Teste',story:'time',tone:'tech',place:'screen'}; for (const k of ['org','rays','river','fan','ridge','flow']) localStorage.setItem('dv-'+k+'-tutorial','1');
    D.loadBuffer('pedidos.csv', await (await fetch('/dados-teste/pedidos.csv')).arrayBuffer()); for(let i=0;i<80&&S.step!=='preview';i++) await sl(100); D.go('mapping'); await sl(300); document.querySelector('[data-a=generate]').click(); for(let i=0;i<80&&S.step!=='editor';i++) await sl(150); await sl(2500);
    document.querySelector('.panel .type[data-v=organism]').click(); await sl(2200);
    const o=[]; for (const s of ['.stage','#piece','.c3','#vz','.phead']) { const e=document.querySelector(s); const r=e.getBoundingClientRect(); const c=getComputedStyle(e); o.push(s+' w='+Math.round(r.width)+' disp='+c.display+' alignSelf='+c.alignSelf+' flex='+c.flex+' width='+c.width+' minW='+c.minWidth+' maxW='+c.maxWidth); } return o.join('\\n')`, wait: 500 },
];
