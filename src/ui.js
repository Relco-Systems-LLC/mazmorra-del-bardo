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
      // Export/import del save a archivo (backup o pasar la partida a otro dispositivo).
      $('btn-export').addEventListener('pointerdown', e => {
        e.stopPropagation();
        e.preventDefault();
        MZ.ui.exportSave();
      });
      $('btn-import').addEventListener('pointerdown', e => {
        e.stopPropagation();
        e.preventDefault();
        $('import-file').click();
      });
      $('import-file').addEventListener('change', async e => {
        const f = e.target.files[0];
        if (!f) return;
        const ok = MZ.save.importData(await f.text());
        MZ.ui.toast(ok ? 'Save importado. Dale a continuar.' : 'Ese archivo no es un save válido.', 3000);
        if (ok) MZ.ui.showStart(); // refresca botones y stats
        e.target.value = '';
      });
      // Menú de pausa (save/export en medio de la partida).
      $('btn-pause').addEventListener('pointerdown', e => {
        e.stopPropagation();
        e.preventDefault();
        MZ.pauseGame();
      });
      $('cta-resume').addEventListener('pointerdown', e => {
        e.stopPropagation();
        e.preventDefault();
        MZ.unpauseGame();
      });
      $('cta-export-pause').addEventListener('pointerdown', e => {
        e.stopPropagation();
        e.preventDefault();
        MZ.serializeRun();
        MZ.ui.exportSave();
      });
      $('cta-exit').addEventListener('pointerdown', e => {
        e.stopPropagation();
        e.preventDefault();
        MZ.exitToMenu();
      });
    },

    exportSave() {
      const blob = new Blob([MZ.save.exportData()], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'mazmorra.save';
      a.click();
      URL.revokeObjectURL(a.href);
      MZ.ui.toast('Save exportado (carpeta de descargas).', 3000);
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
      $('depth').textContent = 'NIVEL ' + S.depth + (S.level && S.level.isBoss ? ' · JEFE' : '');
      $('gold').textContent = '◈ ' + P.gold;
      const eq = [P.melee ? '🗡 ' + P.melee.name : '👊 Piñas'];
      if (P.ranged) eq.push('🏹 ' + P.ranged.name + ' (alc ' + P.ranged.range + ')');
      if (P.shield) eq.push('🛡 ' + P.shield.name);
      eq.push('ATK ' + P.atk + ' · DEF ' + P.def + ' · 👣 ' + (P.steps || 0));
      $('equip').textContent = eq.join('  ·  ');
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
        ? `Récord: nivel ${d.bestDepth} · Muertes: ${d.deaths}<br>Bajas históricas: ${d.totalKills} · Oro juntado: ${d.totalGold}<br>Pasos caminados: ${d.totalSteps}`
        : '')
        + (MZ.save.ok ? '' : '<br>⚠ Este navegador no guarda datos: exportá tu save antes de cerrar.');
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
    },

    showDeath(quote, statsHtml) {
      $('death-quote').textContent = quote;
      $('death-stats').innerHTML = statsHtml;
      $('screen-death').classList.remove('hidden');
      $('hud').classList.add('hidden');
      $('equip').classList.add('hidden');
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
