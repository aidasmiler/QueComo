# Cómo contribuir

1. Parte siempre de `origin/main` actualizado: `git fetch origin && git switch -c feature/<tema> origin/main`.
2. Ramas: `feature/*`, `fix/*`, `refactor/*`, `docs/*` (las sesiones de Claude en la nube pueden usar `claude/*`). Sin rama `develop`.
3. Commits en Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`…).
4. Antes de abrir la PR: `npm run check`, `npm run build`, `npm run test:e2e` y, si hay SQL, `npm run test:integration` tras aplicar la migración al proyecto de pruebas.
5. PR con `.github/pull_request_template.md` completa: preview real, capturas, pasos para probar sin código, resultados reales.
6. Actualiza documentación técnica, guía de usuario, traducciones, `CHANGELOG.md` y `docs/STATUS.md`.
7. Solo la Product Owner aprueba el merge a `main`. Nada de force push ni de reescribir historial.

Protección de `main`: ver `docs/deployment/ENVIRONMENTS.md`.
