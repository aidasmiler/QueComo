# Instalación local

## Entornos distintos, instrucciones distintas

| Entorno                | Sistema                             | Notas                                                        |
| ---------------------- | ----------------------------------- | ------------------------------------------------------------ |
| Local de Aída          | Windows + **MSYS2** (no WSL)        | Este documento.                                              |
| Claude Code en la nube | Linux de Anthropic, sin Docker      | Supabase local no disponible: se usa el proyecto de pruebas. |
| GitHub Actions         | Ubuntu 24.04                        | `.github/workflows/ci.yml`.                                  |
| Netlify                | Imagen de build de Netlify, Node 22 | `netlify.toml`.                                              |

MSYS2 es solo el terminal de trabajo: la aplicación y los scripts no dependen de él (todos los scripts son npm/Node).

## Windows + MSYS2

### 1. Comprueba el entorno

```bash
echo $MSYSTEM        # UCRT64 recomendado (también MINGW64). Si dice MSYS, abre la terminal "MSYS2 UCRT64".
echo $SHELL; uname -a
which node npm git   # deben apuntar a instalaciones de Windows, p. ej. /c/Program Files/nodejs/node
node -v              # >= 22.22
```

- Usa **Node.js para Windows** (instalador oficial o `winget install OpenJS.NodeJS.LTS`), no el paquete `mingw-w64-*-nodejs` de pacman, para no tener dos Node distintos. Si `which -a node` muestra dos, deja el de Windows primero en el `PATH`.
- No instales nada con `apt`/`sudo` (no existen en MSYS2) ni actives WSL.
- No hace falta cambiar tu configuración global de Git, Zsh, SSH ni MSYS2. Si Git convierte finales de línea, `.gitattributes` del repo ya fuerza LF.

### 2. Clona e instala

```bash
cd /c/Users/<tu-usuario>/dev        # ruta POSIX de MSYS2 equivalente a C:\Users\<tu-usuario>\dev
git clone https://github.com/aidasmiler/QueComo.git
cd QueComo
npm ci
```

### 3. Variables de entorno

```bash
cp .env.example .env.local
```

Rellena `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` con los del proyecto **de pruebas** (Supabase → Project Settings → API Keys → _Publishable key_). Nunca uses claves `service_role`/`secret` en el frontend.

### 4. Ejecuta

```bash
npm run dev          # http://localhost:5173
npm run check        # lint + formato + tipos + traducciones + unit
npm run build && npm run preview
```

Para registrarte en local contra el proyecto de pruebas, `http://localhost:5173/**` debe estar en _Authentication → URL Configuration → Redirect URLs_ (ya documentado en `docs/deployment/SUPABASE.md`).

### 5. Playwright

```bash
npx playwright install chromium   # descarga el navegador en %LOCALAPPDATA%\ms-playwright
npm run test:e2e
```

### 6. Supabase local (opcional, requiere Docker Desktop)

Comprueba primero que Docker funciona realmente:

```bash
docker version && docker run --rm hello-world
```

Si funciona:

```bash
npm run db:start     # arranca Supabase en Docker y aplica supabase/migrations
npm run db:reset     # SOLO local: se niega a ejecutarse contra proyectos remotos
npm run db:types
npm run db:stop
```

Usa entonces en `.env.local` la URL y la _publishable key_ que imprime `npx supabase status`.

**Conversión de rutas de MSYS2:** MSYS2 convierte argumentos que parecen rutas POSIX (`/algo`) al llamar a programas nativos de Windows como `docker.exe`. Si un comando de Docker o de la CLI de Supabase recibe rutas raras (`C:/Program Files/Git/...`), ejecútalo con `MSYS_NO_PATHCONV=1` delante, p. ej. `MSYS_NO_PATHCONV=1 docker run -v /data:/data ...`. Los scripts npm del proyecto no necesitan esto.

Si Docker no funciona, no pasa nada: trabaja contra el proyecto de pruebas remoto.

## macOS / Linux

Igual que arriba sin las particularidades de MSYS2 (Node 22.22+ con nvm/fnm o el instalador oficial).
