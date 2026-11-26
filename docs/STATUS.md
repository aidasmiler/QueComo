# Estado del proyecto

_Última actualización: 2026-11-27 (Claude Code en la nube)._

## Resumen

PR #1 (base + cuentas + hogares + perfil) en revisión con preview real. Segunda entrega en curso: **recetario** en `feature/recipes` (PR apilado sobre el #1). Aún no hay menú ni compra.

## Leyenda

**Implementado** = código en una rama · **Probado** = pruebas ejecutadas con resultado real · **Desplegado** = accesible en una URL de Netlify · **Validado** = aprobado por Aída.

| Funcionalidad (Notion ID)          | Implementado                                       | Probado                                                                                                               | Desplegado                           | Validado |
| ---------------------------------- | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------ | -------- |
| 1 · Base técnica y primera preview | Sí                                                 | Unit + E2E públicos                                                                                                   | Pendiente de enlazar repo en Netlify | No       |
| 2 · Autenticación y perfil         | Sí                                                 | E2E públicos (validaciones, idioma sin sesión). Flujo con backend: pendiente de desactivar _Confirm email_ en pruebas | No                                   | No       |
| 3 · Hogares compartidos            | Sí                                                 | RLS escrita (`tests/integration`), pendiente de ejecutar (misma causa)                                                | No                                   | No       |
| 9 · Internacionalización y ajustes | Sí (es-ES, en-GB, perfil)                          | Unit + E2E                                                                                                            | No                                   | No       |
| 10 · Inicio y preferencias         | Parcial (inicio básico, preferencias alimentarias) | Manual pendiente                                                                                                      | No                                   | No       |
| 4 · Recetario                      | Sí (`feature/recipes`)                             | Unit (escalado), `db:verify` (RLS en PGlite), E2E con backend en CI tras aplicar la migración                         | Tras aplicar la migración            | No       |
| 5 · Escalado de raciones           | Sí                                                 | Unit (ejemplos §7.1)                                                                                                  | Con el recetario                     | No       |
| 6–8, 11                            | No                                                 | —                                                                                                                     | —                                    | —        |

## Pruebas ejecutadas (2026-11-26/27, nube Linux, Chromium 1243 de Playwright)

- `npm run lint` ✔ · `npm run typecheck` ✔ · `npm run i18n:check` ✔ · `npm run format:check` ✔
- `npm run test` → 12 pasan, 8 omitidas (integración sin backend habilitado).
- `npm run test:e2e` → 14 pasan (públicos, Pixel 7 + Desktop Chrome), 4 omitidas (requieren `E2E_BACKEND=1`).
- GitHub Actions en la PR #1 (commit 0e22d81): calidad ✔ y E2E ✔.
- No probado: WebKit/Safari, dispositivos físicos, flujo real de registro con correo.

## Bloqueos / acciones de Aída

1. ~~Enlazar el repositorio a Netlify **quecomo-app**~~ (hecho por Aída el 27/11, rama de producción `main`; Deploy Previews quedan activas por defecto). Pendiente comprobar la primera preview.
2. ~~Supabase pruebas: Site URL, Redirect URLs y desactivar _Confirm email_~~ (hecho por Aída el 27/11).
   2b. Aplicar `supabase/migrations/20261127000000_recipes.sql` en el SQL Editor del proyecto de pruebas.
3. (Más adelante) SMTP gratuito para correos reales en producción; crear el proyecto Supabase de producción.

## Decisiones pendientes

- Proveedor SMTP gratuito para la beta familiar (p. ej. Brevo o Resend en plan gratuito): necesario para confirmar correos y recuperar contraseñas de personas fuera de la organización de Supabase.
- Protección de `main` en GitHub (puede no estar disponible en repos privados Free).
- Producción: cuándo crear el segundo proyecto Supabase y cuándo quitar el _Netlify team login_ del contexto de producción.
- Eliminación de cuenta y exportación de datos (P0 §32): requieren una Edge Function con privilegios; se hará antes de la beta.

## Problemas conocidos

- Bundle JS en un solo chunk: dividir por rutas cuando llegue el menú.
- Al reducir raciones el nombre del ingrediente no cambia de número («1 cebollas»).
- La nube de Claude Code no alcanza `*.supabase.co` ni las previews de Netlify: las pruebas con backend se ejecutan en CI.
- Los usuarios de prueba creados por E2E/integración no se borran automáticamente.
- Límites actuales de los planes gratuitos (Netlify, Supabase, GitHub Actions) pendientes de verificar en sus páginas oficiales y documentar con cifras.

## Notion

Actualizado el 26/11/2026: ficha de entrega de la PR #1 (En revisión, CI pendiente), funcionalidades 1, 2, 3 y 9 → «En revisión», 10 (Inicio y preferencias) → «En desarrollo» (falta completar Inicio) y estado/bloqueo/próximo paso del dashboard.

## Siguiente acción concreta

Aída aplica la migración del recetario; entonces el job `backend` valida el recetario en CI y se revisa en la preview del PR del recetario. Siguiente módulo: menú semanal (§28).
