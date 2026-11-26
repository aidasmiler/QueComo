# Problemas conocidos y soluciones

### La app muestra «Missing VITE_SUPABASE_URL…»

Falta `.env.local` (local) o el contexto de Netlify no tiene variables. En producción es lo esperado hasta crear el proyecto Supabase de producción.

### `npm ci` falla con «Unsupported engine» o React Router no arranca

Node < 22.22. Actualiza Node (Windows: instalador oficial o `winget upgrade OpenJS.NodeJS.LTS`).

### Registro: «Email address not authorized» o no llega el correo

El SMTP por defecto de Supabase solo envía a miembros de la organización y con un límite muy bajo por hora. En el proyecto de pruebas, desactiva _Confirm email_; para producción hay que configurar un SMTP propio.

### El enlace de confirmación lleva a otra web o falla

Añade la URL (incluidas `https://*--quecomo-app.netlify.app/**` y `http://localhost:5173/**`) en Supabase → Authentication → URL Configuration. Abre el enlace en el mismo navegador donde te registraste (flujo PKCE).

### MSYS2 cambia las rutas al usar Docker o la CLI de Supabase

Antepón `MSYS_NO_PATHCONV=1` al comando. Ver `LOCAL_SETUP.md`.

### Ramas basadas en un historial antiguo (Expo)

`main` se reinició con un commit inicial nuevo. Algunos clones conservan un `main` local antiguo con el proyecto Expo: crea siempre las ramas desde `origin/main` tras `git fetch`.

### La PWA no muestra los cambios nuevos

Aparece el aviso «Hay una versión nueva»: pulsa **Actualizar**. Si no, cierra todas las pestañas de la app y vuelve a abrirla.

### Herramientas de escritura del MCP de Supabase se quedan colgadas

El diálogo de aprobación no se muestra en la app de Aída. Aplica el SQL desde el SQL Editor o con la CLI (`supabase db push`) con un token.
