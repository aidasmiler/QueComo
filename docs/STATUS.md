# Estado del proyecto

_Última actualización: 2026-11-27 (Claude Code en la nube)._

## Resumen

PR #1 (base + cuentas + hogares + perfil) **integrada en `main`** el 27/11 con aprobación de Aída. Segunda entrega: **recetario** (PR #2, `feature/recipes` → `main`) con CI completo en verde, pendiente de revisión en su preview. Aún no hay menú ni compra.

## Leyenda

**Implementado** = código en una rama · **Probado** = pruebas ejecutadas con resultado real · **Desplegado** = accesible en una URL de Netlify · **Validado** = aprobado por Aída.

| Funcionalidad (Notion ID)          | Implementado                                       | Probado                                                                                   | Desplegado                            | Validado |
| ---------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------- | -------- |
| 1 · Base técnica y primera preview | Sí (`main`)                                        | Unit + E2E públicos y con backend (CI)                                                    | Preview PR #1; producción sin backend | No       |
| 2 · Autenticación y perfil         | Sí (`main`)                                        | E2E con backend en CI (registro, idioma persistente)                                      | Preview PR #1                         | No       |
| 3 · Hogares compartidos            | Sí (`main`)                                        | Integración RLS 8/8 y E2E con backend en CI                                               | Preview PR #1                         | No       |
| 9 · Internacionalización y ajustes | Sí (es-ES, en-GB, perfil)                          | Unit + E2E                                                                                | No                                    | No       |
| 10 · Inicio y preferencias         | Parcial (inicio básico, preferencias alimentarias) | Manual pendiente                                                                          | No                                    | No       |
| 4 · Recetario                      | Sí (`feature/recipes`)                             | Unit, `db:verify` (RLS en PGlite) y E2E con backend en CI ✔ (migración aplicada el 27/11) | Preview PR #2                         | No       |
| 5 · Escalado de raciones           | Sí                                                 | Unit (ejemplos §7.1)                                                                      | Con el recetario                      | No       |
| 6–8, 11                            | No                                                 | —                                                                                         | —                                     | —        |

## Pruebas ejecutadas (2026-11-26/27, nube Linux, Chromium 1243 de Playwright)

- `npm run lint` ✔ · `npm run typecheck` ✔ · `npm run i18n:check` ✔ · `npm run format:check` ✔
- `npm run test` → 12 pasan, 8 omitidas (integración sin backend habilitado).
- `npm run test:e2e` → 14 pasan (públicos, Pixel 7 + Desktop Chrome), 4 omitidas (requieren `E2E_BACKEND=1`).
- GitHub Actions PR #1 (8e24b74): calidad ✔, E2E ✔, backend ✔ (RLS 8/8, E2E 18/18).
- GitHub Actions PR #2 (a00de0d): calidad ✔, E2E ✔, backend ✔ (incluye el E2E completo del recetario). El E2E encontró un fallo real (favoritas no se guardaban por el upsert de PostgREST) ya corregido.
- No probado: WebKit/Safari, dispositivos físicos, correo real (SMTP).

## Bloqueos / acciones de Aída

1. ~~Enlazar el repositorio a Netlify **quecomo-app**~~ (hecho por Aída el 27/11, rama de producción `main`; Deploy Previews quedan activas por defecto). Preview comprobada por Aída.
2. ~~Supabase pruebas: Site URL, Redirect URLs y desactivar _Confirm email_~~ (hecho por Aída el 27/11).
   2b. ~~Aplicar la migración del recetario en pruebas~~ (hecho por Aída el 27/11).
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

Aída revisa el recetario en la preview de la PR #2. Siguiente módulo: menú semanal (§28).
