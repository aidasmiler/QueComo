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

### Recetario (migración `20261127000000_recipes.sql`, ADR 0006)

| Tabla                   | Notas                                                                                                                                                               |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `recipes`               | Del hogar (`household_id`). Raciones base, dificultad, tiempos activo/pasivo/total (§7.2), etiquetas (`text[]`), fuente, notas y conservación, foto, `archived_at`. |
| `recipe_ingredients`    | Texto original + `quantity`/`unit`/`name` solo si el análisis es seguro; `scalable=false` para «al gusto»; `optional`; `position`.                                  |
| `recipe_steps`          | Texto y temporizador opcional; `position`.                                                                                                                          |
| `recipe_categories`     | Propias del hogar, nombre único sin distinguir mayúsculas (desde ADR 0007: solo propietarios las gestionan).                                                        |
| `recipe_category_links` | N:M con categorías globales o propias (ver ADR 0007).                                                                                                               |
| `recipe_user_state`     | Personal: favorita y valoración 1–5 por persona.                                                                                                                    |
| Storage `recipe-photos` | Bucket **privado**, ruta `<household_id>/<recipe_id>/<archivo>`; solo miembros; URLs firmadas de 1 h; 5 MB, JPEG/PNG/WebP; se reduce en el navegador.               |

Las tablas hijas llevan `household_id` con FK compuesta `(recipe_id, household_id)`, así una fila nunca puede apuntar a una receta de otro hogar. Las recetas se guardan con la RPC `save_recipe(jsonb)` (**SECURITY INVOKER**: añade validación y atomicidad, pero todo se ejecuta bajo la RLS de quien llama). El escalado vive en `src/domain/recipes/quantity.ts` (puro, con tests) y nunca modifica la receta.

### Catálogos, equipamiento e historial (migración `20261127120000_recipe_catalogs.sql`, ADR 0007)

| Tabla                                                                  | Notas                                                                                                                               |
| ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `category_definitions`, `tag_definitions`, `utensil_definitions`       | Catálogos globales (17 categorías, 15 etiquetas manuales en grupos dieta/práctico/momento, 36 utensilios). Solo lectura para todos. |
| `recipe_categories`, `household_tags`, `household_utensils`            | Elementos propios del hogar. Leen los miembros; crean, editan y borran solo propietarios. Sin duplicados con el catálogo efectivo.  |
| `household_hidden_items`                                               | Globales ocultos por hogar (solo propietarios). Ocultar no borra enlaces.                                                           |
| `recipe_category_links`, `recipe_tag_links`                            | Enlace a un global **o** a uno propio (`num_nonnulls = 1`), FK compuesta con el hogar.                                              |
| `recipes.equipment_status`, `recipe_methods`, `recipe_method_utensils` | Sin especificar / nada especial / definido con 1–5 métodos alternativos.                                                            |
| `household_utensil_availability`, `household_kitchen`                  | Lo que tiene el hogar (cualquier miembro lo cambia) y si ya lo configuró.                                                           |
| `recipe_cook_logs`                                                     | Historial: el hogar lee, cada persona escribe lo suyo. Preparado para el temporizador (`source`, `started_at`, `finished_at`).      |

La lógica pura vive en `src/domain/recipes/` (`equipment.ts`, `auto-tags.ts`, `estimates.ts`, `catalog.ts`) con pruebas unitarias; `src/features/recipes/insights.ts` la combina por receta y `recipe-filters.ts` aplica los filtros combinables. `save_recipe` acepta `categories`, `tag_links`, `equipment_status` y `methods` y sigue aceptando el formato anterior (`category_ids`).

### Clasificación inteligente (migración `20261127180000_recipe_classification.sql`, ADR 0008)

| Elemento                                                                  | Notas                                                                                                          |
| ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `keywords` en `recipe_categories`, `household_tags`, `household_utensils` | Palabras clave por hogar para el clasificador. Escriben solo propietarios (políticas de ADR 0007).             |
| `recipes.dismissed_suggestions`                                           | Sugerencias rechazadas (`category:def:pasta`…), para no volver a preseleccionarlas.                            |
| `recipe_optional_utensils`                                                | Utensilios opcionales («global o propio», FK compuesta, RLS de miembros). No cuentan para «se puede preparar». |

El motor vive en `src/domain/classification/` (puro y probado): `ClassifiableRecipe` → `RecipeClassifier.classify()` → `Suggestion[]` con confianza y motivo; `decisions.ts` gestiona preselección, aceptación y rechazo. En la interfaz, `src/features/recipes/recipe-classification-state.ts` lo conecta al formulario (debounce de 700 ms) y `recipe-classification.tsx` muestra la sección compacta. Las etiquetas deterministas siguen en `src/domain/recipes/auto-tags.ts`.

### Entrada de recetas: arquitectura común prevista (§106–§107)

Todos los métodos de creación (manual, texto pegado, dictado y, más adelante, URL/JSON-LD, OCR, redes sociales o IA) seguirán el mismo flujo, sin duplicar lógica:

```
adaptador de entrada → normalización → extracción → borrador de receta común → clasificación → formulario simplificado → save_recipe
```

- **Borrador común**: datos estructurados y/o texto libre, con origen (URL, autoría, método de importación), texto original para la revisión, campos dudosos pendientes de confirmar y sugerencias. Los datos estructurados (p. ej. JSON-LD) entran directamente, sin pasar a texto.
- **Reutilización**: `paste.ts` y `quantity.ts` para ingredientes y pasos; `ClassifiableRecipe` + `RecipeClassifier` para clasificar; el mismo esquema Zod y `save_recipe` para validar y guardar.
- Solo se implementará lo necesario en cada PR: el formulario simplificado (§106) primero y después texto completo + dictado (§107), sin botones activos para importaciones aún no disponibles.

### Planificador, productos y nutrición: modelo previsto (§108–§109, propuesta)

Propuesta para validar antes de la primera migración del planificador; no hay tablas todavía. Sigue las convenciones de ADR 0003/0007 (RLS de miembros, `household_id` en cada fila, FK compuestas, referencias «A o B» con `num_nonnulls`).

| Tabla prevista                             | Contenido y reglas                                                                                                                                                                                                                                                                                                                               |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `meal_plan_items`                          | Un elemento planificado: hogar, fecha, momento de consumo, posición y `kind` (`recipe`, `product`, `food`, `text`, `leftover`, `eating_out`). Una columna de referencia por tipo (`recipe_id`, `product_id`…) con `check` por tipo y FK compuestas. Cantidad según el tipo: raciones, envases o cantidad + unidad. Varios elementos por momento. |
| `household_products`                       | Producto del hogar (todos los miembros crean y editan): nombre, marca, supermercado, foto privada, cantidad neta + unidad, raciones por envase, tiempo, `equipment_status` + utensilios (mismo modelo que recetas), categorías/etiquetas, notas, precio, código de barras, `external_product_id` opcional.                                       |
| `external_products`                        | Caché **global y de solo lectura** de Open Food Facts por código de barras: datos normalizados, Nutri-Score, alérgenos, ingredientes, licencia/atribución, `source` y `fetched_at`. Sin datos de hogares. La escribe solo la Edge Function.                                                                                                      |
| `nutrition_facts` (o columnas por fuente)  | Valores por 100 g / 100 ml con base y unidad explícitas, estado «como se vende» / «preparado», `null` = desconocido. Origen `external` (enlazado a `external_products`) o `manual` (del hogar, sobre su producto, sin tocar el dato externo).                                                                                                    |
| `shopping_items` + `shopping_item_sources` | La compra se genera por tipo (§108.4) y guarda de qué elementos planificados viene cada línea; productos idénticos se agrupan por `product_id`; envases = ⌈raciones / raciones por envase⌉ solo si ambos datos existen.                                                                                                                          |

Lógica pura prevista en `src/domain/`: `planner/` (qué genera cada tipo), `shopping/` (agrupación y envases), `nutrition/` (por cantidad, ración, envase o fracción; sin convertir peso ↔ volumen; totales marcados como incompletos si falta algún dato). Open Food Facts entra por un adaptador `ProductInfoProvider` (llamado desde una Supabase Edge Function gratuita que identifica la app con un User-Agent propio, limita peticiones y cachea en `external_products`); la interfaz solo ve productos normalizados. Escaneo: `BarcodeDetector` donde exista y ZXing cargado bajo demanda como alternativa; siempre con entrada manual. Objetivos y consumo real serán tablas **personales** (`user_id`), no del hogar.

Pendiente (llegará con cada módulo, ver §45 de la spec): plan de comidas, listas de compra con procedencia (`shopping_item_sources`).

## Seguridad

- **RLS activo en todas las tablas** y `revoke all` a `anon`/`authenticated` con grants mínimos explícitos (por columna en `UPDATE`: no se puede cambiar `id`, `household_id`, `user_id` ni `role`).
- Lectura: miembros del hogar (`is_household_member`), perfiles propios o de personas con hogar compartido (`shares_household_with`).
- Escritura de pertenencia **solo por RPC** `SECURITY DEFINER` (`create_household`, `create_household_invitation`, `accept_household_invitation`, `revoke_household_invitation`, `leave_household`, `remove_household_member`, `transfer_household_ownership`, `delete_household`). Todas: `search_path = ''`, comprueban `auth.uid()`, rol y parámetros, bloquean filas (`for update`) cuando hay carrera, y lanzan códigos estables `QC_*` que el cliente traduce.
- Las funciones auxiliares `is_household_*` son `SECURITY DEFINER` para evitar recursión de políticas; solo revelan la pertenencia del propio usuario.
- El linter de Supabase avisa (`0029`) de que `authenticated` puede ejecutar estas funciones: es **intencionado**; cada una valida internamente.
- Regla de negocio: el último propietario no puede abandonar el hogar (`QC_LAST_OWNER`); debe transferir o eliminar.
- Invitaciones: 32 bytes aleatorios, hash SHA-256, un solo uso, caducidad y revocación validadas en servidor; aceptación transaccional.
- Pruebas: `tests/integration/rls.test.ts` usa identidades reales (sin `service_role`) contra el proyecto de pruebas (job `backend` de CI). `npm run db:verify` aplica todas las migraciones en PGlite (Postgres en WASM, sin Docker) y comprueba la RLS del recetario con dos usuarios.

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
