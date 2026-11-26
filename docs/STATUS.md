# Estado del proyecto

_Última actualización: 2026-11-27 (sesión de arranque, Claude Code en la nube)._

## Resumen

Primera entrega en revisión: base técnica + cuentas + hogares + perfil (PR #1 desde `claude/project-thread-p97x4g`). Aún no hay recetas, menú ni compra.

## Leyenda

**Implementado** = código en una rama · **Probado** = pruebas ejecutadas con resultado real · **Desplegado** = accesible en una URL de Netlify · **Validado** = aprobado por Aída.

| Funcionalidad (Notion ID)          | Implementado                                       | Probado                                                                                                               | Desplegado                           | Validado |
| ---------------------------------- | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------ | -------- |
| 1 · Base técnica y primera preview | Sí                                                 | Unit + E2E públicos                                                                                                   | Pendiente de enlazar repo en Netlify | No       |
| 2 · Autenticación y perfil         | Sí                                                 | E2E públicos (validaciones, idioma sin sesión). Flujo con backend: pendiente de desactivar _Confirm email_ en pruebas | No                                   | No       |
| 3 · Hogares compartidos            | Sí                                                 | RLS escrita (`tests/integration`), pendiente de ejecutar (misma causa)                                                | No                                   | No       |
| 9 · Internacionalización y ajustes | Sí (es-ES, en-GB, perfil)                          | Unit + E2E                                                                                                            | No                                   | No       |
| 10 · Inicio y preferencias         | Parcial (inicio básico, preferencias alimentarias) | Manual pendiente                                                                                                      | No                                   | No       |
| 4–8, 11                            | No                                                 | —                                                                                                                     | —                                    | —        |

## Pruebas ejecutadas (2026-11-26/27, nube Linux, Chromium 1243 de Playwright)

- `npm run lint` ✔ · `npm run typecheck` ✔ · `npm run i18n:check` ✔ · `npm run format:check` ✔
- `npm run test` → 12 pasan, 8 omitidas (integración sin backend habilitado).
- `npm run test:e2e` → 14 pasan (públicos, Pixel 7 + Desktop Chrome), 4 omitidas (requieren `E2E_BACKEND=1`).
- No probado: WebKit/Safari, dispositivos físicos, flujo real de registro con correo.

## Bloqueos / acciones de Aída

1. Enlazar el repositorio al proyecto Netlify **quecomo-app** y activar Deploy Previews (ver `docs/deployment/NETLIFY.md`).
2. Supabase pruebas: Site URL, Redirect URLs y desactivar _Confirm email_ (ver `docs/deployment/SUPABASE.md`).
3. (Más adelante) SMTP gratuito para correos reales en producción; crear el proyecto Supabase de producción.

## Decisiones pendientes

- Proveedor SMTP gratuito para la beta familiar (p. ej. Brevo o Resend en plan gratuito): necesario para confirmar correos y recuperar contraseñas de personas fuera de la organización de Supabase.
- Protección de `main` en GitHub (puede no estar disponible en repos privados Free).
- Producción: cuándo crear el segundo proyecto Supabase y cuándo quitar el _Netlify team login_ del contexto de producción.
- Eliminación de cuenta y exportación de datos (P0 §32): requieren una Edge Function con privilegios; se hará antes de la beta.

## Problemas conocidos

- Bundle JS de ~270 kB gzip en un solo chunk: dividir por rutas cuando lleguen recetas/menú.
- Los usuarios de prueba creados por E2E/integración no se borran automáticamente.
- Límites actuales de los planes gratuitos (Netlify, Supabase, GitHub Actions) pendientes de verificar en sus páginas oficiales y documentar con cifras.

## Notion

Actualizado en esta sesión: ficha de entrega de la PR #1 y estado de funcionalidades 1, 2, 3, 9 → «En revisión».

## Siguiente acción concreta

Cuando la preview exista: ejecutar `E2E_BACKEND=1 npm run test:e2e` y `npm run test:integration` contra pruebas, adjuntar resultados a la PR. En paralelo, empezar `feature/recipes`: migración de recetas (ingredientes, pasos, categorías, etiquetas, favoritos, valoraciones, bucket privado de fotos) + dominio de escalado con tests.
