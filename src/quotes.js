// Los comentarios picantes. Argentino, bardeo amistoso.
window.MZ = window.MZ || {};
(() => {
  const Q = {
    morir: [
      'F. Llegaste al nivel {n}. Mi abuela llegó más lejos y fue caminando.',
      'Moriste como viviste: sin entrada y empujando en la fila.',
      'La gira 1 — Vos 0. Como siempre.',
      '¿Ya está? ¿Eso fue todo? Ni de telonero servís.',
      'No pasa nada, campeón. Bueno, sí: te moriste.',
      'Muerte n.º {d}. Qué constancia, te admiro.',
      'Avisale al laburo que mañana no vas: estás de duelo. Por vos.',
      'Spoiler: el héroe muere al final. Y al principio. Y en el medio.',
      'Nivel {n}. El pozo ni se enteró de que viniste.',
      'Tranqui, perder también es un estilo de juego.',
      'Moriste como en Helbreath: con el inventario lleno y la dignidad vacía.',
      'Fuiste derrotado. Y en tu cabeza suena la musiquita de derrota del Age of Empires.',
      'Tu media bajó a 41. En el PES 6 ya te estarían rescindiendo el contrato.',
      'YOU DIED. Perdón, costumbre de mansión.',
      'Te fuiste antes del primer tema. Ni en La Previa duraban tan poco.',
    ],
    matar: [
      "Tomá pa' vos.",
      '¿Viste? Cuando querés, podés.',
      'Uno menos. Quedan infinitos.',
      'Fatality criollo.',
      'Eso dolió hasta acá.',
      'Chau, que descanse.',
      'Limpito. Sin testigos.',
      'Wololo. Ah no, eso era convertirlos. Bueno, esto es más definitivo.',
    ],
    critico: [
      '¡CRÍTICO! ¿Y esa potencia de dónde salió?',
      '¡PUM! Para que tengas.',
      'Crítico. Hasta yo me asusté.',
      'Le pegaste con toda la bronca del lunes.',
      '¡Tremendo fierrazo!',
    ],
    lootBueno: [
      'Mirá vos, algo decente al fin.',
      'Eso sí que vale la pena, crack.',
      'Guardalo, que eso no se consigue en cualquier puesto del mercado.',
      'Upgrade. Ahora sí parecés de la gira y no de la fila.',
    ],
    lootMalo: [
      'Una púa gastada. Tremendo botín, crack.',
      'Oro. Bueno, algo es algo.',
      'Otra hierba dudosa. Vos comela igual, total...',
      'Monedas sueltas. Ni para el bondi.',
      'Oro insuficiente... ah no, pará, algo entró. Igual: necesitamos más oro.',
    ],
    jefeIntro: [
      'Uh, llegó el jefe. Y vos sin entrada.',
      'JEFE A LA VISTA. Este no vino a charlar.',
      'Se pudrió todo: {b} te está mirando.',
      '{b} entró a la sala. Disimulá.',
    ],
    jefeMuerto: [
      'Bueno, bueno... alguien se levantó inspirado hoy.',
      'Mataste al jefe. Ahora el jefe sos vos.',
      'Increíble. Y sin llorar ni nada.',
      'Le ganaste al jefe. Pedile aumento.',
    ],
    idle: [
      '¿Te dormiste? El pozo no se recorre solo, eh.',
      'Hola... ¿hay alguien ahí? Toc toc.',
      'Mientras lo pensás, los zombies de la fila cobran antigüedad.',
      'Tomate tu tiempo, total el aburrimiento era el enemigo, ¿no?',
      '¿Estás scrolleando otra app? Acá. Ojos acá.',
      '"¿Qué? ¿Eh? ¿Órdenes?" — parecés aldeano del Age esperando un click.',
    ],
    danioGrande: [
      '¿Eso fue esquivar o ponerle el pecho?',
      'Te dieron de lleno. Dolió hasta en el HUD.',
      'Au. Eso va a dejar marca.',
      '¿Vas a dejar que te pegue así? Reaccioná.',
    ],
    nivel: [
      'Nivel {n}. Cada vez más hondo, cada vez peor.',
      'Bajando... acá ya ni el wifi del cyber de Bangkok llega.',
      'Nivel {n}. ¿Quién te manda?',
      'Más abajo. El alquiler acá debe ser regalado.',
      'Nivel {n}. Otra parada de la gira. El tour no para.',
    ],
    racha: [
      'Racha de {k}. Andá a comprar un Quini.',
      '{k} seguidos sin que te toquen. Bueno, tampoco te la creas.',
      'Imparable. ¿Quién sos y qué hiciste con el de antes?',
      'Racha de {k}. Media de PES subiendo: que no te la cuenten.',
    ],
    rataBlanca: [
      '¡LA RATA BLANCA! Suena un solo de guitarra a lo lejos... y llueve oro. La leyenda continúa.',
      'Cazaste a la Rata Blanca. Mujer amante de la fortuna: mirá ese oro.',
    ],
    tequila: [
      'Tequila de gira. Cura el cuerpo, factura el hígado. Salud.',
      'Un shot y adentro. Mañana lo lamentás, hoy sos inmortal.',
      '¡TEQUILA! Como en Pattaya, pero con zombies mirando.',
    ],
    logro: [
      '🏆 LOGRO: {t}',
    ],
    volver: [
      '¿Otra vez vos? Bueno, pasá.',
      'Volviste. El pozo te extrañaba (mentira).',
      'Ah, mirá quién no aprende más.',
    ],
    secreto: [
      '¡Sala secreta! Mirá vos, qué observador.',
      'Una pared rota y un tesoro. Como en las pelis.',
      'Shhh. Esto queda entre nosotros.',
    ],
    pombero: [
      '¡El Pombero te afanó! Te dije que existía.',
      'Silbó, te robó y se fue. Un capo el Pombero.',
      'El Pombero se llevó tu oro. Reclamale al folclore.',
    ],
    pomberoMuerto: [
      'Cazaste al Pombero. Devolvé eso... ah no, ahora es tuyo.',
      'El Pombero cayó. La leyenda continúa, el oro vuelve.',
    ],
    mate: [
      'Esto sí que es un buen mate, papá.',
      'Un matecito y seguimos. Así cualquiera.',
      'Mate amargo, gira dulce.',
    ],
    mateLegendario: [
      'EL MATE LEGENDARIO. Cebado por los dioses. Sentite invencible.',
      'Un mate que cura todo. Hasta las ganas de rage quit.',
    ],
    npcOcupado: [
      'Ya hablamos. Ahora cada uno a lo suyo.',
      'Te hace un gesto de "después, después".',
      '"Ando ocupado, che." No insistas.',
      'Te ignora con elegancia. Seguí camino.',
    ],
    trampa: [
      'Pisaste las púas del escenario. Estaban ahí. Brillaban. Las VISTE.',
      'Púas 1 — Lectura del terreno 0.',
      'Auch. El piso acá abajo tiene opiniones.',
    ],
    altarBueno: [
      'La máquina de escribir tecleó sola... y te bendijo. Guardado con suerte.',
      'Tac, tac, tac: la máquina redactó algo bueno para vos. No pasa seguido.',
      'La máquina te escribió un párrafo a favor. No preguntes quién dicta.',
    ],
    altarMalo: [
      'La máquina de escribir estaba de mal humor. Como todo acá.',
      'Tac, tac, tac... cláusula en contra. Leé la letra chica la próxima.',
      'La máquina te miró (no tiene ojos, igual te miró) y redactó una maldición.',
    ],
    pocionBuena: [
      'Hierba fresca. +{h} HP. Hoy zafaste.',
      'Verde y curativa, como en la mansión. +{h} HP.',
      'La hierba era de las buenas. Anotá la fecha: no pasa seguido.',
    ],
    pocionMala: [
      'Era del HOSTEL. ¿Quién come hierbas del hostel? Vos, claro.',
      'Esa hierba tenía más años que la gira. A llorarla.',
      'Gusto raro... muy raro... uy. UY.',
    ],
    vidaGanada: [
      '🐈 ¡Vida extra! Ahora tenés {v}. Como los gatos, pero con suerte.',
      '+1 vida. Vas {v}. Alguien allá arriba te quiere (o te odia y quiere verte sufrir más).',
      'Una vida más: {v} en total. Usala con menos boludez que las otras.',
    ],
    corazon: [
      'Un corazón. +{h} HP. Mejor no preguntar de quién era.',
      '+{h} HP. Late todavía. Asco, pero funciona.',
      'Corazón fresco. La dieta del aventurero es ASÍ.',
    ],
    revivir: [
      'Caíste parado, michi. Te quedan {v} vidas. (Se quedaron {oro} de oro en el más allá.)',
      'Otra vida menos: {v} de 7. Los gatos te miran con orgullo. Perdiste {oro} de oro, eso sí.',
      'Siete vidas como los gatos, te quedan {v}. La mitad del oro ({oro}) se fue con el susto.',
      'Revivís en un piso nuevo del mismo infierno. Vidas: {v}. Oro perdido: {oro}.',
      'Plot twist: no moriste del todo. {v} vidas restantes. La parca se cobró {oro} de oro de peaje.',
    ],
    veneno: [
      'Envenenado. La hierba decía "lavar antes de usar", no "desconfiar antes de usar".',
      'Veneno en las venas. Como el lunes, pero literal.',
      'Te envenenaron. Tomate algo, pero algo bueno esta vez.',
    ],
    mimic: [
      '¡EL FLIGHT CASE TENÍA DIENTES! Correte, CORRETE.',
      'Mordedor. Obvio. Nada lindo es gratis en este pozo.',
      'La caja te mordió. El equipaje eras vos.',
    ],
    ruletaGana: [
      'La entrada trucha COLÓ. El Revendedor te paga el triple con cara de piedra: "la próxima reviso mejor la tinta".',
      'Pasaste el control. Triple de oro y una historia para contar arriba. Si llegás.',
      'Ganaste. El Revendedor paga, murmura "14 veces" y se ríe solo de un chiste de hace mil años.',
    ],
    ruletaPierde: [
      'TRUCHA y detectada. El patovica fantasma te dejó en 1 HP de un abrazo. El Revendedor llora de risa.',
      'La entrada era tan trucha que tenía faltas de ortografía. 1 HP y una lección: con el Revendedor, ni a las escondidas.',
    ],
    termoRoto: [
      'Se rompió el Termo del Abuelo... y el agua del mate te curó entero. Gracias, abuelo.',
      'El termo explotó en mil pedazos y te bañó en salud. El abuelo aprueba desde el más allá.',
    ],
    berserk: [
      'MODO MOSH: ves todo rojo. Daño doble, pero tus puños tienen opinión propia.',
      'La máquina te llenó de furia. ATK x2 y cero diplomacia hasta bajar.',
    ],
    midas: [
      'REY DEL MERCH: el oro te ama y los bichos te huelen de lejos. Doble botín, doble atención.',
      'Todo lo que matás brilla doble. Y todo lo que respira te busca.',
    ],
    fantasmal: [
      'MODO BACKSTAGE: 10 turnos atravesando paredes. La arquitectura es una sugerencia.',
      'Sos niebla. Las paredes, un chiste. 10 turnos.',
    ],
    iman: [
      'IMÁN DE PROPINAS: el oro viene solo hacia vos. Por fin algo viene solo en esta vida.',
      'Magnetismo personal. Literal: las monedas caminan hacia vos.',
    ],
    armaRota: [
      'Se rompió {w}. De vuelta a las piñas, como los antiguos.',
      '{w} dijo basta. Descansá en paz, fierro querido.',
      'CRACK. {w} hecha pedazos. Buscá otra, rápido.',
    ],
    arcoVacio: [
      'Último tiro. {w} ya es decoración: lo tirás.',
      'Sin munición. {w} al tacho, a buscar otro.',
      'Click. Click. Nada. Chau {w}.',
    ],
    bfgPickup: [
      'EL LANZACOHETES DEL BUHONERO. Un tiro. UNO. Elegí bien el momento, estrella.',
      'Levantaste el Lanzacohetes. El pozo contiene la respiración. ¿Qué comprás, forastero? La muerte, aparentemente.',
    ],
    bfgDisparo: [
      'FUMMMM. La habitación quedó en silencio. Y en llamas.',
      'UN TIRO. CERO SOBREVIVIENTES. Cero bises.',
      'El Lanzacohetes habló. El pozo escuchó.',
    ],
    bfgVacia: [
      'El Lanzacohetes quedó vacío. Fue hermoso mientras duró.',
      'Sin cohete, el tubo es un recuerdo de gira. Lo soltás con respeto.',
    ],
    recarga: [
      'Misma arma: le sumás lo que traía. {w} ahora con {n}.',
      'Recargaste {w}. A seguir tirando: {n}.',
      'Otro {w} igual: combinás y seguís. {n}.',
      'Dos {w} es mejor que uno... bueno, es uno con más: {n}.',
    ],
    lootArma: [
      '{w}. Esto ya es otra cosa, eh.',
      'Equipaste: {w}. Ahora sí das un poco de miedo.',
      '{w} nueva. Los monstruos no saben lo que les espera. Vos tampoco, pero bueno.',
    ],
    lootRepetido: [
      'Ya tenés algo mejor. Lo vendés por {g} de oro, ni se inmuta nadie.',
      'Chatarra al lado de lo tuyo: +{g} oro y a otra cosa.',
    ],
    disco: [
      'MODO DISCO. Porque la previa también se baila.',
      'Luces, colores... ¿esto era un pozo o un boliche?',
    ],
    nivel42: [
      'Nivel 42: la respuesta a la vida, el universo y todo lo demás. Loot doble, obvio.',
    ],
    nivel100: [
      'NIVEL 100. Ok, esto ya es preocupante. Hidratate, leyenda. Te lo ganaste... supongo.',
    ],
  };

  const last = {};
  MZ.quote = function (cat, vars) {
    const pool = Q[cat];
    if (!pool || !pool.length) return '';
    let i = Math.floor(Math.random() * pool.length);
    if (pool.length > 1 && i === last[cat]) i = (i + 1) % pool.length;
    last[cat] = i;
    let s = pool[i];
    if (vars) for (const k in vars) s = s.replaceAll('{' + k + '}', vars[k]);
    return s;
  };

  // Muestra la frase como toast (ui.js define toast).
  MZ.say = function (cat, vars, ms) {
    const s = MZ.quote(cat, vars);
    if (s && MZ.ui) MZ.ui.toast(s, ms);
    return s;
  };
})();
