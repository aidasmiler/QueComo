# Arquitectura

## Vista general

```
Navegador / PWA (React + Vite, estático en Netlify)
  ├─ TanStack Query (estado remoto, caché) ─────┐
  ├─ Service Worker (precache del app shell)    │ HTTPS / WSS
  └─ IndexedDB (caché offline + outbox, P0 pendiente)
                                                ▼
Supabase (UE, eu-west-1): PostgreSQL + RLS · Auth · Storage · Realtime · RPC SQL
```

- El frontend es una SPA estática sin dependencias de funciones propietarias de Netlify (§96): `dist/` puede servirse en cualquier hosting estático con fallback a `index.html`.
- Toda la autorización vive en PostgreSQL (RLS + RPC). El cliente solo usa la clave publicable.

## Estructura del código

```
src/
  app/            router, guards (auth / hogar), pantallas de error
  components/
    ui/           primitivas de diseño (Button, Field, Dialog/bottom sheet, Toast…)
    layout/       AppShell (barra inferior móvil, lateral escritorio), logo, selector de hogar
    shared/       piezas de pantalla reutilizables
  features/<módulo>/  api.ts (Supabase), hooks.ts (TanStack Query), páginas y componentes
  domain/         reglas de negocio puras y testeadas (escalado, unidades, compra…) — llega con recetas
  i18n/           i18next + recursos por namespace (es-ES, en-GB)
  lib/            cliente Supabase, tipos, errores, query client, utilidades
supabase/migrations  SQL versionado · tests/{unit,integration,e2e}
```

## Modelo de datos (implementado)

| Tabla                      | Notas                                                                                                                                              |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `profiles`                 | 1:1 con `auth.users`; `display_name`, `locale` (`es-ES`/`en-GB`, check), `timezone`. Creada por trigger al registrarse (nombre y locale saneados). |
| `households`               | `name` (1–60), `created_by`.                                                                                                                       |
| `household_members`        | PK `(household_id, user_id)`, `role` `owner`/`member`.                                                                                             |
| `household_invitations`    | `token_hash` (SHA-256, único), `expires_at` (7 días), `accepted_at/by`, `revoked_at`. El token en claro solo se devuelve una vez al crearlo.       |
| `user_dietary_preferences` | Personales: `preset_key` (lista cerrada, identificador estable) **o** `custom_label`; `kind` preferencia/restricción.                              |

Pendiente (llegará con cada módulo, ver §45 de la spec): recetas, ingredientes, pasos, categorías, etiquetas, favoritos, valoraciones, plan de comidas, listas de compra con procedencia (`shopping_item_sources`).

## Seguridad

- **RLS activo en todas las tablas** y `revoke all` a `anon`/`authenticated` con grants mínimos explícitos (por columna en `UPDATE`: no se puede cambiar `id`, `household_id`, `user_id` ni `role`).
- Lectura: miembros del hogar (`is_household_member`), perfiles propios o de personas con hogar compartido (`shares_household_with`).
- Escritura de pertenencia **solo por RPC** `SECURITY DEFINER` (`create_household`, `create_household_invitation`, `accept_household_invitation`, `revoke_household_invitation`, `leave_household`, `remove_household_member`, `transfer_household_ownership`, `delete_household`). Todas: `search_path = ''`, comprueban `auth.uid()`, rol y parámetros, bloquean filas (`for update`) cuando hay carrera, y lanzan códigos estables `QC_*` que el cliente traduce.
- Las funciones auxiliares `is_household_*` son `SECURITY DEFINER` para evitar recursión de políticas; solo revelan la pertenencia del propio usuario.
- El linter de Supabase avisa (`0029`) de que `authenticated` puede ejecutar estas funciones: es **intencionado**; cada una valida internamente.
- Regla de negocio: el último propietario no puede abandonar el hogar (`QC_LAST_OWNER`); debe transferir o eliminar.
- Invitaciones: 32 bytes aleatorios, hash SHA-256, un solo uso, caducidad y revocación validadas en servidor; aceptación transaccional.
- Pruebas: `tests/integration/rls.test.ts` usa identidades reales (sin `service_role`) contra el proyecto de pruebas.

## Autenticación

Supabase Auth con email + contraseña, flujo PKCE, sesión persistente (`localStorage`, clave `qc.auth`) y refresco automático. Al cambiar de cuenta o cerrar sesión se vacía toda la caché de TanStack Query para no mezclar datos entre usuarios. Rutas: `/auth/callback` (confirmación de email) y `/reset-password` (recuperación).

## Idioma (§88–§91)

- `i18next` con namespaces por módulo; tipado de claves desde `es-ES`; `npm run i18n:check` en CI.
- Fuente de verdad: `profiles.locale`. Antes de cargar el perfil (o sin sesión) se usa la preferencia del dispositivo (`qc.locale`) para evitar parpadeos; al registrarse, el idioma elegido se envía como metadato y el trigger lo valida.
- Al cambiar: UI inmediata → `localStorage` → Supabase; si falla el guardado remoto se avisa.
- Fechas y números con `Intl`. Los datos de usuario nunca se traducen.

## Hogar activo

Elección por usuario y dispositivo (`qc.activeHousehold.<userId>`), validada siempre contra las pertenencias actuales.

## PWA y offline

- `vite-plugin-pwa` (Workbox `generateSW`): precache solo del app shell estático; `navigateFallback` a `index.html`. **Nunca** se cachean respuestas de Supabase en el Service Worker.
- Actualizaciones con aviso (`registerType: prompt`) para no recargar en mitad de una acción; comprobación horaria.
- Pendiente (P0, §97–§101): persistencia de la caché de consultas en IndexedDB aislada por usuario y hogar, y outbox de mutaciones (marcar comprado / añadir producto) con IDs idempotentes, reintentos y resolución de conflictos documentada. Se implementará junto con la lista de compra.

## Sincronización y conflictos

TanStack Query con invalidación tras mutaciones y refetch al recuperar foco. Realtime se usará en listas de compra. Estrategia de conflictos de compra: se documentará con el módulo de compra (ADR).
