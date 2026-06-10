// Lore escrito a mano: NPCs con historia, quests secundarias, romance y picante.
window.MZ = window.MZ || {};
(() => {
  const P = () => MZ.state.player;
  const D = () => MZ.save.data;
  const node = (name, color, text, choices) => ({ name, color, text, choices });

  // ---- Sistema de quests del run ----
  MZ.quests = {
    run: {},
    reset() {
      this.run = { anillo: null, venganza: null, espOferta: false };
    },
    needRing(depth) {
      const a = this.run.anillo;
      return a && a.stage === 'buscar' && depth >= a.target;
    },
    ringFound() {
      const a = this.run.anillo;
      if (a) a.stage = 'tengo';
    },
    onBossKill() {
      const v = this.run.venganza;
      if (v && v.stage === 'activa') {
        v.stage = 'cumplida';
        setTimeout(() => MZ.ui.toast('Venganza cumplida. La viuda te va a estar esperando...', 3500), 1800);
      }
    },
  };

  // Qué NPCs aparecen en cada nivel (quests forzadas primero, después azar).
  MZ.pickNpcsForLevel = function (depth, isBoss) {
    const Q = MZ.quests.run;
    const out = [];
    if (Q.anillo && Q.anillo.stage === 'tengo') out.push('rodrigo');
    if (Q.venganza && Q.venganza.stage === 'cumplida' && !isBoss) out.push('esperanza');
    if (isBoss || depth < 2) return out;
    if (depth % 5 === 4 && !Q.venganza && !Q.espOferta) out.push('esperanza');
    const pool = ['mercader', 'mercader', 'bardo', 'bardo'];
    if (depth >= 4) pool.push('morena', 'morena');
    if (depth >= 3 && !Q.anillo) pool.push('rodrigo');
    const want = (Math.random() < 0.75 ? 1 : 0) + (Math.random() < 0.35 ? 1 : 0);
    for (let i = 0; i < want; i++) {
      const t = pool[Math.floor(Math.random() * pool.length)];
      if (!out.includes(t)) out.push(t);
    }
    return out;
  };

  // ---- Don Olivera, el mercader ----
  function mercaderMenu(npc, text) {
    const p = P(), d = MZ.state.depth;
    const cPocion = 15, cEspada = 30 + d * 2, cChaleco = 40 + d * 2, cGomera = 25 + d;
    const choices = [];
    choices.push({
      label: `Poción (+12 HP, cura veneno) — ${cPocion} oro`,
      fn() {
        if (p.gold < cPocion) return mercaderMenu(npc, 'Sin oro no hay paraíso, campeón.');
        p.gold -= cPocion;
        p.hp = Math.min(p.maxHp, p.hp + 12);
        p.poison = 0;
        MZ.audio.pickup(); MZ.ui.updateHUD();
        return mercaderMenu(npc, 'Salud. Si te cae mal, yo no te vendí nada.');
      },
    });
    if (!npc.soldSword) choices.push({
      label: `Afilar el arma (ATK +1) — ${cEspada} oro`,
      fn() {
        if (p.gold < cEspada) return mercaderMenu(npc, 'Con esas monedas no afilo ni un tenedor.');
        p.gold -= cEspada; p.baseAtk += 1; MZ.recalcStats();
        npc.soldSword = true;
        MZ.audio.pickup(); MZ.ui.updateHUD();
        return mercaderMenu(npc, 'Filo nuevo. Tratá de no cortarte vos, que después me hacen mala fama.');
      },
    });
    if (!npc.soldVest) choices.push({
      label: `Chaleco de cuero (DEF +1) — ${cChaleco} oro`,
      fn() {
        if (p.gold < cChaleco) return mercaderMenu(npc, 'El cuero está caro, pibe. La inflación llegó hasta acá abajo.');
        p.gold -= cChaleco; p.baseDef += 1; MZ.recalcStats();
        npc.soldVest = true;
        MZ.audio.pickup(); MZ.ui.updateHUD();
        return mercaderMenu(npc, 'Te queda pintado. Cuero legítimo de... mejor no preguntes de qué.');
      },
    });
    if (!p.ranged && !npc.soldBow) choices.push({
      label: `Gomera de barrio (a distancia) — ${cGomera} oro`,
      fn() {
        if (p.gold < cGomera) return mercaderMenu(npc, 'La gomera es un clásico, pero los clásicos se pagan.');
        p.gold -= cGomera;
        p.ranged = { kind: 'ranged', name: 'Gomera de barrio', atk: 1 + Math.floor(d / 7), range: 3 };
        npc.soldBow = true;
        MZ.audio.pickup(); MZ.ui.updateHUD();
        return mercaderMenu(npc, 'Rompí vidrios con esa desde los ocho años. Ahora rompé cráneos.');
      },
    });
    choices.push({ label: 'Chau, Don', fn: null });
    return node('Don Olivera', 0xffd27f, text, choices);
  }

  // ---- Morena, la bruja (romance que persiste entre muertes) ----
  function morenaTalk(npc) {
    const p = P(), s = D().morena || 0;
    const save = (n) => { D().morena = n; MZ.save.store(); };

    if (s === 0) return node('Morena', 0xff4cf0,
      'Uy... carne fresca. Digo: bienvenido, aventurero. ¿Buscás una poción, un maleficio, o me vas a seguir mirando así?',
      [
        {
          label: 'Tirarle onda', fn() {
            save(1);
            p.hp = Math.min(p.maxHp, p.hp + 10);
            MZ.audio.mate(); MZ.fx.flash(0.2, 0xff4cf0); MZ.ui.updateHUD();
            return node('Morena', 0xff4cf0,
              'Directo al grano. Me gustan los que no le tienen miedo a una bruja. Tomá, un besito de muestra. (+10 HP)\n\nVolvé a verme... si sobrevivís, claro.', null);
          },
        },
        {
          label: 'Pedir una poción', fn() {
            p.hp = Math.min(p.maxHp, p.hp + 8); p.poison = 0;
            MZ.audio.pickup(); MZ.ui.updateHUD();
            return node('Morena', 0xff4cf0, 'Tomá, va por la casa. Pero me debés una... y yo las deudas las cobro.', null);
          },
        },
        { label: 'Irse despacito', fn: null },
      ]);

    if (s === 1) return node('Morena', 0xff4cf0,
      'Volviste. Sabía que no era mi imaginación... Sentate, justo estaba cebando.',
      [
        {
          label: 'Compartir el mate', fn() {
            save(2);
            p.maxHp += 2; p.hp = Math.min(p.maxHp, p.hp + 8); MZ.recalcStats();
            MZ.audio.mate(); MZ.ui.updateHUD();
            return node('Morena', 0xff4cf0,
              'Compartir mate acá abajo es casi un casamiento. No te asustes. (+2 HP máx)\n\n...¿O asustate un poco, no sé, me gusta verte dudar.', null);
          },
        },
        { label: 'Hoy no puedo, hay monstruos', fn: () => node('Morena', 0xff4cf0, 'Siempre hay monstruos, querido. Por eso existen las pausas.', null) },
      ]);

    if (s === 2) return node('Morena', 0xff4cf0,
      'Quedate un rato. Las velas están prendidas, la puerta tiene tranca, y los esqueletos hoy no miran.',
      [
        {
          label: 'Quedarse 😏', fn() {
            MZ.audio.mate(); MZ.fx.flash(0.5, 0xff4cf0);
            return node('Morena', 0xff4cf0,
              '████████████████████\n██████████████\n████████████████████\n\n(escena censurada por el Gremio de Bardos)',
              [{
                label: 'Continuar...', fn() {
                  save(3);
                  p.maxHp += 3; p.baseAtk += 1; MZ.recalcStats(); p.hp = p.maxHp; p.poison = 0;
                  MZ.fx.flash(0.3, 0xff4cf0); MZ.audio.secret(); MZ.ui.updateHUD();
                  return node('Morena', 0xff4cf0,
                    'Bendición de Morena: HP máx +3, ATK +1, curado entero... y una sonrisa que no se te va a ir más.\n\nAhora andá a matar cosas, que la cena no se paga sola.', null);
                },
              }]);
          },
        },
        { label: 'Hoy no, tengo que matar un jefe', fn: () => node('Morena', 0xff4cf0, 'Excusas. El jefe puede esperar. Yo también... pero menos.', null) },
      ]);

    // s >= 3: pareja establecida
    const extra = D().deaths >= 3 && Math.random() < 0.5
      ? '\n\nTe morís seguido, ¿sabés? Suerte que me gustan los complicados.'
      : '';
    return node('Morena', 0xff4cf0,
      '¿Otra vez por acá, amor? Vení que te curo.' + extra,
      [
        {
          label: 'Un beso y sigo', fn() {
            p.hp = p.maxHp; p.poison = 0;
            MZ.audio.mate(); MZ.ui.updateHUD();
            return node('Morena', 0xff4cf0, 'Curado entero. Sin veneno, sin moretones, sin excusas. A trabajar.', null);
          },
        },
        {
          label: 'Quedarse otra vez 😏', fn() {
            p.hp = p.maxHp; p.maxHp += 1; p.poison = 0; MZ.recalcStats();
            MZ.audio.mate(); MZ.fx.flash(0.4, 0xff4cf0); MZ.ui.updateHUD();
            return node('Morena', 0xff4cf0,
              '█████████████\n(el Gremio de Bardos ya ni se molesta en mirar)\n\n+1 HP máx. El cariño hace bien, está estudiado.', null);
          },
        },
      ]);
  }

  // ---- Anselmo el Bardo: la historia del dungeon en 5 capítulos ----
  const CAPITULOS = [
    '¿Sabés dónde estás parado, pibe? Esto era el Gran Teatro Subterráneo del Bardo Fundador. Mil butacas, terciopelo, acomodadores con moñito. Después... bueno, después pasó lo que pasó.',
    'El Bardo Fundador quería público infinito. Hizo un pacto: su alma a cambio de funciones eternas. Spoiler: la letra chica decía "el público te va a querer matar". Nunca firmes sin leer, querido.',
    '¿Los monstruos? Críticos de teatro, maldecidos para siempre por panear la obra equivocada. La rata escribía para el diario La Mazmorra. El slime tenía un blog. Al fantasma lo echaron de la radio.',
    'Los jefes de cada cinco pisos eran empresarios teatrales. El Encargado cortaba los sándwiches de miga al medio... a lo largo. Por eso está maldito. Y la verdad, hace bien.',
    'Última verdad, y no se la conté a nadie: el dungeon se regenera porque el Bardo sigue escribiendo niveles ahí abajo. Vos no estás explorando, querido. Estás siendo escrito. ...¿Un mate?',
  ];

  function bardoTalk() {
    const p = P(), cap = D().loreCap || 0;
    if (cap < CAPITULOS.length) {
      return node('Anselmo el Bardo', 0x66aaff,
        CAPITULOS[cap],
        [{
          label: cap === CAPITULOS.length - 1 ? 'Procesar la revelación' : 'Escuchar (y aceptar la gorra)',
          fn() {
            D().loreCap = cap + 1; MZ.save.store();
            p.gold += 10;
            MZ.audio.gold(); MZ.ui.updateHUD();
            if (cap === CAPITULOS.length - 1) {
              p.maxHp += 5; p.hp = Math.min(p.maxHp, p.hp + 5); MZ.recalcStats(); MZ.ui.updateHUD();
              return node('Anselmo el Bardo', 0x66aaff,
                'Conocer la verdad fortalece. O te arruina la cabeza, depende del día. (+5 HP máx)\n\nHoy parece que fortalece. Tomá 10 de oro: la gorra al revés, hoy pago yo.', null);
            }
            return node('Anselmo el Bardo', 0x66aaff, 'Tomá 10 de oro: la gorra al revés, hoy pago yo. Volvé que esto sigue.', null);
          },
        }, { label: 'No tengo tiempo para teatro', fn: null }]);
    }
    const yapas = [
      'Copla del día: "Bajó valiente el cruzado / con su espada y su ilusión / lo mató una rata flaca / en el primer escalón."',
      'Consejo de viejo: a las víboras pegales de lejos. Y a los críticos de teatro también.',
      'Si ves una pared con una grieta, pateala. La arquitectura de acá es puro decorado, te lo digo yo que armaba la escenografía.',
      'El Pombero existe. Una vez me afanó la púa y el termo. La púa la repuse, el termo todavía lo lloro.',
    ];
    return node('Anselmo el Bardo', 0x66aaff, yapas[Math.floor(Math.random() * yapas.length)], null);
  }

  // ---- Rodrigo el Perdido: la quest del anillo (con twist) ----
  function rodrigoTalk() {
    const p = P(), d = MZ.state.depth, Q = MZ.quests.run;

    if (!Q.anillo) return node('Rodrigo el Perdido', 0x9aa5b1,
      `¡Por fin alguien vivo! Escuchame: perdí mi anillo de casamiento allá abajo, nivel ${d + 2} más o menos. Si mi señora se entera, me mata más fuerte que cualquier jefe. Traémelo y te pago bien.`,
      [
        {
          label: 'Aceptar la búsqueda', fn() {
            Q.anillo = { stage: 'buscar', target: d + 2 };
            MZ.ui.toast(`Quest: buscá el anillo en el nivel ${d + 2} o más abajo.`, 3500);
            return null;
          },
        },
        {
          label: '¿Y qué hacías VOS ahí abajo?', fn: () => node('Rodrigo el Perdido', 0x9aa5b1,
            '...Nada. Cosas de aventurero. Exploración. Cartografía. ACEPTÁ Y NO PREGUNTES.',
            [{
              label: 'Bueno, bueno. Acepto.', fn() {
                Q.anillo = { stage: 'buscar', target: d + 2 };
                MZ.ui.toast(`Quest: buscá el anillo en el nivel ${d + 2} o más abajo.`, 3500);
                return null;
              },
            }, { label: 'Paso, muy turbio', fn: null }]),
        },
        { label: 'Paso', fn: null },
      ]);

    if (Q.anillo.stage === 'buscar') return node('Rodrigo el Perdido', 0x9aa5b1,
      '¿Y? ¿El anillo? Cada día que pasa mi señora sospecha más. Ayer me preguntó por qué tenía la mano "más liviana". LA MANO MÁS LIVIANA, ¿entendés el nivel de detalle?', null);

    if (Q.anillo.stage === 'tengo') return node('Rodrigo el Perdido', 0x9aa5b1,
      '¡EL ANILLO! Dámelo, dámelo... eh... esperá. ¿Lo miraste mucho?',
      [
        {
          label: 'Tiene grabado "Para R., con amor, M."', fn() {
            Q.anillo.stage = 'cerrado';
            p.gold += 120;
            MZ.audio.gold(); MZ.ui.updateHUD();
            const extra = (D().morena || 0) >= 2
              ? '\n\n...Pará. ¿Vos también andás con Morena? ...El dungeon es un pañuelo, hermano.'
              : '';
            return node('Rodrigo el Perdido', 0x9aa5b1,
              '...Morena. Es de Morena, ¿está bien? No es lo que parece. Bueno, sí es lo que parece. Tomá 120 de oro y tu silencio.' + extra, null);
          },
        },
        {
          label: 'Devolverlo sin preguntar', fn() {
            Q.anillo.stage = 'cerrado';
            p.gold += 80; p.maxHp += 2; p.hp = Math.min(p.maxHp, p.hp + 2); MZ.recalcStats();
            MZ.audio.gold(); MZ.ui.updateHUD();
            return node('Rodrigo el Perdido', 0x9aa5b1,
              'Un caballero. Ya no quedan. Tomá 80 de oro, y que el karma te infle el corazón. (+2 HP máx)', null);
          },
        },
      ]);

    return node('Rodrigo el Perdido', 0x9aa5b1, 'Ni una palabra de lo del anillo. NI. UNA. PALABRA.', null);
  }

  // ---- Esperanza, la Viuda: venganza contra el jefe (con coqueteo final) ----
  function esperanzaTalk() {
    const p = P(), Q = MZ.quests.run;

    if (!Q.venganza) return node('Esperanza, la Viuda', 0xff2255,
      'Ese de ahí abajo mató a mi marido. Bueno... técnicamente ERA mi marido antes de convertirse en jefe de piso. Largo de contar. Matalo y te recompenso, guapo.',
      [
        {
          label: 'Considerelo muerto, señora', fn() {
            Q.venganza = { stage: 'activa' };
            Q.espOferta = true;
            MZ.ui.toast('Quest: matá al próximo jefe por Esperanza.', 3500);
            return null;
          },
        },
        {
          label: '¿Y por qué no lo mata usted?', fn: () => node('Esperanza, la Viuda', 0xff2255,
            'Estoy de luto, querido. El luto no combina con la sangre. ...Bueno, sí combina, pero igual. Andá vos.',
            [{
              label: 'De acuerdo, voy yo', fn() {
                Q.venganza = { stage: 'activa' };
                Q.espOferta = true;
                MZ.ui.toast('Quest: matá al próximo jefe por Esperanza.', 3500);
                return null;
              },
            }, { label: 'Mejor no me meto', fn: null }]),
        },
        { label: 'No me meto en asuntos de pareja', fn: null },
      ]);

    if (Q.venganza.stage === 'activa') return node('Esperanza, la Viuda', 0xff2255,
      'El jefe sigue vivo y yo sigo de luto. Uno de los dos problemas lo podés resolver vos, guapo.', null);

    if (Q.venganza.stage === 'cumplida') {
      Q.venganza.stage = 'cerrada';
      p.gold += 100;
      MZ.audio.gold(); MZ.ui.updateHUD();
      return node('Esperanza, la Viuda', 0xff2255,
        'Lo mataste. Doblemente viuda a los... bueno, mi edad no importa. Tomá 100 de oro, te los ganaste.',
        [
          {
            label: '¿Hace algo el viernes? 😏', fn() {
              if ((D().morena || 0) >= 2) {
                p.gold += 50;
                MZ.audio.gold(); MZ.ui.updateHUD();
                return node('Esperanza, la Viuda', 0xff2255,
                  'Uy, no. Vos sos el de Morena. Esa bruja ya me afanó dos maridos, no le pienso prestar el tercero.\n\nPero tomá 50 más por el intento, atrevido.', null);
              }
              p.maxHp += 3; p.hp = Math.min(p.maxHp, p.hp + 3); MZ.recalcStats();
              MZ.fx.flash(0.3, 0xff2255); MZ.audio.mate(); MZ.ui.updateHUD();
              return node('Esperanza, la Viuda', 0xff2255,
                'Por fin alguien pregunta. El viernes, acá, piso del jefe muerto. Llevá vino y no llegues tarde.\n\n(+3 HP máx: un corazón viudo contento late más fuerte)', null);
            },
          },
          {
            label: 'Solo cumplía con la justicia', fn() {
              p.baseDef += 1; MZ.recalcStats(); MZ.ui.updateHUD();
              return node('Esperanza, la Viuda', 0xff2255,
                'Un caballero serio. Qué desperdicio. Tomá: el broche del difunto. Para algo que sirva. (DEF +1)', null);
            },
          },
        ]);
    }

    return node('Esperanza, la Viuda', 0xff2255, 'Nos vemos el viernes, ¿no? No te hagas el desentendido.', null);
  }

  MZ.LORE = {
    mercader: { talk: (npc) => mercaderMenu(npc, ['Pasá, pasá. Todo lo que ves se cayó de un camión. El camión de otra mazmorra.', '¿Qué hacés, pibe? Mercadería fresca... bueno, fresca para estar en un pozo maldito.', 'Don Olivera, para servirte. Acepto oro. No acepto quejas ni devoluciones.'][Math.floor(Math.random() * 3)]) },
    morena: { talk: morenaTalk },
    bardo: { talk: bardoTalk },
    rodrigo: { talk: rodrigoTalk },
    esperanza: { talk: esperanzaTalk },
  };
})();
