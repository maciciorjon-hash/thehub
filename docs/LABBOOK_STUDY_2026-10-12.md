# Labbook en laptop — auditoría y estudio de optimización (12 oct 2026)

Pedido de Jon: auditoría completa de Labbook (funciones, código, salida visual), romperlo, arreglarlo, revisar textos y cajas fuera de
sitio, y un estudio para optimizar: qué simplificar sin perder contenido, nuevas formas de organización, adiciones, y qué quitar porque
no aporta. Primero laptop; el móvil va después, cuando esto esté asentado.

Lo arreglado está en [`BETA_TEST_REPORT.md`](BETA_TEST_REPORT.md) (sección *Labbook on a laptop — 2026-10-12*, LA-1…LA-15) y cada arreglo
tiene su invariante en `tools/invariants.mjs`. **Este documento es el estudio**: lo que mediste, lo que propongo y lo que necesito que decidas.
Todo lo propuesto está *sin hacer*; por tu regla, la estructura no se construye sobre una suposición mía, así que cada propuesta termina
con la pregunta que cambia lo que haría.

---

## 1. En una página

**Estado.** Labbook está sólido donde mirar es fácil: 0 fallos con 26 cargas hostiles en ~100 cajas (XSS incluido), 400 clics al azar sin un
error, todo ≤ 45 ms hasta 520 experimentos / 15 MB, el texto escrito sobrevive a un reload 0 ms después, los PDF son de documento y no de
pantalla. Los fallos reales estaban donde la herramienta no mira: **firmas de texto que dependen del orden de las claves** (todas tus
plantillas por defecto aparecían como "editadas" y no recibían correcciones), **diálogos con el botón principal fuera de la ventana** en
laptops de 650–700 px de alto, **dos ventanas pisándose** sin nube, **la fecha de Repeat como texto libre**, y **teclado** (Escape no
cerraba 7 de 9 diálogos, Tab se iba a la página de detrás).

**Lo que dicen tus datos.** En 7 semanas: 13 experimentos, todos desde plantilla, 12 terminados, **0 con resultados guardados**, 0 con
observaciones, 0 con línea "What happened" en los 57 pasos, 0 notas, 0 etiquetas, 0 anticuerpos, 5 días de Journal (4 de una línea).
23 de 28 carpetas están vacías y 6 de 8 proyectos no tienen ningún experimento. Labbook se usa como **planificador-ejecutor con
calculadoras**, que lo hace muy bien; **lo que falta es el cierre: qué salió**. Es la A de *Log · Annotate · Analyse · Export*.

**Lo que propongo, por orden de retorno** (detalle en §6):

1. **Cerrar el bucle del resultado** (C1): "pegar la lectura" en el paso de lectura, no tres clics dentro del editor de placas.
2. **Quitar ruido que no cuesta contenido** (A1–A5): carpetas/proyectos vacíos fuera del camino, la fila de exportar que repite dos botones
   de la cabecera, las líneas "What happened" vacías, el "Results" vacío dentro del paso, la mitad vacía de Home.
3. **Dar ancho a la página** (B1): hoy el experimento tiene el 55–60 % de la ventana; tres columnas se reparten el resto.
4. **Un solo nombre** para lo que hoy es *preset* en un sitio y *design* en otro (A6) y **una sola puerta** para crear (A7).
5. Un cambio de color: el texto blanco de los botones primarios es 3,65:1 (D1).

**Necesito de ti** (§7): ocho respuestas cortas. La primera —*qué haces hoy con la lectura del NanoBRET*— decide si C1 es lo primero o no.

---

## 2. Cómo se midió

| qué | cómo |
|---|---|
| Datos | tu `Backup/labbook-2026-10-12.json.gz` cargado **solo lectura** en un navegador desechable (nada se escribe de vuelta; nada de ello entra en el repo) |
| Pantallas | 32 pantallas y diálogos en el Hub real (rail + Labbook en su iframe), a 1440×900, 1280×720 y 1024×768, claro y oscuro: 192 pantallas medidas con los detectores del repo (solape · tapado · recortado · lateral · pequeño) más las auditorías en página (runtime, alineación, *escape*) |
| Papel | PDF de registro y hoja de banco de 5 experimentos, generados con el mismo código que "Print / save PDF", pasados a imagen y leídos página a página |
| Romper | mono de entradas hostiles (26 valores × ~100 cajas), 400 clics al azar, dos ventanas sobre el mismo cuaderno, recarga inmediata tras teclear, perf a 520 experimentos |
| Teclado | foco al abrir, 45 Tab dentro de cada diálogo, Escape, foco de vuelta; nombres accesibles en 6 pantallas |
| Código | funciones duplicadas, handlers a funciones inexistentes (345 llamadas: 0), CSS y JS sin usar (`audit_app.py --xref`), tamaño por región, clases de bug repetidas |

Reproducible: `node tools/invariants.mjs` (I27, B28–B32, R9 son de esta ronda) y `node tools/labbook_desktop_sweep.mjs --url=…` (nuevo;
en CI junto a los demás barridos del Hub).

---

## 3. Qué estaba mal (resumen; tabla completa en el informe)

| | qué | efecto en ti |
|---|---|---|
| LA-2/3 | firmas dependientes del orden de claves | 20 de 20 plantillas por defecto "edited"; 14 de 20 desactualizadas respecto al seed (WB 4 pasos vs 8, PR 2 vs 5, NB 4 vs 7); un párrafo de Methods escrito a mano aparecía "stale" sin cambio |
| LA-4 | pie de diálogo fuera de la ventana | *Done* del editor de placas y *Print / save PDF* cortados a 1366×680 / 1280×650 / zoom 125 % |
| LA-5/6 | teclado | Escape, foco, Tab, ARIA en todos los diálogos; la confirmación de borrar ya empieza en Cancel |
| LA-7 | dos ventanas | la última en guardar borraba el cambio de la otra (sin nube) |
| LA-1 | Repeat | `12/10/2026` → pasos "NaN-aN-aN" y código `SP_NB12/10/2026` |
| LA-8/9 | papel | "– substrate" cortado en "substrat / e"; "COMPOU…" |
| LA-10…14 | cajas y textos | Week machacada a 27 px por columna; etiquetas de Setup cortadas; chips que se parten; frases del menú Export cortadas; separador colgando en la barra de acciones; miga "Planner" en el Designer |
| LA-15 | test | `cellcheck` C8 fallaba cada tarde (fixture dependiente de la hora) |

**Al arrancar la próxima vez, tus plantillas cambian**: con la firma arreglada, 18 de 20 dejan de aparecer "edited". De las curadas sin tocar,
**seis cambian de contenido** al volver a seguir el seed (CLONE_HIFI 3→6 pasos, NB_BIO_RTX96 5→6, y texto/calculadoras de CTG_TCIP96,
D2B_CHEM1, D2B_SCREEN384, D2B_SEED1) y tres solo se vuelven a sellar sin cambiar (BLANK, D2B_OA_TIMING, NB_SPARK_SCREEN96). Dos siguen siendo tuyas
porque de verdad difieren (**NB** y **NB_SPARK_RTX96**). Las de fábrica sin tocar (WB, PR, CTG, HB, KD…) no se refrescan hasta el próximo cambio de versión
de plantillas, que ahora sí las alcanzará. Los experimentos ya creados no se tocan.

---

## 4. Lo que está bien y no hay que tocar

- **Entrada de datos**: ningún texto —vacío, `1e999`, `<img onerror>`, fórmula, RTL, 20 kB— rompió una pantalla ni se ejecutó.
- **Durabilidad**: texto tecleado + reload a 0/80/300/700 ms → siempre guardado (`pagehide` vacía la cola).
- **Escala**: Home, Week, abrir experimento y `renderAll` ≤ 45 ms con 520 experimentos; guardar 46 ms con 15 MB.
- **Los PDF** (registro y banco) leen como documento: cabecera, mapa de placa con condiciones numeradas, tablas de mezcla, pasos numerados,
  Methods. Lo que fallaba eran dos cajas de texto, ya arregladas.
- **Matemática** de las mezclas NanoBRET comprobada a mano contra una pantalla real (ADN por pocillo, FuGENE sobre el ADN real, Opti-MEM por
  resta): cuadra.
- **Buscador ⌘K**: corrige ortografía ("permeabilised" → Permeabilize), encuentra por código parcial, por paso y por texto de Methods.
- **Migraciones y normalizaciones**: la nota "Steps reworded… 8 steps in 2 experiments" al abrir es la pasada de redacción por diseño.

---

## 5. Qué dicen tus datos (13 experimentos, 24 ago – 12 oct)

| | valor | lectura |
|---|---|---|
| Experimentos / estado | 13 · 12 *done* · 1 *planned* | |
| Plantillas usadas | 6 de 23: SPARK screen ×4, SPARK RTX ×3, CTG ×2 + una tuya (CTG RIPTAC) ×1, BIO RTX ×2, D2B OA timing ×1 | 17 sin usar (2 de ellas tuyas: Cell viability RIPTAC / TCIP) |
| Formato | 96 pocillos ×12, 384 ×1 | |
| Pasos | 57, de los cuales 51 con calculadora y 23 con espera | el núcleo del valor |
| `aim` ("What are you asking?") | **0 / 13** | el campo vive en "More details" del diálogo de creación |
| `outcome` (Close → qué mostró) | 4 / 13 | 7 se preguntaron, 4 se contestaron |
| Resultados guardados | **0 / 13** | |
| Valores de lectura pegados en una placa | **0** | la función existe (Editor de placas → Plate → Bring in) |
| Observaciones | 0 / 13 (1 texto libre) | |
| Líneas "What happened" por paso | **0 / 57** | |
| Archivos | 2 / 13 | |
| Notas (páginas) · etiquetas · anticuerpos | 0 · 0 · 0 | |
| Journal | 5 días escritos: dos de 4 caracteres, uno de 67, dos de ~250 | |
| Tareas del planner | 4 | |
| Carpetas | 28, de las que **5** tienen experimentos | las 23 vacías: 4 *Meetings*, 3 *Information*, … |
| Proyectos | 8, de los que 2 tienen experimentos | |
| Papelera | 9 entradas: 4 pasos, 2 experimentos, 2 archivos, 1 página "Untitled" | |

Cautela: esto es **tu uso de siete semanas**, no el de otra persona del laboratorio; sirve para decidir qué estorba *a ti*. Lo que sugiero quitar
nunca se borra: se pone a un lado hasta que se pide.

---

## 6. Estudio — propuestas

Cada una dice qué es, la evidencia, qué se conserva, coste (S = horas, M = un día, L = varios) y la pregunta que me falta.

### A. Quitar o poner a un lado, sin perder contenido

**A1. Carpetas y proyectos vacíos fuera del camino** (S).
*Evidencia*: 23/28 carpetas y 6/8 proyectos vacíos. En *Experiments* cada proyecto vacío es una fila de 64 px ("0 experiments"); el rail
lista 8 proyectos + sus carpetas.
*Propuesta*: el rail y la lista muestran solo lo que tiene contenido o actividad reciente, más una línea "6 proyectos sin experimentos ▸". Nada
se borra; "+ Folder" sigue donde está.
*Pregunta*: ¿las carpetas *Meetings/Information* esperan notas que irán ahí (y entonces conviene el primer click "Nota en Meetings"), o eran
el resto de la importación de OneNote?

**A2. La fila de exportar repite dos botones de la cabecera** (S).
*Evidencia*: la cabecera ya tiene *What you need* y *Bench sheet*; la sección *Report* los vuelve a poner entre ocho chips (Record PDF,
Methods sheet, Bench sheet, What you need, Copy, Word, Data…, Plate PNG).
*Propuesta*: *Report* conserva lo que se **entrega** (Record PDF, Methods, Word, Copy, Data, Plate PNG); *What you need* y *Bench sheet*
quedan solo arriba, que es donde se usan (antes del banco).
*Compatible con tu regla "items individuales, no escondidos"*: no se esconde nada, deja de estar dos veces.

**A3. "What happened" en cada paso del día** (S).
*Evidencia*: 0/57 pasos con línea; en el Journal de un día con 7 pasos hechos hay 7 líneas punteadas vacías (más el rótulo "TUE" encima de
"Tuesday, September 29, 2026").
*Propuesta*: la línea aparece al pasar el ratón/foco o al hacer click en el paso; el dato y la función siguen; sin el rótulo repetido.

**A4. Un "Results" vacío dentro del paso de lectura** (S).
*Evidencia*: el paso *NanoBRET substrate + read* de la plantilla termina con `<p><b>Results</b></p><p></p>`: en pantalla un encabezado
"Results" y un hueco, y más abajo la sección *Results* de verdad (que solo aparece cuando hay resultados).
*Propuesta*: quitar ese párrafo de las plantillas curadas (la acción pertenece a C1).

**A5. Home: media pantalla vacía** (S).
*Evidencia*: con nada *ongoing*, la tarjeta "Running experiments" dice "Nothing running" aunque hoy hay tres pasos del SPARK planificado
en la banda de arriba; 800 px de alto libres.
*Propuesta*: si nada corre, esa tarjeta muestra **Next up** (los planificados con su fecha). No se añaden tarjetas nuevas (las quitaste a propósito).

**A6. Un nombre para lo mismo** (S, decisión tuya).
*Evidencia*: la misma cosa se llama *preset* (New experiment: "Preset / type", "Save as preset", "Edit this preset…", "Default presets",
"Your presets") y *design* (Designer: "Designs", "New design", "Start from a design", "Duplicate design"). Unas 80 apariciones de cada una.
*Propuesta*: una sola palabra en toda la interfaz. *Pregunta*: ¿cuál? (La más barata es *design*, que ya da nombre a la pantalla.)

**A7. El Designer: 106 controles para 23 tarjetas, y cuatro puertas para crear** (M).
*Evidencia*: la pantalla tiene 106 controles (cada tarjeta: Use it · Open/Edit · Duplicate · Export · Delete/Restore default); crear un
experimento tiene el selector de tres opciones (*Design it step by step / Start from a design / Quick create*), el diálogo rápido con
*Design it step by step…* y *Edit this preset…*, el botón *Use it* de la tarjeta y *+ New experiment*.
*Propuesta*: (a) Designer como lista —nombre, tipo, pasos, "usado en N"— con *Use it* como acción principal y el resto al pasar el ratón;
las 20 de fábrica plegadas bajo "Defaults (20)", las tuyas primero; (b) **un** diálogo para crear: plantilla + fecha, y *Personalizar pasos…*
dentro (hoy son dos). Se conserva todo; baja a ~30 controles visibles.

**A8. Cerrar un experimento: dos preguntas seguidas** (S).
*Evidencia*: *Close* abre "How did it end?" (Completed / On hold / Abandoned), archiva, y 260 ms después abre otra "What did it show?".
7 se preguntaron, 4 se contestaron. *Close* también se ofrece en experimentos ya *done* con *outcome*.
*Propuesta*: un diálogo (tres botones + una línea opcional); en un experimento ya resuelto el botón es *Archive*.

**A9. Zona de soltar archivos de 200 px cuando está vacía** (S). Un renglón que se despliega al soltar o pulsar.

**A10. Pegar conserva el estilo del origen** (S, decisión tuya).
*Evidencia*: pegando con el portapapeles real un trozo de Word, los scripts, los `onclick`/`onerror` y los `javascript:` se limpian (lo hace el
navegador), pero `style="color:red;font-family:Calibri"`, `class="MsoNormal"` y un `<span style="font-size:48pt">` entran tal cual en el Journal, que
es "papel" con su propia tipografía. ⌘⇧V (pegar sin formato) ya existe y está en el atlas de atajos.
*Propuesta*: pegar limpio por defecto —se conservan negrita, cursiva, listas, tablas y enlaces— y ⇧ para pegar el formato original; o un interruptor
en Settings → Writing. *Pregunta*: ¿pegas a menudo desde Word/Teams/Excel? Si no, no merece el cambio.

### B. Organización

**B1. Dar ancho al experimento** (S–M).
*Evidencia*: con un experimento abierto la página tiene 862 px de 1440 (60 %), 702 de 1280 (55 %), 580 de 1024 (57 %); el resto lo toman
el rail del Hub (76), el de Labbook (210) y la lista de la carpeta (280). La lista central repite lo que ya dan el árbol y los botones
‹ 1/7 › de la cabecera.
*Propuesta*: al abrir un experimento, la lista de la carpeta se pliega a una tira (se abre con un clic o ⌘O) y el rail de Labbook recuerda su
estado por pantalla. Gana ~280 px en el experimento, que es donde se pasa el tiempo.
*Pregunta*: tres columnas fue una decisión "tipo OneNote"; ¿confirmas que en el experimento prefieres ancho?

**B2. Carpeta = ensayo, creada al vuelo** (M, solo si confirmas).
*Evidencia*: de las 5 carpetas con experimentos, tres llevan el nombre de un ensayo (NanoBRET, NanoBRET Biosensor, Protac screen) y dos el de una
clase de compuesto (TCIPs, RIPTACs); y 23 se crearon antes de necesitarse.
*Propuesta*: al crear, elegir **proyecto**; la carpeta se propone con el nombre del ensayo y se crea si no existe.
*Pregunta*: ¿organizas por ensayo, por clase de compuesto o por fecha? Si es por fecha, el cambio útil es otro (una vista "recientes por proyecto").

**B3. Series** (M, solo si confirmas).
*Evidencia*: la carpeta *NanoBRET* de SPARK NS tiene 7 experimentos en 7 semanas (cuatro de la misma plantilla); solo dos experimentos del cuaderno
están enlazados como réplicas (`repGroup`).
*Propuesta*: en la lista de la carpeta, agrupar por plantilla con "n = 7 · último 12/10" y un enlace "Comparar" (cuando C1 exista).

### C. Adiciones (en tu eje *Log · Annotate · Analyse · Export*)

**C1. Cerrar el bucle del resultado** (M–L) — lo que más falta.
*Evidencia*: 0 resultados, 0 valores de lectura pegados, en siete semanas de NanoBRET. Y el mapa de placa **ya existe y es bueno**: lo que no
hay es el camino de la lectura al mapa. El editor de placas sabe leer valores del lector (tabuladores, comas decimales, CSV, BOM —
probado: LB-1, B4, B13) pero está en *Plate → Bring in*, tres clics dentro de un diálogo.
*Propuesta, en tres peldaños que se pueden parar en cualquiera*:
1. En el paso de lectura, un botón **Paste the read** que abre ese pegado directamente. El mapa de calor azul→rojo sobre la placa **ya existe**
   (`p.values`, `plValueColor`); falta la puerta, y que la tarjeta de placa del experimento y el informe lo muestren.
2. **Analyse**: si el experimento tiene dosis (el SPARK sí), abrir Lumina con el diseño ya puesto y volver con *Send to Labbook* (el puente
   existe).
3. Con ≥ 2 experimentos de la misma plantilla: *Compare runs* (ver B3).
*Pregunta*: ¿qué haces hoy con la lectura del NanoBRET —Excel, Prism, el software del lector—? De la respuesta depende si el peldaño 1 basta
o si el peldaño 2 es lo que de verdad ahorra tiempo.

**C2. La @mención no usa la búsqueda del ⌘K** (S).
*Evidencia*: `@1012` encuentra SP_NB20261012; `@SP_NB1012` no encuentra nada (el ⌘K sí). La @mención busca contiguo; el buscador corrige y expande.
*Propuesta*: que la @mención pida su lista a `spotResults` (ya es "una sola búsqueda" para el Hub y el ⌘K).

### D. Accesibilidad y pulido que no son opcionales

**D1. Contraste del botón primario** (S, decisión de color).
El texto blanco sobre `--accent` es **3,65:1**: pasa para texto grande, no para 12 px (AA pide 4,5). Los barridos de escritorio aceptan 3 (decisión
anterior); el barrido del móvil usa 4,5 y marca 552 hallazgos de esta única causa. Un acento algo más oscuro, `#4d77b3`, llega a 4,56:1 (`#4a74b0`, 4,76:1).
*Pregunta*: ¿oscurecemos el acento o dejamos 3 como umbral oficial en ambos barridos?

**D2. Reglas de impresión sin ámbito** (M, decisión visual).
`#print-root *{font-size:inherit}` (especificidad 1,0,0) anula cualquier regla `.pk-…` sin prefijo: hoy `.pk-v` (7,5 pt), `.pk-big` (13 pt), `.pk-sumt`
y `.pk-leg` no se aplican, y el mapa impreso usa el tamaño heredado de cada celda. Arreglé solo la leyenda de pocillo (era el fallo). Ámbitar el
resto **cambia el aspecto de todos los mapas impresos** (números de condición más grandes, resumen más pequeño). Es la intención original del
CSS, pero es tu documento: dime si quieres verlo antes.

### E. Código y proceso

- **Una clase de bug, tres veces en un día**: (1) *firma como texto dependiente del orden* (diseños, Methods; ya la tuvo la huella de la nube),
  (2) *alto del diálogo como porcentaje de la ventana* (editor de placas, PDF; antes "clamp por rect medido" en menús), (3) *regla de
  impresión más débil que el reset* (la nota del 22 sep la describía para la hoja de banco; las reglas de placa no se arreglaron entonces).
  Cada una tiene ahora su invariante; la forma de que no vuelvan es **chequeos baratos**: `check_js.py` rechaza ya una función declarada
  dos veces (había una); propongo uno que rechace `JSON.stringify(x) === stamp` fuera de `_canonJSON`/`_sigSame`.
- **CSS muerto**: nueve reglas `pd-*` del renderizador de placas antiguo (retiradas). `audit_app.py --xref` está limpio (las dos funciones que
  parecen muertas, `lbRailCounts` y `lbTaskCount`, las usa el shell).
- **Tamaño**: 1,77 MB, 23.7 k líneas, 1.518 funciones globales en tres bloques. Reparto uniforme (~100 KB cada 1.500 líneas, sin una masa de datos
  que recortar). No hay problema de rendimiento que justifique tocarlo; sí lo hay de *lectura*: partir en archivos por zona (plate, designer,
  journal, print, cloud) sería la mejora de mantenimiento, con el coste de que embed.py ya compone a mano. No lo propongo ahora.
- **Barrido de escritorio**: `tools/labbook_desktop_sweep.mjs` mide 19 pantallas × 6 configuraciones sobre fixtures de plantillas. Hoy 0 fallos;
  las 42 notas de truncamiento (un nombre cortado con elipsis) quedan como aviso.

### F. Para la versión móvil (siguiente fase)

- El kit de diálogos (foco, Tab, Escape) ya funciona en las hojas de abajo; `Escape` no existe en el móvil, así que el equivalente es el gesto
  de cerrar — revisar con el barrido móvil.
- B32 (palabras enteras) y la semana: en el móvil la semana es otra pantalla; comprobar que no hereda la rejilla de 7 columnas.
- Las propuestas A2, A3, A4, A5, A8 y C1 benefician igual al móvil; B1 y A7 son solo de laptop.
- El barrido móvil falla hoy solo por D1 (contraste 4,5).

---

## 7. Decisiones que necesito de ti

1. **¿Qué haces hoy con la lectura del NanoBRET?** (decide C1.)
2. ¿*Preset* o *design*? (A6)
3. ¿Las carpetas *Meetings/Information* esperan notas, o son resto de la importación? (A1)
4. ¿En el experimento prefieres ancho (B1) aunque la lista de la carpeta se pliegue?
5. ¿Organizas por ensayo, por clase de compuesto o por fecha? (B2/B3)
6. ¿Oscurecemos el acento o dejamos 3:1 como umbral? (D1)
7. ¿Ámbito del CSS de impresión del mapa: lo hago y te enseño antes/después? (D2)
8. **Plantillas**: seis curadas sin tocar cambian de contenido al arrancar (§3); si preferías congelar alguna, dímelo ahora (se marca como tuya).

---

## 8. Cosas que parecían fallos y no lo eran (verificado)

- *Today* del Planner **no** abre el Journal: son dos páginas del mismo día (hacer / registrar) con el mismo constructor, y un tic se refleja en
  las dos (lo pediste tú). Mi primera lectura fue un error mío al llamar a `openDayPage()` en vez de pulsar el botón.
- `lbRailCounts` y `lbTaskCount` no están muertas: las usa el shell.
- Los 552 avisos del barrido móvil son una sola causa (D1), no 552 pantallas rotas.
- "Visualize" ya no existe en el código (cero referencias); el informe del 16 sep lo describe. No hay pantalla muerta.
- `cellcheck` C8 fallaba por la hora del día, no por el código (LA-15).
