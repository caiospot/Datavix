// Confere o SEO do site montado (dist/): head de cada página, canonical e hreflang recíprocos, Open Graph e Twitter, dados estruturados,
// títulos e links, imagens, CSP, sitemap.xml, robots.txt, llms.txt e o noindex do app. Não abre navegador e não usa a rede.
// Uso: node test/seo-check.mjs [pasta-do-site] [--origin=https://datavix.app]   (padrão: dist/ e a origem lida do canonical da página inicial)
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const arg = process.argv.slice(2), DIST = path.resolve(arg.find(a => !a.startsWith('--')) || new URL('../dist', import.meta.url).pathname);
const out = [], bad = [], warn = [];
const ok = (k, v, extra) => { out.push(`${v ? 'ok    ' : 'FALHOU'} ${k}${extra ? ' · ' + extra : ''}`); if (!v) bad.push(k); };
const note = (k, extra) => warn.push(`aviso  ${k}${extra ? ' · ' + extra : ''}`);
const read = f => fs.readFileSync(path.join(DIST, f));
const exists = f => fs.existsSync(path.join(DIST, f));
const dec = s => String(s).replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const attrs = s => { const o = {}; for (const m of s.matchAll(/([a-zA-Z:_-]+)(?:="([^"]*)")?/g)) o[m[1].toLowerCase()] = m[2] === undefined ? '' : dec(m[2]); return o; };
const strip = h => dec(h.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();

// ------------------------------------------------------------ páginas (a partir do sitemap) e a origem
ok('sitemap.xml existe', exists('sitemap.xml'));
const sm = exists('sitemap.xml') ? read('sitemap.xml').toString('utf8') : '';
const urls = [...sm.matchAll(/<url>([\s\S]*?)<\/url>/g)].map(m => ({ loc: (/<loc>([^<]+)<\/loc>/.exec(m[1]) || [])[1], lastmod: (/<lastmod>([^<]+)<\/lastmod>/.exec(m[1]) || [])[1], alts: [...m[1].matchAll(/<xhtml:link rel="alternate" hreflang="([^"]+)" href="([^"]+)"\/>/g)].map(a => ({ hl: a[1], href: a[2] })) }));
const homeHtml = exists('index.html') ? read('index.html').toString('utf8') : '';
const ORIGIN = ((arg.find(a => a.startsWith('--origin=')) || '').slice(9) || (/<link rel="canonical" href="(https:\/\/[^/"]+)\/"/.exec(homeHtml) || [])[1] || '').replace(/\/$/, '');
ok('origem do site (https, sem barra no fim)', /^https:\/\/[a-z0-9.-]+$/.test(ORIGIN), ORIGIN);
const pathOf = loc => loc.replace(ORIGIN, ''), fileOf = p => (p.replace(/^\//, '') + 'index.html');
ok('o sitemap tem 20 páginas (10 em PT e 10 em EN)', urls.length === 20 && urls.filter(u => u.loc.startsWith(ORIGIN + '/en/')).length === 10, String(urls.length));
ok('todas as URLs do sitemap são absolutas, com barra no fim e únicas', urls.every(u => u.loc.startsWith(ORIGIN + '/') && u.loc.endsWith('/') && !/[?#]/.test(u.loc)) && new Set(urls.map(u => u.loc)).size === urls.length);
ok('lastmod válido em todas (AAAA-MM-DD, não no futuro)', urls.every(u => /^\d{4}-\d{2}-\d{2}$/.test(u.lastmod || '') && !isNaN(Date.parse(u.lastmod)) && Date.parse(u.lastmod) <= Date.now() + 864e5));
ok('cada URL do sitemap tem as 3 alternativas (pt-BR, en, x-default) e inclui a si mesma', urls.every(u => ['pt-BR', 'en', 'x-default'].every(h => u.alts.some(a => a.hl === h)) && u.alts.some(a => a.href === u.loc)));
ok('todas as URLs do sitemap existem no site', urls.every(u => exists(fileOf(pathOf(u.loc)))), urls.filter(u => !exists(fileOf(pathOf(u.loc)))).map(u => u.loc).join(' '));

const pages = urls.map(u => ({ ...u, path: pathOf(u.loc), file: fileOf(pathOf(u.loc)) })).filter(p => exists(p.file)).map(p => {
  const html = read(p.file).toString('utf8'), head = (/<head>([\s\S]*?)<\/head>/.exec(html) || [])[1] || '', body = (/<body>([\s\S]*?)<\/body>/.exec(html) || [])[1] || '';
  const metas = [...head.matchAll(/<meta\s+([^>]*)>/g)].map(m => attrs(m[1])), links = [...head.matchAll(/<link\s+([^>]*)>/g)].map(m => attrs(m[1]));
  const m = (k, v = 'name') => (metas.find(x => x[v] === k) || {}).content;
  return { ...p, html, head, body, metas, links, m, bytes: Buffer.byteLength(html), title: dec((/<title>([^<]*)<\/title>/.exec(head) || [])[1] || ''), lang: (/<html lang="([^"]+)"/.exec(html) || [])[1], text: strip(body) };
});
const byLoc = Object.fromEntries(pages.map(p => [p.loc, p]));
const css = pages[0] ? (/<style>([\s\S]*?)<\/style>/.exec(pages[0].head) || [])[1] || '' : '';
const STOP = { 'pt-BR': /\b(de|que|para|com|uma|não|os|as|do|da|em|no|na|um|seu|sua|você|planilha)\b/gi, en: /\b(the|and|of|to|in|is|for|with|your|that|it|on|you|are|spreadsheet)\b/gi };

// ------------------------------------------------------------ cada página
const titles = new Set(), descs = new Set();
for (const p of pages) {
  const tag = `[${p.path}]`, h1s = [...p.body.matchAll(/<h1[\s>]/g)].length;
  ok(`${tag} título entre 15 e 65 caracteres`, p.title.length >= 15 && p.title.length <= 65, `${p.title.length}: ${p.title}`);
  const d = p.m('description') || ''; ok(`${tag} descrição entre 70 e 165 caracteres`, d.length >= 70 && d.length <= 165, String(d.length));
  ok(`${tag} título e descrição únicos no site`, !titles.has(p.title) && !descs.has(d)); titles.add(p.title); descs.add(d);
  const canon = p.links.filter(l => l.rel === 'canonical'); ok(`${tag} um canonical, absoluto e igual à URL da página`, canon.length === 1 && canon[0].href === p.loc, canon.map(c => c.href).join());
  const alts = p.links.filter(l => l.rel === 'alternate' && l.hreflang); ok(`${tag} hreflang: pt-BR, en e x-default, absolutos`, ['pt-BR', 'en', 'x-default'].every(h => alts.filter(a => a.hreflang === h).length === 1) && alts.every(a => /^https:\/\//.test(a.href) && byLoc[a.href]));
  ok(`${tag} hreflang bate com o do sitemap`, JSON.stringify(alts.map(a => [a.hreflang, a.href]).sort()) === JSON.stringify(p.alts.map(a => [a.hl, a.href]).sort()));
  const rec = alts.every(a => { const t = byLoc[a.href]; if (!t) return false; const ta = t.links.filter(l => l.rel === 'alternate' && l.hreflang); return ta.some(x => x.hreflang === (p.lang === 'en' ? 'en' : 'pt-BR') && x.href === p.loc); }); ok(`${tag} hreflang recíproco (cada alternativa aponta de volta para esta página)`, rec);
  ok(`${tag} <html lang> é pt-BR ou en e o texto está no idioma certo`, ['pt-BR', 'en'].includes(p.lang) && (p.text.match(STOP[p.lang]) || []).length > (p.text.match(STOP[p.lang === 'en' ? 'pt-BR' : 'en']) || []).length * 2, `${p.lang}`);
  ok(`${tag} a URL do idioma bate com o lang (/en/ só em inglês)`, (p.path.startsWith('/en/')) === (p.lang === 'en'));
  ok(`${tag} viewport e charset`, !!p.m('viewport') && /<meta charset="utf-8">/i.test(p.head));
  ok(`${tag} robots: indexável (sem noindex)`, !/noindex/i.test(p.m('robots') || '') && /max-image-preview:large/.test(p.m('robots') || ''));
  const og = k => p.m(k, 'property'); ok(`${tag} Open Graph completo (type, site_name, title, description, url, locale, image com tipo, tamanho e alt)`, og('og:type') === 'website' && og('og:site_name') === 'Datavix' && og('og:title') === p.title && og('og:description') === d && og('og:url') === p.loc && /^(pt_BR|en_US)$/.test(og('og:locale') || '') && /^https:\/\/.*\.png$/.test(og('og:image') || '') && og('og:image:width') === '1200' && og('og:image:height') === '630' && !!og('og:image:alt') && og('og:image:type') === 'image/png');
  const img = (og('og:image') || '').replace(ORIGIN, ''), png = exists(img.replace(/^\//, '')) ? read(img.replace(/^\//, '')) : null;
  ok(`${tag} a imagem de compartilhamento existe, é PNG 1200×630 e tem menos de 400 KB`, !!png && png.subarray(1, 4).toString() === 'PNG' && png.readUInt32BE(16) === 1200 && png.readUInt32BE(20) === 630 && png.length < 400 * 1024, png ? `${png.readUInt32BE(16)}×${png.readUInt32BE(20)}, ${(png.length / 1024).toFixed(0)} KB` : 'ausente');
  ok(`${tag} Twitter Card (summary_large_image, título, descrição, imagem e alt)`, p.m('twitter:card') === 'summary_large_image' && p.m('twitter:title') === p.title && p.m('twitter:description') === d && p.m('twitter:image') === og('og:image') && !!p.m('twitter:image:alt'));
  ok(`${tag} ícones (favicon.ico, favicon.svg, ícone 192 e apple-touch-icon) existem`, [['icon', 'image/svg+xml'], ['apple-touch-icon']].every(([r, t]) => p.links.some(l => l.rel === r && (!t || l.type === t))) && p.links.filter(l => /icon/.test(l.rel)).every(l => exists(l.href.replace(/^\//, ''))));
  // dados estruturados
  const lds = [...p.head.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => m[1]); let g = null; try { g = JSON.parse(lds[0]); } catch (e) { g = null; }
  const nodes = g && g['@graph'] ? g['@graph'] : [], T = t => nodes.filter(n => [].concat(n['@type']).includes(t));
  ok(`${tag} JSON-LD válido, com Organization, WebSite, WebApplication e a página`, lds.length === 1 && !!g && g['@context'] === 'https://schema.org' && T('Organization').length === 1 && T('WebSite').length === 1 && T('WebApplication').length === 1 && nodes.some(n => n.url === p.loc && /WebPage|Article|FAQPage|CollectionPage/.test([].concat(n['@type']).join())));
  ok(`${tag} JSON-LD: Organization com logo e sameAs; WebApplication gratuito, sem nota ou avaliação inventada`, !!T('Organization')[0] && !!T('Organization')[0].logo && T('Organization')[0].sameAs.length >= 1 && T('WebApplication')[0] && T('WebApplication')[0].offers.price === '0' && !/aggregateRating|"review"/.test(lds[0] || ''));
  if (p.path !== '/' && p.path !== '/en/') { const bc = T('BreadcrumbList')[0]; ok(`${tag} BreadcrumbList com 2 itens (início e esta página)`, !!bc && bc.itemListElement.length === 2 && bc.itemListElement[1].item === p.loc && bc.itemListElement[0].item === (p.lang === 'en' ? ORIGIN + '/en/' : ORIGIN + '/')); }
  const faq = T('FAQPage'); for (const f of faq) ok(`${tag} FAQPage: cada pergunta e resposta aparece no texto visível da página`, f.mainEntity.length >= 1 && f.mainEntity.every(q => p.text.includes(q.name) && p.text.includes(q.acceptedAnswer.text.slice(0, 40))), `${f.mainEntity.length} perguntas`);
  // conteúdo e estrutura
  ok(`${tag} um único h1, e os títulos não pulam nível`, h1s === 1 && (() => { let prev = 0; for (const m of p.body.matchAll(/<h([1-6])[\s>]/g)) { const n = +m[1]; if (prev && n > prev + 1) return false; prev = n; } return true; })());
  ok(`${tag} ids únicos e os links #âncora existem na própria página`, (() => { const ids = [...p.body.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]); return new Set(ids).size === ids.length && [...p.body.matchAll(/href="#([^"]+)"/g)].every(m => m[1] === 'main' || ids.includes(m[1])); })());
  const imgs = [...p.body.matchAll(/<img\s+([^>]*)>/g)].map(m => attrs(m[1])); ok(`${tag} imagens: alt, largura e altura, arquivo existente; só a primeira é prioritária`, imgs.every(i => i.alt && i.width && i.height && exists(i.src.replace(/^\//, '')) && (!i.srcset || i.srcset.split(',').every(s => exists(s.trim().split(' ')[0].replace(/^\//, ''))))) && imgs.filter(i => !i.loading).length <= 1, `${imgs.length} imagem(ns)`);
  const as = [...p.body.matchAll(/<a\s+([^>]*)>([\s\S]*?)<\/a>/g)].map(m => ({ ...attrs(m[1]), txt: strip(m[2]) }));
  const internal = as.filter(a => a.href && a.href.startsWith('/')), ext = as.filter(a => /^https?:\/\//.test(a.href || ''));
  ok(`${tag} links internos resolvem para páginas ou arquivos que existem`, internal.every(a => { const f = a.href.split('#')[0].split('?')[0].replace(/^\//, ''); return exists(f === '' ? 'index.html' : f.endsWith('/') ? f + 'index.html' : f); }), internal.filter(a => { const f = a.href.split('#')[0].split('?')[0].replace(/^\//, ''); return !exists(f === '' ? 'index.html' : f.endsWith('/') ? f + 'index.html' : f); }).map(a => a.href).join(' '));
  ok(`${tag} links externos só para o GitHub do projeto, com rel=noopener`, ext.every(a => /^https:\/\/(github\.com\/caiospot\/Datavix(\/issues)?)$/.test(a.href) && /noopener/.test(a.rel || '')), ext.map(a => a.href).join(' '));
  ok(`${tag} todo link tem texto`, as.every(a => a.txt.length > 0 || a['aria-label']));
  ok(`${tag} pelo menos um link para o app (/app/) e 3 para outras páginas do site`, as.some(a => /^\/app\/(\?lang=en)?$/.test(a.href || '')) && new Set(internal.map(a => a.href.split('#')[0]).filter(h => h !== p.path && !h.startsWith('/app/'))).size >= 3);
  ok(`${tag} o link do app leva o idioma da página (/app/?lang=en em inglês)`, as.filter(a => /^\/app\//.test(a.href || '')).every(a => a.href === (p.lang === 'en' ? '/app/?lang=en' : '/app/')));
  ok(`${tag} link para a outra língua (hreflang) no topo e no rodapé`, as.filter(a => a.hreflang === (p.lang === 'en' ? 'pt-BR' : 'en') || (a.hreflang && a.hreflang !== p.lang)).length >= 2);
  ok(`${tag} texto com pelo menos ${p.path === '/' || p.path === '/en/' ? 450 : 330} palavras`, p.text.split(' ').length >= (p.path === '/' || p.path === '/en/' ? 450 : 330), `${p.text.split(' ').length} palavras`);
  ok(`${tag} sem marcador esquecido (undefined, [object, NaN, __X__, {{)`, !/undefined|\[object|NaN|\b__[A-Z_]+__\b|\{\{/.test(p.text + p.head));
  // segurança e peso
  const sheet = (/<style>([\s\S]*?)<\/style>/.exec(p.head) || [])[1] || '', cspm = p.m('Content-Security-Policy', 'http-equiv') || '', hash = (/'sha256-([^']+)'/.exec(cspm) || [])[1];
  ok(`${tag} CSP na meta: sem scripts, o style-src libera só o hash do CSS desta página, sem unsafe-inline`, /default-src 'none'/.test(cspm) && hash === crypto.createHash('sha256').update(sheet).digest('base64') && !/unsafe-inline|script-src/.test(cspm) && /font-src 'self'/.test(cspm));
  ok(`${tag} nenhum <script> executável, nenhum style="" e nenhum recurso de terceiros`, !/<script(?![^>]*application\/ld\+json)/.test(p.html) && !/\sstyle="/.test(p.body) && !/(src|href)="https?:\/\/(?!github\.com\/caiospot)/.test(p.body.replace(/<a\s[^>]*>/g, m => m.includes('github.com/caiospot') ? '' : m.replace(/href="https?:\/\//, 'xhref="'))) && !/@import|url\(https?:/.test(sheet));
  ok(`${tag} HTML de até 100 KB (o Googlebot lê os primeiros 2 MB)`, p.bytes <= 100 * 1024, `${(p.bytes / 1024).toFixed(1)} KB`);
  ok(`${tag} fontes pré-carregadas existem`, p.links.filter(l => l.rel === 'preload').length >= 1 && p.links.filter(l => l.rel === 'preload').every(l => exists(l.href.replace(/^\//, ''))));
  ok(`${tag} lastmod do sitemap = data de atualização mostrada na página (quando há)`, !/<time datetime="/.test(p.body) || (/<time datetime="([^"]+)"/.exec(p.body) || [])[1] === p.lastmod);
}
ok('o CSS é o mesmo em todas as páginas (um hash de CSP vale para o site inteiro)', pages.every(p => (/<style>([\s\S]*?)<\/style>/.exec(p.head) || [])[1] === css) && css.length > 4000 && css.length < 16000, `${(css.length / 1024).toFixed(1)} KB`);


// ------------------------------------------------------------ contraste das cores do CSS (WCAG AA: 4,5:1 para texto), no tema escuro e no claro
{ const tok = block => Object.fromEntries([...block.matchAll(/--([a-z0-9-]+):#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/g)].map(m => [m[1], '#' + (m[2].length === 3 ? m[2].split('').map(c => c + c).join('') : m[2])]));
  const dark = tok((/:root\{([^}]*)\}/.exec(css) || [])[1] || ''), light = { ...dark, ...tok((/prefers-color-scheme:light\)\{:root\{([^}]*)\}/.exec(css) || [])[1] || '') };
  const lum = h => { const [r, g, b] = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255).map(v => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
  for (const [name, t] of [['escuro', dark], ['claro', light]]) { const pairs = [['fg', 'bg'], ['fg', 'card'], ['muted', 'bg'], ['muted', 'card'], ['muted', 'bg2'], ['lime-t', 'bg'], ['lime-t', 'card'], ['ink', 'lime']]; const low = pairs.filter(([a, b]) => !t[a] || !t[b] || ratio(t[a], t[b]) < 4.5).map(([a, b]) => `${a}/${b}=${t[a] && t[b] ? ratio(t[a], t[b]).toFixed(1) : '?'}`);
    ok(`contraste AA (4,5:1) no tema ${name}: texto, texto secundário, destaque lime e botão`, low.length === 0, low.join(' ') || pairs.map(([a, b]) => ratio(t[a], t[b]).toFixed(1)).join(' ')); } }

// ------------------------------------------------------------ robots.txt, llms.txt, 404, app e arquivos do site
const robots = exists('robots.txt') ? read('robots.txt').toString('utf8') : '';
ok('robots.txt: libera tudo, aponta o sitemap absoluto e não bloqueia nada', /User-agent: \*\nAllow: \//.test(robots) && new RegExp(`Sitemap: ${ORIGIN.replace(/\./g, '\\.')}/sitemap\\.xml`).test(robots) && !/^\s*Disallow:\s*\S/m.test(robots));
ok('robots.txt: nomeia os buscadores, os robôs de IA e as prévias de redes sociais', ['Googlebot', 'Bingbot', 'GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-SearchBot', 'PerplexityBot', 'Google-Extended', 'Applebot', 'CCBot', 'LinkedInBot', 'Twitterbot', 'facebookexternalhit', 'WhatsApp'].every(b => robots.includes(`User-agent: ${b}\n`)));
const llms = exists('llms.txt') ? read('llms.txt').toString('utf8') : '';
ok('llms.txt: título, resumo em citação e links que existem no site', /^# Datavix\n\n> /.test(llms) && [...llms.matchAll(/\]\((https:\/\/[^)]+)\)/g)].map(m => m[1]).filter(u => u.startsWith(ORIGIN)).every(u => u.endsWith('.txt') ? exists(u.replace(ORIGIN + '/', '')) : !!byLoc[u]) && (llms.match(new RegExp(ORIGIN.replace(/\./g, '\\.') + '/', 'g')) || []).length >= 20);
ok('llms-full.txt: tem o texto de todas as páginas, nos dois idiomas', exists('llms-full.txt') && pages.every(p => read('llms-full.txt').toString('utf8').includes('URL: ' + p.loc)));
const nf = exists('404.html') ? read('404.html').toString('utf8') : ''; ok('404.html: noindex, links para o início em PT e EN', /noindex/.test(nf) && nf.includes('href="/"') && nf.includes('href="/en/"'));
const app = exists('app/index.html') ? fs.readFileSync(path.join(DIST, 'app/index.html')).subarray(0, 6000).toString('utf8') : '';
ok('o app (/app/) tem noindex na meta e no cabeçalho (.htaccess e _headers)', /<meta name="robots" content="noindex">/.test(app) && /X-Robots-Tag "noindex"/.test(exists('app/.htaccess') ? read('app/.htaccess').toString() : '') && /X-Robots-Tag: noindex/.test(exists('_headers') ? read('_headers').toString() : ''));
ok('o app não está no sitemap e nenhuma página do site tem noindex', !urls.some(u => u.loc.includes('/app/')) && pages.every(p => !/noindex/.test(p.m('robots') || '')));
ok('o app é independente: service worker, manifesto e ícones dentro de /app/', ['app/sw.js', 'app/manifest.webmanifest', 'app/icons/icon-192.png', 'app/icons/icon-512.png', 'app/icons/apple-touch-icon.png', 'app/icons/maskable-512.png'].every(exists) && /const BUILD = '[0-9a-f]{10}'/.test(exists('app/sw.js') ? read('app/sw.js').toString() : ''));
{ let m = null; try { m = JSON.parse(read('app/manifest.webmanifest').toString()); } catch (e) { /* segue */ } ok('manifesto do app: start_url e scope relativos (valem em /app/)', !!m && m.start_url === './?source=pwa' && m.scope === './' && m.id === './'); }
{ let m = null; try { m = JSON.parse(read('manifest.webmanifest').toString()); } catch (e) { /* segue */ } ok('manifesto antigo da raiz leva quem instalou o app para /app/', !!m && m.start_url === '/app/?source=pwa' && m.scope === '/' && m.id === './'); }
ok('sw.js da raiz é o de limpeza (só apaga o cache antigo e se desliga, sem fetch)', exists('sw.js') && /unregister\(\)/.test(read('sw.js').toString()) && !/addEventListener\('fetch'/.test(read('sw.js').toString()) && /datavix-/.test(read('sw.js').toString()));
ok('favicon.ico (16, 32 e 48 px) e favicon.svg existem', exists('favicon.ico') && read('favicon.ico').readUInt16LE(4) === 3 && exists('favicon.svg') && /<svg/.test(read('favicon.svg').toString()));
ok('arquivos de cache longo (assets e ícones) têm .htaccess com immutable; og com 1 dia', ['assets/.htaccess', 'icons/.htaccess', 'app/icons/.htaccess'].every(f => exists(f) && /max-age=31536000, immutable/.test(read(f).toString())) && /max-age=86400/.test(exists('og/.htaccess') ? read('og/.htaccess').toString() : ''));
ok('nada de sobra no site (.DS_Store, .tmp, mapas, README, fontes do repositório)', (() => { const all = []; (function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) e.isDirectory() ? walk(path.join(d, e.name)) : all.push(path.relative(DIST, path.join(d, e.name))); })(DIST); const stray = all.filter(f => /(^|\/)(\.DS_Store|README|build\.mjs|package\.json)|\.(tmp|map|md|mjs)$/.test(f)); stray.length && note('arquivos estranhos', stray.join(' ')); return stray.length === 0; })());
ok('arquivos com hash no nome (assets) são todos usados por alguma página', (() => { const used = new Set(); for (const p of pages) for (const m of p.html.matchAll(/\/assets\/[^"' ,)]+/g)) used.add(m[0].replace(/^\//, '')); const files = []; (function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) e.isDirectory() ? walk(path.join(d, e.name)) : files.push(path.relative(DIST, path.join(d, e.name))); })(path.join(DIST, 'assets')); const un = files.filter(f => !f.endsWith('.htaccess') && !used.has(f)); un.length && note('assets sem uso', un.join(' ')); return un.length === 0; })());

console.log(out.join('\n')); if (warn.length) console.log('\n' + warn.join('\n'));
const total = out.length; console.log(bad.length ? `\nFALHOU: ${bad.length} de ${total} verificações` : `\ntudo certo (${total} verificações, ${pages.length} páginas)`);
process.exitCode = bad.length ? 1 : 0;
