# 0003 · Autorización con RLS + RPC SECURITY DEFINER

**Contexto.** Los datos de cada hogar deben estar aislados y los cambios de pertenencia/rol no pueden depender del cliente (§26, §47).

**Decisión.** RLS en todas las tablas, `revoke all` + grants mínimos (por columna en `UPDATE`). Lecturas mediante políticas con funciones auxiliares `SECURITY DEFINER` (evitan recursión). Toda escritura de pertenencia, invitaciones y propiedad pasa por RPC `SECURITY DEFINER` con `search_path=''`, validación de `auth.uid()`, rol y parámetros, bloqueos de fila y errores `QC_*` traducibles. Tokens de invitación solo como hash SHA-256.

**Consecuencias.** El linter de Supabase marca las RPC como ejecutables por `authenticated` (intencionado). Cada RPC nueva requiere pruebas de integración con usuarios reales (`tests/integration`).
