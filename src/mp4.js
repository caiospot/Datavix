/* Datavix: converte o MP4 fragmentado que o MediaRecorder grava (moov + moof/mdat) em um MP4 comum com o índice no início (faststart),
 * sem recodificar. Redes e players aceitam melhor esse formato e a duração sai certa. Uma faixa de vídeo (sem áudio). */
const MP4_CONT = new Set(['moov', 'trak', 'mdia', 'minf', 'stbl']);
function mp4Parse(b, off, end) {
  const out = [], dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
  while (off + 8 <= end) {
    let size = dv.getUint32(off), hdr = 8; const type = String.fromCharCode(b[off + 4], b[off + 5], b[off + 6], b[off + 7]);
    if (size === 1) { size = Number(dv.getBigUint64(off + 8)); hdr = 16; } else if (size === 0) size = end - off;
    if (size < hdr || off + size > end) throw new Error('mp4: caixa inválida');
    const n = { type, start: off, size, hdr, data: b.subarray(off + hdr, off + size) };
    if (MP4_CONT.has(type)) n.kids = mp4Parse(b, off + hdr, off + size);
    out.push(n); off += size;
  }
  return out;
}
const mp4Find = (kids, t) => (kids || []).find(k => k.type === t);
function mp4Box(type, ...parts) {
  const len = parts.reduce((a, p) => a + p.length, 0), out = new Uint8Array(8 + len), dv = new DataView(out.buffer);
  dv.setUint32(0, 8 + len); for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i);
  let o = 8; for (const p of parts) { out.set(p, o); o += p.length; } return out;
}
const mp4U32 = a => { const o = new Uint8Array(a.length * 4), dv = new DataView(o.buffer); a.forEach((v, i) => dv.setUint32(i * 4, v >>> 0)); return o; };
function mp4Ser(n) { return n.kids ? mp4Box(n.type, ...n.kids.map(mp4Ser)) : mp4Box(n.type, n.data); }

function mp4Remux(buf) {
  const b = new Uint8Array(buf), top = mp4Parse(b, 0, b.length), ftyp = mp4Find(top, 'ftyp'), moov = mp4Find(top, 'moov');
  if (!ftyp || !moov || !top.some(x => x.type === 'moof')) return null; // já é um MP4 comum (ou não é MP4)
  const trak = mp4Find(moov.kids, 'trak'), mdia = mp4Find(trak.kids, 'mdia'), minf = mp4Find(mdia.kids, 'minf'), stbl = mp4Find(minf.kids, 'stbl');
  // amostras de todos os fragmentos
  const samples = [];
  for (const mf of top.filter(x => x.type === 'moof')) {
    const kids = mp4Parse(b, mf.start + mf.hdr, mf.start + mf.size), traf = mp4Find(kids.map(k => (k.type === 'traf' ? { ...k, kids: mp4Parse(b, k.start + k.hdr, k.start + k.size) } : k)), 'traf');
    if (!traf) continue;
    const tfhd = mp4Find(traf.kids, 'tfhd'), dvT = new DataView(tfhd.data.buffer, tfhd.data.byteOffset, tfhd.data.byteLength), fl = dvT.getUint32(0) & 0xffffff; let p = 8, baseOff = mf.start, dDur = 0, dSize = 0, dFlags = 0;
    if (fl & 1) { baseOff = Number(dvT.getBigUint64(p)); p += 8; } if (fl & 2) p += 4; if (fl & 8) { dDur = dvT.getUint32(p); p += 4; } if (fl & 0x10) { dSize = dvT.getUint32(p); p += 4; } if (fl & 0x20) { dFlags = dvT.getUint32(p); p += 4; }
    for (const tr of traf.kids.filter(k => k.type === 'trun')) {
      const dv = new DataView(tr.data.buffer, tr.data.byteOffset, tr.data.byteLength), ver = dv.getUint8(0), f = dv.getUint32(0) & 0xffffff, n = dv.getUint32(4); let q = 8, dataOff = 0, firstFlags = null;
      if (f & 1) { dataOff = dv.getInt32(q); q += 4; } if (f & 4) { firstFlags = dv.getUint32(q); q += 4; }
      let pos = baseOff + dataOff;
      for (let i = 0; i < n; i++) {
        let dur = dDur, size = dSize, flags = dFlags, cto = 0;
        if (f & 0x100) { dur = dv.getUint32(q); q += 4; } if (f & 0x200) { size = dv.getUint32(q); q += 4; } if (f & 0x400) { flags = dv.getUint32(q); q += 4; } else if (i === 0 && firstFlags !== null) flags = firstFlags;
        if (f & 0x800) { cto = ver === 0 ? dv.getUint32(q) : dv.getInt32(q); q += 4; }
        samples.push({ dur, size, sync: !(flags & 0x10000), cto, pos }); pos += size;
      }
    }
  }
  if (!samples.length) return null;
  // tabelas de amostras
  const stts = [], ctts = []; let hasCto = false;
  samples.forEach(s => { const l = stts[stts.length - 1]; if (l && l[1] === s.dur) l[0]++; else stts.push([1, s.dur]); const c = ctts[ctts.length - 1]; if (c && c[1] === s.cto) c[0]++; else ctts.push([1, s.cto]); if (s.cto) hasCto = true; });
  const sync = []; samples.forEach((s, i) => { if (s.sync) sync.push(i + 1); });
  const full = (type, ver, ...parts) => mp4Box(type, new Uint8Array([ver, 0, 0, 0]), ...parts);
  const tables = [
    mp4Find(stbl.kids, 'stsd'),
    { type: 'stts', data: full('stts', 0, mp4U32([stts.length, ...stts.flat()])).subarray(8) },
    ...(hasCto ? [{ type: 'ctts', data: full('ctts', 1, mp4U32([ctts.length, ...ctts.flat()])).subarray(8) }] : []),
    ...(sync.length && sync.length < samples.length ? [{ type: 'stss', data: full('stss', 0, mp4U32([sync.length, ...sync])).subarray(8) }] : []),
    { type: 'stsc', data: full('stsc', 0, mp4U32([1, 1, samples.length, 1])).subarray(8) },
    { type: 'stsz', data: full('stsz', 0, mp4U32([0, samples.length, ...samples.map(s => s.size)])).subarray(8) },
    { type: 'stco', data: full('stco', 0, mp4U32([1, 0])).subarray(8) }, // deslocamento corrigido abaixo
  ];
  const total = samples.reduce((a, s) => a + s.dur, 0);
  // durações: mdhd (escala da mídia), tkhd e mvhd (escala do filme)
  const setDur = (node, offV0, offV1, value) => { const d = new Uint8Array(node.data), dv = new DataView(d.buffer), v = d[0]; if (v === 1) dv.setBigUint64(offV1, BigInt(Math.round(value))); else dv.setUint32(offV0, Math.round(value)); node.data = d; };
  const mdhd = mp4Find(mdia.kids, 'mdhd'), mvhd = mp4Find(moov.kids, 'mvhd'), tkhd = mp4Find(trak.kids, 'tkhd');
  const rd = (n, o0, o1) => { const dv = new DataView(n.data.buffer, n.data.byteOffset, n.data.byteLength); return n.data[0] === 1 ? dv.getUint32(o1) : dv.getUint32(o0); };
  const mediaTs = rd(mdhd, 12, 20), movieTs = rd(mvhd, 12, 20), movDur = total * movieTs / mediaTs;
  setDur(mdhd, 16, 24, total); setDur(mvhd, 16, 24, movDur); setDur(tkhd, 20, 28, movDur);
  const nStbl = { type: 'stbl', kids: tables }, nMinf = { ...minf, kids: minf.kids.map(k => (k.type === 'stbl' ? nStbl : k)) }, nMdia = { ...mdia, kids: mdia.kids.map(k => (k.type === 'minf' ? nMinf : k)) };
  const nTrak = { ...trak, kids: trak.kids.map(k => (k.type === 'mdia' ? nMdia : k)) };
  const nMoov = { type: 'moov', kids: moov.kids.filter(k => k.type !== 'mvex').map(k => (k.type === 'trak' ? nTrak : k)) };
  // com o tamanho do moov conhecido, o mdat começa logo depois dele
  const moovLen = mp4Ser(nMoov).length, mdatPayload = ftyp.size + moovLen + 8;
  const stco = tables.find(t => t.type === 'stco'); const d = new Uint8Array(stco.data); new DataView(d.buffer).setUint32(8, mdatPayload); stco.data = d;
  const moovBytes = mp4Ser(nMoov), dataLen = samples.reduce((a, s) => a + s.size, 0), out = new Uint8Array(ftyp.size + moovBytes.length + 8 + dataLen), dv = new DataView(out.buffer);
  out.set(b.subarray(ftyp.start, ftyp.start + ftyp.size), 0); out.set(moovBytes, ftyp.size);
  const m0 = ftyp.size + moovBytes.length; dv.setUint32(m0, 8 + dataLen); out.set([0x6d, 0x64, 0x61, 0x74], m0 + 4);
  let o = m0 + 8; for (const s of samples) { out.set(b.subarray(s.pos, s.pos + s.size), o); o += s.size; }
  return out;
}
