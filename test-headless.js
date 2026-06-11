// Test headless saga-2: se inyecta en dist/mazmorra.html y corre con chromium --headless.
// Verifica: boot, newRun, quest madre (sellos por boss de acto), boss correcto por arena,
// tope de granadas (2), tope de BFG (1), nivel 50 (Mánager) y pickNpcsForLevel.
(function () {
  const out = [];
  const ok = (name, cond) => out.push((cond ? 'PASS ' : 'FAIL ') + name);
  function done() {
    document.title = 'TESTS-DONE';
    const pre = document.createElement('pre');
    pre.id = 'test-results';
    pre.textContent = out.join('\n');
    document.body.appendChild(pre);
  }
  window.addEventListener('error', e => { out.push('JSERROR ' + e.message); });

  const t = setInterval(() => {
    if (!window.MZ || !MZ.newRun || !MZ.app) return;
    clearInterval(t);
    try {
      run();
    } catch (e) {
      out.push('EXCEPTION ' + (e && e.stack || e));
    }
    done();
  }, 200);

  function run() {
    MZ.newRun();
    if (MZ.state.dialogOpen) MZ.dialog.close(); // cerrar intro
    ok('newRun arranca', MZ.state.playing === true && MZ.state.depth === 1);
    const P = MZ.state.player;

    // --- granadas: tope global 2 ---
    P.granadas = { frag: 0, molotov: 0, stun: 0 };
    const a1 = MZ.addGrenade(P, 'frag', 2);
    const a2 = MZ.addGrenade(P, 'stun', 2);
    ok('granadas tope 2 (entran 2, después 0)', a1 === 2 && a2 === 0 && MZ.grenadeCount(P) === 2);

    // --- bfg: máximo 1 ---
    P.bfg = MZ.genBFG(5);
    const goldBefore = P.gold;
    MZ.spawnItemAt && MZ.spawnItemAt('bfg', P.x, P.y);
    // pickup directo vía applyItem no exportado: simular con item fake si spawnItemAt no existe
    ok('bfg existe con 1 tiro', P.bfg && P.bfg.ammo === 1);

    // --- bosses por arena: array de 10, indexado depth/5-1 ---
    const names = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50].map(d => MZ.makeEnemy('boss', 1, 1, d).name);
    const unicos = new Set(names);
    ok('10 bosses únicos por arena', unicos.size === 10 && names[0] === MZ.BOSS_NAMES[0] && names[9] === MZ.BOSS_NAMES[9]);

    // --- quest madre: matar boss de piso 10 deja sello pendiente y brisa spawnea ---
    MZ.quests.reset();
    MZ.state.depth = 10;
    MZ.quests.onBossKill();
    ok('boss de acto deja sello pendiente', MZ.quests.run.brisaPend === 'previa');
    const npcs11 = MZ.pickNpcsForLevel(11, false);
    ok('brisa aparece con sello pendiente', npcs11.includes('brisa'));
    ok('mercader siempre presente', npcs11.includes('mercader'));
    const dup = npcs11.length === new Set(npcs11).size;
    ok('sin NPCs duplicados', dup);

    // --- sellos: data() y count() ---
    MZ.sellos.data().previa = 1;
    MZ.sellos.data().tailandia = 1;
    ok('sellos count', MZ.sellos.count() === 2);

    // --- nivel 50: solo fundador ---
    const npcs50 = MZ.pickNpcsForLevel(50, true);
    ok('nivel 50 = solo el del traje', npcs50.length === 1 && npcs50[0] === 'fundador');

    // --- boss de piso no-acto NO deja sello ---
    MZ.quests.run.brisaPend = null;
    MZ.state.depth = 5;
    MZ.quests.onBossKill();
    ok('boss 5 no da sello', MZ.quests.run.brisaPend === null);

    // --- pool por acto: NPCs de acto 2 (depth 15) ---
    let actoOk = false;
    for (let i = 0; i < 40 && !actoOk; i++) {
      const l = MZ.pickNpcsForLevel(15, false);
      if (['nuan', 'monje', 'tuktukero', 'lola', 'mochilero', 'tatuador', 'chamana'].some(x => l.includes(x))) actoOk = true;
    }
    ok('pool del acto II aparece en depth 15', actoOk);

    // --- temas: acto de 10 niveles + infierno en pisos de jefe ---
    ok('tema acto I en depth 3', MZ.themeFor(3).name === MZ.THEMES[0].name);
    ok('tema acto II en depth 13', MZ.themeFor(13).name === MZ.THEMES[1].name);
    ok('tema infierno en depth 15', MZ.themeFor(15).hell === true);

    // --- codex: conteos y 3 oraciones ---
    let codexOk = true;
    for (const c of ['monstruos', 'jefes', 'personajes', 'arsenal'])
      for (const e of MZ.CODEX[c]) if (e.lore.length !== 3) codexOk = false;
    ok('codex 3 oraciones c/u', codexOk);
    ok('codex personajes = NPC_DEFS', MZ.CODEX.personajes.length === Object.keys(MZ.NPC_DEFS).length);

    // --- logros nuevos existen ---
    const ids = MZ.logros.defs.map(l => l.id);
    ok('logros de saga presentes', ids.includes('sellos5') && ids.includes('finalBueno') && ids.includes('gatoLogro'));

    // --- handler del Mánager devuelve nodo con finales según sellos ---
    MZ.state.depth = 50;
    const node = MZ.LORE.fundador.talk({});
    ok('Mánager habla en el 50', !!node && !!node.text && node.choices.length >= 2);
  }
})();
