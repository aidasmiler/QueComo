# 0006 · Recetario: ámbito de hogar, guardado atómico y verificación sin Docker

- Estado: propuesta (pendiente de validación de Aída con el PR del recetario)
- Fecha: 2026-11-27

## Contexto

§7.3 pide recetas privadas por defecto y, a largo plazo, personales, de hogar, por enlace o públicas. El MVP (§27) necesita crear, editar, duplicar, archivar, eliminar, buscar, filtrar, favoritas, valoraciones, raciones y fotos. En la nube de Claude Code no hay Docker ni acceso de red a Supabase.

## Decisión

1. **Las recetas pertenecen a un hogar** (`household_id`) y las ven y editan todos sus miembros. Favoritas y valoraciones son **por persona** (`recipe_user_state`). La visibilidad personal/enlace/pública queda para más adelante (columna nueva, sin romper el modelo).
2. **Guardado atómico con `save_recipe(jsonb)` en modo SECURITY INVOKER**: la receta y sus ingredientes, pasos y categorías se escriben en una transacción, bajo la RLS de quien llama. Las listas hijas se reemplazan completas al editar (simple y barato con los tamaños de una receta).
3. **Ingredientes con texto libre**: se guarda siempre el texto original; cantidad y unidad solo si el análisis es inequívoco (§27, sin catálogo cerrado). Lo que no tiene cantidad no se escala.
4. **Fotos en un bucket privado** con URLs firmadas, reducidas en el navegador (máx. 1600 px, WebP/JPEG) para cuidar la cuota gratuita y eliminar metadatos EXIF.
5. **`npm run db:verify`** con PGlite (Postgres en WASM) para comprobar las migraciones y la RLS donde no hay Docker. No sustituye a las pruebas contra el proyecto de pruebas (job `backend` de CI).

## Consecuencias

- Si una persona sale del hogar, deja de ver sus recetas (son del hogar). Copiar recetas entre hogares llegará con «duplicar en otro hogar».
- Las ediciones simultáneas de la misma receta: gana la última (aceptable en el MVP; §77 sincronización se abordará con offline).
