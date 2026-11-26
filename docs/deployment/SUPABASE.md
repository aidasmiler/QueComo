# Supabase

| Entorno    | Proyecto                           | Región              | Uso                                                 |
| ---------- | ---------------------------------- | ------------------- | --------------------------------------------------- |
| Pruebas    | `hbdcxaynxkaidqdsqdqv` («QueComo») | eu-west-1 (Irlanda) | Previews, CI, tests de integración, datos ficticios |
| Producción | pendiente de crear                 | UE                  | Usuarios y datos reales                             |

## Migraciones

- Archivos en `supabase/migrations/<timestamp>_<nombre>.sql`. Nunca se edita una migración aplicada: se crea otra.
- **Pruebas**: se aplican al abrir la PR. Vías posibles: (a) SQL Editor del panel → pegar el archivo → _Run_; (b) CLI: `npx supabase link --project-ref hbdcxaynxkaidqdsqdqv` + `npx supabase db push` (requiere `SUPABASE_ACCESS_TOKEN` y la contraseña de la base de datos). Las herramientas de escritura del MCP no se usan (no se pueden aprobar desde la app).
- **Producción**: solo tras fusionar en `main`, con `supabase db push` y copia de seguridad previa. Nada destructivo.

| Migración                                | Contenido                                                         | Pruebas                          | Producción |
| ---------------------------------------- | ----------------------------------------------------------------- | -------------------------------- | ---------- |
| `20261126220000_households_and_profiles` | perfiles, hogares, miembros, invitaciones, preferencias, RLS, RPC | Aplicada 2026-11-26 (SQL Editor) | —          |

## Auth (configurar en cada proyecto)

- URL Configuration → _Site URL_: la URL de la app (`https://quecomo-app.netlify.app` en producción).
- _Redirect URLs_ (pruebas): `https://*--quecomo-app.netlify.app/**`, `http://localhost:5173/**`. En producción, **solo** la URL de producción (sin comodines).
- Email: en **pruebas**, _Confirm email_ desactivado para poder crear usuarios ficticios. En **producción**, activado y con SMTP propio (el SMTP de Supabase solo envía a miembros del equipo y con límites muy bajos).
- Contraseña mínima: 8 caracteres (la app lo valida; conviene fijarlo también en _Auth → Providers → Email → Minimum password length_).

## Seguridad

Revisar _Advisors → Security_ tras cada migración. Avisos esperados: `0029 authenticated_security_definer_function_executable` en las RPC de hogares (intencionado, ver ARCHITECTURE.md).

## Plan gratuito

Los proyectos gratuitos se pausan tras un periodo de inactividad y no incluyen copias descargables automáticas: ver `BACKUP_RESTORE.md`. Consultar límites vigentes en https://supabase.com/pricing antes de producción.
