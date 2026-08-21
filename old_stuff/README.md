# old_stuff — lo que ya no forma parte del Hub

Nada de aquí entra en el build (`embed.py` no lo mira) ni está enlazado desde el shell. Se guarda
porque tuvo trabajo dentro y porque restaurar un backup viejo puede necesitar leer el original, no
porque haga falta para nada del producto. **Si algo de aquí vuelve, vuelve como código nuevo.**

| carpeta | qué era | retirado |
|---|---|---|
| `arc/` | App Arc. Llevaba tiempo sin tarjeta ni `openApp()` — inalcanzable. | 2026-07-30, con LabMate |
| `labmate/` | LabMate, la caja de calculadoras. ~3.6 MB junto con Arc; también inalcanzable. Sus `RDKit_minimal.*` están en `.gitignore`. | 2026-07-30 |
| `plasmids/` | La app de plásmidos. Sus registros viven ahora en Archive → Library → Plasmids; `openApp('plasmids')` enruta allí, así que los `#hash` guardados y los enlaces de Labbook siguen funcionando. | 2026-08-20 |
| `superpowers/` | 20 planes y specs de junio de 2026 (Iceberg, LabMate, Beacon, las fases de densidad). Historia, no documentación viva. | 2026-08-21 |
| `images/` | Una imagen suelta que estaba en la raíz. | 2026-08-21 |
| `protocol_param_names.py` | Ayuda de un solo uso para nombrar los 565 parámetros de los protocolos. | 2026-08-21 |

Lo que **no** está aquí y no debe acabar aquí: `Backup/` (tus copias reales de datos, en la raíz y
fuera de git) y `docs/SESSION_HISTORY.md` (el registro de cambios, que sí es documentación viva).
