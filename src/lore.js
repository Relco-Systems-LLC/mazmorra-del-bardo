// Lore escrito a mano: NPCs con historia, quests secundarias, romance y picante.
window.MZ = window.MZ || {};
(() => {
  const P = () => MZ.state.player;
  const D = () => MZ.save.data;
  const node = (name, color, text, choices) => ({ name, color, text, choices });

  // ---- La quest madre: el Pasaporte de la Gira (5 sellos, uno por acto) ----
  const SELLOS = [
    { key: 'previa', n: 'Sello de La Previa', boss: 10 },
    { key: 'tailandia', n: 'Sello de Tailandia', boss: 20 },
    { key: 'florida', n: 'Sello de Florida', boss: 30 },
    { key: 'ruta', n: 'Sello de La Ruta', boss: 40 },
    { key: 'mansion', n: 'Sello de La Mansión', boss: 45 },
  ];
  MZ.sellos = {
    defs: SELLOS,
    data() { const d = D(); d.sellos = d.sellos || {}; return d.sellos; },
    count() { const s = this.data(); return SELLOS.filter(x => s[x.key]).length; },
    has(key) { return !!this.data()[key]; },
  };

  // ---- Sistema de quests del run ----
  MZ.quests = {
    run: {},
    reset() {
      this.run = { anillo: null, venganza: null, espOferta: false, brisaPend: null };
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
      const depth = MZ.state ? MZ.state.depth : 0;
      const v = this.run.venganza;
      if (v && v.stage === 'activa') {
        v.stage = 'cumplida';
        setTimeout(() => MZ.ui.toast('Venganza cumplida. La viuda te va a estar esperando...', 3500), 1800);
      }
      // sello de acto: la azafata te busca en el próximo piso
      const s = SELLOS.find(x => x.boss === depth);
      if (s && !MZ.sellos.has(s.key)) {
        this.run.brisaPend = s.key;
        setTimeout(() => MZ.ui.toast('✈ Alguien con uniforme te anda buscando ahí abajo...', 3500), 2600);
      }
    },
  };

  // Qué NPCs aparecen en cada nivel. Regla: nunca 2 iguales en el mismo piso.
  MZ.pickNpcsForLevel = function (depth, isBoss) {
    const Q = MZ.quests.run;
    const out = [];
    const add = (t) => { if (!out.includes(t)) out.push(t); }; // dedup: máx 1 de cada tipo
    if (depth === 50) { add('fundador'); return out; } // el camarín del Mánager
    if (Q.brisaPend && !isBoss) add('brisa'); // sello pendiente: la azafata te encuentra
    if (Q.anillo && Q.anillo.stage === 'tengo') add('rodrigo');
    if (Q.venganza && Q.venganza.stage === 'cumplida' && !isBoss) add('esperanza');
    // Tato, el mochilero perdido: una sola vez (histórico), bien abajo, si conocés a la Nona
    if (!isBoss && depth >= 12 && (D().nona || 0) >= 2 && !D().nietoVisto && Math.random() < 0.3) {
      add('nieto');
    }
    if (isBoss) return out;
    add('mercader'); // SIEMPRE exactamente 1 mercader por piso
    if (depth % 5 === 4 && !Q.venganza && !Q.espOferta) add('esperanza');
    // Pool de servicio (sin mercader ni morena: esos tienen reglas propias).
    // Base estable de la gira + el elenco de cada parada (acto de 10 niveles).
    const pool = ['bardo', 'tahur'];
    if (depth >= 2) pool.push('nona');
    if (depth >= 4) pool.push('herrero');
    if (depth >= 5) pool.push('critico');
    if (depth >= 6) pool.push('dt', 'groupie', 'gato');
    if (depth >= 8) pool.push('djtigre');
    if (depth >= 3 && !Q.anillo) pool.push('rodrigo');
    const acto = Math.floor((depth - 1) / 10) % 5;
    if (acto === 1) pool.push('nuan', 'monje', 'tuktukero', 'lola', 'mochilero', 'tatuador', 'chamana');
    if (acto === 2) pool.push('heladero', 'influencer', 'fotografo', 'cocodrilo', 'tuktukero');
    if (acto === 3) pool.push('pitmaster', 'cowboy', 'porrista', 'camionero', 'elvis', 'chamana');
    if (acto === 4) pool.push('mucama', 'jardinero', 'detective', 'cuervo', 'groupie');
    // 2–4 NPCs desde nivel 2; nivel 1 casi vacío. Dedup natural por add().
    const want = depth < 2
      ? (Math.random() < 0.6 ? 1 : 0) + (Math.random() < 0.3 ? 1 : 0)
      : 2 + (Math.random() < 0.6 ? 1 : 0) + (Math.random() < 0.35 ? 1 : 0);
    let guard = 0;
    while (out.filter(t => t !== 'mercader' && t !== 'morena' && t !== 'brisa').length < want && guard++ < 30) {
      add(pool[Math.floor(Math.random() * pool.length)]);
    }
    // Morena es RARA: máx 1, 5% de chance por piso, desde nivel 4.
    if (depth >= 4 && Math.random() < 0.05) add('morena');
    return out;
  };

  // ---- El Buhonero, mercader de gira (todo salió de la gabardina) ----
  function mercaderMenu(npc, text) {
    const p = P(), d = MZ.state.depth;
    // mercado negro: todo a mitad de precio
    const k = MZ.state.evento === 'mercado' ? 0.5 : 1;
    const cHierba = Math.ceil(15 * k), cFilo = Math.ceil((30 + d * 2) * k),
      cChaleco = Math.ceil((40 + d * 2) * k), cGomera = Math.ceil((25 + d) * k),
      cMapa = Math.ceil((20 + d) * k);
    const choices = [];
    choices.push({
      label: `Hierba verde (+12 HP, cura veneno) — ${cHierba} oro`,
      fn() {
        if (p.gold < cHierba) return mercaderMenu(npc, '¿Sin oro, forastero? Ahh, no no no. Volvé cuando tengas.');
        p.gold -= cHierba;
        p.hp = Math.min(p.maxHp, p.hp + 12);
        p.poison = 0;
        MZ.audio.pickup(); MZ.ui.updateHUD();
        return mercaderMenu(npc, 'Hierba fresca de la mansión. Si te hace efecto raro, era de la otra maceta.');
      },
    });
    const cGranada = Math.ceil((18 + d) * k);
    choices.push({
      label: `💣 Granadas de la casa (×2, máx ${MZ.GRENADE_MAX} en mano) — ${cGranada} oro`,
      fn() {
        if (p.gold < cGranada) return mercaderMenu(npc, 'Las granadas no se fían, forastero. Ni a vos.');
        if (MZ.grenadeCount(p) >= MZ.GRENADE_MAX) return mercaderMenu(npc, 'Ya llevás las manos llenas, campeón. Tirá alguna primero, después hablamos.');
        p.gold -= cGranada;
        MZ.addGrenade(p, 'frag', 2);
        MZ.codex.discover('arsenal', 'granadaFrag');
        MZ.audio.pickup(); MZ.ui.updateHUD();
        return mercaderMenu(npc, 'Ahí tenés. No preguntes de qué guerra sobraron, que me pongo nostálgico.');
      },
    });
    if (MZ.state.mapaVenta && !MZ.state.mapaActivo) choices.push({
      label: `🗺 Itinerario del piso (minimapa) — ${cMapa} oro`,
      fn() {
        if (p.gold < cMapa) return mercaderMenu(npc, 'El itinerario cuesta. Sin oro andás a ciegas, como la gira.');
        p.gold -= cMapa;
        MZ.ui.updateHUD();
        MZ.activarMapa();
        return mercaderMenu(npc, 'Dibujado por mí, de memoria, de noche. No te confíes de las medidas.');
      },
    });
    if (!npc.soldSword) choices.push({
      label: `Afilar el arma (ATK +1) — ${cFilo} oro`,
      fn() {
        if (p.gold < cFilo) return mercaderMenu(npc, 'Con esas monedas no afilo ni un escarbadientes.');
        p.gold -= cFilo; p.baseAtk += 1; MZ.recalcStats();
        npc.soldSword = true;
        MZ.audio.pickup(); MZ.ui.updateHUD();
        return mercaderMenu(npc, 'Filo de gira: corta hasta contratos. Tratá de no tocarlo.');
      },
    });
    if (!npc.soldVest) choices.push({
      label: `Chaleco de cuero de gira (DEF +1) — ${cChaleco} oro`,
      fn() {
        if (p.gold < cChaleco) return mercaderMenu(npc, 'El cuero está caro, forastero. La inflación llegó hasta el pozo.');
        p.gold -= cChaleco; p.baseDef += 1; MZ.recalcStats();
        npc.soldVest = true;
        MZ.audio.pickup(); MZ.ui.updateHUD();
        return mercaderMenu(npc, 'Cuero legítimo, usado por una leyenda. ¿Cuál? Secreto profesional.');
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
        return mercaderMenu(npc, 'Con esa rompí el cartel del boliche en el 86. Ahora rompé cabezas.');
      },
    });
    choices.push({ label: 'Chau, Buhonero', fn: null });
    return node('El Buhonero', 0xffd27f, text, choices);
  }

  // ---- Morena, la corista bruja (romance que persiste entre muertes) ----
  function morenaTalk(npc) {
    const p = P(), s = D().morena || 0;
    const save = (n) => { D().morena = n; MZ.save.store(); };

    if (s === 0) return node('Morena', 0xff4cf0,
      'Uy... público fresco. Digo: bienvenido al pozo, aventurero. Yo hacía los coros de la banda, ¿sabés? Y otras cosas que el contrato no menciona. ¿Buscás una poción, un maleficio, o me vas a seguir mirando así?',
      [
        {
          label: 'Tirarle onda', fn() {
            save(1);
            p.hp = Math.min(p.maxHp, p.hp + 10);
            MZ.audio.mate(); MZ.fx.flash(0.2, 0xff4cf0); MZ.ui.updateHUD();
            return node('Morena', 0xff4cf0,
              'Directo al grano. Me gustan los que no le tienen miedo a una bruja con micrófono. Tomá, un besito de muestra. (+10 HP)\n\nVolvé a verme... si sobrevivís al tour, claro.', null);
          },
        },
        {
          label: 'Pedir una poción', fn() {
            p.hp = Math.min(p.maxHp, p.hp + 8); p.poison = 0;
            MZ.audio.pickup(); MZ.ui.updateHUD();
            return node('Morena', 0xff4cf0, 'Tomá, va por la casa. Pero me debés una... y yo las deudas las cobro en camarines.', null);
          },
        },
        { label: 'Irse despacito', fn: null },
      ]);

    if (s === 1) return node('Morena', 0xff4cf0,
      'Volviste. Sabía que no era mi imaginación... Sentate, justo estaba cebando. Sí, acá abajo también se toma mate: la gira era argentina, querido.',
      [
        {
          label: 'Compartir el mate', fn() {
            save(2);
            p.maxHp += 2; p.hp = Math.min(p.maxHp, p.hp + 8); MZ.recalcStats();
            MZ.audio.mate(); MZ.ui.updateHUD();
            return node('Morena', 0xff4cf0,
              'Compartir mate en una gira maldita es casi un casamiento. No te asustes. (+2 HP máx)\n\n...¿O asustate un poco, no sé, me gusta verte dudar.', null);
          },
        },
        { label: 'Hoy no puedo, hay monstruos', fn: () => node('Morena', 0xff4cf0, 'Siempre hay monstruos, querido. Por eso existen los intervalos.', null) },
      ]);

    if (s === 2) return node('Morena', 0xff4cf0,
      'Quedate un rato. Las velas están prendidas, el camarín tiene tranca, hay tequila del bueno —del que traje de Pattaya, no preguntes cómo lo pasé por la aduana— y los zombies hoy no miran.',
      [
        {
          label: 'Quedarse 😏', fn() {
            MZ.audio.mate(); MZ.fx.flash(0.5, 0xff4cf0);
            return node('Morena', 0xff4cf0,
              '████████████████████\n██████████████\n████████████████████\n\n(escena censurada por la Productora)',
              [{
                label: 'Continuar...', fn() {
                  save(3);
                  p.maxHp += 3; p.baseAtk += 1; MZ.recalcStats(); p.hp = p.maxHp; p.poison = 0;
                  MZ.fx.flash(0.3, 0xff4cf0); MZ.audio.secret(); MZ.ui.updateHUD();
                  return node('Morena', 0xff4cf0,
                    'Bendición de Morena: HP máx +3, ATK +1, curado entero... y una sonrisa que no se te va a ir más.\n\nAhora andá a matar cosas, que el camarín no se paga solo.', null);
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
              '█████████████\n(la Productora ya ni se molesta en censurar)\n\n+1 HP máx. El cariño hace bien, está estudiado.', null);
          },
        },
      ]);
  }

  // ---- El Plomo Viejo: la historia de la gira, capítulo a capítulo ----
  const CAPITULOS = [
    '¿Sabés dónde estás parado, pibe? Esto era LA GIRA. La de Acero Eterno, la banda más grande que pisó este continente y tres más. Yo era el plomo: cargué cada parlante de este pozo. Y te juro por mi lumbalgia que la historia merece ser contada.',
    'Todo arrancó en un boliche de barrio: La Previa. Cuatro pibes, una guitarra hacha y un sueño: tocar como Helloween, romper como Rata Blanca, llorar como Edguy. El dueño les dio el escenario un martes a la noche. Llenaron el boliche. Un MARTES.',
    'Ahí apareció ÉL. El Mánager. Traje impecable, sonrisa de tiburón, un contrato más largo que un solo de batería. "Los llevo a una gira mundial", dijo. "Bangkok, Pattaya, Miami, Orlando, Kansas City, Dallas... y un Show Final que va a quedar en la historia."',
    'La letra chica del contrato nadie la leyó. NADIE lee la letra chica, pibe. Decía, entre otras cosas: "la gira termina con el último acorde del Show Final". Guardate ese dato, que después tiene sentido.',
    'El Patovica del boliche no quería que se fueran. "Acá nacieron, acá se quedan", decía, cruzado de brazos en la puerta. Tuvimos que salir por la ventana del baño con los equipos. Un bajo Rickenbacker no pasa por una ventana de baño, ¿sabías? Ahora sí.',
    'El DJ de La Previa juró venganza esa noche. "Si se van, pongo cumbia en su homenaje PARA SIEMPRE". Cumplió, el desgraciado. Por eso está maldito: ni el power metal ni la cumbia lo quieren. Quedó en el medio, como un fade mal hecho.',
    'Bangkok. Calor, templos dorados, y un monje que nos quiso bendecir la gira. El tema es que la bendición la dijo al revés —o eso dice él. Yo creo que la dijo PERFECTA. Algunas maldiciones se disfrazan de bendición, pibe. Como los contratos.',
    'En Bangkok el cantante se compró una navaja mariposa "de recuerdo" y el baterista se tatuó la cara del Mánager en el hombro. Para quererlo, decía. Spoiler: después se tatuó una X encima. El tatuador de acá abajo sigue siendo el mismo, por cierto. Buen tipo.',
    'Pattaya. Mirá, de Pattaya tengo dos versiones: la que le conté a mi señora y la verdadera. Te cuento la del medio: walking street, buckets con sombrillita, una madama que manejaba la noche entera, y el bajista que desapareció tres días. Volvió casado. CASADO.',
    'La noche de Pattaya que no te puedo contar entera: ███████████████ y después ██████████ con dos ███████ y un balde de hielo. La Productora censuró hasta el recuerdo. Lo único que sobrevivió es la sonrisa del cantante en las fotos de esa semana.',
    'El barco a Miami fue idea del Mánager: "volar es caro". Tres semanas en un carguero con un contenedor de parlantes y un cocinero que solo sabía hacer arroz. El power metal en altamar suena distinto. Más triste. Más húmedo.',
    'Miami. Sol, playa, y un salvavidas que no nos dejó meter ni un pie en el agua: "la banda trae tormenta", decía. Tenía razón, pero igual era un hincha. La influencer esa que anda por los pisos de abajo le hizo una nota una vez. Él lloró. Ella subió el video.',
    'En Miami Beach el heladero nos fiaba helado de coco a cambio de entradas. Buen hombre. Su helado curaba resacas que la medicina moderna ni se anima a nombrar. Todavía anda por acá abajo, derritiendo stock. No preguntes por qué sigue frío.',
    'Orlando. El parque. El Ratón. Mirá, el ratón de VERDAD nunca nos vio: contrataron a un trucho de mercado para la foto con la banda. El trucho se tomó el papel TAN en serio que no se sacó más el traje. Ahora es jefe de piso. La vida del artista, pibe.',
    'En el parque de Orlando el guitarrista se subió a la montaña rusa siete veces seguidas y compuso el mejor riff de la gira en la fila de la octava. La fila, pibe. La fila es donde nacen las grandes ideas y mueren los grandes hombres. Mirá los zombies de acá abajo si no.',
    'Después vino la ruta. Kansas City. El pitmaster nos recibió con costillas ahumadas y una pregunta de guerra: "¿esto o el asado argentino?". El cantante dijo "el asado" y nos echó. Volvimos a la noche, pidiendo perdón con la guitarra. Tocamos por costillas. Valió.',
    'El sheriff de Kansas nos multó por: exceso de volumen, exceso de pelo, y "condimentar mal" (sic). Tres multas en una noche. El Mánager las pagó sonriendo. Eso me asustó más que las multas.',
    'Dallas. El rodeo. El toro mecánico. Ocho segundos, pibe: nadie de la banda pasó de tres. El cantante dijo que el toro estaba "claramente poseído". El toro, que ahora es jefe de piso acá abajo, confirma la teoría.',
    'En Dallas un imitador de Elvis nos enseñó algo importante: "no importa ser el original, importa que la gente cante". El cantante lo abrazó llorando. Después le afanó la pose para el resto de la gira. Así es el arte: un robo con cariño.',
    'La porrista de Dallas seguía a la banda con la coreografía completa de tres temas. TRES TEMAS de power metal con pompones. Si eso no es amor al arte, el amor al arte no existe. Por eso anda acá abajo todavía: alentando. A vos, ahora. Aprovechala.',
    'Y entonces, cuando faltaba EL show... el Mánager compró la mansión. "Para la previa del Show Final", dijo. Una mansión vieja, enorme, con un mayordomo que ya estaba incluido en la escritura. Eso no es normal, pibe. Los mayordomos no vienen con la casa.',
    'La mansión tenía un jardinero obsesionado con unas hierbas verdes que "curaban todo" y unas rojas que "potenciaban". Mezclalas, decía, MEZCLALAS. El bajista las mezcló. Vio el futuro. No le gustó. No quiso contar por qué.',
    'En la biblioteca de la mansión había una máquina de escribir que escribía SOLA de noche. Tac, tac, tac. El Mánager decía que era el viento. El viento no redacta contratos, querido. El viento no usa papel carbónico.',
    'La mucama de la mansión sabía TODO. Las mucamas siempre saben todo. Me dijo una noche: "el señor no quiere que la gira termine. Nunca. Revisé su escritorio: el Show Final no tiene fecha. Tiene excusas". Le dije que exageraba. Perdoname, Rosa. Tenías razón.',
    'La noche del Show Final el estadio estaba LLENO. Cien mil almas. La banda afinada, el público rugiendo, yo con la lista de temas pegada al piso con cinta. Y a las 21:47, el Mánager salió al escenario solo y dijo dos palabras: "Se cancela".',
    'No dio razones. No dio reembolsos. La gente NO SE FUE: se quedó esperando. Esperando y esperando. Los días se hicieron años, el estadio se hundió, los escenarios de toda la gira se apilaron uno abajo del otro, y el público... bueno. Ya los viste en la fila, ¿no?',
    'La banda se disolvió ahí mismo, en el escenario, sin tocar una nota. Dicen que el cantante dejó el micrófono parado en el medio, prendido. Dicen que todavía está prendido. Dicen que si llegás al fondo del pozo, todavía hay un acorde colgado en el aire, esperando.',
    'Última verdad, y no se la conté a nadie: encontré la letra chica, pibe. "La gira termina con el último acorde del Show Final". El Mánager canceló el show para que la gira NO TERMINE NUNCA. Cien años cobrando entradas de un show que no pasa. Vos sos el público que faltaba... y el único que puede hacer sonar ese acorde.',
  ];
  MZ.CAPS_TOTAL = CAPITULOS.length;

  function bardoTalk() {
    const p = P(), cap = D().loreCap || 0;
    if (cap < CAPITULOS.length) {
      const ultimo = cap === CAPITULOS.length - 1;
      // primero ofrecer; el lore se muestra recién si elegís escuchar
      return node('El Plomo Viejo', 0x66aaff,
        ultimo
          ? 'Me queda un solo capítulo, el final. La verdad de la gira entera. ¿Te animás a escucharla? (la gorra se agradece)'
          : 'Tengo el capítulo ' + (cap + 1) + ' de la historia de la gira maldita. ¿Te sentás a escuchar? Te dejo 10 de oro por la molestia, que el plomo paga sus deudas.',
        [
          {
            label: ultimo ? 'Escuchar la verdad final' : 'Escuchar el capítulo',
            fn() {
              D().loreCap = cap + 1; MZ.save.store();
              p.gold += 10;
              MZ.audio.gold(); MZ.ui.updateHUD();
              if (ultimo) {
                p.maxHp += 5; p.hp = Math.min(p.maxHp, p.hp + 5); MZ.recalcStats(); MZ.ui.updateHUD();
                return node('El Plomo Viejo', 0x66aaff,
                  CAPITULOS[cap] + '\n\n(Conocer la verdad fortalece: +5 HP máx. Y tomá 10 de oro: la gorra al revés, hoy pago yo.)', null);
              }
              return node('El Plomo Viejo', 0x66aaff,
                CAPITULOS[cap] + '\n\n(Tomá 10 de oro: la gorra al revés, hoy pago yo. Volvé que esto sigue.)', null);
            },
          },
          { label: ultimo ? 'Hoy no, no estoy listo' : 'Ahora no, maestro', fn: null },
        ]);
    }
    const yapas = [
      'Copla de gira: "Bajó valiente el plomero / con su fe y su pasaporte / lo mató un mosquito flaco / antes del primer corte."',
      'Consejo de viejo: a las cobras pegales de lejos. Y a los críticos de rock también.',
      'Si ves una pared con una grieta, pateala. Yo armé la mitad de estos escenarios: es todo decorado, te lo juro.',
      'El Pombero existe. Una vez me afanó la púa y el termo. La púa la repuse, el termo todavía lo lloro.',
      'Un monje pasó una vez gritando algo que sonaba a WOLOLO. Tres zombies se cambiaron de bando y se fueron con él. Nunca más los vimos. Pensalo.',
      'Dicen que si tocás siete veces el oro del marcador, aparece Robin Hood. Dicen, eh. Yo no probé nada.',
      'Hay una rata blanca dando vueltas por los niveles. No es una rata más: dicen que si la encontrás, suena un solo de guitarra y llueve oro. Mujer amante, la leyenda continúa.',
      'El bajista jugaba al PES 6 en cada hotel de la gira. Decía que la media no se discute. Una vez perdió una final con el Estudiantes y no habló por dos días. Respeto.',
      'Esto de bajar y bajar me hace acordar al Helbreath: server recién wipeado, todos en bolas, y un PK esperándote en el portal. Acá el PK sos vos, pibe. Sentite poderoso.',
      'Las hierbas verdes curan y las rojas potencian, dice el jardinero. ¿Y las del hostel? Las del hostel te cuentan la infancia de gente que no conocés. Evitalas.',
    ];
    // de vez en cuando, el Plomo te dibuja el plano del piso
    if (!MZ.state.mapaActivo && Math.random() < 0.12) {
      return node('El Plomo Viejo', 0x66aaff,
        'Esperá, esperá. Yo cablée este piso entero, ¿te conté? Tomá, te dibujo el plano. Cortesía de la casa.',
        [{
          label: 'Gracias, maestro', fn() { MZ.activarMapa(); return null; },
        }, { label: 'No hace falta', fn: null }]);
    }
    return node('El Plomo Viejo', 0x66aaff, yapas[Math.floor(Math.random() * yapas.length)], null);
  }

  // ---- Rodrigo el Casado: la quest del anillo (con twist) ----
  function rodrigoTalk() {
    const p = P(), d = MZ.state.depth, Q = MZ.quests.run;

    if (!Q.anillo) return node('Rodrigo el Casado', 0x9aa5b1,
      `¡Por fin alguien vivo! Escuchame: perdí mi anillo de casamiento allá abajo, nivel ${d + 2} más o menos. Fue en una zona... eh... turística. Si mi señora se entera, me mata más fuerte que cualquier jefe. Traémelo y te pago bien.`,
      [
        {
          label: 'Aceptar la búsqueda', fn() {
            Q.anillo = { stage: 'buscar', target: d + 2 };
            MZ.ui.toast(`Quest: buscá el anillo en el nivel ${d + 2} o más abajo.`, 3500);
            return null;
          },
        },
        {
          label: '¿Y qué hacías VOS ahí abajo?', fn: () => node('Rodrigo el Casado', 0x9aa5b1,
            '...Nada. Turismo. Cultura. Gastronomía local. ACEPTÁ Y NO PREGUNTES.',
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

    if (Q.anillo.stage === 'buscar') return node('Rodrigo el Casado', 0x9aa5b1,
      '¿Y? ¿El anillo? Cada día que pasa mi señora sospecha más. Ayer me preguntó por qué tenía la mano "más liviana". LA MANO MÁS LIVIANA, ¿entendés el nivel de detalle?', null);

    if (Q.anillo.stage === 'tengo') return node('Rodrigo el Casado', 0x9aa5b1,
      '¡EL ANILLO! Dámelo, dámelo... eh... esperá. ¿Lo miraste mucho?',
      [
        {
          label: 'Tiene grabado "Para R., con amor, M."', fn() {
            Q.anillo.stage = 'cerrado';
            p.gold += 120;
            MZ.audio.gold(); MZ.ui.updateHUD();
            const extra = (D().morena || 0) >= 2
              ? '\n\n...Pará. ¿Vos también andás con Morena? ...La gira es un pañuelo, hermano.'
              : '';
            return node('Rodrigo el Casado', 0x9aa5b1,
              '...Morena. Es de Morena, ¿está bien? No es lo que parece. Bueno, sí es lo que parece. Tomá 120 de oro y tu silencio.' + extra, null);
          },
        },
        {
          label: 'Devolverlo sin preguntar', fn() {
            Q.anillo.stage = 'cerrado';
            p.gold += 80; p.maxHp += 2; p.hp = Math.min(p.maxHp, p.hp + 2); MZ.recalcStats();
            MZ.audio.gold(); MZ.ui.updateHUD();
            return node('Rodrigo el Casado', 0x9aa5b1,
              'Un caballero. Ya no quedan. Tomá 80 de oro, y que el karma te infle el corazón. (+2 HP máx)', null);
          },
        },
      ]);

    return node('Rodrigo el Casado', 0x9aa5b1, 'Ni una palabra de lo del anillo. NI. UNA. PALABRA.', null);
  }

  // ---- Esperanza, la Viuda: venganza contra el jefe (con coqueteo final) ----
  function esperanzaTalk() {
    const p = P(), Q = MZ.quests.run;

    if (!Q.venganza) return node('Esperanza, la Viuda', 0xff2255,
      'Ese de ahí abajo mató a mi marido. Bueno... técnicamente ERA mi marido antes de convertirse en jefe de piso. La gira nos arruinó a todas, querido. Matalo y te recompenso, guapo.',
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
                  'Uy, no. Vos sos el de Morena. Esa corista ya me afanó dos maridos, no le pienso prestar el tercero.\n\nPero tomá 50 más por el intento, atrevido.', null);
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
                'Un caballero serio. Qué desperdicio. Tomá: el cinturón del difunto. Para algo que sirva. (DEF +1)', null);
            },
          },
        ]);
    }

    return node('Esperanza, la Viuda', 0xff2255, 'Nos vemos el viernes, ¿no? No te hagas el desentendido.', null);
  }

  // ---- La Nona del Hostel: te alimenta, te bardea con amor, y su historia crece ----
  function nonaTalk() {
    const p = P(), visitas = D().nona || 0;
    // cierre del arco: le contaste del nieto
    if (D().nietoVisto && !D().nonaSabe) {
      D().nonaSabe = 1; MZ.save.store();
      p.hp = p.maxHp; p.maxHp += 5; p.hp = p.maxHp; p.poison = 0;
      MZ.audio.mate(); MZ.fx.flash(0.3, 0xb088dd); MZ.ui.updateHUD();
      return node('La Nona del Hostel', 0xb088dd,
        '¿...Tato? ¿Viste a mi Tato? ¿Está vivo? ¿Está comiendo bien?\n\n*revuelve el guiso para disimular que llora*\n\nVeinte años, querido. Veinte años con la cama del hostel hecha, esperándolo.\n\nTomá. Guiso doble. Y esto es para vos: la receta de la fuerza de la familia. (+5 HP máx, curado entero)\n\nSi lo ves de nuevo... decile que el guiso está donde siempre.', null);
    }
    const guiso = () => {
      D().nona = visitas + 1; MZ.save.store();
      p.hp = p.maxHp; p.poison = 0;
      if (visitas === 2) { p.maxHp += 3; p.hp = p.maxHp; }
      MZ.audio.mate(); MZ.ui.updateHUD();
    };
    const textos = [
      '¿Y vos quién sos? Ay, no importa, estás flaco. Sentate que hay guiso. EN ESTE HOSTEL NADIE BAJA CON LA PANZA VACÍA.',
      'Volviste. Sabía. Todos vuelven donde se come bien. Mi nieto también bajó a este pozo, ¿sabés? Hace veinte años, siguiendo a esa banda. Seguro anda por el nivel ochenta, es muy dedicado.',
      'Hoy te cuento algo: la banda entera comía acá los domingos. Una vez el Mánager me quiso pagar con entradas. Le di con la cuchara de palo. Pagó con oro, como la gente. (+3 HP máx, ya sos de la familia)',
      'Comé y escuchá: si ves a mi nieto ahí abajo —alto, lindo, con una mochila gigante— decile que la nona no está enojada. Mentira, decile que está RE enojada. Veinte años sin escribir, el muy turro.',
    ];
    const idx = Math.min(visitas, textos.length - 1);
    return node('La Nona del Hostel', 0xb088dd, textos[idx], [
      {
        label: visitas === 0 ? 'Sentarse a comer' : 'El guiso, Nona, el guiso',
        fn() {
          guiso();
          return node('La Nona del Hostel', 0xb088dd,
            visitas >= 3
              ? 'Curado entero. Y llevate un tupper, que allá abajo no se consigue nada decente.'
              : 'Curado entero. ¿Viste? Mejor que esas hierbas raras que venden por ahí.', null);
        },
      },
      { label: 'No tengo hambre (mentira)', fn: () => node('La Nona del Hostel', 0xb088dd, '¿No tenés hambre? A ver, mirame a los ojos... Lo que yo decía: flaco Y mentiroso. Andá, andá a tu pozo.', null) },
    ]);
  }

  // ---- El Revendedor: doble o nada, con dados cargados de carisma ----
  function tahurTalk() {
    const p = P();
    const apostar = (monto) => {
      p.gold -= monto;
      const gana = Math.random() < 0.48; // la casa siempre tiene ventaja, obvio
      if (gana) {
        p.gold += monto * 2;
        MZ.audio.gold(); MZ.ui.updateHUD();
        return node('El Revendedor', 0xffd700,
          'Doble seis. GANASTE. Tomá tu plata... y andate antes de que me arrepienta. Esto no me pasaba desde la noche que vendí la misma entrada catorce veces. Linda época.', null);
      }
      MZ.audio.hurt(); MZ.ui.updateHUD();
      return node('El Revendedor', 0xffd700,
        'Uy. Dos y uno. La mesa lo lamenta profundamente (yo no). Te invitaría un bucket de consuelo, pero el último me lo tomé en Pattaya. Volvé con más... optimismo.', null);
    };
    const choices = [];
    if (p.gold >= 20) choices.push({ label: 'Apostar 20 de oro', fn: () => apostar(20) });
    if (p.gold >= 100) choices.push({ label: 'Apostar 100 (a lo grande)', fn: () => apostar(100) });
    if (p.gold > 0 && p.gold < 20) choices.push({ label: 'Apostar lo que tengo (' + p.gold + ')', fn: () => apostar(p.gold) });
    if (p.gold >= 30) choices.push({
      label: '🎫 Entrada trucha — 30 oro (5/6 triplicás, 1/6 el patovica te deja en 1 HP)',
      fn() {
        p.gold -= 30;
        if (Math.random() < 5 / 6) {
          p.gold += 90;
          MZ.audio.gold(); MZ.fx.flash(0.2, 0xffd700); MZ.ui.updateHUD();
          return node('El Revendedor', 0xffd700, MZ.quote('ruletaGana'), null);
        }
        p.hp = 1;
        MZ.audio.death(); MZ.fx.shake(12); MZ.fx.flash(0.45, 0xff0033); MZ.ui.updateHUD();
        return node('El Revendedor', 0xffd700, MZ.quote('ruletaPierde'), null);
      },
    });
    choices.push({ label: 'Con el juego no, gracias', fn: () => node('El Revendedor', 0xffd700, 'Un hombre sabio. Aburrido, pero sabio. Igual acá te espero: todos vuelven a la mesa.', null) });
    return node('El Revendedor', 0xffd700,
      p.gold > 0
        ? 'Pero mirá quién llegó: oro fresco. Digo, un aventurero. Yo revendía las entradas de la gira, ¿sabés? Ahora revendo suerte. Doble o nada: vos ponés la plata, yo pongo los dados. ¿Qué puede salir mal?'
        : 'Sin oro no hay juego, amigo. Andá a sacudir unos zombies y volvé, que la mesa no cierra nunca.',
      choices);
  }

  // ---- El Luthier: mejoras de equipo que el Buhonero no hace ----
  function herreroTalk(npc) {
    const p = P(), d = MZ.state.depth;
    const cVeneno = 45 + d * 2, cEscudo = 35 + d * 2, cTemple = 30 + d * 2;
    const menu = (text) => {
      const choices = [];
      if (p.melee && !p.melee.veneno && !npc.didVeneno) choices.push({
        label: `Untar ${p.melee.name} con wasabi del bueno — ${cVeneno} oro`,
        fn() {
          if (p.gold < cVeneno) return menu('Sin oro no hay química, maestro.');
          p.gold -= cVeneno; p.melee.veneno = true; npc.didVeneno = true;
          MZ.audio.pickup(); MZ.ui.updateHUD();
          return menu('Listo. Wasabi de Bangkok, del que hace llorar en dos idiomas. No lo lamas.');
        },
      });
      if (p.shield && !npc.didEscudo) choices.push({
        label: `Reforzar ${p.shield.name} (DEF +1) — ${cEscudo} oro`,
        fn() {
          if (p.gold < cEscudo) return menu('El material está carísimo. Culpa de los jefes, que acaparan todo.');
          p.gold -= cEscudo; p.shield.def += 1; MZ.recalcStats(); npc.didEscudo = true;
          MZ.audio.pickup(); MZ.ui.updateHUD();
          return menu('Reforzado. Ahora aguanta hasta un mosh de power metal.');
        },
      });
      if (p.melee && !npc.didTemple) choices.push({
        label: `Afinar ${p.melee.name} (ATK +1) — ${cTemple} oro`,
        fn() {
          if (p.gold < cTemple) return menu('¿Afinar gratis? Ni a la banda le afinaba gratis.');
          p.gold -= cTemple; p.melee.atk += 1; MZ.recalcStats(); npc.didTemple = true;
          MZ.audio.pickup(); MZ.ui.updateHUD();
          return menu('Afinada en La. Pega con sustain.');
        },
      });
      if (!p.melee) choices.push({ label: '(Estás a piñas: conseguí un arma primero)', fn: () => menu('¿A piñas? Respeto. Pero traeme un fierro y hablamos en serio.') });
      choices.push({ label: 'Sigo viaje', fn: null });
      return node('El Luthier', 0x9aa5b1, text, choices);
    };
    return menu('Luthier de la gira, para servirte. Antes afinaba guitarras; ahora afino cosas que cortan. El oído es el mismo. ¿Qué te mejoro?');
  }

  // ---- Intro narrada al inicio de cada partida ----
  const INTROS = [
    'Hace cien años, la banda más grande del continente hizo la Gira Definitiva: el boliche, Bangkok, Pattaya, Miami, Orlando, Kansas, Dallas... y un Show Final que NUNCA SONÓ.\n\nLos escenarios se hundieron, apilados uno abajo del otro. El público sigue esperando ahí abajo.\n\nVos heredaste una entrada. Bajá.',
    'Podrías estar en Pattaya, tomando de un balde con sombrillita y tomando decisiones cuestionables.\n\nPero no. Estás acá, bajando a un pozo maldito con una zapatilla en la mano.\n\nBueno, esto también es irse de gira, si lo pensás con cariño. Bajá.',
    'Aviso de la Productora: la gestión no se hace responsable por muertes, envenenamientos, corazones rotos por coristas, deudas con el Revendedor, ni resacas de buckets del nivel 14.\n\nFirme acá abajo... bueno, con bajar alcanza. Suerte, crack.',
    'Capítulo {r} de tu desgracia.\n\nEl pozo se reescribió esta noche: pisos nuevos, monstruos con hambre, oro sin dueño. Como un server de Helbreath recién wipeado, pero acá el PK sos vos.\n\nLo único que no cambia: vos, bajando otra vez como si la última no hubiera terminado mal.',
    'Cien mil personas esperaron el Show Final. Esperaron tanto que se les pasó la vida, y siguieron esperando igual.\n\nEn algún lugar del fondo hay un micrófono prendido y un acorde colgado en el aire.\n\nAlguien tiene que ir a buscarlo. Adiviná quién.',
    'Esto era La Previa: luces, humo, la fila dando vuelta a la manzana.\n\nDespués alguien gritó "¡se cancela!" hace cien años y nadie se fue a su casa.\n\nAbajo todavía suena. Bajá y fijate quién quedó en la pista.',
  ];

  MZ.showIntro = function () {
    const runs = D().runs || 1;
    // la primera vez siempre la fundacional; después rota
    const i = runs <= 1 ? 0 : 1 + Math.floor(Math.random() * (INTROS.length - 1));
    const text = INTROS[i].replaceAll('{r}', runs);
    MZ.dialog.open(node('El Plomo (narrador)', 0x66aaff, text, [
      { label: runs <= 1 ? 'Bajar al pozo' : 'Bajar de una vez', fn: null },
    ]));
  };

  // ---- El Crítico de Rock: el único que sigue humano, y te reseña EL RUN ----
  function criticoTalk() {
    const p = P(), d = D(), depth = MZ.state.depth;
    const estrellas = Math.min(5, 1 + Math.floor(depth / 8) + (p.kills > 15 ? 1 : 0) + (d.deaths < 5 ? 1 : 0));
    const reseñas = [
      `"${'★'.repeat(estrellas)}${'☆'.repeat(5 - estrellas)}. El protagonista muestra carisma limitado pero insistencia admirable. ${p.kills} bajas al nivel ${depth}: correcto, no brillante."`,
      `"${'★'.repeat(estrellas)}${'☆'.repeat(5 - estrellas)}. Vi mejores entradas al nivel ${depth}, pero también vi ${d.deaths} muertes de este mismo artista, así que bajemos las expectativas."`,
      `"${'★'.repeat(estrellas)}${'☆'.repeat(5 - estrellas)}. El uso del ${p.melee ? p.melee.name : 'puño pelado'} es... una decisión artística. Audaz. Cuestionable. Como todo acá."`,
    ];
    return node('El Crítico de Rock', 0xccaa66,
      'Sí, soy humano todavía. La maldición no me agarra: para maldecir a un crítico hace falta que PRIMERO le importe algo.\n\nReseñé los siete shows de la gira. Todos con dos estrellas, por principio. ¿Querés la reseña de tu run? Es gratis. La dignidad la pagás vos.',
      [
        {
          label: 'Dale, reseñame', fn() {
            const r = reseñas[Math.floor(Math.random() * reseñas.length)];
            if (estrellas >= 4) { p.gold += 40; MZ.audio.gold(); MZ.ui.updateHUD(); }
            return node('El Crítico de Rock', 0xccaa66,
              r + (estrellas >= 4 ? '\n\n...Está bien, me gustó. Tomá 40 de oro del fondo de prensa. No se lo cuentes a nadie.' : '\n\nVolvé cuando tengas más nivel. Literal.'), null);
          },
        },
        { label: 'Mi run no se toca', fn: () => node('El Crítico de Rock', 0xccaa66, 'Sensible al feedback. Anotado para la reseña final.', null) },
      ]);
  }

  // ---- El Sonidista: te cura con power metal por los monitores ----
  function djtigreTalk() {
    const p = P();
    return node('El Sonidista', 0xff8800,
      'EHHH, ¿QUÉ HACE LA GENTE? Consola del pozo, todo conectado, todo al palo. La última función nunca terminó, papá: acá abajo seguimos haciendo la prueba de sonido.\n\n¿Te mando un tema por los monitores?',
      [
        {
          label: 'Mandale power metal', fn() {
            p.hp = p.maxHp; p.poison = 0;
            const buff = Math.random() < 0.3;
            if (buff) { p.baseAtk += 1; MZ.recalcStats(); }
            MZ.audio.secret(); MZ.fx.flash(0.3, 0xff8800); MZ.ui.updateHUD();
            MZ.easter.disco && MZ.fx.shake(3);
            return node('El Sonidista', 0xff8800,
              buff
                ? '*suena Helloween a un volumen ilegal*\n\n¡ESO! Curado entero Y con la sangre arriba: +1 ATK. El power metal es medicina, después del guiso de la Nona obvio.'
                : '*suena Rata Blanca, la fila entera de zombies ruge*\n\nCurado entero, papá. La leyenda continúa. Volvé cuando quieras, la consola nunca se apaga.', null);
          },
        },
        {
          label: 'Una lenta, vengo golpeado', fn() {
            p.hp = p.maxHp; p.poison = 0;
            MZ.audio.mate(); MZ.ui.updateHUD();
            return node('El Sonidista', 0xff8800,
              '*suena una power ballad de Edguy*\n\nCurado entero. Llorá tranquilo que acá nadie juzga: los fantasmas también extrañan.', null);
          },
        },
      ]);
  }

  // ---- Tato, el mochilero perdido: cierre de un arco de 20 años ----
  function nietoTalk() {
    const p = P();
    return node('Tato, el Mochilero Perdido', 0xc0c8d0,
      '¿Vos... vos venís de arriba? ¿En serio? Yo bajé hace veinte años siguiendo a la banda y... me perdí. El pozo se regenera, ¿viste? Nunca encontré la salida.\n\nPará. ¿Conocés a mi nona, la del hostel? ¿ESTÁ BIEN? ¿Sigue haciendo el guiso?',
      [
        {
          label: 'Está bien. Y está RE enojada.', fn() {
            MZ.save.data.nietoVisto = 1;
            MZ.save.store();
            MZ.logros.check('nieto');
            p.maxHp += 4; p.hp = Math.min(p.maxHp, p.hp + 4);
            p.gold += 60;
            MZ.recalcStats(); MZ.audio.secret(); MZ.ui.updateHUD();
            return node('Tato, el Mochilero Perdido', 0xc0c8d0,
              'Veinte años y sigue enojada... sí, es ella. Tomá: mi reserva de oro y mi amuleto de viaje, ya no los necesito. Voy a subir. Voy a ir a comer ese guiso aunque me cueste la vida.\n\n(+4 HP máx, +60 oro)\n\nDecile que voy. Que ponga un plato más.', null);
          },
        },
        {
          label: '¿Veinte años y no encontraste la SALIDA?', fn() {
            MZ.save.data.nietoVisto = 1;
            MZ.save.store();
            MZ.logros.check('nieto');
            p.gold += 60;
            MZ.audio.gold(); MZ.ui.updateHUD();
            return node('Tato, el Mochilero Perdido', 0xc0c8d0,
              '¡EL POZO SE REGENERA! ¡No es tan fácil! ...Bueno, sí, también me quedé jugando al Helbreath en un cyber de Bangkok que quedó enterrado acá abajo. Tiene wifi, no preguntes cómo. VEINTE AÑOS SE PASAN VOLANDO, ¿OK?\n\nTomá 60 de oro y no me juzgues.', null);
          },
        },
      ]);
  }

  // ---- Brisa, la Azafata: entrega los sellos del pasaporte ----
  function brisaTalk() {
    const p = P(), Q = MZ.quests.run;
    const key = Q.brisaPend;
    const def = SELLOS.find(s => s.key === key);
    if (!def) return node('Brisa, la Azafata', 0xff8800,
      'Señor pasajero, su pasaporte está al día. Siga bajando con cuidado y mantenga los brazos dentro del pozo en todo momento.', null);
    return node('Brisa, la Azafata', 0xff8800,
      'Señor pasajero, buenas noches. Vuelo charter de la gira, tripulación fantasma, servicio completo igual.\n\nMe informan que limpió usted la parada anterior. La aerolínea tiene algo para su pasaporte... y yo tengo cinco minutos de descanso, si quiere aprovecharlos charlando. 😏',
      [
        {
          label: '✈ Recibir el ' + def.n, fn() {
            MZ.sellos.data()[key] = 1;
            Q.brisaPend = null;
            MZ.save.store();
            p.gold += 30;
            const got = MZ.sellos.count();
            MZ.audio.secret(); MZ.fx.flash(0.3, 0xff8800); MZ.ui.updateHUD();
            if (got >= SELLOS.length) MZ.logros.unlock('sellos5');
            return node('Brisa, la Azafata', 0xff8800,
              '*PLAM* — ' + def.n + ' estampado. (' + got + '/' + SELLOS.length + ')\n\nY 30 de oro del fondo de millas, no diga que la aerolínea no da nada.' +
              (got >= SELLOS.length
                ? '\n\nPasaporte COMPLETO, señor pasajero. Con eso, ahí abajo... el del traje no le va a poder decir que no. Hágalo sonar.'
                : '\n\nLe faltan ' + (SELLOS.length - got) + '. Siga coleccionando paradas, que el destino final lo vale.'), null);
          },
        },
        { label: '¿Y esos cinco minutos? 😏', fn: () => node('Brisa, la Azafata', 0xff8800, '█████████ turbulencia █████ y el carrito de bebidas ████████.\n\n(anuncio censurado por la Productora)\n\n...El sello, señor pasajero. No se vaya sin el sello.', null) },
      ]);
  }

  // ---- NPCs de Tailandia ----
  function nuanTalk() {
    const p = P();
    return node('Nuan, la Masajista', 0xff66aa,
      'Sawasdee kha~ Masajes Nuan, los mejores de todo Pattaya y, por hundimiento del local, de todo este pozo. Tiene cara de contractura nivel jefe, señor aventurero.',
      [
        {
          label: 'Masaje tradicional', fn() {
            p.hp = p.maxHp; p.poison = 0;
            MZ.audio.mate(); MZ.ui.updateHUD();
            return node('Nuan, la Masajista', 0xff66aa,
              '*CRACK* *CRUCK* *crack*\n\nListo. Curado entero. Eso que sonó era su columna pidiendo perdón. De nada~', null);
          },
        },
        {
          label: 'Masaje... completo 😏', fn() {
            p.hp = p.maxHp; p.poison = 0;
            MZ.fx.flash(0.3, 0xff66aa); MZ.audio.mate(); MZ.ui.updateHUD();
            return node('Nuan, la Masajista', 0xff66aa,
              '█████████████ aceite tibio ███████ y al final ████████████.\n\n(servicio censurado por la Productora)\n\nCurado entero y con una sonrisa que no se la saca ni un jefe. Vuelva pronto kha~', null);
          },
        },
        { label: 'Solo pasaba a saludar', fn: () => node('Nuan, la Masajista', 0xff66aa, 'Todos "pasan a saludar" primero. Después vuelven caminando como cangrejos. Acá la espero~', null) },
      ]);
  }

  function monjeTalk(npc) {
    const p = P();
    return node('El Monje del Templo', 0xff8822,
      'Joven viajero. Yo bendije la gira hace cien años. Me salió... al revés. O perfecta, según cómo mires el karma. Dejame intentarlo de nuevo con vos, que la práctica hace al monje.',
      [
        {
          label: 'Recibir la bendición', fn() {
            if (npc.blessed) return node('El Monje del Templo', 0xff8822, 'Una bendición por visita, joven. El karma no es un buffet libre.', null);
            npc.blessed = true;
            p.maxHp += 2; p.hp = Math.min(p.maxHp, p.hp + 6); MZ.recalcStats();
            MZ.audio.secret(); MZ.fx.flash(0.3, 0xff8822); MZ.ui.updateHUD();
            return node('El Monje del Templo', 0xff8822,
              '*entona algo grave que suena sospechosamente a WOLOLO*\n\n+2 HP máx y el espíritu planchado. Si en tres pisos te crece una cola, volvé que lo arreglamos.', null);
          },
        },
        { label: '¿Eso fue un "wololo"?', fn: () => node('El Monje del Templo', 0xff8822, 'Es un mantra ancestral. Que convierta gente de bando es pura coincidencia teológica.', null) },
      ]);
  }

  function tuktukeroTalk() {
    const p = P(), d = MZ.state.depth;
    const costo = 15 + d * 2;
    return node('El Tuk-Tukero', 0xffe14d,
      '¡Amigo! ¡AMIGO! ¿A dónde va? Yo lo llevo. Tuk-tuk fantasma, motor eterno, precio especial solo por hoy, solo para usted, mejor precio de todo el pozo.',
      [
        {
          label: `Que me marque la salida — ${costo} oro`, fn() {
            if (p.gold < costo) return node('El Tuk-Tukero', 0xffe14d, '¿Sin oro? Sin oro no hay nafta, amigo. Y la nafta fantasma es CARA.', null);
            if (MZ.state.mapaActivo) { return node('El Tuk-Tukero', 0xffe14d, 'Usted ya tiene el plano, amigo. ¿Me quiere de adorno? El tuk-tuk no es adorno.', null); }
            p.gold -= costo;
            MZ.activarMapa();
            MZ.audio.gold(); MZ.ui.updateHUD();
            return node('El Tuk-Tukero', 0xffe14d,
              '*dibuja el piso entero en una servilleta a 90 km/h*\n\nAhí tiene: plano completo, escalera marcada. El tuk-tuk no baja escaleras, eso sí. Detalle menor.', null);
          },
        },
        { label: 'No gracias (huir del precio especial)', fn: () => node('El Tuk-Tukero', 0xffe14d, '¡AMIGO! ¡Espere! ¡Precio más especial todavía! ...Y se fue. Todos se van. El tuk-tuk es un negocio solitario.', null) },
      ]);
  }

  function lolaTalk() {
    const p = P();
    return node('Lola de Walking Street', 0xff2244,
      'Bienvenido a la sucursal hundida de Walking Street, corazón. Acá la noche nunca terminó: cien años de hora feliz. ¿Un bucket? ¿Compañía? ¿Las dos cosas? 😏',
      [
        {
          label: 'Un bucket — 12 oro', fn() {
            if (p.gold < 12) return node('Lola de Walking Street', 0xff2244, 'Sin oro no hay bucket, mi amor. Esto es Walking Street, no un comedor comunitario.', null);
            p.gold -= 12;
            p.hp = Math.min(p.maxHp, p.hp + 15);
            MZ.poisonPlayer(1, 'el bucket de Lola');
            MZ.audio.mate(); MZ.ui.updateHUD();
            return node('Lola de Walking Street', 0xff2244,
              'Bucket de la casa: cura 15 y cobra 1 de resaca. Salud, corazón. Mañana no te acordás ni del nivel en el que estás.', null);
          },
        },
        {
          label: '¿Y la compañía? 😏', fn: () => node('Lola de Walking Street', 0xff2244,
            'Uy, atrevido. Me gusta.\n\n████████████ y ███████ con brillitos ████████.\n\n(escena censurada por la Productora, que es una mojigata)\n\nVolvé cuando quieras, corazón. Acá la hora feliz es eterna.', null),
        },
        { label: 'Solo miraba las luces', fn: () => node('Lola de Walking Street', 0xff2244, '"Solo miraba las luces" dice. Cien años escuchando esa, corazón. Andá, andá, que el pozo no se baja solo.', null) },
      ]);
  }

  function mochileroTalk() {
    const p = P();
    const frases = [
      'Yo venía por dos semanas. Hace cuánto estoy, no sé. El tiempo es un constructo, ¿ja? Como el itinerario.',
      'En el hostel de arriba conocí a una nona que cocina el mejor guiso del hemisferio. Si la ves, decile que el alemán manda saludos y que SÍ me bañé.',
      'La banda la vi en Bangkok, ¿sabías? Mejor show de mi vida. Después el show final se canceló y dije "bueno, me quedo hasta que lo hagan". Y acá estamos, ¿ja?',
    ];
    return node('El Mochilero Alemán', 0x44ccaa,
      frases[Math.floor(Math.random() * frases.length)],
      [
        {
          label: '¿Tenés un mapa de sobra?', fn() {
            if (MZ.state.mapaActivo) return node('El Mochilero Alemán', 0x44ccaa, 'Ya tenés el plano, amigo. Lo que te falta es rumbo EXISTENCIAL, y eso no se dibuja, ¿ja?', null);
            MZ.activarMapa();
            return node('El Mochilero Alemán', 0x44ccaa, 'Toma: lo dibujé yo. Las distancias están mal pero el espíritu está bien. Como yo, ¿ja?', null);
          },
        },
        { label: 'Suerte, alemán', fn: null },
      ]);
  }

  // ---- NPCs de Florida ----
  function heladeroTalk() {
    const p = P();
    return node('El Heladero de Miami', 0xffaacc,
      'Heladooooo, helado de coco. Cien años en este pozo y el stock sigue frío, no me preguntes cómo porque me asusto. ¿Vas a querer?',
      [
        {
          label: 'Helado de coco — 10 oro', fn() {
            if (p.gold < 10) return node('El Heladero de Miami', 0xffaacc, 'Sin oro no hay coco, papi. La nevera fantasma también tiene gastos.', null);
            p.gold -= 10;
            p.hp = Math.min(p.maxHp, p.hp + 12); p.poison = 0;
            MZ.audio.mate(); MZ.ui.updateHUD();
            return node('El Heladero de Miami', 0xffaacc,
              '+12 HP y te limpia el veneno: el coco perdona todo. La banda me compraba uno cada uno antes de cada show. Menos el día del show final. Mal augurio, los heladeros sabemos.', null);
          },
        },
        { label: 'Hoy no, gracias', fn: () => node('El Heladero de Miami', 0xffaacc, 'Bueno. Pero después no llores cuando el veneno apriete y el coco quede lejos.', null) },
      ]);
  }

  function influencerTalk(npc) {
    const p = P(), d = MZ.state.depth;
    return node('La Influencer', 0xff44aa,
      '¡AY no puede ser, CONTENIDO! Un aventurero real en el pozo real. Esto es ORO para el feed. ¿Posás para una foto? Te pago, obvio, soy profesional.',
      [
        {
          label: 'Posar (cobrar la pauta)', fn() {
            if (npc.foto) return node('La Influencer', 0xff44aa, 'Ya te tengo, bebé. El algoritmo castiga el contenido repetido. Volvé en otro piso con otro look.', null);
            npc.foto = true;
            const g = 20 + d;
            p.gold += g;
            MZ.audio.gold(); MZ.fx.flash(0.25, 0xffffff); MZ.ui.updateHUD();
            return node('La Influencer', 0xff44aa,
              '*FLASH*\n\nPerfecto, salvaje pero tierno. +' + g + ' de oro de pauta.\n\nLo subo apenas vuelva la señal. O sea... nunca. Pero el contenido es eterno, como la gira. 💅', null);
          },
        },
        { label: 'Sin fotos, gracias', fn: () => node('La Influencer', 0xff44aa, 'Respeto tu privacidad. Mentira, te saqué tres mientras hablabas. Pero esas no se pagan, eran "candid". 💅', null) },
      ]);
  }

  function fotografoTalk(npc) {
    const p = P();
    return node('El Fotógrafo del Parque', 0xff6644,
      'Fotos, fotos del parque, salen en el acto. Bueno, salían: el laboratorio se hundió en el 26. Ahora me sobran flashes. ¿Querés uno? Encandilan que da miedo.',
      [
        {
          label: 'Aceptar un flash', fn() {
            if (npc.gave) return node('El Fotógrafo del Parque', 0xff6644, 'Uno por cliente, jefe. Los flashes no crecen en los árboles. Crecen en el laboratorio, que está hundido.', null);
            npc.gave = true;
            const got = MZ.addGrenade(p, 'stun', 1);
            if (got <= 0) {
              p.gold += 10;
              MZ.audio.gold(); MZ.ui.updateHUD();
              return node('El Fotógrafo del Parque', 0xff6644, 'Tenés las manos llenas, jefe. Tomá 10 de oro y fingí que la foto salió bien.', null);
            }
            MZ.codex.discover('arsenal', 'granadaStun');
            MZ.audio.pickup(); MZ.ui.updateHUD();
            return node('El Fotógrafo del Parque', 0xff6644,
              '+1 Flash de Paparazzi. Tiralo al medio de una banda de bichos y mirá cómo posan, paralizados. El arte es eso.', null);
          },
        },
        { label: 'No hace falta', fn: null },
      ]);
  }

  function cocodriloTalk() {
    const p = P(), d = MZ.state.depth;
    return node('Don Cocodrilo', 0x44aa44,
      'Bienvenido al show de cocodrilos de los Everglades, sucursal pozo. El truco es así: metés la mano en la pileta, y si Carlitos está de buenas, sacás el oro que tiró un turista en el 98. ¿Probás? 20 de oro la entrada.',
      [
        {
          label: 'Meter la mano — 20 oro', fn() {
            if (p.gold < 20) return node('Don Cocodrilo', 0x44aa44, 'Sin entrada no hay pileta. Carlitos tiene sus principios.', null);
            p.gold -= 20;
            if (Math.random() < 0.5) {
              p.gold += 60;
              MZ.audio.gold(); MZ.fx.flash(0.2, 0xffd700); MZ.ui.updateHUD();
              return node('Don Cocodrilo', 0x44aa44, '¡Carlitos de buenas! Sacaste 60 de oro y los cinco dedos. Día redondo.', null);
            }
            const bite = Math.min(Math.max(1, p.hp - 1), 4 + Math.floor(d / 4));
            p.hp = Math.max(1, p.hp - bite);
            MZ.audio.hurt(); MZ.fx.shake(8); MZ.ui.updateHUD();
            return node('Don Cocodrilo', 0x44aa44, '*SNAP*\n\nCarlitos de malas: -' + bite + ' HP. La buena noticia: conservás la mano. La mala: Carlitos se queda la entrada.', null);
          },
        },
        { label: 'Carlitos da miedo, paso', fn: () => node('Don Cocodrilo', 0x44aa44, 'Sabia decisión. Carlitos respeta a los cobardes: dice que viven más.', null) },
      ]);
  }

  // ---- NPCs de La Ruta ----
  function pitmasterTalk() {
    const p = P();
    return node('El Pitmaster de Kansas', 0xff5533,
      'Huelo a aventurero golpeado. Sentate, que el ahumador lleva cien años prendido y las costillas están en su punto. Pero antes, la pregunta de rigor: ¿BBQ de Kansas o asado argentino?',
      [
        {
          label: 'El asado, obvio', fn() {
            p.hp = p.maxHp; p.poison = 0;
            MZ.audio.mate(); MZ.ui.updateHUD();
            return node('El Pitmaster de Kansas', 0xff5533,
              '...Respuesta equivocada. Pero respuesta HONESTA, y eso acá vale más.\n\n*te sirve un costillar igual*\n\nCurado entero. La banda dijo lo mismo y los eché. Después volvieron pidiendo perdón con la guitarra. Vos por lo menos no cantás.', null);
          },
        },
        {
          label: 'El BBQ, maestro', fn() {
            p.hp = p.maxHp; p.poison = 0;
            MZ.audio.mate(); MZ.ui.updateHUD();
            return node('El Pitmaster de Kansas', 0xff5533,
              'CORRECTO. *te sirve doble*\n\nCurado entero. Mentiste para comer mejor, lo sé. Está bien: el BBQ también es diplomacia.', null);
          },
        },
      ]);
  }

  function cowboyTalk() {
    const p = P(), Q = MZ.quests.run, d = MZ.state.depth;
    const costo = 30 + d;
    const frases = [
      'La ruta enseña dos cosas, forastero: que el horizonte no se alcanza, y que igual hay que manejar hacia él.',
      'Vi a la banda pasar por esta ruta hace cien años. Iban cantando. Nadie que canta en la ruta está perdido del todo.',
      'El toro mecánico de ahí abajo no está poseído. Está OFENDIDO, que es peor. Ocho segundos, forastero. Nadie aguantó ocho segundos.',
    ];
    const choices = [];
    if (!Q.cowboy) choices.push({
      label: `Comprarle el cinturón de cuero (DEF +1) — ${costo} oro`,
      fn() {
        if (p.gold < costo) return node('El Cowboy Filósofo', 0xd8c8a0, 'El cuero bueno se paga, forastero. Volvé con el oro y hablamos.', null);
        Q.cowboy = true;
        p.gold -= costo; p.baseDef += 1; MZ.recalcStats();
        MZ.audio.pickup(); MZ.ui.updateHUD();
        return node('El Cowboy Filósofo', 0xd8c8a0, 'Cuero de Texas, curtido por el sol y dos divorcios. (+1 DEF) Que te proteja mejor que a mí.', null);
      },
    });
    choices.push({ label: 'Gracias por la charla', fn: null });
    return node('El Cowboy Filósofo', 0xd8c8a0, frases[Math.floor(Math.random() * frases.length)], choices);
  }

  function porristaTalk() {
    const p = P(), Q = MZ.quests.run;
    if (!Q.porrista && p.streak >= 5) {
      Q.porrista = true;
      p.baseAtk += 1; MZ.recalcStats();
      MZ.audio.secret(); MZ.fx.flash(0.3, 0x4488ff); MZ.ui.updateHUD();
      return node('La Porrista de Dallas', 0x4488ff,
        '¡D-A-L-E! ¡DALE DALE DALE! ¡Racha de ' + p.streak + ' y sin despeinarte!\n\n*coreografía completa con pompones*\n\nEso merece el grito sagrado: +1 ATK para siempre. ¡Seguí así, estrella! 📣', null);
    }
    return node('La Porrista de Dallas', 0x4488ff,
      'Yo alentaba a la banda con coreografía propia. Tres temas de power metal con pompones, fijate si tengo compromiso.\n\nAhora te aliento a vos: si venís con una racha de 5 sin que te toquen, tengo un grito sagrado guardado. 📣',
      [{ label: '¡Dame la previa del grito!', fn: () => node('La Porrista de Dallas', 0x4488ff, '¡P-O-Z-O! ¡El pozo no te puede! ...Es la versión gratis. La buena es con racha. 📣', null) }]);
  }

  function camioneroTalk() {
    const p = P(), d = MZ.state.depth;
    const costo = 16 + d;
    return node('El Camionero', 0xcc2222,
      'Llevo carga de Kansas a Dallas hace cien años. El camión ya no arranca, la ruta ya no existe, pero la carga... la carga sigue impecable. ¿Te interesa? Material que "se cayó del camión", por así decirlo.',
      [
        {
          label: `💣 Granadas del cargamento (×2) — ${costo} oro`, fn() {
            if (p.gold < costo) return node('El Camionero', 0xcc2222, 'Sin oro no hay carga, compañero. El flete fantasma también se cobra.', null);
            if (MZ.grenadeCount(p) >= MZ.GRENADE_MAX) return node('El Camionero', 0xcc2222, 'Llevás las manos llenas, compañero. Volvé cuando descargues.', null);
            p.gold -= costo;
            MZ.addGrenade(p, 'frag', 2);
            MZ.codex.discover('arsenal', 'granadaFrag');
            MZ.audio.pickup(); MZ.ui.updateHUD();
            return node('El Camionero', 0xcc2222, 'Ahí van. Si alguien pregunta, vos no me viste y yo no existo. Lo segundo es técnicamente cierto.', null);
          },
        },
        { label: 'Sigo viaje', fn: () => node('El Camionero', 0xcc2222, 'Eso. Viajar liviano. Ojalá alguien me lo hubiera dicho hace cien años y cuarenta toneladas.', null) },
      ]);
  }

  function dtTalk(npc) {
    const p = P(), d = D();
    const media = Math.min(99, 45 + Math.floor(MZ.state.depth * 0.8) + Math.floor(p.kills / 5) + (p.streak >= 5 ? 5 : 0));
    if (!npc.fichado && p.streak >= 8) {
      npc.fichado = true;
      p.gold += 40;
      MZ.audio.gold(); MZ.ui.updateHUD();
      return node('El DT', 0x2a8a2a,
        'Racha de ' + p.streak + '... pibe, eso es jerarquía. En el PES 6 serías carta negra.\n\nTe ficho: tomá 40 de oro de prima. No me hagas quedar mal con la dirigencia (no hay dirigencia, estamos en un pozo, pero el gesto vale).', null);
    }
    return node('El DT', 0x2a8a2a,
      'A ver, parate ahí... caminá... pegale a algo... ajá.\n\nTu media es ' + media + '. En el PES 6 la media no se discute, pibe: se mejora. ' + (media >= 75 ? 'Estás para titular.' : media >= 60 ? 'Banco de primera, con minutos.' : 'Cuarta división, pero con proyección.'),
      [
        { label: '¿Cómo subo la media?', fn: () => node('El DT', 0x2a8a2a, 'Bajá más hondo, matá más bichos, y conseguite una racha de 8 que tengo una prima guardada para los cracks.', null) },
        { label: 'Gracias, míster', fn: null },
      ]);
  }

  // ---- NPCs de La Mansión ----
  function mucamaTalk(npc) {
    const p = P();
    const chismes = [
      'El señor Mánager no duerme. Camina por los pasillos contando entradas que nadie usó. Yo las barro a la mañana. Son SIEMPRE las mismas.',
      'La máquina de escribir de la biblioteca redacta sola. Anoche escribió "cláusula 47" doce veces. Yo ya ni me persigno.',
      'El Mayordomo vino incluido con la mansión. INCLUIDO. Yo por lo menos cobré sueldo alguna vez. Creo. Hace cien años que no miro el recibo.',
      'Si llegás a verlo al señor... preguntale por la fecha del show. Mirale los ojos cuando responda. Ahí está todo, querido.',
    ];
    return node('La Mucama de la Mansión', 0xd8d8e0,
      chismes[Math.floor(Math.random() * chismes.length)],
      [
        {
          label: 'Pedirle que te "cambie las sábanas"', fn() {
            if (npc.cured) return node('La Mucama de la Mansión', 0xd8d8e0, 'Ya te atendí, querido. Esto es una mansión maldita, no un spa.', null);
            npc.cured = true;
            p.hp = p.maxHp; p.poison = 0;
            MZ.audio.mate(); MZ.ui.updateHUD();
            return node('La Mucama de la Mansión', 0xd8d8e0,
              'Sábanas limpias, almohada del lado frío, y un caldo que resucita. Curado entero.\n\nAndá nomás, que yo acá sigo: el polvo de cien años no se barre solo.', null);
          },
        },
        { label: 'Gracias por el chisme', fn: null },
      ]);
  }

  function jardineroTalk() {
    const p = P(), Q = MZ.quests.run;
    if (Q.jardinero) return node('El Jardinero', 0x55ee55,
      'La mezcla es una por temporada, muchacho. El cuerpo humano no está hecho para dos epifanías en una semana.', null);
    return node('El Jardinero', 0x55ee55,
      'Hierba verde cura. Hierba roja potencia. Juntas... *se besa los dedos como un chef* ...juntas son otra cosa. El bajista de la banda probó la mezcla una vez. Vio el futuro. No le gustó, pero qué claridad, ¿no? ¿Querés? 15 de oro los ingredientes.',
      [
        {
          label: 'Mezclar las hierbas — 15 oro', fn() {
            if (p.gold < 15) return node('El Jardinero', 0x55ee55, 'Las hierbas buenas se pagan, muchacho. Las gratis son las del hostel, y esas no las recomiendo.', null);
            Q.jardinero = true;
            p.gold -= 15;
            p.hp = p.maxHp; p.poison = 0; p.maxHp += 1; MZ.recalcStats();
            MZ.audio.secret(); MZ.fx.flash(0.35, 0x55ee55); MZ.ui.updateHUD();
            return node('El Jardinero', 0x55ee55,
              '*mortero, mortero, mortero*\n\nTomá. Verde más roja: curado entero, veneno fuera, +1 HP máx.\n\n¿Viste el futuro? ¿No? Mejor. El bajista tampoco lo recomienda.', null);
          },
        },
        { label: 'Prefiero no ver el futuro', fn: () => node('El Jardinero', 0x55ee55, 'Sabio. El presente ya tiene suficientes monstruos.', null) },
      ]);
  }

  function detectiveTalk() {
    const p = P(), Q = MZ.quests.run;
    const c = MZ.codex.counts();
    if (Q.detective) return node('El Detective', 0xd8c8a8,
      'Ya te pagué por la información, amigo. La investigación tiene presupuesto, y el presupuesto tiene cien años de deuda.', null);
    return node('El Detective', 0xd8c8a8,
      'Investigo la Cancelación. Cien años de caso abierto: un show que no fue, un contrato que nadie leyó, y un sospechoso que vive en el fondo con mayordomo incluido.\n\nNecesito datos del pozo. Todo lo que viste, hablaste o agarraste me sirve. Pago por archivo.',
      [
        {
          label: `Vender tu archivo (${c.got} entradas de bestiario)`, fn() {
            Q.detective = true;
            const g = c.got * 2;
            p.gold += g;
            MZ.audio.gold(); MZ.ui.updateHUD();
            return node('El Detective', 0xd8c8a8,
              '*anota todo en una libreta empapada*\n\n' + c.got + ' fichas × 2 = ' + g + ' de oro. Buen material.\n\nUn consejo de colega: cuando llegues al fondo, no le preguntes SI canceló el show. Preguntale POR QUÉ. Las respuestas largas son confesiones.', null);
          },
        },
        { label: 'Mi archivo no se vende', fn: () => node('El Detective', 0xd8c8a8, 'Respetable. Los mejores testigos son los que callan... y los más sospechosos también. Te anoto en las dos listas.', null) },
      ]);
  }

  function cuervoTalk() {
    const p = P();
    return node('El Cuervo del Vestíbulo', 0x8888aa,
      '*el cuervo te mira con un ojo, después con el otro, después con los dos*\n\n"CRAA. Atajos. CRAA. Diez de oro. CRAA."\n\n(parece una oferta. de un cuervo. vos verás.)',
      [
        {
          label: 'Pagarle 10 de oro al cuervo', fn() {
            if (p.gold < 10) return node('El Cuervo del Vestíbulo', 0x8888aa, '"CRAA. Pobre. CRAA."\n\n(el cuervo te dio la espalda. duele más de lo esperable.)', null);
            if (MZ.state.mapaActivo) return node('El Cuervo del Vestíbulo', 0x8888aa, '"CRAA. Ya tenés plano. CRAA. Estafa no. CRAA."\n\n(un cuervo con ética. la mansión está llena de sorpresas.)', null);
            p.gold -= 10;
            MZ.activarMapa();
            MZ.audio.gold(); MZ.ui.updateHUD();
            return node('El Cuervo del Vestíbulo', 0x8888aa,
              '*el cuervo vuela el piso entero en dos segundos y vuelve*\n\n"CRAA."\n\n(plano completo. el mejor empleado de la mansión y cobra en monedas.)', null);
          },
        },
        { label: 'No negociar con aves', fn: () => node('El Cuervo del Vestíbulo', 0x8888aa, '"CRAA."\n\n(sonó a "te vas a arrepentir". o a "craa". difícil saber.)', null) },
      ]);
  }

  // ---- NPCs de cualquier parada ----
  function groupieTalk() {
    const p = P();
    const celos = (D().morena || 0) >= 2 ? '\n\n...¿Ese perfume es de Morena? Mirá, no me meto. PERO ESA CORISTA NI SABE LA DISCOGRAFÍA, que conste.' : '';
    if (p.streak >= 3) {
      p.hp = p.maxHp; p.poison = 0;
      MZ.audio.mate(); MZ.fx.flash(0.25, 0xcc4488); MZ.ui.updateHUD();
      return node('La Groupie Eterna', 0xcc4488,
        '¡Racha de ' + p.streak + '! Así pegaba el baterista en el 26... *suspiro*\n\nVení para acá, héroe.\n\n████ beso de fan número uno ████\n\nCurado entero. Eso era todo, no te la creas.' + celos, null);
    }
    return node('La Groupie Eterna', 0xcc4488,
      'Fan número uno de la banda, desde el primer martes en La Previa. Tengo las entradas de los siete shows y la del octavo, la que nunca se cortó.\n\nVos pegás parecido al baterista... pero él tenía RACHA. Volvé cuando tengas una de 3 y vemos. 😏' + celos,
      [{ label: 'Voy a por esa racha', fn: null }]);
  }

  function tatuadorTalk() {
    const p = P(), Q = MZ.quests.run, d = MZ.state.depth;
    const costo = 60 + d * 2;
    if (Q.tatuador) return node('El Tatuador de Bangkok', 0x2a8a8a,
      'Un tatuaje por bajada, amigo. La piel necesita descanso y la aguja necesita misterio.', null);
    return node('El Tatuador de Bangkok', 0x2a8a8a,
      'Tatué a la banda entera en el 26. Al baterista le tatué la cara del Mánager y después la X encima: dos trabajos, doble tarifa, cero juicio.\n\nTengo tinta sagrada para uno más. Duele como el demonio y pega como el demonio. ¿Te animás?',
      [
        {
          label: `Tatuarse (ATK +1 para siempre) — ${costo} oro`, fn() {
            if (p.gold < costo) return node('El Tatuador de Bangkok', 0x2a8a8a, 'La tinta sagrada se paga, amigo. Lo barato se borra, lo borrado se lamenta.', null);
            Q.tatuador = true;
            p.gold -= costo; p.baseAtk += 1; MZ.recalcStats();
            MZ.audio.hurt(); MZ.fx.shake(6); MZ.fx.flash(0.3, 0x2a8a8a); MZ.ui.updateHUD();
            return node('El Tatuador de Bangkok', 0x2a8a8a,
              '*ZZZZZ* *ZZZZZ* ...listo.\n\n+1 ATK permanente. ¿Qué es? Un acorde. ¿Cuál? El que falta. Cuando lo escuches sonar, el tatuaje va a arder. Ese día no es hoy. Andá.', null);
          },
        },
        { label: 'Mejor no, las agujas no', fn: () => node('El Tatuador de Bangkok', 0x2a8a8a, 'Tranquilo. La piel virgen también cuenta una historia: la del que dudó. También es arte.', null) },
      ]);
  }

  function chamanaTalk(npc) {
    const p = P();
    if (npc.leida) return node('La Chamana del Mercado', 0xb14cff,
      'La suerte ya te la leí, tesoro. Releerla trae mala suerte. Es una regla rarísima pero no la inventé yo.', null);
    return node('La Chamana del Mercado', 0xb14cff,
      'Acercate, tesoro. Te leo la suerte en la palma, en los dados o en la espuma del bucket, lo que haya. La gira me dejó el don: cien años viendo futuros que no llegan.',
      [
        {
          label: 'Leeme la suerte', fn() {
            npc.leida = true;
            const r = Math.random();
            if (r < 0.3) {
              const g = 25 + MZ.state.depth;
              p.gold += g;
              MZ.audio.gold(); MZ.ui.updateHUD();
              return node('La Chamana del Mercado', 0xb14cff, 'Veo... fortuna inmediata. Literal: +' + g + ' de oro que tenía acá abajo de la mesa. La magia a veces es logística.', null);
            }
            if (r < 0.6) {
              p.hp = Math.min(p.maxHp, p.hp + 10); p.poison = 0;
              MZ.audio.mate(); MZ.ui.updateHUD();
              return node('La Chamana del Mercado', 0xb14cff, 'Veo... salud. +10 HP y el veneno fuera. La palma no miente, y la tuya estaba hecha un desastre.', null);
            }
            if (r < 0.85) {
              p.maxHp += 1; p.hp = Math.min(p.maxHp, p.hp + 1); MZ.recalcStats();
              MZ.audio.secret(); MZ.ui.updateHUD();
              return node('La Chamana del Mercado', 0xb14cff, 'Veo... un corazón que se agranda. +1 HP máx. Cuidalo, que ahí guardás el coraje y las deudas.', null);
            }
            return node('La Chamana del Mercado', 0xb14cff, 'Veo... veo... mirá, te soy honesta: hoy la espuma no dice nada. Pasa. Hasta el más allá tiene días flojos. Volvé en otro piso.', null);
          },
        },
        { label: 'Mi futuro es mío', fn: () => node('La Chamana del Mercado', 0xb14cff, 'Eso también lo vi que lo ibas a decir. El don no descansa, tesoro.', null) },
      ]);
  }

  function gatoTalk(npc) {
    const p = P();
    return node('El Gato del Hostel', 0xcccccc,
      '*el gato del hostel duerme sobre el lugar exactamente más calentito del piso*\n\n*abre un ojo*\n\n*decide que no sos una amenaza ni una lata de atún*',
      [
        {
          label: 'Acariciarlo', fn() {
            if (npc.mimos) return node('El Gato del Hostel', 0xcccccc, '*el gato ya decidió que fue suficiente contacto humano por este piso*\n\n*te ignora con la elegancia de siete vidas bien administradas*', null);
            npc.mimos = true;
            if (Math.random() < 0.01) {
              p.vidas = (p.vidas || 0) + 1;
              MZ.logros.unlock('gatoLogro');
              MZ.audio.secret(); MZ.fx.flash(0.3, 0xffd700); MZ.ui.updateHUD();
              return node('El Gato del Hostel', 0xcccccc,
                '*el gato te mira fijo, MUY fijo, y algo pasa*\n\n*+1 VIDA*\n\n(los gatos tienen siete. este, aparentemente, las presta. no se lo cuentes a nadie.)', null);
            }
            p.hp = Math.min(p.maxHp, p.hp + 3);
            MZ.logros.unlock('gatoLogro');
            MZ.audio.mate(); MZ.ui.updateHUD();
            return node('El Gato del Hostel', 0xcccccc,
              '*ronroneo de motor fantasma*\n\n+3 HP. La ciencia no sabe explicarlo y el gato no piensa hacerlo.', null);
          },
        },
        { label: 'Dejarlo dormir', fn: () => node('El Gato del Hostel', 0xcccccc, '*el gato aprueba tu decisión sin abrir los ojos*\n\n(sentiste el respeto. fue mutuo. fue suficiente.)', null) },
      ]);
  }

  function elvisTalk(npc) {
    const p = P();
    return node('El Imitador de Elvis', 0xffe680,
      'Uh-huh. Bienvenido al pozo, baby. Yo le enseñé a la banda lo más importante: no importa ser el original, importa que la gente cante.\n\n¿Una canción? La propina es 10, el alma va gratis.',
      [
        {
          label: 'Propina de 10 — que suene', fn() {
            if (p.gold < 10) return node('El Imitador de Elvis', 0xffe680, 'Sin propina no hay show, baby. Hasta el Rey pagaba sus cuentas. Bueno, no. Pero la intención.', null);
            if (npc.sang) return node('El Imitador de Elvis', 0xffe680, 'Un show por noche, baby. La garganta fantasma también se cuida.', null);
            npc.sang = true;
            p.gold -= 10;
            p.hp = p.maxHp; p.poison = 0;
            const bis = Math.random() < 0.2;
            if (bis) p.gold += 30;
            MZ.audio.secret(); MZ.fx.flash(0.3, 0xffe680); MZ.ui.updateHUD();
            return node('El Imitador de Elvis', 0xffe680,
              '*canta como si el estadio estuviera lleno, porque para él siempre lo está*\n\nCurado entero, baby.' + (bis ? '\n\n¿Y esto? +30 de oro: cayó del sombrero de alguien que aplaudió hace cien años. El show provee.' : ''), null);
          },
        },
        { label: 'Otro día, Rey', fn: () => node('El Imitador de Elvis', 0xffe680, 'Uh-huh. El Rey no se ofende: el Rey espera. Es lo que mejor hacemos acá abajo, baby.', null) },
      ]);
  }

  // ---- El Mánager: nivel 50, el Show Final ----
  function fundadorTalk() {
    const p = P();
    D().fundadorVisto = 1;
    MZ.save.store();
    const got = MZ.sellos.count(), total = SELLOS.length;
    const completo = got >= total;
    const intro = 'Cincuenta niveles. Nadie había llegado tan lejos desde... bueno, desde nunca. Bravo. BRAVO.\n\nYo soy el Mánager, ¿sabés? El de la gira. El del contrato. El de las dos palabras que partieron este pozo: "se cancela".\n\n'
      + (completo
        ? 'Y vos traés... un pasaporte completo. Los cinco sellos. Cien años esperé a que NADIE hiciera esto, y vos lo hiciste igual.\n\nLa cláusula es clara: con la gira completa, el portador puede exigir el Show Final.'
        : 'Veo tu pasaporte: ' + got + ' de ' + total + ' sellos. Casi, querido. CASI. Sin la gira completa, el Show Final no se puede exigir... pero algo se puede hacer, no soy un monstruo. Bueno, sí, técnicamente.');
    if (completo) {
      return node('El Mánager', 0xffd700, intro, [
        {
          label: '🎸 EXIGIR EL SHOW FINAL', fn() {
            D().finalBueno = 1; MZ.save.store();
            p.maxHp += 12; p.hp = p.maxHp;
            p.baseAtk += 3; p.gold += 1000;
            MZ.recalcStats(); MZ.audio.secret(); MZ.ui.updateHUD();
            MZ.fx.flash(0.6, 0xffd700); MZ.fx.shake(10);
            MZ.logros.unlock('finalBueno');
            MZ.logros.check();
            return node('El Mánager', 0xffd700,
              '*saca el contrato, lo mira por última vez, y lo rompe*\n\n"Señoras y señores... CIEN AÑOS DE INTERVALO TERMINAN HOY."\n\n*el pozo entero tiembla: suena EL ACORDE — el último, el que faltaba — y cien mil almas de la fila cantan al mismo tiempo*\n\nBendición del Show Final: +12 HP máx, +3 ATK, +1000 de oro.\n\n¿La salida? No existe, querido. Pero ahora la gira terminó... así que de acá para abajo, lo que sigue es la GIRA DE DESPEDIDA. Y esas, como todos saben, no se terminan nunca. Seguí bajando, estrella.', null);
          },
        },
        {
          label: '¿Por qué lo cancelaste, en serio?', fn: () => node('El Mánager', 0xffd700,
            '...Cien años y nadie me lo preguntó así.\n\nPorque la letra chica la escribí yo: "la gira termina con el último acorde". Y una gira que termina es una gira que se muere. Los contratos vencen, las bandas se pelean, el público se va a su casa.\n\nYo no cancelé un show, querido. Cancelé EL FINAL. Les regalé una gira eterna y me odiaron por eso.\n\n...Tocá el acorde. Ya está. Cien años es suficiente intervalo hasta para mí.',
            [{
              label: '🎸 Tocar el acorde', fn() {
                D().finalBueno = 1; MZ.save.store();
                p.maxHp += 12; p.hp = p.maxHp;
                p.baseAtk += 3; p.gold += 1000;
                MZ.recalcStats(); MZ.audio.secret(); MZ.ui.updateHUD();
                MZ.fx.flash(0.6, 0xffd700); MZ.fx.shake(10);
                MZ.logros.unlock('finalBueno');
                MZ.logros.check();
                return node('El Mánager', 0xffd700,
                  '*suena EL ACORDE y el pozo entero canta*\n\nBendición del Show Final: +12 HP máx, +3 ATK, +1000 de oro.\n\nGracias por preguntar, querido. Las respuestas largas son confesiones... y las confesiones, a veces, son finales. Seguí bajando: la gira de despedida es toda tuya.', null);
              },
            }]),
        },
      ]);
    }
    return node('El Mánager', 0xffd700, intro, [
      {
        label: 'Aceptar la "versión acústica"', fn() {
          p.maxHp += 5; p.hp = p.maxHp;
          p.baseAtk += 1; p.gold += 200;
          MZ.recalcStats(); MZ.audio.secret(); MZ.ui.updateHUD();
          MZ.fx.flash(0.4, 0xffd700);
          MZ.logros.check();
          const faltan = SELLOS.filter(s => !MZ.sellos.has(s.key)).map(s => s.n).join(', ');
          return node('El Mánager', 0xffd700,
            '*aplaude despacio, saca una guitarra criolla desafinada y toca un tema y medio*\n\nVersión acústica del Show Final: +5 HP máx, +1 ATK, +200 de oro. Emotivo, íntimo, tirando a lavado.\n\n¿Querés el show DE VERDAD? Completá el pasaporte. Te faltan: ' + faltan + '. Los jefes de cada parada saben dónde sellar.\n\nLa próxima vez, querido... traé la gira entera.', null);
        },
      },
      { label: 'Volveré con el pasaporte completo', fn: () => node('El Mánager', 0xffd700, 'Eso dijo el público hace cien años. Mirá cómo terminó: en la fila, sin piel.\n\n...Pero vos capaz que sí. Andá. El pozo y yo esperamos bien.', null) },
    ]);
  }

  MZ.LORE = {
    mercader: { talk: (npc) => mercaderMenu(npc, ['¿Qué comprás, forastero? *abre la gabardina: brilla todo, legal no es nada*', 'Pasá, pasá. Todo lo que ves se cayó de un contenedor. El contenedor de otra gira.', 'El Buhonero, para servirte. Acepto oro. No acepto quejas, devoluciones ni preguntas.', 'Necesitamos más oro. Vos, yo, todos. Es la economía, forastero: desde el Age que es así.'][Math.floor(Math.random() * 4)]) },
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
    brisa: { talk: brisaTalk },
    nuan: { talk: nuanTalk },
    monje: { talk: (npc) => monjeTalk(npc) },
    tuktukero: { talk: tuktukeroTalk },
    lola: { talk: lolaTalk },
    mochilero: { talk: mochileroTalk },
    heladero: { talk: heladeroTalk },
    influencer: { talk: (npc) => influencerTalk(npc) },
    fotografo: { talk: (npc) => fotografoTalk(npc) },
    cocodrilo: { talk: cocodriloTalk },
    pitmaster: { talk: pitmasterTalk },
    cowboy: { talk: cowboyTalk },
    porrista: { talk: porristaTalk },
    camionero: { talk: camioneroTalk },
    dt: { talk: (npc) => dtTalk(npc) },
    mucama: { talk: (npc) => mucamaTalk(npc) },
    jardinero: { talk: jardineroTalk },
    detective: { talk: detectiveTalk },
    cuervo: { talk: cuervoTalk },
    groupie: { talk: groupieTalk },
    tatuador: { talk: tatuadorTalk },
    chamana: { talk: (npc) => chamanaTalk(npc) },
    gato: { talk: (npc) => gatoTalk(npc) },
    elvis: { talk: (npc) => elvisTalk(npc) },
  };
})();
