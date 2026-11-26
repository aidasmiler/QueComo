# Pruebas

| Tipo                                          | Herramienta                              | Comando                          | Dónde corre                     |
| --------------------------------------------- | ---------------------------------------- | -------------------------------- | ------------------------------- |
| Unitarias (dominio, utilidades, traducciones) | Vitest + jsdom                           | `npm run test`                   | Local, CI                       |
| Traducciones completas                        | script Node                              | `npm run i18n:check`             | Local, CI                       |
| Seguridad RLS / RPC con usuarios reales       | Vitest + supabase-js                     | `npm run test:integration`       | Local / nube contra **pruebas** |
| End-to-end públicos (sin backend)             | Playwright (Chromium móvil y escritorio) | `npm run test:e2e`               | Local, CI                       |
| End-to-end con backend                        | Playwright                               | `E2E_BACKEND=1 npm run test:e2e` | Contra **pruebas**              |

Reglas:

- Las pruebas que crean usuarios usan correos `qc-e2e-*` / `qc-it-*@example.com` y solo se ejecutan contra el proyecto de pruebas (`tests/integration` lo comprueba). Necesitan _Confirm email_ desactivado en ese proyecto.
- `E2E_BACKEND=1` usa la sintaxis de Bash; en MSYS2 funciona igual. En PowerShell: `$env:E2E_BACKEND=1; npm run test:e2e`.
- Para reutilizar un Chromium ya instalado: `PW_CHROMIUM_PATH=/ruta/a/chrome npm run test:e2e`.
- WebKit/Safari: pendiente de añadir al CI cuando haya pruebas de iOS significativas. Playwright WebKit **no** sustituye a un iPhone real.
- Usuarios de prueba: se crean y no se borran (no tenemos `service_role` en cliente). Limpieza periódica manual en el proyecto de pruebas: Authentication → Users → filtrar por `example.com`.

Los resultados reales de cada ejecución se registran en `docs/STATUS.md` y en la PR.
