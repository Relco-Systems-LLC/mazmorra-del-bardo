// Los comentarios picantes. Argentino, bardeo amistoso.
window.MZ = window.MZ || {};
(() => {
  const Q = {
    morir: [
      'F. Llegaste al nivel {n}. Mi abuela llegó más lejos y juega con el celu al revés.',
      'Moriste como viviste: tocando cualquier cosa.',
      'El dungeon 1 — Vos 0. Como siempre.',
      '¿Ya está? ¿Eso fue todo? Tibio.',
      'No pasa nada, campeón. Bueno, sí: te moriste.',
      'Muerte n.º {d}. Qué constancia, te admiro.',
      'Avisale al laburo que mañana no vas: estás de duelo. Por vos.',
      'Spoiler: el héroe muere al final. Y al principio. Y en el medio.',
      'Nivel {n}. El dungeon ni se enteró de que viniste.',
      'Tranqui, perder también es un estilo de juego.',
    ],
    matar: [
      "Tomá pa' vos.",
      '¿Viste? Cuando querés, podés.',
      'Uno menos. Quedan infinitos.',
      'Fatality criollo.',
      'Eso dolió hasta acá.',
      'Chau, que descanse.',
      'Limpito. Sin testigos.',
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
      'Guardalo, que eso no se consigue en cualquier kiosco.',
      'Upgrade. Ahora sí parecés un aventurero y no un turista.',
    ],
    lootMalo: [
      'Una espada oxidada. Tremendo botín, crack.',
      'Oro. Bueno, algo es algo.',
      'Otra poción dudosa. Vos tomala igual, total...',
      'Monedas sueltas. Ni para el bondi.',
    ],
    jefeIntro: [
      'Uh, llegó el jefe. Y vos sin currículum.',
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
      '¿Te dormiste? El dungeon no se recorre solo, eh.',
      'Hola... ¿hay alguien ahí? Toc toc.',
      'Mientras lo pensás, los esqueletos cobran por hora.',
      'Tomate tu tiempo, total el aburrimiento era el enemigo, ¿no?',
      '¿Estás scrolleando otra app? Acá. Ojos acá.',
    ],
    danioGrande: [
      '¿Eso fue esquivar o ponerle el pecho?',
      'Te dieron de lleno. Dolió hasta en el HUD.',
      'Au. Eso va a dejar marca.',
      '¿Vas a dejar que te pegue así? Reaccioná.',
    ],
    nivel: [
      'Nivel {n}. Cada vez más hondo, cada vez peor.',
      'Bajando... acá ya ni el wifi llega.',
      'Nivel {n}. ¿Quién te manda?',
      'Más abajo. El alquiler acá debe ser regalado.',
    ],
    racha: [
      'Racha de {k}. Andá a comprar un Quini.',
      '{k} seguidos sin que te toquen. Bueno, tampoco te la creas.',
      'Imparable. ¿Quién sos y qué hiciste con el de antes?',
    ],
    volver: [
      '¿Otra vez vos? Bueno, pasá.',
      'Volviste. El dungeon te extrañaba (mentira).',
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
      'Mate amargo, dungeon dulce.',
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
      'Pisaste los pinchos. Estaban ahí. Brillaban. Los VISTE.',
      'Pinchos 1 — Lectura del terreno 0.',
      'Auch. El piso acá abajo tiene opiniones.',
    ],
    altarBueno: [
      'El altar te bendice. Alguien ahí abajo te banca.',
      'Energía buena del altar. Aprovechá, que no es de todos los días.',
      'El altar vibró y te sentiste mejor. No preguntes cómo funciona.',
    ],
    altarMalo: [
      'El altar estaba de mal humor. Como todo acá.',
      'Le rezaste al altar equivocado, genio.',
      'El altar te miró y dijo "no". Y encima te maldijo.',
    ],
    veneno: [
      'Envenenado. La poción decía "agitar antes de usar", no "desconfiar antes de usar".',
      'Veneno en las venas. Como el lunes, pero literal.',
      'Te envenenaron. Tomate algo, pero algo bueno esta vez.',
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
      'MODO DISCO. Porque el bardo también se baila.',
      'Luces, colores... ¿esto era un dungeon o un boliche?',
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
