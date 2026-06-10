// Bestiario / Pokedex: se llena al ver monstruos, hablar NPCs y agarrar objetos.
// 3 oraciones de lore picante por entrada descubierta.
window.MZ = window.MZ || {};
(() => {
  MZ.CODEX = {
    monstruos: [
      { id: 'rata', nombre: 'Rata', sprite: 'rata', color: 0xff5577, lore: [
        'Antes escribía la columna de espectáculos del diario La Mazmorra.',
        'Paneó la obra del Bardo Fundador y quedó maldita en cuatro patas.',
        'Sigue mordiendo tobillos con el mismo veneno que ponía en sus reseñas.' ] },
      { id: 'slime', nombre: 'Slime', sprite: 'slime', color: 0x66ff99, lore: [
        'Tenía un blog de crítica teatral con doce lectores fieles.',
        'La maldición lo dejó gelatinoso, pero su autoestima sigue intacta.',
        'Se mueve cada dos turnos: ni apurado opina, ni apurado ataca.' ] },
      { id: 'vibora', nombre: 'Víbora', sprite: 'vibora', color: 0x2ecc40, lore: [
        'Lengua viperina literal: te envenena de un mordisco.',
        'Era la chismosa del camarín, hoy reparte ponzoña sin distinción.',
        'Pegale de lejos o vas a pasar el próximo nivel verde de la cara.' ] },
      { id: 'esqueleto', nombre: 'Esqueleto', sprite: 'esqueleto', color: 0xe8e8ff, lore: [
        'Acomodador del teatro que murió esperando que alguien apague el celular.',
        'No le queda carne pero sí rencor, que es lo último que se pierde.',
        'Golpea seco, como su sentido del humor.' ] },
      { id: 'fantasma', nombre: 'Fantasma', sprite: 'fantasma', color: 0xa0c4ff, lore: [
        'Lo echaron de la radio por pasar Edguy a las cuatro de la tarde.',
        'Atraviesa paredes porque ya nada lo detiene, ni la decencia musical.',
        'Translúcido, melancólico y con muy mala puntería emocional.' ] },
      { id: 'arquero', nombre: 'Arquero Maldito', sprite: 'arquero', color: 0xccffaa, lore: [
        'Disparaba dardos de papel a los actores que olvidaban la letra.',
        'Ahora dispara flechas de verdad desde cinco casilleros de distancia.',
        'Si lo ves lejos, no te quedes quieto haciéndote el valiente.' ] },
      { id: 'ojo', nombre: 'Ojo Maldito', sprite: 'ojo', color: 0xffa500, lore: [
        'Era el apuntador: todo lo veía desde el foso del escenario.',
        'Quedó reducido a un globo ocular flotante con muy malas intenciones.',
        'Te castiga a distancia, porque mirar feo nunca fue suficiente para él.' ] },
      { id: 'golem', nombre: 'Gólem de Utilería', sprite: 'golem', color: 0x8d99ae, lore: [
        'Hecho con los decorados de piedra que nunca se terminaron de pagar.',
        'Lento como trámite en ventanilla, pero te parte al medio si te alcanza.',
        'Aguanta más que tu paciencia un lunes a la mañana.' ] },
      { id: 'vampiro', nombre: 'Vampiro de Palco', sprite: 'vampiro', color: 0xff2222, lore: [
        'Veía todas las funciones gratis desde el palco, chupándole la sangre al teatro.',
        'Ahora te la chupa a vos: cada golpe que te da, se cura.',
        'Matalo rápido o se va a poner más sano que vos.' ] },
      { id: 'payaso', nombre: 'Payaso del Entreacto', sprite: 'payaso', color: 0xff2244, lore: [
        'Animaba los intervalos hasta que el público pidió que parara. Para siempre.',
        'Tira proyectiles venenosos con una sonrisa que no se borra ni muerto.',
        'El humor del subsuelo es así: te envenena y encima se ríe.' ] },
      { id: 'rataBlanca', nombre: 'La Rata Blanca', sprite: 'rataBlanca', color: 0xffffff, lore: [
        'Leyenda del subsuelo: cuando aparece, suena un solo de guitarra a lo lejos.',
        'Cazarla hace llover oro como en el mejor recital de los ochenta.',
        'Mujer amante de la fortuna: rarísima, blanca y generosa.' ] },
      { id: 'pombero', nombre: 'El Pombero', sprite: 'pombero', color: 0x00ff88, lore: [
        'El duende del folclore que SÍ existe, y encima te afana el oro.',
        'Silba, te roba y se teletransporta antes de que reacciones.',
        'Si lográs cazarlo, devuelve el doble: el karma criollo es real.' ] },
      { id: 'mimic', nombre: 'Mimic', sprite: 'mimic', color: 0xffd700, lore: [
        'Un cofre que aprendió que la mejor carnada es la codicia ajena.',
        'Te muerde apenas lo abrís: el tesoro eras vos, campeón.',
        'Regla de oro del dungeon: nada lindo es gratis.' ] },
      { id: 'barril', nombre: 'Barril Explosivo', sprite: 'barril', color: 0xffa500, lore: [
        'Sobró de cuando esto era un fuerte y guardaban pólvora con criterio dudoso.',
        'No se mueve ni ataca, pero reventalo cerca de un enemigo y agradecé.',
        'Cuidado con la onda expansiva: también te empuja a vos.' ] },
    ],
    jefes: [
      { id: 'El Encargado', nombre: 'El Encargado', sprite: 'jefe', color: 0xff2266, lore: [
        'Empresario teatral que cortaba los sándwiches de miga al medio... a lo largo.',
        'Por ese crimen contra la gastronomía quedó maldito al frente del nivel 5.',
        'Pega tan fuerte que te mueve de casillero: respetá la distancia.' ] },
      { id: 'La Jefa del Subsuelo', nombre: 'La Jefa del Subsuelo', sprite: 'jefe', color: 0xff2266, lore: [
        'Manejaba la boletería con puño de hierro y vuelto inexacto.',
        'Reina del piso 10, no perdona ni una entrada sin pagar.',
        'Mandar sigue siendo lo suyo, aunque ya no quede a quién.' ] },
      { id: 'El Chamuyero', nombre: 'El Chamuyero', sprite: 'jefe', color: 0xff2266, lore: [
        'El agente de prensa que prometía giras mundiales que nunca pasaban.',
        'Te habla bonito mientras te clava el puñal: puro verso con filo.',
        'No le creas nada, ni siquiera cuando dice que ya está muerto.' ] },
      { id: 'Doña Penumbra', nombre: 'Doña Penumbra', sprite: 'jefe', color: 0xff2266, lore: [
        'La encargada de luces que decidió que la mejor iluminación era ninguna.',
        'Reina de las sombras del piso profundo, donde casi no ves nada.',
        'Le tiene fobia a los focos: por eso pelea en la oscuridad.' ] },
      { id: 'El Recaudador', nombre: 'El Recaudador', sprite: 'jefe', color: 0xff2266, lore: [
        'Cobraba la recaudación y nunca rendía cuentas a nadie.',
        'Ahora cobra peaje en almas en lo más hondo del teatro.',
        'Matarlo es el acto de justicia fiscal más satisfactorio del dungeon.' ] },
      { id: 'jefe', nombre: 'Jefe de Piso', sprite: 'jefe', color: 0xff2266, lore: [
        'Cada cinco niveles, un viejo empresario del teatro te corta el paso.',
        'Su sala es especial: rojo infierno, marca ritual y mística Doom.',
        'Caen mate seguro y, a veces, La Bestia 9000 de premio.' ] },
    ],
    personajes: [
      { id: 'mercader', nombre: 'Don Olivera', sprite: 'mercader', color: 0xffd27f, lore: [
        'Vende en todos los pisos: una franquicia montada en plena maldición.',
        'Todo se le "cayó de un camión", el camión de otra mazmorra.',
        'Acepta oro, no acepta quejas ni devoluciones.' ] },
      { id: 'morena', nombre: 'Morena', sprite: 'morena', color: 0xff4cf0, lore: [
        'La actriz principal que ya era bruja antes del teatro; lo del escenario era hobby.',
        'Si le tirás onda y sobrevivís, el romance crece run tras run.',
        'Sus besos curan, sus mates enamoran y su tequila es de Cancún.' ] },
      { id: 'bardo', nombre: 'Anselmo el Bardo', sprite: 'bardo', color: 0x66aaff, lore: [
        'El narrador maldito que te bardea en cada muerte con cariño.',
        'Te cuenta la historia del teatro en capítulos, gorra al revés mediante.',
        'Tocó de soporte de Rata Blanca, y no deja que lo olvides.' ] },
      { id: 'rodrigo', nombre: 'Rodrigo el Perdido', sprite: 'rodrigo', color: 0x9aa5b1, lore: [
        'Perdió su anillo de casamiento varios pisos más abajo.',
        'Te paga bien por recuperarlo y mejor por no hacer preguntas.',
        'Spoiler: el anillo dice "Para R., con amor, M." y M es de Morena.' ] },
      { id: 'esperanza', nombre: 'Esperanza, la Viuda', sprite: 'esperanza', color: 0xff2255, lore: [
        'Enviudó del primer Encargado. Y del segundo. Y del tercero.',
        'Te manda a vengarla matando al jefe, que era su difunto marido.',
        'Cumplida la venganza, capaz te invita a salir el viernes.' ] },
      { id: 'nona', nombre: 'La Nona', sprite: 'nona', color: 0xb088dd, lore: [
        'Cocinaba para todo el elenco; su guiso resucitaba giras enteras.',
        'Te cura con comida y te bardea con amor por estar tan flaco.',
        'Hace veinte años que pone un plato de más para su nieto perdido.' ] },
      { id: 'tahur', nombre: 'El Tahúr', sprite: 'tahur', color: 0xffd700, lore: [
        'El productor que se jugó la recaudación a los dados. Tres veces.',
        'Doble o nada con dados cargados de carisma y de plomo.',
        'Si te animás a la ruleta rusa, que San Cayetano te ampare.' ] },
      { id: 'herrero', nombre: 'Fierrito', sprite: 'herrero', color: 0x9aa5b1, lore: [
        'Hacía espadas de utilería; ahora hace de las que cortan en serio.',
        'Te unta el arma con veneno, refuerza el escudo y templa el filo.',
        'La ironía de su oficio no se le escapa, y la cobra igual.' ] },
      { id: 'nieto', nombre: 'Tato, el Perdido', sprite: 'nieto', color: 0xc0c8d0, lore: [
        'El nieto de la Nona, que bajó hace veinte años a buscar fama.',
        'Nunca encontró la salida (y se quedó jugando al Helbreath en una sala con wifi).',
        'Contarle que la Nona lo espera cierra el arco más tierno del pozo.' ] },
      { id: 'fundador', nombre: 'El Bardo Fundador', sprite: 'fundador', color: 0xffd700, lore: [
        'El que vendió su alma por funciones eternas y escribe el dungeon desde adentro.',
        'Te espera en el nivel 50: La Última Función.',
        'Resulta que el bardeo de cien años era, todo este tiempo, amor.' ] },
      { id: 'critico', nombre: 'El Crítico', sprite: 'critico', color: 0xccaa66, lore: [
        'El único que sigue humano: maldecir a un crítico requiere que algo le importe.',
        'Te reseña el run con estrellas calculadas de tus stats reales.',
        'Si le sacás cuatro estrellas, hasta te paga del fondo de prensa.' ] },
      { id: 'djtigre', nombre: 'DJ Tigre', sprite: 'djtigre', color: 0xff8800, lore: [
        'El DJ fantasma del Tiger Tiger: la última función nunca terminó.',
        'Te cura con power metal y, si hay suerte, te sube el ATK.',
        'Pide una lenta de Edguy si venís golpeado; nadie juzga acá abajo.' ] },
    ],
    arsenal: [
      { id: 'pinas', nombre: 'Piñas', sprite: 'heroePinas', color: 0x00cfff, lore: [
        'Con lo que arrancás todo run: dos puños y mucha fe.',
        'ATK 1, pero no se rompen ni se quedan sin balas nunca.',
        'Los antiguos peleaban así, y mirá cómo terminaron.' ] },
      { id: 'espada', nombre: 'Armas Blancas', sprite: 'espada', color: 0x66ddff, lore: [
        'Del Cuchillo de Asado al Facón del Más Allá: el fierro criollo escala.',
        'Tienen filo limitado: se gastan y volvés a las piñas.',
        'Agarrar otra igual le suma filos en vez de venderse.' ] },
      { id: 'arco', nombre: 'Arcos y Gomeras', sprite: 'arco', color: 0xffaa66, lore: [
        'De la Gomera de Barrio al Arco del Coliseo: muerte a distancia.',
        'Munición corta: cada flecha cuenta, no la malgastes.',
        'Tap a un enemigo lejano con línea de visión para disparar.' ] },
      { id: 'bfg', nombre: 'La Bestia 9000', sprite: 'bfg', color: 0x33ff66, lore: [
        'El BFG criollo: una sola bala, cero sobrevivientes a la vista.',
        'Revienta todo enemigo en línea de visión en un radio enorme.',
        'Cae 5% en cualquier kill, 10% cerca de un jefe vivo. Doom estaría orgulloso.' ] },
      { id: 'termo', nombre: 'Termo del Abuelo', sprite: 'mate', color: 0x88ff66, lore: [
        'Arma blanca con un secreto: al romperse, te ceba un mate sagrado.',
        'Su último servicio es curarte la vida entera.',
        'El abuelo aprueba desde el más allá cada vez que explota.' ] },
      { id: 'punal', nombre: 'Puñal Tramposo', sprite: 'espada', color: 0xaa66ff, lore: [
        'Daño x4 si el enemigo no te vio venir: la traición es un arte.',
        'Pero un 10% de las veces te corta a vos, porque el karma vigila.',
        'Para jugadores con sangre fría y dedos cruzados.' ] },
      { id: 'gomeraBat', nombre: 'Gomera de Baterías', sprite: 'arco', color: 0xffff66, lore: [
        'Dispara baterías viejas que rebotan entre enemigos en cadena.',
        'Hasta tres saltos, perdiendo un poco de daño en cada uno.',
        'Reciclar nunca fue tan violento ni tan satisfactorio.' ] },
      { id: 'microfono', nombre: 'Micrófono del Bardo', sprite: 'arco', color: 0xff4cf0, lore: [
        'Un grito amplificado que daña y empuja todo a dos casilleros.',
        'AoE alrededor del blanco: ideal para abrirte paso cantando.',
        'El feedback acústico también es un arma, si sabés usarlo.' ] },
      { id: 'escudo', nombre: 'Escudos', sprite: 'escudo', color: 0x9d6bff, lore: [
        'De la Tapa de Olla al Escudo del Gremio: la defensa improvisada.',
        'Suman DEF y ahora se ven en el brazo del héroe.',
        'No frenan todo, pero la diferencia entre vivir y revivir la hacen.' ] },
      { id: 'potion', nombre: 'Poción', sprite: 'pocion', color: 0xff66ff, lore: [
        'Ruleta de kiosco: 75% te cura, 25% está vencida y te envenena.',
        'Nadie mira la fecha de vencimiento acá abajo. Vos tampoco.',
        'Gusto a frutilla con química dudosa, pero cuando cura, salva.' ] },
      { id: 'mate', nombre: 'Mate', sprite: 'mate', color: 0x88ff66, lore: [
        'Un buen mate cura la vida entera y limpia el veneno.',
        'Lo dropean los jefes como gesto de respeto post mortem.',
        'Amargo, reparador y profundamente argentino.' ] },
      { id: 'mateLegendario', nombre: 'Mate Legendario', sprite: 'mateOro', color: 0x00ffc8, lore: [
        'Cebado por los dioses: cura todo y te hace más fuerte para siempre.',
        '+5 HP máximo y +1 ATK de base. Drop rarísimo.',
        'Esto sí que es un buen mate, papá.' ] },
      { id: 'tequila', nombre: 'Tequila', sprite: 'tequila', color: 0xffe680, lore: [
        'Cura fuerte ya, resaca después: un turno de veneno como peaje.',
        'Del que Morena trajo de Cancún, no preguntes cómo.',
        'Mañana lo lamentás, hoy sos inmortal.' ] },
      { id: 'heart', nombre: 'Corazón', sprite: 'corazon', color: 0xff3355, lore: [
        'Vida directa en formato órgano: mejor no preguntar de quién era.',
        'Lo sueltan los monstruos, más seguido si venís golpeado.',
        'Late todavía. Asco, pero funciona.' ] },
      { id: 'altar', nombre: 'Altar', sprite: 'altar', color: 0x00ffc8, lore: [
        'Mitad bendición, mitad maldición: la ruleta espiritual del dungeon.',
        'Puede curarte, darte oro, o un efecto loco que dura el nivel.',
        'Berserk, Rey Midas, Fantasmal o Imán: rezá y que salga lo bueno.' ] },
      { id: 'pinchos', nombre: 'Pinchos', sprite: 'pinchos', color: 0x607d8b, lore: [
        'Trampa del piso que estaba ahí, brillando, a la vista de todos.',
        'Te lastima al pisarla y no se va: el posicionamiento importa.',
        'El piso de acá abajo tiene opiniones, y duelen.' ] },
      { id: 'cofre', nombre: 'Cofre', sprite: 'cofre', color: 0xffd700, lore: [
        'Oro y un poco de cura para el que se anima a abrirlo.',
        'Ojo: 15% de las veces tiene dientes y se llama Mimic.',
        'La codicia y el riesgo viven en la misma cajita.' ] },
      { id: 'anillo', nombre: 'Anillo de Rodrigo', sprite: 'anillo', color: 0x00e5ff, lore: [
        'El anillo de casamiento que Rodrigo perdió allá abajo.',
        'Tiene un grabado comprometedor adentro: leelo antes de devolverlo.',
        'Objeto de quest: puro chamuyo y secretos de pareja.' ] },
    ],
  };

  function ensure() {
    const d = MZ.save.data;
    if (!d.codex) d.codex = { monstruos: {}, jefes: {}, personajes: {}, arsenal: {} };
    for (const c of ['monstruos', 'jefes', 'personajes', 'arsenal']) if (!d.codex[c]) d.codex[c] = {};
    return d.codex;
  }

  MZ.codex = {
    ensure,
    seen(cat, id) { return !!ensure()[cat] && !!ensure()[cat][id]; },

    discover(cat, id) {
      const cx = ensure();
      if (!cx[cat] || cx[cat][id]) return;
      // solo descubrir ids que existen en CODEX
      const def = (MZ.CODEX[cat] || []).find(e => e.id === id);
      if (!def) return;
      cx[cat][id] = 1;
      MZ.save.store();
      if (MZ.ui) {
        MZ.ui.toast('📖 Bestiario: descubriste a ' + def.nombre, 3000);
        if (MZ.audio) MZ.audio.pickup();
      }
    },

    counts() {
      const cx = ensure();
      let got = 0, total = 0;
      for (const c of ['monstruos', 'jefes', 'personajes', 'arsenal']) {
        total += MZ.CODEX[c].length;
        got += Object.keys(cx[c]).length;
      }
      return { got, total };
    },

    // mapea un arma equipada a su id de arsenal
    weaponId(w) {
      if (!w) return null;
      if (w.aoe) return 'bfg';
      if (w.curaAlRomper) return 'termo';
      if (w.traicionero) return 'punal';
      if (w.rebote) return 'gomeraBat';
      if (w.grito) return 'microfono';
      return w.kind === 'ranged' ? 'arco' : 'espada';
    },
  };
})();
