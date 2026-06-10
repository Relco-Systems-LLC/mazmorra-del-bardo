// Easter eggs: modo disco (7 taps al HP), nivel 42, nivel 100.
// (El Pombero vive en combat.js, la sala secreta en dungeon.js/main.js)
window.MZ = window.MZ || {};
(() => {
  let discoOn = false;
  let hueFilter = null;
  let hue = 0;
  let taps = 0;
  let firstTap = 0;
  let goldTaps = 0, goldT0 = 0;
  let depthTaps = 0, depthT0 = 0;

  MZ.easter = {
    tapHp() {
      const now = Date.now();
      if (now - firstTap > 3000) { taps = 0; firstTap = now; }
      taps++;
      if (taps >= 7) {
        taps = 0;
        this.disco();
      }
    },

    // Cheat AoE2: 7 taps al oro = ROBIN HOOD (+100 oro, una vez por run)
    tapGold() {
      const S = MZ.state;
      if (!S.playing || !S.player) return;
      const now = Date.now();
      if (now - goldT0 > 3000) { goldTaps = 0; goldT0 = now; }
      if (++goldTaps < 7 || S.player.cheatRobin) return;
      goldTaps = 0;
      S.player.cheatRobin = true;
      S.player.gold += 100;
      MZ.ui.toast('🏹 ROBIN HOOD — +100 de oro. El Age te formó, se nota.', 4000);
      MZ.audio.gold();
      MZ.fx.flash(0.25, 0xffd700);
      MZ.ui.updateHUD();
    },

    // Cheat AoE2: 7 taps al nivel = HOW DO YOU TURN THIS ON (la Bestia, una por run)
    tapDepth() {
      const S = MZ.state;
      if (!S.playing || !S.player) return;
      const now = Date.now();
      if (now - depthT0 > 3000) { depthTaps = 0; depthT0 = now; }
      if (++depthTaps < 7 || S.player.cheatCobra) return;
      depthTaps = 0;
      S.player.cheatCobra = true;
      S.player.bfg = MZ.genBFG(S.depth);
      MZ.ui.toast('🚗 HOW DO YOU TURN THIS ON — La Bestia 9000 en tus manos.', 4500);
      MZ.audio.boss();
      MZ.fx.flash(0.35, 0x33ff66);
      MZ.ui.updateHUD();
    },

    disco() {
      if (discoOn || !MZ.world) return;
      discoOn = true;
      hueFilter = new PIXI.ColorMatrixFilter();
      MZ.world.filters = [hueFilter];
      MZ.say('disco');
      MZ.audio.mate();
      MZ.fx.flash(0.3, 0xff00ff);
      MZ.logros.check('disco');
    },

    update(dt) {
      if (discoOn && hueFilter) {
        hue = (hue + dt * 0.25) % 360;
        hueFilter.hue(hue, false);
      }
    },

    // El disco dura hasta cambiar de nivel.
    endLevel() {
      if (discoOn && MZ.world) MZ.world.filters = [];
      discoOn = false;
      hueFilter = null;
    },

    onDepth(depth) {
      if (depth === 42) {
        MZ.say('nivel42', null, 4500);
        MZ.fx.flash(0.4, 0xffd700);
      }
      if (depth === 100) {
        MZ.say('nivel100', null, 7000);
        MZ.fx.flash(0.6, 0xffd700);
        // Fueguitos artificiales de festejo.
        const P = MZ.state.player;
        for (let i = 0; i < 6; i++) {
          setTimeout(() => {
            const p = MZ.toPx(P.x, P.y);
            MZ.fx.explode(p.x + (Math.random() - 0.5) * 200, p.y + (Math.random() - 0.5) * 200,
              [0xffd700, 0x00e5ff, 0xff4cf0, 0x7fff00][i % 4], 24, 3.5);
            MZ.audio.secret();
          }, i * 350);
        }
      }
    },
  };
})();
