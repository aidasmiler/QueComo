# 0002 · Netlify como hosting estático intercambiable

**Contexto.** §95 descarta Cloudflare Pages por los bloqueos de IP asociados a LaLiga en España y elige Netlify. §96 exige no depender de funciones propietarias.

**Decisión.** Netlify solo construye (`npm run build`) y sirve `dist/` con `netlify.toml` versionado: redirección SPA, cabeceras de seguridad (CSP estricta, HSTS, `X-Frame-Options`, `nosniff`), caché inmutable de `/assets/*` y sin caché para `index.html`/`sw.js`. Deploy Previews por PR y branch deploys contra el Supabase de pruebas. Sin Netlify Functions/Identity/DB. Fuentes e iconos empaquetados localmente.

**Consecuencias.** Migrar a otro proveedor = copiar `dist/` + reglas equivalentes (ver `docs/deployment/NETLIFY.md`). La protección de previews usa el control de acceso de Netlify disponible en el plan gratuito.
