/* Datavix: biblioteca de fontes do editor. Os dados (FONT_LIB) são gerados no build a partir de vendor/fonts/lib.
 * As fontes só são decodificadas quando alguém as usa; o HTML exportado leva apenas as famílias da peça. */
const FONT_DONE = new Map();
function fontEnsure(fams) {
  return Promise.all([...new Set(fams || [])].map(f => {
    const faces = FONT_LIB[f]; if (!faces) return Promise.resolve(); // Geist, Lora, Doto etc. já vêm no CSS do app
    if (!FONT_DONE.has(f)) FONT_DONE.set(f, Promise.all(faces.map(x => {
      try { const ff = new FontFace(f, b64bytes(x.b).buffer, { weight: x.w, style: 'normal', display: 'swap' }); document.fonts.add(ff); return ff.load().catch(() => 0); } catch (e) { return Promise.resolve(); }
    })));
    return FONT_DONE.get(f);
  }));
}
// @font-face (dados embutidos) das famílias pedidas, para o HTML exportado
function fontFaceCss(fams) {
  return [...new Set(fams || [])].flatMap(f => (FONT_LIB[f] || []).map(x => `@font-face{font-family:'${f}';font-style:normal;font-weight:${x.w};font-display:swap;src:url(data:font/woff2;base64,${x.b}) format('woff2')}`)).join('');
}
