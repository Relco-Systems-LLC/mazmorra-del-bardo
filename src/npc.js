// NPCs: definiciones y motor de diálogo (overlay HTML, pausa el juego).
window.MZ = window.MZ || {};
(() => {
  MZ.NPC_DEFS = {
    // ---- el elenco estable ----
    mercader: { name: 'El Buhonero', sprite: 'mercader', color: 0xffd27f, scale: 0.95 },
    morena: { name: 'Morena', sprite: 'morena', color: 0xff4cf0, scale: 0.95 },
    bardo: { name: 'El Plomo Viejo', sprite: 'bardo', color: 0x66aaff, scale: 0.95 },
    rodrigo: { name: 'Rodrigo el Casado', sprite: 'rodrigo', color: 0x9aa5b1, scale: 0.95 },
    esperanza: { name: 'Esperanza, la Viuda', sprite: 'esperanza', color: 0xff2255, scale: 0.95 },
    nona: { name: 'La Nona del Hostel', sprite: 'nona', color: 0xb088dd, scale: 0.95 },
    tahur: { name: 'El Revendedor', sprite: 'tahur', color: 0xffd700, scale: 0.95 },
    herrero: { name: 'El Luthier', sprite: 'herrero', color: 0x9aa5b1, scale: 0.95 },
    nieto: { name: 'Tato, el Mochilero Perdido', sprite: 'nieto', color: 0xc0c8d0, scale: 0.95 },
    critico: { name: 'El Crítico de Rock', sprite: 'critico', color: 0xccaa66, scale: 0.95 },
    djtigre: { name: 'El Sonidista', sprite: 'djtigre', color: 0xff8800, scale: 0.95 },
    fundador: { name: 'El Mánager', sprite: 'fundador', color: 0xffd700, scale: 1.05 },
    // ---- la gira ----
    brisa: { name: 'Brisa, la Azafata', sprite: 'brisa', color: 0xff8800, scale: 0.95 },
    nuan: { name: 'Nuan, la Masajista', sprite: 'nuan', color: 0xff66aa, scale: 0.95 },
    monje: { name: 'El Monje del Templo', sprite: 'monje', color: 0xff8822, scale: 0.95 },
    tuktukero: { name: 'El Tuk-Tukero', sprite: 'tuktukero', color: 0xffe14d, scale: 0.95 },
    lola: { name: 'Lola de Walking Street', sprite: 'lola', color: 0xff2244, scale: 0.95 },
    mochilero: { name: 'El Mochilero Alemán', sprite: 'mochilero', color: 0x44ccaa, scale: 0.95 },
    heladero: { name: 'El Heladero de Miami', sprite: 'heladero', color: 0xffaacc, scale: 0.95 },
    influencer: { name: 'La Influencer', sprite: 'influencer', color: 0xff44aa, scale: 0.95 },
    fotografo: { name: 'El Fotógrafo del Parque', sprite: 'fotografo', color: 0xff6644, scale: 0.95 },
    cocodrilo: { name: 'Don Cocodrilo', sprite: 'cocodrilo', color: 0x44aa44, scale: 0.95 },
    pitmaster: { name: 'El Pitmaster de Kansas', sprite: 'pitmaster', color: 0xff5533, scale: 0.95 },
    cowboy: { name: 'El Cowboy Filósofo', sprite: 'cowboy', color: 0xd8c8a0, scale: 0.95 },
    porrista: { name: 'La Porrista de Dallas', sprite: 'porrista', color: 0x4488ff, scale: 0.95 },
    camionero: { name: 'El Camionero', sprite: 'camionero', color: 0xcc2222, scale: 0.95 },
    dt: { name: 'El DT', sprite: 'dt', color: 0x2a8a2a, scale: 0.95 },
    mucama: { name: 'La Mucama de la Mansión', sprite: 'mucama', color: 0xd8d8e0, scale: 0.95 },
    jardinero: { name: 'El Jardinero', sprite: 'jardinero', color: 0x55ee55, scale: 0.95 },
    detective: { name: 'El Detective', sprite: 'detective', color: 0xd8c8a8, scale: 0.95 },
    cuervo: { name: 'El Cuervo del Vestíbulo', sprite: 'cuervo', color: 0x8888aa, scale: 0.8 },
    groupie: { name: 'La Groupie Eterna', sprite: 'groupie', color: 0xcc4488, scale: 0.95 },
    tatuador: { name: 'El Tatuador de Bangkok', sprite: 'tatuador', color: 0x2a8a8a, scale: 0.95 },
    chamana: { name: 'La Chamana del Mercado', sprite: 'chamana', color: 0xb14cff, scale: 0.95 },
    gato: { name: 'El Gato del Hostel', sprite: 'gato', color: 0xcccccc, scale: 0.8 },
    elvis: { name: 'El Imitador de Elvis', sprite: 'elvis', color: 0xffe680, scale: 0.95 },
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

  // ¿El NPC está tapando un paso angosto? (corredor/esquina: ≤2 vecinos transitables).
  // En una sala abierta lo podés rodear, así que no "bloquea".
  function npcBloquea(npc) {
    let libres = 0;
    for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      if (MZ.passable(npc.x + ox, npc.y + oy)) libres++;
    }
    return libres <= 2;
  }

  MZ.talkTo = function (npc) {
    const lore = MZ.LORE[npc.type];
    if (!lore) return;
    // Una charla por encuentro. Si volvés y te tapa un paso angosto: soborno para que se corra.
    if (npc.talked) {
      if (npcBloquea(npc)) {
        MZ.audio.pickup();
        MZ.dialog.open(bribeNode(npc));
      } else {
        MZ.say('npcOcupado'); // en sala abierta: rodealo, no hay soborno
      }
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
