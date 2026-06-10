// Generación procedural: salas + corredores + random walk, seedeado por profundidad.
window.MZ = window.MZ || {};
(() => {
  MZ.T = { WALL: 0, FLOOR: 1, CRACK: 2, STAIRS: 3 };
  const T = MZ.T;

  // Paleta neón que rota cada 5 niveles, para que bajar se sienta fresco.
  MZ.THEMES = [
    { wall: 0x00e5ff, floor: 0x0a2e33, accent: 0x00ffc8, name: 'cian' },
    { wall: 0xb14cff, floor: 0x221038, accent: 0xff4cf0, name: 'violeta' },
    { wall: 0xff3355, floor: 0x330a14, accent: 0xff9933, name: 'rojo' },
    { wall: 0x7fff00, floor: 0x132c0a, accent: 0xc8ff00, name: 'ácido' },
    { wall: 0xffc400, floor: 0x332305, accent: 0xffea00, name: 'dorado' },
  ];

  MZ.themeFor = function (depth) {
    if (depth === 42) return { wall: 0xffd700, floor: 0x33290a, accent: 0xffffff, name: '42' };
    // niveles de jefe: infierno Doom (rojo sangre, piso negro-rojizo, fuego)
    if (depth % 5 === 0) return { wall: 0xff1a1a, floor: 0x1a0505, accent: 0xff7700, name: 'infierno', hell: true };
    return MZ.THEMES[Math.floor((depth - 1) / 5) % MZ.THEMES.length];
  };

  MZ.genLevel = function (runSeed, depth) {
    const rng = MZ.makeRng(MZ.hash2(runSeed, depth));
    const W = 26, H = 26;
    const tiles = new Array(W * H).fill(T.WALL);
    const idx = (x, y) => y * W + x;
    const inB = (x, y) => x >= 1 && y >= 1 && x < W - 1 && y < H - 1;

    function carve(x, y) { if (inB(x, y)) tiles[idx(x, y)] = T.FLOOR; }
    function carveRect(x, y, w, h) {
      for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) carve(i, j);
    }
    function corridor(a, b) {
      let { x, y } = a;
      const horizFirst = rng.chance(0.5);
      const moveX = () => { while (x !== b.x) { x += Math.sign(b.x - x); carve(x, y); } };
      const moveY = () => { while (y !== b.y) { y += Math.sign(b.y - y); carve(x, y); } };
      if (horizFirst) { moveX(); moveY(); } else { moveY(); moveX(); }
    }

    const isBoss = depth % 5 === 0;
    const rooms = [];

    if (isBoss) {
      // Arena grande arriba + sala de entrada abajo.
      const arena = { x: rng.int(6, 9), y: rng.int(4, 6), w: 12, h: 10 };
      const entry = { x: rng.int(4, 16), y: rng.int(19, 21), w: 5, h: 4 };
      rooms.push(entry, arena);
      carveRect(arena.x, arena.y, arena.w, arena.h);
      carveRect(entry.x, entry.y, entry.w, entry.h);
      corridor(center(entry), center(arena));
    } else {
      const want = rng.int(5, 8);
      for (let t = 0; t < 70 && rooms.length < want; t++) {
        const w = rng.int(3, 7), h = rng.int(3, 7);
        const x = rng.int(1, W - w - 2), y = rng.int(1, H - h - 2);
        const r = { x, y, w, h };
        if (rooms.some(o => x < o.x + o.w + 1 && o.x < x + w + 1 && y < o.y + o.h + 1 && o.y < y + h + 1)) continue;
        rooms.push(r);
        carveRect(x, y, w, h);
      }
      for (let i = 1; i < rooms.length; i++) corridor(center(rooms[i - 1]), center(rooms[i]));
      if (rooms.length > 3) corridor(center(rng.pick(rooms)), center(rng.pick(rooms)));
      // Random walkers para que no quede todo rectangular.
      for (let k = 0; k < 2; k++) {
        let { x, y } = center(rng.pick(rooms));
        for (let s = 0; s < 50; s++) {
          const d = rng.pick([[1, 0], [-1, 0], [0, 1], [0, -1]]);
          x = Math.max(1, Math.min(W - 2, x + d[0]));
          y = Math.max(1, Math.min(H - 2, y + d[1]));
          carve(x, y);
        }
      }
    }

    function center(r) { return { x: Math.floor(r.x + r.w / 2), y: Math.floor(r.y + r.h / 2) }; }

    const entrance = center(rooms[0]);
    tiles[idx(entrance.x, entrance.y)] = T.FLOOR;

    // BFS desde la entrada: distancias para ubicar escalera (lo más lejos) y spawns.
    const dist = new Int32Array(W * H).fill(-1);
    const q = [idx(entrance.x, entrance.y)];
    dist[q[0]] = 0;
    let qi = 0;
    while (qi < q.length) {
      const c = q[qi++], cx = c % W, cy = (c / W) | 0;
      for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = cx + ox, ny = cy + oy, n = idx(nx, ny);
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        if (tiles[n] !== T.FLOOR || dist[n] !== -1) continue;
        dist[n] = dist[c] + 1;
        q.push(n);
      }
    }

    let stairsI = q[q.length - 1];
    if (isBoss) {
      // En niveles de jefe, la escalera queda en el fondo de la arena.
      const arena = rooms[1];
      stairsI = idx(Math.floor(arena.x + arena.w / 2), arena.y + 1);
      if (dist[stairsI] === -1) stairsI = q[q.length - 1];
    }
    tiles[stairsI] = T.STAIRS;
    const stairs = { x: stairsI % W, y: (stairsI / W) | 0 };

    // Sala secreta: pared con grieta que esconde un 3x3 con tesoro.
    let secret = null;
    if (!isBoss && rng.chance(0.07)) {
      outer:
      for (let t = 0; t < 200; t++) {
        const x = rng.int(2, W - 3), y = rng.int(2, H - 3);
        if (tiles[idx(x, y)] !== T.WALL) continue;
        for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          if (dist[idx(x - ox, y - oy)] >= 0) { // hay piso del lado opuesto a donde excavamos
            const rx = x + ox * 2, ry = y + oy * 2;
            if (rx < 2 || ry < 2 || rx > W - 3 || ry > H - 3) continue;
            let clear = true;
            for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
              if (tiles[idx(rx + i, ry + j)] !== T.WALL) clear = false;
            }
            if (!clear) continue;
            for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) tiles[idx(rx + i, ry + j)] = T.FLOOR;
            tiles[idx(x, y)] = T.CRACK;
            secret = { crack: { x, y }, room: { x: rx, y: ry } };
            break outer;
          }
        }
      }
    }

    // Celdas candidatas para spawns (lejos de la entrada, no escalera).
    const cells = [];
    for (let i = 0; i < W * H; i++) {
      if (tiles[i] === T.FLOOR && dist[i] >= 6) cells.push({ x: i % W, y: (i / W) | 0 });
    }
    const used = new Set([idx(entrance.x, entrance.y), stairsI]);
    function takeCell() {
      for (let t = 0; t < 50; t++) {
        const c = rng.pick(cells);
        if (!c) return null;
        const i = idx(c.x, c.y);
        if (!used.has(i)) { used.add(i); return c; }
      }
      return null;
    }

    // Enemigos: escalan en cantidad y aparecen tipos nuevos al bajar.
    const enemies = [];
    const avail = Object.keys(MZ.ENEMY_DEFS).filter(k => {
      const d = MZ.ENEMY_DEFS[k];
      return !d.rare && d.minDepth <= depth;
    });
    const count = isBoss ? rng.int(2, 3) : Math.min(4 + Math.floor(depth * 0.7), 14);
    for (let i = 0; i < count; i++) {
      const c = takeCell();
      if (!c) break;
      enemies.push({ type: rng.pick(avail), x: c.x, y: c.y });
    }
    if (isBoss) {
      const arena = rooms[1], ac = center(arena);
      enemies.push({ type: 'boss', x: ac.x, y: ac.y });
    }
    if (!isBoss && rng.chance(0.01)) { // El Pombero. Existe. Te lo juro.
      const c = takeCell();
      if (c) enemies.push({ type: 'pombero', x: c.x, y: c.y });
    }
    if (!isBoss && rng.chance(0.015)) { // La Rata Blanca: la leyenda continúa
      const c = takeCell();
      if (c) enemies.push({ type: 'rataBlanca', x: c.x, y: c.y });
    }

    // Ítems.
    const items = [];
    function drop(type, amount) {
      const c = takeCell();
      if (c) items.push({ type, x: c.x, y: c.y, amount: amount || 0 });
    }
    const goldPiles = (depth === 42 ? 8 : rng.int(3, 6));
    for (let i = 0; i < goldPiles; i++) drop('gold', rng.int(4, 9) + depth);
    // peligro y bonus
    const nPinchos = rng.int(2, 5);
    for (let i = 0; i < nPinchos; i++) drop('pinchos');
    if (rng.chance(0.35)) drop('altar');
    const nBarril = rng.int(1, 3);
    for (let i = 0; i < nBarril; i++) {
      const c = takeCell();
      if (c) enemies.push({ type: 'barril', x: c.x, y: c.y });
    }
    if (rng.chance(0.7)) drop('potion');
    // armas seguido: el filo se gasta y la munición es corta, hay que reponer
    if (rng.chance(0.6)) drop('weapon');
    if (rng.chance(0.35)) drop('weapon');
    if (depth >= 2 && rng.chance(0.45)) drop('bow');
    if (depth % 4 === 0 && rng.chance(0.6)) drop('armor');
    if (depth === 42) { drop('weapon'); drop('armor'); }
    if (rng.chance(0.08)) drop('mate');
    if (rng.chance(0.1)) drop('tequila');
    if (rng.chance(0.012)) drop('mateLegendario');
    if (secret) items.push({ type: 'chest', x: secret.room.x, y: secret.room.y, amount: 40 + depth * 3 });

    return {
      w: W, h: H, tiles, entrance, stairs, enemies, items,
      theme: MZ.themeFor(depth), depth, isBoss, secret,
    };
  };
})();
