// NPCs: definiciones y motor de diálogo (overlay HTML, pausa el juego).
window.MZ = window.MZ || {};
(() => {
  MZ.NPC_DEFS = {
    mercader: { name: 'Don Olivera', sprite: 'mercader', color: 0xffd27f, scale: 0.95 },
    morena: { name: 'Morena', sprite: 'morena', color: 0xff4cf0, scale: 0.95 },
    bardo: { name: 'Anselmo el Bardo', sprite: 'bardo', color: 0x66aaff, scale: 0.95 },
    rodrigo: { name: 'Rodrigo el Perdido', sprite: 'rodrigo', color: 0x9aa5b1, scale: 0.95 },
    esperanza: { name: 'Esperanza, la Viuda', sprite: 'esperanza', color: 0xff2255, scale: 0.95 },
    nona: { name: 'La Nona', sprite: 'nona', color: 0xb088dd, scale: 0.95 },
    tahur: { name: 'El Tahúr', sprite: 'tahur', color: 0xffd700, scale: 0.95 },
    herrero: { name: 'Fierrito', sprite: 'herrero', color: 0x9aa5b1, scale: 0.95 },
    nieto: { name: 'Tato, el Perdido Hace 20 Años', sprite: 'nieto', color: 0xc0c8d0, scale: 0.95 },
    critico: { name: 'El Crítico', sprite: 'critico', color: 0xccaa66, scale: 0.95 },
    djtigre: { name: 'DJ Tigre', sprite: 'djtigre', color: 0xff8800, scale: 0.95 },
    fundador: { name: 'El Bardo Fundador', sprite: 'fundador', color: 0xffd700, scale: 1.05 },
  };

  const $ = id => document.getElementById(id);

  MZ.dialog = {
    open(node) {
      MZ.state.dialogOpen = true;
      MZ.state.path = [];
      this.render(node);
      $('dialog').classList.remove('hidden');
    },
    render(node) {
      $('dlg-name').textContent = node.name;
      $('dlg-name').style.color = '#' + node.color.toString(16).padStart(6, '0');
      $('dlg-text').textContent = node.text;
      const box = $('dlg-choices');
      box.innerHTML = '';
      const choices = (node.choices && node.choices.length) ? node.choices : [{ label: 'Chau', fn: null }];
      for (const ch of choices) {
        const b = document.createElement('button');
        b.className = 'dlg-btn';
        b.textContent = ch.label;
        b.addEventListener('pointerdown', ev => {
          ev.stopPropagation();
          ev.preventDefault();
          const next = ch.fn ? ch.fn() : null;
          if (next) MZ.dialog.render(next);
          else MZ.dialog.close();
        });
        box.appendChild(b);
      }
    },
    close() {
      $('dialog').classList.add('hidden');
      MZ.state.dialogOpen = false;
      MZ.state.idleMs = 0;
      MZ.ui.updateHUD();
    },
  };

  MZ.talkTo = function (npc) {
    const lore = MZ.LORE[npc.type];
    if (!lore) return;
    // Una charla por encuentro: nada de farmear bonus a puro diálogo.
    if (npc.talked) {
      MZ.say('npcOcupado');
      return;
    }
    npc.talked = true;
    // censo de NPCs conocidos (histórico, para la pantalla de stats)
    const d = MZ.save.data;
    d.npcsConocidos = d.npcsConocidos || {};
    if (!d.npcsConocidos[npc.type]) {
      d.npcsConocidos[npc.type] = 1;
      MZ.save.store();
    }
    MZ.codex.discover('personajes', npc.type);
    MZ.audio.pickup();
    MZ.dialog.open(lore.talk(npc));
  };
})();
