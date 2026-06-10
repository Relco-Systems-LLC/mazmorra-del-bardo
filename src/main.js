// Bootstrap + orquestación: render, D-pad táctil relativo al jugador, turnos, NPCs.
window.MZ = window.MZ || {};
(async () => {
  const T = MZ.T;

  const app = new PIXI.Application();
  await app.init({
    resizeTo: window,
    background: '#03030c',
    antialias: true,
    resolution: Math.min(window.devicePixelRatio || 1, 2),
    autoDensity: true,
  });
  document.getElementById('game').appendChild(app.canvas);
  MZ.app = app;

  const TILE = Math.max(26, Math.min(52, Math.floor(Math.min(window.innerWidth / 11, window.innerHeight / 16))));
  MZ.TILE = TILE;

  // Capas del mundo (la cámara mueve `world` entero).
  const world = new PIXI.Container();
  const mapLayer = new PIXI.Container();
  const itemLayer = new PIXI.Container();
  const npcLayer = new PIXI.Container();
  const enemyLayer = new PIXI.Container();
  const playerLayer = new PIXI.Container();
  const fxLayer = new PIXI.Container();
  world.addChild(mapLayer, itemLayer, npcLayer, enemyLayer, playerLayer, fxLayer);
  app.stage.addChild(world);
  MZ.world = world;

  // ---- Texturas de tiles y FX (se tintan con el tema del nivel) ----
  function makeTextures() {
    const R = app.renderer, t = {};
    let g;

    g = new PIXI.Graphics();
    g.rect(0, 0, TILE, TILE).fill(0xffffff);
    g.rect(0.5, 0.5, TILE - 1, TILE - 1).stroke({ width: 1, color: 0x000000, alpha: 0.3 });
    t.floor = R.generateTexture(g);

    g = new PIXI.Graphics();
    g.rect(0, 0, TILE, TILE).fill(0x181818);
    g.rect(1.5, 1.5, TILE - 3, TILE - 3).stroke({ width: 2, color: 0xffffff, alpha: 0.95 });
    t.wall = R.generateTexture(g);

    g = new PIXI.Graphics();
    g.rect(0, 0, TILE, TILE).fill(0x181818);
    g.rect(1.5, 1.5, TILE - 3, TILE - 3).stroke({ width: 2, color: 0xffffff, alpha: 0.95 });
    g.moveTo(TILE * 0.32, TILE * 0.18).lineTo(TILE * 0.55, TILE * 0.42)
      .lineTo(TILE * 0.4, TILE * 0.6).lineTo(TILE * 0.66, TILE * 0.84)
      .stroke({ width: 1.5, color: 0xffffff, alpha: 0.55 });
    t.crack = R.generateTexture(g);

    g = new PIXI.Graphics();
    g.poly([TILE * 0.5, TILE * 0.8, TILE * 0.18, TILE * 0.28, TILE * 0.82, TILE * 0.28]).fill({ color: 0xffffff, alpha: 0.95 });
    t.stairs = R.generateTexture(g);

    g = new PIXI.Graphics();
    for (let r = 28; r >= 2; r -= 2) g.circle(30, 30, r).fill({ color: 0xffffff, alpha: 0.05 + (1 - r / 28) * 0.08 });
    t.glow = R.generateTexture(g);

    g = new PIXI.Graphics();
    g.circle(26, 26, 22).stroke({ width: 4, color: 0xffffff });
    t.ring = R.generateTexture(g);

    return t;
  }
  const TEX = makeTextures();
  const PIX = MZ.buildSpriteTextures(app.renderer);
  MZ.PIXTEX = PIX;
  MZ.fx.init(app, fxLayer, TEX);
  MZ.ui.init();
  await MZ.save.load();

  // ---- Estado ----
  const S = MZ.state = {
    playing: false, depth: 1, runSeed: 1,
    player: null, level: null, enemies: [], items: [], npcs: [],
    tileSprites: [], explored: null, glows: [], brokenCracks: [],
    stepTimer: 0, idleMs: 0, idleWarned: false, dialogOpen: false, paused: false,
  };

  let playerSpr = null;
  let heroShape = null;     // el sprite de forma del héroe (cambia con el arma)
  let heroTexName = '';
  let camX = 0, camY = 0;
  let pulseT = 0;
  let touch = null; // posición global del dedo mientras está apoyado

  // El héroe se ve según lo que empuña: BFG > espada > arco > piñas.
  MZ.refreshHeroSprite = function () {
    if (!heroShape || !S.player) return;
    const P = S.player;
    const name = P.ranged && P.ranged.aoe ? 'heroeBfg'
      : P.melee ? 'heroe'
      : P.ranged ? 'heroeArco'
      : 'heroePinas';
    if (name === heroTexName) return;
    heroTexName = name;
    heroShape.texture = PIX[name];
  };

  // ---- Helpers globales ----
  MZ.toPx = (x, y) => ({ x: x * TILE + TILE / 2, y: y * TILE + TILE / 2 });
  MZ.inBounds = (x, y) => S.level && x >= 0 && y >= 0 && x < S.level.w && y < S.level.h;
  MZ.passable = (x, y) => {
    if (!MZ.inBounds(x, y)) return false;
    const t = S.level.tiles[y * S.level.w + x];
    return t === T.FLOOR || t === T.STAIRS;
  };
  MZ.enemyAt = (x, y) => S.enemies.find(e => !e.dead && e.x === x && e.y === y);
  MZ.itemAt = (x, y) => S.items.find(i => i.x === x && i.y === y);
  MZ.npcAt = (x, y) => S.npcs.find(n => n.x === x && n.y === y);

  MZ.los = function (x0, y0, x1, y1) {
    const L = S.level;
    if (!L) return false;
    let dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx - dy, x = x0, y = y0;
    while (!(x === x1 && y === y1)) {
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; x += sx; }
      if (e2 < dx) { err += dx; y += sy; }
      if (x === x1 && y === y1) break;
      const t = L.tiles[y * L.w + x];
      if (t === T.WALL || t === T.CRACK) return false;
    }
    return true;
  };

  // ---- Sprites de entidades: glow aditivo atrás + pixel-art adelante ----
  function entitySprite(def, layer) {
    const c = new PIXI.Container();
    const glow = new PIXI.Sprite(TEX.glow);
    glow.anchor.set(0.5);
    glow.tint = def.color;
    glow.blendMode = 'add';
    glow.scale.set(def.scale * 1.6);
    glow.alpha = 0.6;
    const tex = PIX[def.sprite];
    const shape = new PIXI.Sprite(tex);
    shape.anchor.set(0.5);
    shape.scale.set((TILE * 0.92 * def.scale) / Math.max(tex.width, tex.height));
    c.addChild(glow, shape);
    layer.addChild(c);
    S.glows.push({ spr: glow, phase: Math.random() * Math.PI * 2 });
    return c;
  }

  function findFreeCell(minDist) {
    const L = S.level;
    for (let t = 0; t < 250; t++) {
      const x = 1 + Math.floor(Math.random() * (L.w - 2));
      const y = 1 + Math.floor(Math.random() * (L.h - 2));
      if (L.tiles[y * L.w + x] !== T.FLOOR) continue;
      if (MZ.enemyAt(x, y) || MZ.itemAt(x, y) || MZ.npcAt(x, y)) continue;
      if (Math.abs(x - L.entrance.x) + Math.abs(y - L.entrance.y) < minDist) continue;
      return { x, y };
    }
    return null;
  }

  function spawnItem(type, cell, amount) {
    if (!cell) return;
    const def = MZ.ITEM_DEFS[type];
    const it = { type, x: cell.x, y: cell.y, amount: amount || 0, def };
    it.spr = entitySprite(def, itemLayer);
    const p = MZ.toPx(cell.x, cell.y);
    it.spr.position.set(p.x, p.y);
    S.items.push(it);
  }

  // Para drops de monstruos (lo usa combat.js).
  MZ.spawnItemAt = function (type, x, y, amount) {
    if (!S.level || MZ.itemAt(x, y)) return;
    spawnItem(type, { x, y }, amount);
    MZ.updateVisibility();
  };

  // ---- Save state del run (resume exacto) ----
  function serializeRun() {
    if (!S.playing || !S.level) return;
    MZ.save.data.run = {
      seed: S.runSeed,
      depth: S.depth,
      player: { ...S.player },
      enemies: S.enemies.filter(e => !e.dead).map(e => ({
        type: e.type, x: e.x, y: e.y, hp: e.hp, atk: e.atk,
        awake: !!e.awake, poison: e.poison || 0, stolen: e.stolen || 0,
      })),
      items: S.items.map(i => ({ type: i.type, x: i.x, y: i.y, amount: i.amount })),
      npcs: S.npcs.map(n => ({
        type: n.type, x: n.x, y: n.y, talked: !!n.talked,
        soldSword: !!n.soldSword, soldVest: !!n.soldVest, soldBow: !!n.soldBow,
      })),
      cracks: S.brokenCracks.slice(),
      evento: S.evento || null,
      explored: Array.from(S.explored).join(''),
      quests: JSON.parse(JSON.stringify(MZ.quests.run)),
    };
    MZ.save.store();
  }
  MZ.serializeRun = serializeRun;

  // ---- Pausa: el juego se congela, se puede exportar o salir al menú ----
  MZ.pauseGame = function () {
    if (!S.playing || S.paused) return;
    S.paused = true;
    touch = null;
    serializeRun();
    MZ.ui.showPause();
  };

  MZ.unpauseGame = function () {
    S.paused = false;
    S.idleMs = 0;
    S.idleWarned = false;
    MZ.ui.hidePause();
  };

  MZ.exitToMenu = function () {
    serializeRun(); // guarda con playing aún true
    S.playing = false;
    S.paused = false;
    touch = null;
    MZ.ui.hidePause();
    MZ.ui.showStart();
  };

  // Después de un knockback: lo que haya en la casilla donde caíste, te toca.
  MZ.onPlayerDisplaced = function () {
    if (!S.playing) return;
    const it = MZ.itemAt(S.player.x, S.player.y);
    if (it) applyItem(it);
    if (S.playing) updateVisibility();
  };

  // ---- Construcción del nivel (restore = snapshot guardado para resumir) ----
  function buildLevel(restore) {
    MZ.easter.endLevel();
    MZ.fx.clear();
    for (const l of [mapLayer, itemLayer, npcLayer, enemyLayer, playerLayer]) {
      l.removeChildren().forEach(c => c.destroy({ children: true }));
    }
    S.glows = [];
    touch = null;

    const L = S.level = MZ.genLevel(S.runSeed, S.depth);
    const th = L.theme;

    // Evento del nivel y limpieza de efectos de altar (duran un piso).
    S.turnos = 0;
    if (restore) {
      S.evento = restore.evento || null;
    } else {
      S.evento = MZ.eventos.sortear(S.depth, L.isBoss);
      if (S.player) { S.player.efecto = null; S.player.efectoTurnos = 0; }
    }

    // Grietas ya rotas en la partida guardada: aplicar antes de crear sprites.
    S.brokenCracks = restore ? restore.cracks.slice() : [];
    for (const c of S.brokenCracks) L.tiles[c.y * L.w + c.x] = T.FLOOR;

    S.tileSprites = new Array(L.w * L.h).fill(null);
    S.explored = new Uint8Array(L.w * L.h);
    for (let y = 0; y < L.h; y++) for (let x = 0; x < L.w; x++) {
      const t = L.tiles[y * L.w + x];
      if (t === T.WALL) {
        // Solo dibujamos paredes pegadas a piso (el resto es negro).
        let nearFloor = false;
        for (let j = -1; j <= 1 && !nearFloor; j++) for (let i = -1; i <= 1; i++) {
          const nx = x + i, ny = y + j;
          if (nx >= 0 && ny >= 0 && nx < L.w && ny < L.h) {
            const nt = L.tiles[ny * L.w + nx];
            if (nt !== T.WALL && nt !== T.CRACK) { nearFloor = true; break; }
          }
        }
        if (!nearFloor) continue;
      }
      const spr = new PIXI.Sprite(t === T.WALL ? TEX.wall : t === T.CRACK ? TEX.crack : TEX.floor);
      spr.position.set(x * TILE, y * TILE);
      spr.tint = (t === T.WALL || t === T.CRACK) ? th.wall : th.floor;
      spr.alpha = 0;
      mapLayer.addChild(spr);
      S.tileSprites[y * L.w + x] = spr;
    }

    // Escalera con glow respirante.
    const stairsC = new PIXI.Container();
    const sg = new PIXI.Sprite(TEX.glow);
    sg.anchor.set(0.5); sg.tint = th.accent; sg.blendMode = 'add'; sg.scale.set(1.3);
    const ss = new PIXI.Sprite(TEX.stairs);
    ss.anchor.set(0.5); ss.tint = th.accent;
    stairsC.addChild(sg, ss);
    const sp = MZ.toPx(L.stairs.x, L.stairs.y);
    stairsC.position.set(sp.x, sp.y);
    itemLayer.addChild(stairsC);
    S.glows.push({ spr: sg, phase: 0 });
    L.stairsSpr = stairsC;

    // Ítems: del snapshot si resumimos, si no los del generador.
    S.items = [];
    for (const it of (restore ? restore.items : L.items)) spawnItem(it.type, { x: it.x, y: it.y }, it.amount);

    // Enemigos.
    const enemySrc = restore ? restore.enemies : L.enemies;
    S.enemies = enemySrc.map(e => {
      const en = MZ.makeEnemy(e.type, e.x, e.y, S.depth);
      if (restore) {
        en.hp = e.hp;
        en.atk = e.atk;
        en.awake = e.awake;
        en.poison = e.poison || 0;
        if (e.stolen) en.stolen = e.stolen;
      }
      en.spr = entitySprite(en.def, enemyLayer);
      const p = MZ.toPx(e.x, e.y);
      en.spr.position.set(p.x, p.y);
      return en;
    });

    // Modificadores de evento sobre el nivel recién generado.
    if (!restore && S.evento === 'invasion') {
      for (const e of [...S.enemies]) {
        if (e.boss || e.def.rare) continue;
        const c = findFreeCell(5);
        if (!c) break;
        const en = MZ.makeEnemy(e.type, c.x, c.y, S.depth);
        en.spr = entitySprite(en.def, enemyLayer);
        const p = MZ.toPx(c.x, c.y);
        en.spr.position.set(p.x, p.y);
        S.enemies.push(en);
      }
    }
    if (!restore && S.evento === 'lluvia') {
      for (let i = 0; i < 6; i++) spawnItem('gold', findFreeCell(3), 8 + S.depth * 2);
      for (const e of S.enemies) {
        e.hp = Math.round(e.hp * 1.3);
        e.maxHp = Math.round(e.maxHp * 1.3);
      }
    }

    // Total de piso transitable, para el % de mapa recorrido.
    L.floorTotal = 0;
    for (let i = 0; i < L.w * L.h; i++) {
      if (L.tiles[i] === T.FLOOR || L.tiles[i] === T.STAIRS) L.floorTotal++;
    }

    // Jugador: si resumimos, donde estaba; si no, en la entrada.
    playerSpr = entitySprite({ sprite: 'heroe', color: 0x00e5ff, scale: 0.95 }, playerLayer);
    heroShape = playerSpr.children[1];
    heroTexName = 'heroe';
    MZ.refreshHeroSprite();
    if (!restore) { S.player.x = L.entrance.x; S.player.y = L.entrance.y; }
    const pp = MZ.toPx(S.player.x, S.player.y);
    playerSpr.position.set(pp.x, pp.y);
    playerSpr.visible = true;

    // NPCs: restaurados con sus flags, o nuevos (quests forzadas + azar).
    S.npcs = [];
    if (restore) {
      for (const sn of restore.npcs) {
        const def = MZ.NPC_DEFS[sn.type];
        const n = { ...sn, def };
        n.spr = entitySprite(def, npcLayer);
        const p = MZ.toPx(n.x, n.y);
        n.spr.position.set(p.x, p.y);
        S.npcs.push(n);
      }
    } else {
      for (const type of MZ.pickNpcsForLevel(S.depth, L.isBoss)) {
        const c = findFreeCell(4);
        if (!c) continue;
        const def = MZ.NPC_DEFS[type];
        const n = { type, def, x: c.x, y: c.y };
        n.spr = entitySprite(def, npcLayer);
        const p = MZ.toPx(c.x, c.y);
        n.spr.position.set(p.x, p.y);
        S.npcs.push(n);
      }
      // Quest del anillo: el anillo aparece en el nivel objetivo (o más abajo).
      if (MZ.quests.needRing(S.depth)) spawnItem('anillo', findFreeCell(6));
    }

    // Niebla descubierta.
    if (restore && restore.explored && restore.explored.length === L.w * L.h) {
      S.explored = Uint8Array.from(restore.explored, ch => +ch);
    }

    camX = app.screen.width / 2 - pp.x;
    camY = app.screen.height / 2 - pp.y;

    updateVisibility();
    MZ.ui.updateHUD();
    if (!restore) {
      MZ.easter.onDepth(S.depth);
      if (S.evento) MZ.eventos.anunciar(S.evento);
      if (L.isBoss) {
        const boss = S.enemies.find(e => e.boss);
        MZ.say('jefeIntro', { b: boss ? boss.name : 'el jefe' });
        MZ.audio.boss();
        MZ.fx.shake(6);
      }
    }
    serializeRun();
  }

  // ---- Niebla de guerra ----
  function updateVisibility() {
    const L = S.level, P = S.player;
    const R = MZ.eventos.visionR(); // 7 normal, 2 en apagón
    for (let y = 0; y < L.h; y++) for (let x = 0; x < L.w; x++) {
      const i = y * L.w + x;
      const spr = S.tileSprites[i];
      if (!spr) continue;
      const d = Math.max(Math.abs(x - P.x), Math.abs(y - P.y));
      const vis = d <= R && MZ.los(P.x, P.y, x, y);
      if (vis) S.explored[i] = 1;
      spr.alpha = vis ? 1 : (S.explored[i] ? 0.22 : 0);
    }
    for (const e of S.enemies) {
      if (!e.spr) continue;
      const d = Math.max(Math.abs(e.x - P.x), Math.abs(e.y - P.y));
      e.spr.visible = d <= R && MZ.los(P.x, P.y, e.x, e.y);
    }
    const dimItem = (o) => {
      if (!o.spr) return;
      const i = o.y * L.w + o.x;
      const d = Math.max(Math.abs(o.x - P.x), Math.abs(o.y - P.y));
      const vis = d <= R && MZ.los(P.x, P.y, o.x, o.y);
      o.spr.visible = vis || !!S.explored[i];
      o.spr.alpha = vis ? 1 : 0.35;
    };
    S.items.forEach(dimItem);
    S.npcs.forEach(dimItem);
    const si = L.stairs.y * L.w + L.stairs.x;
    L.stairsSpr.visible = !!S.explored[si];
    // % del mapa recorrido (solo piso transitable)
    let seen = 0;
    for (let i = 0; i < L.w * L.h; i++) {
      if (S.explored[i] && (L.tiles[i] === T.FLOOR || L.tiles[i] === T.STAIRS)) seen++;
    }
    S.mapPct = L.floorTotal ? Math.round((seen / L.floorTotal) * 100) : 0;
  }
  MZ.updateVisibility = updateVisibility;

  // ---- Turnos ----
  function endTurn() {
    MZ.enemiesTurn();
    const P = S.player;
    if (S.playing && P.poison > 0) {
      P.poison--;
      P.hp -= 1;
      const p = MZ.toPx(P.x, P.y);
      MZ.fx.floatText(p.x, p.y - 12, '☠1', 0x66ff44, 12);
      if (P.hp <= 0) { MZ.die('el veneno'); return; }
    }
    // eventos y efectos de altar que actúan por turno
    S.turnos = (S.turnos || 0) + 1;
    if (S.playing && S.evento === 'niebla' && S.turnos % 10 === 0) {
      MZ.poisonPlayer(2, 'la niebla venenosa');
      if (!S.playing) return;
    }
    // berserk: si hay un enemigo pegado, tus puños deciden solos
    if (S.playing && P.efecto === 'berserk' && P.hp > 0) {
      const adj = S.enemies.find(e => !e.dead && Math.max(Math.abs(e.x - P.x), Math.abs(e.y - P.y)) === 1);
      if (adj) MZ.playerAttack(adj);
    }
    // imán: el oro cercano camina hacia vos
    if (S.playing && P.efecto === 'iman') {
      for (const it of S.items) {
        if (it.type !== 'gold') continue;
        const d = Math.max(Math.abs(it.x - P.x), Math.abs(it.y - P.y));
        if (d > 3 || d === 0) continue;
        const sx = Math.sign(P.x - it.x), sy = Math.sign(P.y - it.y);
        // diagonal directa, si no por un eje
        for (const [ox, oy] of [[sx, sy], [sx, 0], [0, sy]]) {
          if (!ox && !oy) continue;
          const nx = it.x + ox, ny = it.y + oy;
          if (nx === P.x && ny === P.y) continue;
          if (MZ.passable(nx, ny) && !MZ.itemAt(nx, ny)) {
            it.x = nx; it.y = ny;
            if (it.spr) { const pp = MZ.toPx(nx, ny); it.spr.position.set(pp.x, pp.y); }
            break;
          }
        }
      }
    }
    // fantasmal: tic-tac (no expira si justo estás adentro de una pared)
    if (S.playing && P.efecto === 'fantasmal') {
      P.efectoTurnos--;
      if (P.efectoTurnos <= 0 && MZ.passable(P.x, P.y)) {
        P.efecto = null;
        MZ.ui.toast('Volvés a ser sólido. Qué bajón.', 2200);
      }
    }
    // petaca de tequila (mejora permanente): se toma sola al 30% de vida
    if (S.playing && P.petaca && P.hp > 0 && P.hp <= P.maxHp * 0.3) {
      P.petaca = false;
      const heal = 10 + Math.floor(S.depth / 3);
      P.hp = Math.min(P.maxHp, P.hp + heal);
      const p = MZ.toPx(P.x, P.y);
      MZ.fx.floatText(p.x, p.y - 16, 'petaca +' + heal + ' 🍹', 0xffe680, 13);
      MZ.audio.mate();
      MZ.say('tequila');
    }
    if (S.playing) updateVisibility();
    MZ.ui.updateHUD();
    serializeRun();
  }

  function applyItem(it) {
    const P = S.player;
    const p = MZ.toPx(it.x, it.y);

    // Los pinchos lastiman y se quedan donde están.
    if (it.type === 'pinchos') {
      MZ.say('trampa');
      MZ.hurtPlayer(2 + Math.floor(S.depth / 4), 'los pinchos');
      return;
    }

    MZ.fx.sparkle(p.x, p.y, it.def.color);
    switch (it.type) {
      case 'gold':
        P.gold += it.amount;
        MZ.audio.gold();
        MZ.fx.floatText(p.x, p.y - 8, '+' + it.amount, 0xffd700, 13);
        if (Math.random() < 0.12) MZ.say('lootMalo');
        break;
      case 'potion': {
        // ruleta rusa de kiosco: 75% cura, 25% vencida y te envenena
        if (Math.random() < 0.25) {
          MZ.say('pocionMala');
          MZ.poisonPlayer(4, 'una poción vencida');
        } else {
          const heal = 10 + Math.floor(S.depth / 3);
          P.hp = Math.min(P.maxHp, P.hp + heal);
          P.poison = 0;
          MZ.audio.pickup();
          MZ.fx.floatText(p.x, p.y - 8, '+' + heal + ' HP', 0xff66ff, 13);
          if (Math.random() < 0.4) MZ.say('pocionBuena', { h: heal });
        }
        break;
      }
      case 'heart': {
        const heal = 5 + Math.floor(S.depth / 4);
        P.hp = Math.min(P.maxHp, P.hp + heal);
        MZ.audio.pickup();
        MZ.fx.floatText(p.x, p.y - 8, '+' + heal + ' ❤', 0xff3355, 14);
        if (Math.random() < 0.3) MZ.say('corazon', { h: heal });
        break;
      }
      case 'weapon': {
        const w = MZ.genGear('melee', S.depth);
        // recambio rápido: agarrás si es mejor, si estás a piñas, o si tu filo agoniza
        if (!P.melee || w.atk >= P.melee.atk || P.melee.uses <= 4) {
          P.melee = w;
          MZ.recalcStats();
          MZ.audio.pickup();
          MZ.say('lootArma', { w: w.name + ' (' + w.uses + ' filos)' });
        } else {
          const g = 5 + w.atk * 4;
          P.gold += g;
          MZ.audio.gold();
          MZ.say('lootRepetido', { g });
        }
        break;
      }
      case 'bow': {
        const w = MZ.genGear('ranged', S.depth);
        if (!P.ranged || (!P.ranged.aoe && (w.atk >= P.ranged.atk || P.ranged.ammo <= 1))) {
          P.ranged = w;
          MZ.audio.pickup();
          MZ.say('lootArma', { w: w.name + ' (' + w.ammo + ' tiros)' });
        } else {
          const g = 5 + w.atk * 4;
          P.gold += g;
          MZ.audio.gold();
          MZ.say('lootRepetido', { g });
        }
        break;
      }
      case 'bfg': {
        P.ranged = MZ.genBFG(S.depth);
        MZ.audio.boss();
        MZ.fx.flash(0.35, 0x33ff66);
        MZ.say('bfgPickup', null, 4000);
        break;
      }
      case 'armor': {
        const w = MZ.genGear('shield', S.depth);
        if (!P.shield || w.def > P.shield.def) {
          P.shield = w;
          MZ.recalcStats();
          MZ.audio.pickup();
          MZ.say('lootArma', { w: w.name });
        } else {
          const g = 5 + w.def * 6;
          P.gold += g;
          MZ.audio.gold();
          MZ.say('lootRepetido', { g });
        }
        break;
      }
      case 'mate':
        P.hp = P.maxHp;
        P.poison = 0;
        MZ.audio.mate();
        MZ.say('mate');
        break;
      case 'mateLegendario':
        P.maxHp += 5;
        P.hp = P.maxHp;
        P.baseAtk += 1;
        P.poison = 0;
        MZ.recalcStats();
        MZ.audio.mate();
        MZ.say('mateLegendario', null, 4000);
        MZ.fx.flash(0.35, 0x00ffc8);
        MZ.logros.check('mateLeg');
        break;
      case 'tequila': {
        // cura fuerte ya, resaca después (1 turno de veneno)
        const heal = 8 + Math.floor(S.depth / 3);
        P.hp = Math.min(P.maxHp, P.hp + heal);
        P.poison = Math.max(P.poison, 1);
        MZ.audio.mate();
        MZ.fx.floatText(p.x, p.y - 8, '+' + heal + ' 🍹', 0xffe680, 14);
        MZ.say('tequila');
        MZ.logros.check('tequila');
        break;
      }
      case 'chest': {
        if (Math.random() < 0.15) {
          // EL COFRE TENÍA DIENTES
          MZ.say('mimic', null, 3000);
          MZ.audio.boss();
          MZ.fx.shake(8);
          const spots2 = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]];
          for (const [ox, oy] of spots2) {
            const x = it.x + ox, y = it.y + oy;
            if (MZ.passable(x, y) && !MZ.enemyAt(x, y) && !MZ.npcAt(x, y)) {
              const en = MZ.makeEnemy('mimic', x, y, S.depth);
              en.awake = true;
              en.spr = entitySprite(en.def, enemyLayer);
              const mp = MZ.toPx(x, y);
              en.spr.position.set(mp.x, mp.y);
              S.enemies.push(en);
              break;
            }
          }
          MZ.hurtPlayer(2 + Math.floor(S.depth / 4), 'un mimic');
        } else {
          P.gold += it.amount;
          P.hp = Math.min(P.maxHp, P.hp + 8);
          MZ.audio.secret();
          MZ.fx.floatText(p.x, p.y - 8, '+' + it.amount, 0xffd700, 16);
        }
        break;
      }
      case 'anillo':
        MZ.quests.ringFound();
        MZ.audio.secret();
        MZ.ui.toast('El anillo de Rodrigo. Tiene algo grabado adentro... Llevaselo.', 3500);
        break;
      case 'altar': {
        if (Math.random() < 0.5) {
          // clásico: cura, vida máxima, oro o maldición
          const r = Math.random();
          if (r < 0.35) {
            P.hp = P.maxHp; P.poison = 0;
            MZ.audio.mate();
            MZ.say('altarBueno');
          } else if (r < 0.55) {
            P.maxHp += 2; P.hp = Math.min(P.maxHp, P.hp + 2); MZ.recalcStats();
            MZ.audio.secret();
            MZ.say('altarBueno');
          } else if (r < 0.78) {
            const g = 25 + S.depth * 2;
            P.gold += g;
            MZ.audio.gold();
            MZ.fx.floatText(p.x, p.y - 8, '+' + g, 0xffd700, 15);
            MZ.say('altarBueno');
          } else {
            MZ.poisonPlayer(3, 'el altar');
            MZ.say('altarMalo');
          }
        } else {
          // efecto loco que dura el nivel (fantasmal: 10 turnos)
          const efs = ['berserk', 'midas', 'fantasmal', 'iman'];
          const ef = efs[Math.floor(Math.random() * efs.length)];
          P.efecto = ef;
          P.efectoTurnos = ef === 'fantasmal' ? 10 : 9999;
          MZ.audio.secret();
          MZ.fx.flash(0.3, 0x00ffc8);
          MZ.say(ef, null, 4500);
        }
        break;
      }
    }
    if (it.spr) { it.spr.destroy(); it.spr = null; }
    S.items = S.items.filter(x => x !== it);
    MZ.ui.updateHUD();
  }

  function breakCrack(x, y) {
    const L = S.level;
    L.tiles[y * L.w + x] = T.FLOOR;
    S.brokenCracks.push({ x, y });
    const spr = S.tileSprites[y * L.w + x];
    if (spr) { spr.texture = TEX.floor; spr.tint = L.theme.floor; }
    const p = MZ.toPx(x, y);
    MZ.fx.explode(p.x, p.y, L.theme.wall, 20, 3);
    MZ.fx.shake(5);
    MZ.audio.secret();
    MZ.say('secreto');
  }

  // ---- Movimiento por D-pad relativo (8 direcciones) ----
  // Mover hacia una casilla = un turno. Caminar contra algo = interactuar:
  // enemigo → atacar, NPC → hablar, grieta → romper.
  function tryMove(dx, dy) {
    const P = S.player;
    S.idleMs = 0;
    S.idleWarned = false;
    const nx = P.x + dx, ny = P.y + dy;

    const e = MZ.enemyAt(nx, ny);
    if (e) { MZ.playerAttack(e); endTurn(); return true; }

    const n = MZ.npcAt(nx, ny);
    if (n) { touch = null; MZ.talkTo(n); return true; }

    const L = S.level;
    if (MZ.inBounds(nx, ny) && L.tiles[ny * L.w + nx] === T.CRACK) {
      breakCrack(nx, ny);
      endTurn();
      return true;
    }

    if (!MZ.passable(nx, ny)) {
      // fantasmal: las paredes interiores son una sugerencia
      const fantasma = P.efecto === 'fantasmal' && nx > 0 && ny > 0 && nx < L.w - 1 && ny < L.h - 1;
      if (!fantasma) {
        // diagonal bloqueada: deslizar por el eje que sí se pueda
        if (dx && dy) {
          if (MZ.passable(P.x + dx, P.y) && !MZ.enemyAt(P.x + dx, P.y) && !MZ.npcAt(P.x + dx, P.y)) return tryMove(dx, 0);
          if (MZ.passable(P.x, P.y + dy) && !MZ.enemyAt(P.x, P.y + dy) && !MZ.npcAt(P.x, P.y + dy)) return tryMove(0, dy);
        }
        return false;
      }
    }

    const old = MZ.toPx(P.x, P.y);
    MZ.fx.trail(old.x, old.y, 0x00e5ff);
    P.x = nx;
    P.y = ny;
    P.steps++;

    const it = MZ.itemAt(nx, ny);
    if (it) applyItem(it);

    if (S.playing && L.tiles[ny * L.w + nx] === T.STAIRS) {
      nextLevel();
      return true;
    }
    endTurn();
    return true;
  }

  // Dirección según dónde está el dedo respecto del jugador en pantalla.
  function dirFromTouch() {
    if (!touch || !playerSpr) return null;
    const tp = world.toLocal({ x: touch.x, y: touch.y });
    const dx = tp.x - playerSpr.x, dy = tp.y - playerSpr.y;
    if (Math.hypot(dx, dy) < TILE * 0.45) return null; // zona muerta sobre el héroe
    const oct = Math.round(Math.atan2(dy, dx) / (Math.PI / 4));
    return [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]][(oct + 8) % 8];
  }

  // Tap directo sobre un enemigo lejano = disparo (si hay arma a distancia).
  function rangedTapCheck(gx, gy) {
    if (!S.playing || S.dialogOpen || S.paused) return false;
    const P = S.player;
    if (!P.ranged) return false;
    const wp = world.toLocal({ x: gx, y: gy });
    const tx = Math.floor(wp.x / TILE), ty = Math.floor(wp.y / TILE);
    const e = MZ.enemyAt(tx, ty);
    if (!e) return false;
    const d = Math.max(Math.abs(tx - P.x), Math.abs(ty - P.y));
    if (d <= 1) return false; // pegado: lo resuelve el D-pad como melee
    if (d <= P.ranged.range && MZ.los(P.x, P.y, e.x, e.y)) {
      MZ.playerRangedAttack(e);
      endTurn();
      return true;
    }
    return false;
  }

  // ---- Flujo de run ----
  MZ.newRun = function () {
    S.runSeed = (Math.random() * 0x7fffffff) | 0;
    S.depth = 1;
    S.player = {
      x: 0, y: 0, hp: 20, maxHp: 20,
      baseAtk: 1, baseDef: 0, atk: 0, def: 0,
      melee: null, ranged: null, shield: null, poison: 0, // arrancás a piñas
      gold: 0, kills: 0, streak: 0, steps: 0,
    };
    MZ.meta.aplicar(S.player); // mejoras permanentes compradas con almas
    MZ.recalcStats();
    MZ.quests.reset();
    S.playing = true;
    S.dialogOpen = false;
    const d = MZ.save.data;
    d.runs++;
    d.run = null; // pisa cualquier partida guardada
    MZ.save.store();
    MZ.ui.hideScreens();
    buildLevel();
    MZ.showIntro();
    if (d.runs > 1 && Math.random() < 0.5) MZ.say('volver');
  };

  // Retomar la partida guardada exactamente donde quedó.
  MZ.resumeRun = function () {
    const run = MZ.save.data.run;
    if (!run) { MZ.newRun(); return; }
    S.runSeed = run.seed;
    S.depth = run.depth;
    S.player = { ...run.player };
    MZ.recalcStats();
    MZ.quests.run = JSON.parse(JSON.stringify(run.quests || {}));
    S.playing = true;
    S.dialogOpen = false;
    MZ.ui.hideScreens();
    buildLevel(run);
  };

  function nextLevel() {
    touch = null;
    MZ.audio.stairs();
    MZ.fx.flash(0.5, S.level.theme.accent);
    S.depth++;
    const d = MZ.save.data;
    if (S.depth > d.bestDepth) { d.bestDepth = S.depth; MZ.save.store(); }
    buildLevel();
    MZ.logros.check();
    if (!S.level.isBoss && Math.random() < 0.35) MZ.say('nivel', { n: S.depth });
  }

  MZ.die = function (from) {
    if (!S.playing) return;
    S.playing = false;
    touch = null;
    if (S.dialogOpen) MZ.dialog.close();
    const p = MZ.toPx(S.player.x, S.player.y);
    MZ.fx.explode(p.x, p.y, 0x00e5ff, 50, 4, 1.3);
    MZ.fx.ring(p.x, p.y, 0x00e5ff, true);
    MZ.fx.flash(0.5, 0xff0033);
    MZ.fx.shake(12);
    MZ.audio.death();
    playerSpr.visible = false;
    const d = MZ.save.data;
    d.deaths++;
    d.totalKills += S.player.kills;
    d.totalGold += S.player.gold;
    d.totalSteps += S.player.steps;
    d.bestDepth = Math.max(d.bestDepth, S.depth);
    const almas = MZ.meta.cosecha(S.depth, S.player.kills);
    d.almas = (d.almas || 0) + almas;
    d.run = null; // muerto es muerto: no hay resume
    MZ.save.store();
    MZ.logros.check();
    setTimeout(() => {
      MZ.ui.showDeath(
        MZ.quote('morir', { n: S.depth, d: d.deaths }),
        `Nivel alcanzado: ${S.depth} (récord: ${d.bestDepth})<br>` +
        `Bajas: ${S.player.kills} · Oro: ${S.player.gold} · Pasos: ${S.player.steps}` +
        (from ? `<br>Te mató: ${from}` : '') +
        `<br>👻 Cosecha: +${almas} almas (total: ${d.almas})` +
        `<br>Muertes acumuladas: ${d.deaths}`
      );
    }, 1000);
  };

  // ---- Input táctil: D-pad relativo, mantener apretado para caminar ----
  app.stage.eventMode = 'static';
  app.stage.hitArea = app.screen;
  app.stage.on('pointerdown', ev => {
    MZ.audio.ensure();
    if (S.paused) return;
    if (rangedTapCheck(ev.global.x, ev.global.y)) return;
    touch = { x: ev.global.x, y: ev.global.y };
    S.stepTimer = 999; // primer paso inmediato
  });
  app.stage.on('pointermove', ev => {
    if (touch) { touch.x = ev.global.x; touch.y = ev.global.y; }
  });
  const endTouch = () => { touch = null; };
  app.stage.on('pointerup', endTouch);
  app.stage.on('pointerupoutside', endTouch);

  // Teclado para probar en desktop (flechas/WASD + QEZC para diagonales).
  window.addEventListener('keydown', ev => {
    if (!S.playing || S.dialogOpen || S.paused) return;
    const m = {
      ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0],
      w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0],
      q: [-1, -1], e: [1, -1], z: [-1, 1], c: [1, 1],
    }[ev.key];
    if (!m) return;
    tryMove(m[0], m[1]);
  });

  // ---- Game loop ----
  const STEP_MS = 150;
  const fpsEl = document.getElementById('fps');
  let fpsT = 0;
  app.ticker.add(tk => {
    const dt = tk.deltaMS * MZ.timeScale;

    if (S.playing && !S.dialogOpen && !S.paused) {
      S.stepTimer += dt;
      if (touch && S.stepTimer >= STEP_MS) {
        S.stepTimer = 0;
        const dir = dirFromTouch();
        if (dir) tryMove(dir[0], dir[1]);
      }
      S.idleMs += tk.deltaMS;
      if (S.idleMs > 20000 && !S.idleWarned) {
        S.idleWarned = true;
        MZ.say('idle');
      }
    }

    MZ.fx.update(dt);
    MZ.easter.update(tk.deltaMS);

    // FPS (2 updates por segundo alcanzan).
    fpsT += tk.deltaMS;
    if (fpsT >= 500) {
      fpsT = 0;
      fpsEl.textContent = Math.round(app.ticker.FPS) + ' FPS';
    }

    // Lerp de sprites hacia su casilla lógica (movimiento suave).
    const k = Math.min(1, dt * 0.018);
    if (playerSpr && S.player) {
      const p = MZ.toPx(S.player.x, S.player.y);
      playerSpr.x += (p.x - playerSpr.x) * k;
      playerSpr.y += (p.y - playerSpr.y) * k;
    }
    for (const e of S.enemies) {
      if (!e.spr) continue;
      const p = MZ.toPx(e.x, e.y);
      e.spr.x += (p.x - e.spr.x) * k;
      e.spr.y += (p.y - e.spr.y) * k;
    }

    // Glow respirante.
    pulseT += dt;
    for (const g of S.glows) {
      g.spr.alpha = 0.5 + 0.25 * Math.sin(pulseT / 280 + g.phase);
    }

    // Cámara con lerp + shake.
    if (playerSpr) {
      const gx = app.screen.width / 2 - playerSpr.x;
      const gy = app.screen.height / 2 - playerSpr.y;
      const ck = Math.min(1, tk.deltaMS * 0.008);
      camX += (gx - camX) * ck;
      camY += (gy - camY) * ck;
      const sh = MZ.fx.shakeOffset();
      world.position.set(camX + sh.x, camY + sh.y);
    }
  });

  MZ.ui.showStart();
})();
