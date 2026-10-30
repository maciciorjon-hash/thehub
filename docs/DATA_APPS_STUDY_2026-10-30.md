# Apps de análisis de datos — comparación y propuesta de homogeneización (30 oct 2026)

Pedido de Jon: revisar todas las apps de análisis de datos, comparar cómo gestiona cada una las estadísticas, las visuales, los tipos de letra,
el orden y contenido de las pestañas y los gráficos, y proponer cómo homogeneizarlas **sin perder información ni facultades**.

Este documento es **estudio y propuesta; no se ha tocado código**. Por tu regla (la estructura no se construye sobre una suposición mía), cada
bloque de la propuesta termina en la decisión tuya que cambia lo que haría (§8).

**Alcance.** Siete apps hacen análisis: **Echo, Lumina, Beacon, Tempo, Hit Finder, Dora, BCA.** Quedan fuera por no analizar datos medidos:
Blueprint, Helix, Protein Tools, Iceberg, Cuppa, Incubator, Archive, Cell Archive, Ribbon y Labbook. Blot (figuras de western con densitometría) es
vecina y se cita donde toca, sin entrar en la propuesta.

**Método.** (1) Lectura del código de las siete apps y de los kits compartidos (`tools/chartkit`, `setupkit`, `historykit`, `readerkit`, motor de ajuste).
(2) Un censo **en navegador real** (Playwright, 1440 × 900, tema claro): cada app con su ejemplo cargado, cada pestaña visitada, y por pestaña el tamaño,
peso y familia de **todo** el texto visible, las tablas, los gráficos y los controles; más el estilo calculado de la tabla principal, la barra de pestañas,
las tarjetas y el botón Export. (3) Capturas de cada pestaña vistas una a una. Lo medido está marcado **(medido)**; lo leído del código, **(código)**.
No he mirado móvil (regla: los análisis de datos no lo necesitan) ni tema oscuro: los tokens de color ya se auditan por separado.

---

## 1. En una página

**Lo que ya está unificado** (y no hay que tocar): una sola familia tipográfica (IBM Plex Sans + Mono, 100 % vía tokens en HTML), un solo motor de ajuste
4PL sincronizado (`_lmFit`, `_fitBest`, `_tQ95`, `_curveVsFlat`; Echo → Beacon, Lumina, Tempo), el editor de figuras ChartKit (Echo, Lumina, Beacon),
Setup (SetupKit: Echo, Lumina, Beacon, Tempo), History (HistoryKit: Lumina, Beacon, Tempo, BCA), lector de placas, guía y menú contextual.

**Lo que no lo está** — cinco familias de diferencias:

1. **Tres escalas para decir "esta curva es mala".** El R² mínimo por defecto es **0,80 en Echo** y **0,90 en Lumina y Beacon**
   (en Beacon además escrito a fuego en el código, no configurable); Tempo gradúa con 0,98 / 0,95. La misma curva sale marcada en una app y limpia en la otra. Es el hallazgo más serio:
   no es estética, cambia qué compuestos pasan.
2. **Facultades que unas apps tienen y sus hermanas no.** **Beacon no calcula ningún intervalo de confianza** (ni en pantalla, ni en el Excel, ni en el
   Prism); Echo y Lumina sí, Tempo lo da para K pero no para el DC50(Dmax50) de su tabla. Z′ / S/B / CV de placa existen en Echo y Beacon, no en Lumina ni
   Tempo. "Hook" lo evalúan Echo, Lumina, Tempo y Hit Finder; Beacon no. La exportación a Prism existe en Echo, Lumina, Beacon, Tempo y en ninguna de las otras tres.
3. **La misma tabla de resultados está hecha cinco veces con cinco aspectos** (§5.2): cabecera de 10, 11 o 11 px mayúsculas; celda de 11, 12 o 13 px;
   fila de 30 a 51 px; la unidad en la cabecera (Echo, Tempo), en la celda (Lumina, Beacon) o como "×/÷" (Hit Finder); el IC95 al final (Echo), junto al valor
   (Lumina) o ausente (Beacon, Tempo); los avisos como columna Sí/No + Motivo (Echo), como pastilla roja (Lumina) o como pastilla de R² (Beacon).
4. **Seis motores de gráficos** para lo mismo (§5.4): ChartKit, el canvas de Curves de Echo (+ Chart.js en Plots), el canvas de curva de Lumina/Beacon,
   los SVG a mano de Tempo, los SVG a mano de Hit Finder, Chart.js en Dora, canvas en BCA. Cinco de ellos dibujan lo mismo —**un parámetro frente a otro**—
   (Echo Plots, Lumina Plot, Tempo Compare, Hit Finder Plots, Dora DC50 vs Dmax) y cada uno con sus propios colores, fuentes, ejes y exportación.
   Fuentes de gráfico: Plex Sans 9–10 px (Echo), Plex Sans 10–12 (Beacon), Plex Sans + Mono 10,5–13 (Tempo), Plex Mono 9–12 (Hit Finder),
   **system-ui** 10–11 (Dora, la única que no es Plex), Plex Mono/Sans 11–12 (BCA), Arial (ChartKit, a propósito: métrica Helvetica para PDF).
5. **Las pestañas no siguen un orden común** (§3): Echo tiene 11 (Results primero, sin iconos, Guide al final), Lumina/Beacon 5–6 (Plate primero, con iconos),
   Tempo pone Curves antes de Results y **no tiene Guide**, Hit Finder tiene Export como pestaña, BCA es una sola página larga. El botón Setup está en
   cuatro sitios distintos.

**Propuesta, en una línea:** mismo *contrato*, no mismo *contenido*. Cada app conserva todo lo que es suyo; lo que cambia es que las piezas que hoy se
repiten (umbrales y estadística, tabla de resultados, gráfico de parámetro-contra-parámetro, menú Export, esqueleto de pestañas) pasan a ser **una pieza
compartida con parámetros**, igual que ya se hizo con ChartKit, SetupKit e HistoryKit. Un **libro de facultades** (§6, Anexo B) lista lo que es único de
cada app y un invariante falla si desaparece una.

---

## 2. Qué es cada app y qué comparte

| | Echo | Lumina | Beacon | Tempo | Hit Finder | Dora | BCA |
|---|---|---|---|---|---|---|---|
| Qué analiza | dosis-respuesta de placas Echo + lector (HiBiT, CTG, desplazamiento, ganancia) | dosis-respuesta a mano | NanoBRET (mBRET), controles, Ki | cinética de degradación y curso temporal (ProNect/GloMax) | triaje de varios cribados de Echo | DC50 vs Dmax por diana (datos de Excel) | curva patrón BCA, concentraciones, prep |
| Tamaño | 2,4 MB | 0,9 MB | 1,5 MB | 0,6 MB | 0,5 MB | 0,4 MB | 1,1 MB |
| Ajuste propio | 4PL (fuente), ganancia, Ki | 4PL (copia) | 4PL (copia), un sitio de unión, trazador | 4PL (copia), decaimiento 1 fase, Michaelis–Menten, inducción 1 fase | ninguno (lee) | ninguno (lee) | regresión lineal / cuadrática |
| ChartKit (editor de figura) | ✔ pestaña Graph | ✔ Graph | ✔ Graph | ✘ SVG propios | ✘ | ✘ | ✘ |
| SetupKit | ✔ | ✔ | ✔ | ✔ | ✘ | ✘ | ✘ |
| HistoryKit | su propia pestaña | ✔ | ✔ | ✔ | ✘ | ✘ | ✔ |
| Lector de placas / ReaderKit | ✔ | ✔ | ✔ | ✘ | ✘ | ✘ | ✘ |
| Guía + tour | ✔ | ✔ | ✔ | **✘** | ✔ | ✔ | ✔ |
| Asistente de ayuda | ✘ | ✔ | ✘ | ✘ | ✔ | ✘ | ✔ |
| Enviar a Labbook | ✔ | ✔ | ✔ | ✔ | ✔ | **✘** | ✔ |
| Copiar para Prism | ✔ | ✔ | ✔ | ✔ | ✘ | ✘ | ✘ |
| Librerías de gráficos | canvas + Chart.js + jsPDF | canvas + Chart.js | canvas | SVG | SVG + canvas + jsPDF | Chart.js + canvas | canvas |

(código; dependencias contadas por `new Chart(`, `jsPDF`, `getContext('2d')` y construcción de SVG)

---

## 3. Pestañas: orden y contenido

Lo visible en cada app **(medido)**, en el orden de la barra:

| App | Pestañas | Barra |
|---|---|---|
| Echo | *(arriba: Analysis · Gradient Planner)* Results · Curves · Plots · Plate · Properties · Graph · Console · History · Protocol · Source Plate · Guide | 50 px, texto sin iconos, contadores, Setup a la derecha |
| Lumina | Plate · Results · (Normalisation, oculta hasta usarla) · Graph · History · Guide · Setup | 42 px, iconos, Setup *dentro* de la barra |
| Beacon | Plate · Results · (Normalisation) · Graph · History · Guide · Setup | 39 px, iconos, Setup en el extremo derecho |
| Tempo | Plate · Curves · Results · Compare · History · Setup *(+ Analysis settings y Export a la derecha)* | 41 px, iconos |
| Hit Finder | Screens · Criteria · Hits · Sensitivity · Plots · Health · Chemistry · **Export** · Guide | 41 px, iconos; chip "72 compounds · 5 screens" a la derecha |
| Dora | Load data · Table · DC50 vs Dmax · Properties · Guide *(+ Template, contadores)* | 38 px, iconos, fuente de 12 px |
| BCA | Workflow · History · Guide | una sola página que se desplaza |

**Hay un esqueleto común escondido** y cada app lo rellena a su manera:

| Función | Echo | Lumina | Beacon | Tempo | Hit Finder | Dora | BCA |
|---|---|---|---|---|---|---|---|
| **Datos** (entrada, layout) | Setup + Plate | Plate | Plate | Plate | Screens | Load data | Workflow |
| **Resultados** (tabla) | Results | Results | Results | Results | Hits | Table | (Samples en Workflow) |
| **Curva / ajuste de uno** | Curves | *dentro de* Results (Curve · Data · Plot) | *dentro de* Results (Curve · Data) | Curves | (cajón por compuesto) | — | (Standard curve) |
| **Parámetro vs parámetro** | Plots | Plot (en Results) | — | Compare | Plots + Sensitivity | DC50 vs Dmax | — |
| **Figura de publicación** | Graph | Graph | Graph | *(las exportaciones de Curves)* | (PNG/SVG por gráfico) | (PNG en W/B/T) | — |
| **Calidad / QC / normalización** | Plate (Maps · QC) + banner | Normalisation | Plate quality (en Results) + Normalisation | (ajustes de análisis) | Health + Criteria | — | — |
| **Química / propiedades** | Properties | — | — | — | Chemistry | Properties | — |
| **Traza de lo hecho** | Console + Protocol + Source Plate | — | — | (How this was calculated) | Provenance (en Export) | — | — |
| **Historial** | History | History | History | History | — | — | History |
| **Guía** | Guide | Guide | Guide | **—** | Guide | Guide | Guide |

Problemas concretos (todos **medidos** o **código**):

- **Orden Results/Curves invertido en Tempo** frente a Echo (Results → Curves). En Lumina/Beacon no se plantea: la curva vive dentro de Results.
- **Echo: 11 pestañas.** Tres de ellas (Console, Protocol, Source Plate) son *rastro de lo ejecutado*, no análisis; un usuario nuevo ve once puertas.
- **Tempo no tiene Guide ni tour** (es la única de las siete). Tampoco asistente (como Echo y Beacon).
- **Setup**: dentro de la barra (Lumina), a la derecha de la barra (Echo, Beacon), como "Analysis settings" aparte (Tempo), inexistente en Hit Finder
  (sus *Criteria* hacen ese papel), Dora y BCA.
- **Iconos**: todas los llevan menos Echo (mismo juego de trazo 1,8 px).
- **Export**: menú ▾ (Echo, Lumina, Beacon), botones sueltos + menú (Tempo), **una pestaña** (Hit Finder), chips PNG/CSV repartidos (Dora), botones en cada tarjeta (BCA).
- **Margen lateral del contenido**: 20 (Echo), 36 (Lumina, Tempo, Hit Finder), 28 (Beacon, Dora), 22 (BCA).

---

## 4. Estadística

### 4.1 Qué hace cada app

| Facultad | Echo | Lumina | Beacon | Tempo | Hit Finder | Dora | BCA |
|---|---|---|---|---|---|---|---|
| Ajuste dosis-respuesta 4PL (LM multi-arranque) | ✔ (fuente) | ✔ | ✔ | ✔ sobre Dmax y sobre K | — | — | — |
| Variante "ganancia de señal" (EC50/Emax) | ✔ | ✔ | ✔ | — | — | — | — |
| Ki (Cheng–Prusoff) / sitio único / trazador | Ki | — | Ki, sitio único, trazador | — | — | — | — |
| Cinética (1 fase, MM, inducción) | — | — | — | ✔ (IC por verosimilitud de perfil) | — | — | — |
| Regresión lineal / cuadrática, interpolación | — | — | — | — | — | — | ✔ |
| **IC 95 % del potency** | ✔ (columna, t de Student) | ✔ (junto al valor) | **✘** | solo K (perfil), **no DC50 en la tabla** | lo lee de Echo/Lumina y lo convierte en factor "×/÷ n" (criterio `ci_fold`) | "± SD" tal como viene en el Excel | — |
| IC del Hill | ✔ (Excel/cribado) | — | — | — | ✔ (lo guarda) | — | — |
| R² | ✔ 3 dec. | ✔ 3 dec. | ✔ 3 dec. (pastilla verde/roja) | ✔ 3 dec., **grado propio** (> 0,98 excelente, > 0,95 aceptable) | ✔ | — | ✔ **5 dec.** |
| **R² mínimo por defecto** | **0,80** | **0,90** | **0,90 fijo en código** | **sin mínimo: escala 0,98 / 0,95** | pasa de Echo | — | — |
| Test "mejor que una línea plana" (F) | ✔ | ✔ | ✔ | ✔ | — | — | — |
| Hook (efecto gancho) | ✔ `hookThr` 15 | ✔ | **✘** | ✔ (regla de Echo) | ✔ | ✔ (marca) | — |
| Aviso SD alto | ✔ | ✔ | ✘ | — | — | — | — |
| Comprobaciones propias de calidad de ajuste | — | — | — | **IC de K excluye 0 y ≤ 10 × K · plateau entre 0 y 0,9 · residuos sin rachas** (4 pastillas) | puertas `ci_fold`, hook, ventana | — | — |
| "Fuera de rango" (`DC50>range`, `Top at bound`…) | ✔ (marca + motivo) | ✔ (pastilla) | ✔ (`> 10 µM`, `bound`) | ✔ (`>`, `≥` como cota) | ✔ (`≥ ×100000`) | — | ✔ ("extrapolated") |
| n.d. / sin ajuste | `n.d.` | `n.d.` | "—" / sin ajuste | `n.d.` | `—` | `—` | NaN / invalid |
| Z′ / S/B / CV / deriva / borde de placa | ✔ (Plate › QC: Z′, S/B, CV, drift filas/columnas, edge) | ✘ | ✔ (Plate quality: baseline, vehicle, window, S/B, Z′) | ✘ | — | — | — |
| Normalización | media de placa / DMSO / referencia + **auditoría** ("1 control well looks wrong") | a controles o a viabilidad | por vehículo, por compuesto | ProNect (fondo, T0, vehículo) + alternativas | robustez frente a normalización (Sensitivity) | — | blanco |
| Estadística de réplicas | SD, cajas (cuartiles tipo 7) | SD en gráfico, SEM/IC/rango en ChartKit | SD en curva (barras), ChartKit | media ± SD, MAD | — | media ± SD | media de pocillos duplicados |
| Excluir una réplica | clic / clic derecho + ⌘Z | clic + ⌘Z | pestaña Data (cruz gris) | clic en la lectura / arrastre de rango | — | — | clic en el pocillo |
| Unidad de potencia | nM fijo en tabla (+ unidad del eje en Graph) | selector Units (auto / M … pM, log) | auto | nM; masa en curso temporal | nM | nM + Log₁₀ | µg/µL |
| Cifras | 3 s.f. | 3 s.f. | 3 s.f. | 3 s.f. | 3 s.f. | 1 decimal | — |
| Clasificación propia de "bueno" | marca Sí/No | pastilla | pastilla | grado | **criterios con puertas, tiers Hit / Borderline / Unverified / Rejected** | **Excellent / Moderate / Weak** (Dmax ≥ 85 y DC50 ≤ 50) | — |

### 4.2 Qué es lo que de verdad diverge

1. **Umbrales (el de peso).** `p-r2` de Echo vale 0,80; `qc-r2` de Lumina, 0,90; en Beacon `f.r2 < 0.9` está escrito en la regla de aviso; Tempo no marca,
   **gradúa** (> 0,98 excelente, > 0,95 aceptable): tres escalas de R² para la misma pregunta.
   Además hay **dos umbrales distintos dentro de Echo** (el del análisis, 0,80, y el de la pantalla de cribado, 0,90). Resultado: con los mismos datos el número de
   curvas marcadas cambia según la app, y Hit Finder hereda la de Echo sin saberlo. **No lo corrijo sin que decidas el valor** (§8-D1): cambiar el
   umbral no reescribe ningún número registrado, pero sí cambia qué se marca.
2. **El mismo concepto con cuatro gramáticas de incertidumbre:** IC95 asimétrico (Echo, Lumina), "×/÷ 1,2" (Hit Finder), "± SD" aritmético de réplicas (Dora),
   perfil de verosimilitud ensanchado por autocorrelación (Tempo). Son afirmaciones distintas (ajuste, factor, réplicas), pero hoy no dicen cuál son.
3. **Las cotas se escriben de cuatro maneras:** `>`/`≥` delante del número (Tempo), pastilla "DC50>range" con el número normal (Lumina), `> 10 µM` en la celda (Beacon),
   `≥ ×100000` (Hit Finder). Echo marca `EC50>range` en la columna Motivo pero muestra el número desnudo en la columna de potencia (su Excel de cribado sí lleva
   `Potency_Qualifier`).
4. **Beacon es la app a la que más le falta**: sin IC, sin SD-flag, sin hook, umbral de R² fijo. El motor ya devuelve el error estándar (`se`); no se usa.
5. **Estadística descriptiva copiada en seis sitios:** `ck-core.js` (SD/SEM/IC/rango), `_quantile`/`_smMean` en Echo, `tpMean/tpSD/tpMAD/tpMedian` en Tempo,
   `meanOf/sdOf` en Beacon, `sd` en BCA, `_statNum` en Lumina. El motor de **ajuste** ya se sincroniza; la estadística **descriptiva** no.
6. **R² con 5 decimales en BCA** y 3 en el resto. Defendible (una curva patrón buena está en 0,999), pero no está escrito como regla.

---

## 5. Visuales

### 5.1 Tipografía **(medido, 1440 × 900, claro)**

Familia: **IBM Plex Sans** en el 100 % del texto de interfaz de las siete apps; **IBM Plex Mono** para números y códigos en Tempo (156–228 tramos de texto por
pantalla) y Hit Finder (161), y para la línea de estadísticas de Lumina; **Arial** en las figuras de ChartKit (10–29 tramos) a propósito. Fuera de eso, lo
único que no es Plex es el **gráfico de Dora (`system-ui`)**.

Tamaños dominantes de texto en la pantalla de resultados de cada app:

| App | Texto más frecuente | Segundo | Lo que muestra |
|---|---|---|---|
| Echo › Results | **11 px / 400 ×481** | 10 px / 400 ×278 | 63 filas densas, cabecera de 10 px |
| Lumina › Results | 12 px / 400 ×39 | 11 px ×15 | tabla de 6 filas + curva |
| Beacon › Results | 12 px / 400 ×61 | 11 px ×27 | tabla + calidad + controles |
| Tempo › Results | **13 px / 400 ×123** | 12 px ×100 | tabla ancha en Mono |
| Hit Finder › Hits | 12 px / 400 ×122 (Mono ×161) | 11 px ×25 | puertas + tabla por compuesto |
| Dora › Table | 11–12 px | 10 px ×10 | tabla con barras de Dmax |
| BCA › Workflow | 10 px/700 ×40 | 10 px/400 ×30 | rejilla de 96 pocillos |

El texto "pequeño" (10 px) existe en todas; las guías son uniformes (13 px/400 y 600). Hay tamaños fraccionarios fuera de la escala `--fs-*`: **10,5 y 11,5 px
en Tempo** (Compare, ejes), 11,44 px en las guías. El código tiene 118 `font-size:Npx` en cadenas JS de Echo (la mayoría dentro de SVG/PDF, exentos por
`docs/UI.md`) frente a 1–14 en las demás.

### 5.2 La tabla principal, lado a lado **(medido)**

| | Echo | Lumina | Beacon | Tempo | Dora |
|---|---|---|---|---|---|
| Cabecera | 10 px / 600, `--text3`, sin mayúsculas | 11 px / 600, **MAYÚSCULAS** 0,3 px | 11 px / 600 | 11 px / **700** | 11 px / 500, 0,44 px |
| Celda | 11 px Sans | 11 px Sans | 12 px Sans | 13 px Sans (**cifras en Mono**) | 12 px Sans |
| Alineación numérica | izquierda | izquierda (valor), derecha (IC) | **derecha** | izquierda | derecha |
| Alto de fila | 31 px | 31 | 38 | **51** | 30 |
| Contenedor | tabla plana a todo ancho, sin tarjeta | tarjeta r-2 + sombra sm | tarjeta r-2 sin sombra | tarjeta r-3 + sombra xs | tarjeta con cabecera de grupos |
| Unidad | en la cabecera "DC50 (nM)" | **en la celda** "453 nM" | **en la celda** "104 nM", "1,2 µM" | en la cabecera "(nM)" | en la cabecera + selector |
| IC95 | **última columna** | junto al valor | **no existe** | no existe (para DC50) | — |
| Avisos | columnas Flag Sí/No + Reason | pastilla roja en QC | pastilla de R² verde | pastilla de grado | — |
| Botón Export | gris 32 px | **azul primario** 32 px | gris 32 px | gris **28 px / 11 px** | PNG W/B/T + CSV |

`docs/UI.md` dice: tarjeta = `--surface`, borde 1 px, `--r3`, `--shadow-xs`; cabecera de tarjeta `--fs-2`/700 `--text3`, **sin mayúsculas** ("µ se convierte en
Mu y una unidad cambia de significado"). Hoy **Tempo y Hit Finder cumplen** (r-3 + xs), **Lumina y Beacon no** (r-2; sombra sm / ninguna) y **Lumina usa
mayúsculas en las cabeceras**.

### 5.3 Color

- **Acento retirado `#5e87c5` aún en código**: Echo ×6, Lumina ×3, Tempo ×1 (la paleta de sus gráficos: `accent`, 3,65:1 sobre blanco), Hit Finder ×1.
  El token actual es `#4b76b5`. Los gráficos de Tempo se pintan con el azul viejo.
- **Paletas de series:** ChartKit 9 (Blue ramp por defecto, Prism, Okabe-Ito, Pastel, Bold, Blues, Warm, Viridis, Greys) · Echo 3 más (`PCOLORS` de placa, `SCATTER_PALETTE`,
  `CV_PALETTE` que empieza en el salmón de marca `#e36c69`) · Lumina `LM_PAL` y Beacon `BM_PAL` (**la misma lista de 8 colores copiada**) · Tempo rampa azul claro→oscuro
  por concentración · Dora variables `--col1…6` por diana (morado / naranja) · BCA 2 listas pastel para patrones/muestras.
- **Fondo de página** idéntico en todas (`--bg #f4f5f8`); las diferencias están en el relleno de la tarjeta y en el fondo de gráfico (blanco / gris).

### 5.4 Gráficos

| App | Qué dibuja | Motor | Fuente del texto | Exporta |
|---|---|---|---|---|
| Echo › Curves | curva simple / comparar, hover, zoom, pin de referencia | **canvas propio** `_cvPaint` (+ contexto jsPDF `_pdfCtx` para PDF vectorial) | Plex Sans 9–10 px | PNG 6×, PDF vectorial, PDF por lotes (6 curvas/página) |
| Echo › Plots | dispersión, cajas, selectividad | **Chart.js** | Plex Sans 11 | PNG, CSV |
| Echo › Graph | figura de publicación | **ChartKit** | Arial | PNG 300/600/1200 dpi, PDF, SVG, tabla |
| Lumina › Results | curva (Fit / Raw) + Data + Plot | canvas + Chart.js | Plex Sans | PNG, Prism, Excel |
| Lumina › Graph | figura | **ChartKit** | Arial | igual |
| Beacon › Results | curva (SD) y barras de controles | canvas | Plex Sans 10–12 | PNG |
| Beacon › Graph | figura | **ChartKit** | Arial | igual |
| Tempo › Curves/Compare | 11 vistas: Kinetics, Raw, DR, K-response, Over time, Heat map, Residuals, First-order, ranking, dispersión, barras | **SVG a mano** (`tpChart*`, `tpScatter`, `tpBars`) | Plex Sans + Mono 10,5–13 | PNG, SVG (con pie), **sin PDF** |
| Hit Finder › Plots/Hits | 4 dispersiones con zonas, histograma, sparklines, estructuras | **SVG a mano** (`hfScatter`, `hfHistSvg`, `hfSparkSvg`) | Plex Mono 9–12 | SVG, PNG, CSV por gráfico, informe jsPDF |
| Dora › DC50 vs Dmax | dispersión con zonas Hit/Partial/Inactive + tabla | **Chart.js** + canvas | **system-ui** 10–11 | PNG blanco / negro / transparente, CSV |
| BCA › Standards | curva patrón, mapa de calor de placa | canvas | Plex Mono/Sans 11–12 | PNG (copiar imagen) |

Cosas que están en un motor y en los otros no: **el ajuste solo se dibuja sobre las dosis ensayadas** (ChartKit, Echo; Tempo sí; Dora/HF n/a), **etiquetas de
decenas con un único formato** (`decadeLabels`, solo ChartKit), **unidad de eje elegible** (ChartKit; Tempo tiene rango de ejes pero no unidad ni tabla),
**tabla bajo la figura** (solo ChartKit), **arrastrar títulos con imanes** (solo ChartKit), **cuadrícula** (colores distintos en cada app).

---

## 6. Libro de facultades: lo que NO se puede perder

Es la lista contra la que se mide cualquier paso de la propuesta. Cada línea es algo que existe hoy en una sola app (o en pocas) y tiene valor propio.
Detalle completo en el Anexo B; aquí lo esencial:

- **Echo:** Gradient Planner · lector PHERAstar multi-placa · normalización con **auditoría** y comparación de versiones · Compare de curvas con referencia fijada ·
  QC de placa (Z′, deriva, borde) · PDF por lotes con IC y marcas · hook / SD / R² / bound / "no mejor que una línea plana" con motivos · Properties
  (RDKit) · Source Plate · pantalla de cribado ("Screen table") para Hit Finder.
- **Lumina:** unidad Units (auto … pM, log) · gradientes y reglas de pocillos · normalización a viabilidad · `Plot` X contra Y · pasos guiados (Plate → Results) · asistente.
- **Beacon:** NanoBRET con donante/aceptor y mBU · Plate quality (baseline, vehicle, window, S/B, Z′) · multi-placa agrupada ("Pooled / Per plate") · Ki, sitio único, trazador ·
  normalización por compuesto con vehículo propio · pegar desde Excel.
- **Tempo:** dos experimentos (degradación, curso temporal) · normalización ProNect verificada contra los ficheros reales · ajustes de 1 fase y MM con **IC por verosimilitud de perfil** ·
  ajuste de inducción · cotas `>`/`≥` como dato · 11 vistas de curva (Raw, Heat map, Residuals, First-order…) · exportación ProNect-compatible, Prism, Método · dosis por masa.
- **Hit Finder:** criterios con puertas y pesos, tiers, sensibilidad a cada puerta, robustez de normalización, Health, Chemistry (estructura/diana), informe con procedencia.
- **Dora:** barras de Dmax con umbrales Excellent/Moderate/Weak, zonas, comparación por diana, plantilla Excel, PNG en blanco/negro/transparente.
- **BCA:** pegado de 8×12, pintado de pocillos de patrón y muestra, regresión lineal/cuadrática, interpolación con avisos (extrapolado, 1 pocillo), plan de dilución, hoja de cálculo para reproducir a mano.
- **ChartKit (compartido):** paletas, barras de error SD/SEM/IC/rango, réplicas omitibles (solo en la figura), arrastrar con imanes, PNG a 1200 dpi con `pHYs`, PDF vectorial a mano, SVG, tabla bajo la figura, unidad de eje.

**Regla que se cumple en toda la propuesta:** un número ya registrado no se reescribe; solo cambia cómo se **muestra**, y donde cambie un umbral se enseña la diferencia (§4.2-1).

---

## 7. Propuesta

Ordenada por **retorno sobre riesgo**. Todo es compartir una pieza que ya existe en una app; ninguna fase es una reescritura. Cada fase termina con su
invariante y se prueba **poniendo el fallo otra vez** (regla del proyecto).

### Fase 0 — Congelar lo que hay (medio día, sin riesgo)
Un `tools/data_apps_ledger.mjs` que recorre las siete apps con ejemplo cargado y guarda, por pestaña, los ids de controles, las columnas de las tablas y los
gráficos presentes (el censo de este estudio, hecho invariante). **Ninguna fase posterior puede quitar una entrada sin editar el libro a propósito.** Es lo que
garantiza "sin perder facultades".

### Fase 1 — Estadística: un solo `StatsKit` (la que más vale)
Un bloque generado como el motor de ajuste (`tools/statskit/` + `sync_statskit.py`, a Echo, Lumina, Beacon, Tempo, Hit Finder, Dora, BCA donde aplique):
1. **Un registro de umbrales** (`minR2`, `maxSD`, `hookThr`, `fewDf`) con **un valor por defecto** y la misma etiqueta. (Decisión D1.)
2. **Estadística descriptiva única** (media, SD, SEM, IC t, mediana, MAD, cuantil tipo 7, CV) — se borran las seis copias.
3. **`potencyCell(value, {q, ci, unit, nd})`**: una gramática de cotas (`>`, `<`, `≥`, `≤`, `n.d.`, `—`) y de incertidumbre (IC95 asimétrico; "×/÷" y "± SD" se conservan pero con
   su nombre en el pie y un tooltip que da el IC cuando existe). Solo cambia el texto mostrado; Echo muestra la cota en la tabla (hoy solo en Motivo).
4. **`plateQC()`**: Z′, S/B, CV de controles, deriva por filas/columnas, borde-vs-interior (Echo `_plQCStats` + Beacon `bPlateQC`) → Lumina y Tempo ganan un
   bloque de QC (Lumina con sus controles; Tempo con vehículo y fondo).
5. **Beacon gana** IC95 (el motor ya devuelve `se`), aviso SD, hook opcional y R² mínimo configurable; **Tempo gana** columnas opcionales (IC y R² del DC50) *apagadas por defecto*, para que
   su tabla ancha no cambie de aspecto.
6. Invariante nuevo (S1–S6): mismo conjunto de curvas sintéticas → mismos flags y mismo texto de motivo en Echo, Lumina y Beacon; una cota se escribe igual en todas.

*Se conserva:* todo (se añade, no se quita). *Riesgo:* bajo en los cálculos (ya sincronizados); medio en el umbral por defecto, que es lo que cambia resultados visibles — por eso D1.

### Fase 2 — Una tabla de resultados (`ResultsKit`)
Pieza con columnas declaradas, no HTML a mano: cabecera 11 px/600 sin mayúsculas (como dice `UI.md`), tres densidades (**compacta** 11/10 px y fila 28–30 para Echo con 60+ filas;
**estándar** 12/11 y fila 32–36 para Lumina, Beacon, Dora; **amplia** 13/11 y fila ≥ 44 para Tempo), números alineados a la derecha con `tabular-nums`, **orden canónico de columnas**
(`Nombre · Placa/grupo · Potency · IC95 · Efecto · Hill · R² · n · Aviso · …propias de la app`: es el orden de Lumina y el de la tabla `fourPL` de ChartKit), una sola pastilla de aviso con el vocabulario que Echo
y Lumina ya comparten (`R2=…`, `SD=…`, `Hookx…`, `DC50>range`, `No dose-response…`), fila seleccionada y ↑↓, y los mismos botones **Copy TSV · Copy for Prism · Excel/CSV**. Las columnas propias de cada
app (Tempo: KDegMax…; Hit Finder: puertas; Dora: barras de Dmax) siguen siendo suyas.

*Se conserva:* todas las columnas hoy visibles (Echo conserva LogDC50/pDC50/Normalisation; Tempo sus ocho columnas cinéticas). *Cambia:* aspecto y orden, no contenido. *Riesgo:* medio (es lo que Jon ve cada día).

### Fase 3 — Tipografía, color y marco
- `docs/UI.md` gana una sección **"Data apps"**: escala de gráfico en pantalla (marca 10 · título de eje 11 · leyenda 11 · anotación 10, Plex Sans; **Mono solo para valores en tooltip y IDs**), densidades de tabla (Fase 2),
  fuente de cifras (D3), y la regla de que **un tamaño fraccionario fuera de `--fs-*` es un fallo** (10,5 / 11,5 / 11,44 desaparecen).
- **Color:** una sola lista categórica (la de Lumina/Beacon, con Okabe-Ito como alternativa) y **un solo `#4b76b5`**: Tempo, Echo, Lumina y Hit Finder leen `--accent` en lugar del literal viejo.
  `check_css.py` ya falla con el literal en Labbook; se extiende a las siete.
- **Marco:** barra de pestañas de **40 px**, con iconos en todas (Echo los gana), contadores igual que hoy, Setup siempre al extremo derecho con el mismo botón, Export siempre un menú en la misma
  esquina; margen lateral **28 px**; tarjeta `--r3` + `--shadow-xs` y cabeceras sin mayúsculas (Lumina y Beacon se alinean con Tempo y Hit Finder, que ya cumplen `UI.md`).
- Invariante: sondeo de estilo calculado (el de este estudio) fijando alto de barra, tamaño de th/td, radio y sombra de tarjeta por densidad.

### Fase 4 — Esqueleto de pestañas (por slots, no un molde)
Orden canónico de los slots, **donde la app los tenga**: `Datos · Resultados · Curvas · Comparar · Figura · QC · Historial · Guía`, con `Setup` y `Export` siempre en el mismo sitio.

| App | Hoy | Propuesto (mismo contenido) |
|---|---|---|
| Echo | 11 pestañas | **Results · Curves · Compare (=Plots) · Graph · Plate (Maps·QC) · Properties · Run (=Console + Protocol + Source Plate como 3 vistas) · History · Guide** → 9, nada eliminado |
| Lumina | Plate · Results · (Norm) · Graph · History · Guide | igual; añade el bloque de QC de la Fase 1 |
| Beacon | Plate · Results · (Norm) · Graph · History · Guide | igual |
| Tempo | Plate · Curves · Results · Compare · History | **Plate · Results · Curves · Compare · Graph · History · Guide** (Results antes de Curves como Echo; Graph por la Fase 5; Guide nueva) |
| Hit Finder | …· **Export** · Guide | igual, **con el menú Export común** como atajo (la pestaña Export, que *compone* el informe, se queda) |
| Dora | Load data · Table · DC50 vs Dmax · Properties · Guide | **Data · Results · Compare · Properties · Guide** (solo cambian los nombres) |
| BCA | Workflow · History · Guide | igual (flujo lineal, no tiene slots que repartir) |

### Fase 5 — Gráficos: de seis motores a uno con dos modos nuevos
1. **Núcleo de estilo** exportado por ChartKit (`ChartKitCore`): paleta, ticks, rejilla, leyenda, marcadores, `decadeLabels`, fuentes en pantalla. Los gráficos a mano (Tempo, Hit Finder, Dora, BCA y los canvas de Echo/Lumina/Beacon) **llaman a este núcleo** en vez de definir los suyos.
   Es la fase barata y ya iguala colores, ejes y letra.
2. **`kind:'scatter'` en ChartKit** (parámetro frente a parámetro, con zonas, etiquetas, selección por rectángulo, colores por categoría): sustituye **cinco** implementaciones (Echo Plots, Lumina Plot, Tempo Compare, Hit Finder Plots, Dora DC50 vs Dmax) y
   les da el editor, el PNG a 1200 dpi, el PDF vectorial y el SVG. Dora y Echo dejan de necesitar Chart.js.
3. **`kind:'time'`** (serie temporal con banda ± SD, marcas verticales t½/onset): Tempo Kinetics / Over time / Raw. **Heat map, Residuals y First-order check se quedan como vistas propias de Tempo**, alimentadas por el núcleo de estilo.
4. **Menú Export único** con el esquema de Echo (que ya es el mejor): *Figure* (PNG · SVG · PDF · Copiar imagen) · *Table* (Copy TSV · Copy for Prism · CSV · Excel) · *Report* (Método · libro de cálculo · PDF) · *Send to* (Labbook · Hit Finder · Ribbon, solo lo que la app soporte).
   Tempo gana PDF vectorial; Dora y BCA ganan "Send to" si lo decides (D5). El PDF por lotes de Echo se queda: es un informe, no una figura.

*Se conserva:* todos los gráficos y vistas listados en §5.4. *Riesgo:* el más alto (ChartKit tiene 68+ comprobaciones y se ha roto en integración antes, "ChartKit, broken on purpose"); por eso scatter y time van **por separado, una app a la vez**, y cada una se prueba dentro de la app con rueda, ratón y valores raros (regla *Test in the app, not the bench*).

### Qué NO propongo
- Fusionar apps (ya decidido: Lumina no es un modo de Echo).
- Quitar pestañas con contenido (Echo reorganiza, no elimina).
- Cambiar ningún cálculo ni ningún número guardado.
- Tocar móvil, que no aplica a estas apps.

---

## 8. Decisiones (respondidas por Jon el 30 oct 2026)

**D1–D7: se acepta la recomendación de cada una**, con una ampliación en D2 y una precisión:
- **Graph donde no haya**: Tempo, Hit Finder, Dora y BCA ganan una pestaña **Graph** con **el mismo motor y el más nuevo: ChartKit** (Fase 5; hay que añadirle `scatter` y `time`).
- **Echo Dose Response es especial** (muchas más funciones): se homogeneiza *hacia* él y no se le quita nada; sus 11 → 9 pestañas solo reagrupan.
- Orden de trabajo (D7): Fase 0 → 1 → 3 → 2 → 4 → 5, **una fase por sesión**, cada una con su invariante.

**Estado final (30 oct, segunda sesión):** las seis fases están hechas y subidas. Fase 1 (StatsKit, cotas, calidad de placa en Lumina y Tempo, IC y R² opcionales en Tempo, flags en Beacon) · Fase 3 (marco: gutter, barras de 40 px, tarjetas, tipografía en escala, acento) · Fase 2 (ResultsKit) · Fase 4 (esqueleto de pestañas, Run en Echo, Guide en Tempo) · Fase 5 (ChartKit con eje lineal, nombres de punto y líneas; pestaña **Graph** en Tempo, Hit Finder, Dora y BCA). Invariantes nuevos: `data_apps_ledger`, `stats_invariants` (S1–S7), `data_apps_frame_invariants` (F1–F6), `graph_invariants` (GR1–GR9). Detalle por fase en `docs/CLAUDE_REFERENCE.md › Data-analysis apps: one set of rules`. **Lo que no se hizo, a propósito:** unificar los cinco gráficos de "un parámetro contra otro" (Plots, Plot, Compare…) en ChartKit — tienen zonas, cajas de selección y hooks que ChartKit no tiene —; una prueba de hook en Beacon; las copias de estadística descriptiva dentro de ChartKit, Lumina y BCA.

**Hecho el 30 oct (Fase 0 y arranque de la Fase 1):**
- `tools/data_apps_ledger.mjs` + `tools/fixtures/data_apps_ledger.json` (1 614 entradas): falla si desaparece una pestaña, cabecera de tabla, botón, título o gráfico de cualquiera de las siete apps. Probado renombrando la pestaña Compare de Tempo.
- **D1: R² mínimo = 0,90 en Echo, Lumina y Beacon.** Medido antes en `Backup/` (solo lectura): de 609 curvas únicas del historial de Echo, 21 caen entre 0,80 y 0,90, **14 de ellas solo se marcarían por eso** (≈ 7 pocillos distintos de un cribado, repetidos en varias versiones); en Labbook, 1 de 23. Ningún número guardado cambia (los avisos de los análisis ya hechos se quedan como estaban).
- **Beacon da el IC95 del punto medio** (`bMidCI`, la regla de Echo y Lumina: log10 ± t·SE): columna *95% CI* en Results, dos columnas en CSV / copiar / Excel, y el `ci` de la fila que viaja a Labbook. Un valor acotado (`> 10 µM`) no tiene intervalo. El motor `_tQ95` pasa a sincronizarse también a Beacon.
- `tools/stats_invariants.mjs` (S1–S3): el R² por defecto es un solo número en las tres apps; el intervalo de Beacon cubre el valor plantado en ≥ 52 de 60 ejecuciones ruidosas (cubre 57 esperado) y crece con el ruido; llega a pantalla, ficheros y Labbook. Cada una probada poniendo el fallo otra vez.
- **Pendiente de la Fase 1:** estadística descriptiva única, `potencyCell` (gramática de cotas), `plateQC()` para Lumina y Tempo, IC y R² opcionales en Tempo, y que Beacon avise por SD y por hook.

## 8b. Las siete preguntas, tal como estaban

Cada una cambia lo que construiría:

**D1 — R² mínimo por defecto: ¿0,80 (Echo), 0,90 (Lumina, Beacon) u otro?** Es la única decisión que cambia qué compuestos se marcan. Antes de que elijas puedo
medir, con tu copia real de `Backup/` (solo lectura, en un navegador desechable), cuántas curvas pasan de limpias a marcadas con 0,90 y al revés con 0,80. ¿Lo mido?

**D2 — Orden Results / Curves.** Echo (y Lumina/Beacon implícitamente) abren en la tabla; Tempo abre en las curvas. ¿Tempo se alinea (Results → Curves) o Tempo
conserva Curves primero porque su trabajo es mirar trazas?

**D3 — Cifras: ¿Plex Mono o Sans con cifras tabulares?** Tempo y Hit Finder usan Mono para los números (aspecto de instrumento); el resto Sans. Recomiendo *tabular-nums* en Sans
en todas (misma alineación de decimales, sin saltos de ancho) y Mono solo para IDs, pocillos y código. Si te gusta el aspecto Mono de Tempo, lo hacemos regla y las demás lo adoptan.

**D4 — Densidad de tabla y botón Export.** Echo es compacto a propósito (63 filas a 11 px). ¿Mantengo tres densidades declaradas (compacta/estándar/amplia) o quieres una sola? Y el
Export de Lumina es **primario azul** mientras el resto es secundario gris: ¿cuál es el estándar?

**D5 — Alcance de "Send to".** Dora no tiene Enviar a Labbook; Tempo/Dora/BCA no tienen Prism. ¿Se añaden (facultad nueva) o se queda como está?

**D6 — Hit Finder › Export.** ¿Se queda como pestaña (compone el informe) con el menú común además, o pasa a ser solo menú?

**D7 — Por dónde empiezo.** Recomiendo **Fase 0 → 1 → 3 (color y marco, barata) → 2 → 4 → 5**, una por sesión con su invariante. Si prefieres lo más visible primero, **2 y 3** son lo que más
se nota a simple vista; si prefieres lo más valioso, **1**.

---

## Anexo A — Medidas en bruto

Alto de la barra de pestañas (px): Echo 50 · Lumina 42 · Beacon 39 · Tempo 41 · Hit Finder 41 · Dora 38.
Fuente de pestaña: 13 px (Echo 400, Lumina/Beacon/Tempo/HF 500→600 al activarse) · Dora 12 px/500.
Fondo de página `rgb(244,245,248)` en todas. Botón Export: Echo gris 32 px/12 px/500 · Lumina azul `#4b76b5` 32/12/600 · Beacon gris 32/12/600 · Tempo gris **28/11/600**.
Estilos de tarjeta: Lumina r-2 + sombra `0 2px 8px/.06` · Beacon r-2 sin sombra · Tempo y Hit Finder r-3 + `0 1px 4px/.04`.
Gráficos (px y fuente): Echo Curves 1440×641 canvas · Lumina Results 620×420 canvas · Beacon Results 629×340 y 629×280 canvas · ChartKit 758–945 × 490–611 SVG ·
Tempo Curves 1056×550 SVG · Hit Finder Plots 646×430 ×4 SVG · Dora 1342×558 canvas · BCA 720×384 y 690×300 canvas.
Pestañas × (canvas, svg, tablas): Echo Results (0,0,2) · Curves (1,0,0) · Plots (1,0,0) · Plate (4,0,0) · Graph (0,1,0); Lumina Results (1,0,1) · Graph (0,1,0); Beacon Results (2,0,3) · Graph (0,1,0);
Tempo Curves (0,1,1) · Compare (0,4,0); Hit Finder Plots (0,4,0) · Criteria (0,4,0) · Chemistry (0,4,1); Dora Scatter (1,0,0); BCA Standards (2,0,2).

El script del censo es reproducible (Playwright sobre `python3 -m http.server 8791`); las capturas por pestaña están en el scratchpad de la sesión y no se versionan.

## Anexo B — Libro de facultades por app (lo que una invariante vigilaría)

*(Entradas que hoy son únicas o casi únicas. Una app que no figura en una fila no la tiene.)*

| Facultad | Dónde |
|---|---|
| Auditoría de normalización con frase y comprobación por celda | Echo |
| Compare de curvas con referencia fijada, deshacer ⌘Z por edición | Echo |
| PDF vectorial por lotes (6 curvas/página, IC y marcas) | Echo |
| Plate QC: Z′, S/B, CV, deriva filas/columnas, borde vs interior, referencia DMSO | Echo |
| Plate quality: baseline, vehicle, window, S/B, Z′ + conteos de donante/aceptor | Beacon |
| Pooled / Per plate (mismo nombre en varias placas = un compuesto) | Beacon |
| Ki (Cheng–Prusoff), sitio único, trazador | Beacon (Ki también Echo) |
| Selector Units (auto, M…pM, log) que gobierna tabla y ficheros | Lumina |
| Normalización a viabilidad opcional | Lumina, Echo |
| Plot X contra Y y normalizar X contra Y | Lumina, Tempo |
| Normalización ProNect verificada (Δ máx 1,07e-3) y alternativas | Tempo |
| IC95 por verosimilitud de perfil con ajuste por autocorrelación | Tempo |
| MM sobre K (KDegMax, KDeg50, eficiencia), 4 cabeceras literales de Jon | Tempo |
| Curso temporal: mayor cambio, t½, inicio, área, clase; ajuste de inducción 1 fase | Tempo |
| Dosis por masa (ng/mL…mg/mL) | Tempo |
| Exportación ProNect-compatible; Método; Prism por condición | Tempo |
| Vistas Raw (RLU), Heat map, Residuals, First-order check | Tempo |
| Criterios con puertas y pesos, tiers, robustez, sensibilidad, Health | Hit Finder |
| Chemistry (estructura, diana, propiedades) con RDKit | Hit Finder, Dora, Echo (Properties) |
| Informe con procedencia y "Criteria used" | Hit Finder |
| Umbrales Excellent/Moderate/Weak y zonas Hit/Partial/Inactive | Dora |
| PNG en blanco / negro / transparente; plantilla Excel descargable | Dora |
| Pegado 8×12, pintar patrón y muestra, regresión lineal/cuadrática, plan de dilución, hoja para reproducir a mano | BCA |
| Paletas, barras de error SD/SEM/IC/rango, réplicas omitibles, imanes, 1200 dpi, PDF vectorial a mano, SVG, tabla bajo figura, unidad de eje | ChartKit |
