# 0008 · Clasificación inteligente de recetas por reglas

- Estado: propuesta (pendiente de validación de Aída con su PR)
- Fecha: 2026-11-27
- Requisitos: `docs/PRODUCT_SPEC.md` §105 (y §106–§107, que la reutilizarán)

## Contexto

Aída pidió reducir la introducción manual de categorías, etiquetas y utensilios deduciéndolos de la receta, sin IA externa ni APIs de pago (0 €/mes), con niveles de confianza, motivo de cada sugerencia, respeto de las decisiones manuales y palabras clave por hogar gestionadas por el propietario. El mismo motor debe servir después para el pegado de texto, el dictado y las importaciones (URL, JSON-LD, OCR, vídeo, IA).

## Decisión

1. **Dominio puro en `src/domain/classification/`**, sin React ni Supabase:
   - `types.ts`: `ClassifiableRecipe` (datos planos: título, descripción, ingredientes con texto/nombre/cantidad/unidad, pasos y notas), `Suggestion` (`kind`, `key`, `confidence`, `reasons[]`, `requiresConfirmation`, `alternativeTo`) y la interfaz `RecipeClassifier`. El futuro borrador de receta común (§107.5) solo tendrá que producir un `ClassifiableRecipe`; un proveedor de IA sería otro `RecipeClassifier` y `combineSuggestions` mezcla resultados.
   - `text.ts`: normalización (minúsculas, sin tildes ni signos) que **conserva las posiciones** para citar el texto original, búsqueda por **palabras completas** con plural regular y **negación** dentro de la misma frase («sin horno», «no hace falta usar el horno»; «Si no tienes horno, usa la air fryer» niega solo el horno).
   - `dictionary.ts`: diccionarios bilingües de familias de ingredientes (con su clase dietética, gluten y lactosa), platos, utensilios (con marcas: Lékué, Thermomix, minipimer…), etiquetas prácticas y de momento, y **bloqueadores** («tortilla de trigo», «papel de horno»). Gana siempre la coincidencia más larga.
   - `rules-classifier.ts`: puntos por fuente (título 3, ingrediente principal o descripción 2, pasos 1; la misma fuente no suma dos veces) → alta ≥ 3, media 2, baja 1. Ingrediente principal = ≥ 25 % del peso de los ingredientes pesados; los que se cuentan por unidades («4 huevos») nunca lo son solos. Los platos que definen la receta (postres, bebidas, salsas) anulan las categorías por ingrediente. Solo se sugieren elementos de `context.candidates` (globales no ocultos y propios del hogar con nombre + palabras clave).
   - `decisions.ts`: estado del formulario (`auto`, `accepted`, `rejected`); re-analizar solo retira lo que puso el motor; lo rechazado no se vuelve a preseleccionar.
2. **Política de confianza**: alta → preseleccionada (solo categorías y etiquetas); media → ofrecida; baja → oculta hasta pedirla. Vegetariana/Vegana: como mucho media y solo si se reconocen todos los ingredientes. Sin gluten/Sin lactosa: solo por mención explícita, como mucho media, con confirmación informada y nunca en «Aceptar todas»; un ingrediente contradictorio las baja a baja.
3. **Utensilios nunca automáticos**: el usuario elige necesario (se añade a los métodos y el equipamiento pasa a «definido» por decisión suya), alternativa (nuevo método), opcional o descartar. Las alternativas detectadas («horno o air fryer») solo se señalan.
4. **Persistencia mínima** (migración `20261127180000_recipe_classification.sql`):
   - `keywords text[]` en `recipe_categories`, `household_tags` y `household_utensils` (≤ 20). Las políticas existentes ya limitan la escritura a propietarios; se añaden solo los `grant` de columna.
   - `recipes.dismissed_suggestions text[]` (≤ 100, formato `kind:def:id` / `kind:custom:uuid` validado en `save_recipe`): lo rechazado se recuerda al editar.
   - `recipe_optional_utensils` (misma estructura «global o propio» con FK compuesta y RLS de miembros): opcionales que nunca deciden si una receta se puede preparar.
   - `save_recipe` v3: mismas claves que v2 más `dismissed_suggestions` y `optional_utensils`; si no se envían, se conservan.
   - Las sugerencias no se guardan: se recalculan. Solo lo confirmado afecta a filtros.
5. **Edición de recetas antiguas**: al abrir una receta existente se analiza pero no se preselecciona nada hasta que cambia su contenido o se pulsa «Volver a analizar».
6. **Rendimiento**: análisis con espera de 700 ms tras la última pulsación, en el cliente, sin red.

## Alternativas descartadas

- **IA externa o modelo local**: fuera del presupuesto 0 € y de §103; la interfaz `RecipeClassifier` deja la puerta abierta.
- **Guardar las sugerencias en la base de datos**: duplicaría datos derivados y quedarían obsoletas al cambiar diccionarios.
- **Campo `optional` en `recipe_method_utensils`**: obligaría a tener métodos definidos para marcar algo opcional y complicaría la regla de «se puede preparar».

## Consecuencias

- La calidad depende de los diccionarios: se amplían en `dictionary.ts` con pruebas (`tests/unit/classification.test.ts` comprueba que solo apuntan a identificadores existentes).
- Las recetas sin ingredientes reconocidos no reciben etiquetas de dieta: se prefiere no sugerir a sugerir mal.
- Requiere aplicar la migración en el proyecto de pruebas antes de que el CI con backend pase.
