// Gera o site estático (landing e páginas de conteúdo em PT e EN, robots.txt, sitemap.xml, llms.txt, 404) em uma pasta de saída.
// Chamado por build.mjs. Sem dependências: só Node. Nada de JavaScript nas páginas; o CSS vai inline e a CSP libera só o hash dele.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import vm from 'node:vm';
import { loadCatalog, loadLanding } from './catalog.mjs';
import { renderPage, esc, md, plain } from './layout.mjs';
import PT from './content-pt.mjs';
import EN from './content-en.mjs';

const sha = (b, n = 8) => crypto.createHash('sha1').update(b).digest('hex').slice(0, n);
const minCss = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').replace(/\s*([{};,>~])\s*/g, '$1').replace(/:\s+/g, ':').replace(/;}/g, '}').trim();
const AI_BOTS = [
  ['Googlebot', 'Googlebot-Image', 'Google-Extended', 'GoogleOther', 'Bingbot', 'Applebot', 'Applebot-Extended', 'DuckDuckBot', 'DuckAssistBot', 'YandexBot', 'Baiduspider'],
  ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-SearchBot', 'Claude-User', 'anthropic-ai', 'PerplexityBot', 'Perplexity-User', 'MistralAI-User', 'cohere-ai', 'Amazonbot', 'meta-externalagent', 'CCBot', 'Bytespider'],
  ['Twitterbot', 'LinkedInBot', 'facebookexternalhit', 'Slackbot', 'Discordbot', 'TelegramBot', 'WhatsApp', 'Pinterestbot'],
];

export function buildSite({ root, out, origin, host, contactEmail = '', gsc = '', bing = '', sameAs = [] }) {
  const R = f => new URL(f, root), rd = f => fs.readFileSync(R(f), 'utf8');
  const catalog = loadCatalog(root), landing = loadLanding(root), langs = [PT, EN];
  const put = (rel, data) => { const f = path.join(out, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, data); };
  const assetMap = {};
  const addAsset = (src, rel) => { const buf = fs.readFileSync(R(src)), ext = path.extname(rel), base = rel.slice(0, -ext.length), name = `assets/${base}.${sha(buf)}${ext}`; put(name, buf); assetMap[rel] = '/' + name; return '/' + name; };

  // fontes e CSS (com hash no nome: cache de 1 ano) e a CSP, que libera só o hash do CSS
  const fontUrl = { geist: addAsset('site/assets/fonts/geist.woff2', 'geist.woff2'), mono: addAsset('site/assets/fonts/geist-mono.woff2', 'geist-mono.woff2'), doto: addAsset('site/assets/fonts/doto.woff2', 'doto.woff2') };
  const css = minCss(rd('site/site.css').replace('__FONT_GEIST__', fontUrl.geist).replace('__FONT_MONO__', fontUrl.mono).replace('__FONT_DOTO__', fontUrl.doto));
  const cssHash = crypto.createHash('sha256').update(css).digest('base64');
  const csp = `default-src 'none'; style-src 'sha256-${cssHash}'; font-src 'self'; img-src 'self' data:; base-uri 'none'; form-action 'none'`;

  // imagens (WebP) com variantes por largura, e as imagens de compartilhamento (PNG 1200×630, nome estável)
  const imgManifest = JSON.parse(rd('site/assets/img/manifest.json')), images = {};
  // só entram no site as imagens que alguma página usa (as demais capturas só servem de base para os cartões de compartilhamento)
  const usedImg = new Set(); const scan = bs => (bs || []).forEach(b => { if (b && (b.t === 'fig' || b.t === 'howcards') && b.img) usedImg.add(b.img); });
  for (const c of langs) for (const p of c.pages) { scan(p.blocks); if (p.hero) scan([p.hero]); (p.sections || []).forEach(sec => scan(sec.body)); }
  for (const name of usedImg) if (!imgManifest[name]) throw new Error(`imagem "${name}" não existe em site/assets/img/manifest.json (rode scripts/make-shots.mjs)`);
  for (const [name, m] of Object.entries(imgManifest)) { if (!usedImg.has(name)) continue; for (const v of m.variants) addAsset('site/assets/img/' + v.file, 'img/' + v.file); images[name] = m; }
  const ogDir = R('site/assets/og/'); if (fs.existsSync(ogDir)) for (const f of fs.readdirSync(ogDir)) if (f.endsWith('.png')) put('og/' + f, fs.readFileSync(new URL(f, ogDir)));
  for (const f of ['favicon.ico', 'favicon.svg']) put(f, fs.readFileSync(R('site/assets/' + f)));

  // política de privacidade: o mesmo texto do app (src/privacy.js), em HTML
  const pv = vm.createContext({}); const psrc = rd('src/privacy.js'); vm.runInContext(psrc.slice(0, psrc.indexOf('const privT')).replace(/^const /gm, 'var ') + '\nthis.PRIV = PRIV; this.PRIV_ISSUES = PRIV_ISSUES;', pv);
  const privacyHtml = c => {
    const p = pv.PRIV[c.L], hk = host === 'hostinger' ? 'hostinger' : 'github', fill = t => t.replace('{hosting}', p.hosts[hk]), m = x => esc(x);
    const body = p.sec.map(([h, items]) => `<h2>${m(h)}</h2>` + items.map(([k, v]) => k === 'ul' ? `<ul>${v.map(x => `<li>${m(x)}</li>`).join('')}</ul>` : k === 'h' ? `<h3>${m(v)}</h3>` : `<p>${m(fill(v))}</p>`).join('')).join('');
    const contact = contactEmail ? `<p>${m(p.ct_mail[0])}<a href="mailto:${esc(contactEmail)}">${esc(contactEmail)}</a>${m(p.ct_mail[1])}</p>` : `<p>${m(p.ct_gh)} <a href="${pv.PRIV_ISSUES}" rel="noopener" target="_blank">${pv.PRIV_ISSUES.replace('https://', '')}</a> ${m(p.ct_gh2)}</p>`;
    return `<p class="upd">${m(p.upd)}</p>${body}<h2>${m(p.ct_h)}</h2>${contact}`;
  };

  const urlOf = (c, id) => { const p = c.pages.find(x => x.id === id); if (!p) throw new Error(`página "${id}" não existe em ${c.lang}`); return `${c.root}/${p.slug ? p.slug + '/' : ''}`; };
  for (const c of langs) for (const p of c.pages) if (!langs.every(o => o.pages.some(x => x.id === p.id))) throw new Error(`página "${p.id}" só existe em ${c.lang}: PT e EN precisam ter as mesmas páginas`);
  const hreflangs = id => [...langs.map(c => ({ hreflang: c.lang, path: urlOf(c, id), ogLocale: c.ui.ogLocale })), { hreflang: 'x-default', path: urlOf(EN, id), ogLocale: EN.ui.ogLocale }];
  const dateFmt = { 'pt-BR': new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeZone: 'UTC' }), en: new Intl.DateTimeFormat('en-US', { dateStyle: 'long', timeZone: 'UTC' }) };

  const pages = [];
  for (const c of langs) {
    const other = langs.find(o => o !== c);
    for (const page of c.pages) {
      const faqItems = pg => pg.id === 'home' ? pg.sections.flatMap(s => (s.body || []).filter(b => b.t === 'faq' && b.home).flatMap(b => b.items)) : (pg.blocks || []).filter(b => b.t === 'faq').flatMap(b => b.items);
      const ctx = {
        page, lang: c.lang, L: c.L, ui: c.ui, origin, csp, css, fontUrl, images, catalog, landing, gsc, bing, sameAs, contactEmail, appDesc: c.appDesc, featureList: c.featureList, chartText: c.chartText, storyText: c.storyText, faqItems,
        appUrl: c.L === 'en' ? '/app/?lang=en' : '/app/', url: id => urlOf(c, id), asset: rel => { const a = assetMap[rel]; if (!a) throw new Error('asset desconhecido: ' + rel); return a; },
        alt: id => ({ path: urlOf(other, id), hreflang: other.lang, ogLocale: other.ui.ogLocale }), hreflangs,
        pageLabel: id => c.pages.find(x => x.id === id).label, pageSummary: id => c.pages.find(x => x.id === id).summary, dateText: iso => dateFmt[c.lang].format(new Date(iso + 'T00:00:00Z')),
        privacyHtml: privacyHtml(c),
      };
      const html = renderPage(ctx);
      const rel = urlOf(c, page.id).replace(/^\//, '') + 'index.html';
      put(rel, html); pages.push({ id: page.id, lang: c.lang, path: urlOf(c, page.id), file: rel, bytes: Buffer.byteLength(html), updated: page.updated, title: page.title });
    }
  }

  // sitemap.xml: todas as páginas indexáveis, com as versões de idioma de cada uma e a data da última mudança de conteúdo
  const sm = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">'];
  for (const pg of pages) sm.push(`<url><loc>${origin}${pg.path}</loc><lastmod>${pg.updated}</lastmod>${hreflangs(pg.id).map(a => `<xhtml:link rel="alternate" hreflang="${a.hreflang}" href="${origin}${a.path}"/>`).join('')}</url>`);
  sm.push('</urlset>'); put('sitemap.xml', sm.join('\n') + '\n');

  // robots.txt: tudo liberado (buscadores, assistentes de IA e prévias de redes sociais); o app (/app/) leva noindex no próprio HTML
  const rb = ['# Datavix: o site é público e feito para ser lido por pessoas, buscadores e assistentes de IA.', '# O app (/app/) não é conteúdo: leva noindex no HTML e no cabeçalho (por isso não é bloqueado aqui: o bloqueio impediria o buscador de ver o noindex).', '', 'User-agent: *', 'Allow: /', ''];
  for (const g of AI_BOTS) rb.push(...g.map(b => `User-agent: ${b}`), 'Allow: /', '');
  rb.push(`Sitemap: ${origin}/sitemap.xml`); put('robots.txt', rb.join('\n') + '\n');

  // llms.txt (índice) e llms-full.txt (texto completo): arquivos em Markdown para assistentes de IA
  const toMd = (blocks, c) => blocks.map(b => {
    const t = s => plain(s);
    switch (b.t) {
      case 'h2': return `## ${t(b.x)}`; case 'h3': return `### ${t(b.x)}`; case 'p': return t(b.x); case 'note': return `> ${t(b.x)}`;
      case 'ul': return b.items.map(i => `- ${t(i)}`).join('\n'); case 'ol': return b.items.map((i, k) => `${k + 1}. ${t(i)}`).join('\n');
      case 'steps': return b.items.map((i, k) => `${k + 1}. **${i.h}**: ${t(i.x)}`).join('\n'); case 'cards': return b.items.map(i => `- **${i.h}**: ${t(i.x)}`).join('\n');
      case 'dl': return b.items.map(i => `- **${t(i.t)}**: ${t(i.x)}`).join('\n');
      case 'table': return `| ${b.head.join(' | ')} |\n| ${b.head.map(() => '---').join(' | ')} |\n${b.rows.map(r => `| ${r.map(t).join(' | ')} |`).join('\n')}`;
      case 'faq': return b.items.map(q => `### ${q.q}\n\n${(Array.isArray(q.a) ? q.a : [q.a]).map(t).join('\n\n')}`).join('\n\n');
      case 'charts': return catalog.charts.map(ch => `- **${ch.name[c.L]}**: ${c.chartText[ch.id]} (${ch.needs[c.L]})`).join('\n');
      case 'stories': return catalog.stories.map(s => `- **${s.name[c.L]}** — ${s.ask[c.L]} ${c.storyText[s.id]}`).join('\n');
      case 'raw': return ''; default: return '';
    }
  }).filter(Boolean).join('\n\n');
  const full = [];
  for (const c of langs) for (const p of c.pages) {
    if (p.id === 'privacy') { full.push(`# ${p.h1}\n\nURL: ${origin}${urlOf(c, p.id)}\n\n${plain(p.lead)}\n\nSee the page for the full policy text.`); continue; }
    const body = p.id === 'home' ? p.sections.map(s => `## ${s.h2.replace(/\*\*/g, '')}\n\n${s.intro ? plain(s.intro) + '\n\n' : ''}${toMd(s.body || [], c)}`).join('\n\n') : toMd(p.blocks, c);
    full.push(`# ${p.id === 'home' ? p.title : p.h1}\n\nURL: ${origin}${urlOf(c, p.id)}\nLanguage: ${c.lang}\n\n${plain(p.lead)}\n\n${body}`);
  }
  put('llms-full.txt', `# Datavix: full text\n\n> Complete text of the Datavix website (Portuguese and English), for language models and agents.\n\n${full.join('\n\n---\n\n')}\n`);
  const idx = c => c.pages.map(p => `- [${p.id === 'home' ? p.title : p.label}](${origin}${urlOf(c, p.id)}): ${plain(p.summary)}`).join('\n');
  put('llms.txt', `# Datavix

> Datavix turns spreadsheets (XLSX, XLS, CSV) into animated, interactive charts, presentations and videos, entirely in the browser: the spreadsheet is never uploaded to a server. Interface in Portuguese and English. You can start for free.

Key facts, as of the last update of this file:
- Input: .xlsx, .xls, .csv and .tsv files, processed locally in the browser.
- 30 chart types, suggested from the shape of the data, and 13 story templates with scripts of 2, 5 or 10 slides.
- Every insight comes with its calculation ("see calculation"); the numbers come only from the spreadsheet.
- Exports: interactive HTML that opens offline, PNG (1920×1080 and 3840×2160), a ZIP with one PNG per step, PowerPoint (.pptx) with native editable charts, and MP4 video (about 20 seconds, vertical 9:16 or square 1:1, no audio).
- What leaves the browser: the signup email, the optional satisfaction survey and, only if the user accepts, anonymous usage analytics. Never the spreadsheet.
- The app lives at ${origin}/app/ (not indexed). The pages below are the public content.

## English

${idx(EN)}

## Português (pt-BR)

${idx(PT)}

## Optional

- [Full text of this site](${origin}/llms-full.txt): all pages in one Markdown file
- [Source code on GitHub](https://github.com/caiospot/Datavix)
`);

  // 404 (sem índice) e a página de aviso do endereço antigo ficam em notice()
  const notFound = `<!doctype html>\n<html lang="pt-BR">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1">\n<title>404 · Datavix</title>\n<meta name="robots" content="noindex,follow">\n<meta http-equiv="Content-Security-Policy" content="${esc(csp)}">\n<link rel="icon" href="/favicon.svg" type="image/svg+xml">\n<style>${css}</style>\n</head>\n<body>\n<main class="notice"><div class="box"><a class="brand" href="/"><i></i>DATAVIX</a><h1>Página não encontrada · Page not found</h1><p>O endereço não existe ou mudou. / This address does not exist or has moved.</p><div class="cta"><a class="btn" href="/">Início</a><a class="btn ghost" href="/en/">Home (English)</a></div></div></main>\n</body>\n</html>\n`;
  put('404.html', notFound);

  return { pages, csp, cssBytes: css.length, assetMap };
}
