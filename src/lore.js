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
    if (depth === 50) { out.push('fundador'); return out; } // la última función
    if (Q.anillo && Q.anillo.stage === 'tengo') out.push('rodrigo');
    if (Q.venganza && Q.venganza.stage === 'cumplida' && !isBoss) out.push('esperanza');
    // el nieto de la Nona: aparece una sola vez (histórico), bien abajo, si la conocés
    if (!isBoss && depth >= 12 && (D().nona || 0) >= 2 && !D().nietoVisto && Math.random() < 0.3) {
      out.push('nieto');
    }
    if (isBoss) return out;
    out.push('mercader'); // Don Olivera tiene franquicia en todos los pisos
    if (depth % 5 === 4 && !Q.venganza && !Q.espOferta) out.push('esperanza');
    // El subsuelo está poblado: pool con peso, se permiten repetidos
    // (cada encuentro es fresco — los que progresan avanzan, los de servicio re-atienden).
    const pool = ['bardo', 'bardo', 'mercader', 'tahur'];
    if (depth >= 2) pool.push('tahur', 'nona');
    if (depth >= 3) pool.push('nona', 'morena');
    if (depth >= 4) pool.push('morena', 'herrero');
    if (depth >= 5) pool.push('herrero', 'critico');
    if (depth >= 6) pool.push('critico', 'djtigre');
    if (depth >= 8) pool.push('djtigre');
    if (depth >= 3 && !Q.anillo) pool.push('rodrigo');
    // más NPCs por sala: 2–4 desde nivel 2; nivel 1 también puebla un poco
    const want = depth < 2
      ? (Math.random() < 0.6 ? 1 : 0) + (Math.random() < 0.3 ? 1 : 0)
      : 2 + (Math.random() < 0.6 ? 1 : 0) + (Math.random() < 0.35 ? 1 : 0);
    for (let i = 0; i < want; i++) out.push(pool[Math.floor(Math.random() * pool.length)]);
    return out;
  };

  // ---- Don Olivera, el mercader ----
  function mercaderMenu(npc, text) {
    const p = P(), d = MZ.state.depth;
    // mercado negro: todo a mitad de precio
    const k = MZ.state.evento === 'mercado' ? 0.5 : 1;
    const cPocion = Math.ceil(15 * k), cEspada = Math.ceil((30 + d * 2) * k),
      cChaleco = Math.ceil((40 + d * 2) * k), cGomera = Math.ceil((25 + d) * k);
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
        p.ranged = { kind: 'ranged', name: 'Gomera de barrio', atk: 1 + Math.floor(d / 7), range: 3, ammo: 8 };
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
      'Quedate un rato. Las velas están prendidas, la puerta tiene tranca, hay tequila del bueno —del que traje de Cancún, no preguntes cómo— y los esqueletos hoy no miran.',
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
    '¿Sabés dónde estás parado, pibe? Esto era el Gran Teatro Subterráneo del Bardo Fundador. Mil butacas, terciopelo, acomodadores con moñito. Yo toqué acá de soporte de Rata Blanca, te juro. Después... bueno, después pasó lo que pasó.',
    'El Bardo Fundador quería público infinito. Hizo un pacto: su alma a cambio de funciones eternas. Spoiler: la letra chica decía "el público te va a querer matar". Como dice Helloween: keeper of the seven keys... y este abrió las siete puertas equivocadas, el animal.',
    '¿Los monstruos? Críticos maldecidos por panear la obra equivocada. La rata escribía para el diario La Mazmorra. El slime tenía un blog. Al fantasma lo echaron de la radio por pasar Edguy a las cuatro de la tarde. Injusto, si me preguntás: Vain Glory Opera es para toda hora.',
    'Los jefes de cada cinco pisos eran empresarios teatrales. El Encargado cortaba los sándwiches de miga al medio... a lo largo. Por eso está maldito. Y la verdad, hace bien.',
    '¿Y los demás? La Nona cocinaba para el elenco: su guiso resucitaba giras enteras. El Tahúr era el productor: se jugó la recaudación en el Tiger Tiger... tres veces. Fierrito hacía la utilería: la única espada de verdad en un teatro lleno de espadas de cartón.',
    'Morena era la actriz principal, ¿sabías? La maldición no la tocó: ella YA era bruja, lo del teatro era hobby. El hada y el mago, pero al revés: acá el mago se fue y el hada se quedó cobrando entrada. Esperanza enviudó del primer Encargado... y del segundo. Empezamos a sospechar en el tercero.',
    'Última verdad, y no se la conté a nadie: el dungeon se regenera porque el Bardo sigue escribiendo niveles ahí abajo. Vos no estás explorando, querido. Estás siendo escrito. Como un GM loco de Helbreath que no suelta el server. ...¿Un mate?',
    'Yapa histórica: antes del teatro, esto era un fuerte. Los planos pedían un Castillo: 650 de piedra. La piedra nunca alcanzó, obvio. Por eso todo se cae a pedazos: quisimos llegar a la Edad Imperial con economía de Edad Oscura.',
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
      'Un monje pasó una vez gritando WOLOLO. Tres esqueletos se cambiaron de bando y se fueron con él. Nunca más los vimos. Pensalo.',
      'Dicen que si tocás siete veces el oro del marcador, aparece Robin Hood. Dicen, eh. Yo no probé nada.',
      'Hay una rata blanca dando vueltas por los niveles. No es una rata más: dicen que si la encontrás, suena un solo de guitarra y llueve oro. Mujer amante, la leyenda continúa.',
      'Yo iba a ir al mundial, ¿sabés? USA 26, la Scaloneta, todo armado. Pero el dungeon no te da vacaciones. Si la ves levantar la copa, gritá un gol por mí.',
      'Anoche soñé que tocaba con Helloween en Cancún. Tobias Sammet de invitado, tequila en el escenario. Desperté acá, con un esqueleto mirándome. La vida es injusta, querido.',
      '¿Sabías que abajo del nivel 30 hay una pista de baile? Quedó del Tiger Tiger original. Los fantasmas todavía hacen la fila para entrar. Algunos hábitos no mueren ni muertos.',
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

  // ---- La Nona: te alimenta, te bardea con amor, y su historia crece con las visitas ----
  function nonaTalk() {
    const p = P(), visitas = D().nona || 0;
    // cierre del arco: le contaste del nieto
    if (D().nietoVisto && !D().nonaSabe) {
      D().nonaSabe = 1; MZ.save.store();
      p.hp = p.maxHp; p.maxHp += 5; p.hp = p.maxHp; p.poison = 0;
      MZ.audio.mate(); MZ.fx.flash(0.3, 0xb088dd); MZ.ui.updateHUD();
      return node('La Nona', 0xb088dd,
        '¿...Tato? ¿Viste a mi Tato? ¿Está vivo? ¿Está comiendo bien?\n\n*revuelve el guiso para disimular que llora*\n\nVeinte años, querido. Veinte años con el plato puesto en la mesa.\n\nTomá. Guiso doble. Y esto es para vos: la receta de la fuerza de la familia. (+5 HP máx, curado entero)\n\nSi lo ves de nuevo... decile que el guiso está donde siempre.', null);
    }
    const guiso = () => {
      D().nona = visitas + 1; MZ.save.store();
      p.hp = p.maxHp; p.poison = 0;
      if (visitas === 2) { p.maxHp += 3; p.hp = p.maxHp; }
      MZ.audio.mate(); MZ.ui.updateHUD();
    };
    const textos = [
      '¿Y vos quién sos? Ay, no importa, estás flaco. Sentate que hay guiso. EN ESTA CASA NADIE EXPLORA CON LA PANZA VACÍA.',
      'Volviste. Sabía. Todos vuelven donde se come bien. Mi nieto también bajó a esta mazmorra, ¿sabés? Hace veinte años. Seguro anda por el nivel ochenta, es muy dedicado.',
      'Hoy te cuento algo: el Bardo Fundador venía a comer acá todos los domingos. Un día me quiso pagar con un poema. Le di con la cuchara de palo. Pagó con oro, como la gente. (+3 HP máx, ya sos de la familia)',
      'Comé y escuchá: si ves a mi nieto ahí abajo —alto, lindo, con armadura— decile que la nona no está enojada. Mentira, decile que está RE enojada. Veinte años sin escribir, el muy turro.',
    ];
    const idx = Math.min(visitas, textos.length - 1);
    return node('La Nona', 0xb088dd, textos[idx], [
      {
        label: visitas === 0 ? 'Sentarse a comer' : 'El guiso, Nona, el guiso',
        fn() {
          guiso();
          return node('La Nona', 0xb088dd,
            visitas >= 3
              ? 'Curado entero. Y llevate un tupper, que allá abajo no se consigue nada decente.'
              : 'Curado entero. ¿Viste? Mejor que cualquier poción esa porquería violeta que venden por ahí.', null);
        },
      },
      { label: 'No tengo hambre (mentira)', fn: () => node('La Nona', 0xb088dd, '¿No tenés hambre? A ver, mirame a los ojos... Lo que yo decía: flaco Y mentiroso. Andá, andá a tu mazmorra.', null) },
    ]);
  }

  // ---- El Tahúr: doble o nada, con dados cargados de carisma ----
  function tahurTalk() {
    const p = P();
    const apostar = (monto) => {
      p.gold -= monto;
      const gana = Math.random() < 0.48; // la casa siempre tiene ventaja, obvio
      if (gana) {
        p.gold += monto * 2;
        MZ.audio.gold(); MZ.ui.updateHUD();
        return node('El Tahúr', 0xffd700,
          'Doble seis. GANASTE. Tomá tu plata... y andate antes de que me arrepienta. Esto no me pasaba desde la noche que perdí el Tiger Tiger entero a los dados. Linda época.', null);
      }
      MZ.audio.hurt(); MZ.ui.updateHUD();
      return node('El Tahúr', 0xffd700,
        'Uy. Dos y uno. La mesa lo lamenta profundamente (yo no). Te invitaría un tequila de consuelo, pero el último me lo tomé en el 98. Volvé con más... optimismo.', null);
    };
    const choices = [];
    if (p.gold >= 20) choices.push({ label: 'Apostar 20 de oro', fn: () => apostar(20) });
    if (p.gold >= 100) choices.push({ label: 'Apostar 100 (a lo grande)', fn: () => apostar(100) });
    if (p.gold > 0 && p.gold < 20) choices.push({ label: 'Apostar lo que tengo (' + p.gold + ')', fn: () => apostar(p.gold) });
    if (p.gold >= 30) choices.push({
      label: '🔫 Ruleta rusa — 30 oro (5/6 triplicás, 1/6 quedás en 1 HP)',
      fn() {
        p.gold -= 30;
        if (Math.random() < 5 / 6) {
          p.gold += 90;
          MZ.audio.gold(); MZ.fx.flash(0.2, 0xffd700); MZ.ui.updateHUD();
          return node('El Tahúr', 0xffd700, MZ.quote('ruletaGana'), null);
        }
        p.hp = 1;
        MZ.audio.death(); MZ.fx.shake(12); MZ.fx.flash(0.45, 0xff0033); MZ.ui.updateHUD();
        return node('El Tahúr', 0xffd700, MZ.quote('ruletaPierde'), null);
      },
    });
    choices.push({ label: 'Con el juego no, gracias', fn: () => node('El Tahúr', 0xffd700, 'Un hombre sabio. Aburrido, pero sabio. Igual acá te espero: todos vuelven a la mesa.', null) });
    return node('El Tahúr', 0xffd700,
      p.gold > 0
        ? 'Pero mirá quién llegó: oro fresco. Digo, un aventurero. Doble o nada, reglas de la casa: vos ponés la plata, yo pongo los dados. ¿Qué puede salir mal?'
        : 'Sin oro no hay juego, amigo. Andá a sacudir unos esqueletos y volvé, que la mesa no cierra nunca.',
      choices);
  }

  // ---- Fierrito el herrero: mejoras de equipo que el mercader no hace ----
  function herreroTalk(npc) {
    const p = P(), d = MZ.state.depth;
    const cVeneno = 45 + d * 2, cEscudo = 35 + d * 2, cTemple = 30 + d * 2;
    const menu = (text) => {
      const choices = [];
      if (p.melee && !p.melee.veneno && !npc.didVeneno) choices.push({
        label: `Untar ${p.melee.name} con veneno — ${cVeneno} oro`,
        fn() {
          if (p.gold < cVeneno) return menu('Sin oro no hay química, maestro.');
          p.gold -= cVeneno; p.melee.veneno = true; npc.didVeneno = true;
          MZ.audio.pickup(); MZ.ui.updateHUD();
          return menu('Listo. Receta de la abuela de un cocodrilo. No lo lamas.');
        },
      });
      if (p.shield && !npc.didEscudo) choices.push({
        label: `Reforzar ${p.shield.name} (DEF +1) — ${cEscudo} oro`,
        fn() {
          if (p.gold < cEscudo) return menu('El hierro está carísimo. Culpa de los jefes, que acaparan todo.');
          p.gold -= cEscudo; p.shield.def += 1; MZ.recalcStats(); npc.didEscudo = true;
          MZ.audio.pickup(); MZ.ui.updateHUD();
          return menu('Reforzado. Ahora aguanta hasta un casamiento de familia.');
        },
      });
      if (p.melee && !npc.didTemple) choices.push({
        label: `Templar ${p.melee.name} (ATK +1) — ${cTemple} oro`,
        fn() {
          if (p.gold < cTemple) return menu('¿Templar gratis? Ni a mi vieja.');
          p.gold -= cTemple; p.melee.atk += 1; MZ.recalcStats(); npc.didTemple = true;
          MZ.audio.pickup(); MZ.ui.updateHUD();
          return menu('Templada al rojo. Cortás un suspiro al medio.');
        },
      });
      if (!p.melee) choices.push({ label: '(Estás a piñas: conseguí un arma primero)', fn: () => menu('¿A piñas? Respeto. Pero traeme un fierro y hablamos en serio.') });
      choices.push({ label: 'Sigo viaje', fn: null });
      return node('Fierrito', 0x9aa5b1, text, choices);
    };
    return menu('Fierrito, herrero. Antes hacía espadas de utilería para el teatro. Ahora hago de las otras. Irónico, ¿no? ¿Qué te mejoro?');
  }

  // ---- Intro narrada al inicio de cada partida ----
  const INTROS = [
    'Hace cien años, esto era el Gran Teatro Subterráneo del Bardo Fundador. Mil butacas. Terciopelo. Acomodadores con moñito.\n\nHoy es un pozo maldito lleno de críticos de teatro convertidos en monstruos.\n\nY vos bajás igual, porque el viaje a Cancún quedó en "lo vemos el año que viene". Respeto.',
    'Podrías estar en USA siguiendo a la Scaloneta campeona, banderazo, hotel, todo.\n\nPero no. Estás acá, bajando a un pozo maldito con un cuchillo de asado.\n\nBueno, esto también es defender la copa, si lo pensás con cariño. Bajá.',
    'El Bardo Fundador vendió su alma por funciones eternas. La letra chica decía que el público lo iba a querer matar para siempre.\n\nVos sos el público.\n\nLa función está por empezar. Y de telonera: la oscuridad eterna. Bajá.',
    'Capítulo {r} de tu desgracia.\n\nLa mazmorra se reescribió esta noche: niveles nuevos, monstruos con hambre, oro sin dueño. Como un server de Helbreath recién wipeado, pero acá el PK sos vos.\n\nLo único que no cambia: vos, bajando otra vez como si la última no hubiera terminado mal.',
    'Aviso del Gremio de Bardos: la gestión no se hace responsable por muertes, envenenamientos, corazones rotos por brujas, deudas con el Tahúr, ni resacas de tequila del nivel 7.\n\nFirme acá abajo... bueno, con bajar alcanza. Suerte, crack.',
    'Esto era una noche de Tiger Tiger: luces, humo, la previa eterna.\n\nDespués alguien gritó "¡última canción!" hace cien años y nunca terminó.\n\nAbajo todavía suena. Bajá y fijate quién quedó en la pista.',
  ];

  MZ.showIntro = function () {
    const runs = D().runs || 1;
    // la primera vez siempre la fundacional; después rota
    const i = runs <= 1 ? 0 : 1 + Math.floor(Math.random() * (INTROS.length - 1));
    const text = INTROS[i].replaceAll('{r}', runs);
    MZ.dialog.open(node('El Bardo (narrador)', 0x66aaff, text, [
      { label: runs <= 1 ? 'Bajar a la mazmorra' : 'Bajar de una vez', fn: null },
    ]));
  };

  // ---- El Crítico: el único que sigue humano, y te reseña EL RUN ----
  function criticoTalk() {
    const p = P(), d = D(), depth = MZ.state.depth;
    const estrellas = Math.min(5, 1 + Math.floor(depth / 8) + (p.kills > 15 ? 1 : 0) + (d.deaths < 5 ? 1 : 0));
    const reseñas = [
      `"${'★'.repeat(estrellas)}${'☆'.repeat(5 - estrellas)}. El protagonista muestra carisma limitado pero insistencia admirable. ${p.kills} bajas al nivel ${depth}: correcto, no brillante."`,
      `"${'★'.repeat(estrellas)}${'☆'.repeat(5 - estrellas)}. Vi mejores entradas al nivel ${depth}, pero también vi ${d.deaths} muertes de este mismo actor, así que bajemos las expectativas."`,
      `"${'★'.repeat(estrellas)}${'☆'.repeat(5 - estrellas)}. El uso del ${p.melee ? p.melee.name : 'puño pelado'} es... una decisión artística. Audaz. Cuestionable. Como todo acá."`,
    ];
    return node('El Crítico', 0xccaa66,
      'Sí, soy humano todavía. La maldición no me agarra: para maldecir a un crítico hace falta que PRIMERO le importe algo.\n\n¿Querés la reseña de tu run? Es gratis. La dignidad la pagás vos.',
      [
        {
          label: 'Dale, reseñame', fn() {
            const r = reseñas[Math.floor(Math.random() * reseñas.length)];
            if (estrellas >= 4) { p.gold += 40; MZ.audio.gold(); MZ.ui.updateHUD(); }
            return node('El Crítico', 0xccaa66,
              r + (estrellas >= 4 ? '\n\n...Está bien, me gustó. Tomá 40 de oro del fondo de prensa. No se lo cuentes a nadie.' : '\n\nVolvé cuando tengas más nivel. Literal.'), null);
          },
        },
        { label: 'Mi run no se toca', fn: () => node('El Crítico', 0xccaa66, 'Sensible al feedback. Anotado para la reseña final.', null) },
      ]);
  }

  // ---- DJ Tigre: el DJ fantasma del Tiger Tiger ----
  function djtigreTalk() {
    const p = P();
    return node('DJ Tigre', 0xff8800,
      'EHHH, ¿QUÉ HACE LA GENTE? Bienvenido a la sucursal subterránea del Tiger Tiger. La última función nunca terminó, papá: acá abajo seguimos dándole.\n\n¿Te pongo un tema?',
      [
        {
          label: 'Mandale power metal', fn() {
            p.hp = p.maxHp; p.poison = 0;
            const buff = Math.random() < 0.3;
            if (buff) { p.baseAtk += 1; MZ.recalcStats(); }
            MZ.audio.secret(); MZ.fx.flash(0.3, 0xff8800); MZ.ui.updateHUD();
            MZ.easter.disco && MZ.fx.shake(3);
            return node('DJ Tigre', 0xff8800,
              buff
                ? '*suena Helloween a un volumen ilegal*\n\n¡ESO! Curado entero Y con la sangre arriba: +1 ATK. El power metal es medicina, después del guiso de la Nona obvio.'
                : '*suena Rata Blanca, la gente (los esqueletos) rugen*\n\nCurado entero, papá. La leyenda continúa. Volvé cuando quieras, la pista nunca cierra.', null);
          },
        },
        {
          label: 'Una lenta, vengo golpeado', fn() {
            p.hp = p.maxHp; p.poison = 0;
            MZ.audio.mate(); MZ.ui.updateHUD();
            return node('DJ Tigre', 0xff8800,
              '*suena una power ballad de Edguy*\n\nCurado entero. Llorá tranquilo que acá nadie juzga: los fantasmas también extrañan.', null);
          },
        },
      ]);
  }

  // ---- Tato, el nieto de la Nona: cierre de un arco de 20 años ----
  function nietoTalk() {
    const p = P();
    return node('Tato, el Perdido Hace 20 Años', 0xc0c8d0,
      '¿Vos... vos venís de arriba? ¿En serio? Yo bajé hace veinte años a buscar fama y... me perdí. El dungeon se regenera, ¿viste? Nunca encontré la salida.\n\nPará. ¿Conocés a mi nona? ¿ESTÁ BIEN? ¿Sigue haciendo el guiso?',
      [
        {
          label: 'Está bien. Y está RE enojada.', fn() {
            MZ.save.data.nietoVisto = 1;
            MZ.save.store();
            MZ.logros.check('nieto');
            p.maxHp += 4; p.hp = Math.min(p.maxHp, p.hp + 4);
            p.gold += 60;
            MZ.recalcStats(); MZ.audio.secret(); MZ.ui.updateHUD();
            return node('Tato, el Perdido Hace 20 Años', 0xc0c8d0,
              'Veinte años y sigue enojada... sí, es ella. Tomá: mi reserva de oro y mi amuleto, ya no los necesito. Voy a subir. Voy a ir a comer ese guiso aunque me cueste la vida.\n\n(+4 HP máx, +60 oro)\n\nDecile que voy. Que ponga un plato más.', null);
          },
        },
        {
          label: '¿Veinte años y no encontraste la SALIDA?', fn() {
            MZ.save.data.nietoVisto = 1;
            MZ.save.store();
            MZ.logros.check('nieto');
            p.gold += 60;
            MZ.audio.gold(); MZ.ui.updateHUD();
            return node('Tato, el Perdido Hace 20 Años', 0xc0c8d0,
              '¡EL DUNGEON SE REGENERA! ¡No es tan fácil! ...Bueno, sí, también me quedé jugando al Helbreath en una sala secreta que tiene wifi. VEINTE AÑOS SE PASAN VOLANDO, ¿OK?\n\nTomá 60 de oro y no me juzgues.', null);
          },
        },
      ]);
  }

  // ---- El Bardo Fundador: nivel 50, la última función ----
  function fundadorTalk() {
    const p = P();
    D().fundadorVisto = 1;
    MZ.save.store();
    return node('El Bardo Fundador', 0xffd700,
      'Cincuenta niveles. Nadie había llegado tan lejos desde... bueno, desde nunca. Bravo. BRAVO.\n\nYo soy el que escribe esto, ¿sabés? Cada nivel, cada rata, cada frase picante que te tiró el narrador. Cien años escribiendo para un teatro vacío.\n\nY de golpe... público.',
      [
        {
          label: 'La función estuvo buenísima, maestro', fn() {
            p.maxHp += 10; p.hp = p.maxHp;
            p.baseAtk += 2; p.gold += 500;
            MZ.recalcStats(); MZ.audio.secret(); MZ.ui.updateHUD();
            MZ.fx.flash(0.5, 0xffd700);
            MZ.logros.check();
            return node('El Bardo Fundador', 0xffd700,
              '*se seca una lágrima con la capa*\n\nTomá: la Bendición del Fundador. +10 HP máx, +2 ATK, 500 de oro. El teatro es tuyo, pibe.\n\nAh, ¿la salida? No existe. Pero el aplauso tampoco se termina: de acá para abajo es función continuada. Seguí bajando, estrella.', null);
          },
        },
        {
          label: 'Cien años bardeándome... ¿y AHORA sos amable?', fn() {
            p.maxHp += 10; p.hp = p.maxHp;
            p.baseAtk += 2; p.gold += 500;
            MZ.recalcStats(); MZ.audio.secret(); MZ.ui.updateHUD();
            MZ.fx.flash(0.5, 0xffd700);
            MZ.logros.check();
            return node('El Bardo Fundador', 0xffd700,
              'El bardeo ES amor, querido. ¿Quién te acompañó cincuenta niveles? ¿Quién te dijo "F" en cada muerte? Eso es compromiso artístico.\n\nTomá la Bendición igual: +10 HP máx, +2 ATK, 500 de oro. Y seguí bajando, que el teatro no se termina nunca... como el bardeo.', null);
          },
        },
      ]);
  }

  MZ.LORE = {
    mercader: { talk: (npc) => mercaderMenu(npc, ['Pasá, pasá. Todo lo que ves se cayó de un camión. El camión de otra mazmorra.', '¿Qué hacés, pibe? Mercadería fresca... bueno, fresca para estar en un pozo maldito.', 'Don Olivera, para servirte. Acepto oro. No acepto quejas ni devoluciones.', 'Necesitamos más oro. Vos, yo, todos. Es la economía, pibe: desde el Age que es así.'][Math.floor(Math.random() * 4)]) },
    morena: { talk: morenaTalk },
    bardo: { talk: bardoTalk },
    rodrigo: { talk: rodrigoTalk },
    esperanza: { talk: esperanzaTalk },
    nona: { talk: nonaTalk },
    tahur: { talk: tahurTalk },
    herrero: { talk: (npc) => herreroTalk(npc) },
    nieto: { talk: nietoTalk },
    fundador: { talk: fundadorTalk },
    critico: { talk: criticoTalk },
    djtigre: { talk: djtigreTalk },
  };
})();
