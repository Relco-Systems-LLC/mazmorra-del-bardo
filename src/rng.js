// PRNG seedeado (mulberry32): niveles infinitos pero reproducibles por seed.
window.MZ = window.MZ || {};
(() => {
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  MZ.makeRng = function (seed) {
    const f = mulberry32(seed);
    return {
      next: f,
      int: (a, b) => a + Math.floor(f() * (b - a + 1)),
      pick: (arr) => arr[Math.floor(f() * arr.length)],
      chance: (p) => f() < p,
    };
  };

  // Combina seed del run + profundidad => seed del nivel.
  MZ.hash2 = function (a, b) {
    let h = (a ^ 0x9E3779B9) >>> 0;
    h = Math.imul(h ^ b, 0x85EBCA6B) >>> 0;
    h = (h ^ (h >>> 13)) >>> 0;
    h = Math.imul(h, 0xC2B2AE35) >>> 0;
    return (h ^ (h >>> 16)) >>> 0;
  };

  MZ.timeScale = 1;
})();
