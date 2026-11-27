# 0001 · PWA con React + Vite + Supabase

**Contexto.** La planificación anterior usaba Expo/React Native. La especificación (§39–§41) cambia a PWA para desplegar por URL, instalar en iPhone/Android sin tiendas y mantener 0 €/mes.

**Decisión.** SPA React 19 + TypeScript strict + Vite, React Router, Tailwind 4 con tokens, primitivas Radix y componentes propios al estilo shadcn (copiados en el repo, sin CLI), TanStack Query, React Hook Form + Zod, i18next, vite-plugin-pwa. Backend administrado Supabase. Sin Next.js, Redux ni backend propio.

**Consecuencias.** Reutilizable en un futuro cliente nativo (Capacitor/Expo) porque el dominio y el acceso a datos están separados de la UI. Las versiones mayores recientes (Vite 8, React Router 8, Zod 4) se fijan en el lockfile; TypeScript se mantiene en 5.9 porque `typescript-eslint` aún no soporta TS 7. React Router 8 exige Node ≥ 22.22.
