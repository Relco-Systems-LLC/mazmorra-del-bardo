// Persistencia: IndexedDB como principal con localStorage de fallback (y espejo).
// Como PWA (https) IndexedDB anda perfecto; en file:// o navegadores raros queda localStorage.
window.MZ = window.MZ || {};
(() => {
  const KEY = 'mazmorra_bardo_v1';
  const DB = 'mazmorra_bardo';
  const STORE = 'kv';
  const defaults = { bestDepth: 0, totalKills: 0, totalGold: 0, deaths: 0, runs: 0, morena: 0, loreCap: 0, totalSteps: 0, run: null };
  let data = { ...defaults };
  let db = null;

  function openIdb() {
    return new Promise(res => {
      // si IDB se cuelga (navegadores raros, modo privado), no frenamos el boot
      const guard = setTimeout(() => res(null), 1500);
      try {
        const req = indexedDB.open(DB, 1);
        req.onupgradeneeded = () => req.result.createObjectStore(STORE);
        req.onsuccess = () => { clearTimeout(guard); res(req.result); };
        req.onerror = () => { clearTimeout(guard); res(null); };
      } catch (e) { clearTimeout(guard); res(null); }
    });
  }

  function idbGet() {
    return new Promise(res => {
      const guard = setTimeout(() => res(null), 1500);
      try {
        const rq = db.transaction(STORE).objectStore(STORE).get(KEY);
        rq.onsuccess = () => { clearTimeout(guard); res(rq.result || null); };
        rq.onerror = () => { clearTimeout(guard); res(null); };
      } catch (e) { clearTimeout(guard); res(null); }
    });
  }

  function lsGet() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }

  function parse(raw) {
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (e) { return null; }
  }

  MZ.save = {
    get data() { return data; },
    ok: false, // true si al menos un storage anda

    async load() {
      db = await openIdb();
      // El más completo gana: IDB primero, localStorage como fallback/migración.
      const fromIdb = parse(db ? await idbGet() : null);
      const fromLs = parse(lsGet());
      const best = fromIdb || fromLs;
      if (best) data = { ...defaults, ...best };
      this.ok = !!db || lsGet() !== null || this.canLs();
      // migrar al IDB lo que estaba solo en localStorage
      if (!fromIdb && fromLs) this.store();
      return data;
    },

    canLs() {
      try {
        localStorage.setItem(KEY + '_t', '1');
        localStorage.removeItem(KEY + '_t');
        return true;
      } catch (e) { return false; }
    },

    store() {
      const raw = JSON.stringify(data);
      if (db) {
        try { db.transaction(STORE, 'readwrite').objectStore(STORE).put(raw, KEY); } catch (e) { }
      }
      try { localStorage.setItem(KEY, raw); } catch (e) { }
    },
  };
})();
