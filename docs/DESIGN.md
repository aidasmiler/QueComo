# Diseño

## Identidad

Cálida, editorial y doméstica; nada de panel de administración. Referencias visuales en `docs/references/` (solo inspiración: no se copian interfaces).

- **Wordmark**: «Qué» en verde oliva + «Como» en terracota, tipografía Fraunces.
- **Icono**: cuenco crema sobre cuadrado oliva con un vapor terracota en forma de interrogación (`public/favicon.svg`). Los PNG de la PWA se generan con `node scripts/generate-icons.mjs`.

## Tokens (`src/styles/index.css`)

| Token                | Valor                       | Uso                                                                   |
| -------------------- | --------------------------- | --------------------------------------------------------------------- |
| `primary`            | oliva `#50634A`             | Acciones principales, navegación activa (contraste 6,9:1 sobre crema) |
| `primary-soft`       | salvia `#DDE5D5`            | Fondos de selección, chips                                            |
| `bg` / `surface`     | crema `#F8F5ED` / `#FDFCF8` | Fondo y tarjetas                                                      |
| `accent`             | terracota `#C47859`         | Decoración (no texto: 3,1:1)                                          |
| `accent-strong`      | `#A85D3F`                   | Texto/acciones terracota con contraste AA                             |
| `fg`                 | carbón `#292D27`            | Texto                                                                 |
| `danger` / `warning` | `#B3261E` / `#8A5A00`       | Errores y avisos (siempre con icono + texto)                          |

Radios `sm 0.5rem · md 0.875rem · lg 1.25rem · xl 1.75rem`; sombras `card` y `float`. Las pantallas no definen colores ni sombras sueltas.

## Tipografía

Fraunces Variable (títulos) + Figtree Variable (interfaz), ambas OFL, empaquetadas localmente con `@fontsource` (sin CDN, §96).

## Componentes (`src/components/ui`)

Button (primary, secondary, outline, ghost, accent, danger), Input/Textarea, Field (label + ayuda + error accesibles), Card, Dialog (bottom sheet en móvil, centrado en escritorio), ConfirmDialog, Toast (aria-live), Alert, Skeleton, EmptyState, Spinner. Se añadirán con cada módulo: tarjetas de receta y comida, filas de compra con casillas grandes, selector de raciones, selector de fecha.

## Navegación

Móvil: barra inferior; escritorio (≥1024 px): barra lateral con logo y selector de hogar. Las secciones aparecen a medida que se entregan (sin pantallas vacías): ahora Inicio y Perfil; luego Recetas, Menú y Compra. El hogar activo siempre visible arriba.

## UX y accesibilidad

Mobile-first desde 320 px, safe areas de iPhone (`pb-safe`, `pt-safe`, `viewport-fit=cover`), `100dvh`, áreas táctiles ≥ 44 px, foco visible, HTML semántico, formularios con etiquetas, `prefers-reduced-motion`, sin depender de hover ni de color como único indicador. Estados de carga, vacío, error y sin conexión en cada pantalla.
