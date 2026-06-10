// Resolución de combate (melee, distancia, veneno, explosiones) + IA enemiga.
// Adyacencia y movimiento en 8 direcciones (diagonales incluidas).
window.MZ = window.MZ || {};
(() => {
  const cheb = (a, b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));

  function hitEnemy(e, dmg, crit) {
    e.hp -= dmg;
    e.awake = true;
    const p = MZ.toPx(e.x, e.y);
    MZ.fx.floatText(p.x, p.y - 10, String(dmg), crit ? 0xffe066 : 0xffffff, crit ? 20 : 14);
    MZ.fx.explode(p.x, p.y, e.def.color, crit ? 14 : 6, crit ? 3 : 1.8, 0.6);
    if (crit) {
      MZ.audio.crit();
      MZ.fx.shake(5);
      MZ.fx.slowmo(140);
      if (Math.random() < 0.4) MZ.say('critico');
    } else {
      MZ.audio.hit();
    }
    if (e.hp <= 0) MZ.killEnemy(e);
  }

  // Empuja una casilla en la dirección opuesta a (fromX, fromY). true si se movió.
  function pushAway(t, fromX, fromY) {
    const dx = Math.sign(t.x - fromX), dy = Math.sign(t.y - fromY);
    if (!dx && !dy) return false;
    const nx = t.x + dx, ny = t.y + dy;
    if (!MZ.passable(nx, ny) || MZ.enemyAt(nx, ny) || MZ.npcAt(nx, ny)) return false;
    const P = MZ.state.player;
    if (t !== P && P.x === nx && P.y === ny) return false;
    t.x = nx; t.y = ny;
    return true;
  }

  MZ.playerAttack = function (e) {
    const P = MZ.state.player;
    const crit = Math.random() < 0.12;
    let dmg = P.atk + (Math.random() < 0.5 ? 0 : 1);
    if (P.efecto === 'berserk') dmg *= 2;
    // Puñal Tramposo: x4 por la espalda, pero a veces te corta a vos
    if (P.melee && P.melee.traicionero) {
      if (!e.awake) dmg *= 4;
      if (Math.random() < 0.1) {
        MZ.hurtPlayer(2, 'tu propio Puñal Tramposo', 'vos mismo');
        if (P.hp <= 0) return;
      }
    }
    if (crit) dmg *= 2;
    // arma con veneno: la víctima se pudre de a poco
    if (P.melee && P.melee.veneno && !e.dead && Math.random() < 0.6) {
      e.poison = Math.max(e.poison, 3);
      const p = MZ.toPx(e.x, e.y);
      MZ.fx.floatText(p.x, p.y - 22, '☠', 0x66ff44, 13);
    }
    const knock = crit || (P.melee && P.melee.empuje);
    hitEnemy(e, dmg, crit);
    // knockback: críticos y armas con empuje mueven al enemigo de casillero
    if (knock && !e.dead && !e.def.static && pushAway(e, P.x, P.y)) {
      const p2 = MZ.toPx(e.x, e.y);
      MZ.fx.trail(p2.x, p2.y, e.def.color);
    }
    // el filo se gasta: arma rota = de vuelta a las piñas
    if (P.melee && P.melee.uses != null) {
      P.melee.uses--;
      if (P.melee.uses <= 0) {
        if (P.melee.curaAlRomper) {
          // Termo del Abuelo: su último servicio es cebarte uno sagrado
          P.hp = P.maxHp;
          P.poison = 0;
          MZ.say('termoRoto', null, 3500);
          MZ.audio.mate();
          MZ.fx.flash(0.25, 0x88ff66);
        } else {
          MZ.say('armaRota', { w: P.melee.name });
          MZ.audio.hurt();
        }
        P.melee = null;
        MZ.recalcStats();
      }
      MZ.ui.updateHUD();
    }
  };

  // Micrófono del Bardo: grito AoE que empuja todo lejos del blanco.
  function gritar(target) {
    const S = MZ.state, P = S.player, w = P.ranged;
    const cx = target.x, cy = target.y;
    const cp = MZ.toPx(cx, cy);
    MZ.fx.ring(cp.x, cp.y, 0xff4cf0, true);
    MZ.fx.shake(8);
    MZ.audio.crit();
    for (const o of [...S.enemies]) {
      if (o.dead) continue;
      if (Math.max(Math.abs(o.x - cx), Math.abs(o.y - cy)) > 2) continue;
      o.awake = true;
      o.hp -= w.atk;
      const op = MZ.toPx(o.x, o.y);
      MZ.fx.floatText(op.x, op.y - 10, String(w.atk), 0xff4cf0, 13);
      if (o.hp <= 0) { MZ.killEnemy(o); continue; }
      if (!o.def.static) {
        const from = (o.x === cx && o.y === cy) ? P : { x: cx, y: cy };
        pushAway(o, from.x, from.y);
        pushAway(o, from.x, from.y);
      }
    }
  }

  // La Bestia 9000: revienta todo enemigo a la vista en un radio enorme.
  function fireBFG(target) {
    const S = MZ.state, P = S.player, w = P.ranged;
    const pp = MZ.toPx(P.x, P.y);
    MZ.fx.flash(0.6, 0x33ff66);
    MZ.fx.shake(16);
    MZ.fx.slowmo(400);
    MZ.audio.boss();
    MZ.fx.ring(pp.x, pp.y, 0x33ff66, true);
    for (const e of [...S.enemies]) {
      if (e.dead) continue;
      const d = Math.max(Math.abs(e.x - P.x), Math.abs(e.y - P.y));
      if (d > w.range || !MZ.los(P.x, P.y, e.x, e.y)) continue;
      MZ.fx.bolt(pp, MZ.toPx(e.x, e.y), 0x33ff66);
      const ep = MZ.toPx(e.x, e.y);
      MZ.fx.explode(ep.x, ep.y, 0x33ff66, 26, 4, 1.1);
      e.hp -= w.atk;
      e.awake = true;
      MZ.fx.floatText(ep.x, ep.y - 10, String(w.atk), 0x33ff66, 18);
      if (e.hp <= 0) MZ.killEnemy(e);
    }
    MZ.say('bfgDisparo', null, 3500);
  }

  const cheb2 = (ax, ay, bx, by) => Math.max(Math.abs(ax - bx), Math.abs(ay - by));

  // Lanzar una granada a la casilla (tx,ty). Devuelve true si se lanzó.
  MZ.throwGrenade = function (kind, tx, ty) {
    const S = MZ.state, P = S.player;
    const g = MZ.GRENADES[kind];
    if (!g || (P.granadas[kind] || 0) <= 0) return false;
    const dist = cheb2(P.x, P.y, tx, ty);
    if (dist < 1 || dist > g.range) return false; // fuera de alcance
    P.granadas[kind]--;
    const tp = MZ.toPx(tx, ty);
    MZ.fx.explode(tp.x, tp.y, g.color, 28, 3.5, 1.1);
    MZ.fx.ring(tp.x, tp.y, g.color, true);
    MZ.fx.shake(7);
    MZ.audio.kill();

    if (g.fire) {
      // molotov: enciende tiles en radio y dura unos turnos
      for (let y = ty - g.radius; y <= ty + g.radius; y++)
        for (let x = tx - g.radius; x <= tx + g.radius; x++) {
          if (!MZ.passable(x, y)) continue;
          if (!S.fuegos.some(f => f.x === x && f.y === y)) S.fuegos.push({ x, y, turns: g.fire });
        }
      MZ.fx.flash(0.25, 0xff7722);
    } else {
      // frag / stun: efecto inmediato en radio
      const dmg = g.dmg ? g.dmg(S.depth) : 0;
      for (const e of [...S.enemies]) {
        if (e.dead) continue;
        if (cheb2(e.x, e.y, tx, ty) > g.radius) continue;
        e.awake = true;
        if (g.stun) e.stun = Math.max(e.stun || 0, g.stun);
        if (dmg) {
          e.hp -= dmg;
          const ep = MZ.toPx(e.x, e.y);
          MZ.fx.floatText(ep.x, ep.y - 10, g.stun ? '✨' : String(dmg), g.color, 14);
          if (e.hp <= 0) { MZ.killEnemy(e); continue; }
        }
      }
      // el jugador también come la explosión si está en el radio
      if (cheb2(P.x, P.y, tx, ty) <= g.radius && dmg && P.hp > 0) {
        MZ.hurtPlayer(Math.max(1, Math.floor(dmg / 2)), 'tu propia granada', 'vos mismo');
      }
    }
    MZ.codex.discover('arsenal', kind === 'frag' ? 'granadaFrag' : kind === 'molotov' ? 'granadaMolotov' : 'granadaStun');
    MZ.ui.updateHUD();
    return true;
  };

  // Tick de los tiles de fuego (lo llama endTurn). Daña a quien esté parado.
  MZ.tickFuegos = function () {
    const S = MZ.state, P = S.player;
    if (!S.fuegos || !S.fuegos.length) return;
    for (const e of [...S.enemies]) {
      if (e.dead) continue;
      if (S.fuegos.some(f => f.x === e.x && f.y === e.y)) {
        e.hp -= 2 + Math.floor(S.depth / 3);
        const ep = MZ.toPx(e.x, e.y);
        MZ.fx.floatText(ep.x, ep.y - 8, '🔥', 0xff7722, 11);
        if (e.hp <= 0) MZ.killEnemy(e);
      }
    }
    if (P.hp > 0 && S.fuegos.some(f => f.x === P.x && f.y === P.y)) {
      MZ.hurtPlayer(2 + Math.floor(S.depth / 4), 'el fuego', 'trampa');
    }
    for (const f of S.fuegos) f.turns--;
    S.fuegos = S.fuegos.filter(f => f.turns > 0);
  };

  MZ.playerRangedAttack = function (e) {
    const P = MZ.state.player;
    const w = P.ranged;
    if (w.aoe) {
      fireBFG(e);
    } else if (w.grito) {
      gritar(e);
    } else {
      const crit = Math.random() < 0.1;
      let dmg = w.atk + Math.floor(P.baseAtk / 2) + (Math.random() < 0.5 ? 0 : 1);
      if (crit) dmg *= 2;
      MZ.fx.bolt(MZ.toPx(P.x, P.y), MZ.toPx(e.x, e.y), 0x00e5ff);
      hitEnemy(e, dmg, crit);
      // Gomera de Baterías: el tiro rebota en cadena
      if (w.rebote) {
        let from = e, dmgC = dmg - 1;
        const ya = new Set([e]);
        for (let j = 0; j < 2 && dmgC > 0; j++) {
          const next = MZ.state.enemies.find(o => !o.dead && !ya.has(o)
            && Math.max(Math.abs(o.x - from.x), Math.abs(o.y - from.y)) <= 3
            && MZ.los(from.x, from.y, o.x, o.y));
          if (!next) break;
          MZ.fx.bolt(MZ.toPx(from.x, from.y), MZ.toPx(next.x, next.y), 0xffff66);
          hitEnemy(next, dmgC, false);
          ya.add(next);
          from = next;
          dmgC--;
        }
      }
    }
    // munición: sin balas, el arma se descarta
    if (w.ammo != null) {
      w.ammo--;
      if (w.ammo <= 0) {
        MZ.say(w.aoe ? 'bfgVacia' : 'arcoVacio', { w: w.name });
        P.ranged = null;
      }
      MZ.ui.updateHUD();
    }
  };

  MZ.killEnemy = function (e) {
    const S = MZ.state, P = S.player;
    e.dead = true;
    const p = MZ.toPx(e.x, e.y);
    if (e.spr) { e.spr.destroy(); e.spr = null; }
    S.enemies = S.enemies.filter(x => x !== e);

    // Barril explosivo: daña todo lo que tenga al lado (en cadena).
    if (e.def.explode) {
      MZ.fx.explode(p.x, p.y, 0xffa500, 44, 5, 1.3);
      MZ.fx.ring(p.x, p.y, 0xff8800, true);
      MZ.fx.flash(0.4, 0xff8800);
      MZ.fx.shake(10);
      MZ.audio.kill();
      for (const o of [...S.enemies]) {
        if (!o.dead && cheb(o, e) <= 1) {
          o.hp -= 10 + S.depth;
          const op = MZ.toPx(o.x, o.y);
          MZ.fx.floatText(op.x, op.y - 10, String(10 + S.depth), 0xff8800, 14);
          if (o.hp <= 0) MZ.killEnemy(o);
        }
      }
      if (P.hp > 0 && cheb(P, e) <= 1) {
        MZ.hurtPlayer(4 + Math.floor(S.depth / 3), 'un barril explosivo', 'trampa');
        // la onda expansiva te tira una casilla para atrás
        if (P.hp > 0 && pushAway(P, e.x, e.y)) MZ.onPlayerDisplaced();
      }
      if (Math.random() < 0.5) MZ.spawnItemAt('gold', e.x, e.y, 8 + S.depth);
      MZ.ui.updateHUD();
      return;
    }

    MZ.fx.explode(p.x, p.y, e.def.color, e.boss ? 60 : 24, e.boss ? 5 : 3, e.boss ? 1.4 : 1);
    MZ.fx.ring(p.x, p.y, e.def.color, e.boss);
    MZ.fx.flash(e.boss ? 0.45 : 0.15);
    MZ.fx.shake(e.boss ? 14 : 6);
    MZ.audio.kill();
    let gold = (e.def.gold || 2) + Math.floor(S.depth * 0.7) + Math.floor(Math.random() * 4);
    if (e.boss) gold += 30 + S.depth * 2;
    if (e.stolen) gold += e.stolen * 2; // el Pombero devuelve el doble si lo cazás
    // fiesta en el Tiger y Rey Midas duplican el botín (apilable, jugátela)
    gold *= (S.evento === 'fiesta' ? 2 : 1) * (P.efecto === 'midas' ? 2 : 1);
    P.gold += gold;
    P.kills++;
    P.streak++;
    MZ.fx.floatText(p.x, p.y - MZ.TILE, '+' + gold, 0xffd700, 13);

    // La Bestia 9000: 5% en cualquier kill desde el nivel 1; 10% cerca de
    // un jefe vivo (el momento exacto). Ninguna arma es imposible.
    const bossCerca = !e.boss && S.enemies.some(b =>
      b.boss && !b.dead && Math.max(Math.abs(b.x - e.x), Math.abs(b.y - e.y)) <= 5);
    if (!e.boss && Math.random() < (bossCerca ? 0.10 : 0.05)) {
      // la Bestia no se pierde por un casillero ocupado: busca lugar al lado
      const spots = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]];
      for (const [ox, oy] of spots) {
        const x = e.x + ox, y = e.y + oy;
        if (MZ.passable(x, y) && !MZ.itemAt(x, y)) { MZ.spawnItemAt('bfg', x, y); break; }
      }
    }

    // Drops: los monstruos sueltan loot en el piso (armas seguido: se gastan).
    if (e.boss) {
      MZ.spawnItemAt('mate', e.x, e.y);
    } else if (Math.random() < (S.evento === 'invasion' ? 0.5 : 0.3)) {
      const r = Math.random();
      const type = r < 0.25 ? 'gold' : r < 0.42 ? 'potion' : r < 0.68 ? 'weapon' : r < 0.86 ? 'bow' : r < 0.95 ? 'armor' : 'mate';
      MZ.spawnItemAt(type, e.x, e.y, 6 + Math.floor(S.depth * 1.2));
    } else if (Math.random() < 0.14) {
      // corazón: vida directa, más probable si venís golpeado
      MZ.spawnItemAt('heart', e.x, e.y);
    } else if (P.hp < P.maxHp * 0.35 && Math.random() < 0.25) {
      MZ.spawnItemAt('heart', e.x, e.y); // piedad del dungeon
    }

    if (e.boss) {
      MZ.say('jefeMuerto');
      MZ.fx.slowmo(350);
      MZ.quests.onBossKill();
      const d = MZ.save.data;
      d.jefesMuertos = (d.jefesMuertos || 0) + 1;
      MZ.save.store();
    }
    else if (e.def.pombero) MZ.say('pomberoMuerto');
    else if (e.def.rataBlanca) { MZ.say('rataBlanca', null, 4000); MZ.fx.flash(0.35, 0xffffff); }
    else if (P.streak === 5) MZ.say('racha', { k: P.streak });
    else if (Math.random() < 0.18) MZ.say('matar');
    MZ.logros.check(e.def.pombero ? 'pombero' : e.def.rataBlanca ? 'rataBlanca' : undefined);
    MZ.ui.updateHUD();
  };

  MZ.hurtPlayer = function (dmg, from, cat) {
    const S = MZ.state, P = S.player;
    P.hp -= dmg;
    P.streak = 0;
    const p = MZ.toPx(P.x, P.y);
    MZ.fx.floatText(p.x, p.y - 10, '-' + dmg, 0xff4d6d, 16);
    MZ.fx.explode(p.x, p.y, 0xff4d6d, 8, 2, 0.7);
    MZ.fx.shake(4);
    MZ.fx.flash(0.2, 0xff0033);
    MZ.audio.hurt();
    if (dmg >= Math.max(4, P.maxHp * 0.22) && Math.random() < 0.5) MZ.say('danioGrande');
    MZ.ui.updateHUD();
    if (P.hp <= 0) MZ.die(from, cat);
  };

  MZ.poisonPlayer = function (turns, from) {
    const P = MZ.state.player;
    P.poison = Math.max(P.poison, turns);
    const p = MZ.toPx(P.x, P.y);
    MZ.fx.floatText(p.x, p.y - 24, '☠ envenenado', 0x66ff44, 13);
    MZ.say('veneno');
    MZ.ui.updateHUD();
  };

  function free(e, x, y) {
    const P = MZ.state.player;
    if (!MZ.inBounds(x, y)) return false;
    if (P.x === x && P.y === y) return false;
    if (MZ.enemyAt(x, y)) return false;
    if (MZ.npcAt(x, y)) return false;
    if (e.def.ghost) return true; // el fantasma atraviesa paredes
    return MZ.passable(x, y);
  }

  function stepToward(e) {
    const P = MZ.state.player;
    const dx = Math.sign(P.x - e.x), dy = Math.sign(P.y - e.y);
    const cand = [];
    if (dx && dy) cand.push([dx, dy]); // diagonal directa primero
    if (Math.abs(P.x - e.x) >= Math.abs(P.y - e.y)) cand.push([dx, 0], [0, dy]);
    else cand.push([0, dy], [dx, 0]);
    cand.push([0, -dy], [-dx, 0]);
    for (const [cx, cy] of cand) {
      if (!cx && !cy) continue;
      if (free(e, e.x + cx, e.y + cy)) { e.x += cx; e.y += cy; return; }
    }
  }

  function teleport(e, nearPlayer) {
    const S = MZ.state, L = S.level, P = S.player;
    const spots = [];
    for (let y = 1; y < L.h - 1; y++) for (let x = 1; x < L.w - 1; x++) {
      if (!MZ.passable(x, y) || MZ.enemyAt(x, y) || MZ.npcAt(x, y) || (P.x === x && P.y === y)) continue;
      const d = Math.max(Math.abs(x - P.x), Math.abs(y - P.y));
      if (nearPlayer ? (d >= 2 && d <= 3) : d >= 8) spots.push({ x, y });
    }
    if (!spots.length) return;
    const to = spots[Math.floor(Math.random() * spots.length)];
    const a = MZ.toPx(e.x, e.y), b = MZ.toPx(to.x, to.y);
    MZ.fx.sparkle(a.x, a.y, e.def.color);
    MZ.fx.sparkle(b.x, b.y, e.def.color);
    e.x = to.x; e.y = to.y;
    if (e.spr) e.spr.position.set(b.x, b.y);
  }

  function pomberoTurn(e) {
    const S = MZ.state, P = S.player;
    if (cheb(e, P) === 1) {
      const steal = Math.min(P.gold, 8 + Math.floor(Math.random() * 15));
      if (steal > 0) {
        P.gold -= steal;
        e.stolen = (e.stolen || 0) + steal;
        const p = MZ.toPx(P.x, P.y);
        MZ.fx.floatText(p.x, p.y - 14, '-' + steal + ' oro', 0xffd700, 14);
        MZ.say('pombero');
        MZ.audio.hurt();
        MZ.ui.updateHUD();
      }
      teleport(e, false);
    } else if (Math.random() < 0.2) {
      teleport(e, true);
    } else {
      stepToward(e);
    }
  }

  MZ.enemiesTurn = function () {
    const S = MZ.state, P = S.player;
    // Fiesta en el Tiger: nadie pelea, todos bailan (se mueven al azar)
    if (S.evento === 'fiesta') {
      for (const e of S.enemies) {
        if (e.dead || e.def.static) continue;
        const d = [[1, 0], [-1, 0], [0, 1], [0, -1]][Math.floor(Math.random() * 4)];
        if (free(e, e.x + d[0], e.y + d[1])) { e.x += d[0]; e.y += d[1]; }
      }
      return;
    }
    const gen = S.gen;
    for (const e of [...S.enemies]) {
      if (S.gen !== gen) return; // el jugador revivió y se reconstruyó el nivel: corto el turno viejo
      if (e.dead || P.hp <= 0) continue;
      // veneno sobre el enemigo (armas con veneno del jugador)
      if (e.poison > 0) {
        e.poison--;
        e.hp -= 1;
        const p = MZ.toPx(e.x, e.y);
        MZ.fx.floatText(p.x, p.y - 10, '1', 0x66ff44, 11);
        if (e.hp <= 0) { MZ.killEnemy(e); continue; }
      }
      if (e.def.static) continue; // los barriles no opinan
      if (e.stun > 0) { e.stun--; continue; } // aturdido por una granada
      if (e.def.slow) { e._t = !e._t; if (e._t) continue; }
      const d = cheb(e, P);
      if (!e.awake) {
        // Rey Midas: brillás tanto que te huelen de lejos
        const detect = P.efecto === 'midas' ? 10 : 7;
        if (d <= detect && MZ.los(e.x, e.y, P.x, P.y)) e.awake = true;
        else continue;
      }
      if (e.def.pombero) { pomberoTurn(e); continue; }
      if (d === 1) {
        const dmg = Math.max(1, e.atk - P.def + (Math.random() < 0.4 ? 1 : 0));
        MZ.hurtPlayer(dmg, e.boss ? e.name : e.def.name, e.boss ? 'jefe' : 'monstruo');
        if (e.def.vampiro) { // te chupa la vida y se cura
          e.hp = Math.min(e.maxHp, e.hp + dmg);
          const ep = MZ.toPx(e.x, e.y);
          MZ.fx.floatText(ep.x, ep.y - 12, '+' + dmg, 0xff2222, 11);
        }
        if (e.def.poison && P.hp > 0 && Math.random() < 0.7) MZ.poisonPlayer(e.def.poison, e.def.name);
        // los jefes pegan tan fuerte que te mueven de casillero
        if (e.boss && P.hp > 0 && pushAway(P, e.x, e.y)) {
          MZ.fx.shake(7);
          MZ.onPlayerDisplaced();
        }
        continue;
      }
      if (e.def.ranged && d <= e.def.ranged && MZ.los(e.x, e.y, P.x, P.y)) {
        MZ.fx.bolt(MZ.toPx(e.x, e.y), MZ.toPx(P.x, P.y), e.def.color);
        MZ.hurtPlayer(Math.max(1, e.atk - 1 - P.def), e.def.name, 'monstruo');
        continue;
      }
      if (d <= 10) stepToward(e);
    }
  };
})();
