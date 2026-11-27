# Copias de seguridad y restauración

Estado: **no hay copias automáticas configuradas** (plan gratuito). Procedimiento manual hasta que haya datos reales en producción.

## Base de datos (manual, semanal y antes de cada migración de producción)

Requiere la CLI de Supabase y la cadena de conexión (Project Settings → Database). No requiere Docker.

```bash
npx supabase db dump --db-url "$PROD_DB_URL" -f backups/$(date +%F)-schema.sql
npx supabase db dump --db-url "$PROD_DB_URL" --data-only -f backups/$(date +%F)-data.sql
```

Guardar los archivos fuera del repositorio (están en `.gitignore`), en un almacenamiento personal cifrado.

## Imágenes (cuando existan)

Descargar el bucket de fotos con la CLI/API de Storage o desde el panel. Procedimiento detallado con el módulo de recetas.

## Restauración

Sobre un proyecto **nuevo o de pruebas**, nunca directamente sobre producción con datos: `psql "$TARGET_DB_URL" -f <schema>.sql` y después `-f <data>.sql`. Verificar con la app apuntando a ese proyecto antes de cambiar nada en producción.

## Exportación por usuario

Prevista en Perfil → Privacidad (P1). Mientras tanto, la administradora puede exportar los datos de un hogar con SQL bajo petición.
