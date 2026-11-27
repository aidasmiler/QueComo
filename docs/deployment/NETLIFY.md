# Netlify

- Proyecto: **quecomo-app** (equipo `aidasmiler`, plan Free) · https://app.netlify.com/projects/quecomo-app
- URL de producción prevista: https://quecomo-app.netlify.app (rama `main`).
- Deploy Previews: una por Pull Request, `https://deploy-preview-<n>--quecomo-app.netlify.app`. Branch deploys: `https://<rama>--quecomo-app.netlify.app`.

## Configuración versionada (`netlify.toml`)

- Build `npm run build`, publicación `dist`, Node 22.
- Variables por contexto: previews/branch deploys → Supabase de **pruebas**; producción → proyecto de producción (pendiente).
- Redirección SPA `/* → /index.html 200`.
- Cabeceras: CSP (`connect-src` solo a `*.supabase.co`), HSTS, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`; caché inmutable en `/assets/*`; `no-cache` en `index.html` y `sw.js` para que las actualizaciones lleguen.

## Conexión con GitHub (manual, una vez)

Project configuration → Build & deploy → _Link repository_ → GitHub → `aidasmiler/QueComo`; rama de producción `main` (lo único que pide el asistente de enlace). Las Deploy Previews para PR vienen activadas por defecto; los ajustes están después en Project configuration → Build & deploy → Continuous deployment → _Branches and deploy contexts_ → _Configure_. Branch deploys no son necesarios. Netlify publica el enlace de la preview como check/comentario en la PR.

## Protección de previews

El proyecto se creó con _Visitor access → Netlify team login_ para todos los despliegues: solo personas del equipo de Netlify pueden abrir previews. **Antes de abrir producción a la familia** hay que limitar esa protección a _non-production deploys_ (o desactivarla en producción), si no nadie de fuera del equipo podrá entrar.

## Publicación y rollback

- Producción se publica solo al fusionar en `main` (tras CI verde y aprobación de la Product Owner).
- Rollback de frontend: Deploys → elegir un deploy anterior → _Publish deploy_. **No revierte migraciones de base de datos**: las migraciones deben ser compatibles hacia atrás.

## Costes y límites

Plan gratuito. Antes de producción: revisar en _Team → Usage_ los créditos/minutos de build, ancho de banda y despliegues, y activar avisos de consumo si están disponibles. No activar recargas ni planes de pago sin autorización. Cada push a una PR consume un build: agrupar commits.

## Migrar a otro proveedor

El frontend es estático: `npm run build` y servir `dist/` con (1) fallback de cualquier ruta a `index.html`, (2) las cabeceras de `netlify.toml`, (3) `no-cache` para `index.html`/`sw.js`. Añadir la nueva URL a Supabase → Auth → Redirect URLs.
