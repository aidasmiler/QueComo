# 0007 · Catálogos de recetas, equipamiento del hogar e historial de cocinado

- Estado: propuesta (pendiente de validación de Aída con su PR)
- Fecha: 2026-11-27

## Contexto

Aída pidió categorías y etiquetas con catálogo común y personalizado, un catálogo de utensilios, el equipamiento de cada hogar para saber qué recetas se pueden preparar (con métodos alternativos como Lékué u horno), etiquetas automáticas, filtros por duración e historial de cocinado con estimaciones de tiempo. Gestionar catálogos es cosa de quien administra el hogar; usarlos, de todos.

## Decisión

1. **Catálogos globales en tablas de solo lectura** (`category_definitions`, `tag_definitions`, `utensil_definitions`) con identificador de texto estable (`fish_seafood`, `silicone_steam_case`…). Los nombres de la interfaz salen de i18n (`catalog.json`) por identificador; las columnas `name_es/name_en` sirven para validar duplicados en SQL.
2. **Elementos propios por hogar** (`recipe_categories` ampliada con icono y color, `household_tags`, `household_utensils`) y **ocultación** de globales (`household_hidden_items`), que no borra enlaces.
3. **Referencia «global o propio»** en cada enlace: dos columnas con `num_nonnulls(...) = 1`, índices únicos parciales y FK compuesta `(id, household_id)` para que un elemento propio solo se pueda enlazar desde su hogar.
4. **Permisos en RLS, no solo en la interfaz**: miembros leen; solo propietarios (`is_household_owner`) crean, editan, borran u ocultan. Equipamiento disponible: cualquier miembro. Al transferir la propiedad, los permisos cambian con el rol.
5. **Equipamiento de receta con tres estados** (`unspecified`, `none`, `defined`) y **métodos explícitos** (`recipe_methods` + `recipe_method_utensils`, hasta 5 métodos y 20 utensilios). Una receta se puede preparar si el hogar tiene todos los utensilios de al menos un método. No se infieren alternativas.
6. **Nada se oculta sin información**: hasta que el hogar configura su cocina (`household_kitchen`), ninguna receta se filtra por equipamiento. Por defecto se muestran «Puedo prepararla» y «Sin información».
7. **Etiquetas automáticas calculadas, nunca guardadas** (`src/domain/recipes/auto-tags.ts`): Muy rápida ≤ 15, Rápida 16–30, Poco tiempo activo ≤ 15, Fácil, Air fryer, Sin horno. Sin dato, no hay etiqueta.
8. **Historial voluntario** (`recipe_cook_logs`): el hogar lo lee y cada persona escribe solo lo suyo. Estimación: mediana personal con ≥ 3 registros, si no la del hogar con ≥ 3, si no el tiempo de la receta; total y activo se eligen por separado y no se escalan por raciones. Columnas `source`, `started_at` y `finished_at` preparadas para el futuro temporizador del modo cocina.
9. **Migración de datos sin pérdida**: categorías propias con el mismo nombre que una global se reenlazan a la global; las etiquetas de texto (`recipes.tags`) se convierten en enlaces a globales o en etiquetas propias del hogar, y el array original se conserva.

## Consecuencias

- Las categorías propias que antes podía crear cualquier miembro ahora solo las crea el propietario (cambio de permisos pedido expresamente).
- Las estimaciones se calculan en el cliente con todos los registros del hogar: suficiente para un uso familiar; si crece, se moverá a una vista agregada.
- Los textos de etiquetas antiguos que equivalen a etiquetas automáticas («rápida», «fácil»…) no se convierten: ahora se calculan.
