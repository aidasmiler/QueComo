# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/). Las versiones se publican al integrar en `main`.

## [Sin publicar]

### Añadido

- Clasificación inteligente de recetas (reglas y diccionarios es/en, sin IA): sugiere categorías, etiquetas y utensilios con confianza alta/media/baja y motivo; preselecciona solo lo muy claro; respeta lo elegido a mano y no vuelve a proponer lo descartado (se guarda con la receta). Vegetariana/Vegana solo con todos los ingredientes reconocidos; Sin gluten/Sin lactosa solo si la receta lo dice y con confirmación.
- Palabras clave por hogar en categorías, etiquetas y utensilios propios (solo propietarios, aplicado en RLS) que el clasificador reconoce.
- Utensilios opcionales en las recetas: se muestran pero nunca ocultan la receta.
- Catálogos del recetario: 17 categorías comunes con icono y color, etiquetas comunes (dieta, práctico, momento del día) y 36 utensilios; categorías, etiquetas y utensilios propios del hogar; ocultar elementos comunes. Solo quien administra el hogar los gestiona (aplicado en RLS).
- «Mi cocina»: equipamiento por hogar con búsqueda, grupos y configuración rápida (nada marcado por defecto).
- «Utensilios necesarios» en cada receta (sin especificar, nada especial o lista) con métodos alternativos; el recetario oculta por defecto lo que no podéis preparar, con «Mostrar todas», filtro automático desactivable y utensilios que faltan.
- Filtros combinables: varias categorías, etiquetas, etiquetas automáticas, utensilio concreto, tiempo total y activo.
- Etiquetas automáticas calculadas: Muy rápida, Rápida, Poco tiempo activo, Fácil, Air fryer y Sin horno.
- Historial «He cocinado esta receta» y tiempos estimados (mediana personal o del hogar con 3 o más registros).
- Recetario: crear, editar, duplicar, archivar, restaurar y eliminar recetas del hogar; ingredientes en texto libre con cantidad detectada, pasos con temporizador, tiempos activo/pasivo/total, dificultad, categorías editables, etiquetas, notas de conservación y fuente; foto privada; búsqueda y filtros (favoritas, archivadas, categoría); favoritas y valoración personales.
- Al crear una receta se empieza pegando de golpe los ingredientes y los pasos («Separar» los convierte en filas revisables); los pasos se separan por numeración («1.», «Paso 2»), párrafos o líneas. «Pegar más» en recetas existentes.
- Escalado de raciones con fracciones y decimales sin modificar la receta original; lo cualitativo («al gusto») no se escala.
- `npm run db:verify`: verificación de migraciones y RLS en PGlite, sin Docker.
- Base técnica: React + TypeScript + Vite, Tailwind con tokens de diseño, PWA instalable, i18n es-ES/en-GB, CI en GitHub Actions y configuración de Netlify.
- Identidad visual: logotipo, icono, favicon e iconos PWA.
- Cuentas: registro, inicio y cierre de sesión, recuperación de contraseña, sesión persistente y rutas protegidas.
- Hogares: crear, renombrar, invitar mediante enlace de un solo uso (7 días), aceptar, revocar, quitar miembros, transferir propiedad, abandonar y eliminar; hogar activo por dispositivo.
- Perfil: nombre visible, idioma persistente por usuario, preferencias alimentarias personales, guía de instalación, privacidad y ayuda integrada.
- Base de datos: perfiles, hogares, miembros, invitaciones (token con hash) y preferencias con RLS y RPC transaccionales.
