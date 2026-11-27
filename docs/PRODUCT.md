# QuéComo · Resumen operativo de producto

Resumen de trabajo de [`PRODUCT_SPEC.md`](PRODUCT_SPEC.md), que sigue siendo la fuente de verdad. Ante contradicciones prevalecen las secciones posteriores (§80–§104).

## Visión

Reducir la carga mental de la alimentación doméstica conectando: decidir qué comer → planificar → comprobar qué hay → comprar → cocinar → aprovechar. Útil sin IA ni integraciones comerciales.

## Usuarios

Aída, su pareja y su familia (beta privada). Una persona puede pertenecer a varios hogares; los miembros de un hogar pueden tener preferencias distintas (p. ej. vegetariana + no vegetariana).

## Flujo del MVP (§22)

Crear cuenta → crear hogar → invitar familiares → guardar recetas → ajustar raciones → planificar comidas → generar compra → comprar a la vez → cocinar.

## Prioridades

**P0 (lanzamiento):** autenticación, perfiles, hogares compartidos, invitaciones, recetario (ingredientes, pasos, fotos, categorías, etiquetas, favoritos, búsqueda), escalado de raciones, planificador semanal con varias preparaciones por comida, lista de compra generada + productos manuales + comprado / disponible en casa + sincronización, preferencias alimentarias, inicio, responsive, seguridad, PWA instalable, **funcionamiento offline con cola de operaciones (§97–§101)**, i18n es-ES/en-GB (§88), despliegue y pruebas críticas.

**Ampliación del recetario pedida por Aída (27/11, ADR 0007):** catálogos comunes y propios de categorías, etiquetas y utensilios gestionados solo por propietarios; equipamiento del hogar y filtrado por «puedo prepararla»; métodos alternativos; etiquetas automáticas; historial de cocinado y tiempos estimados.

**Ampliaciones del 27/11 (§105–§107):** clasificación inteligente por reglas (ADR 0008); después, formulario de recetas simplificado con «Añadir más detalles», foto antes de guardar y borradores locales; después, pegado de texto completo y dictado por voz sobre un borrador de receta común preparado para futuras importaciones. Cada una en su PR.

**Planificador con productos y nutrición (§108–§109):** el plan admite recetas, productos del hogar, alimentos sencillos, texto libre, sobras y comidas fuera; la compra depende del tipo. Productos con Open Food Facts, escaneo e información nutricional opcional. Modelo previsto en ARCHITECTURE.md; orden en ROADMAP.md.

**P1:** duplicar/archivar recetas, copiar semanas, valoraciones, filtros por tiempo, sugerencias simples, modo cocina básico, exportación, tema oscuro, importación JSON-LD.

**P2:** inventario, caducidades, calendario, batch cooking, mapa de preparación, compra inteligente, nutrición, hardware.

## Criterios de aceptación del MVP

Los de §75 de la especificación, más: disponible en español e inglés (§93), offline tras la primera sincronización (§98) y 0 €/mes de infraestructura (§103).

## Definition of Done (§59 + §93)

Implementado de extremo a extremo con datos persistentes, autorización correcta en servidor, estados de carga/error/vacío/offline, usable en móvil y escritorio, diseño coherente, ambos idiomas, pruebas proporcionadas al riesgo, documentación técnica y de usuario actualizada, preview y PR con instrucciones de validación, limitaciones documentadas. Validación funcional: solo la Product Owner.
