# AUTHORING.md — Cómo regenerar TODO el contenido del juego para cualquier tema

> Documento dirigido a la IA (vos, en una próxima sesión). Sirve para **re-tematizar el juego
> completo** dado un tema cualquiera — por ejemplo *"hacelo todo McDonald's"* — sin re-descubrir
> la arquitectura y manteniendo el juego **balanceado y jugable**. El **motor no se toca**; se
> reescribe la **capa de contenido**.

---

## 0. Uso rápido

1. El usuario te da un **tema** (ej: McDonald's) y, opcionalmente, una lista de **referencias**
   personales (bandas, viajes, juegos, lugares, chistes internos).
2. Definís la **columna vertebral** (un objetivo legendario que nunca se logró) y **5 actos**.
3. Seguís el **checklist (sección 7)** archivo por archivo, derivando contenido con las **recetas
   (secciones 4–6)**.
4. Respetás los **schemas (sección 3)** y el **balance (sección 8)**.
5. Verificás con los **patrones de test headless (sección 9)** y `./build.sh`.

El ejemplo *McDonald's* aparece como `→ Mc:` a lo largo del doc.

---

## 0.5. TONO — regla innegociable (aplica a CUALQUIER tema)

El juego **SIEMPRE** es **picante** y tiene **temática sexual sugerente**. No es opcional ni
depende del tema: McDonald's, piratas, oficina, lo que sea — el humor adulto y la insinuación
sexual son parte del ADN. Pautas:

- **Voz**: argentino, sarcástico, bardo amistoso al jugador (puteadas suaves OK, sin insultos de
  odio). Cada frase de `quotes.js` y cada diálogo de NPC respira esta actitud.
- **Sexual SUGERENTE y censurado**, nunca explícito en pantalla: doble sentido, chamuyo, levante,
  innuendo. El recurso canónico es la **escena "censurada por el Gremio de Bardos"** (bloques `█`)
  cuando algo sube de tono — ver el romance de Morena/La Eterna como molde a reskinnear.
- **Al menos un personaje de romance** por saga (rara, 5%/piso), con arco de levante que progresa
  entre niveles/muertes y termina en escena censurada + buff. Reskinnealo al tema (la moza, la
  reina del local, etc.) pero mantené la picardía.
- **Repartido, no concentrado**: insinuación en frases de loot/muerte/idle, en NPCs de servicio
  (la que te "atiende"), en descripciones del codex. Que se sienta en todo el juego, no en un rincón.
- **Techo**: sugerente y gracioso, no pornográfico ni gráfico. Si dudás, censuralo con `█` y un
  chiste. Nada de menores, no-consentimiento, ni nada ilegal — la picardía es entre adultos.

> Regla práctica: si una saga regenerada quedó "family friendly", está MAL. Subile el tono.

---

## 1. Motor vs Contenido

**NO TOCAR (agnóstico al tema, ya está hecho y testeado):**
- Combate por turnos, bump-attack, knockback, crítico, veneno, **iniciativa (dado 50% al moverte
  pegado)**.
- Movimiento D-pad relativo (8 dir) + **selector único de arma** (aimbar: chip 🚶 caminar + un
  chip por arma a distancia; tocar un arma = elegirla y entrar en apuntar, tocar 🚶 = volver a
  caminar; ráfaga manteniendo para disparables, lanzar al soltar para granadas).
- **7 vidas** por run (revive con seed nuevo, pierde ½ oro), save IndexedDB+localStorage, resume.
- FX/partículas, screen-shake, minimapa, niebla de guerra, eventos de nivel, spawn **80/20**,
  **boss cada 5 niveles**, mística Doom de arena, soborno de NPC bloqueante, codex engine,
  logros engine, tienda de almas (meta-progresión), PWA/service-worker.

**SÍ RE-TEMATIZAR (capa de contenido) y su archivo:**

| Capa | Archivo(s) |
|------|-----------|
| Sprites pixel | `src/sprites.js` (`MZ.PIXEL_SPRITES`) |
| Monstruos | `src/entities.js` (`ENEMY_DEFS`) + sprites + `codex.js` |
| Armas/ítems | `src/entities.js` (`ITEM_DEFS`, `GEAR`, `LOCAS`, `GRENADES`, `genGear`, `genBFG`) + sprites + `codex.js` |
| Bosses | `src/entities.js` (`BOSS_NAMES`, `makeEnemy`) + `dungeon.js` (temas) |
| Drops / generación | `src/dungeon.js` |
| NPCs (data) | `src/npc.js` (`NPC_DEFS`) |
| NPCs (diálogo) + historia + quests + spawn | `src/lore.js` |
| Frases por evento | `src/quotes.js` |
| Bestiario | `src/codex.js` (`MZ.CODEX`) |
| Logros | `src/logros.js` |
| Pantallas/HUD/textos | `index.html` + `src/ui.js` |
| Audio (opcional) | `src/audio.js` (es procedural, suele servir igual) |

Orden de carga (no cambiar): rng, sprites, quotes, save, audio, dungeon, entities, eventos,
logros, codex, lore, npc, fx, ui, easter, combat, main.

---

## 2. Estado actual (lo que hay para reskinnear)

- **53 sprites**, **15 enemigos**, **18 ítems**, **3 granadas**, **5 nombres de boss** (ciclan),
  ~14 NPCs, ~24 logros. Boss cada 5 (5,10,...,50). Nivel 50 = jefe final (hoy "El Bardo Fundador").

---

## 3. Schemas (respetar EXACTO)

### 3.1 `PIXEL_SPRITES[nombre]`
```js
{ pal: { CHAR: 0xRRGGBB | [0xRRGGBB, alpha] },   // '.' = transparente, no va en pal
  map: [ 'filas', 'de', 'IGUAL ancho' ] }        // chars deben existir en pal
```
Se rasteriza nearest-neighbor. Validá anchos parejos (ver test en sección 9). Tamaños típicos:
entidades ~12×12, ítems ~8–10, tiles 10×10.

### 3.2 `ENEMY_DEFS[id]`
```js
{ name, sprite, color, scale, hp, atk, gold, minDepth,
  // flags opcionales de comportamiento (el MOTOR ya los entiende):
  slow, ranged:<dist>, poison:<turnos>, ghost, vampiro, pombero, rare, static, explode,
  rataBlanca, boss }
```
`makeEnemy` escala hp/atk por profundidad. `rare`/`static` se excluyen del 80/20.

### 3.3 `ITEM_DEFS[id]` = `{ sprite, color, scale }`. La lógica de cada ítem vive en `applyItem`
(`main.js`, `switch(it.type)`). Para un ítem nuevo: def + sprite + case + entrada codex.

### 3.4 Armas
- `GEAR.melee[]`: `{name, atk, veneno?|empuje?}` (6+ tiers). `GEAR.ranged[]`: `{name, atk, range,
  rapido?}` (rapido = ametralladora/ráfaga). `GEAR.shield[]`: `{name, def}`.
- `LOCAS.{melee,ranged}[]`: armas raras con mecánica única — flags `curaAlRomper`, `traicionero`,
  `rebote`, `grito`.
- `genGear(kind, depth)` arma el ítem con tier + munición/filo. `genBFG(depth)` = arma AoE de 1 bala.
- `GRENADES[tipo]`: `{ item, nombre, icon, color, range, radius, dmg?(d), fire?, stun? }`. Lanzables
  consumibles (`P.granadas[tipo]`). Hoy: frag (daño AoE), molotov (fuego N turnos), stun (aturde).

### 3.5 Nodo de diálogo (lo que devuelven los handlers de NPC y menús)
```js
{ name, color, text, choices: [ { label, fn } ] }   // fn() devuelve otro nodo o null (cierra)
```

### 3.6 Entrada de codex `MZ.CODEX.<cat>[]` (cat ∈ monstruos|jefes|personajes|arsenal)
```js
{ id, nombre, sprite, color, lore: ['oración 1','oración 2','oración 3'] }   // SIEMPRE 3 oraciones
```
IDs alineados con ENEMY_DEFS/NPC_DEFS/ITEM_DEFS. Descubrimiento: ver hooks `MZ.codex.discover`.

### 3.7 Reglas de spawn de NPC (`pickNpcsForLevel` en `lore.js`)
- **1 mercader por piso siempre**, **sin NPCs duplicados** en el piso, **romance raro (5%)**.
- Quests forzadas primero (las del arco), después pool por azar. Nivel 1 casi vacío.

---

## 4. Receta: MONSTRUOS (derivar 12–15 desde el tema)

El motor entiende **arquetipos** por flags. Tomá cada arquetipo y "vestilo" con el tema:

| Arquetipo (flags) | Rol | → Mc: ejemplo |
|---|---|---|
| básico (sin flags) | carne de cañón inicial | Papa Frita Rancia |
| enjambre rápido | molesta en grupo | Nugget Salvaje |
| `slow` tanque | lento pero pega fuerte | BigMac Mutante |
| `ranged` | castiga de lejos | Máquina de Gaseosa (escupe) |
| `poison` | envenena al morder | Mayonesa Vencida |
| `ghost` | atraviesa paredes | Fantasma del Drive-Thru |
| `vampiro` | se cura al pegarte | Vampiro del Postre |
| `ranged`+`poison` | a distancia y veneno | Sundae Tóxico |
| `pombero` (rare) | roba oro y teletransporta | El Ladrón de Cajita |
| `static`+`explode` (rare) | barril, reventalo cerca | Freidora a Punto de Estallar |
| mimic (cofre con dientes) | trampa de codicia | Cajita Feliz Mordedora |
| `rataBlanca` (rare) | legendario, llueve oro | El McRib (aparece y desaparece) |
| `boss` | jefe de acto | (ver sección 6) |

Para cada uno: agregá sprite, entrada `ENEMY_DEFS` (hp/atk/gold/minDepth coherentes con la curva,
sección 8) y entrada codex. Distribuí `minDepth` para que aparezcan a lo largo de los 50 niveles.

---

## 5. Receta: ARMAS, ÍTEMS y NPCs

### 5.1 Armas (reskin por slot, mantené las mecánicas)
| Slot | Mecánica (no tocar) | → Mc: |
|---|---|---|
| melee tiers | filo que se gasta | Cuchara→Cucharón→Espátula de plancha |
| ranged tiers | munición corta | Sorbete→Pistola de ketchup |
| ametralladora (`rapido`) | ráfaga | Dispensador de gaseosa automático |
| BFG (1 bala AoE) | revienta la sala | Cajita Feliz Nuclear |
| escudos | DEF | Bandeja→Tapa de freidora |
| locas: curaAlRomper | cura full al romperse | Termo de café (Termo del Abuelo) |
| locas: traicionero | x4 por la espalda | Tenedor Traicionero |
| locas: rebote | rebota en cadena | Nuggets Rebotantes |
| locas: grito (AoE empuje) | grito que empuja | Megáfono "¡Siguiente!" |
| granada frag/molotov/stun | lanzables | Pickle bomba / Aceite hirviendo / Granizado |

### 5.2 Ítems de consumo (reskin directo, lógica en `applyItem`)
poción (75% cura / 25% veneno), mate (cura full), mate legendario (+stats perma), tequila (cura +
resaca), corazón (vida), altar (bendición/maldición de nivel), pinchos (trampa), cofre, anillo
(quest), **mapa** (minimapa: drop 20% / mercader 30% por piso). → Mc: gaseosa, café, helado, etc.

### 5.3 NPCs por **rol de servicio** (reskin) + NPCs de **quest** (nuevos)
Roles que el código ya soporta (cada uno = entrada en `NPC_DEFS` + handler en `lore.js` `MZ.LORE`):
mercader, herrero (tunea equipo), sanador/comida, apostador (dados/ruleta), **romance raro**,
narrador/cronista (entrega los capítulos de a uno: **primero OFRECE escuchar, después muestra el
lore**), crítico (te reseña), DJ (cura+buff). → Mc: Gerente, Cocinero, Señora del café, etc.
Para **triplicar NPCs**: además de reskinnear estos, agregá ~2-4 NPCs nuevos por acto con su propio
mini-arco/quest. Todo NPC nuevo → `NPC_DEFS` + sprite + handler + codex.

---

## 6. Receta: ARCO de 50 niveles

1. **Columna vertebral**: un objetivo legendario que nunca se logró (ej. actual: *"La Pool Party
   N°5 que nunca fue"*). → Mc: *"El Menú Secreto definitivo"* / *"recuperar la receta original"*.
2. **5 actos × 10 niveles**, cada uno con su **tema/paleta** (`themeFor` en `dungeon.js`), repartiendo
   las **referencias del usuario** 1-2 por acto sin amontonar.
3. **Boss cada 5** (10 bosses): nombralos por acto en `BOSS_NAMES` (hoy ciclan 5; para una saga
   conviene un array de 10 indexado `depth/5-1`). El **nivel 50 = jefe final** (la razón por la que
   el objetivo nunca se logró).
4. **Quest madre coleccionable**: 5 piezas, una por acto (la entrega un NPC al matar el boss del
   acto). Con las 5 → final bueno en 50; sin todas → final malo (rejugabilidad). Estado en
   `save.data` + mirror en el run.
5. **Cronista**: ~25-30 capítulos (de a uno por visita) que cuentan la saga. Intros por run.

→ Mc ejemplo de actos: I Local del Barrio · II La Fábrica · III El Corporativo · IV La Ruta/Drive ·
V La Sede Central (jefe final: *El Payaso Fundador*).

---

## 7. Checklist de regeneración (orden de archivos)

1. **Definir**: tema, columna vertebral, 5 actos (tema+referencias), 5 piezas de la quest madre,
   10 bosses, ~15 monstruos (arquetipos), ~36 NPCs.
2. `sprites.js`: todos los sprites nuevos (monstruos, ítems, NPCs, armas). Validá anchos.
3. `entities.js`: `ENEMY_DEFS`, `ITEM_DEFS`, `GEAR`/`LOCAS`/`GRENADES`, `BOSS_NAMES`, (genGear/genBFG
   solo si cambia la mecánica — normalmente NO).
4. `dungeon.js`: temas por acto en `themeFor`, drops temáticos, specials de nivel (42, 50).
5. `npc.js`: `NPC_DEFS` (~36).
6. `lore.js`: `MZ.LORE` (handlers), `pickNpcsForLevel` (reglas), quest madre, cronista, intros.
7. `quotes.js`: TODOS los pools por evento (morir, matar, crítico, loot, idle, jefe, granadas,
   eventos, etc.) reescritos al tema.
8. `codex.js`: cada entrada nueva (monstruos/jefes/personajes/arsenal), **3 oraciones c/u**.
9. `logros.js`: logros de la saga (juntar las 5 piezas, matar cada boss, llegar al 50, final).
10. `ui.js`/`index.html`: títulos, intro, pantalla final, textos.

---

## 8. Balance/tuning (NO cambiar salvo intención explícita)

Estos números mantienen el juego jugable sea cual sea el tema — cambiá **nombres y sprites**, no
estos valores:
- HP base enemigos ~4–28, atk ~2–5, escalado: `hp*=1+(depth-1)*0.12`, `atk*=1+(depth-1)*0.09`.
- Jugador arranca: 20 HP, ATK 1 (piñas), DEF 0, **7 vidas**.
- Spawn: **80% débil / 20% fuerte** (minDepth en depth+1..+8). `count = min(4+depth*0.7, 14)`.
- Boss cada 5; bosses con HP/atk reforzados y empuje.
- Drops: arma ~30%+ (común, se gastan), poción 70%, mapa 20% (drop) / 30% (mercader/piso),
  granadas ~16–22%, corazón ~14%, BFG 5% por kill (10% cerca de boss vivo).
- Iniciativa: 50%. Poción vencida: 25%. Mimic: 15% de los cofres. Romance: 5%/piso.
- Granadas: frag alc 4/radio 1, molotov alc 3/fuego 3 turnos, stun alc 5/radio 2/2 turnos.

---

## 9. Verificación (sin spoilearte el lore)

- `node --check src/*.js` y `./build.sh` (build a `dist/mazmorra.html` + `docs/`).
- Validar sprites (anchos/paleta):
  ```js
  node -e 'global.window=global;require("./src/sprites.js");
  for(const[k,d]of Object.entries(MZ.PIXEL_SPRITES)){const w=d.map[0].length;
  d.map.forEach((r,i)=>{if(r.length!==w)console.log("ANCHO",k,i);
  for(const c of r)if(c!=="."&&d.pal[c]==null)console.log("CHAR",k,c)})}'
  ```
- Validar que todo enemigo/ítem/NPC tenga sprite y entrada codex (3 oraciones).
- **Test de juego headless** (patrón reusable): inyectar un `<script>` en `dist/mazmorra.html`,
  abrir con `chromium --headless --use-gl=swiftshader --virtual-time-budget=N --dump-dom`, y desde
  el script: `MZ.newRun()`, forzar spawns (`MZ.makeEnemy`, `MZ.spawnItemAt`), simular input
  (KeyboardEvent o `MZ.app.stage.emit('pointerdown',{global})`), tickear (`MZ.app.ticker.update`),
  y chequear flags/estado. Ejemplos en los commits previos (granadas, codex, bosses).
- Screenshot con `--screenshot=out.png --window-size=420,840` para ver HUD/sprites.

---

## 10. Mapa de archivos (referencia rápida)

| Archivo | Qué hay |
|---|---|
| `rng.js` | PRNG seedeado, `hash2` (genLevel determinístico por seed+depth) |
| `sprites.js` | `PIXEL_SPRITES` + `buildSpriteTextures` |
| `quotes.js` | pools de frases por evento (`MZ.quote`, `MZ.say`) |
| `save.js` | persistencia IDB+localStorage, `reset`, defaults |
| `audio.js` | SFX procedural WebAudio |
| `dungeon.js` | `genLevel` (layout, enemigos 80/20, drops, secreto), `themeFor` |
| `entities.js` | `ENEMY_DEFS`, `ITEM_DEFS`, `GEAR`/`LOCAS`/`GRENADES`, `genGear/genBFG`, `BOSS_NAMES`, `makeEnemy`, `recalcStats` |
| `eventos.js` | eventos de nivel (apagón, fiesta, niebla, lluvia, invasión, mercado) |
| `logros.js` | logros + tienda de almas (meta-progresión) |
| `codex.js` | `MZ.CODEX` (bestiario) + `discover/seen/counts/weaponId` |
| `lore.js` | `MZ.LORE` handlers de NPC, `pickNpcsForLevel`, quests, capítulos, intros |
| `npc.js` | `NPC_DEFS`, motor de diálogo, `talkTo` (+ soborno) |
| `fx.js` | partículas, explosiones, shake, daño flotante, slowmo |
| `ui.js` | HUD, toasts, pantallas (start/death/pausa/stats/codex/tienda), minimapa, aimbar |
| `easter.js` | modo disco, nivel 42/100, cheats AoE2 (Robin Hood, BFG) |
| `combat.js` | ataque jugador/ranged/BFG/granadas/grito, IA de turnos, fuego, stun, muerte |
| `main.js` | bootstrap Pixi, buildLevel, input (D-pad + apuntar), turnos, applyItem, vidas, save |
