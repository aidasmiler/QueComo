# Hoja de ruta

Sin sprints: orden por dependencias. La priorización funcional viva está en Notion (Funcionalidades); aquí el orden técnico.

| #   | Entregable                                                                                                                         | Prioridad | Depende de | Estado             |
| --- | ---------------------------------------------------------------------------------------------------------------------------------- | --------- | ---------- | ------------------ |
| 1   | Base técnica, PWA, i18n, diseño, CI, Netlify                                                                                       | P0        | —          | En revisión (PR 1) |
| 2   | Autenticación y perfil (idioma, preferencias)                                                                                      | P0        | 1          | En revisión (PR 1) |
| 3   | Hogares e invitaciones                                                                                                             | P0        | 2          | En revisión (PR 1) |
| 4   | Recetario (CRUD, fotos privadas, categorías, etiquetas, favoritos, búsqueda, pasos estructurados)                                  | P0        | 3          | Siguiente          |
| 5   | Escalado de raciones (dominio puro + UI)                                                                                           | P0        | 4          | Pendiente          |
| 6   | Menú semanal (varias preparaciones por franja, mover/copiar, semanas)                                                              | P0        | 4–5        | Pendiente          |
| 7   | Lista de compra (generación idempotente, procedencia, manuales, comprado/en casa, Realtime)                                        | P0        | 6          | Pendiente          |
| 8   | Offline: caché IndexedDB por usuario/hogar + outbox                                                                                | P0        | 4, 6, 7    | Pendiente          |
| 9   | Inicio completo y sugerencias simples                                                                                              | P0/P1     | 4–7        | Pendiente          |
| 10  | Producción: proyecto Supabase prod, SMTP, dominio, backups                                                                         | P0        | 1–8        | Pendiente          |
| 11  | P1: duplicar/archivar, copiar semanas, valoraciones, filtros de tiempo, modo cocina, tema oscuro, exportación, importación JSON-LD | P1        | MVP        | Pendiente          |

## Riesgos

- **Correo de autenticación**: el SMTP gratuito de Supabase solo envía a miembros de la organización y con límite muy bajo. Para la beta familiar hace falta un SMTP propio gratuito (decisión pendiente, ver STATUS).
- **Netlify gratis**: límites de créditos/minutos de build; las previews consumen build. Vigilar consumo.
- **Supabase gratis**: pausa por inactividad y sin backups descargables automáticos en plan gratuito → procedimiento manual (BACKUP_RESTORE.md).
- **Safari/iOS**: almacenamiento y Service Worker con limitaciones; sin dispositivo físico de pruebas en la nube.
- **Bloqueos de LaLiga**: validar accesibilidad desde conexiones españolas antes del uso familiar (§102).

## Decisiones pendientes

Ver `docs/STATUS.md` → «Decisiones pendientes».
