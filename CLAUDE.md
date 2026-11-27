# QuéComo · Instrucciones permanentes para Claude Code

QuéComo es una PWA familiar para decidir qué comer, planificar, comprar y cocinar. Product Owner: Aída. Claude actúa como Development Lead (frontend, backend, diseño, QA, seguridad, DevOps, documentación).

## Fuentes de verdad (leer al empezar cada sesión)

1. `docs/STATUS.md`: estado real, siguiente acción, bloqueos.
2. `docs/PRODUCT_SPEC.md`: requisitos (104 secciones). **Las secciones posteriores prevalecen** (§95 Netlify sustituye a Cloudflare; §97 offline es P0; §103 presupuesto 0 €; §104 Notion).
3. `docs/ARCHITECTURE.md`, `docs/DESIGN.md`, `docs/decisions/` (ADR).
4. Notion (gestión funcional): dashboard https://app.notion.com/p/424be85ada8181deb239ed5681735290 · Funcionalidades `collection://424be85a-da81-814c-9964-000bd9b91dc8` · Entregas `collection://424be85a-da81-81e5-8a7b-000b4ed05d88` · Feedback `collection://424be85a-da81-8187-af2a-000b2c81029a` · Decisiones `collection://424be85a-da81-815a-9f84-000b51419e4b`. Consultar roadmap y decisiones antes de un entregable nuevo. Si Notion falla, apuntar lo pendiente en `docs/STATUS.md`.

## Stack

React 19 + TypeScript strict + Vite 8 · React Router 8 · Tailwind CSS 4 (tokens en `src/styles/index.css`) · componentes propios estilo shadcn sobre `radix-ui` · TanStack Query · React Hook Form + Zod · i18next (`es-ES` por defecto, `en-GB`) · vite-plugin-pwa · Supabase (Postgres, Auth, Storage, Realtime) · Netlify (solo hosting estático) · Vitest · Playwright · GitHub Actions. npm con lockfile.

## Comandos

`npm ci` · `npm run dev` · `npm run check` (lint + format + types + i18n + unit) · `npm run build` · `npm run test:e2e` · `npm run test:integration` (RLS contra Supabase de **pruebas**) · `npm run db:start|db:stop|db:reset|db:types` (Supabase local, requiere Docker).

## Reglas

- Código en inglés; interfaz y documentación en español. Ningún texto de UI fuera de `src/i18n/locales/*` (siempre ambos idiomas; `npm run i18n:check`).
- Separar UI (`src/features`, `src/components`), dominio puro (`src/domain`) y acceso a datos (`features/*/api.ts`). Sin `any`, sin `ts-ignore`, sin desactivar ESLint/RLS para "arreglar" algo.
- Seguridad: RLS en todas las tablas; cambios de pertenencia/roles solo vía RPC `SECURITY DEFINER` con `search_path=''`, validación de `auth.uid()` y códigos de error `QC_*` (mapeados en `src/lib/supabase/errors.ts` y `errors.json`). Nunca `service_role` en el frontend. Las variables `VITE_*` son públicas.
- Migraciones: archivo nuevo en `supabase/migrations/` (nunca editar una ya aplicada). Las herramientas de escritura del MCP de Supabase **no funcionan** para Aída (el diálogo de aprobación no aparece): pedirle que pegue el SQL en el SQL Editor del proyecto de pruebas o usar la CLI si hay token. Nunca migraciones destructivas en producción.
- Entornos: previews y CI → Supabase de pruebas `hbdcxaynxkaidqdsqdqv`. Producción tendrá su propio proyecto. Las pruebas automáticas jamás tocan producción.
- Git: ramas cortas desde `origin/main` (no desde un `main` local antiguo). PR con la plantilla, preview real, capturas y resultados reales. **Nunca merge a `main` sin aprobación de Aída**, nunca force push.
- No declarar probado lo que no se ha ejecutado. Distinguir implementado / probado / desplegado / validado (solo Aída valida).
- 0 €/mes: solo planes gratuitos; nada de servicios de pago ni IA externa en el MVP.
- Al terminar un entregable o antes de compactar: actualizar `docs/STATUS.md`, CHANGELOG, ADR si aplica y la ficha de Notion.

## Entornos de trabajo

- Local de Aída: Windows + MSYS2 (ver `docs/development/LOCAL_SETUP.md`): scripts en Node, nada de `apt`/`sudo`, cuidado con la conversión de rutas de MSYS2.
- Claude Code en la nube: Linux sin Docker (no hay Supabase local); Chromium de Playwright preinstalado.
- CI: GitHub Actions Ubuntu. Netlify: build `npm run build`, publica `dist`.
