# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/). Las versiones se publican al integrar en `main`.

## [Sin publicar]

### Añadido

- Base técnica: React + TypeScript + Vite, Tailwind con tokens de diseño, PWA instalable, i18n es-ES/en-GB, CI en GitHub Actions y configuración de Netlify.
- Identidad visual: logotipo, icono, favicon e iconos PWA.
- Cuentas: registro, inicio y cierre de sesión, recuperación de contraseña, sesión persistente y rutas protegidas.
- Hogares: crear, renombrar, invitar mediante enlace de un solo uso (7 días), aceptar, revocar, quitar miembros, transferir propiedad, abandonar y eliminar; hogar activo por dispositivo.
- Perfil: nombre visible, idioma persistente por usuario, preferencias alimentarias personales, guía de instalación, privacidad y ayuda integrada.
- Base de datos: perfiles, hogares, miembros, invitaciones (token con hash) y preferencias con RLS y RPC transaccionales.
