/* Datavix: textos dos gráficos da Fase B (PT/EN). Acrescenta chaves ao dicionário base. */
Object.assign(I18N.pt.chart, { rays: 'Raios radiais', river: 'Rio vertical', fan: 'Leque de barras', ridge: 'Cordilheira isométrica', flow: 'Fluxo em funil' });
Object.assign(I18N.en.chart, { rays: 'Radial spokes', river: 'Vertical stream', fan: 'Bar fan', ridge: 'Isometric ridgeline', flow: 'Funnel flow' });
Object.assign(I18N.pt, {
  cs_off: 'Desligado', cs_more: 'Mais gráficos de dados', cs_agg: 'Cálculo', cs_aggs: { sum: 'Soma', mean: 'Média', count: 'Contagem' },
  rays_h: 'Raios radiais', rays_help: 'Um raio por entidade: o comprimento é o valor e a cor é o grupo.', rays_ent: 'Entidade (raio)', rays_val: 'Valor (comprimento)', rays_grp: 'Grupo (cor)',
  rays_sum: (n, g) => `${n} raios${g ? ' · ' + g + ' grupos' : ''}`, rays_none: 'Esta planilha não tem entidades e valores suficientes para os raios radiais.',
  rays_sort: 'Ordenar', rays_s_value: 'Maior valor', rays_s_name: 'Nome (A–Z)', rays_s_orig: 'Ordem da planilha',
  rays_top: n => `Mostrar os ${n} maiores`, rays_topall: n => `Mostrando todos (${n})`, rays_groups: 'Grupos', rays_gshare: 'Valor por grupo', rays_rank: 'Maiores valores',
  rays_items: 'itens', rays_pos: 'Posição', rays_of: (r, n) => `${r}º de ${n}`, rays_pct: 'Participação', rays_vsavg: 'Contra a média', rays_rows: 'Linhas somadas', rays_largest: 'Maior registro',
  rays_ov_max: 'Maior', rays_ov_min: 'Menor', rays_ov_avg: 'Média', rays_ov_med: 'Mediana', rays_ov_n: 'Raios', rays_ov_hint: 'Passe o mouse num raio ou numa linha da lista.',
  rays_note: (shown, total, how, val, ent) => `Cada raio é um item de “${ent}”: ${how} de “${val}”. ${shown === total ? `${shown} itens.` : `Os ${shown} maiores de ${total} itens.`}`,
  rays_base: 'O comprimento parte do círculo central e é proporcional ao valor.', rays_neg: 'valores negativos aparecem em módulo',
  tut_rays_1_t: 'Cada raio é um item', tut_rays_1_p: 'O comprimento mostra o valor e a cor mostra o grupo. Os maiores chegam mais longe.',
  tut_rays_2_t: 'Passe o mouse e clique', tut_rays_2_p: 'A coluna do meio traz a lista completa e o cartão de detalhes. Passe o mouse num raio ou numa linha; clique para fixar.',
  tut_rays_3_t: 'Filtre e ordene', tut_rays_3_p: 'Escolha grupos, ordene por valor ou nome e limite aos maiores. Os raios se reorganizam em onda.',
  tut_rays_4_t: 'Apresente e exporte', tut_rays_4_p: 'Use Apresentar para percorrer grupo a grupo e exporte em HTML interativo ou imagem.',
});
Object.assign(I18N.en, {
  cs_off: 'Off', cs_more: 'More data charts', cs_agg: 'Calculation', cs_aggs: { sum: 'Sum', mean: 'Average', count: 'Count' },
  rays_h: 'Radial spokes', rays_help: 'One spoke per entity: length is the value and color is the group.', rays_ent: 'Entity (spoke)', rays_val: 'Value (length)', rays_grp: 'Group (color)',
  rays_sum: (n, g) => `${n} spokes${g ? ' · ' + g + ' groups' : ''}`, rays_none: 'This spreadsheet has no entities and values to build the radial spokes.',
  rays_sort: 'Sort', rays_s_value: 'Highest value', rays_s_name: 'Name (A–Z)', rays_s_orig: 'Spreadsheet order',
  rays_top: n => `Show the ${n} largest`, rays_topall: n => `Showing all (${n})`, rays_groups: 'Groups', rays_gshare: 'Value by group', rays_rank: 'Largest values',
  rays_items: 'items', rays_pos: 'Rank', rays_of: (r, n) => `${r} of ${n}`, rays_pct: 'Share', rays_vsavg: 'Versus average', rays_rows: 'Rows combined', rays_largest: 'Largest record',
  rays_ov_max: 'Largest', rays_ov_min: 'Smallest', rays_ov_avg: 'Average', rays_ov_med: 'Median', rays_ov_n: 'Spokes', rays_ov_hint: 'Hover a spoke or a row in the list.',
  rays_note: (shown, total, how, val, ent) => `Each spoke is an item of “${ent}”: ${how} of “${val}”. ${shown === total ? `${shown} items.` : `The ${shown} largest of ${total} items.`}`,
  rays_base: 'Length starts at the central circle and is proportional to the value.', rays_neg: 'negative values are drawn by magnitude',
  tut_rays_1_t: 'Each spoke is an item', tut_rays_1_p: 'Length shows the value and color shows the group. The largest reach farther.',
  tut_rays_2_t: 'Hover and click', tut_rays_2_p: 'The middle column holds the full list and the detail card. Hover a spoke or a row; click to pin it.',
  tut_rays_3_t: 'Filter and sort', tut_rays_3_p: 'Pick groups, sort by value or name and limit to the largest. The spokes reorganize in a wave.',
  tut_rays_4_t: 'Present and export', tut_rays_4_p: 'Use Present to walk through group by group and export as interactive HTML or image.',
});
Object.assign(I18N.pt, {
  river_h: 'Rio vertical', river_help: 'O tempo desce pela página; cada faixa é uma categoria e a largura é o valor. As maiores ficam por fora.', river_per: 'Período (vertical)', river_cat: 'Categoria (faixa)', river_val: 'Valor (largura)',
  river_sum: (p, c) => `${p} períodos · ${c} categorias`, river_none: 'Esta planilha não tem período, categorias e valores suficientes para o rio vertical.',
  river_order: 'Ordem das faixas', ro_edges: 'Maiores por fora', ro_value: 'Do maior ao menor', ro_name: 'Nome (A–Z)', river_mode: 'Escala', rm_abs: 'Valores', rm_share: 'Participação (100%)',
  river_cats: 'Categorias', river_rank: 'Total por categoria', river_range: 'Período',
  rv_in: 'Valor no período', rv_inshare: 'Parcela do período', rv_total: 'Total no intervalo', rv_share: 'Participação', rv_pos: 'Posição', rv_peak: 'Pico', rv_change: 'Primeiro ao último período', rv_rows: 'Linhas', rv_vsprev: 'Contra o período anterior', rv_top: 'Maiores no período',
  river_ov_n: 'Categorias', river_ov_peak: 'Período mais alto', river_ov_low: 'Período mais baixo', river_ov_lead: 'Maior categoria', river_ov_hint: 'Passe o mouse numa faixa, numa linha do tempo ou numa linha da lista.',
  river_note: (p, c, how, val, cat) => `Cada faixa é uma categoria de “${cat}”: ${how} de “${val}” em ${p} períodos. ${c}.`, river_oth: 'As categorias menores foram reunidas em “Outros”', river_all: 'Todas as categorias aparecem',
  river_neg: 'valores negativos não aparecem no rio',
  tut_river_1_t: 'O tempo desce pelo rio', tut_river_1_p: 'Cada faixa é uma categoria e a largura é o valor em cada período. As maiores ficam nas bordas; os círculos no alto somam cada categoria.',
  tut_river_2_t: 'Passe o mouse e clique', tut_river_2_p: 'Numa faixa, o cartão mostra o valor naquele período. Na lista da coluna do meio estão todas as categorias; clique para fixar.',
  tut_river_3_t: 'Recorte o período', tut_river_3_p: 'Arraste o intervalo, escolha categorias (ou clique num círculo do alto) e alterne entre valores e participação.',
  tut_river_4_t: 'Apresente e exporte', tut_river_4_p: 'Use Apresentar para destacar uma categoria por vez e exporte em HTML interativo ou imagem.',
});
Object.assign(I18N.en, {
  river_h: 'Vertical stream', river_help: 'Time runs down the page; each band is a category and its width is the value. The largest sit on the outside.', river_per: 'Period (vertical)', river_cat: 'Category (band)', river_val: 'Value (width)',
  river_sum: (p, c) => `${p} periods · ${c} categories`, river_none: 'This spreadsheet has no period, categories and values to build the vertical stream.',
  river_order: 'Band order', ro_edges: 'Largest outside', ro_value: 'Largest to smallest', ro_name: 'Name (A–Z)', river_mode: 'Scale', rm_abs: 'Values', rm_share: 'Share (100%)',
  river_cats: 'Categories', river_rank: 'Total by category', river_range: 'Period',
  rv_in: 'Value in the period', rv_inshare: 'Share of the period', rv_total: 'Total in range', rv_share: 'Share', rv_pos: 'Rank', rv_peak: 'Peak', rv_change: 'First to last period', rv_rows: 'Rows', rv_vsprev: 'Versus previous period', rv_top: 'Largest in the period',
  river_ov_n: 'Categories', river_ov_peak: 'Highest period', river_ov_low: 'Lowest period', river_ov_lead: 'Largest category', river_ov_hint: 'Hover a band, a time line or a row in the list.',
  river_note: (p, c, how, val, cat) => `Each band is a category of “${cat}”: ${how} of “${val}” over ${p} periods. ${c}.`, river_oth: 'Smaller categories were grouped into “Others”', river_all: 'All categories are shown',
  river_neg: 'negative values are not drawn in the stream',
  tut_river_1_t: 'Time flows down the stream', tut_river_1_p: 'Each band is a category and its width is the value in each period. The largest sit on the edges; the circles on top add up each category.',
  tut_river_2_t: 'Hover and click', tut_river_2_p: 'On a band, the card shows the value in that period. The middle column lists every category; click to pin.',
  tut_river_3_t: 'Slice the period', tut_river_3_p: 'Drag the range, pick categories (or click a circle on top) and switch between values and share.',
  tut_river_4_t: 'Present and export', tut_river_4_p: 'Use Present to spotlight one category at a time and export as interactive HTML or image.',
});
Object.assign(I18N.pt, {
  fan_h: 'Leque de barras', fan_help: 'Cada item é uma barra que sai de um eixo estreito, em leque: o comprimento é o valor e a cor é a categoria. Serve para centenas de itens.', fan_lab: 'Item (barra)', fan_val: 'Valor (comprimento)', fan_cat: 'Categoria (cor)', fan_rowsopt: 'Cada linha é um item',
  fan_sum: (n, c) => `${n} barras${c ? ' · ' + c + ' categorias' : ''}`, fan_none: 'Esta planilha não tem itens e valores suficientes para o leque de barras.',
  fan_sort: 'Ordenar', fan_s_value: 'Maior valor', fan_s_orig: 'Ordem da planilha', fan_s_cat: 'Categoria', fan_s_name: 'Nome (A–Z)', fan_cats: 'Categorias', fan_share: 'Valor por categoria', fan_rank: 'Maiores valores',
  fan_catpos: (r, c) => `${r}º em ${c}`, fan_ov_n: 'Itens', fan_ov_hint: 'Passe o mouse numa barra, no eixo ou numa linha da lista.',
  fan_note: (shown, total, how, val, lab) => `Cada barra é um item de “${lab}”: ${how} de “${val}”. ${shown === total ? `${shown} itens.` : `Os ${shown} maiores de ${total} itens.`}`, fan_neg: 'valores negativos aparecem em módulo',
  tut_fan_1_t: 'Cada barra é um item', tut_fan_1_p: 'As barras saem do eixo à direita e se abrem em leque. O comprimento é o valor; a cor é a categoria.',
  tut_fan_2_t: 'Passe o mouse e clique', tut_fan_2_p: 'A barra sob o mouse mostra o nome no eixo, e a coluna do meio traz o cartão e a lista completa. Clique para fixar.',
  tut_fan_3_t: 'Filtre e ordene', tut_fan_3_p: 'Escolha categorias, ordene por valor, ordem da planilha ou categoria e limite aos maiores. O leque se reorganiza em onda.',
  tut_fan_4_t: 'Apresente e exporte', tut_fan_4_p: 'Use Apresentar para percorrer categoria a categoria e exporte em HTML interativo ou imagem.',
});
Object.assign(I18N.en, {
  fan_h: 'Bar fan', fan_help: 'Each item is a bar leaving a narrow axis in a fan: length is the value and color is the category. Built for hundreds of items.', fan_lab: 'Item (bar)', fan_val: 'Value (length)', fan_cat: 'Category (color)', fan_rowsopt: 'Each row is an item',
  fan_sum: (n, c) => `${n} bars${c ? ' · ' + c + ' categories' : ''}`, fan_none: 'This spreadsheet has no items and values to build the bar fan.',
  fan_sort: 'Sort', fan_s_value: 'Highest value', fan_s_orig: 'Spreadsheet order', fan_s_cat: 'Category', fan_s_name: 'Name (A–Z)', fan_cats: 'Categories', fan_share: 'Value by category', fan_rank: 'Largest values',
  fan_catpos: (r, c) => `${r} in ${c}`, fan_ov_n: 'Items', fan_ov_hint: 'Hover a bar, the axis or a row in the list.',
  fan_note: (shown, total, how, val, lab) => `Each bar is an item of “${lab}”: ${how} of “${val}”. ${shown === total ? `${shown} items.` : `The ${shown} largest of ${total} items.`}`, fan_neg: 'negative values are drawn by magnitude',
  tut_fan_1_t: 'Each bar is an item', tut_fan_1_p: 'Bars leave the axis on the right and open in a fan. Length is the value; color is the category.',
  tut_fan_2_t: 'Hover and click', tut_fan_2_p: 'The bar under the mouse shows its name on the axis, and the middle column holds the card and the full list. Click to pin.',
  tut_fan_3_t: 'Filter and sort', tut_fan_3_p: 'Pick categories, sort by value, spreadsheet order or category and limit to the largest. The fan reorganizes in a wave.',
  tut_fan_4_t: 'Present and export', tut_fan_4_p: 'Use Present to walk through category by category and export as interactive HTML or image.',
});
Object.assign(I18N.pt, {
  ridge_h: 'Cordilheira isométrica', ridge_help: 'Uma cadeia em relevo por entidade, em projeção isométrica: a altura é o valor ao longo do tempo. Com uma dimensão de dois valores, as cadeias se comparam em duas cores.', ridge_ent: 'Entidade (cadeia)', ridge_time: 'Período (ao longo da cadeia)', ridge_val: 'Valor (altura)', ridge_cmp: 'Comparar dois valores (cor)',
  ridge_sum: (e, t, c) => `${e} cadeias · ${t} períodos${c ? ' · ' + c : ''}`, ridge_none: 'Esta planilha não tem entidades, período e valores suficientes para a cordilheira isométrica.',
  rg_sort: 'Ordenar', rg_s_value: 'Maior total', rg_s_peak: 'Maior pico', rg_s_name: 'Nome (A–Z)', rg_s_orig: 'Ordem da planilha', rg_cmp: 'Comparação', rg_range: 'Período', rg_rank: 'Maiores totais',
  rg_time: 'Período', rg_total: 'Total no intervalo', rg_avgint: 'Média no intervalo', rg_pos: 'Posição', rg_peak: 'Pico', rg_change: 'Primeiro ao último período', rg_avg: 'Média por período', rg_vs: 'Diferença', rg_share: 'Participação da comparação',
  rg_ov_n: 'Cadeias', rg_ov_peak: 'Maior pico', rg_ov_hint: 'Passe o mouse numa cadeia ou numa linha da lista.',
  ridge_note: (e, t, how, val, ent) => `Cada cadeia é um item de “${ent}”: ${how} de “${val}” em ${t} períodos. ${e}`, ridge_cut: n => `Mostrando as ${n} maiores.`, ridge_all: 'Todas as cadeias aparecem.', ridge_neg: 'Valores negativos não aparecem.',
  ridge_ins: (a, b, d, pa, pb) => `${a} somou ${pa} contra ${pb} de ${b} (${d}).`, ridge_ins_t: 'Comparação entre os dois valores', ridge_ins_f: 'Soma de cada lado no período e diferença percentual do primeiro sobre o segundo',
  tut_ridge_1_t: 'Cada cadeia é uma entidade', tut_ridge_1_p: 'A altura mostra o valor ao longo do tempo, da esquerda para a direita. As cores comparam os dois lados da dimensão.',
  tut_ridge_2_t: 'Passe o mouse e clique', tut_ridge_2_p: 'Ao passar numa cadeia, uma marca vertical mostra o período e o cartão traz os valores. A lista da coluna do meio tem todas as cadeias.',
  tut_ridge_3_t: 'Recorte e compare', tut_ridge_3_p: 'Ajuste o intervalo, escolha um dos lados da comparação, ordene e limite às maiores. A cordilheira se acomoda em onda.',
  tut_ridge_4_t: 'Apresente e exporte', tut_ridge_4_p: 'Use Apresentar para destacar uma cadeia por vez e exporte em HTML interativo ou imagem.',
});
Object.assign(I18N.en, {
  ridge_h: 'Isometric ridgeline', ridge_help: 'One relief chain per entity, in isometric projection: height is the value over time. With a two-value dimension, chains compare in two colors.', ridge_ent: 'Entity (chain)', ridge_time: 'Period (along the chain)', ridge_val: 'Value (height)', ridge_cmp: 'Compare two values (color)',
  ridge_sum: (e, t, c) => `${e} chains · ${t} periods${c ? ' · ' + c : ''}`, ridge_none: 'This spreadsheet has no entities, period and values to build the isometric ridgeline.',
  rg_sort: 'Sort', rg_s_value: 'Largest total', rg_s_peak: 'Highest peak', rg_s_name: 'Name (A–Z)', rg_s_orig: 'Spreadsheet order', rg_cmp: 'Comparison', rg_range: 'Period', rg_rank: 'Largest totals',
  rg_time: 'Period', rg_total: 'Total in range', rg_avgint: 'Average in range', rg_pos: 'Rank', rg_peak: 'Peak', rg_change: 'First to last period', rg_avg: 'Average per period', rg_vs: 'Difference', rg_share: 'Comparison share',
  rg_ov_n: 'Chains', rg_ov_peak: 'Highest peak', rg_ov_hint: 'Hover a chain or a row in the list.',
  ridge_note: (e, t, how, val, ent) => `Each chain is an item of “${ent}”: ${how} of “${val}” over ${t} periods. ${e}`, ridge_cut: n => `Showing the ${n} largest.`, ridge_all: 'All chains are shown.', ridge_neg: 'Negative values are not drawn.',
  ridge_ins: (a, b, d, pa, pb) => `${a} totaled ${pa} against ${pb} for ${b} (${d}).`, ridge_ins_t: 'Comparison between the two values', ridge_ins_f: 'Sum of each side in the period and percentage difference of the first over the second',
  tut_ridge_1_t: 'Each chain is an entity', tut_ridge_1_p: 'Height shows the value over time, left to right. Colors compare the two sides of the dimension.',
  tut_ridge_2_t: 'Hover and click', tut_ridge_2_p: 'Over a chain, a vertical mark shows the period and the card brings the values. The middle column lists every chain.',
  tut_ridge_3_t: 'Slice and compare', tut_ridge_3_p: 'Adjust the range, pick one side of the comparison, sort and limit to the largest. The ridgeline settles in a wave.',
  tut_ridge_4_t: 'Present and export', tut_ridge_4_p: 'Use Present to spotlight one chain at a time and export as interactive HTML or image.',
});
Object.assign(I18N.pt, {
  flow_h: 'Fluxo em funil', flow_help: 'De 2 a 5 colunas de categoria em sequência (etapas). As fitas mostram para onde cada item vai de uma etapa para a próxima; o que não segue sai do funil.', flow_none: 'Esta planilha não tem etapas (colunas de categoria em sequência) suficientes para o fluxo em funil.',
  flow_s1: 'Etapa 1 (topo)', flow_s2: 'Etapa 2', flow_s3: 'Etapa 3', flow_s4: 'Etapa 4', flow_s5: 'Etapa 5', flow_val: 'Valor (largura)', flow_valopt: 'Contar linhas',
  flow_sum: (s, n) => `${s} etapas · ${n} nós`, flow_order: 'Ordem dos nós', fo_flow: 'Menos cruzamentos', fo_size: 'Maiores primeiro', fo_name: 'Nome (A–Z)', flow_mode: 'Números', fm_abs: 'Valores', fm_pct: '% da primeira etapa',
  flow_sel: 'Caminho selecionado', flow_sel_none: 'Clique num nó para ver só os itens que passam por ele. Clique de novo para tirar.', flow_clear: 'Limpar', flow_conv: 'Conversão por etapa', flow_paths: 'Principais caminhos', flow_stage: 'Etapa',
  fl_of: 'Parcela da etapa', fl_in: 'Vem de', fl_out: 'Vai para', fl_exit: 'Saem do funil', fl_keep: 'Seguem para a próxima etapa', fl_first: 'Parcela da primeira etapa', fl_from: 'Origem', fl_to: 'Destino', fl_pct_src: 'Do total da origem', fl_pct_tgt: 'Do total do destino', fl_rows: 'Linhas',
  fl_ov_in: 'Entram', fl_ov_out: 'Chegam ao fim', fl_ov_conv: 'Conversão total', fl_ov_drop: 'Maior queda', fl_ov_hint: 'Passe o mouse num nó ou numa fita; clique num nó para filtrar o caminho.', fl_ov_filter: 'Filtrando por',
  flow_note: (how, val, st) => `${how} de “${val}” entre as etapas ${st}. As fitas ligam uma etapa à seguinte; o que não segue sai do funil.`, flow_oth: 'Categorias menores foram reunidas em “Outros”.',
  flow_ins_conv: (a, b, p, na, nb) => `${p} dos itens que entram em “${a}” chegam a “${b}” (${nb} de ${na}).`, flow_ins_conv_t: 'Conversão da primeira à última etapa', flow_ins_conv_f: 'Total da última etapa ÷ total da primeira etapa',
  flow_ins_drop: (a, b, p) => `A maior queda está entre “${a}” e “${b}”: ${p} dos itens não seguem.`, flow_ins_drop_t: 'Maior queda entre etapas', flow_ins_drop_f: '1 − (total da etapa seguinte ÷ total da etapa)',
  flow_ins_path: (path, p) => `O caminho completo mais comum, ${path}, concentra ${p} do que entra.`, flow_ins_path_t: 'Caminho completo mais comum', flow_ins_path_f: 'Valor do caminho ÷ total da primeira etapa',
  tut_flow_1_t: 'Cada camada é uma etapa', tut_flow_1_p: 'O número grande é o total da etapa e a queda mostra quanto não segue. As fitas têm largura proporcional ao valor.',
  tut_flow_2_t: 'Passe o mouse e clique', tut_flow_2_p: 'Num nó ou numa fita, o cartão mostra de onde vem e para onde vai. Clique num nó para filtrar só o caminho que passa por ele.',
  tut_flow_3_t: 'Leia o caminho', tut_flow_3_p: 'Veja a conversão por etapa e os principais caminhos. Passe o mouse num caminho para destacá-lo no funil.',
  tut_flow_4_t: 'Apresente e exporte', tut_flow_4_p: 'Use Apresentar para percorrer etapa por etapa e exporte em HTML interativo ou imagem.',
});
Object.assign(I18N.en, {
  flow_h: 'Funnel flow', flow_help: '2 to 5 category columns in sequence (stages). Ribbons show where each item goes from one stage to the next; what does not continue drops out of the funnel.', flow_none: 'This spreadsheet has no stages (category columns in sequence) to build the funnel flow.',
  flow_s1: 'Stage 1 (top)', flow_s2: 'Stage 2', flow_s3: 'Stage 3', flow_s4: 'Stage 4', flow_s5: 'Stage 5', flow_val: 'Value (width)', flow_valopt: 'Count rows',
  flow_sum: (s, n) => `${s} stages · ${n} nodes`, flow_order: 'Node order', fo_flow: 'Fewer crossings', fo_size: 'Largest first', fo_name: 'Name (A–Z)', flow_mode: 'Numbers', fm_abs: 'Values', fm_pct: '% of first stage',
  flow_sel: 'Selected path', flow_sel_none: 'Click a node to see only the items that pass through it. Click again to remove.', flow_clear: 'Clear', flow_conv: 'Conversion by stage', flow_paths: 'Main paths', flow_stage: 'Stage',
  fl_of: 'Share of the stage', fl_in: 'Comes from', fl_out: 'Goes to', fl_exit: 'Leave the funnel', fl_keep: 'Continue to next stage', fl_first: 'Share of the first stage', fl_from: 'From', fl_to: 'To', fl_pct_src: 'Of the origin total', fl_pct_tgt: 'Of the destination total', fl_rows: 'Rows',
  fl_ov_in: 'Enter', fl_ov_out: 'Reach the end', fl_ov_conv: 'Overall conversion', fl_ov_drop: 'Largest drop', fl_ov_hint: 'Hover a node or ribbon; click a node to filter the path.', fl_ov_filter: 'Filtering by',
  flow_note: (how, val, st) => `${how} of “${val}” across stages ${st}. Ribbons link one stage to the next; what does not continue drops out of the funnel.`, flow_oth: 'Smaller categories were grouped into “Others”.',
  flow_ins_conv: (a, b, p, na, nb) => `${p} of the items entering “${a}” reach “${b}” (${nb} of ${na}).`, flow_ins_conv_t: 'Conversion from first to last stage', flow_ins_conv_f: 'Last stage total ÷ first stage total',
  flow_ins_drop: (a, b, p) => `The largest drop is between “${a}” and “${b}”: ${p} of the items do not continue.`, flow_ins_drop_t: 'Largest drop between stages', flow_ins_drop_f: '1 − (next stage total ÷ stage total)',
  flow_ins_path: (path, p) => `The most common full path, ${path}, holds ${p} of what enters.`, flow_ins_path_t: 'Most common full path', flow_ins_path_f: 'Path value ÷ first stage total',
  tut_flow_1_t: 'Each layer is a stage', tut_flow_1_p: 'The big number is the stage total and the drop shows how much does not continue. Ribbon width is proportional to the value.',
  tut_flow_2_t: 'Hover and click', tut_flow_2_p: 'On a node or ribbon, the card shows where it comes from and where it goes. Click a node to filter only the path through it.',
  tut_flow_3_t: 'Read the path', tut_flow_3_p: 'See conversion by stage and the main paths. Hover a path to highlight it in the funnel.',
  tut_flow_4_t: 'Present and export', tut_flow_4_p: 'Use Present to walk stage by stage and export as interactive HTML or image.',
});
Object.assign(I18N.pt, {
  tg_rec: 'Recomendados para seus dados', tg_more: 'Também disponíveis', tg_need: 'Precisam de outros dados', tg_fix: 'Ajustar dados', tg_all: n => `${n} gráficos`,
  chart_nodata: 'Este projeto foi aberto sem a planilha. Suba a planilha em “Editar mapeamento” para liberar os outros gráficos.', chart_remapped: n => `Mapeamento ajustado para ${n}.`, chart_cant: (n, w) => `${n}: ${w}`,
  why_organism: 'Precisa de período e entidades', why_rays: 'Precisa de uma entidade com 3+ itens e um valor', why_river: 'Precisa de data, 3+ categorias e um valor', why_fan: 'Precisa de 8+ itens e um valor', why_ridge: 'Precisa de data, entidades e um valor', why_flow: 'Precisa de 2 a 5 colunas de categoria em sequência',
  why_bars: 'Precisa de uma categoria e um valor', why_hbars: 'Precisa de uma categoria e um valor', why_stacked100: 'Precisa de uma segunda categoria (série)', why_treemap: 'Precisa de categoria e valor (com série)', why_race: 'Precisa de data, 3+ séries e 4+ períodos',
  why_line: 'Precisa de uma coluna de data e um valor', why_area: 'Precisa de uma coluna de data e um valor', why_calendar: 'Precisa de datas por dia e um valor', why_scatter: 'Precisa de duas colunas de número', why_bubble: 'Precisa de três colunas de número', why_kpi: 'Precisa de um valor',
  lp_also: 'Também: ',
});
Object.assign(I18N.en, {
  tg_rec: 'Recommended for your data', tg_more: 'Also available', tg_need: 'Need other data', tg_fix: 'Adjust data', tg_all: n => `${n} charts`,
  chart_nodata: 'This project was opened without the spreadsheet. Upload it in “Edit mapping” to unlock the other charts.', chart_remapped: n => `Mapping adjusted for ${n}.`, chart_cant: (n, w) => `${n}: ${w}`,
  why_organism: 'Needs a period and entities', why_rays: 'Needs an entity with 3+ items and a value', why_river: 'Needs a date, 3+ categories and a value', why_fan: 'Needs 8+ items and a value', why_ridge: 'Needs a date, entities and a value', why_flow: 'Needs 2 to 5 category columns in sequence',
  why_bars: 'Needs a category and a value', why_hbars: 'Needs a category and a value', why_stacked100: 'Needs a second category (series)', why_treemap: 'Needs a category and a value (with series)', why_race: 'Needs a date, 3+ series and 4+ periods',
  why_line: 'Needs a date column and a value', why_area: 'Needs a date column and a value', why_calendar: 'Needs daily dates and a value', why_scatter: 'Needs two number columns', why_bubble: 'Needs three number columns', why_kpi: 'Needs a value',
  lp_also: 'Also: ',
});
Object.assign(I18N.pt, { pwa_install: 'Instalar app', pwa_done: 'Datavix instalado. Ele abre offline, como um app.', pwa_update: 'Há uma versão nova do Datavix.', pwa_update_cta: 'Atualizar' });
Object.assign(I18N.en, { pwa_install: 'Install app', pwa_done: 'Datavix installed. It opens offline, like an app.', pwa_update: 'A new version of Datavix is ready.', pwa_update_cta: 'Update' });
/* onboarding: "Outro" nas perguntas de público, decisão e história (as etapas 05 e 06 não têm) */
for (const k of Object.keys(I18N.pt.o)) { I18N.pt.o[k].other = ['Outro', 'Descreva do seu jeito']; I18N.en.o[k].other = ['Other', 'Describe it your way']; }
Object.assign(I18N.pt, {
  ob_other_l: 'Descreva em poucas palavras (opcional)', ob_other_note: 'Se a descrição trouxer uma palavra que o Datavix reconhece, ele usa a opção mais próxima; senão segue com a escolha mais neutra. Você muda tudo depois, no editor.',
  ob_other_ph: { audience: 'Ex.: reunião com o conselho consultivo', decision: 'Ex.: decidir qual canal receber mais verba', story: 'Ex.: como a receita varia entre as lojas' },
});
Object.assign(I18N.en, {
  ob_other_l: 'Describe it in a few words (optional)', ob_other_note: 'If the description has a word Datavix recognizes, it uses the closest option; otherwise it goes with the most neutral choice. You can change everything later in the editor.',
  ob_other_ph: { audience: 'E.g.: meeting with the advisory board', decision: 'E.g.: decide which channel gets more budget', story: 'E.g.: how revenue varies across stores' },
});

/* ---- celular: menu, painel em folha e instalação no iPhone ---- */
Object.assign(I18N.pt, {
  menu_h: 'Menu', menu_open: 'Abrir menu', menu_close: 'Fechar menu', m_lang: 'Idioma', m_theme: 'Tema', m_light: 'Claro', m_dark: 'Escuro',
  m_edit: 'Editar', m_present: 'Apresentar', sheet_h: 'Editar peça', sheet_close: 'Fechar painel', sheet_open: 'Abrir painel de edição',
  m_ios_item: 'Instalar no iPhone', m_ios_h: 'Instalar no iPhone ou iPad',
  m_ios: ['Toque em Compartilhar, o quadrado com a seta para cima, na barra do Safari.', 'Role a lista e escolha "Adicionar à Tela de Início".', 'Toque em "Adicionar". O Datavix passa a abrir como um app, em tela cheia.'],
  m_ios_note: 'No iPhone e no iPad a instalação é feita pelo Safari.',
});
Object.assign(I18N.en, {
  menu_h: 'Menu', menu_open: 'Open menu', menu_close: 'Close menu', m_lang: 'Language', m_theme: 'Theme', m_light: 'Light', m_dark: 'Dark',
  m_edit: 'Edit', m_present: 'Present', sheet_h: 'Edit piece', sheet_close: 'Close panel', sheet_open: 'Open edit panel',
  m_ios_item: 'Install on iPhone', m_ios_h: 'Install on iPhone or iPad',
  m_ios: ['Tap Share, the square with an arrow pointing up, in the Safari toolbar.', 'Scroll the list and choose "Add to Home Screen".', 'Tap "Add". Datavix then opens as a full-screen app.'],
  m_ios_note: 'On iPhone and iPad, installing is done from Safari.',
});

/* ---- painel em abas e fontes ---- */
Object.assign(I18N.pt, { tab_chart: 'Gráfico', tab_style: 'Visual', tab_share: 'Exportar', fc_sober: 'Sóbrio', fc_editorial: 'Editorial', fc_tech: 'Tecnológico', fc_bold: 'Expressivo', fp_sample: 'Receita por categoria' });
Object.assign(I18N.en, { tab_chart: 'Chart', tab_style: 'Style', tab_share: 'Export', fc_sober: 'Clean', fc_editorial: 'Editorial', fc_tech: 'Technical', fc_bold: 'Expressive', fp_sample: 'Revenue by category' });
