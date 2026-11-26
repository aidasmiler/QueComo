# QuéComo

Aplicación web instalable (PWA) para organizar la alimentación de casa: recetas, menú semanal, lista de la compra compartida y cocina, entre varias personas y hogares.

> Beta privada familiar en desarrollo. Estado actual: [`docs/STATUS.md`](docs/STATUS.md). Requisitos: [`docs/PRODUCT_SPEC.md`](docs/PRODUCT_SPEC.md).

## Stack

React 19 · TypeScript (strict) · Vite 8 · React Router · Tailwind CSS 4 · Radix UI · TanStack Query · React Hook Form + Zod · i18next (es-ES / en-GB) · vite-plugin-pwa · Supabase (PostgreSQL, Auth, Storage, Realtime) · Netlify · Vitest · Playwright · GitHub Actions.

## Requisitos

- Node.js **22.22 o superior** (22 LTS o 24 LTS) y npm 10+.
- Opcional: Docker Desktop para Supabase local. Sin Docker se usa el proyecto Supabase de **pruebas**.

## Puesta en marcha

```bash
npm ci
cp .env.example .env.local   # rellena URL y publishable key del Supabase de pruebas
npm run dev                  # http://localhost:5173
```

Guía completa (incluida Windows + MSYS2): [`docs/development/LOCAL_SETUP.md`](docs/development/LOCAL_SETUP.md).

## Variables de entorno

| Variable                        | Uso                                                                       |
| ------------------------------- | ------------------------------------------------------------------------- |
| `VITE_SUPABASE_URL`             | URL del proyecto Supabase (pública).                                      |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Clave publicable (pública; la seguridad la aplica RLS).                   |
| `VITE_APP_ENV`                  | `local`, `preview` o `production` (solo muestra una etiqueta de entorno). |

Ningún secreto va en variables `VITE_*`.

## Scripts

| Comando                                                  | Qué hace                                                            |
| -------------------------------------------------------- | ------------------------------------------------------------------- |
| `npm run dev`                                            | Servidor de desarrollo.                                             |
| `npm run check`                                          | Lint, formato, tipos, traducciones y tests unitarios.               |
| `npm run test`                                           | Tests unitarios (Vitest).                                           |
| `npm run test:e2e`                                       | Tests end-to-end (Playwright) sobre un build local.                 |
| `npm run test:integration`                               | Tests de seguridad RLS contra el Supabase de pruebas.               |
| `npm run build`                                          | Build de producción en `dist/`.                                     |
| `npm run db:start` / `db:stop` / `db:reset` / `db:types` | Supabase local (Docker). `db:reset` se niega a tocar bases remotas. |

## Despliegue

Netlify construye cada Pull Request (Deploy Preview, conectado al Supabase de pruebas) y `main` (producción). Ver [`docs/deployment/NETLIFY.md`](docs/deployment/NETLIFY.md), [`docs/deployment/SUPABASE.md`](docs/deployment/SUPABASE.md) y [`docs/deployment/ENVIRONMENTS.md`](docs/deployment/ENVIRONMENTS.md).

## Documentación

- Producto: [`docs/PRODUCT.md`](docs/PRODUCT.md) · Hoja de ruta: [`docs/ROADMAP.md`](docs/ROADMAP.md)
- Técnica: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) · [`docs/DESIGN.md`](docs/DESIGN.md) · [`docs/decisions/`](docs/decisions)
- Desarrollo: [`docs/development/`](docs/development) · Despliegue: [`docs/deployment/`](docs/deployment)
- Guías de usuario: [`docs/user-guide/`](docs/user-guide)
