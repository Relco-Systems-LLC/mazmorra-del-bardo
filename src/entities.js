// Enemigos, jefes, ítems y generación de equipo (armas melee/distancia, escudos).
window.MZ = window.MZ || {};
(() => {
  MZ.ENEMY_DEFS = {
    rata: { name: 'Rata de Camarín', sprite: 'rata', color: 0xff5577, scale: 0.6, hp: 4, atk: 2, gold: 2, minDepth: 1 },
    mosquito: { name: 'Mosquito de Pattaya', sprite: 'mosquito', color: 0xcc2222, scale: 0.55, hp: 3, atk: 2, gold: 2, minDepth: 1 },
    slime: { name: 'Pad Thai Maldito', sprite: 'slime', color: 0x66ff99, scale: 0.85, hp: 8, atk: 2, gold: 3, slow: true, minDepth: 1 },
    vibora: { name: 'Cobra del Templo', sprite: 'vibora', color: 0x2ecc40, scale: 0.75, hp: 6, atk: 2, gold: 4, poison: 3, minDepth: 2 },
    esqueleto: { name: 'Zombie de la Fila', sprite: 'esqueleto', color: 0x9ad89a, scale: 0.85, hp: 9, atk: 3, gold: 4, minDepth: 3 },
    fantasma: { name: 'Groupie Fantasma', sprite: 'fantasma', color: 0xffb8d4, scale: 0.8, ghost: true, hp: 7, atk: 3, gold: 5, minDepth: 5 },
    arquero: { name: 'El Plomo Renegado', sprite: 'arquero', color: 0x8a8a96, scale: 0.85, ranged: 5, hp: 8, atk: 3, gold: 6, minDepth: 6 },
    ojo: { name: 'El Ojo del Paparazzi', sprite: 'ojo', color: 0x4488ff, scale: 0.7, ranged: 4, hp: 8, atk: 3, gold: 6, minDepth: 8 },
    golem: { name: 'Gólem de Parlantes', sprite: 'golem', color: 0x8a96a4, scale: 1.1, hp: 22, atk: 5, gold: 12, slow: true, minDepth: 12 },
    vampiro: { name: 'Vampiro del Merch', sprite: 'vampiro', color: 0xff2222, scale: 0.9, hp: 14, atk: 4, gold: 14, vampiro: true, minDepth: 16 },
    payaso: { name: 'El Payaso del Parque', sprite: 'payaso', color: 0xff2244, scale: 0.9, hp: 12, atk: 4, gold: 16, ranged: 4, poison: 2, minDepth: 20 },
    rataBlanca: { name: 'La Rata Blanca', sprite: 'rataBlanca', color: 0xffffff, scale: 0.7, hp: 10, atk: 2, gold: 60, rataBlanca: true, rare: true, minDepth: 1 },
    pombero: { name: 'El Pombero', sprite: 'pombero', color: 0x00ff88, scale: 0.85, pombero: true, hp: 14, atk: 1, gold: 0, rare: true, minDepth: 1 },
    boss: { name: 'Jefe', sprite: 'jefe', color: 0xff2266, scale: 1.6, hp: 28, atk: 4, gold: 20, boss: true, rare: true, minDepth: 1 },
    barril: { name: 'Barril de Pirotecnia', sprite: 'barril', color: 0xffa500, scale: 0.8, hp: 3, atk: 0, gold: 0, static: true, explode: true, rare: true, minDepth: 1 },
    mimic: { name: 'Flight Case Mordedor', sprite: 'mimic', color: 0xb8c4d0, scale: 0.85, hp: 16, atk: 4, gold: 35, rare: true, minDepth: 1 },
  };

  // 10 jefes, uno por arena (depth/5-1): la gira maldita completa.
  MZ.BOSS_NAMES = [
    'El Patovica',                 // 5
    'El DJ Vendido',               // 10
    'El Tuk-Tukero Fantasma',      // 15
    'La Madama de Walking Street', // 20
    'El Salvavidas',               // 25
    'El Ratón Trucho',             // 30
    'El Sheriff del BBQ',          // 35
    'El Toro Mecánico',            // 40
    'El Mayordomo',                // 45
    'La Cancelación',              // 50
  ];

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
    potion: { sprite: 'pocion', color: 0x44cc44, scale: 0.5 },
    weapon: { sprite: 'espada', color: 0x66ddff, scale: 0.55 },
    bow: { sprite: 'arco', color: 0xffaa66, scale: 0.55 },
    bfg: { sprite: 'bfg', color: 0x33ff66, scale: 0.6 },
    armor: { sprite: 'escudo', color: 0x9d6bff, scale: 0.5 },
    mate: { sprite: 'mate', color: 0x88ff66, scale: 0.5 },
    mateLegendario: { sprite: 'mateOro', color: 0x00ffc8, scale: 0.6 },
    chest: { sprite: 'cofre', color: 0xb8c4d0, scale: 0.65 },
    anillo: { sprite: 'anillo', color: 0x00e5ff, scale: 0.5 },
    pinchos: { sprite: 'pinchos', color: 0x607d8b, scale: 0.7 },
    heart: { sprite: 'corazon', color: 0xff3355, scale: 0.45 },
    tequila: { sprite: 'tequila', color: 0xffe680, scale: 0.5 },
    mapa: { sprite: 'mapa', color: 0xe8d8a0, scale: 0.5 },
    altar: { sprite: 'altar', color: 0xe8d8a0, scale: 0.75 },
    vidaExtra: { sprite: 'vidaExtra', color: 0xffd700, scale: 0.5 },
    altarVida: { sprite: 'altarVida', color: 0xff3355, scale: 0.8 },
    granadaFrag: { sprite: 'granadaFrag', color: 0x3a7d44, scale: 0.5 },
    granadaMolotov: { sprite: 'granadaMolotov', color: 0xff7722, scale: 0.5 },
    granadaStun: { sprite: 'granadaStun', color: 0xffe14d, scale: 0.5 },
  };

  // ---- Lanzables (consumibles que se acumulan). Alcance máx y efecto por tipo. ----
  MZ.GRENADES = {
    frag:    { item: 'granadaFrag',    nombre: 'Granada del Buhonero', icon: '💣', color: 0x3a7d44, range: 4, radius: 1, dmg: (d) => 8 + d },
    molotov: { item: 'granadaMolotov', nombre: 'Bucket Flameado',      icon: '🔥', color: 0xff7722, range: 3, radius: 1, fire: 3 },
    stun:    { item: 'granadaStun',    nombre: 'Flash de Paparazzi',   icon: '✨', color: 0xffe14d, range: 5, radius: 2, stun: 2, dmg: (d) => 2 + Math.floor(d / 4) },
  };
  MZ.GRENADE_KEYS = ['frag', 'molotov', 'stun'];
  // item del piso -> tipo de granada
  MZ.GRENADE_BY_ITEM = { granadaFrag: 'frag', granadaMolotov: 'molotov', granadaStun: 'stun' };

  // Tope de lanzables en mano (entre TODOS los tipos). Lo que sobra no se junta.
  MZ.GRENADE_MAX = 2;
  MZ.grenadeCount = function (P) {
    return MZ.GRENADE_KEYS.reduce((a, k) => a + ((P.granadas && P.granadas[k]) || 0), 0);
  };
  // Suma respetando el tope; devuelve cuántas entraron de verdad.
  MZ.addGrenade = function (P, type, n) {
    const free = MZ.GRENADE_MAX - MZ.grenadeCount(P);
    const add = Math.max(0, Math.min(n, free));
    P.granadas[type] = (P.granadas[type] || 0) + add;
    return add;
  };

  // ---- Equipo con nombre y stats: el loot escala con la profundidad ----
  MZ.GEAR = {
    melee: [
      { name: 'Zapatilla revoleada', atk: 1 },
      { name: 'Pie de micrófono', atk: 1 },
      { name: 'Sartén del wok', atk: 2 },
      { name: 'Púa afilada', atk: 2, veneno: true },
      { name: 'Caño del escenario', atk: 3, empuje: true },
      { name: 'Bate de Dallas', atk: 3, empuje: true },
      { name: 'Cadena del candado de gira', atk: 4 },
      { name: 'Machete del jardinero', atk: 4 },
      { name: 'Remo de long-tail', atk: 5, empuje: true },
      { name: 'Hacha de bombero del hotel', atk: 5, empuje: true },
      { name: 'Navaja mariposa de Bangkok', atk: 6, veneno: true },
      { name: 'Guitarra Hacha', atk: 6 },
      { name: 'Katana trucha del mercado', atk: 7 },
      { name: 'Facón del Más Allá', atk: 8, veneno: true },
      { name: 'Espadón del Gremio', atk: 9, empuje: true },
    ],
    ranged: [
      { name: 'Gomera de barrio', atk: 1, range: 3 },
      { name: 'Lanzapúas', atk: 2, range: 3 },
      { name: 'Cerbatana del templo', atk: 2, range: 4 },
      { name: 'Pistola de agua del parque', atk: 3, range: 4, rapido: true },
      { name: 'Ballesta del rodeo', atk: 3, range: 5 },
      { name: 'Cañón de papelitos', atk: 2, range: 5, rapido: true },
      { name: 'Arco del muelle', atk: 4, range: 5 },
      { name: 'Rifle de feria', atk: 4, range: 6 },
      { name: 'Escopeta del rancho', atk: 5, range: 6 },
      { name: 'Ametralladora del Gremio', atk: 3, range: 6, rapido: true },
    ],
    shield: [
      { name: 'Tapa de wok', def: 1 },
      { name: 'Funda de guitarra', def: 1 },
      { name: 'Tabla de surf', def: 2 },
      { name: 'Valla del escenario', def: 2 },
      { name: 'Puerta de la mansión', def: 3 },
      { name: 'Escudo del Patovica', def: 4 },
    ],
  };

  // Armas locas: mecánicas únicas, ~12% de los drops de arma.
  const LOCAS = {
    melee: [
      { name: 'Termo del Abuelo', atk: 3, curaAlRomper: true },
      { name: 'Púa Traicionera', atk: 2, traicionero: true },
      { name: 'Bate con clavos', atk: 4, empuje: true },
      { name: 'Cuchilla con wasabi', atk: 3, veneno: true },
    ],
    ranged: [
      { name: 'Gomera de Baterías', atk: 3, range: 4, rebote: true },
      { name: 'Micrófono del Cantante', atk: 2, range: 3, grito: true },
      { name: 'Escopeta recortada', atk: 5, range: 3, rapido: true },
    ],
  };

  MZ.genGear = function (kind, depth) {
    if (LOCAS[kind] && Math.random() < 0.12) {
      const base = LOCAS[kind][Math.floor(Math.random() * LOCAS[kind].length)];
      const g = { kind, ...base };
      const bonus = Math.floor(depth / 7);
      if (bonus > 0) { g.atk += bonus; g.name += ' +' + bonus; }
      if (kind === 'melee') g.uses = 18 + Math.floor(Math.random() * 8);
      if (kind === 'ranged') g.ammo = g.grito ? 4 : 7 + Math.floor(Math.random() * 4);
      return g;
    }
    const pool = MZ.GEAR[kind];
    // tier escala con la profundidad (depth/4) para que las armas buenas se alcancen
    let tier = Math.floor(depth / 4) + (Math.random() < 0.35 ? 1 : 0) - (Math.random() < 0.25 ? 1 : 0);
    tier = Math.max(0, Math.min(pool.length - 1, tier));
    const base = pool[tier];
    const bonus = Math.floor(depth / 7);
    const g = { kind, ...base };
    if (g.atk != null) g.atk += bonus;
    if (g.def != null) g.def += Math.floor(bonus / 2);
    if (bonus > 0) g.name += ' +' + bonus;
    // economía descartable, pero con filo/munición generosos para no quedar a piñas
    if (kind === 'melee') g.uses = 22 + tier * 3 + Math.floor(Math.random() * 10);
    if (kind === 'ranged') g.ammo = g.rapido ? 30 + tier * 4 + Math.floor(Math.random() * 12) // ametralladora: ráfaga, mucha bala
      : 8 + tier + Math.floor(Math.random() * 5);
    return g;
  };

  // El Lanzacohetes del Buhonero: un tiro, cero bises.
  MZ.genBFG = function (depth) {
    return {
      kind: 'ranged', name: 'El Lanzacohetes del Buhonero', aoe: true,
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
