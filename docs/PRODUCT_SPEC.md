QUÉCOMO — Product Requirements Document & Autonomous Development Mission
1. Contexto y organización del proyecto
Vamos a desarrollar desde cero una aplicación llamada QuéComo.

Soy la propietaria del producto, ingeniera con conocimientos de programación y arquitectura de software. Anteriormente había planteado desarrollar esta aplicación personalmente, siguiendo una planificación por sprints, pero he decidido cambiar la metodología y delegar la implementación en Claude Code.

La definición de producto y las decisiones técnicas iniciales han sido preparadas por otro asistente que actúa como Product Manager y Technical Lead del proyecto.

Tu papel es actuar como responsable principal de desarrollo, asumiendo las funciones de:

Senior full-stack developer.
Software architect.
Product designer.
UX/UI engineer.
Database engineer.
DevOps engineer.
QA engineer.
Quiero que construyas el producto, no que me enseñes paso a paso a construirlo.

No quiero trabajar por sprints, recibir tutoriales ni tener que aprobar cada decisión técnica menor. Quiero que organices internamente el trabajo, implementes las funcionalidades, ejecutes las pruebas, revises el resultado y soluciones los problemas de manera autónoma.

El objetivo inmediato es disponer de un MVP atractivo, estable y verdaderamente útil que pueda empezar a utilizar con mi pareja y mi familia desde nuestros propios teléfonos y ordenadores.

El objetivo a largo plazo es convertir QuéComo en una aplicación completa de gestión alimentaria doméstica, potencialmente comercializable.

Este documento contiene tanto los requisitos del MVP como la visión completa del producto. Debes conocer toda la visión antes de empezar a programar, pero no debes implementar todas las funcionalidades futuras inicialmente.

PARTE I — DEFINICIÓN DEL PRODUCTO
2. Visión de QuéComo
QuéComo pretende centralizar y simplificar todo el ciclo de alimentación doméstica:

Decidir qué comer → planificar → comprobar qué tenemos → comprar → cocinar → conservar → aprovechar → volver a planificar.

No queremos construir únicamente:

Un recetario.
Una aplicación de listas de la compra.
Un calendario de comidas.
Una aplicación de seguimiento nutricional.
Un inventario de alimentos.
Queremos conectar todos esos elementos para reducir la carga mental asociada a la organización de las comidas.

El producto debe ayudar a responder preguntas como:

¿Qué comemos hoy?
¿Qué podemos cocinar esta semana?
¿Qué recetas tenemos guardadas?
¿Qué recetas podemos preparar con lo que tenemos en casa?
¿Cuánto tiempo tenemos para cocinar?
¿Qué ingredientes necesitamos comprar?
¿Qué cantidades necesitamos para cada persona?
¿Qué alimentos debemos consumir antes de que caduquen?
¿Cómo podemos organizar varias comidas en una sola sesión de cocina?
¿En qué supermercados nos conviene comprar?
¿Cómo podemos reducir el desperdicio alimentario?
¿Cómo podemos organizar todo esto entre varias personas?
La aplicación debe aportar utilidad real incluso sin inteligencia artificial, integraciones comerciales o dispositivos externos.

Las funcionalidades avanzadas deben mejorar una experiencia básica que ya funcione correctamente.

3. Público objetivo
Los primeros usuarios seremos:

Yo misma.
Mi pareja.
Mi familia.
El producto debe funcionar tanto para una persona individual como para parejas, familias o compañeros de piso.

Debe ser fácil de utilizar para personas sin conocimientos técnicos.

Un mismo usuario podrá formar parte de varios hogares o espacios compartidos.

Por ejemplo:

Mi hogar personal.
Mi hogar compartido con mi pareja.
El hogar de mi familia.
No todos los miembros de un hogar tienen necesariamente los mismos gustos, restricciones, horarios o necesidades alimentarias.

Un caso importante es la convivencia de una persona vegetariana y otra que no lo es.

La aplicación debe permitir organizar comidas comunes, preparaciones compartidas y variantes individuales sin obligar a duplicar innecesariamente toda la planificación.

4. Principios de producto
Reducir la carga mental.
Ahorrar tiempo.
Facilitar la colaboración.
Reducir el desperdicio.
Priorizar la facilidad de uso.
Evitar trabajo manual repetitivo.
Permitir que el usuario mantenga el control.
No introducir automatizaciones poco fiables.
Diseñar para el uso cotidiano.
Mantener los costes de infraestructura reducidos.
No sacrificar seguridad por velocidad de desarrollo.
Construir funcionalidades completas antes de ampliar el alcance.
No queremos una aplicación centrada en adelgazar, contar calorías o prescribir dietas.

Los datos nutricionales podrán ser una funcionalidad complementaria, pero no el eje central del producto.

5. Estrategia de lanzamiento
La primera versión será una beta privada familiar.

Debe poder utilizarse desde:

iPhone.
Android.
Ordenadores Windows, macOS y Linux.
Tablets.
Navegadores modernos.
La distribución inicial debe realizarse mediante una Progressive Web App, accesible mediante una URL e instalable en la pantalla de inicio del dispositivo.

No quiero depender inicialmente de:

Apple App Store.
Google Play.
TestFlight.
Distribución manual de APK.
Servidores domésticos.
Suscripciones de infraestructura innecesarias.
El objetivo inicial de infraestructura es aproximarse a 0 euros mensuales mientras el volumen de usuarios sea reducido.

No contrates servicios de pago sin autorización.

Cuando la aplicación tenga uso real, podremos valorar una aplicación nativa, publicación comercial, monetización y funcionalidades adicionales.

PARTE II — VISIÓN FUNCIONAL COMPLETA
6. Módulo de usuarios y hogares
QuéComo debe tener una arquitectura multiusuario desde el principio.

Cada persona dispondrá de su propia cuenta.

Los hogares serán espacios de colaboración independientes.

Un hogar podrá contener:

Miembros.
Recetas compartidas.
Planificaciones.
Listas de compra.
Preferencias colectivas.
Inventario.
Preparaciones almacenadas.
Historial de compras.
Configuración propia.
Debe ser posible:

Crear hogares.
Invitar usuarios.
Aceptar invitaciones.
Cambiar de hogar.
Gestionar miembros.
Abandonar hogares.
Transferir la propiedad de un hogar.
Mantener datos personales separados de los compartidos.
Los permisos deben estar correctamente definidos y aplicados en servidor.

Las preferencias personales y los favoritos serán individuales.

Los datos operativos del hogar podrán compartirse entre sus miembros.

7. Módulo de recetas
El recetario será una de las bases del producto.

Queremos centralizar recetas que actualmente pueden estar repartidas entre:

Páginas web.
Redes sociales.
Vídeos.
Notas.
Capturas de pantalla.
Libros.
Recetas familiares.
Documentos personales.
Cada receta podrá incluir:

Nombre.
Descripción.
Fotografía principal.
Fotografías adicionales en el futuro.
Raciones base.
Ingredientes.
Cantidades.
Unidades.
Pasos de elaboración.
Categorías.
Etiquetas.
Dificultad.
Tiempo de preparación.
Tiempo de cocción.
Tiempo activo.
Tiempo pasivo.
Tiempo total.
Fuente original.
Autor.
Notas personales.
Valoración personal.
Favoritos.
Información nutricional opcional.
Indicaciones de conservación.
Indicaciones de congelación.
Indicaciones de recalentamiento.
La aplicación permitirá:

Crear.
Editar.
Duplicar.
Archivar.
Restaurar.
Eliminar.
Buscar.
Filtrar.
Clasificar.
Compartir.
Planificar.
Añadir ingredientes a la compra.
Consultar durante la preparación.
Las categorías deben ser editables y permitir categorías personalizadas.

Los usuarios podrán marcar recetas favoritas o recetas que desean cocinar con mayor frecuencia.

7.1. Escalado de raciones
La receta conservará sus cantidades originales.

Cuando se modifique el número de comensales, las cantidades se recalcularán proporcionalmente:

adjustedQuantity = baseQuantity × targetServings / baseServings

Ejemplo:

Receta original para cuatro personas:

400 g de arroz.
2 cebollas.
600 ml de caldo.
Para dos personas:

200 g de arroz.
1 cebolla.
300 ml de caldo.
Para seis personas:

600 g de arroz.
3 cebollas.
900 ml de caldo.
El escalado no debe modificar la receta original.

Se deben admitir decimales y fracciones.

Las cantidades cualitativas como «al gusto» no se escalarán automáticamente.

No debe asumirse que tiempos de cocción, temperatura o tamaño de recipientes escalan linealmente con las raciones.

7.2. Tiempos de preparación
Es importante diferenciar:

Tiempo activo de preparación.
Tiempo activo de cocción.
Tiempo pasivo.
Tiempo total.
Una receta que tarda 45 minutos, pero requiere solo 10 minutos de trabajo y 35 minutos de horno, no debe tratarse igual que una receta de 30 minutos que exige atención continua.

El modelo debe permitir representar esta diferencia desde el MVP, aunque las recomendaciones avanzadas se implementen después.

7.3. Visibilidad y compartición
Las recetas serán privadas por defecto dentro de su ámbito correspondiente.

A largo plazo podrán existir:

Recetas personales.
Recetas compartidas con un hogar.
Recetas compartidas mediante enlace privado.
Recetas públicas.
Recetas duplicables por otros usuarios.
Los enlaces compartidos deberán ser revocables.

No se publicarán automáticamente recetas importadas desde terceros.

8. Importación de recetas
La introducción manual de recetas puede convertirse en una barrera de uso. Por ello, la importación será una de las primeras ampliaciones importantes.

8.1. Importación desde URL
El usuario pegará la URL de una página web que contiene una receta.

El sistema intentará extraer:

Título.
Descripción.
Imagen.
Ingredientes.
Cantidades.
Unidades.
Raciones.
Instrucciones.
Tiempos.
Categorías.
Información nutricional disponible.
La estrategia inicial será:

Buscar datos estructurados Schema.org Recipe.
Analizar JSON-LD.
Procesar otros formatos estructurados compatibles.
Utilizar extracción HTML como fallback limitado.
Conservar la URL original.
Mostrar una pantalla de revisión.
Permitir corregir cualquier dato.
Guardar únicamente después de la confirmación.
No prometas compatibilidad universal.

No eludas paywalls, bloqueos técnicos ni restricciones de acceso.

Respeta los derechos sobre imágenes y textos.

8.2. Importación asíncrona
La experiencia futura debe permitir que el usuario:

Pegue una URL.
Inicie una importación.
Continúe utilizando la aplicación.
Inicie otras importaciones.
Cierre la aplicación.
Vuelva posteriormente para revisar el resultado.
El procesamiento no dependerá de que el navegador permanezca abierto.

Estados previstos:

queued
fetching
extracting
normalizing
needs_review
completed
failed
Existirá una bandeja de importaciones.

Los trabajos deberán tener:

Identificador.
Usuario.
Hogar cuando corresponda.
URL.
Tipo de fuente.
Estado.
Progreso.
Intentos.
Errores.
Timestamps.
Resultado.
Receta asociada.
Debe existir idempotencia, posibilidad de reintento y tratamiento de errores.

En futuras versiones podrán incorporarse colas y workers independientes.

8.3. Otras fuentes futuras
Texto copiado.
Fotografías de recetas.
Capturas de pantalla.
Documentos PDF.
Recetas de libros.
Vídeos.
Redes sociales cuando sea técnicamente viable y esté permitido.
Compartición desde otras aplicaciones.
Asistencia mediante inteligencia artificial.
Toda extracción incierta debe poder revisarse manualmente.

9. Planificador de comidas
El planificador debe permitir organizar la alimentación durante un intervalo de tiempo.

La vista principal será semanal.

Debe admitir:

Desayuno.
Comida.
Merienda.
Cena.
Otros momentos configurables en el futuro.
Cada comida podrá contener varias preparaciones.

Por ejemplo, una cena para dos personas:

Pasta con verduras para dos.
Pollo a la plancha para una.
Tofu a la plancha para una.
Cada preparación tendrá sus propias raciones.

Se podrá:

Añadir recetas.
Añadir texto libre.
Cambiar raciones.
Mover comidas.
Copiar comidas.
Repetir recetas.
Eliminar entradas.
Navegar entre semanas.
Consultar semanas anteriores.
Crear plantillas.
Copiar semanas.
Planificar comidas individuales.
Planificar comidas compartidas.
El calendario no debe limitarse a una única receta por día o franja.

En el futuro deberá permitir asociar comensales concretos, utilizar preparaciones almacenadas y gestionar sobras.

La planificación no debe modificar automáticamente el recetario original.

10. Lista de la compra
La lista de la compra debe ser una consecuencia natural de la planificación.

El usuario podrá seleccionar un intervalo de fechas y las comidas que desea incluir.

El sistema calculará los ingredientes necesarios teniendo en cuenta las raciones planificadas.

Debe permitir:

Generar listas automáticamente.
Crear listas manuales.
Añadir productos no relacionados con recetas.
Añadir ingredientes desde una receta.
Editar cantidades.
Editar unidades.
Cambiar categorías.
Combinar elementos.
Separar elementos.
Marcar productos como comprados.
Marcar productos como disponibles en casa.
Restaurar productos.
Eliminar productos.
Consultar la procedencia de un ingrediente.
Compartir listas.
Actualizar listas en tiempo real.
10.1. Normalización y consolidación
No debemos unir ingredientes únicamente porque sus nombres sean parecidos.

Cada ingrediente debe poder conservar:

Texto original.
Nombre visible.
Nombre normalizado.
Cantidad.
Unidad original.
Unidad normalizada.
Observaciones.
Carácter opcional.
Procedencia.
Ejemplos de consolidación válida:

200 g de arroz + 300 g de arroz = 500 g de arroz.
500 g de patatas + 1 kg de patatas = 1,5 kg de patatas.
1 cebolla + 2 cebollas = 3 cebollas.
Ejemplos que no deben combinarse automáticamente:

2 tomates + 400 g de tomate.
200 g de harina + 1 taza de harina.
Leche de vaca + leche de avena.
Tomate fresco + tomate triturado.
Las equivalencias dudosas deberán mantenerse separadas o ser confirmadas por el usuario.

10.2. Familias de unidades
Masa:

mg
g
kg
Volumen:

ml
cl
l
Unidades:

unidad
paquete
lata
bote
Unidades culinarias:

cucharadita
cucharada
taza
Cantidades cualitativas:

al gusto
pizca
cantidad necesaria
No convertir masa en volumen sin una equivalencia específica y fiable.

No asumir que todos los envases tienen el mismo tamaño.

10.3. Regeneración de listas
Regenerar una lista desde el mismo menú no debe duplicar ingredientes.

Debe conservarse la procedencia de las cantidades generadas.

Deben diferenciarse:

Productos manuales.
Cantidades generadas automáticamente.
Correcciones manuales.
Productos comprados.
Productos disponibles en casa.
Cuando cambie una planificación, la lista deberá poder actualizarse de manera segura.

No deben desaparecer productos manuales.

No deben perderse correcciones sin aviso.

Si una modificación afecta a productos ya comprados, deberá existir una estrategia clara para mostrar las cantidades pendientes o solicitar revisión.

La generación y regeneración deben ser idempotentes y transaccionales cuando corresponda.

11. Inventario doméstico
Este módulo se implementará después del MVP.

El inventario representará los alimentos y preparaciones disponibles en casa.

Podrá organizarse por:

Despensa.
Nevera.
Congelador.
Otras ubicaciones configurables.
Cada producto podrá incluir:

Nombre.
Ingrediente canónico asociado.
Producto comercial asociado.
Cantidad.
Unidad.
Ubicación.
Fecha de compra.
Fecha de apertura.
Fecha de caducidad.
Fecha de consumo preferente.
Fuente de la fecha.
Confianza de reconocimiento.
Observaciones.
Se permitirá:

Añadir productos manualmente.
Incorporar productos desde una compra.
Modificar cantidades.
Registrar consumo.
Registrar productos descartados.
Mover productos entre ubicaciones.
Registrar sobras.
Registrar preparaciones cocinadas.
Consultar disponibilidad.
La aplicación deberá distinguir productos iguales con diferentes fechas de caducidad mediante lotes cuando resulte necesario.

El inventario debe conectarse con el planificador y la compra.

Flujo:

Se planifican recetas.
Se calculan ingredientes necesarios.
Se consulta el inventario.
Se descuentan las cantidades disponibles de las necesidades.
Se genera la compra restante.
Se registran los productos adquiridos.
Se actualiza el inventario cuando se cocina.
No se descontarán automáticamente cantidades del inventario únicamente por haber planificado una receta.

La planificación representa una intención; el consumo representa una acción realizada.

12. Caducidades y reducción del desperdicio
El inventario permitirá conocer qué alimentos deben consumirse próximamente.

Funcionalidades futuras:

Alertas configurables.
Vista «Consumir pronto».
Productos caducados.
Productos próximos a caducar.
Recomendaciones de recetas.
Priorización de alimentos abiertos.
Aprovechamiento de sobras.
Historial de desperdicio.
Sugerencias de congelación cuando proceda.
Ejemplos:

Tienes cuatro yogures que caducan en dos días.
Tienes calabacín que deberías consumir pronto.
Estas cinco recetas utilizan ingredientes próximos a caducar.
Puedes preparar esta cena utilizando tres alimentos que ya tienes.
Diferencia entre fecha de caducidad y consumo preferente.

No realices afirmaciones de seguridad alimentaria que no puedan garantizarse.

Las fechas estimadas deberán identificarse como estimaciones.

13. Planificación según tiempo disponible
Una de las funcionalidades diferenciales será adaptar la alimentación a la disponibilidad real del usuario.

Las recetas deberán poder filtrarse por:

Tiempo total.
Tiempo activo.
Tiempo pasivo.
Dificultad.
Nivel de atención.
Posibilidad de preparación anticipada.
Compatibilidad con batch cooking.
Posibilidad de recalentar.
Utensilios necesarios.
Ejemplos:

Recetas listas en menos de 15 minutos.
Recetas con menos de 10 minutos de trabajo activo.
Recetas que pueden dejarse preparadas.
Recetas que utilizan una sola olla.
Cenas rápidas para días de entrenamiento.
El usuario podrá establecer manualmente el tiempo disponible para cocinar en cada día o franja.

13.1. Integración con calendarios
En el futuro se podrá integrar con Google Calendar y otros proveedores compatibles.

La integración tendrá dos direcciones independientes:

Leer disponibilidad.
Crear bloques de cocina opcionales.
Ejemplo:

El miércoles llego a casa a las 20:15 y tengo otro compromiso a las 21:30. Configuro un máximo de 35 minutos para preparar la cena.

QuéComo podrá sugerir:

Recetas listas en menos de 30 minutos.
Recetas de poco tiempo activo.
Comidas preparadas previamente.
Preparaciones que se puedan recalentar.
La aplicación no debe asumir que cualquier hueco libre es tiempo disponible para cocinar.

El usuario podrá definir:

Calendarios autorizados.
Horarios habituales de comida.
Márgenes entre eventos.
Tiempo máximo deseado.
Días con mayor disponibilidad.
Permisos para crear eventos.
La lectura del calendario debe realizarse con mínimo privilegio y consentimiento explícito.

No se necesita almacenar títulos o detalles de eventos si únicamente se requiere calcular disponibilidad.

No se modificarán calendarios sin confirmación.

14. Recomendaciones inteligentes
A largo plazo, QuéComo podrá sugerir recetas y menús teniendo en cuenta:

Preferencias individuales.
Restricciones.
Recetas favoritas.
Historial.
Inventario.
Caducidades.
Tiempo disponible.
Coste.
Dificultad.
Planificación existente.
Preparaciones almacenadas.
Variedad.
Estacionalidad.
No es necesario utilizar IA generativa para resolver estas recomendaciones.

Empieza con reglas deterministas, explicables y comprobables.

La inteligencia artificial podrá incorporarse posteriormente donde aporte valor real.

El usuario deberá poder entender por qué se recomienda una receta.

Ejemplo:

«Esta receta requiere 12 minutos de trabajo activo, utiliza dos ingredientes que ya tienes y aprovecha un alimento próximo a caducar».

Las recomendaciones nunca deben modificar el plan automáticamente sin consentimiento.

15. Modo cocina
La aplicación debe poder utilizarse cómodamente mientras se cocina.

Una receta podrá tener varias representaciones.

Vista tradicional
Ingredientes.
Cantidades ajustadas.
Pasos.
Tiempos.
Notas.
Modo guiado
Un paso cada vez.
Texto grande.
Paso anterior y siguiente.
Progreso.
Ingredientes accesibles.
Temporizadores.
Mantener pantalla activa cuando la plataforma lo permita.
Sesión persistente.
Recuperación del progreso.
Consulta sin conexión de recetas descargadas.
Los temporizadores deben calcularse utilizando una hora objetivo, no únicamente decrementando un contador en memoria.

Así podrán recuperarse correctamente al volver a abrir la aplicación.

No se debe prometer que las alarmas funcionarán siempre en segundo plano si el sistema operativo o navegador no lo garantiza.

16. Mapa visual de preparación de recetas
Esta es una funcionalidad diferencial importante del producto futuro.

No se trata de un mapa de la despensa.

Queremos representar visualmente el proceso de elaboración de una receta mediante un diagrama propio de acciones, ingredientes, dependencias y preparaciones intermedias.

La misma receta podrá visualizarse:

Como receta tradicional.
Como instrucciones paso a paso.
Como mapa visual del proceso de cocina.
El mapa debe permitir entender:

Cuándo se incorpora cada ingrediente.
Qué ingredientes se utilizan en cada acción.
Qué acciones dependen de otras.
Qué acciones pueden realizarse simultáneamente.
Qué preparaciones intermedias se generan.
Cuándo se combinan las preparaciones.
Qué tiempos de espera existen.
Ejemplo conceptual:

Picar cebolla.
Sofreír cebolla.
Mientras tanto, cocer arroz.
Preparar salsa.
Combinar salsa y verduras.
Servir junto con arroz.
El modelo futuro evolucionará hacia un grafo dirigido de preparación.

Entidades conceptuales:

RecipeAction
RecipeActionIngredient
RecipeDependency
IntermediatePreparation
Cada acción podrá contener:

Descripción.
Duración.
Temperatura.
Ingredientes utilizados.
Cantidades.
Utensilios.
Dependencias.
Resultado intermedio.
El grafo deberá permitir detectar dependencias inválidas y ciclos.

La interfaz futura podrá utilizar:

Nodos.
Conexiones.
Ramas paralelas.
Agrupaciones por fases.
Temporizadores.
Acciones interactivas.
En móvil deberá existir una representación adaptada al tamaño de pantalla.

En tablet y ordenador podrá mostrarse el grafo completo.

No implementes este sistema en el MVP, pero evita que los pasos de receta queden representados únicamente como un bloque de texto indivisible.

17. Batch cooking
El objetivo es permitir preparar varias comidas en una única sesión de cocina.

No debe limitarse a etiquetar recetas como aptas para batch cooking.

17.1. Batch cooking manual
El usuario seleccionará varias recetas o comidas planificadas.

La aplicación generará:

Ingredientes totales.
Preparaciones comunes.
Orden recomendado.
Acciones paralelas.
Tiempos de horno.
Tiempos de fuego.
Recipientes necesarios.
Preparaciones que deben refrigerarse.
Preparaciones que pueden congelarse.
Indicaciones de conservación y regeneración cuando estén disponibles.
17.2. Batch cooking inteligente
La aplicación detectará oportunidades como:

Varias recetas requieren cebolla picada.
Dos recetas utilizan arroz.
Varias verduras pueden hornearse juntas.
Una salsa sirve para varias comidas.
Una preparación puede duplicarse y congelarse.
Una comida puede adelantarse porque el día previsto hay poco tiempo disponible.
Ejemplo:

El domingo puedo preparar cuatro de las cinco cenas de la semana en una sesión conjunta.

La aplicación podrá sugerir una planificación optimizada de tareas.

17.3. Grafo conjunto
El modelo de preparación visual permitirá combinar acciones de varias recetas.

Ejemplo:

Picar tres cebollas de una sola vez.
Repartirlas entre curry, sopa y salsa.
Cocer una cantidad conjunta de arroz.
Dividirla en las raciones correspondientes.
El sistema debe distinguir entre:

Compartir un ingrediente.
Compartir una acción.
Compartir una preparación intermedia.
No debe combinar acciones incompatibles únicamente porque tengan nombres similares.

17.4. Sesiones de cocina
Entidades futuras:

BatchCookingSession
BatchCookingMeal
BatchCookingTask
BatchCookingOutput
StoredPreparation
Las preparaciones resultantes podrán almacenarse en el inventario con:

Cantidad.
Raciones.
Ubicación.
Fecha de preparación.
Fecha recomendada de consumo.
Comidas a las que están destinadas.
Debe evitarse contabilizar dos veces los mismos ingredientes al planificar una preparación ya cocinada.

18. Compra inteligente
La lista de compra evolucionará hacia un optimizador de cesta.

El usuario podrá configurar:

Supermercados disponibles.
Supermercados favoritos.
Número máximo de establecimientos.
Ahorro mínimo para visitar una tienda adicional.
Preferencia de ahorro, equilibrio o calidad.
Distancia o esfuerzo de desplazamiento.
El sistema deberá optimizar la cesta completa, no elegir simplemente el supermercado más barato para cada ingrediente de forma independiente.

Ejemplo:

Comprar en tres supermercados puede ahorrar dos euros, pero generar una hora adicional de desplazamientos. No debe recomendarse automáticamente como la mejor opción.

Se podrán presentar alternativas:

Más cómoda: toda la compra en una tienda.
Recomendada: equilibrio entre precio, calidad y esfuerzo.
Precio mínimo: combinación con menor coste monetario.
18.1. Catálogo de productos
Se necesitará una capa de catálogo independiente de cada supermercado.

Entidades futuras:

Retailer
StoreLocation
CanonicalIngredient
RetailProduct
RetailProductPrice
ProductIngredientMatch
ProductQualityScore
UserRetailerPreference
Debe distinguirse entre ingrediente y producto comercial.

Ejemplo:

Ingrediente: arroz.

Productos comerciales:

Arroz redondo de una marca.
Arroz integral de otra marca.
Paquete de 500 g.
Paquete de 1 kg.
Los precios deberán normalizarse a:

Euros por kilogramo.
Euros por litro.
Euros por unidad.
La optimización debe considerar el coste real del envase que hay que comprar.

Si necesitamos 200 g de arroz, pero el supermercado solo vende paquetes de 1 kg, el coste real de adquisición es el del paquete completo.

El sobrante podrá incorporarse al inventario.

18.2. Calidad y relación calidad/precio
No se utilizará un único indicador nutricional como sinónimo de calidad.

La valoración podrá considerar:

Composición.
Ingredientes.
Información nutricional.
Origen.
Certificaciones.
Características específicas de cada categoría.
Precio.
Valoraciones.
Preferencias personales.
Se podrán desarrollar evaluadores específicos para categorías como:

Aceite de oliva.
Chocolate.
Pasta.
Tomate procesado.
Carne.
Productos vegetales.
Las recomendaciones deberán ser explicables.

18.3. Fuentes externas
La disponibilidad de catálogos y precios dependerá de APIs, acuerdos y condiciones de uso.

No implementes scraping masivo ni integraciones comerciales sin verificar su viabilidad técnica y legal.

Diseña adaptadores independientes por proveedor cuando llegue el momento.

19. Nutrición
La nutrición será complementaria.

En las primeras versiones se podrán almacenar opcionalmente:

Calorías.
Proteínas.
Carbohidratos.
Grasas.
Otros datos disponibles.
El cálculo automático llegará posteriormente.

Necesitará:

Base de datos fiable de alimentos.
Normalización de ingredientes.
Conversión de unidades.
Cantidades comestibles.
Información por producto.
Diferenciación entre alimentos crudos y cocinados cuando corresponda.
No inventes valores nutricionales.

No presentes estimaciones como valores exactos.

No conviertas QuéComo en una aplicación de dieta clínica.

20. Escaneo, OCR y dispositivo físico
A largo plazo queremos explorar la posibilidad de desarrollar un dispositivo doméstico conectado a QuéComo.

Su función principal sería facilitar el registro de productos y fechas de caducidad al llegar de la compra.

20.1. Experiencia objetivo
El usuario acerca un producto a una cámara.
El sistema lee el código de barras cuando está disponible.
Identifica el producto.
Localiza la fecha impresa.
Utiliza OCR para extraerla.
Interpreta el formato.
Solicita confirmación cuando sea necesario.
Añade el producto al inventario.
La aplicación genera avisos y recomendaciones.
Ejemplo:

«Yogur natural — caduca el 18/08. ¿Confirmar?».

20.2. Desarrollo progresivo
Primero se implementará completamente mediante software:

Introducción manual.
Cámara del teléfono.
Escaneo de código de barras.
OCR de fechas.
Confirmación.
Registro en inventario.
Solo si demuestra utilidad se desarrollará el dispositivo físico.

20.3. Posible arquitectura hardware
Cámara con enfoque cercano.
Iluminación controlada.
SBC o sistema embebido.
OCR local o backend.
Wi-Fi.
Bluetooth cuando resulte necesario.
Botón o señal de confirmación.
Carcasa.
El dispositivo se conectará a una API segura de QuéComo.

No tendrá acceso directo privilegiado a la base de datos.

Deberá existir autenticación y revocación por dispositivo.

El hardware es experimental y queda completamente fuera del MVP.

21. Monetización futura
Inicialmente no habrá pagos ni límites artificiales para la familia.

Si se valida el producto, se podrá estudiar:

Modelo freemium.
Suscripción individual.
Suscripción familiar.
Funcionalidades premium.
Importaciones ampliadas.
Inventario avanzado.
Automatizaciones.
Optimización de compras.
Integración con hardware.
No construyas billing, paywalls ni sistemas de suscripción durante el MVP.

No introduzcas funcionalidades comerciales antes de validar el uso real.

PARTE III — ALCANCE DEL MVP FAMILIAR
22. Objetivo de la primera versión
El MVP debe permitir completar este flujo real:

Crear cuenta → crear hogar → invitar familiares → guardar recetas → ajustar raciones → planificar comidas → generar compra → comprar conjuntamente → cocinar.

El producto debe funcionar con datos reales y usuarios reales.

No debe consistir en pantallas de demostración con información ficticia.

La aplicación debe poder desplegarse y utilizarse mediante una URL.

23. Prioridades
P0 — Imprescindible para lanzar
Autenticación.
Perfiles.
Hogares compartidos.
Invitaciones.
Recetario.
Ingredientes y pasos.
Fotografías.
Escalado de raciones.
Categorías y etiquetas.
Favoritos.
Búsqueda.
Planificador semanal.
Varias preparaciones por comida.
Lista de compra generada.
Productos manuales.
Marcar como comprado.
Marcar como disponible en casa.
Sincronización de compra.
Preferencias alimentarias.
Pantalla de inicio.
Diseño responsive.
Seguridad.
PWA instalable.
Despliegue.
Pruebas críticas.
P1 — Muy deseable para la primera experiencia
Duplicación de recetas.
Archivado y restauración.
Copiar semanas.
Valoraciones personales.
Filtros por tiempo activo y total.
Sugerencias simples de recetas.
Modo cocina básico.
Consulta de datos recientes sin conexión.
Exportación básica.
Tema oscuro.
Importación web básica desde JSON-LD.
Implementa estas funciones cuando el núcleo P0 sea estable.

No retrases la primera versión utilizable por una importación compleja o por automatizaciones avanzadas.

P2 — Después del MVP
Todos los módulos avanzados descritos en la visión completa.

No implementes pantallas vacías de funcionalidades futuras.

24. Autenticación
Implementa:

Registro con correo y contraseña.
Inicio de sesión.
Cierre de sesión.
Recuperación de contraseña.
Persistencia de sesión.
Protección de rutas.
Perfil con nombre visible.
Avatar opcional.
Evalúa la configuración de correo necesaria para usuarios reales.

No asumas que el proveedor de correo predeterminado de Supabase permite enviar mensajes a cualquier usuario sin restricciones.

Prepara una estrategia de autenticación viable para la beta familiar.

No desactives protecciones de seguridad de producción únicamente para facilitar el desarrollo.

25. Onboarding
El onboarding debe ser breve.

Flujo:

Crear cuenta.
Introducir nombre.
Crear un hogar o aceptar una invitación.
Configurar preferencias básicas opcionales.
Acceder a la aplicación.
El usuario individual podrá tener su propio hogar.

No obligues a completar un cuestionario largo antes de poder utilizar la aplicación.

Se podrán modificar las preferencias posteriormente.

Incluye una opción explícita para cargar algunas recetas de ejemplo, pero no mezcles automáticamente datos ficticios con datos reales.

26. Hogares del MVP
Implementa:

Crear hogar.
Editar nombre.
Consultar miembros.
Invitar miembros.
Aceptar invitaciones.
Revocar invitaciones.
Abandonar hogar.
Cambiar hogar activo.
Eliminar miembros cuando se tenga permiso.
Transferir propiedad de forma segura.
Roles iniciales:

owner
member
El último propietario no podrá abandonar un hogar sin transferir la propiedad o eliminarlo de manera explícita.

Las invitaciones deberán utilizar tokens suficientemente aleatorios, caducidad y validación en servidor.

No almacenes tokens sensibles en texto plano si pueden almacenarse mediante hash.

La aceptación de una invitación debe ser transaccional.

No permitas que un usuario se añada arbitrariamente a un hogar.

27. Recetario del MVP
Implementa un formulario cómodo y visual.

Campos obligatorios mínimos:

Título.
Raciones base.
Ingredientes.
Pasos.
Campos opcionales:

Descripción.
Fotografía.
Categorías.
Etiquetas.
Tiempo activo.
Tiempo pasivo.
Tiempo total.
Dificultad.
Notas.
URL original.
Información nutricional manual si resulta sencillo.
Permite:

Crear.
Editar.
Consultar.
Archivar o eliminar.
Buscar.
Filtrar.
Marcar como favorita.
Ajustar raciones.
Añadir al plan.
Añadir ingredientes a la compra.
La interfaz de ingredientes debe permitir añadir filas rápidamente, reordenarlas y editar sus cantidades.

No obligues a seleccionar un ingrediente de un catálogo cerrado.

Conserva el texto original y normaliza únicamente cuando sea seguro.

La vista de receta debe ser una de las pantallas visualmente más cuidadas.

28. Planificador del MVP
Implementa una vista semanal responsive.

En móvil:

Navegación sencilla entre días.
Resumen semanal.
Tarjetas de comidas.
Acciones rápidas.
En ordenador:

Cuadrícula semanal cuando el espacio lo permita.
Debe permitir:

Añadir recetas.
Añadir comidas mediante texto libre.
Añadir varias preparaciones en una misma franja.
Ajustar raciones.
Mover.
Copiar.
Eliminar.
Navegar entre semanas.
Volver a la semana actual.
Abrir una receta.
Generar la compra.
La semana comenzará el lunes.

Utiliza fechas de calendario correctamente, sin desplazamientos accidentales de día por conversiones UTC.

No dependas exclusivamente de drag and drop.

29. Compra del MVP
Implementa:

Varias listas por hogar.
Lista activa.
Generación desde un intervalo de fechas.
Selección de comidas.
Vista previa de ingredientes.
Agregación segura.
Edición manual.
Productos manuales.
Categorías.
Marcar comprado.
Marcar disponible en casa.
Ocultar comprados.
Restaurar elementos.
Sincronización en tiempo real.
Regeneración sin duplicados.
Categorías iniciales:

Frutas y verduras.
Carne y pescado.
Lácteos y huevos.
Panadería.
Cereales y legumbres.
Despensa.
Congelados.
Bebidas.
Limpieza y hogar.
Otros.
Permite corregir las categorías.

Prioriza una experiencia rápida en el supermercado.

La interfaz debe funcionar cómodamente con una sola mano.

Utiliza casillas grandes, feedback inmediato y actualización optimista cuando sea seguro.

No presentes cambios como sincronizados si han fallado.

30. Preferencias alimentarias
Cada usuario podrá configurar preferencias independientes.

Etiquetas iniciales:

Vegetariano.
Vegano.
Sin gluten.
Sin lactosa.
Rápido.
Económico.
Poca preparación.
Batch cooking.
Apto para congelar.
Se puede preparar antes.
Permite etiquetas personalizadas.

Diferencia preferencias, restricciones y etiquetas de recetas.

Las etiquetas introducidas por usuarios no constituyen una certificación de ausencia de alérgenos.

No deduzcas automáticamente que una receta es segura para una alergia.

31. Pantalla de inicio
La pantalla inicial debe responder inmediatamente a:

«¿Qué comemos hoy?».

Incluye:

Saludo.
Hogar activo.
Comidas de hoy.
Próximas comidas.
Acceso a recetas.
Resumen de compra.
Productos pendientes.
Acciones rápidas.
Recetas recientes.
Favoritos.
Sugerencias sencillas si existen datos suficientes.
Las acciones principales serán:

Planificar.
Añadir receta.
Abrir compra.
Evita dashboards llenos de estadísticas que no ayuden a tomar decisiones.

32. Perfil y configuración
Incluye:

Editar perfil.
Preferencias.
Gestión de hogares.
Miembros.
Invitaciones.
Cambio de hogar.
Configuración visual.
Información de instalación.
Privacidad.
Cierre de sesión.
Exportación o solicitud de exportación.
Eliminación de cuenta mediante un procedimiento seguro.
La eliminación de una cuenta debe respetar los datos compartidos del hogar y las responsabilidades de propiedad.

PARTE IV — DISEÑO Y EXPERIENCIA DE USUARIO
33. Dirección artística
El diseño es un requisito de producto.

No quiero una aplicación que parezca:

Un proyecto académico.
Un panel de administración.
Una plantilla genérica.
Una colección de formularios.
Una demo de componentes sin identidad.
Quiero una estética:

Moderna.
Cálida.
Acogedora.
Minimalista.
Visual.
Elegante.
Cercana.
Relacionada con la cocina y el hogar.
Referencias conceptuales:

Facilidad de uso de Apple Reminders.
Presentación visual de aplicaciones modernas de recetas.
Organización de Paprika, AnyList y Samsung Food.
Diseño editorial de aplicaciones gastronómicas.
No copies sus interfaces.

Desarrolla una identidad propia.

33.1. Paleta orientativa
Verde oliva: #50634A
Verde salvia: #DDE5D5
Crema: #F8F5ED
Terracota: #C47859
Carbón: #292D27
Utiliza esta paleta como punto de partida.

Puedes ajustarla si mejora la coherencia visual, el contraste y la accesibilidad.

33.2. Tipografía
Selecciona una tipografía contemporánea, legible y apropiada para una aplicación de alimentación.

Puedes combinar una tipografía editorial para títulos con una sans serif para la interfaz.

Evita cargar demasiadas fuentes.

Utiliza fuentes con licencia adecuada.

33.3. Componentes
Define:

Botones.
Campos.
Selectores.
Tarjetas.
Etiquetas.
Navegación.
Diálogos.
Bottom sheets.
Toasts.
Skeletons.
Estados vacíos.
Estados de error.
Checkboxes.
Selectores de raciones.
Selectores de fecha.
Tarjetas de receta.
Tarjetas de comida.
Filas de compra.
Utiliza tokens de diseño centralizados.

No definas colores, sombras y espaciados de manera arbitraria en cada pantalla.

34. Navegación
En móvil, utiliza una navegación inferior con cinco secciones:

Inicio.
Recetas.
Menú.
Compra.
Perfil.
En escritorio, adapta la navegación a una barra lateral.

El hogar activo debe ser fácilmente identificable.

Las acciones principales deben estar accesibles con pocos toques.

Utiliza rutas y enlaces reales.

Los botones de retroceso del navegador deben funcionar correctamente.

35. Experiencia móvil
La aplicación se diseñará mobile-first.

Debe contemplar:

Safe areas de iPhone.
Barra inferior del navegador.
Teclado virtual.
Viewport dinámico.
Uso con una mano.
Áreas táctiles adecuadas.
Formularios cómodos.
Scroll natural.
Evitar desbordamientos horizontales.
Navegación inferior accesible.
Contraste.
Texto legible.
Prueba tamaños representativos desde aproximadamente 320 px de ancho hasta escritorio.

Comprueba especialmente Safari en iOS.

No dependas de hover para acciones esenciales.

36. Estados de interfaz
Todas las pantallas relevantes deberán contemplar:

Cargando.
Sin datos.
Error.
Sin conexión.
Guardando.
Guardado.
Sincronización pendiente.
Permiso denegado.
Los estados vacíos deben ofrecer una acción útil.

Ejemplo:

«Todavía no tienes recetas. Guarda tu primera receta para empezar a planificar».

No utilices textos lorem ipsum.

No muestres botones que no funcionen.

Utiliza español natural y consistente.

37. Accesibilidad
Prioriza:

HTML semántico.
Etiquetas de formularios.
Navegación por teclado.
Focus visible.
Contraste adecuado.
Lectores de pantalla.
Áreas táctiles de aproximadamente 44 px cuando sea posible.
Alternativas a drag and drop.
Respeto por prefers-reduced-motion.
No utilices el color como único indicador de estado.

38. Identidad de la aplicación
Crea una identidad básica para QuéComo:

Wordmark.
Icono.
Favicon.
Iconos de PWA.
Icono para pantalla de inicio.
Colores de tema.
Debe ser reconocible y coherente con la aplicación.

Utiliza recursos originales o con licencias adecuadas.

No utilices fotografías sin autorización.

PARTE V — ARQUITECTURA TÉCNICA
39. Decisión tecnológica
El proyecto se iniciará desde cero como una Progressive Web App.

La decisión anterior de utilizar React Native y Expo queda sustituida inicialmente por React y Vite.

Motivos:

Despliegue inmediato mediante URL.
Instalación sencilla en iPhone y Android.
Actualizaciones centralizadas.
Menor complejidad inicial.
Buena experiencia en ordenador.
Menores costes de mantenimiento.
Posibilidad de utilizar herramientas web maduras.
Independencia de las tiendas de aplicaciones.
No se descarta una aplicación nativa futura.

Cuando exista una necesidad real, se podrá evaluar:

Capacitor.
React Native con Expo.
Clientes nativos específicos.
El backend, los modelos, los contratos y la lógica de negocio deben poder reutilizarse.

No construyas una abstracción multiplataforma compleja únicamente para una posible migración futura.

40. Stack frontend
Utiliza:

React.
TypeScript strict.
Vite.
React Router.
Tailwind CSS.
shadcn/ui.
Radix UI cuando corresponda.
Lucide Icons.
TanStack Query.
React Hook Form.
Zod.
date-fns.
vite-plugin-pwa.
IndexedDB mediante una librería adecuada cuando sea necesario.
Utiliza versiones estables y compatibles.

No asumas versiones concretas sin consultar la documentación correspondiente.

Usa npm como gestor de paquetes salvo que exista una razón técnica clara para utilizar otro.

Mantén el lockfile versionado.

Evita Redux inicialmente.

Utiliza:

TanStack Query para estado remoto.
Context para configuración y estado global reducido.
Estado local para componentes.
Funciones puras para reglas de negocio.
No utilices Next.js inicialmente.

No necesitamos SSR ni SEO para la aplicación privada.

41. Backend
Utiliza Supabase como backend administrado.

Servicios:

PostgreSQL.
Supabase Auth.
Supabase Storage.
Supabase Realtime.
PostgREST.
Funciones SQL y RPC.
Edge Functions cuando sean necesarias.
No desarrolles inicialmente:

Backend Express independiente.
NestJS.
Microservicios.
Kubernetes.
Redis.
Infraestructura de colas compleja.
ORM adicional innecesario.
Utiliza Supabase directamente cuando sea suficiente.

Implementa operaciones transaccionales mediante SQL/RPC cuando deban garantizar consistencia.

Utiliza Edge Functions para operaciones que requieran:

Secretos.
Integraciones externas.
Procesamiento en servidor.
Acciones privilegiadas.
Validación adicional.
Importación de recetas.
La lógica de negocio que afecta a seguridad o integridad no puede depender exclusivamente del cliente.

42. Alojamiento
Proveedor inicial propuesto:

Cloudflare Pages.

El frontend se desplegará como aplicación estática.

Debe existir:

HTTPS.
Build reproducible.
Configuración SPA.
Redirecciones correctas.
Variables de entorno.
Configuración de caché.
Cabeceras de seguridad.
Gestión de despliegues.
Posibilidad de rollback.
Comprueba las opciones actuales del proveedor antes de configurar la integración.

Si Cloudflare Pages ha cambiado sus servicios o existe una alternativa claramente más adecuada, documenta la situación y propón el ajuste.

No cambies de proveedor por preferencias personales sin una razón objetiva.

El backend se alojará en Supabase.

Prioriza una región europea si está disponible y resulta apropiada.

43. Estructura del repositorio
Utiliza un único repositorio inicialmente.

Estructura orientativa:

quecomo/
src/
app/
routes/
components/
ui/
layout/
shared/
features/
auth/
households/
recipes/
meal-planner/
shopping/
preferences/
cooking/
domain/
ingredients/
servings/
shopping/
planning/
lib/
supabase/
query/
storage/
pwa/
hooks/
styles/
types/
utils/
public/
supabase/
migrations/
functions/
seed.sql
tests/
tests/
unit/
integration/
e2e/
docs/
.github/
workflows/
.env.example
CLAUDE.md
README.md
package.json

Adapta la estructura si encuentras una organización más clara.

No introduzcas un monorepo complejo inicialmente.

44. Convenciones de código
Código en inglés.
Interfaz en español.
TypeScript strict.
Evitar any.
Componentes pequeños.
Funciones descriptivas.
Separación entre UI, dominio y acceso a datos.
Reutilización de componentes.
Evitar duplicación.
Evitar abstracciones prematuras.
Validación consistente.
Manejo explícito de errores.
Tipos generados desde Supabase.
Dependencias justificadas.
Sin secretos en Git.
Sin código muerto.
Sin TODO en funcionalidades imprescindibles.
Utiliza nombres coherentes.

Documenta las decisiones no evidentes.

No escribas comentarios que simplemente repitan el código.

45. Modelo de datos inicial
Diseña un esquema relacional en PostgreSQL.

Entidades orientativas:

profiles
id
display_name
avatar_path
locale
timezone
created_at
updated_at
households
id
name
created_by
created_at
updated_at
household_members
household_id
user_id
role
joined_at
household_invitations
id
household_id
token_hash
invited_by
expires_at
accepted_at
revoked_at
created_at
recipes
id
household_id
created_by
title
description
base_servings
prep_active_minutes
cook_active_minutes
passive_minutes
total_minutes
difficulty
source_url
image_path
notes
archived_at
created_at
updated_at
recipe_ingredients
id
recipe_id
position
original_text
display_name
normalized_name
quantity
unit
normalized_unit
note
optional
recipe_steps
id
recipe_id
position
instruction
duration_minutes
categories
id
household_id
name
recipe_categories
recipe_id
category_id
tags
id
household_id
name
recipe_tags
recipe_id
tag_id
recipe_favorites
recipe_id
user_id
created_at
recipe_ratings
recipe_id
user_id
rating
meal_plan_entries
id
household_id
recipe_id
custom_title
date
meal_slot
servings
position
notes
created_by
created_at
updated_at
shopping_lists
id
household_id
title
date_from
date_to
status
created_by
created_at
updated_at
shopping_list_items
id
shopping_list_id
display_name
normalized_name
quantity
unit
category
status
manual_override
created_at
updated_at
shopping_item_sources
id
shopping_item_id
meal_plan_entry_id
recipe_ingredient_id
generated_quantity
generated_unit
user_dietary_preferences
user_id
preference
Estos modelos son orientativos.

Puedes modificarlos para garantizar:

Integridad referencial.
Aislamiento entre hogares.
Regeneración segura de listas.
Operaciones transaccionales.
Trazabilidad.
Extensibilidad.
No implementes tablas vacías para todos los módulos futuros.

Documenta cómo se incorporarían posteriormente.

46. Reglas de integridad
Define correctamente:

Primary keys.
Foreign keys.
Unique constraints.
Check constraints.
Índices.
Reglas de borrado.
Archivado.
Timestamps.
Relaciones entre hogares.
Permisos.
Integridad de referencias.
Una entrada del plan no debe poder referenciar una receta de otro hogar sin autorización explícita.

Un elemento de compra no debe poder asociarse a fuentes de otro hogar.

No confíes únicamente en UUID difíciles de adivinar.

Utiliza restricciones y comprobaciones de servidor.

Las cantidades deben utilizar tipos numéricos apropiados.

Evita errores de precisión en conversiones y escalado.

Utiliza date para fechas de calendario y timestamps con zona horaria para eventos temporales.

47. Seguridad y Row Level Security
Activa RLS en todas las tablas accesibles desde el cliente que lo requieran.

Las políticas deberán comprobar:

Usuario autenticado.
Pertenencia al hogar.
Rol.
Propiedad cuando corresponda.
Permisos sobre entidades relacionadas.
Comprueba operaciones:

SELECT.
INSERT.
UPDATE.
DELETE.
No permitas modificar arbitrariamente household_id, user_id o role para escalar privilegios.

No utilices service_role en el frontend.

No desactives RLS para resolver errores.

Si utilizas SECURITY DEFINER:

Justifica su necesidad.
Restringe permisos de ejecución.
Fija search_path seguro.
Valida auth.uid().
Evita acceso a hogares ajenos.
Comprueba parámetros.
Añade pruebas.
Evita políticas recursivas.

Comprueba seguridad de Storage y Realtime.

Los datos de un hogar no deben filtrarse mediante suscripciones, imágenes, funciones o relaciones indirectas.

48. Almacenamiento de imágenes
Utiliza Supabase Storage.

Las imágenes privadas deben estar protegidas mediante políticas adecuadas.

Implementa:

Subida.
Validación de formato.
Límite de tamaño.
Compresión o redimensionamiento cuando proceda.
Sustitución.
Eliminación.
Gestión de archivos huérfanos.
Acceso autorizado.
Evita utilizar buckets públicos para fotografías privadas.

No confíes únicamente en la extensión del archivo.

Considera la eliminación de metadatos EXIF cuando sea apropiado.

49. Sincronización
Supabase será la fuente de verdad.

TanStack Query gestionará:

Consultas.
Caché.
Mutaciones.
Invalidación.
Actualizaciones optimistas.
Reintentos apropiados.
Utiliza Realtime inicialmente para listas de compra.

Los demás módulos podrán actualizarse mediante invalidación, refetch al recuperar foco y suscripciones cuando aporten valor.

Diseña la sincronización teniendo en cuenta:

Dos usuarios editando simultáneamente.
Cambios sobre el mismo producto.
Reconexiones.
Datos obsoletos.
Cambios de hogar.
Eliminaciones.
Errores de red.
No permitas que una respuesta antigua sobrescriba silenciosamente cambios más recientes.

Documenta la estrategia de conflictos.

50. Offline y PWA
La aplicación debe instalarse como PWA.

Configura:

Web App Manifest.
Nombre.
Short name.
Iconos de 192 y 512 px.
Icono maskable.
Apple touch icon.
Theme color.
Background color.
Display standalone.
Start URL.
Service worker.
Actualizaciones.
Fallback apropiado.
Utiliza vite-plugin-pwa o una solución compatible.

La estrategia de caché debe ser segura.

No caches indiscriminadamente respuestas autenticadas ni datos de hogares.

La caché local debe estar aislada por usuario y hogar.

Debe limpiarse al cerrar sesión o cambiar de cuenta cuando corresponda.

Prioridades offline:

Consultar recetas previamente cargadas.
Consultar la planificación reciente.
Consultar la lista activa.
Marcar productos sin conexión si se implementa una cola de mutaciones segura.
Para escrituras offline utiliza una estrategia explícita de persistencia, idempotencia y resolución de conflictos.

Si no es posible implementarla correctamente en el MVP, muestra el estado offline y evita pérdida silenciosa de datos.

No simules sincronización.

No prometas capacidades que Safari o iOS no garanticen.

La aplicación debe poder actualizarse sin que los usuarios tengan que reinstalarla.

51. Internacionalización
El idioma inicial será español de España.

Utiliza:

Semanas que empiezan en lunes.
Formato de fecha español.
Separador decimal adecuado.
Sistema métrico.
Euros cuando se incorporen precios.
Los textos deben estar organizados de forma que añadir otros idiomas no requiera reescribir componentes completos.

No es necesario traducir el MVP a varios idiomas.

52. Entornos
Mantén separados:

Desarrollo local.
Pruebas.
Producción.
Utiliza Supabase local mediante CLI y Docker cuando el entorno lo permita.

Las pruebas destructivas solo deben ejecutarse sobre entornos de prueba.

No utilices la base de datos familiar para seeds, resets ni pruebas automatizadas.

Prepara:

.env.example
Configuración local.
Configuración de producción.
Variables públicas de frontend.
Secretos exclusivos de servidor.
Las variables VITE_ son públicas y se incluyen en el frontend.

No coloques secretos en ellas.

PARTE VI — PRUEBAS Y CALIDAD
53. Herramientas
Utiliza:

ESLint.
Prettier.
TypeScript.
Vitest.
React Testing Library cuando aporte valor.
Playwright.
Pruebas SQL o pgTAP para RLS e integridad cuando sea apropiado.
GitHub Actions.
No introduzcas frameworks de pruebas redundantes.

54. Pruebas unitarias
Prioriza:

Escalado de raciones.
Decimales y fracciones.
Conversión de unidades.
Normalización.
Consolidación.
Ingredientes incompatibles.
Generación de compra.
Regeneración.
Correcciones manuales.
Productos disponibles en casa.
Fechas.
Semanas.
Validaciones.
Las reglas de negocio críticas deben tener pruebas independientes de la interfaz.

55. Pruebas de seguridad
Crea al menos dos hogares de prueba independientes.

Comprueba:

Acceso sin autenticación.
Lectura entre hogares.
Escritura entre hogares.
Modificación de roles.
Invitaciones inválidas.
Invitaciones caducadas.
Invitaciones revocadas.
Aceptación duplicada.
Eliminación de miembros.
Acceso a imágenes.
Acceso mediante RPC.
Acceso mediante relaciones.
Suscripciones Realtime.
Las pruebas deben utilizar identidades de usuario reales de prueba, no únicamente credenciales administrativas que omitan RLS.

56. Pruebas end-to-end
Valida este recorrido:

Usuario A crea una cuenta.
Crea un hogar.
Crea una receta para dos personas.
Añade ingredientes y pasos.
Consulta la receta para cuatro personas.
Planifica una comida.
Añade varias preparaciones en una misma franja.
Genera una lista.
Añade un producto manual.
Marca un ingrediente como disponible en casa.
Invita al usuario B.
Usuario B acepta la invitación.
Ambos consultan el mismo hogar.
Usuario A marca un producto como comprado.
Usuario B recibe el cambio.
Se modifica la planificación.
Se regenera la compra.
No aparecen duplicados.
No se pierden productos manuales.
Usuario C, de otro hogar, no puede acceder a esos datos.
Se cierra y vuelve a abrir la aplicación.
Los datos y la sesión se conservan.
Añade pruebas de:

Formularios inválidos.
Estados vacíos.
Errores de red.
Navegación.
Sesión caducada.
Cambio de hogar.
Tamaños de pantalla.
57. Revisión visual
No consideres suficiente que la aplicación compile.

Utiliza Playwright para:

Abrir la aplicación.
Navegar por las pantallas.
Interactuar con formularios.
Capturar screenshots.
Revisar tamaños móviles.
Revisar escritorio.
Detectar desbordamientos.
Detectar inconsistencias.
Revisar accesibilidad básica.
Corregir problemas.
Utiliza Chromium y WebKit cuando estén disponibles.

Ten en cuenta que Playwright WebKit no sustituye completamente una prueba en un iPhone real.

Documenta qué plataformas se han probado realmente.

No afirmes haber verificado dispositivos físicos si no has tenido acceso a ellos.

58. Datos de demostración
Prepara seeds realistas para desarrollo.

Incluye:

15-20 recetas originales.
Recetas vegetarianas.
Recetas no vegetarianas.
Recetas rápidas.
Recetas con tiempos pasivos.
Ingredientes variados.
Diferentes unidades.
Una semana planificada.
Listas de compra.
Varios usuarios.
Dos hogares independientes.
Utiliza fotografías con licencia adecuada o recursos originales.

No dependas de URLs externas inestables.

Los datos de demostración deben estar separados de producción.

59. Definition of Done
Una funcionalidad se considera terminada cuando:

Funciona de extremo a extremo.
Persiste datos reales.
Tiene autorización correcta.
Maneja estados de carga y error.
Es usable desde móvil.
Tiene diseño coherente.
Cumple los criterios de aceptación.
Tiene pruebas proporcionadas a su riesgo.
No introduce errores críticos.
Está documentada cuando corresponde.
No deja botones falsos ni funcionalidades simuladas.
No des por terminada una tarea porque exista un componente visual o una tabla en la base de datos.

PARTE VII — DESPLIEGUE
60. Integración continua
Configura GitHub Actions para ejecutar:

npm ci
lint
format check
typecheck
unit tests
integration tests cuando sea viable
build
Añade pruebas end-to-end en CI cuando el entorno sea reproducible.

Utiliza versiones fijadas de herramientas y acciones cuando sea apropiado.

No desactives comprobaciones para conseguir artificialmente un pipeline verde.

61. Despliegue de producción
Prepara el despliegue en Cloudflare Pages y Supabase.

El frontend deberá poder construirse mediante un comando documentado.

Configura:

Directorio de salida.
SPA routing.
Variables públicas.
Cabeceras de seguridad.
Caché.
HTTPS.
Manifest.
Service worker.
Gestión de actualizaciones.
Supabase deberá tener:

Proyecto de producción.
Migraciones aplicadas.
RLS.
Storage.
Realtime.
URLs de autenticación.
Configuración de correo.
Secretos.
Políticas.
Estrategia de backup.
No ejecutes migraciones destructivas sobre producción.

Los despliegues de frontend y migraciones deben mantener compatibilidad cuando sea necesario.

La publicación debe estar condicionada a comprobaciones de calidad.

Si el proveedor no permite condicionar automáticamente el despliegue a CI, configura una estrategia de publicación mediante una rama protegida o un workflow apropiado.

62. Instalación familiar
El resultado final debe poder compartirse mediante una URL.

Prepara instrucciones breves para:

iPhone
Abrir en Safari.
Utilizar la opción Compartir.
Añadir a pantalla de inicio.
Abrir QuéComo desde su icono.
Crear cuenta.
Aceptar invitación.
Android
Abrir en navegador compatible.
Instalar aplicación o añadir a pantalla de inicio.
Crear cuenta.
Aceptar invitación.
Ordenador
Abrir URL.
Iniciar sesión.
Instalar como aplicación cuando el navegador lo permita.
Incluye una ayuda de instalación dentro de la propia aplicación.

No muestres instrucciones incorrectas para el dispositivo utilizado.

63. Costes y mantenimiento
El objetivo es minimizar costes.

Comprueba los límites actuales de:

Supabase.
Cloudflare.
GitHub Actions.
Almacenamiento.
Realtime.
Correo de autenticación.
Backups.
Inactividad.
Transferencia de datos.
No asumas que los planes gratuitos son ilimitados.

Documenta cuándo sería necesario pasar a un plan de pago.

Evita introducir servicios externos de IA en el MVP.

No contrates servicios sin autorización.

64. Copias de seguridad
Define un procedimiento de:

Exportación de datos.
Backup de PostgreSQL.
Backup de imágenes cuando corresponda.
Restauración.
Recuperación ante errores.
Comprueba qué capacidades proporciona realmente el plan contratado.

Si las copias automáticas no están disponibles, documenta una alternativa manual reproducible.

No afirmes que existe recuperación automática si no está configurada.

PARTE VIII — DOCUMENTACIÓN Y CONTINUIDAD
65. Documentación del repositorio
La documentación debe ser suficiente para que cualquier sesión futura de Claude Code pueda continuar el proyecto.

Crea:

README.md
Descripción.
Stack.
Requisitos.
Instalación.
Variables de entorno.
Desarrollo.
Supabase local.
Pruebas.
Build.
Despliegue.
CLAUDE.md
Instrucciones permanentes del proyecto.

Debe ser conciso e incluir:

Misión.
Arquitectura.
Convenciones.
Comandos.
Restricciones.
Seguridad.
Criterios de calidad.
Referencias a documentación.
Instrucciones de continuidad.
docs/PRODUCT_SPEC.md
Conserva esta especificación completa como fuente de verdad del producto.

docs/PRODUCT.md
Resumen operativo:

Visión.
Usuarios.
Flujos.
MVP.
Prioridades.
Criterios de aceptación.
docs/ARCHITECTURE.md
Arquitectura.
Modelo de datos.
Seguridad.
Sincronización.
Acceso a datos.
Decisiones técnicas.
Evolución futura.
docs/DESIGN.md
Identidad.
Tokens.
Componentes.
Navegación.
UX.
Accesibilidad.
docs/DEPLOYMENT.md
Configuración.
Entornos.
Supabase.
Cloudflare.
CI.
Migraciones.
Backups.
Instalación.
Recuperación.
docs/ROADMAP.md
Funcionalidades futuras.
Dependencias.
Prioridades propuestas.
Riesgos.
Decisiones pendientes.
No organices este documento por sprints.

docs/STATUS.md
Mantén este archivo actualizado durante todo el desarrollo.

Debe contener:

Estado actual.
Funcionalidades implementadas.
Funcionalidades verificadas.
Pendientes.
Pruebas ejecutadas.
Resultados.
Problemas conocidos.
Bloqueos.
Decisiones recientes.
Siguiente acción concreta.
Diferencia entre implementado, probado y desplegado.

docs/decisions/
Registra únicamente decisiones arquitectónicas relevantes mediante ADR breves.

No generes documentación excesiva.

66. Continuidad entre sesiones
El proyecto puede requerir varias sesiones debido a límites de contexto o uso.

No debes depender de recordar toda la conversación.

Antes de finalizar una sesión o compactar contexto:

Actualiza STATUS.md.
Registra decisiones relevantes.
Conserva el plan pendiente.
Deja el repositorio en un estado comprensible.
Identifica la siguiente acción concreta.
Una nueva sesión debe poder continuar leyendo:

CLAUDE.md.
PRODUCT_SPEC.md.
STATUS.md.
Código existente.
No reinicies el trabajo en cada sesión.

PARTE IX — METODOLOGÍA DE DESARROLLO AUTÓNOMO
67. Inicialización
El proyecto parte de un repositorio nuevo.

Primero comprueba:

Sistema operativo.
Directorio de trabajo.
Estado de Git.
Node.js.
npm.
Docker.
Supabase CLI.
Herramientas disponibles.
Acceso a documentación.
Herramientas de navegador.
No asumas que todas están instaladas.

El entorno principal de desarrollo puede ser Windows.

Procura que los comandos y scripts sean multiplataforma.

Evita dependencias innecesarias de WSL.

Si existe algún archivo inicial, respétalo.

No elimines archivos externos al proyecto.

68. Orden de implementación
No utilices sprints.

Utiliza un orden interno basado en dependencias y entregables funcionales.

Orden recomendado:

Inicializar repositorio y herramientas.
Preparar diseño y navegación.
Configurar Supabase local.
Implementar autenticación.
Implementar hogares y seguridad.
Completar un flujo vertical de creación y lectura de recetas.
Completar recetario.
Implementar escalado.
Implementar planificación.
Implementar compra.
Implementar colaboración y sincronización.
Completar inicio y preferencias.
Implementar funcionalidades P1 prioritarias.
Completar PWA.
Ejecutar revisión visual.
Ejecutar pruebas de seguridad.
Ejecutar pruebas end-to-end.
Corregir errores.
Preparar despliegue.
Entregar MVP familiar.
Puedes cambiar el orden si existe una razón técnica.

No te detengas tras cada punto para solicitar aprobación.

No conviertas este orden en una planificación burocrática.

69. Uso de herramientas
Utiliza herramientas disponibles para:

Consultar documentación oficial.
Ejecutar comandos.
Instalar dependencias.
Editar archivos.
Gestionar Git.
Ejecutar Supabase.
Probar SQL.
Abrir navegadores.
Capturar screenshots.
Ejecutar tests.
Diagnosticar errores.
Si dispones de MCP de Supabase, Playwright, GitHub o Context7, utilízalos cuando aporten valor.

No presupongas que están instalados.

Si una herramienta no está disponible, utiliza alternativas razonables.

No inventes resultados de herramientas.

70. Subagentes
Si dispones de subagentes, puedes utilizarlos para:

Arquitectura.
Diseño.
Seguridad.
Base de datos.
Implementación de módulos independientes.
Revisión de código.
QA.
Pruebas visuales.
Documentación.
Coordina el trabajo para evitar conflictos.

No permitas que varios agentes modifiquen simultáneamente los mismos archivos críticos sin coordinación.

Mantén una visión arquitectónica común.

71. Autonomía
Toma decisiones técnicas razonables sin preguntarme continuamente.

Puedes:

Crear archivos.
Modificar código.
Instalar dependencias justificadas.
Ejecutar herramientas locales.
Ejecutar pruebas.
Corregir errores.
Refactorizar.
Crear migraciones locales.
Realizar commits locales coherentes.
Actualizar documentación.
Solicita mi intervención únicamente cuando:

Necesites credenciales.
Necesites acceso externo.
Debas contratar un servicio.
Exista riesgo de pérdida de datos.
Sea necesario publicar externamente.
Debas modificar producción.
Exista una decisión de producto importante no cubierta.
Encuentres un bloqueo que no puedas resolver.
Si existe un bloqueo externo, continúa con otras tareas independientes.

Agrupa las preguntas imprescindibles para evitar interrupciones constantes.

72. Git
Utiliza una estrategia sencilla.

Rama principal estable.
Ramas cortas cuando sean útiles.
Commits descriptivos.
Conventional Commits cuando resulte apropiado.
No subir secretos.
No hacer force push.
No borrar historial.
No sobrescribir cambios del usuario.
No hagas push ni publiques externamente sin autorización.

No necesitas solicitar permiso para cada commit local coherente.

73. Gestión de errores
Cuando aparezca un error:

Investiga su causa.
Consulta documentación si es necesario.
Reproduce el problema.
Corrige la causa.
Ejecuta las pruebas.
Comprueba regresiones.
Documenta si es relevante.
Continúa.
No ocultes errores mediante:

any.
ts-ignore injustificados.
Desactivación de ESLint.
Desactivación de RLS.
Eliminación de tests.
Mocks permanentes.
Capturas de excepciones vacías.
No confundas eliminar el mensaje de error con solucionar el problema.

74. Control de alcance
La visión futura es extensa, pero el MVP tiene prioridad.

No implementes:

Inventario completo.
Caducidades avanzadas.
Integración con supermercados.
Optimización económica.
Grafo de preparación.
Batch cooking inteligente.
Hardware.
OCR avanzado.
IA generativa.
Billing.
Hasta completar el MVP.

Puedes dejar puntos de extensión razonables, pero no construyas infraestructura para funcionalidades inexistentes.

No sacrifiques la calidad del flujo principal para adelantar módulos futuros.

PARTE X — CRITERIOS DE ENTREGA
75. Criterios de aceptación del MVP
Consideraré que la primera versión está terminada cuando:

Puedo crear una cuenta.
Puedo iniciar sesión.
Puedo crear un hogar.
Puedo invitar a mi pareja o familiares.
Cada persona accede desde su dispositivo.
Podemos compartir recetas.
Podemos crear recetas cómodamente.
Podemos subir fotografías.
Podemos ajustar raciones.
Podemos buscar recetas.
Podemos organizar comidas de la semana.
Podemos añadir varias preparaciones a una comida.
Podemos generar una lista de compra.
Podemos corregir ingredientes.
Podemos añadir productos manuales.
Podemos marcar productos comprados.
Podemos marcar ingredientes que ya tenemos.
Podemos utilizar la misma lista simultáneamente.
Los cambios se sincronizan.
No se duplican productos al regenerar.
No se pierden datos al cerrar la aplicación.
Los hogares están aislados.
La interfaz es atractiva.
La aplicación es cómoda desde móvil.
Funciona desde navegador.
Puede instalarse como PWA.
El build de producción funciona.
Las pruebas críticas pasan.
Existe documentación de despliegue.
Existe una estrategia de backup.
No existen errores críticos conocidos.
Las funcionalidades P1 no deben bloquear la primera publicación si el núcleo P0 está completo, pero deben documentarse las que queden pendientes.

76. Validación con usuarios reales
Después de desplegar la beta familiar, queremos observar:

Tiempo necesario para crear una receta.
Facilidad para planificar.
Tiempo necesario para generar la compra.
Uso simultáneo.
Problemas durante la compra.
Fricción al introducir ingredientes.
Necesidad de importación.
Utilidad de las sugerencias.
Frecuencia de uso.
Problemas de sincronización.
No implementes analítica invasiva.

Inicialmente puede bastar con feedback manual y un mecanismo básico para registrar errores.

El objetivo no es maximizar métricas comerciales todavía.

Es conseguir que la aplicación resulte suficientemente útil para utilizarla cada semana.

77. Roadmap posterior
Después de validar el MVP, las siguientes ampliaciones candidatas serán:

Recetas y cocina
Importación web asíncrona.
Importación desde texto e imágenes.
Compartición mediante enlaces.
Modo cocina avanzado.
Temporizadores.
Sesiones persistentes.
Inventario y desperdicio
Despensa.
Nevera.
Congelador.
Lotes.
Caducidades.
Consumo.
Sobras.
Recomendaciones.
Planificación avanzada
Disponibilidad.
Calendarios.
Plantillas.
Historial.
Recomendaciones.
Planificación individual.
Batch cooking.
Cocina visual
Acciones estructuradas.
Ingredientes asociados a acciones.
Dependencias.
Preparaciones intermedias.
Mapa visual.
Grafo conjunto de recetas.
Compra inteligente
Catálogos.
Productos comerciales.
Precios.
Equivalencias.
Optimización de cesta.
Calidad/precio.
Automatización y hardware
Código de barras.
OCR.
Reconocimiento de fechas.
Cámara móvil.
Dispositivo físico.
API para dispositivos.
El orden definitivo dependerá de la experiencia real de uso.

No empieces automáticamente a implementar todo el roadmap después de completar el MVP.

Primero debemos utilizarlo y revisar prioridades.

78. Entrega final
Cuando termines el MVP, proporciona un informe conciso que incluya:

Funcionalidades implementadas.
Funcionalidades pendientes.
Arquitectura final.
Decisiones relevantes.
Estado del repositorio.
Pruebas ejecutadas.
Resultados reales.
Plataformas verificadas.
Problemas conocidos.
Limitaciones.
Estado del despliegue.
Costes previstos.
Credenciales o acciones necesarias.
Instrucciones para ejecutar localmente.
Instrucciones para desplegar.
Instrucciones para compartir con mi familia.
Siguiente ampliación recomendada.
No afirmes que una funcionalidad está verificada si únicamente has escrito su código.

No afirmes que la aplicación está desplegada si no existe un despliegue real.

No ocultes limitaciones.

79. Instrucción de inicio
Empieza ahora.

Comprueba el entorno.
Conserva esta especificación en docs/PRODUCT_SPEC.md.
Crea las instrucciones permanentes del proyecto.
Establece un plan interno de implementación.
Inicializa el proyecto.
Comienza a programar.
Ejecuta y revisa la aplicación.
Continúa hasta completar el MVP.
No respondas únicamente con un plan.

No me pidas que implemente manualmente los componentes.

No conviertas el proyecto en un curso de programación.

No te detengas tras generar el scaffolding.

Quiero que construyas una aplicación real, con una interfaz cuidada, una arquitectura mantenible, datos persistentes, seguridad y una distribución sencilla.

Yo soy la responsable del producto.

Tú eres el responsable de construirlo.

La primera meta es que mi familia, mi pareja y yo podamos utilizar QuéComo para organizar nuestras comidas y compras reales.



QUÉCOMO — Requisitos adicionales de desarrollo, despliegue, documentación e internacionalización
Esta ampliación contiene decisiones aprobadas por la Product Owner después de definir la especificación inicial.

En caso de contradicción, estos requisitos prevalecen sobre la especificación anterior.

80. Metodología de desarrollo mediante Pull Requests
El desarrollo debe organizarse mediante ramas de trabajo y Pull Requests en GitHub.

La Product Owner quiere poder revisar y probar las funcionalidades sin ejecutar la aplicación localmente.

No se trabajará por sprints, pero sí mediante entregables funcionales coherentes, revisables e independientes cuando sea posible.

Utiliza una estrategia de ramas sencilla:

main: versión estable de producción.
feature/*: funcionalidades.
fix/*: correcciones.
refactor/*: refactorizaciones.
docs/*: documentación.
No introduzcas una rama develop permanente salvo que exista una necesidad justificada.

No desarrolles todo el MVP en una única rama gigantesca.

Agrupa cambios relacionados en Pull Requests de tamaño razonable.

Cada PR debe dejar el proyecto en un estado coherente.

La Product Owner no tiene que aprobar cada decisión técnica menor, pero debe poder revisar los cambios de producto antes de incorporarlos a producción.

Una vez configurados y autorizados los accesos a GitHub, Claude podrá crear ramas remotas, subir cambios y abrir Pull Requests en el repositorio privado del proyecto.

Esta autorización no incluye:

Hacer merge sin aprobación.
Hacer force push.
Eliminar historial.
Publicar el repositorio.
Modificar producción directamente.
Compartir secretos.
Contratar servicios.
Configura protección de main mediante las capacidades disponibles en el plan de GitHub.

Si alguna protección no está disponible, documenta la limitación y establece un procedimiento alternativo.

81. Despliegues de preview
Configura Cloudflare Pages desde las primeras etapas del proyecto.

No esperes a completar el MVP.

El objetivo es disponer de una primera URL de pruebas desde que exista una estructura básica navegable.

Cada Pull Request con cambios relevantes en la aplicación debe disponer de un preview deployment.

La Product Owner debe poder:

Abrir la Pull Request.
Acceder al enlace del despliegue.
Probar la aplicación desde móvil u ordenador.
Utilizar datos de prueba.
Revisar la funcionalidad.
Solicitar modificaciones.
Probar las actualizaciones de la misma PR.
Aprobar el resultado.
El enlace de preview debe estar visible en la PR mediante la integración del proveedor, un deployment check o un comentario automatizado.

No publiques enlaces inventados.

Comprueba que el despliegue existe y es accesible.

Las previews deben protegerse frente a accesos no autorizados cuando corresponda.

Evalúa Cloudflare Access u otro mecanismo apropiado.

Comprueba la compatibilidad con Supabase Auth y los redirects de autenticación.

No utilices configuraciones de redirects excesivamente permisivas en producción.

82. Entornos
Configura tres entornos claramente diferenciados.

Desarrollo local
Vite.
Supabase local mediante CLI y Docker.
Datos ficticios.
Migraciones locales.
Pruebas.
Posibilidad de reiniciar la base de datos local.
Preview y validación
Cloudflare Pages Preview Deployments.
Supabase remoto de pruebas.
Usuarios de prueba.
Datos ficticios.
Migraciones compatibles con las funcionalidades evaluadas.
Acceso controlado.
Producción
Cloudflare Pages.
Supabase de producción.
Usuarios reales.
Datos reales.
Migraciones controladas.
Backups.
Despliegues aprobados.
Las previews nunca deben conectarse a producción.

Las pruebas automatizadas nunca deben modificar datos reales.

Inicialmente se permite utilizar un único backend remoto de pruebas compartido entre previews.

Define una estrategia para evitar conflictos entre migraciones de diferentes PR.

Si una PR necesita cambios incompatibles en la base de datos, utiliza un entorno aislado o coordina su validación antes de aplicar otras migraciones.

Evalúa Supabase Branching posteriormente si aporta valor y sus costes son aceptables.

No contrates servicios sin autorización.

83. Contenido obligatorio de las Pull Requests
Crea una plantilla en:

.github/pull_request_template.md

Cada PR deberá contener:

Objetivo
Qué problema resuelve y qué requisitos implementa.

Cambios realizados
Resumen funcional y técnico.

Preview
Enlace real al despliegue cuando corresponda.

Evidencia visual
Capturas reales de la aplicación.

Incluye vistas móviles y de escritorio para cambios visuales relevantes.

Cómo probar
Instrucciones concretas para que una persona no técnica pueda validar la funcionalidad.

Incluye:

Ruta o pantalla.
Datos de prueba necesarios.
Acciones.
Resultado esperado.
Casos alternativos relevantes.
No incluyas credenciales sensibles en la PR.

Base de datos
Migraciones.
Cambios de esquema.
Cambios de RLS.
Compatibilidad.
Riesgos.
Procedimiento de despliegue cuando corresponda.
Pruebas
Comandos ejecutados.
Resultados reales.
Pruebas unitarias.
Pruebas de integración.
Pruebas end-to-end.
Comprobaciones visuales.
Limitaciones.
Documentación
Indica qué documentación técnica y de usuario se ha actualizado.

Internacionalización
Confirma que los textos nuevos están disponibles en todos los idiomas soportados.

Problemas conocidos
Describe limitaciones, decisiones pendientes y funcionalidades no verificadas.

Criterios de aceptación
Incluye un checklist de requisitos verificables.

No marques como completados requisitos que no hayan sido comprobados.

84. CI/CD y protección de producción
Configura GitHub Actions para ejecutar las comprobaciones pertinentes en cada PR.

Incluye:

Instalación reproducible.
Lint.
Formato.
TypeScript.
Pruebas unitarias.
Pruebas de integración.
Pruebas de seguridad.
Pruebas end-to-end cuando sea viable.
Build.
Comprobación de traducciones.
Comprobación de documentación cuando proceda.
Configura Cloudflare Pages para generar previews automáticamente.

Los despliegues de preview pueden existir antes de finalizar todas las pruebas, pero deben mostrar claramente su estado.

La publicación en producción solo debe realizarse después de:

Superar las comprobaciones obligatorias.
Revisar los cambios.
Obtener aprobación de la Product Owner.
Integrar la PR en main.
Aplicar las migraciones de producción de forma segura cuando corresponda.
Define un procedimiento de rollback.

No asumas que revertir el frontend revierte automáticamente las migraciones de base de datos.

Mantén compatibilidad entre versiones cuando sea necesario.

85. Documentación como requisito obligatorio
La documentación forma parte de cada funcionalidad.

No se considera terminada una funcionalidad si sus instrucciones relevantes están desactualizadas.

Mantén como mínimo:

README.md
CLAUDE.md
CHANGELOG.md
docs/PRODUCT_SPEC.md
docs/PRODUCT.md
docs/ARCHITECTURE.md
docs/DESIGN.md
docs/ROADMAP.md
docs/STATUS.md
Organiza adicionalmente:

docs/development/

LOCAL_SETUP.md
TESTING.md
CONTRIBUTING.md
TROUBLESHOOTING.md
docs/deployment/

CLOUDFLARE.md
SUPABASE.md
ENVIRONMENTS.md
BACKUP_RESTORE.md
docs/user-guide/

GETTING_STARTED.md
HOUSEHOLDS.md
RECIPES.md
MEAL_PLANNER.md
SHOPPING.md
SETTINGS.md
INSTALLATION.md
docs/decisions/

ADRs relevantes.
No crees documentación vacía para aparentar progreso.

Crea y actualiza las guías a medida que las funcionalidades estén disponibles.

Mantén la documentación técnica en español, conservando nombres de comandos, identificadores y terminología técnica en inglés cuando corresponda.

86. Instalación local reproducible
La Product Owner debe poder ejecutar el proyecto desde cero siguiendo únicamente la documentación.

Prioriza compatibilidad con Windows, macOS y Linux.

No hagas que WSL sea obligatorio.

Documenta:

Requisitos.
Versiones compatibles.
Instalación de herramientas.
Clonado.
Dependencias.
Variables de entorno.
Configuración de Supabase.
Docker.
Migraciones.
Seeds.
Usuarios de prueba.
Ejecución.
Depuración.
Pruebas.
Build.
Actualización.
Problemas habituales.
Proporciona scripts de npm para simplificar las operaciones frecuentes.

Comandos orientativos:

npm ci
npm run setup
npm run dev
npm run db:start
npm run db:stop
npm run db:reset
npm run db:types
npm run test
npm run test:e2e
npm run check
npm run build
Implementa únicamente comandos reales y verificados.

Adapta los nombres cuando exista una razón técnica.

Los scripts destructivos deben comprobar que están trabajando sobre un entorno local autorizado.

Nunca deben reiniciar accidentalmente una base de datos remota.

Si una operación requiere intervención manual, documenta exactamente qué debe hacer el usuario.

87. Documentación de usuario
Genera instrucciones de uso de la aplicación conforme se desarrollen sus funcionalidades.

Las guías deben ser comprensibles para personas sin conocimientos técnicos.

Cada guía debe explicar:

Para qué sirve la funcionalidad.
Cómo acceder.
Cómo utilizarla.
Qué resultado esperar.
Qué opciones existen.
Qué limitaciones tiene.
Cómo solucionar problemas habituales.
Incluye capturas reales cuando aporten valor.

Mantén las instrucciones actualizadas cuando cambie la interfaz.

No documentes funcionalidades inexistentes como si estuvieran disponibles.

Añade una sección de Ayuda y soporte dentro de la aplicación.

Debe ser accesible desde Perfil o Configuración.

La ayuda incluirá:

Primeros pasos.
Instalación de la PWA.
Gestión de hogares.
Invitaciones.
Recetas.
Planificación.
Compra.
Configuración.
Cambio de idioma.
Preguntas frecuentes.
Utiliza una fuente de contenido compartida o un mecanismo de generación que reduzca la duplicación entre la documentación del repositorio y la ayuda integrada.

La documentación de usuario y la ayuda integrada deben estar disponibles en los idiomas soportados.

88. Internacionalización obligatoria desde el inicio
QuéComo debe ser una aplicación internacionalizable desde su primera versión.

Utiliza:

i18next.
react-i18next.
Intl para formatos regionales.
Recursos de traducción organizados por módulos.
Claves de traducción consistentes.
Tipado cuando sea viable.
Idiomas iniciales:

Español de España: es-ES.
Inglés: en-GB.
El idioma predeterminado será es-ES.

La incorporación de nuevos idiomas no debe requerir modificaciones estructurales de los componentes.

No disperses textos de interfaz directamente en componentes React.

Externaliza:

Navegación.
Botones.
Formularios.
Etiquetas.
Validaciones.
Errores.
Notificaciones.
Diálogos.
Estados vacíos.
Mensajes de confirmación.
Ayuda.
Textos de instalación.
Accesibilidad.
Utiliza interpolación y pluralización adecuadas.

No construyas frases traducidas mediante concatenaciones que impidan adaptar la gramática.

Utiliza namespaces por módulos.

Configura un idioma de fallback.

Detecta claves ausentes y traducciones incompletas mediante comprobaciones automatizadas.

89. Preferencia de idioma persistente
Añade una preferencia de idioma a la tabla profiles.

Campo:

locale
Tipo text o equivalente apropiado.
Valor predeterminado es-ES.
Validación de locales soportados.
La configuración será individual por usuario.

No pertenecerá al hogar.

Dos miembros del mismo hogar podrán utilizar idiomas diferentes.

El selector estará disponible en:

Perfil → Configuración → Idioma.

Al cambiar el idioma:

Actualiza inmediatamente la interfaz.
Persiste la preferencia en Supabase.
Actualiza la caché local.
Gestiona posibles errores de persistencia.
Informa al usuario si el cambio no se ha podido guardar.
Al iniciar la aplicación:

Utiliza la preferencia local cuando sea apropiado para evitar parpadeos.
Recupera el perfil autenticado.
Aplica la preferencia almacenada en servidor.
Sincroniza la caché.
El perfil remoto será la fuente de verdad para usuarios autenticados.

La pantalla de autenticación también debe permitir cambiar de idioma.

Si un usuario selecciona otro idioma antes de registrarse, utiliza esa preferencia al crear su perfil.

Evita que la preferencia de una cuenta se transfiera accidentalmente a otra cuenta del mismo dispositivo.

90. Formatos regionales
Utiliza Intl y herramientas compatibles para:

Fechas.
Horas.
Números.
Decimales.
Cantidades.
Monedas.
Pluralización.
Mantén el sistema métrico como configuración inicial.

No conviertas automáticamente las unidades de las recetas al cambiar el idioma.

No confundas idioma, zona horaria, moneda y sistema de medida.

Son preferencias conceptualmente independientes.

La semana comenzará el lunes en los idiomas iniciales.

Las fechas almacenadas deben mantener su significado al cambiar el idioma.

91. Datos de usuario y traducciones
El cambio de idioma no debe traducir ni modificar automáticamente:

Títulos de recetas.
Ingredientes escritos por usuarios.
Pasos de elaboración.
Notas.
Nombres de hogares.
Productos manuales.
Etiquetas personalizadas.
Categorías personalizadas.
Las categorías y etiquetas predefinidas deberán utilizar identificadores estables independientes de su traducción.

No utilices el texto traducido como clave primaria ni como identificador de negocio.

Los mensajes de error del backend deberán mapearse a mensajes localizados cuando sea posible.

No muestres errores técnicos sin procesar al usuario.

92. Pruebas de internacionalización
Comprueba:

Idioma predeterminado.
Cambio de español a inglés.
Cambio de inglés a español.
Actualización inmediata.
Persistencia tras recargar.
Persistencia tras cerrar sesión.
Recuperación desde otro dispositivo.
Diferentes idiomas en usuarios del mismo hogar.
Cambio de cuenta.
Formatos de fechas.
Formatos numéricos.
Pluralización.
Traducciones ausentes.
Desbordamientos por textos más largos.
Mensajes de validación.
Ayuda de usuario.
Las pruebas deben verificar que los datos compartidos no se modifican al cambiar el idioma.

93. Definition of Done ampliada
Una funcionalidad solo se considera terminada cuando:

Está implementada.
Funciona con datos persistentes.
Cumple los requisitos de seguridad.
Tiene pruebas proporcionadas a su riesgo.
Funciona en móvil y escritorio.
Está disponible en español e inglés.
Tiene documentación técnica actualizada.
Tiene instrucciones de usuario actualizadas cuando corresponde.
Dispone de preview cuando corresponde.
La PR contiene instrucciones de validación.
Las limitaciones están documentadas.
No hagas merge automático en main sin autorización.

94. Prioridad de infraestructura
Modifica el orden inicial de implementación para adelantar:

Inicialización del repositorio.
Configuración de GitHub.
CI básico.
Arquitectura frontend.
Internacionalización.
Sistema visual.
Configuración de Cloudflare Pages.
Primera preview navegable.
Supabase local y remoto de pruebas.
Autenticación.
Desarrollo progresivo de funcionalidades.
No esperes a terminar el MVP para configurar los despliegues.

La Product Owner debe poder revisar el producto desde las primeras etapas.

El objetivo sigue siendo completar un MVP familiar estable, atractivo, seguro y desplegable, manteniendo autonomía de implementación y transparencia sobre el progreso.


QUÉCOMO — Revisión de infraestructura, disponibilidad y funcionamiento offline
Las siguientes decisiones prevalecen sobre todas las secciones anteriores de la especificación en caso de contradicción.

95. Cambio de proveedor de alojamiento
Debido a los bloqueos de direcciones IP asociados a las retransmisiones de LaLiga en España, se descarta Cloudflare Pages como proveedor principal de alojamiento.

La aplicación está destinada inicialmente a usuarios residentes en España y debe minimizar su exposición a interrupciones asociadas a dichos bloqueos.

Se selecciona Netlify como proveedor inicial.

Sustituye todas las referencias operativas a Cloudflare Pages por Netlify, incluyendo:

Infraestructura.
CI/CD.
Despliegues de producción.
Preview deployments.
Configuración de variables.
Documentación.
Procedimientos de rollback.
Integraciones con GitHub.
Instrucciones de instalación y despliegue.
Mantén todos los requisitos previamente establecidos sobre Pull Requests y revisión mediante previews.

Utiliza:

Netlify Deploy Previews.
Integración con GitHub.
Despliegue de producción desde main.
Directorio de publicación dist.
Comando de build npm run build.
Redirecciones compatibles con React Router.
Configuración versionada mediante netlify.toml cuando corresponda.
Sustituye docs/deployment/CLOUDFLARE.md por docs/deployment/NETLIFY.md.

Verifica los límites vigentes del plan gratuito, especialmente los créditos, despliegues, transferencia, acceso a previews y repositorios privados.

Configura alertas de consumo cuando estén disponibles.

No contrates servicios de pago sin autorización.

No asumas que Netlify está exento de bloqueos ni garantiza disponibilidad absoluta.

96. Independencia del proveedor de alojamiento
La aplicación no debe depender innecesariamente de funcionalidades propietarias del proveedor de hosting.

Mantén el frontend como una aplicación estática estándar generada mediante Vite.

No introduzcas dependencias de Netlify Functions, Netlify Database, Netlify Identity o servicios equivalentes sin una justificación arquitectónica.

Supabase continuará siendo el backend principal.

No sitúes Cloudflare como proxy obligatorio delante de la aplicación.

Evita dependencias externas innecesarias durante la ejecución, incluyendo fuentes, scripts e iconos alojados en CDN de terceros.

Empaqueta localmente los recursos esenciales cuando sea posible.

Documenta cómo desplegar el frontend generado en otro proveedor de alojamiento compatible.

97. Funcionamiento offline como requisito P0
El funcionamiento offline de las funcionalidades esenciales pasa a ser un requisito obligatorio del MVP.

El usuario debe poder abrir la aplicación instalada y acceder a los datos previamente sincronizados aunque exista:

Ausencia de cobertura.
Pérdida de conexión a Internet.
Interrupción del proveedor de alojamiento.
Interrupción temporal de Supabase.
Bloqueo de acceso a determinadas infraestructuras.
No se exige que el primer acceso a la aplicación pueda realizarse sin conexión.

Implementa mediante Service Worker, Cache Storage, IndexedDB y las herramientas apropiadas.

No asumas que navigator.onLine garantiza la conectividad efectiva con el backend.

Detecta errores de red y disponibilidad real de los servicios.

98. Funcionalidades offline obligatorias
Una vez realizada la sincronización inicial, deben estar disponibles:

Apertura y navegación de la aplicación.
Consulta de recetas previamente sincronizadas.
Consulta de ingredientes y pasos de elaboración.
Ajuste local de raciones.
Consulta del menú semanal previamente sincronizado.
Consulta de listas de compra activas.
Marcado y desmarcado de productos comprados.
Incorporación manual de productos a la lista de compra.
Las operaciones que requieran conexión deben identificarse claramente.

No muestres estados de sincronización falsos.

99. Sincronización de operaciones offline
Implementa una cola persistente de operaciones pendientes mediante un patrón Outbox o equivalente.

Las operaciones deben sobrevivir al cierre y reapertura de la aplicación.

Cada operación deberá disponer de un identificador único y ser idempotente cuando corresponda.

Al recuperar la conexión:

Comprueba la disponibilidad del backend.
Valida la sesión.
Comprueba que el usuario conserva los permisos necesarios.
Sincroniza las operaciones pendientes.
Gestiona conflictos.
Actualiza el estado remoto y local.
Informa de los errores que requieran intervención.
Evita duplicados, pérdida silenciosa de datos y sobrescritura de cambios realizados por otros miembros del hogar.

Define y documenta una estrategia de resolución de conflictos específica para las listas de compra.

No dependas exclusivamente de Background Sync, ya que su disponibilidad varía entre navegadores y dispositivos.

Implementa sincronización al recuperar conexión, al abrir la aplicación y mediante reintentos controlados mientras la aplicación esté activa.

100. Seguridad del almacenamiento offline
Aísla los datos almacenados localmente por usuario y hogar.

Evita que una cuenta pueda consultar datos almacenados por otra cuenta en el mismo dispositivo.

Gestiona el cierre de sesión, cambio de cuenta, eliminación de datos locales y revocación de permisos.

No almacenes innecesariamente credenciales ni información sensible.

Documenta las limitaciones de revocación de acceso mientras un dispositivo permanece desconectado.

Advierte antes de cerrar sesión si existen operaciones pendientes que podrían perderse.

No garantices persistencia local absoluta: los navegadores pueden eliminar datos almacenados bajo determinadas circunstancias.

101. Experiencia de usuario offline
Introduce indicadores discretos y comprensibles:

Sin conexión.
Cambios guardados en este dispositivo.
Cambios pendientes de sincronizar.
Sincronizando.
Todo actualizado.
No se ha podido sincronizar.
Utiliza traducciones para todos estos estados.

No bloquees toda la interfaz cuando falle una petición de red.

Permite continuar utilizando las funcionalidades disponibles.

No utilices mensajes técnicos innecesarios.

102. Pruebas de disponibilidad
Añade pruebas automatizadas mediante Playwright y las herramientas pertinentes para verificar:

Apertura de la aplicación sin conexión tras una primera carga correcta.
Consulta de recetas y menús cacheados.
Consulta de listas de compra.
Marcado de productos offline.
Incorporación de productos offline.
Persistencia tras cerrar y reabrir.
Recuperación de conexión.
Sincronización sin duplicados.
Conflictos entre dos miembros del hogar.
Caída del backend con conectividad general disponible.
Cambio de usuario.
Sesiones expiradas.
Errores de permisos.
Actualización del Service Worker con operaciones pendientes.
Verifica la compatibilidad con Safari y las particularidades de las PWA instaladas en iOS.

No declares realizadas pruebas en dispositivos físicos que no hayan sido ejecutadas realmente.

Antes de habilitar el uso familiar en producción, solicita una validación de accesibilidad durante las retransmisiones de LaLiga desde conexiones españolas.

Documenta las limitaciones conocidas y el procedimiento de migración a otro proveedor.

Actualiza CLAUDE.md, la arquitectura, los requisitos P0, el plan interno de implementación, la documentación y la Definition of Done para reflejar estas decisiones.


103. Presupuesto y optimización de costes
El presupuesto inicial de infraestructura de QuéComo es de 0 € mensuales.

Diseña, desarrolla y despliega el MVP utilizando exclusivamente los planes gratuitos de los servicios seleccionados.

Utiliza los dos proyectos gratuitos de Supabase para pruebas y producción.
Aprovecha los despliegues ilimitados de preview de Netlify.
Evita despliegues innecesarios en producción.
Supervisa el consumo de créditos de Netlify.
Optimiza y comprime las imágenes antes de almacenarlas.
Evita peticiones redundantes al backend.
Implementa estrategias eficientes de caché y sincronización.
Evita dependencias de APIs externas de pago.
Documenta las cuotas gratuitas y sus limitaciones.
Proporciona un procedimiento de copia de seguridad y recuperación.
Comprueba las limitaciones de autenticación, correo electrónico y protección de previews.
Configura alertas de consumo cuando estén disponibles.
No contrates servicios de pago ni habilites recargas automáticas sin autorización expresa.
Si alguna funcionalidad requiere superar el presupuesto, propón primero alternativas gratuitas y explica sus compromisos técnicos.

Mantén un apartado de costes y consumo en la documentación de infraestructura.

## 104. Gestión del producto y documentación compartida mediante Notion

QuéComo dispone de un espacio de trabajo existente en Notion.

Notion será el centro de gestión funcional del producto y el espacio de colaboración entre la Product Owner, el Project Manager / Technical Lead y Claude Code como Development Lead.

GitHub continuará siendo la fuente de verdad técnica del proyecto.

### Integración

Evalúa y configura Notion MCP utilizando la integración oficial y las instrucciones vigentes.

Solicita autorización cuando sea necesaria.

Limita los permisos al espacio de QuéComo siempre que sea posible.

No accedas ni modifiques páginas personales o proyectos ajenos.

Si la integración no está disponible, continúa el desarrollo y documenta el bloqueo.

### Organización del espacio

Reutiliza el espacio existente de QuéComo.

No elimines la documentación histórica ni la planificación anterior.

Archiva la metodología previa basada en sprints cuando corresponda.

Organiza el espacio activo alrededor de:

- Dashboard del proyecto.
- Estado actual.
- Roadmap.
- Funcionalidades.
- Entregas y revisiones.
- Feedback y errores.
- Decisiones.
- Documentación.
- Infraestructura y costes.
- Enlaces a producción y previews.

Coordina cualquier reorganización estructural importante con la Product Owner o el Project Manager.

### Responsabilidades de GitHub

Mantén en el repositorio:

- Código fuente.
- Especificación completa del producto.
- Arquitectura técnica.
- ADR.
- Documentación de desarrollo.
- Instrucciones de instalación local.
- Instrucciones de despliegue.
- Guías de usuario.
- Pruebas.
- Configuración.
- Historial de cambios.
- Issues y Pull Requests.

La documentación técnica versionada debe permitir desarrollar y mantener el proyecto sin depender de Notion.

### Responsabilidades de Notion

Mantén en Notion:

- Visión del producto.
- Roadmap.
- Prioridades.
- Estado funcional.
- Requisitos y criterios de aceptación.
- Entregas pendientes de revisión.
- Feedback de usuarios.
- Errores conocidos.
- Decisiones relevantes.
- Enlaces a documentación técnica.
- Enlaces a Issues, Pull Requests y previews.
- Estado de infraestructura y costes.

No dupliques innecesariamente documentación técnica extensa.

Utiliza enlaces al repositorio y resúmenes cuando corresponda.

### Seguimiento de funcionalidades

Cada funcionalidad debe poder identificarse de forma estable y relacionarse con sus Issues y Pull Requests.

Utiliza los siguientes estados funcionales:

- Backlog.
- Definida.
- En desarrollo.
- En revisión.
- Validada.
- En producción.

Mantén las prioridades P0, P1 y P2 de la especificación.

No introduzcas sprints, estimaciones artificiales ni ceremonias de gestión innecesarias.

### Entregas y revisiones

Cuando una Pull Request esté preparada para revisión, actualiza su ficha correspondiente en Notion.

Incluye:

- Funcionalidad implementada.
- Enlace real a la Pull Request.
- Enlace real a la preview.
- Resumen de cambios.
- Capturas reales cuando aporten valor.
- Instrucciones de validación.
- Criterios de aceptación.
- Resultados de pruebas.
- Limitaciones conocidas.
- Decisiones pendientes.
- Documentación actualizada.

No marques una funcionalidad como validada sin aprobación de la Product Owner.

No marques una funcionalidad como desplegada en producción sin verificar el despliegue.

### Feedback

Consulta el feedback registrado en Notion cuando se te encargue revisar o continuar una funcionalidad.

Relaciona las correcciones con los Issues y Pull Requests correspondientes.

No elimines observaciones anteriores: conserva su trazabilidad y actualiza su estado.

### Actualización del estado

Al finalizar un entregable o una sesión relevante:

1. Actualiza la documentación del repositorio.
2. Actualiza docs/STATUS.md.
3. Actualiza el estado funcional en Notion.
4. Registra las entregas pendientes de revisión.
5. Documenta bloqueos y decisiones pendientes.
6. Indica el siguiente paso recomendado.

No actualices Notion después de cada modificación menor de código.

Agrupa las actualizaciones para evitar consumo innecesario de contexto y herramientas.

### Coordinación y consistencia

GitHub es la fuente de verdad para el código, pruebas, despliegues y documentación técnica.

Notion es la fuente de verdad para prioridades, feedback, decisiones de producto y validación funcional.

Si detectas contradicciones, documéntalas y solicita aclaración cuando afecten a requisitos importantes.

No sobrescribas decisiones de producto aprobadas sin autorización.

No almacenes secretos, credenciales, tokens ni datos privados de usuarios en Notion.

No desarrolles integraciones complejas de sincronización entre Notion y GitHub salvo que exista una necesidad real y se apruebe expresamente.

La finalidad de Notion es facilitar la coordinación y la revisión del producto, no aumentar la burocracia del desarrollo.
