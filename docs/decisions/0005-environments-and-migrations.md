# 0005 · Entornos, previews y migraciones

**Contexto.** §82: previews nunca contra producción; 2 proyectos Supabase gratuitos (pruebas y producción). Docker no está disponible en Claude Code en la nube y puede no estarlo en Windows. Las herramientas de escritura del MCP de Supabase no pueden aprobarse desde la app de Aída.

**Decisión.**

- Proyecto `hbdcxaynxkaidqdsqdqv` = **pruebas** (previews, CI, tests de integración, usuarios ficticios). Producción será otro proyecto.
- URL y clave publicable (públicas) versionadas en `netlify.toml` por contexto: `deploy-preview` y `branch-deploy` → pruebas; `production` → sin configurar hasta que exista el proyecto de producción (la app muestra la pantalla de configuración ausente en vez de conectarse a pruebas).
- Migraciones: SQL versionado en `supabase/migrations/`, solo aditivas mientras compartamos un backend de pruebas entre PRs. Se aplican al proyecto de pruebas al abrir la PR (SQL Editor o CLI con token) y a producción solo tras aprobar y fusionar.
- Si una PR necesita un cambio incompatible, se coordina su validación antes de aplicar otras migraciones (o se evalúa Supabase Branching si es gratuito).

**Consecuencias.** Varias PR abiertas comparten esquema de pruebas: las migraciones deben ser compatibles hacia atrás.
