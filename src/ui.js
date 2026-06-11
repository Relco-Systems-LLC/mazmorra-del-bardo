// HUD (con veneno y equipo), toasts y pantallas de inicio/muerte.
window.MZ = window.MZ || {};
(() => {
  const $ = id => document.getElementById(id);
  let toastTimer = null;
  let deathShownAt = 0;

  MZ.ui = {
    init() {
      $('screen-start').addEventListener('pointerdown', e => {
        e.preventDefault();
        // con partida guardada, solo valen los botones (para no pisar el save de un tap)
        if (MZ.save.data.run) return;
        MZ.audio.ensure();
        MZ.newRun();
      });
      $('cta-continue').addEventListener('pointerdown', e => {
        e.stopPropagation();
        e.preventDefault();
        MZ.audio.ensure();
        MZ.resumeRun();
      });
      $('cta-new').addEventListener('pointerdown', e => {
        e.stopPropagation();
        e.preventDefault();
        MZ.audio.ensure();
        MZ.newRun();
      });
      $('cta-shop').addEventListener('pointerdown', e => {
        e.stopPropagation();
        e.preventDefault();
        MZ.audio.ensure();
        MZ.meta.abrirTienda();
      });
      $('cta-stats').addEventListener('pointerdown', e => {
        e.stopPropagation();
        e.preventDefault();
        MZ.ui.showStats();
      });
      $('cta-codex').addEventListener('pointerdown', e => {
        e.stopPropagation();
        e.preventDefault();
        MZ.ui.showCodex();
      });
      $('btn-reset').addEventListener('pointerdown', e => {
        e.stopPropagation();
        e.preventDefault();
        MZ.ui.confirmReset();
      });
      $('screen-death').addEventListener('pointerdown', e => {
        e.preventDefault();
        if (Date.now() - deathShownAt < 700) return; // que no se saltee la pantalla sin querer
        MZ.audio.ensure();
        MZ.newRun();
      });
      $('hp').addEventListener('pointerdown', e => {
        e.stopPropagation();
        MZ.easter.tapHp();
      });
      $('gold').addEventListener('pointerdown', e => {
        e.stopPropagation();
        MZ.easter.tapGold();
      });
      $('depth').addEventListener('pointerdown', e => {
        e.stopPropagation();
        MZ.easter.tapDepth();
      });
      // Menú de pausa.
      $('btn-pause').addEventListener('pointerdown', e => {
        e.stopPropagation();
        e.preventDefault();
        MZ.pauseGame();
      });
      // Botón de modo caminar ⇄ apuntar.
      $('btn-aim').addEventListener('pointerdown', e => {
        e.stopPropagation();
        e.preventDefault();
        MZ.toggleAimMode();
      });
      $('cta-resume').addEventListener('pointerdown', e => {
        e.stopPropagation();
        e.preventDefault();
        MZ.unpauseGame();
      });
      $('cta-exit').addEventListener('pointerdown', e => {
        e.stopPropagation();
        e.preventDefault();
        MZ.exitToMenu();
      });

      // ---- Instalar como app (PWA) ----
      const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
      const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
      let installEvt = null;
      window.addEventListener('beforeinstallprompt', e => {
        e.preventDefault();
        installEvt = e;
        if (!standalone) this.showInstallBtn();
      });
      if (!standalone && isIOS && location.protocol.startsWith('http')) this.showInstallBtn();
      $('btn-install').addEventListener('pointerdown', async e => {
        e.stopPropagation();
        e.preventDefault();
        if (installEvt) {
          installEvt.prompt();
          const r = await installEvt.userChoice;
          if (r.outcome === 'accepted') {
            MZ.ui.toast('Instalada. Buscala en tu pantalla de inicio.', 3500);
            $('btn-install').classList.add('hidden');
            $('btn-install-sep').classList.add('hidden');
          }
          installEvt = null;
        } else {
          // iOS no tiene prompt programático: instrucciones
          MZ.ui.toast('En Safari: botón Compartir → "Agregar a pantalla de inicio".', 5000);
        }
      });

      // ---- Desinstalar: no hay API web para esto, solo se puede guiar al usuario ----
      if (standalone) {
        $('btn-uninstall').classList.remove('hidden');
        $('btn-uninstall-sep').classList.remove('hidden');
        $('btn-uninstall').addEventListener('pointerdown', e => {
          e.stopPropagation();
          e.preventDefault();
          MZ.ui.toast(isIOS
            ? 'Mantené apretado el ícono de la app en tu pantalla de inicio → "Eliminar app".'
            : 'Mantené apretado el ícono de la app → "Desinstalar" (o en los ajustes de apps del teléfono).', 6000);
        });
      }

      // ---- Buscar actualización: limpia cache del SW y recarga ----
      $('btn-update').addEventListener('pointerdown', async e => {
        e.stopPropagation();
        e.preventDefault();
        MZ.ui.toast('Actualizando...', 2000);
        try {
          if (window.caches) {
            for (const k of await caches.keys()) await caches.delete(k);
          }
          if (navigator.serviceWorker) {
            const reg = await navigator.serviceWorker.getRegistration();
            if (reg) await reg.unregister();
          }
        } catch (err) { }
        location.reload();
      });
    },

    // ---- Pantalla de stats: números de carrera, historia y censo de NPCs ----
    showStats() {
      const d = MZ.save.data;
      // Hitos de la historia: capítulos del Plomo, sellos, romance, familia, final
      const caps = MZ.CAPS_TOTAL || 8;
      const hitos = [
        ['Historia de la Gira', Math.min(d.loreCap || 0, caps), caps],
        ['Sellos del Pasaporte', MZ.sellos ? MZ.sellos.count() : 0, 5],
        ['Romance con Morena', Math.min(d.morena || 0, 3), 3],
        ['Visitas a la Nona', Math.min(d.nona || 0, 3), 3],
        ['Tato encontrado', d.nietoVisto ? 1 : 0, 1],
        ['La Nona ya sabe', d.nonaSabe ? 1 : 0, 1],
        ['El Mánager', d.fundadorVisto ? 1 : 0, 1],
        ['El Último Acorde', d.finalBueno ? 1 : 0, 1],
      ];
      const done = hitos.reduce((a, h) => a + h[1], 0);
      const total = hitos.reduce((a, h) => a + h[2], 0);
      const pct = Math.round((done / total) * 100);
      const conocidos = Object.keys(d.npcsConocidos || {}).length;
      const npcTotal = Object.keys(MZ.NPC_DEFS).length;

      const statsText =
        `📖 HISTORIA: ${pct}% (${done}/${total} hitos)\n` +
        hitos.map(h => '   ' + (h[1] >= h[2] ? '✔' : '○') + ' ' + h[0] + ' ' + h[1] + '/' + h[2]).join('\n') +
        `\n\n👥 NPCs conocidos: ${conocidos}/${npcTotal}` +
        `\n◈ Oro total recolectado: ${d.totalGold}` +
        `\n\n⚔ Récord: nivel ${d.bestDepth} · Runs: ${d.runs} · Muertes: ${d.deaths}` +
        `\n💀 Bajas: ${d.totalKills} · Jefes: ${d.jefesMuertos || 0} · 👣 Pasos: ${d.totalSteps}` +
        `\n👻 Almas: ${d.almas || 0} · 🏆 Logros: ${MZ.logros.count()}/${MZ.logros.defs.length}`;

      const logrosNode = () => ({
        name: 'Logros', color: 0xffd700,
        text: MZ.logros.defs.map(l => {
          const ok = (d.logrosU || {})[l.id];
          return (ok ? '🏆 ' : '🔒 ') + l.t + ' — ' + l.d;
        }).join('\n'),
        choices: [{ label: 'Volver', fn: statsNode }],
      });
      const statsNode = () => ({
        name: 'Tu Carrera en la Gira', color: 0x00e5ff,
        text: statsText,
        choices: [
          { label: '🏆 Ver logros (' + MZ.logros.count() + '/' + MZ.logros.defs.length + ')', fn: logrosNode },
          { label: 'Cerrar', fn: null },
        ],
      });
      MZ.dialog.open(statsNode());
    },

    // ---- Bestiario / Pokedex ----
    showCodex() {
      const CATS = [
        { key: 'monstruos', t: '🐀 Monstruos' },
        { key: 'jefes', t: '💀 Jefes' },
        { key: 'personajes', t: '🎭 Personajes' },
        { key: 'arsenal', t: '⚔ Arsenal y objetos' },
      ];
      function entrada(cat, def) {
        return {
          name: def.nombre, color: def.color,
          text: def.lore.join('\n\n'),
          choices: [{ label: '← Volver', fn: () => lista(cat) }],
        };
      }
      function lista(catKey) {
        const cat = CATS.find(c => c.key === catKey);
        const defs = MZ.CODEX[catKey];
        const got = defs.filter(d => MZ.codex.seen(catKey, d.id)).length;
        const choices = defs.map(def => {
          if (MZ.codex.seen(catKey, def.id)) return { label: def.nombre, fn: () => entrada(catKey, def) };
          return { label: '??? 🔒', fn: () => lista(catKey) };
        });
        choices.push({ label: '← Categorías', fn: raiz });
        return { name: cat.t, color: 0xff8800, text: 'Descubiertos: ' + got + '/' + defs.length, choices };
      }
      function raiz() {
        const c = MZ.codex.counts();
        const pct = Math.round((c.got / c.total) * 100);
        const choices = CATS.map(cat => {
          const defs = MZ.CODEX[cat.key];
          const got = defs.filter(d => MZ.codex.seen(cat.key, d.id)).length;
          return { label: cat.t + ' (' + got + '/' + defs.length + ')', fn: () => lista(cat.key) };
        });
        choices.push({ label: 'Cerrar', fn: null });
        return { name: 'Bestiario de Gira', color: 0xff8800, text: 'Completado: ' + pct + '% (' + c.got + '/' + c.total + ')\nTodo lo que ves, hablás o agarrás queda registrado acá.', choices };
      }
      MZ.dialog.open(raiz());
    },

    // ---- Borrar todo el progreso ----
    confirmReset() {
      MZ.dialog.open({
        name: 'Borrar todo', color: 0xff4d6d,
        text: 'Esto borra TODO: récords, almas, mejoras, romance, bestiario, partida en curso. Vuelve a cero, como recién instalado. ¿Seguro?',
        choices: [
          {
            label: 'Sí, borrá todo', fn() {
              MZ.save.reset();
              MZ.ui.toast('Progreso borrado. Tabula rasa, campeón.', 3000);
              MZ.ui.showStart();
              return null;
            },
          },
          { label: 'No, me arrepentí', fn: null },
        ],
      });
    },

    // ---- Minimapa: revela el layout; marca lo recorrido vs lo que falta ----
    updateMinimap() {
      const S = MZ.state;
      const el = $('minimap');
      if (!el) return;
      if (!S || !S.playing || !S.mapaActivo || !S.level) { el.classList.add('hidden'); return; }
      el.classList.remove('hidden');
      const L = S.level, P = S.player;
      const ctx = el.getContext('2d');
      const cell = Math.floor(el.width / L.w); // ~4px en grilla 26
      ctx.clearRect(0, 0, el.width, el.height);
      const T = MZ.T;
      for (let y = 0; y < L.h; y++) for (let x = 0; x < L.w; x++) {
        const i = y * L.w + x;
        const t = L.tiles[i];
        let col = null;
        if (t === T.STAIRS) col = '#00ffc8';
        else if (t === T.FLOOR) col = S.explored[i] ? '#7fe9ff' : '#26414d'; // recorrido vs falta
        else if (t === T.WALL || t === T.CRACK) {
          // solo dibujo paredes lindantes a piso, para que se lea el contorno
          let borde = false;
          for (let j = -1; j <= 1 && !borde; j++) for (let k = -1; k <= 1; k++) {
            const nt = L.tiles[(y + j) * L.w + (x + k)];
            if (nt === T.FLOOR || nt === T.STAIRS) borde = true;
          }
          if (borde) col = '#10202a';
        }
        if (col) { ctx.fillStyle = col; ctx.fillRect(x * cell, y * cell, cell, cell); }
      }
      // jugador
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(P.x * cell - 1, P.y * cell - 1, cell + 2, cell + 2);
      ctx.fillStyle = '#00e5ff';
      ctx.fillRect(P.x * cell, P.y * cell, cell, cell);
    },

    showInstallBtn() {
      $('btn-install').classList.remove('hidden');
      $('btn-install-sep').classList.remove('hidden');
    },

    showPause() {
      $('screen-pause').classList.remove('hidden');
    },

    hidePause() {
      $('screen-pause').classList.add('hidden');
    },

    updateHUD() {
      const S = MZ.state;
      if (!S || !S.player) return;
      const P = S.player;
      $('hp').textContent = '❤ ' + Math.max(0, P.hp) + '/' + P.maxHp + (P.poison > 0 ? ' ☠' + P.poison : '');
      $('hp').style.color = P.poison > 0 ? '#66ff44' : '#ff4d6d';
      $('lives').textContent = '🐈×' + (P.vidas != null ? P.vidas : 7);
      $('depth').textContent = 'NIVEL ' + S.depth + (S.level && S.level.isBoss ? ' · JEFE' : '') +
        (S.mapPct != null ? ' · ' + S.mapPct + '%' : '');
      MZ.refreshHeroSprite();
      $('gold').textContent = '◈ ' + P.gold;
      const eq = [P.melee ? '🗡 ' + P.melee.name + (P.melee.uses != null ? ' ×' + P.melee.uses : '') : '👊 Piñas'];
      if (P.ranged) eq.push((P.ranged.rapido ? '🔫 ' : '🏹 ') + P.ranged.name + (P.ranged.ammo != null ? ' ●' + P.ranged.ammo : ''));
      if (P.bfg) eq.push('💚 ' + P.bfg.name + ' ●' + P.bfg.ammo);
      if (P.shield) eq.push('🛡 ' + P.shield.name);
      if (P.efecto) {
        const nom = { berserk: 'MOSH', midas: 'REY DEL MERCH', fantasmal: 'BACKSTAGE ' + Math.max(0, P.efectoTurnos), iman: 'IMÁN' }[P.efecto];
        if (nom) eq.push('✨ ' + nom);
      }
      const gr = P.granadas || {};
      const gtot = (gr.frag || 0) + (gr.molotov || 0) + (gr.stun || 0);
      if (gtot) eq.push('💣' + gtot);
      eq.push('ATK ' + P.atk + ' · DEF ' + P.def + ' · 👣 ' + (P.steps || 0));
      $('equip').textContent = eq.join('  ·  ');
      this.updateAimbar();
    },

    // Selector único de arma: caminar + cada arma a distancia. Tocar un arma la
    // elige y entra en modo apuntar; tocar 🚶 vuelve a caminar. Siempre visible.
    updateAimbar() {
      const S = MZ.state;
      const bar = $('aimbar');
      const oldBtn = $('btn-aim');
      if (oldBtn) oldBtn.classList.add('hidden'); // el botón flotante ya no se usa
      if (!S || !S.playing) { bar.classList.add('hidden'); return; }
      const P = S.player;
      // si el arma activa se agotó (arco descartado / granada en 0 / bfg vacía), volvés a caminar
      if (S.aimMode) {
        const ok = P.aimSel === 'ranged' ? !!P.ranged
          : P.aimSel === 'bfg' ? !!P.bfg
          : ((P.granadas && P.granadas[P.aimSel]) || 0) > 0;
        if (!ok) S.aimMode = false;
      }
      bar.classList.remove('hidden');
      bar.innerHTML = '';
      const chips = [];
      // caminar (modo movimiento)
      chips.push({ sel: 'walk', label: '🚶', active: !S.aimMode });
      // arma disparable equipada
      if (P.ranged) {
        const ic = P.ranged.rapido ? '🔫' : '🏹';
        chips.push({ sel: 'ranged', label: ic + (P.ranged.ammo != null ? ' ●' + P.ranged.ammo : ''), active: S.aimMode && P.aimSel === 'ranged' });
      }
      // La Bestia 9000 (slot propio)
      if (P.bfg) {
        chips.push({ sel: 'bfg', label: '💚 ●' + P.bfg.ammo, active: S.aimMode && P.aimSel === 'bfg' });
      }
      // granadas con stock > 0
      for (const k of MZ.GRENADE_KEYS) {
        const n = (P.granadas && P.granadas[k]) || 0;
        if (n <= 0) continue;
        chips.push({ sel: k, label: MZ.GRENADES[k].icon + ' ' + n, active: S.aimMode && P.aimSel === k });
      }
      for (const c of chips) {
        const el = document.createElement('div');
        el.className = 'aimchip' + (c.active ? ' sel' : '');
        el.textContent = c.label;
        el.addEventListener('pointerdown', ev => { ev.stopPropagation(); ev.preventDefault(); MZ.selectAim(c.sel); });
        bar.appendChild(el);
      }
    },

    toast(msg, ms = 2600) {
      const el = $('toast');
      el.textContent = msg;
      el.style.opacity = 1;
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => { el.style.opacity = 0; }, ms);
    },

    showStart() {
      const d = MZ.save.data;
      $('start-stats').innerHTML = (d.runs > 0
        ? `Récord: nivel ${d.bestDepth} · Muertes: ${d.deaths}<br>Bajas históricas: ${d.totalKills} · Oro juntado: ${d.totalGold}<br>` +
          `🏆 Logros: ${MZ.logros.count()}/${MZ.logros.defs.length} · 👻 Almas: ${d.almas || 0}`
        : '')
        + (MZ.save.ok ? '' : '<br>⚠ Este navegador no guarda datos entre sesiones: instalá la app para no perder el progreso.');
      const showExtras = d.runs > 0;
      ['cta-shop', 'cta-stats', 'cta-codex'].forEach(id =>
        $(id).classList.toggle('hidden', !showExtras));
      $('btn-reset').parentElement.classList.toggle('hidden', !showExtras);
      const cont = $('cta-continue');
      if (d.run) {
        cont.textContent = 'CONTINUAR — NIVEL ' + d.run.depth;
        cont.classList.remove('hidden');
        $('cta-new').textContent = 'NUEVA PARTIDA';
      } else {
        cont.classList.add('hidden');
        $('cta-new').textContent = 'TOCÁ PARA ENTRAR';
      }
      $('screen-start').classList.remove('hidden');
      $('screen-death').classList.add('hidden');
      $('hud').classList.add('hidden');
      $('equip').classList.add('hidden');
      $('minimap').classList.add('hidden');
      $('btn-aim').classList.add('hidden');
      $('aimbar').classList.add('hidden');
    },

    showDeath(quote, statsHtml) {
      $('death-quote').textContent = quote;
      $('death-stats').innerHTML = statsHtml;
      $('screen-death').classList.remove('hidden');
      $('hud').classList.add('hidden');
      $('equip').classList.add('hidden');
      $('minimap').classList.add('hidden');
      $('btn-aim').classList.add('hidden');
      $('aimbar').classList.add('hidden');
      deathShownAt = Date.now();
    },

    hideScreens() {
      $('screen-start').classList.add('hidden');
      $('screen-death').classList.add('hidden');
      $('screen-pause').classList.add('hidden');
      $('hud').classList.remove('hidden');
      $('equip').classList.remove('hidden');
    },
  };
})();
