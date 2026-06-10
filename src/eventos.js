// Eventos locos de nivel: modificadores sorpresa que duran el piso entero.
window.MZ = window.MZ || {};
(() => {
  MZ.EVENTOS = {
    apagon: { n: '🔌 APAGÓN', msg: 'Se cortó la luz: el dungeon no paga la eléctrica hace décadas. Visión mínima.', color: 0x4444ff },
    fiesta: { n: '🪩 FIESTA EN EL TIGER', msg: 'DJ Tigre puso un tema y TODOS bailan: nadie pelea y el oro vale doble. Aprovechá.', color: 0xff8800 },
    niebla: { n: '☠ NIEBLA VENENOSA', msg: 'Niebla verde del subsuelo: cada tanto te pica. No te quedes de charla.', color: 0x66ff44 },
    lluvia: { n: '💰 LLUVIA DE ORO', msg: 'Reventó una cañería de oro: monedas POR TODOS LADOS. Los bichos están más gordos.', color: 0xffd700 },
    invasion: { n: '⚔ INVASIÓN', msg: 'Nivel repleto de bichos. ¿La buena? Sueltan loot como piñata.', color: 0xff3355 },
    mercado: { n: '🏴 MERCADO NEGRO', msg: 'Don Olivera consiguió "mercadería especial": todo a mitad de precio. No preguntes.', color: 0x9d6bff },
  };

  MZ.eventos = {
    sortear(depth, isBoss) {
      if (isBoss || depth < 3 || Math.random() > 0.18) return null;
      const keys = Object.keys(MZ.EVENTOS);
      return keys[Math.floor(Math.random() * keys.length)];
    },

    anunciar(ev) {
      const def = MZ.EVENTOS[ev];
      if (!def) return;
      MZ.ui.toast(def.n + ' — ' + def.msg, 5500);
      MZ.fx.flash(0.35, def.color);
      MZ.audio.boss();
    },

    visionR() {
      return MZ.state && MZ.state.evento === 'apagon' ? 2 : 7;
    },
  };
})();
