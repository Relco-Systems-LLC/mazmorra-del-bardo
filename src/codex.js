// Bestiario / Pokedex: se llena al ver monstruos, hablar NPCs y agarrar objetos.
// 3 oraciones de lore picante por entrada descubierta.
window.MZ = window.MZ || {};
(() => {
  MZ.CODEX = {
    monstruos: [
      { id: 'rata', nombre: 'Rata de Camarín', sprite: 'rata', color: 0xff5577, lore: [
        'Vivía en los camarines comiendo restos de catering de la gira.',
        'Cien años de espera la volvieron territorial y rencorosa.',
        'Muerde tobillos como si fueran la última empanada del backstage.' ] },
      { id: 'mosquito', nombre: 'Mosquito de Pattaya', sprite: 'mosquito', color: 0xcc2222, lore: [
        'Vino pegado al equipaje de la banda desde una noche tropical.',
        'Cien años sin repelente lo volvieron audaz y vengativo.',
        'Solo, es una molestia; en grupo, son la peor noche de tu vida.' ] },
      { id: 'slime', nombre: 'Pad Thai Maldito', sprite: 'slime', color: 0x66ff99, lore: [
        'Quedó del catering de Bangkok y nadie se animó a tirarlo.',
        'Cien años después desarrolló opiniones y apetito propio.',
        'Se mueve cada dos turnos: la salsa pesa.' ] },
      { id: 'vibora', nombre: 'Cobra del Templo', sprite: 'vibora', color: 0x2ecc40, lore: [
        'Custodiaba el templo donde el monje bendijo la gira al revés.',
        'Bajó al pozo siguiendo la maldición, por responsabilidad profesional.',
        'Pegale de lejos o vas a pasar el próximo nivel verde de la cara.' ] },
      { id: 'esqueleto', nombre: 'Zombie de la Fila', sprite: 'esqueleto', color: 0x9ad89a, lore: [
        'Hizo la fila para el Show Final. La sigue haciendo.',
        'Esperó tanto que se le pasó la vida, literalmente.',
        'Golpea seco, como quien defiende su lugar en la fila.' ] },
      { id: 'fantasma', nombre: 'Groupie Fantasma', sprite: 'fantasma', color: 0xffb8d4, lore: [
        'Siguió a la banda por siete ciudades y un naufragio emocional.',
        'Atraviesa paredes porque ninguna puerta de camarín la paró nunca.',
        'Translúcida, intensa y con muy mala puntería emocional.' ] },
      { id: 'arquero', nombre: 'El Plomo Renegado', sprite: 'arquero', color: 0x8a8a96, lore: [
        'Era roadie de la gira hasta que pidió aumento la noche equivocada.',
        'Ahora tira púas afiladas desde cinco casilleros de distancia.',
        'Si lo ves lejos, no te quedes quieto haciéndote el valiente.' ] },
      { id: 'ojo', nombre: 'El Ojo del Paparazzi', sprite: 'ojo', color: 0x4488ff, lore: [
        'Fotografió a la banda en sus peores momentos y los vendió todos.',
        'Quedó reducido a un lente flotante con muy malas intenciones.',
        'Te castiga a distancia, porque el zoom nunca le alcanzó.' ] },
      { id: 'golem', nombre: 'Gólem de Parlantes', sprite: 'golem', color: 0x8a96a4, lore: [
        'La pared de sonido de la gira, apilada con criterio dudoso.',
        'Un día se cansó de que la enchufen y desenchufen, y caminó.',
        'Lento como prueba de sonido, pero te parte al medio si te alcanza.' ] },
      { id: 'vampiro', nombre: 'Vampiro del Merch', sprite: 'vampiro', color: 0xff2222, lore: [
        'Vendía remeras truchas a precio de originales en cada parada.',
        'Ahora te chupa la energía a vos: cada golpe que te da, se cura.',
        'Matalo rápido o se va a poner más sano que vos.' ] },
      { id: 'payaso', nombre: 'El Payaso del Parque', sprite: 'payaso', color: 0xff2244, lore: [
        'Animaba la fila del parque de Orlando hasta que la fila se murió.',
        'Tira algodón de azúcar vencido con una sonrisa que no se borra ni muerto.',
        'El humor del subsuelo es así: te envenena y encima se ríe.' ] },
      { id: 'rataBlanca', nombre: 'La Rata Blanca', sprite: 'rataBlanca', color: 0xffffff, lore: [
        'Leyenda del pozo: cuando aparece, suena un solo de guitarra a lo lejos.',
        'Cazarla hace llover oro como en el mejor recital de los ochenta.',
        'Mujer amante de la fortuna: rarísima, blanca y generosa.' ] },
      { id: 'pombero', nombre: 'El Pombero', sprite: 'pombero', color: 0x00ff88, lore: [
        'El duende del folclore que SÍ existe, y encima te afana el oro.',
        'Silba, te roba y se teletransporta antes de que reacciones.',
        'Si lográs cazarlo, devuelve el doble: el karma criollo es real.' ] },
      { id: 'mimic', nombre: 'Flight Case Mordedor', sprite: 'mimic', color: 0xb8c4d0, lore: [
        'Una caja de equipos que aprendió que la mejor carnada es la codicia ajena.',
        'Te muerde apenas la abrís: el equipaje eras vos, campeón.',
        'Regla de oro de la gira: nada lindo es gratis.' ] },
      { id: 'barril', nombre: 'Barril de Pirotecnia', sprite: 'barril', color: 0xffa500, lore: [
        'Sobró del show de Dallas, donde la pirotecnia era ilegal y abundante.',
        'No se mueve ni ataca, pero reventalo cerca de un enemigo y agradecé.',
        'Cuidado con la onda expansiva: también te empuja a vos.' ] },
    ],
    jefes: [
      { id: 'El Patovica', nombre: 'El Patovica', sprite: 'jefe', color: 0xff2266, lore: [
        'Cuidaba la puerta de La Previa y no dejó salir a la banda por las buenas.',
        '"Acá nacieron, acá se quedan", dijo, y la maldición lo tomó literal.',
        'Pega tan fuerte que te mueve de casillero: respetá la distancia.' ] },
      { id: 'El DJ Vendido', nombre: 'El DJ Vendido', sprite: 'jefe', color: 0xff2266, lore: [
        'Juró venganza cuando la banda dejó el boliche: cumbia eterna en su homenaje.',
        'Ni el power metal ni la cumbia lo reclaman: quedó en el medio, maldito.',
        'Reina en el piso 10 con un fade mal hecho y mucho rencor.' ] },
      { id: 'El Tuk-Tukero Fantasma', nombre: 'El Tuk-Tukero Fantasma', sprite: 'jefe', color: 0xff2266, lore: [
        'Prometió "vuelta corta, precio especial" y nunca llegó a destino.',
        'El taxímetro sigue corriendo desde hace cien años.',
        'Cobra el viaje en sangre, porque el oro ya no le alcanza.' ] },
      { id: 'La Madama de Walking Street', nombre: 'La Madama de Walking Street', sprite: 'jefe', color: 0xff2266, lore: [
        'Manejaba la noche de Pattaya entera con una agenda y dos sonrisas.',
        'La banda le debe una cuenta que la Productora censuró completa.',
        'Reina del piso 20: la hora feliz terminó, el resentimiento no.' ] },
      { id: 'El Salvavidas', nombre: 'El Salvavidas', sprite: 'jefe', color: 0xff2266, lore: [
        'No dejó a la banda meterse al mar de Miami: "traen tormenta", decía.',
        'Tenía razón, y tener razón cien años seguidos arruina a cualquiera.',
        'Silbato en mano, ahora no deja pasar a nadie. Por las dudas.' ] },
      { id: 'El Ratón Trucho', nombre: 'El Ratón Trucho', sprite: 'jefe', color: 0xff2266, lore: [
        'Lo contrataron para UNA foto con la banda y no se sacó más el traje.',
        'El método actoral lo consumió: ya nadie sabe qué hay adentro.',
        'Jefe del piso 30: sonrisa cosida, abrazo de oso, cero contrato.' ] },
      { id: 'El Sheriff del BBQ', nombre: 'El Sheriff del BBQ', sprite: 'jefe', color: 0xff2266, lore: [
        'Multó a la banda por volumen, por pelo y por "condimentar mal".',
        'Tres multas en una noche: récord del condado, orgullo personal.',
        'Custodia el piso 35 con la chapa oxidada y la salsa intacta.' ] },
      { id: 'El Toro Mecánico', nombre: 'El Toro Mecánico', sprite: 'jefe', color: 0xff2266, lore: [
        'Nadie de la banda le aguantó ni tres segundos en Dallas.',
        'El cantante dijo que estaba poseído; el toro nunca lo desmintió.',
        'Ocho segundos, dicen. Nadie. Nunca. Ni vos.' ] },
      { id: 'El Mayordomo', nombre: 'El Mayordomo', sprite: 'jefe', color: 0xff2266, lore: [
        'Vino incluido con la mansión, lo cual no es normal y nadie preguntó.',
        'Sirve al Mánager desde antes de conocerlo, lo cual es peor.',
        'Guarda el piso 45 con guantes blancos y modales letales.' ] },
      { id: 'La Cancelación', nombre: 'La Cancelación', sprite: 'jefe', color: 0xff2266, lore: [
        'Las dos palabras del Mánager hechas carne: "se cancela".',
        'Cien años de shows suspendidos, sueños cortados y entradas sin usar.',
        'Te espera en el 50: matala y el Show Final vuelve a estar en cartel.' ] },
      { id: 'jefe', nombre: 'Jefe de Parada', sprite: 'jefe', color: 0xff2266, lore: [
        'Cada cinco niveles, alguien que la gira arruinó te corta el paso.',
        'Su sala es especial: rojo infierno, marca ritual y mística Doom.',
        'Caen mate seguro y, a veces, el Lanzacohetes de premio.' ] },
    ],
    personajes: [
      { id: 'mercader', nombre: 'El Buhonero', sprite: 'mercader', color: 0xffd27f, lore: [
        'Vende en todos los pisos: abre la gabardina y brilla todo, legal no es nada.',
        'Todo se le "cayó de un contenedor", el contenedor de otra gira.',
        'Acepta oro, no acepta quejas, devoluciones ni preguntas.' ] },
      { id: 'morena', nombre: 'Morena', sprite: 'morena', color: 0xff4cf0, lore: [
        'La corista de la banda que ya era bruja antes de la gira; el escenario era hobby.',
        'Si le tirás onda y sobrevivís, el romance crece run tras run.',
        'Sus besos curan, sus mates enamoran y su tequila es de Pattaya.' ] },
      { id: 'bardo', nombre: 'El Plomo Viejo', sprite: 'bardo', color: 0x66aaff, lore: [
        'Cargó cada parlante de la gira y cada secreto de la banda.',
        'Te cuenta la historia completa en capítulos, gorra al revés mediante.',
        'Asegura que la lumbalgia es "información acumulada". Le creemos.' ] },
      { id: 'rodrigo', nombre: 'Rodrigo el Casado', sprite: 'rodrigo', color: 0x9aa5b1, lore: [
        'Perdió su anillo de casamiento en una zona "turística" del pozo.',
        'Te paga bien por recuperarlo y mejor por no hacer preguntas.',
        'Spoiler: el anillo dice "Para R., con amor, M." y M no es su señora.' ] },
      { id: 'esperanza', nombre: 'Esperanza, la Viuda', sprite: 'esperanza', color: 0xff2255, lore: [
        'Enviudó de un jefe de piso. Y de otro. Empezamos a sospechar en el tercero.',
        'Te manda a vengarla matando al jefe, que era su difunto marido.',
        'Cumplida la venganza, capaz te invita a salir el viernes.' ] },
      { id: 'nona', nombre: 'La Nona del Hostel', sprite: 'nona', color: 0xb088dd, lore: [
        'Regentea el hostel del pozo; su guiso resucitaba giras enteras.',
        'Te cura con comida y te bardea con amor por estar tan flaco.',
        'Hace veinte años que tiene una cama hecha esperando a su nieto.' ] },
      { id: 'tahur', nombre: 'El Revendedor', sprite: 'tahur', color: 0xffd700, lore: [
        'Vendió la misma entrada del Show Final catorce veces. Su récord personal.',
        'Doble o nada con dados cargados de carisma y de plomo.',
        'Si te animás a la entrada trucha, que San Cayetano te ampare.' ] },
      { id: 'herrero', nombre: 'El Luthier', sprite: 'herrero', color: 0x9aa5b1, lore: [
        'Afinaba las guitarras de la banda; ahora afina cosas que cortan.',
        'Te unta el filo con wasabi, refuerza el escudo y afina el ataque.',
        'Dice que el oído es el mismo. Nadie se anima a discutirle.' ] },
      { id: 'nieto', nombre: 'Tato, el Mochilero', sprite: 'nieto', color: 0xc0c8d0, lore: [
        'El nieto de la Nona: bajó hace veinte años siguiendo a la banda.',
        'Nunca encontró la salida (y se quedó jugando al Helbreath en un cyber enterrado).',
        'Contarle que la Nona lo espera cierra el arco más tierno del pozo.' ] },
      { id: 'fundador', nombre: 'El Mánager', sprite: 'fundador', color: 0xffd700, lore: [
        'El del traje, el del contrato, el de las dos palabras: "se cancela".',
        'Canceló el Show Final para que la gira no termine nunca.',
        'Te espera en el nivel 50. Llevá el pasaporte completo y exigile el show.' ] },
      { id: 'critico', nombre: 'El Crítico de Rock', sprite: 'critico', color: 0xccaa66, lore: [
        'Reseñó los siete shows de la gira: todos dos estrellas, por principio.',
        'La maldición no lo agarra: para maldecir a un crítico, primero debe importarle algo.',
        'Si le sacás cuatro estrellas, hasta te paga del fondo de prensa.' ] },
      { id: 'djtigre', nombre: 'El Sonidista', sprite: 'djtigre', color: 0xff8800, lore: [
        'Maneja la consola del pozo: la prueba de sonido más larga de la historia.',
        'Te cura con power metal por los monitores y, si hay suerte, te sube el ATK.',
        'Pedile una lenta de Edguy si venís golpeado; nadie juzga acá abajo.' ] },
      { id: 'brisa', nombre: 'Brisa, la Azafata', sprite: 'brisa', color: 0xff8800, lore: [
        'Tripulación del charter de la gira: el vuelo terminó, el servicio no.',
        'Aparece después de cada parada limpia para sellarte el pasaporte.',
        'Cinco sellos y el Show Final se puede exigir. Ella confía en vos.' ] },
      { id: 'nuan', nombre: 'Nuan, la Masajista', sprite: 'nuan', color: 0xff66aa, lore: [
        'Los mejores masajes de Pattaya y, por hundimiento, de todo el pozo.',
        'Su masaje tradicional te cruje la columna en dos idiomas.',
        'El "completo" viene censurado por la Productora. Vale cada bloque.' ] },
      { id: 'monje', nombre: 'El Monje del Templo', sprite: 'monje', color: 0xff8822, lore: [
        'Bendijo la gira hace cien años y le salió "al revés". O perfecta.',
        'Sigue practicando: su bendición da +2 HP máx y cero garantías.',
        'Su mantra suena sospechosamente a WOLOLO. Coincidencia teológica.' ] },
      { id: 'tuktukero', nombre: 'El Tuk-Tukero', sprite: 'tuktukero', color: 0xffe14d, lore: [
        'Tuk-tuk fantasma, motor eterno, precio especial solo por hoy.',
        'Por unas monedas te dibuja el piso entero a 90 km/h.',
        'El tuk-tuk no baja escaleras. Detalle menor, dice él.' ] },
      { id: 'lola', nombre: 'Lola de Walking Street', sprite: 'lola', color: 0xff2244, lore: [
        'Atiende la sucursal hundida de Walking Street: cien años de hora feliz.',
        'Sus buckets curan mucho y cobran un poquito de resaca.',
        'La "compañía" viene censurada por la Productora, que es una mojigata.' ] },
      { id: 'mochilero', nombre: 'El Mochilero Alemán', sprite: 'mochilero', color: 0x44ccaa, lore: [
        'Vino por dos semanas hace... no sabe. El tiempo es un constructo, ¿ja?',
        'Vio a la banda en Bangkok y se quedó esperando el show final.',
        'Regala mapas dibujados a mano: distancias mal, espíritu bien.' ] },
      { id: 'heladero', nombre: 'El Heladero de Miami', sprite: 'heladero', color: 0xffaacc, lore: [
        'Su helado de coco curaba resacas que la medicina no se anima a nombrar.',
        'El stock sigue frío después de cien años y prefiere no preguntarse cómo.',
        'La banda le compraba siempre, menos el día del show. Mal augurio.' ] },
      { id: 'influencer', nombre: 'La Influencer', sprite: 'influencer', color: 0xff44aa, lore: [
        'Quedó atrapada en el pozo con el teléfono lleno y la señal muerta.',
        'Te paga pauta por posar: el contenido es eterno, como la gira.',
        'Te saca fotos "candid" mientras hablás. Esas no se pagan. 💅' ] },
      { id: 'fotografo', nombre: 'El Fotógrafo del Parque', sprite: 'fotografo', color: 0xff6644, lore: [
        'Sacaba las fotos oficiales del parque de Orlando, "salen en el acto".',
        'El laboratorio se hundió en el 26 y le quedaron flashes para regalar.',
        'Su flash paraliza a una banda entera de bichos. El arte es eso.' ] },
      { id: 'cocodrilo', nombre: 'Don Cocodrilo', sprite: 'cocodrilo', color: 0x44aa44, lore: [
        'Trajo el show de cocodrilos de los Everglades al pozo, con Carlitos incluido.',
        'Metés la mano en la pileta: 50% oro de turista, 50% mordisco.',
        'Carlitos respeta a los cobardes: dice que viven más.' ] },
      { id: 'pitmaster', nombre: 'El Pitmaster de Kansas', sprite: 'pitmaster', color: 0xff5533, lore: [
        'Su ahumador lleva cien años prendido y las costillas siguen en su punto.',
        'Te cura entero, elijas BBQ o asado: premia la honestidad y la diplomacia.',
        'Echó a la banda una vez. Volvieron pidiendo perdón con la guitarra.' ] },
      { id: 'cowboy', nombre: 'El Cowboy Filósofo', sprite: 'cowboy', color: 0xd8c8a0, lore: [
        'Vio pasar la gira por la ruta y le quedaron pensamientos largos.',
        'Vende un cinturón de cuero curtido por el sol y dos divorcios (+1 DEF).',
        '"Nadie que canta en la ruta está perdido del todo", dice. Y sirve otra.' ] },
      { id: 'porrista', nombre: 'La Porrista de Dallas', sprite: 'porrista', color: 0x4488ff, lore: [
        'Seguía a la banda con coreografía propia: power metal con pompones.',
        'Ahora te alienta a vos: con racha de 5 te regala el grito sagrado (+1 ATK).',
        'Su compromiso con el aliento es total e inquebrantable. 📣' ] },
      { id: 'camionero', nombre: 'El Camionero', sprite: 'camionero', color: 0xcc2222, lore: [
        'Lleva carga de Kansas a Dallas desde hace cien años. El camión, quieto.',
        'Vende granadas del cargamento que "se cayó del camión".',
        'Si alguien pregunta: vos no lo viste y él no existe. Lo segundo es cierto.' ] },
      { id: 'dt', nombre: 'El DT', sprite: 'dt', color: 0x2a8a2a, lore: [
        'Dirigió equipos toda la vida y ahora dirige aventureros perdidos.',
        'Te calcula la media como en el PES 6: la media no se discute, se mejora.',
        'Con racha de 8 te ficha y paga prima. No hay dirigencia, pero el gesto vale.' ] },
      { id: 'mucama', nombre: 'La Mucama de la Mansión', sprite: 'mucama', color: 0xd8d8e0, lore: [
        'Limpia la mansión desde antes de la Cancelación. Las mucamas saben TODO.',
        'Te "cambia las sábanas": cura completa y chisme de regalo.',
        'Fue la primera en sospechar del Mánager. Nadie le creyó. Perdón, Rosa.' ] },
      { id: 'jardinero', nombre: 'El Jardinero', sprite: 'jardinero', color: 0x55ee55, lore: [
        'Cultiva hierba verde que cura y hierba roja que potencia.',
        'Su mezcla cura todo, suma vida máxima y a veces muestra el futuro.',
        'El bajista vio el futuro una vez. No le gustó. Qué claridad, igual.' ] },
      { id: 'detective', nombre: 'El Detective', sprite: 'detective', color: 0xd8c8a8, lore: [
        'Investiga la Cancelación: cien años de caso abierto y un solo sospechoso.',
        'Te compra el archivo del bestiario: paga por ficha descubierta.',
        'Su consejo: no preguntes SI canceló. Preguntá POR QUÉ.' ] },
      { id: 'cuervo', nombre: 'El Cuervo del Vestíbulo', sprite: 'cuervo', color: 0x8888aa, lore: [
        'Vive en el vestíbulo de la mansión y cobra en monedas. CRAA.',
        'Por diez de oro vuela el piso entero y te lo dibuja en dos segundos.',
        'Un cuervo con ética laboral: el mejor empleado de la mansión.' ] },
      { id: 'groupie', nombre: 'La Groupie Eterna', sprite: 'groupie', color: 0xcc4488, lore: [
        'Fan número uno desde el primer martes en La Previa. Tiene las ocho entradas.',
        'Si venís con racha de 3, te cura entero con un beso de fan.',
        'Tiene un tema pendiente con Morena. No preguntes por la discografía.' ] },
      { id: 'tatuador', nombre: 'El Tatuador de Bangkok', sprite: 'tatuador', color: 0x2a8a8a, lore: [
        'Tatuó a la banda entera, incluida la X sobre la cara del Mánager.',
        'Le queda tinta sagrada para un tatuaje: +1 ATK para siempre.',
        'Te tatúa el acorde que falta. Cuando suene, va a arder. Ese día no es hoy.' ] },
      { id: 'chamana', nombre: 'La Chamana del Mercado', sprite: 'chamana', color: 0xb14cff, lore: [
        'Lee la suerte en la palma, los dados o la espuma del bucket.',
        'La gira le dejó el don: cien años viendo futuros que no llegan.',
        'A veces la espuma no dice nada. Hasta el más allá tiene días flojos.' ] },
      { id: 'gato', nombre: 'El Gato del Hostel', sprite: 'gato', color: 0xcccccc, lore: [
        'Duerme sobre el lugar exactamente más calentito de cada piso.',
        'Acariciarlo cura un poco; muy de vez en cuando, presta una vida.',
        'Tiene siete y las administra mejor que vos. No se lo cuentes a nadie.' ] },
      { id: 'elvis', nombre: 'El Imitador de Elvis', sprite: 'elvis', color: 0xffe680, lore: [
        'Le enseñó a la banda que no importa ser el original: importa que la gente cante.',
        'Por diez de propina canta como si el estadio estuviera lleno. Para él lo está.',
        'El cantante le afanó la pose para el resto de la gira. Robo con cariño.' ] },
    ],
    arsenal: [
      { id: 'pinas', nombre: 'Piñas', sprite: 'heroePinas', color: 0x00cfff, lore: [
        'Con lo que arrancás todo run: dos puños y mucha fe.',
        'ATK 1, pero no se rompen ni se quedan sin balas nunca.',
        'Los antiguos peleaban así, y mirá cómo terminaron.' ] },
      { id: 'espada', nombre: 'Armas Blancas', sprite: 'espada', color: 0x66ddff, lore: [
        'De la Zapatilla Revoleada al Facón del Más Allá: el arsenal de gira escala.',
        'Tienen filo limitado: se gastan y volvés a las piñas.',
        'Agarrar otra igual le suma filos en vez de venderse.' ] },
      { id: 'arco', nombre: 'Tiros y Gomeras', sprite: 'arco', color: 0xffaa66, lore: [
        'De la Gomera de Barrio a la Escopeta del Rancho: muerte a distancia.',
        'Munición corta: cada tiro cuenta, no lo malgastes.',
        'Tap a un enemigo lejano con línea de visión para disparar.' ] },
      { id: 'bfg', nombre: 'El Lanzacohetes del Buhonero', sprite: 'bfg', color: 0x33ff66, lore: [
        'Salió de la gabardina del Buhonero: un tiro, cero bises.',
        'Revienta todo enemigo en línea de visión en un radio enorme.',
        'Cae 5% en cualquier kill, 10% cerca de un jefe vivo. Máximo uno encima.' ] },
      { id: 'termo', nombre: 'Termo del Abuelo', sprite: 'mate', color: 0x88ff66, lore: [
        'Arma blanca con un secreto: al romperse, te ceba un mate sagrado.',
        'Su último servicio es curarte la vida entera.',
        'El abuelo aprueba desde el más allá cada vez que explota.' ] },
      { id: 'punal', nombre: 'Púa Traicionera', sprite: 'espada', color: 0xaa66ff, lore: [
        'Daño x4 si el enemigo no te vio venir: la traición es un arte.',
        'Pero un 10% de las veces te corta a vos, porque el karma vigila.',
        'Para jugadores con sangre fría y dedos cruzados.' ] },
      { id: 'gomeraBat', nombre: 'Gomera de Baterías', sprite: 'arco', color: 0xffff66, lore: [
        'Dispara baterías viejas que rebotan entre enemigos en cadena.',
        'Hasta tres saltos, perdiendo un poco de daño en cada uno.',
        'Reciclar nunca fue tan violento ni tan satisfactorio.' ] },
      { id: 'microfono', nombre: 'Micrófono del Cantante', sprite: 'arco', color: 0xff4cf0, lore: [
        'Un grito amplificado que daña y empuja todo a dos casilleros.',
        'AoE alrededor del blanco: ideal para abrirte paso cantando.',
        'El feedback acústico también es un arma, si sabés usarlo.' ] },
      { id: 'escudo', nombre: 'Escudos', sprite: 'escudo', color: 0x9d6bff, lore: [
        'De la Tapa de Wok al Escudo del Patovica: la defensa improvisada.',
        'Suman DEF y se ven en el brazo del héroe.',
        'No frenan todo, pero la diferencia entre vivir y revivir la hacen.' ] },
      { id: 'potion', nombre: 'Hierba Verde', sprite: 'pocion', color: 0x44cc44, lore: [
        'La del jardinero cura; la del hostel... cuenta infancias ajenas.',
        '75% te cura, 25% era del hostel y te envenena.',
        'Nadie revisa la maceta de origen acá abajo. Vos tampoco.' ] },
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
        'Del que Morena trajo de Pattaya, no preguntes cómo pasó la aduana.',
        'Mañana lo lamentás, hoy sos inmortal.' ] },
      { id: 'heart', nombre: 'Corazón', sprite: 'corazon', color: 0xff3355, lore: [
        'Vida directa en formato órgano: mejor no preguntar de quién era.',
        'Lo sueltan los monstruos, más seguido si venís golpeado.',
        'Late todavía. Asco, pero funciona.' ] },
      { id: 'altar', nombre: 'Máquina de Escribir', sprite: 'altar', color: 0xe8d8a0, lore: [
        'La de la biblioteca de la mansión: redacta sola de noche.',
        'Puede escribirte una bendición, oro, o una cláusula en contra.',
        'MOSH, Rey del Merch, Backstage o Imán: rezá y que redacte lindo.' ] },
      { id: 'pinchos', nombre: 'Púas Gigantes', sprite: 'pinchos', color: 0xd4af37, lore: [
        'Decoración del escenario que quedó con hambre de pisadas.',
        'Te lastiman al pisarlas y no se van: el posicionamiento importa.',
        'El piso de acá abajo tiene opiniones, y duelen.' ] },
      { id: 'cofre', nombre: 'Flight Case', sprite: 'cofre', color: 0xb8c4d0, lore: [
        'Caja de equipos de la gira: oro y un poco de cura adentro.',
        'Ojo: 15% de las veces tiene dientes y se llama Mordedor.',
        'La codicia y el riesgo viajan en la misma caja.' ] },
      { id: 'ametralladora', nombre: 'Ametralladora', sprite: 'ametralladora', color: 0x88909c, lore: [
        'Disparable de ráfaga: mantené apretado en modo apuntar y escupe.',
        'Poco daño por tiro pero muchísima munición. La cantidad tiene su propia calidad.',
        'Para cuando "un tiro bien puesto" no alcanza y querés barrer el pasillo.' ] },
      { id: 'granadaFrag', nombre: 'Granada del Buhonero', sprite: 'granadaFrag', color: 0x3a7d44, lore: [
        'Lanzable: la tirás a una casilla (alcance 4) y revienta todo en radio 1.',
        'Salió de la gabardina; de qué guerra sobró, misterio.',
        'Máximo dos lanzables encima: las manos son dos, campeón.' ] },
      { id: 'granadaMolotov', nombre: 'Bucket Flameado', sprite: 'granadaMolotov', color: 0xff7722, lore: [
        'Lanzable (alcance 3): enciende el piso y el fuego dura varios turnos.',
        'Receta de Walking Street: alcohol de 96 y una sombrillita de papel.',
        'El fuego también te quema a vos si te parás encima, eh.' ] },
      { id: 'granadaStun', nombre: 'Flash de Paparazzi', sprite: 'granadaStun', color: 0xffe14d, lore: [
        'Lanzable de mayor alcance (5): aturde todo en radio 2, pierden turnos.',
        'Poco daño, mucho control: la foto que nadie pidió.',
        'Tiralo y aprovechá los turnos gratis para pegar o escapar.' ] },
      { id: 'vidaExtra', nombre: '1-UP (Vida Extra)', sprite: 'vidaExtra', color: 0xffd700, lore: [
        'Un gatito dorado que te regala una vida más, como en los clásicos.',
        'Drop rarísimo de cualquier piso: agarralo apenas lo veas.',
        'Siete vidas tenías; con esto, ocho. La avaricia felina es sabia.' ] },
      { id: 'altarVida', nombre: 'Altar del Bis', sprite: 'altarVida', color: 0xff3355, lore: [
        'Aparece solo en los pisos de jefe (cada cinco niveles).',
        'Cambia tu oro por una vida extra: el público pide otra, y vos también.',
        'Late como un corazón. No preguntes de quién era.' ] },
      { id: 'mapa', nombre: 'Itinerario de Gira', sprite: 'mapa', color: 0xe8d8a0, lore: [
        'Un papel arrugado que despliega el minimapa del piso entero.',
        'Marca lo que ya recorriste y lo que te falta por explorar.',
        'Lo vende el Buhonero o cae de los bichos; sirve solo para el piso actual.' ] },
      { id: 'anillo', nombre: 'Anillo de Rodrigo', sprite: 'anillo', color: 0x00e5ff, lore: [
        'El anillo de casamiento que Rodrigo perdió en una zona "turística".',
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
      if (w.rapido) return 'ametralladora';
      return w.kind === 'ranged' ? 'arco' : 'espada';
    },
  };
})();
