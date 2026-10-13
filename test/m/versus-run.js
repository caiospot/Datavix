// Gate 49: leitura do face a face. As duas planilhas da Fórmula 1 (todas as abas) e planilhas que NÃO são face a face.
(async () => { try {
  const D = window.__datavix, S = D.S, sl = ms => new Promise(r => setTimeout(r, ms)), out = {}, bad = [];
  const ok = (k, v) => { out[k] = v ? 'ok' : 'FALHOU'; if (!v) bad.push(k); };
  const lb = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'PT'); if (lb) lb.click(); await sl(300);
  const load = async (file, sheet, fix) => {
    S.user = { guest: true }; S.br = { area: null, audience: 'director', decision: 'prioritize', time: 'full', message: '', story: null, tone: null, place: null }; D.go('upload'); S.ds = null;
    const buf = await (await fetch('/dados-teste/' + file)).arrayBuffer(); D.loadBuffer(file, buf, sheet); for (let i = 0; i < 150 && !(S.ds && S.fileName) && S.step !== 'sheet'; i++) await sl(100);
    if (S.step === 'sheet' && S.sheets && S.sheets.length) { const first = S.sheets[0]; D.go('upload'); S.ds = null; D.loadBuffer(file, buf, first); for (let i = 0; i < 150 && !(S.ds && S.fileName); i++) await sl(100); }
    await sl(400); return S.ds;
  };
  const col = (ds, n) => ds.columns.find(c => c.name === n), cell = (ds, n, i) => { const c = col(ds, n); return c.data ? c.data[i] : nvVsLabel(c, i); };
  // ---- Sheet1: entidades em colunas
  let ds = await load('f1-senna-schumacher.xlsx', 'Sheet1'), v = nvVersus(ds);
  ok('Sheet1: lida como face a face (metric-long)', v && v.form === 'metric-long' && ds.fixes.versus.k === 2); out.sheet1 = ds.columns.map(c => c.name + ':' + c.kind).join(' | ');
  ok('Sheet1: as duas entidades são os pilotos', v && v.entities.join('|') === 'Ayrton Senna|Michael Schumacher');
  ok('Sheet1: 46 linhas (23 métricas × 2 pilotos)', ds.rowCount === 46); out.linhas = ds.rowCount;
  const rows = []; for (let i = 0; i < ds.rowCount; i++) rows.push({ cat: cell(ds, 'Categoria', i), est: cell(ds, 'Estatística', i), per: cell(ds, 'Período', i), ent: cell(ds, 'Entidade', i), val: cell(ds, 'Valor', i), un: cell(ds, 'Unidade', i), tx: cell(ds, 'Texto', i) });
  const get = (est, ent, per) => rows.find(r => r.est === est && r.ent === ent && (per === undefined || String(r.per) === String(per)));
  const g = get('GPs Disputados', 'Ayrton Senna'); ok('"161 largadas" → Valor 161, Unidade largadas, Texto original', g && g.val === 161 && g.un === 'largadas' && g.tx === '161 largadas'); out.gps = JSON.stringify(g);
  const ap = get('Aproveitamento Poles', 'Ayrton Senna'); ok('"40,3% das corridas" → 40,3 e %', ap && Math.abs(ap.val - 40.3) < 1e-9 && ap.un === '%' && ap.tx === '40,3% das corridas'); out.ap = JSON.stringify(ap);
  const vt = get('Vitórias Totais', 'Ayrton Senna'); ok('"41 (25,4% de aproveitamento)" → 41 e texto original', vt && vt.val === 41 && vt.tx === '41 (25,4% de aproveitamento)');
  const id = get('Idade', 'Ayrton Senna'); ok('"32 anos" → 32 anos', id && id.val === 32 && id.un === 'anos');
  const pos = get('Posição no Campeonato', 'Ayrton Senna', 1992); ok('"4º colocado (50 pontos)" → posição 4 com o texto original', pos && pos.val === 4 && pos.un === 'º' && pos.tx === '4º colocado (50 pontos)'); out.pos = JSON.stringify(pos);
  const st = get('Status no grid', 'Ayrton Senna'); ok('texto longo não vira número', st && !Number.isFinite(st.val) && /Tricampe/.test(st.tx)); const eq = get('Equipes', 'Ayrton Senna'); ok('lista de equipes continua texto', eq && !Number.isFinite(eq.val) && /McLaren/.test(eq.tx));
  const sp = get('Posição no Campeonato', 'Ayrton Senna', '1994 (até Ímola)'); ok('"Sem classificação (0 pontos)" é texto, nunca zero', sp && !Number.isFinite(sp.val) && /Sem classifica/.test(sp.tx));
  ok('Valor de métricas diferentes tem papel "mixed" e fica fora do motor genérico', col(ds, 'Valor').role === 'mixed' && !colUsable(col(ds, 'Valor')) && !isMeasure(col(ds, 'Valor')));
  const pl = get('Pole Positions', 'Ayrton Senna', 1993); ok('número puro continua número (Poles 1993 = 1)', pl && pl.val === 1 && pl.un === '' && pl.tx === '');
  // ---- Resultados por GP: colunas repetidas por entidade
  ds = await load('f1-senna-schumacher.xlsx', 'Resultados por GP'); v = nvVersus(ds);
  ok('GP: lida como face a face (colunas repetidas)', v && v.form === 'entity-long' && v.source === 'suffix' && ds.fixes.versus.k === 2); out.gp = ds.columns.map(c => c.name + ':' + c.kind).join(' | ');
  ok('GP: entidades Senna e Schumacher', v && v.entities.slice().sort().join('|') === 'Schumacher|Senna'); ok('GP: 192 linhas (96 GPs × 2)', ds.rowCount === 192); out.gpLinhas = ds.rowCount;
  ok('GP: coluna derivada "Diferença de pontos" fica de fora', ds.fixes.versus.dropped && ds.fixes.versus.dropped.some(x => /Diferença/.test(x)) && !ds.columns.some(c => /Diferença/.test(c.name)));
  ok('GP: 5 métricas (Equipe, Grid, Resultado, Situação, Pontos)', ds.fixes.versus.metrics.join(',') === 'Equipe,Grid,Resultado,Situação,Pontos');
  const pts = {}; for (let i = 0; i < ds.rowCount; i++) { const t = cell(ds, 'Temporada', i), e = cell(ds, 'Entidade', i), p = cell(ds, 'Pontos', i); if (Number.isFinite(p)) { pts[t + e] = (pts[t + e] || 0) + p; } }
  ok('GP: pontos por temporada batem com a aba resumo (1993 Senna 73, Schumacher 52)', pts['1993Senna'] === 73 && pts['1993Schumacher'] === 52); out.pts93 = pts['1993Senna'] + '/' + pts['1993Schumacher'];
  out.absGP = JSON.stringify(v ? v.absentBy : null); ok('GP: "ainda não havia estreado" e "não participou" marcados como ausentes (Schumacher 1989–90 e 1991 antes da estreia)', v && v.absentBy.Schumacher >= 20 && v.absentBy.Senna >= 12);
  // ---- Comparativo 1989-94: formato longo, sem reorganizar
  ds = await load('f1-senna-schumacher.xlsx', 'Comparativo 1989-94'); v = nvVersus(ds);
  ok('Comparativo: reconhecido como face a face longo', v && v.form === 'entity-long' && v.source === 'long' && ds.columns[v.entityCol].name === 'Piloto'); out.comp = v ? ds.columns[v.entityCol].name + ' / ' + ds.columns[v.periodCol].name + ' / ' + v.measures.map(i => ds.columns[i].name).join(',') : null;
  ok('Comparativo: sem reorganização (12 linhas)', !(ds.fixes && ds.fixes.versus) && ds.rowCount === 12);
  ok('Comparativo: "não participou" só em Schumacher 1989 e 1990 (2 linhas)', v && v.absentBy['Michael Schumacher'] === 2 && !v.absentBy['Ayrton Senna']); out.absComp = JSON.stringify(v ? v.absentBy : null);
  ok('Comparativo: Schumacher 1991 (6 GPs) NÃO é ausente', (() => { for (let i = 0; i < ds.rowCount; i++) if (cell(ds, 'Temporada', i) === 1991 && cell(ds, 'Piloto', i) === 'Michael Schumacher') return !v.absent[i]; return false; })());
  ok('Comparativo: exposição = GP disputados', v && ds.columns[v.exposureCol].name === 'GP disputados*');
  // ---- primeira planilha (uma aba)
  ds = await load('f1-comparativo-v1.xlsx'); v = nvVersus(ds); ok('planilha v1 (uma aba) também é face a face', v && v.form === 'metric-long' && ds.rowCount === 46);
  // ---- NÃO é face a face
  for (const [file, sheet] of [['lojas.csv'], ['pedidos.csv'], ['datavix-planilha-ideal.xlsx', 'Vendas'], ['financeiro.xlsx', 'Lançamentos'], ['bateria/vendas_sazonal.csv'], ['bateria/rh_folha.csv'], ['bateria/marketing_campanhas.csv'], ['bateria/publico_orcamento.csv'], ['projetos.csv'], ['canais.csv'], ['funil.csv'], ['metas.csv'], ['antes-depois.csv']]) {
    ds = await load(file, sheet); if (!ds) { out['pulou_' + file] = 'não carregou'; continue; } const w = nvVersus(ds); ok('não é face a face: ' + file, !w && !(ds.fixes && ds.fixes.versus)); if (w) out['falso_' + file] = w.form + ' ' + w.entities.join('/');
  }
  // ---- direção da métrica
  ok('direção neutra por padrão; sugestão "menor é melhor" para abandonos', nvVersusDirection('Abandonos (DNFs)').dir === 'neutral' && nvVersusDirection('Abandonos (DNFs)').hint === 'lower' && nvVersusDirection('Vitórias').hint === null && nvVersusDirection('Custo por lead').hint === 'lower');
  // ---- desfazer a arrumação volta à planilha original
  S.user = { guest: true }; D.go('upload'); S.ds = null; D.loadBuffer('f1-senna-schumacher.xlsx', await (await fetch('/dados-teste/f1-senna-schumacher.xlsx')).arrayBuffer(), 'Sheet1'); for (let i = 0; i < 150 && !(S.ds && S.fileName); i++) await sl(100); await sl(300);
  ok('a leitura guarda o texto original (Texto) para toda célula que não é número puro', (() => { let n = 0, m = 0; for (let i = 0; i < S.ds.rowCount; i++) { const val = cell(S.ds, 'Valor', i), tx = cell(S.ds, 'Texto', i); if (val === null || val === undefined || Number.isNaN(val)) { n++; if (tx) m++; } } return n > 0 && m === n; })());
  // a tela de leitura mostra a arrumação e dá para desfazer (volta à planilha original) e refazer
  S.user = { guest: true }; D.go('upload'); S.ds = null; D.loadBuffer('f1-senna-schumacher.xlsx', await (await fetch('/dados-teste/f1-senna-schumacher.xlsx')).arrayBuffer(), 'Sheet1'); for (let i = 0; i < 150 && !(S.ds && S.fileName); i++) await sl(100); await sl(400);
  out.conf = S.read ? S.read.conf + ' / forma ' + S.read.shape : null; D.go('read'); await sl(400);
  const cb = document.querySelector('.rd-fix [data-k=versus]'); ok('a tela de leitura mostra a arrumação "face a face"', !!cb && cb.checked && /face a face/i.test(cb.parentNode.textContent)); out.textoLeitura = cb ? cb.parentNode.textContent.slice(0, 200) : null;
  if (cb) { cb.checked = false; cb.dispatchEvent(new Event('change', { bubbles: true })); for (let i = 0; i < 80; i++) { await sl(150); if (S.ds && S.ds.rowCount === 23) break; } await sl(300);
    ok('desfazer volta à planilha original (23 linhas, sem coluna Entidade)', S.ds.rowCount === 23 && !S.ds.columns.some(c => c.name === 'Entidade') && !nvVersus(S.ds));
    D.go('read'); await sl(300); const cb2 = document.querySelector('.rd-fix [data-k=versus]'); if (cb2) { cb2.checked = true; cb2.dispatchEvent(new Event('change', { bubbles: true })); for (let i = 0; i < 80; i++) { await sl(150); if (S.ds && S.ds.rowCount === 46) break; } await sl(300); }
    ok('refazer reorganiza de novo (46 linhas)', S.ds.rowCount === 46 && !!nvVersus(S.ds)); }
  out.RESUMO = bad.length ? bad : 'tudo certo'; return JSON.stringify(out, null, 1);
} catch (e) { return 'ERRO ' + e.stack; } })()
