// Persistencia: localStorage (única DB — IndexedDB no anda en file:// en Chrome)
// + export/import a archivo como backup y para pasar la partida entre dispositivos.
window.MZ = window.MZ || {};
(() => {
  const KEY = 'mazmorra_bardo_v1';
  const defaults = { bestDepth: 0, totalKills: 0, totalGold: 0, deaths: 0, runs: 0, morena: 0, loreCap: 0, totalSteps: 0, run: null };
  let data = { ...defaults };

  MZ.save = {
    get data() { return data; },
    ok: false, // true si la DB anda (si no: solo memoria, exportá a archivo)

    load() {
      try {
        localStorage.setItem(KEY + '_t', '1');
        this.ok = localStorage.getItem(KEY + '_t') === '1';
        localStorage.removeItem(KEY + '_t');
        const raw = localStorage.getItem(KEY);
        if (raw) data = { ...defaults, ...JSON.parse(raw) };
      } catch (e) { this.ok = false; }
      return data;
    },

    store() {
      try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { }
    },

    exportData() {
      return JSON.stringify(data, null, 1);
    },

    importData(text) {
      try {
        const obj = JSON.parse(text);
        if (!obj || typeof obj !== 'object') return false;
        data = { ...defaults, ...obj };
        this.store();
        return true;
      } catch (e) { return false; }
    },
  };
})();
