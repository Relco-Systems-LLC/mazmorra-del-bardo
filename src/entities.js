// Enemigos, jefes, ítems y generación de equipo (armas melee/distancia, escudos).
window.MZ = window.MZ || {};
(() => {
  MZ.ENEMY_DEFS = {
    rata: { name: 'Rata', sprite: 'rata', color: 0xff5577, scale: 0.6, hp: 4, atk: 2, gold: 2, minDepth: 1 },
    slime: { name: 'Slime', sprite: 'slime', color: 0x66ff99, scale: 0.85, hp: 8, atk: 2, gold: 3, slow: true, minDepth: 1 },
    vibora: { name: 'Víbora', sprite: 'vibora', color: 0x2ecc40, scale: 0.75, hp: 6, atk: 2, gold: 4, poison: 3, minDepth: 2 },
    esqueleto: { name: 'Esqueleto', sprite: 'esqueleto', color: 0xe8e8ff, scale: 0.85, hp: 9, atk: 3, gold: 4, minDepth: 3 },
    fantasma: { name: 'Fantasma', sprite: 'fantasma', color: 0xa0c4ff, scale: 0.8, ghost: true, hp: 7, atk: 3, gold: 5, minDepth: 5 },
    arquero: { name: 'Arquero Maldito', sprite: 'arquero', color: 0xccffaa, scale: 0.85, ranged: 5, hp: 8, atk: 3, gold: 6, minDepth: 6 },
    ojo: { name: 'Ojo Maldito', sprite: 'ojo', color: 0xffa500, scale: 0.7, ranged: 4, hp: 8, atk: 3, gold: 6, minDepth: 8 },
    golem: { name: 'Gólem de Utilería', sprite: 'golem', color: 0x8d99ae, scale: 1.1, hp: 22, atk: 5, gold: 12, slow: true, minDepth: 12 },
    vampiro: { name: 'Vampiro de Palco', sprite: 'vampiro', color: 0xff2222, scale: 0.9, hp: 14, atk: 4, gold: 14, vampiro: true, minDepth: 16 },
    payaso: { name: 'Payaso del Entreacto', sprite: 'payaso', color: 0xff2244, scale: 0.9, hp: 12, atk: 4, gold: 16, ranged: 4, poison: 2, minDepth: 20 },
    rataBlanca: { name: 'La Rata Blanca', sprite: 'rataBlanca', color: 0xffffff, scale: 0.7, hp: 10, atk: 2, gold: 60, rataBlanca: true, rare: true, minDepth: 1 },
    pombero: { name: 'El Pombero', sprite: 'pombero', color: 0x00ff88, scale: 0.85, pombero: true, hp: 14, atk: 1, gold: 0, rare: true, minDepth: 1 },
    boss: { name: 'Jefe', sprite: 'jefe', color: 0xff2266, scale: 1.6, hp: 28, atk: 4, gold: 20, boss: true, rare: true, minDepth: 1 },
    barril: { name: 'Barril explosivo', sprite: 'barril', color: 0xffa500, scale: 0.8, hp: 3, atk: 0, gold: 0, static: true, explode: true, rare: true, minDepth: 1 },
  };

  MZ.BOSS_NAMES = ['El Encargado', 'La Jefa del Subsuelo', 'El Chamuyero', 'Doña Penumbra', 'El Recaudador'];

  MZ.makeEnemy = function (type, x, y, depth) {
    const def = MZ.ENEMY_DEFS[type];
    const hpK = 1 + (depth - 1) * 0.12;
    const atkK = 1 + (depth - 1) * 0.09;
    const e = {
      type, def, x, y,
      hp: Math.round(def.hp * hpK),
      maxHp: Math.round(def.hp * hpK),
      atk: Math.max(1, Math.round(def.atk * atkK)),
      dead: false, awake: false, poison: 0,
    };
    if (def.boss) {
      e.boss = true;
      e.name = MZ.BOSS_NAMES[Math.floor(depth / 5 - 1) % MZ.BOSS_NAMES.length];
      e.hp = e.maxHp = Math.round(28 * (1 + depth * 0.1));
      e.atk = 4 + Math.floor(depth * 0.3);
    }
    return e;
  };

  MZ.ITEM_DEFS = {
    gold: { sprite: 'moneda', color: 0xffd700, scale: 0.45 },
    potion: { sprite: 'pocion', color: 0xff66ff, scale: 0.5 },
    weapon: { sprite: 'espada', color: 0x66ddff, scale: 0.55 },
    bow: { sprite: 'arco', color: 0xffaa66, scale: 0.55 },
    bfg: { sprite: 'bfg', color: 0x33ff66, scale: 0.6 },
    armor: { sprite: 'escudo', color: 0x9d6bff, scale: 0.5 },
    mate: { sprite: 'mate', color: 0x88ff66, scale: 0.5 },
    mateLegendario: { sprite: 'mateOro', color: 0x00ffc8, scale: 0.6 },
    chest: { sprite: 'cofre', color: 0xffd700, scale: 0.65 },
    anillo: { sprite: 'anillo', color: 0x00e5ff, scale: 0.5 },
    pinchos: { sprite: 'pinchos', color: 0x607d8b, scale: 0.7 },
    heart: { sprite: 'corazon', color: 0xff3355, scale: 0.45 },
    tequila: { sprite: 'tequila', color: 0xffe680, scale: 0.5 },
    altar: { sprite: 'altar', color: 0x00ffc8, scale: 0.75 },
  };

  // ---- Equipo con nombre y stats: el loot escala con la profundidad ----
  MZ.GEAR = {
    melee: [
      { name: 'Cuchillo de asado', atk: 1 },
      { name: 'Daga ladrona', atk: 2, veneno: true },
      { name: 'Mazo de feria', atk: 3, empuje: true },
      { name: 'Machete tucumano', atk: 4 },
      { name: 'Hacha criolla', atk: 5, empuje: true },
      { name: 'Espada del Bardo', atk: 6 },
      { name: 'Facón del Más Allá', atk: 8, veneno: true },
    ],
    ranged: [
      { name: 'Gomera de barrio', atk: 1, range: 3 },
      { name: 'Arco corto', atk: 2, range: 4 },
      { name: 'Ballesta abandonada', atk: 3, range: 5 },
      { name: 'Arco del Coliseo', atk: 5, range: 6 },
    ],
    shield: [
      { name: 'Tapa de olla', def: 1 },
      { name: 'Escudo abollado', def: 2 },
      { name: 'Puerta de heladera', def: 3 },
      { name: 'Escudo del Gremio', def: 4 },
    ],
  };

  MZ.genGear = function (kind, depth) {
    const pool = MZ.GEAR[kind];
    let tier = Math.floor(depth / 5) + (Math.random() < 0.3 ? 1 : 0) - (Math.random() < 0.3 ? 1 : 0);
    tier = Math.max(0, Math.min(pool.length - 1, tier));
    const base = pool[tier];
    const bonus = Math.floor(depth / 7);
    const g = { kind, ...base };
    if (g.atk != null) g.atk += bonus;
    if (g.def != null) g.def += Math.floor(bonus / 2);
    if (bonus > 0) g.name += ' +' + bonus;
    // economía descartable: filo limitado y munición corta para recambio rápido
    if (kind === 'melee') g.uses = 12 + tier * 3 + Math.floor(Math.random() * 6);
    if (kind === 'ranged') g.ammo = 4 + Math.floor(tier / 2) + Math.floor(Math.random() * 3);
    return g;
  };

  // La Bestia 9000: una bala, una habitación menos.
  MZ.genBFG = function (depth) {
    return {
      kind: 'ranged', name: 'La Bestia 9000', aoe: true,
      atk: 30 + depth * 2, range: 7, ammo: 1,
    };
  };

  // Recalcula stats efectivos del jugador a partir de base + equipo.
  MZ.recalcStats = function () {
    const P = MZ.state.player;
    P.atk = P.baseAtk + (P.melee ? P.melee.atk : 0);
    P.def = P.baseDef + (P.shield ? P.shield.def : 0);
  };
})();
