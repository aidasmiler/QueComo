# Hoja de ruta

Sin sprints: orden por dependencias. La priorización funcional viva está en Notion (Funcionalidades); aquí el orden técnico.

| #   | Entregable                                                                                                                                                               | Prioridad           | Depende de | Estado                  |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------- | ---------- | ----------------------- |
| 1   | Base técnica, PWA, i18n, diseño, CI, Netlify                                                                                                                             | P0                  | —          | En `main`               |
| 2   | Autenticación y perfil (idioma, preferencias)                                                                                                                            | P0                  | 1          | En `main`               |
| 3   | Hogares e invitaciones                                                                                                                                                   | P0                  | 2          | En `main`               |
| 4   | Recetario (CRUD, fotos privadas, categorías, etiquetas, favoritos, búsqueda, pasos estructurados) y escalado de raciones                                                 | P0                  | 3          | En revisión (PR #2)     |
| 4b  | Catálogos, equipamiento del hogar, métodos alternativos, etiquetas automáticas e historial (ADR 0007)                                                                    | P0                  | 4          | En revisión (PR #3)     |
| 4c  | Clasificación inteligente por reglas (§105, ADR 0008)                                                                                                                    | P0                  | 4b         | En revisión (PR propia) |
| 4d  | Formulario de recetas simplificado: «Añadir más detalles», foto antes de guardar, borradores locales (§106)                                                              | P0                  | 4c         | Siguiente               |
| 4e  | Pegado de texto completo y dictado por voz sobre un borrador de receta común (§107)                                                                                      | P0/P1               | 4d         | Pendiente               |
| 6a  | Productos del hogar mínimos (nombre + campos opcionales en «más detalles», utensilios con tres estados) y búsqueda común recetas/productos                               | P0                  | 4d         | Pendiente               |
| 6   | Menú semanal con elementos de varios tipos (receta, producto, alimento, texto, sobra, fuera de casa), varios por momento, creación de producto sin salir del plan (§108) | P0                  | 6a         | Pendiente               |
| 7   | Lista de compra según el tipo de elemento (ingredientes escalados, envases de producto, agrupación, procedencia, comprado/en casa, Realtime)                             | P0                  | 6          | Pendiente               |
| 7a  | Modelo nutricional + cálculo de kcal y macros por cantidad, ración y envase (dominio puro, datos manuales)                                                               | Alta (bloque §109)  | 6a         | Pendiente               |
| 7b  | Open Food Facts por código escrito y por nombre/marca (Edge Function, caché, atribución ODbL)                                                                            | Alta (bloque §109)  | 6a, 7a     | Pendiente               |
| 7c  | Escaneo con cámara (BarcodeDetector + ZXing)                                                                                                                             | Alta (bloque §109)  | 7b         | Pendiente               |
| 8   | Offline: caché IndexedDB por usuario/hogar + outbox                                                                                                                      | P0                  | 4, 6, 7    | Pendiente               |
| 9   | Inicio completo y sugerencias simples                                                                                                                                    | P0/P1               | 4–7        | Pendiente               |
| 10  | Producción: proyecto Supabase prod, SMTP, dominio, backups                                                                                                               | P0                  | 1–8        | Pendiente               |
| 11  | P1: copiar semanas, modo cocina, tema oscuro, exportación; importación por URL/JSON-LD, OCR y redes sociales como adaptadores del borrador común (§107.5)                | P1                  | MVP, 4e    | Pendiente               |
| 12  | Nutrición media: alimentos genéricos (BEDCA tras revisar condiciones), ingredientes ↔ alimentos/productos, recetas caseras, totales por comida/día/semana                | Media (bloque §109) | 7a         | Pendiente               |
| 13  | Futuro: objetivos personales, consumo real, OCR de etiquetas, menús por objetivos, precios, apps de salud, inventario y sobras                                           | Futura              | 12         | Pendiente               |

Las prioridades «Alta/Media/Futura» son relativas al bloque de productos y nutrición (§109.9) y no cambian las generales. Cada fila es una o varias PR independientes.

Orden acordado con Aída el 27/11/2026: no ampliar la PR #3; terminar y validar lo que está en curso; después 4d y 4e, cada uno en su PR con pruebas. El menú semanal va a continuación (antes estaba previsto justo después del recetario; queda detrás de 4d–4e salvo que Aída indique otra cosa).

## Riesgos

- **Correo de autenticación**: el SMTP gratuito de Supabase solo envía a miembros de la organización y con límite muy bajo. Para la beta familiar hace falta un SMTP propio gratuito (decisión pendiente, ver STATUS).
- **Netlify gratis**: límites de créditos/minutos de build; las previews consumen build. Vigilar consumo.
- **Supabase gratis**: pausa por inactividad y sin backups descargables automáticos en plan gratuito → procedimiento manual (BACKUP_RESTORE.md).
- **Safari/iOS**: almacenamiento y Service Worker con limitaciones; sin dispositivo físico de pruebas en la nube.
- **Bloqueos de LaLiga**: validar accesibilidad desde conexiones españolas antes del uso familiar (§102).

## Decisiones pendientes

Ver `docs/STATUS.md` → «Decisiones pendientes».
