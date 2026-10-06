/* Datavix: projetos recentes (IndexedDB). Só dados agregados da peça, nunca a planilha. Tudo fica neste navegador. */

const STORE = { db: null, ok: true, max: 20 };
function idb() {
  if (STORE.db) return Promise.resolve(STORE.db);
  return new Promise((res, rej) => {
    let req;
    try { req = indexedDB.open('datavix', 1); } catch (e) { STORE.ok = false; return rej(e); }
    req.onupgradeneeded = () => { req.result.createObjectStore('projects', { keyPath: 'id' }); };
    req.onsuccess = () => { STORE.db = req.result; res(STORE.db); };
    req.onerror = () => { STORE.ok = false; rej(req.error); };
  });
}
const tx = (mode, fn) => idb().then(db => new Promise((res, rej) => {
  const t = db.transaction('projects', mode), st = t.objectStore('projects'), r = fn(st);
  t.oncomplete = () => res(r && r.result); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error);
})).catch(() => null);

const newId = () => (crypto.randomUUID ? crypto.randomUUID() : 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8));
async function saveProject(P) {
  const rec = { id: P.id, updated: Date.now(), name: P.saveName || P.title, title: P.title, type: P.type, fileName: P.fileName, rows: P.built.stats.rowsTotal, data: pieceData(P) };
  await tx('readwrite', st => st.put(rec));
  const all = await listProjects();
  if (all && all.length > STORE.max) for (const old of all.slice(STORE.max)) await tx('readwrite', st => st.delete(old.id));
}
async function listProjects() {
  const all = await tx('readonly', st => st.getAll());
  return (all || []).sort((a, b) => b.updated - a.updated);
}
const getProject = id => tx('readonly', st => st.get(id));
const deleteProject = id => tx('readwrite', st => st.delete(id));
const clearProjects = () => tx('readwrite', st => st.clear());
