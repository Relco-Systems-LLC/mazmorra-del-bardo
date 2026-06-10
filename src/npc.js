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

  // Soborno: un NPC ya hablado que te tapa el paso. Pide algo random de lo que
  // tengas (oro, equipo o hasta vida — sin matarte) y se va (desaparece, no muere).
  function bribeNode(npc) {
    const P = MZ.state.player;
    const d = MZ.state.depth;
    const opts = [];
    if (P.gold >= 10) {
      const monto = Math.min(P.gold, 15 + d * 3);
      opts.push({ desc: monto + ' de oro', pay: () => { P.gold -= monto; } });
    }
    if (P.melee) opts.push({ desc: 'tu ' + P.melee.name, pay: () => { P.melee = null; MZ.recalcStats(); } });
    if (P.ranged && !P.ranged.aoe) opts.push({ desc: 'tu ' + P.ranged.name, pay: () => { P.ranged = null; } });
    if (P.shield) opts.push({ desc: 'tu ' + P.shield.name, pay: () => { P.shield = null; MZ.recalcStats(); } });
    if (P.hp > 4) { // hasta vida, pero nunca te mata (te deja en 1 como mínimo)
      const q = Math.min(P.hp - 1, 3 + Math.floor(d / 4));
      opts.push({ desc: q + ' de vida (un mordisco)', pay: () => { P.hp = Math.max(1, P.hp - q); } });
    }

    const remove = () => {
      MZ.state.path = [];
      if (npc.spr) { npc.spr.destroy({ children: true }); npc.spr = null; }
      MZ.state.npcs = MZ.state.npcs.filter(x => x !== npc);
      if (MZ.updateVisibility) MZ.updateVisibility();
      MZ.ui.updateHUD();
    };

    // si no tenés NADA para dar, te tiene lástima y se corre igual (no soft-lock)
    if (!opts.length) {
      return {
        name: npc.def.name, color: npc.def.color,
        text: 'Te mira, te ve sin un mango ni un fierro, suspira... "Andá, andá, pasá. Me das lástima."',
        choices: [{ label: 'Gracias (qué humillante)', fn() { remove(); return null; } }],
      };
    }

    const ask = opts[Math.floor(Math.random() * opts.length)];
    return {
      name: npc.def.name, color: npc.def.color,
      text: '"¿Querés pasar? Esto es un peaje, campeón. Dame ' + ask.desc + ' y desaparezco. O te quedás ahí mirándome."',
      choices: [
        { label: 'Pagar ' + ask.desc, fn() { ask.pay(); MZ.audio.gold(); remove(); return null; } },
        { label: 'Ni en pedo', fn: null },
      ],
    };
  }

  MZ.talkTo = function (npc) {
    const lore = MZ.LORE[npc.type];
    if (!lore) return;
    // Una charla por encuentro. Si volvés (te tapa el paso): soborno para que se corra.
    if (npc.talked) {
      MZ.audio.pickup();
      MZ.dialog.open(bribeNode(npc));
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
