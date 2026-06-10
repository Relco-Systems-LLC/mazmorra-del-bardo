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
    mimic: { name: 'Mimic', sprite: 'mimic', color: 0xffd700, scale: 0.85, hp: 16, atk: 4, gold: 35, rare: true, minDepth: 1 },
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
    mapa: { sprite: 'mapa', color: 0xe8d8a0, scale: 0.5 },
    altar: { sprite: 'altar', color: 0x00ffc8, scale: 0.75 },
    granadaFrag: { sprite: 'granadaFrag', color: 0x3a7d44, scale: 0.5 },
    granadaMolotov: { sprite: 'granadaMolotov', color: 0xff7722, scale: 0.5 },
    granadaStun: { sprite: 'granadaStun', color: 0xffe14d, scale: 0.5 },
  };

  // ---- Lanzables (consumibles que se acumulan). Alcance máx y efecto por tipo. ----
  MZ.GRENADES = {
    frag:    { item: 'granadaFrag',    nombre: 'Granada de frag', icon: '💣', color: 0x3a7d44, range: 4, radius: 1, dmg: (d) => 8 + d },
    molotov: { item: 'granadaMolotov', nombre: 'Molotov',         icon: '🔥', color: 0xff7722, range: 3, radius: 1, fire: 3 },
    stun:    { item: 'granadaStun',    nombre: 'Aturdidora',      icon: '✨', color: 0xffe14d, range: 5, radius: 2, stun: 2, dmg: (d) => 2 + Math.floor(d / 4) },
  };
  MZ.GRENADE_KEYS = ['frag', 'molotov', 'stun'];
  // item del piso -> tipo de granada
  MZ.GRENADE_BY_ITEM = { granadaFrag: 'frag', granadaMolotov: 'molotov', granadaStun: 'stun' };

  // ---- Equipo con nombre y stats: el loot escala con la profundidad ----
  MZ.GEAR = {
    melee: [
      { name: 'Palo de amasar', atk: 1 },
      { name: 'Cuchillo de asado', atk: 1 },
      { name: 'Sartén de teflón', atk: 2 },
      { name: 'Daga ladrona', atk: 2, veneno: true },
      { name: 'Llave inglesa', atk: 3, empuje: true },
      { name: 'Mazo de feria', atk: 3, empuje: true },
      { name: 'Cadena de bici', atk: 4 },
      { name: 'Machete tucumano', atk: 4 },
      { name: 'Caño de escape', atk: 5, empuje: true },
      { name: 'Hacha criolla', atk: 5, empuje: true },
      { name: 'Sable corvo', atk: 6, veneno: true },
      { name: 'Espada del Bardo', atk: 6 },
      { name: 'Katana trucha', atk: 7 },
      { name: 'Facón del Más Allá', atk: 8, veneno: true },
      { name: 'Espadón del Gremio', atk: 9, empuje: true },
    ],
    ranged: [
      { name: 'Gomera de barrio', atk: 1, range: 3 },
      { name: 'Honda de cuero', atk: 2, range: 3 },
      { name: 'Arco corto', atk: 2, range: 4 },
      { name: 'Pistola de clavos', atk: 3, range: 4, rapido: true },
      { name: 'Ballesta abandonada', atk: 3, range: 5 },
      { name: 'Ametralladora oxidada', atk: 2, range: 5, rapido: true },
      { name: 'Arco compuesto', atk: 4, range: 5 },
      { name: 'Rifle de feria', atk: 4, range: 6 },
      { name: 'Arco del Coliseo', atk: 5, range: 6 },
      { name: 'Ametralladora del Gremio', atk: 3, range: 6, rapido: true },
    ],
    shield: [
      { name: 'Tapa de olla', def: 1 },
      { name: 'Bandeja de aluminio', def: 1 },
      { name: 'Escudo abollado', def: 2 },
      { name: 'Cartel de chapa', def: 2 },
      { name: 'Puerta de heladera', def: 3 },
      { name: 'Escudo del Gremio', def: 4 },
    ],
  };

  // Armas locas: mecánicas únicas, ~12% de los drops de arma.
  const LOCAS = {
    melee: [
      { name: 'Termo del Abuelo', atk: 3, curaAlRomper: true },
      { name: 'Puñal Tramposo', atk: 2, traicionero: true },
      { name: 'Bate con clavos', atk: 4, empuje: true },
      { name: 'Cuchilla envenenada', atk: 3, veneno: true },
    ],
    ranged: [
      { name: 'Gomera de Baterías', atk: 3, range: 4, rebote: true },
      { name: 'Micrófono del Bardo', atk: 2, range: 3, grito: true },
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
