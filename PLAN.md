# Plan: "Mazmorra del Bardo" — Dungeon roguelike para celular

## Context

Juego nuevo desde cero para matar el aburrimiento adulto: un roguelike de dungeon por turnos, jugable en el navegador de un **Nothing Phone (2a) SIN internet**. Decisiones ya tomadas con el usuario:

- **Gameplay**: roguelike por turnos en grilla, tap para moverte (estilo Pixel Dungeon / Hoplite)
- **Stack**: PixiJS (vendoreado local, sin CDN — el celu no tiene internet)
- **Estética**: neón oscuro — fondo negro, glow saturado, partículas, explosiones, screen shake
- **Humor**: comentarios picantes en argentino (bardeo amistoso, sin puteadas fuertes)
- **Extras pedidos**: niveles infinitos regenerados proceduralmente, easter eggs, destellos pop

## Restricción central: offline total

- `vendor/pixi.min.js` descargado una sola vez (PixiJS v8, build de navegador IIFE → `window.PIXI`). Cero requests externos en runtime.
- Sin assets externos: texturas generadas en runtime con `Graphics`/`RenderTexture`, sonido procedural con WebAudio (bleeps, explosiones), fuente del sistema.
- Build final: **un solo archivo `dist/mazmorra.html`** con pixi + juego inlineados, para copiar al celular y abrir con el navegador (funciona desde `file://` porque no hay módulos ESM ni fetch).
- Para desarrollo/testeo: `python3 -m http.server` y abrir desde el celu por IP de LAN (misma WiFi, sin internet igual funciona).

## Estructura del proyecto

```
~/dungeon-game/
├── index.html          # shell: canvas fullscreen, viewport meta, carga scripts en orden
├── vendor/pixi.min.js  # PixiJS v8 vendoreado
├── src/
│   ├── rng.js          # PRNG seedeado (mulberry32) — niveles reproducibles por seed
│   ├── dungeon.js      # generación procedural de niveles
│   ├── entities.js     # jugador, enemigos, ítems, escalera
│   ├── combat.js       # turnos, bump-attack, stats, escalado por profundidad
│   ├── fx.js           # partículas, explosiones, screen shake, flashes, daño flotante
│   ├── audio.js        # sonidos procedurales WebAudio
│   ├── quotes.js       # los comentarios picantes argentinos
│   ├── easter.js       # easter eggs
│   ├── save.js         # localStorage: récords, oro persistente, run en curso
│   ├── ui.js           # HUD (HP, nivel, oro), toast de comentarios, pantallas de muerte/inicio
│   └── main.js         # bootstrap Pixi, game loop, input táctil
└── build.sh            # genera dist/mazmorra.html (inline de todos los scripts)
```

Sin bundler ni build tooling: scripts planos concatenados por orden de `<script>` en index.html. `build.sh` es un script simple que inlinea los `<script src>` dentro del HTML.

## Diseño del juego

### Core loop (por turnos)
- Grilla ~11×16 tiles (vertical, una mano). Tap en un tile → pathfinding (BFS) y el jugador camina solo; se frena si aparece un enemigo a la vista. Tap sobre enemigo adyacente → ataque.
- Cada movimiento del jugador = un turno: los enemigos se mueven/atacan (persecución greedy con línea de visión).
- Combate bump-to-attack: HP/ATK/DEF, chance de crítico (con destello extra y frase picante).
- Muerte = fin del run, pantalla de muerte con estadísticas y bardeo. El oro recolectado persiste (meta-progresión liviana para enganchar).

### Niveles infinitos procedurales
- `dungeon.js`: generación por **random walk + salas** (más orgánico que BSP y más simple), garantizando conectividad entrada→escalera.
- Seed por nivel = `hash(seedRun, profundidad)` → infinitos y reproducibles.
- Escalado por profundidad: más enemigos, más HP/ATK, tipos nuevos cada ~3 niveles, **jefe cada 5 niveles** (sala especial, frase de entrada).
- Tema visual rota cada 5 niveles: paleta neón distinta (cian→violeta→rojo→verde ácido→dorado) para que la regeneración se sienta fresca.
- Contenido: oro 💰, pociones, armas/armaduras que suben stats, mate ☕ (curación full + frase), trampas con destello de aviso sutil.

### Juice (destellos pop / explosiones)
Todo en `fx.js` con sprites aditivos (textura radial generada en runtime + `blendMode: 'add'`):
- Explosión al morir un enemigo: anillo expansivo + 15-30 partículas + flash blanco 1 frame + screen shake proporcional.
- Golpes: flash del sprite, número de daño flotante que sube y se desvanece, partículas del color del atacante.
- Loot: pulso dorado constante, estallido de chispas al agarrar.
- Escalera: glow respirante. Críticos: shake fuerte + slowmo de 150ms.
- Movimiento: trail sutil del jugador.

### Comentarios picantes (`quotes.js`)
Pools de frases en argentino por evento, elegidas al azar, mostradas como toast arriba:
- **Morir**: "F. Moriste en el nivel 3. Mi abuela llegó más lejos."
- **Matar jefe**: "Bueno, bueno... alguien se levantó inspirado hoy."
- **Loot mediocre**: "Una espada oxidada. Tremendo botín, crack."
- **Idle >20s**: "¿Te dormiste? El dungeon no se va a recorrer solo, eh."
- **Recibir mucho daño**: "¿Eso fue esquivar o ponerle el pecho?"
- ~8-12 frases por categoría (morir, matar, crítico, loot, level up, jefe, idle, racha, volver a jugar).

### Easter eggs (`easter.js`)
- **Nivel 42**: "La respuesta a todo" — nivel dorado, loot extra.
- **Sala secreta** (~5% por nivel): pared rompible con grieta sutil, adentro hay un tesoro y una frase.
- **El Pombero**: enemigo rarísimo (1%) que te roba oro y se teletransporta.
- **Tap 7 veces en el contador de HP**: modo "disco" (paleta arcoíris un nivel).
- **Mate legendario** (drop raro): cura full + buff + "Esto sí que es un buen mate, papá."
- **Nivel 100**: pantalla especial de felicitación con bardeo invertido (te elogia, desconfiado).

### Persistencia (`save.js`)
localStorage: récord de profundidad, kills totales, oro persistente, muertes acumuladas (usadas para bardearte: "Muerte n.º 47, qué constancia").

## Orden de implementación

1. **Setup**: crear `~/dungeon-game/`, descargar `pixi.min.js` (v8 browser build), `index.html` con canvas fullscreen + viewport mobile (`user-scalable=no`, `touch-action: none`).
2. **Núcleo jugable**: `rng.js` + `dungeon.js` (generación + render de tiles con glow) + `main.js` (Pixi init, input táctil, cámara que sigue al jugador) + movimiento por tap con BFS.
3. **Combate y enemigos**: `entities.js` + `combat.js` — turnos, 4-5 tipos de enemigos, escalado, escalera → nivel siguiente infinito.
4. **Juice**: `fx.js` (partículas, explosiones, shake, daño flotante) + `audio.js` (WebAudio procedural).
5. **Picante y meta**: `quotes.js` + `ui.js` (HUD, toasts, pantallas de inicio/muerte) + `save.js`.
6. **Easter eggs y jefes**: `easter.js`, jefes cada 5 niveles, temas de color rotativos.
7. **Build offline**: `build.sh` → `dist/mazmorra.html` único; verificar que funciona desde `file://`.

## Verificación

1. **Desktop**: `python3 -m http.server 8080` en `~/dungeon-game/`, abrir en navegador con emulación móvil (DevTools), jugar varios niveles: movimiento por tap, combate, muerte, regeneración de niveles, persistencia tras recargar.
2. **Single-file**: correr `build.sh`, abrir `dist/mazmorra.html` directo con `file://` y confirmar que carga sin red (DevTools offline mode).
3. **En el celu**: opción A — misma WiFi, abrir `http://<ip-pc>:8080`; opción B — copiar `dist/mazmorra.html` al teléfono y abrirlo con el navegador. Verificar touch real, performance (~60fps en el Nothing Phone 2a) y que no haya zoom/scroll accidental.
