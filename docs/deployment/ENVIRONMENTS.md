# Entornos

|                | Local                                 | Preview / validación           | Producción                          |
| -------------- | ------------------------------------- | ------------------------------ | ----------------------------------- |
| Frontend       | `npm run dev`                         | Netlify Deploy Preview por PR  | Netlify, rama `main`                |
| Backend        | Supabase local (Docker) o **pruebas** | Supabase **pruebas**           | Supabase **producción** (pendiente) |
| Datos          | Ficticios                             | Ficticios / usuarios de prueba | Reales                              |
| `VITE_APP_ENV` | `local`                               | `preview` (etiqueta visible)   | `production`                        |
| Acceso         | —                                     | Netlify team login             | Público con cuenta                  |

Reglas: las previews nunca se conectan a producción; las pruebas automáticas nunca modifican datos reales; los scripts destructivos (`db:reset`) solo funcionan en local.

## Protección de `main`

Configurar en GitHub → Settings → Branches → _Add rule_ para `main`: requerir PR, requerir checks `CI / Lint, types, translations, unit tests and build` y `CI / End-to-end`, bloquear force push y borrado. En repositorios privados del plan Free de GitHub las reglas de protección pueden no estar disponibles; en ese caso el procedimiento es: Claude nunca hace merge ni push a `main`, y Aída fusiona manualmente solo PRs con CI verde.
