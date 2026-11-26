# 0004 · Idioma: el perfil es la fuente de verdad

**Contexto.** §88–§92: idioma individual persistente, sin parpadeos, cambiable antes de registrarse, sin filtrarse entre cuentas del mismo dispositivo.

**Decisión.** `profiles.locale` (check `es-ES`/`en-GB`). Copia en el dispositivo (`qc.locale`) solo para el arranque y las pantallas sin sesión. Al iniciar sesión se aplica el idioma del perfil y se sobrescribe la copia local. El idioma elegido antes del registro viaja como metadato y el trigger lo valida.

**Consecuencias.** Si el guardado remoto falla, la UI cambia igualmente y se informa al usuario. Los datos introducidos por usuarios nunca se traducen; las etiquetas predefinidas usan claves estables (`preset_key`).
