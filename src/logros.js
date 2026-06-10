// Logros persistentes + economía de almas + tienda de mejoras permanentes.
// Esto es lo que convierte runs de 20 minutos en semanas de vicio.
window.MZ = window.MZ || {};
(() => {
  const D = () => MZ.save.data;

  // ---- Logros: id, título, condición sobre (stats persistentes, evento) ----
  const LOGROS = [
    { id: 'sangre', t: 'Primera Sangre', d: 'Matá tu primer monstruo' },
    { id: 'kills100', t: 'Centurión', d: '100 bajas históricas' },
    { id: 'kills1000', t: 'Genocida de Utilería', d: '1000 bajas históricas' },
    { id: 'nivel5', t: 'Turista', d: 'Llegá al nivel 5' },
    { id: 'nivel10', t: 'Inquilino', d: 'Llegá al nivel 10' },
    { id: 'nivel20', t: 'Residente Permanente', d: 'Llegá al nivel 20' },
    { id: 'nivel30', t: 'Leyenda del Subsuelo', d: 'Llegá al nivel 30' },
    { id: 'nivel50', t: 'La Última Función', d: 'Llegá al nivel 50' },
    { id: 'oro1000', t: 'Tesorero', d: '1000 de oro juntado histórico' },
    { id: 'oro10000', t: 'Magnate del Pozo', d: '10000 de oro histórico' },
    { id: 'muertes10', t: 'Cliente Frecuente', d: 'Morí 10 veces' },
    { id: 'muertes50', t: 'Abono Anual', d: 'Morí 50 veces' },
    { id: 'pombero', t: 'Cazafantasmas Criollo', d: 'Cazá al Pombero' },
    { id: 'rataBlanca', t: 'Mujer Amante', d: 'Encontrá a la Rata Blanca' },
    { id: 'disco', t: 'Fiebre de Sábado', d: 'Activá el modo disco' },
    { id: 'mateLeg', t: 'Cebador Sagrado', d: 'Tomá el Mate Legendario' },
    { id: 'morena', t: 'Corazón de Bruja', d: 'Enamorá a Morena' },
    { id: 'nona', t: 'Nieto Postizo', d: 'Visitá 3 veces a la Nona' },
    { id: 'nieto', t: 'Reencuentro', d: 'Encontrá al nieto de la Nona' },
    { id: 'lore', t: 'Memoria del Teatro', d: 'Escuchá toda la historia del Bardo' },
    { id: 'racha10', t: 'Intocable', d: 'Racha de 10 sin recibir daño' },
    { id: 'tequila', t: 'Spring Break', d: 'Tomate un tequila' },
    { id: 'pasos5000', t: 'Maratonista de Catacumba', d: '5000 pasos históricos' },
    { id: 'jefe5', t: 'Matajefes', d: 'Matá 5 jefes (histórico)' },
  ];

  MZ.logros = {
    defs: LOGROS,

    count() {
      const u = D().logrosU || {};
      return Object.keys(u).length;
    },

    unlock(id) {
      const d = D();
      d.logrosU = d.logrosU || {};
      if (d.logrosU[id]) return;
      d.logrosU[id] = 1;
      MZ.save.store();
      const def = LOGROS.find(l => l.id === id);
      if (def && MZ.ui) {
        MZ.ui.toast('🏆 LOGRO: ' + def.t, 3500);
        if (MZ.audio) MZ.audio.secret();
        if (MZ.fx && MZ.state && MZ.state.player) MZ.fx.flash(0.25, 0xffd700);
      }
    },

    // Llamar tras eventos clave; chequea todo lo barato de chequear.
    check(evento) {
      const d = D(), S = MZ.state;
      const kills = d.totalKills + (S && S.player ? S.player.kills : 0);
      const oro = d.totalGold + (S && S.player ? S.player.gold : 0);
      const pasos = d.totalSteps + (S && S.player ? S.player.steps : 0);
      if (kills >= 1) this.unlock('sangre');
      if (kills >= 100) this.unlock('kills100');
      if (kills >= 1000) this.unlock('kills1000');
      if (oro >= 1000) this.unlock('oro1000');
      if (oro >= 10000) this.unlock('oro10000');
      if (pasos >= 5000) this.unlock('pasos5000');
      if (d.deaths >= 10) this.unlock('muertes10');
      if (d.deaths >= 50) this.unlock('muertes50');
      if (d.bestDepth >= 5) this.unlock('nivel5');
      if (d.bestDepth >= 10) this.unlock('nivel10');
      if (d.bestDepth >= 20) this.unlock('nivel20');
      if (d.bestDepth >= 30) this.unlock('nivel30');
      if (d.bestDepth >= 50) this.unlock('nivel50');
      if ((d.morena || 0) >= 3) this.unlock('morena');
      if ((d.nona || 0) >= 3) this.unlock('nona');
      if ((d.loreCap || 0) >= 7) this.unlock('lore');
      if ((d.jefesMuertos || 0) >= 5) this.unlock('jefe5');
      if (S && S.player && S.player.streak >= 10) this.unlock('racha10');
      // eventos puntuales
      if (evento === 'pombero') this.unlock('pombero');
      if (evento === 'rataBlanca') this.unlock('rataBlanca');
      if (evento === 'disco') this.unlock('disco');
      if (evento === 'mateLeg') this.unlock('mateLeg');
      if (evento === 'tequila') this.unlock('tequila');
      if (evento === 'nieto') this.unlock('nieto');
    },
  };

  // ---- Tienda de almas: mejoras permanentes entre runs ----
  // Las almas se ganan al morir: profundidad y bajas del run.
  const MEJORAS = [
    { id: 'vida', t: 'Sangre de Gólem', d: '+2 HP máximo inicial', max: 10, base: 25 },
    { id: 'fuerza', t: 'Puños del Mundial', d: '+1 ATK base inicial', max: 5, base: 60 },
    { id: 'cuero', t: 'Piel de Vampiro', d: '+1 DEF base inicial', max: 3, base: 90 },
    { id: 'viatico', t: 'Viático del Gremio', d: '+30 de oro inicial', max: 5, base: 30 },
    { id: 'cuchillo', t: 'Cuchillo Heredado', d: 'Empezás con el cuchillo de asado', max: 1, base: 50 },
    { id: 'petaca', t: 'Petaca de Tequila', d: 'Empezás con un tequila encima (auto al 30% HP)', max: 1, base: 80 },
  ];

  MZ.meta = {
    defs: MEJORAS,

    nivel(id) { return (D().mejoras || {})[id] || 0; },

    costo(m) { return m.base * (this.nivel(m.id) + 1); },

    comprar(id) {
      const d = D();
      const m = MEJORAS.find(x => x.id === id);
      if (!m) return false;
      const lvl = this.nivel(id);
      if (lvl >= m.max) return false;
      const c = this.costo(m);
      if ((d.almas || 0) < c) return false;
      d.almas -= c;
      d.mejoras = d.mejoras || {};
      d.mejoras[id] = lvl + 1;
      MZ.save.store();
      return true;
    },

    // Aplica las mejoras compradas al jugador recién nacido (lo llama newRun).
    aplicar(P) {
      P.maxHp += this.nivel('vida') * 2;
      P.hp = P.maxHp;
      P.baseAtk += this.nivel('fuerza');
      P.baseDef += this.nivel('cuero');
      P.gold += this.nivel('viatico') * 30;
      if (this.nivel('cuchillo')) P.melee = { kind: 'melee', name: 'Cuchillo heredado', atk: 1 };
      if (this.nivel('petaca')) P.petaca = true;
    },

    // Almas ganadas por un run terminado.
    cosecha(depth, kills) {
      return Math.max(1, Math.floor(depth * 2 + kills * 0.5));
    },

    // Menú de la tienda con el sistema de diálogo.
    abrirTienda() {
      const d = D();
      const self = this;
      function menu(msg) {
        const choices = MEJORAS.map(m => {
          const lvl = self.nivel(m.id);
          if (lvl >= m.max) return { label: '✔ ' + m.t + ' (MAX) — ' + m.d, fn: () => menu('Eso ya está al mango, crack.') };
          const c = self.costo(m);
          return {
            label: m.t + ': ' + m.d + ' [' + lvl + '/' + m.max + '] — ' + c + ' 👻',
            fn() {
              if (self.comprar(m.id)) {
                if (MZ.audio) MZ.audio.pickup();
                return menu('✔ Compraste ' + m.t + ' (nivel ' + self.nivel(m.id) + '/' + m.max + '): ' + m.d + '.\nTe quedan ' + (d.almas || 0) + ' almas.');
              }
              return menu('No te alcanza para ' + m.t + ' (' + c + ' almas). Morí más seguido, que las almas no crecen en los árboles.');
            },
          };
        });
        choices.push({ label: 'Listo, me voy', fn: null });
        return {
          name: 'El Quiosco de las Almas', color: 0x00ffc8,
          text: msg + '\n\nAlmas: ' + (d.almas || 0) + ' 👻 (se cosechan al morir: profundidad y bajas pagan)',
          choices,
        };
      }
      MZ.dialog.open(menu('Bienvenido al Quiosco. Acá la muerte es moneda: cada run que termina, deja algo. Las mejoras quedan PARA SIEMPRE.'));
    },
  };
})();
