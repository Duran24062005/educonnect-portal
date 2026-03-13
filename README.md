# EduConnect Portal

Aplicacion web de EduConnect construida con React, Vite y TypeScript.

Este repositorio es independiente de `educonnect-backend`. Comparte contexto funcional y consume su API, pero no comparte historial Git, proceso de versionado ni documentacion operativa. La documentacion de este repo debe explicar como el portal esta construido y como consume contratos del backend, no como funciona internamente la API.

## Alcance del repositorio

El portal es responsable de:

- routing web y guards por autenticacion, rol y estado de cuenta
- manejo de sesion en cliente
- renderizado de dashboards, modulos y formularios
- consumo HTTP del backend mediante Axios
- cache cliente con React Query
- estado global liviano con Zustand
- build, code splitting y experiencia de carga

El portal no es responsable de:

- reglas de negocio persistentes del dominio
- validaciones finales de permisos
- calculo oficial de analytics
- almacenamiento definitivo de archivos
- definicion de modelos MongoDB

## Stack

- React 18
- Vite 7
- TypeScript
- Tailwind CSS + shadcn/ui
- React Router v6
- Axios
- Zustand
- React Query
- React Hook Form + Zod
- Sonner
- Vitest + Testing Library

## Dependencia principal

El portal consume la API de `educonnect-backend` mediante `VITE_API_URL`.

Suposiciones actuales del frontend sobre el backend:

- autenticacion con `Bearer token`
- respuesta `401` cuando la sesion deja de ser valida
- respuesta `403` cuando el usuario no puede acceder o la cuenta esta restringida
- endpoints agregados para dashboards y detalle de grupo
- rutas de archivos accesibles desde el mismo `VITE_API_URL`

Si cambia algun contrato HTTP, este repo debe actualizar su capa `src/api/`, hooks relacionados y documentacion de integracion.

## Requisitos

- Node.js 18+ recomendado
- Yarn disponible

El repo tiene `yarn.lock`, por lo que la opcion recomendada es Yarn. Si usas npm, hazlo de forma consistente dentro de tu flujo local.

## Instalacion

```bash
yarn install
cp .env.example .env
```

## Variables de entorno

Plantilla base: [`.env.example`](./.env.example)

Variable requerida:

- `VITE_API_URL`: base URL del backend, por ejemplo `http://localhost:8000`

## Desarrollo local

```bash
yarn dev
```

Servidor Vite por defecto:

- `http://localhost:3000`

## Build y preview

```bash
yarn build
yarn preview
```

La configuracion de build define `manualChunks` para separar:

- `charts-vendor`
- `ui-vendor`
- `http-vendor`
- `vendor`

Ademas, varias paginas pesadas se cargan con `lazy()`.

## Estructura principal

```text
src/
  api/            # clientes y contratos HTTP por modulo
  components/     # UI reutilizable y componentes de dominio
  hooks/          # hooks compartidos y hooks por modulo
  layouts/        # shells de autenticacion y dashboard
  lib/            # helpers de auth, errores, media y utilidades
  pages/          # pantallas por rol/modulo
  routes/         # guards y reglas de acceso
  store/          # Zustand stores
  test/           # setup y pruebas frontend
```

Entradas principales:

- `src/main.tsx`: render del root
- `src/App.tsx`: providers, router, lazy loading y mapa principal de rutas

## Routing funcional actual

Publico:

- `/`
- `/login`
- `/register`
- `/complete-profile`
- `/account-status`

Privado compartido:

- `/dashboard`
- `/profile`
- `/notifications`

Admin:

- `/users`
- `/users/pending`
- `/academic/school-years`
- `/academic/periods`
- `/academic/grades`
- `/academic/areas`
- `/academic/aulas`
- `/academic/promotions`
- `/groups`
- `/groups/:id`
- `/groups/enrollments`
- `/evaluations/stats`
- `/evaluations/stats/:school_year_id`

Teacher:

- `/my-groups`
- `/teacher/activities/:groupId/:areaId`
- `/groups/:id/grade-items`
- `/groups/:id/scores`
- `/period-results`

Student:

- `/my-activities`
- `/my-activities/:activityId`
- `/my-grades`
- `/my-results`

## Autenticacion y estado

Estado global principal:

- `src/store/auth.ts`: token, user, person e inicializacion
- `src/store/admin-ui.ts`: estado UI administrativo

Comportamiento actual:

- el token se persiste en `localStorage`
- `initialize()` consulta `/me` al cargar la app si existe token
- `401` limpia sesion y redirige a `/login`
- `403` conserva contexto minimo de estado y muestra mensaje al usuario

Guards clave:

- `PublicOnlyRoute`
- `IncompleteProfileRoute`
- `ProfileCompleteGuard`
- `RoleRoute`
- `AccountStatusRoute`

## Integracion HTTP

Cliente principal:

- `src/api/axios.ts`

Reglas importantes:

- agrega `Authorization: Bearer <token>` automaticamente cuando existe token
- centraliza manejo de errores `400`, `401` y `403`
- usa `VITE_API_URL` como `baseURL`

Modulos API actuales:

- `auth`
- `users`
- `students`
- `academic`
- `groups`
- `evaluations`
- `analytics`
- `activities`
- `notifications`

## Performance y carga

Optimizaciones ya incorporadas:

- `lazy loading` en rutas privadas pesadas
- React Query para cache compartido
- hooks dedicados para school years, dashboard summaries y group detail summary
- build dividido en vendors y paginas
- notificaciones in-app via REST con refetch; esta v1 no usa WebSockets

Ejemplos de hooks relevantes:

- `src/hooks/useSchoolYears.ts`
- `src/hooks/useDashboardSummary.ts`
- `src/hooks/useGroupDetailSummary.ts`

## Testing

Comandos disponibles:

```bash
yarn test
yarn test:watch
```

Base actual:

- Vitest
- Testing Library
- `src/test/setup.ts`

## Documentacion interna

Lectura recomendada:

1. [`docs/frontend/README.md`](./docs/frontend/README.md)
2. [`docs/frontend/repository-context.md`](./docs/frontend/repository-context.md)
3. [`docs/frontend/architecture.md`](./docs/frontend/architecture.md)
4. [`docs/frontend/routing-and-auth.md`](./docs/frontend/routing-and-auth.md)
5. [`docs/frontend/api-integration.md`](./docs/frontend/api-integration.md)

## Convenciones operativas

- Si cambia un endpoint consumido, actualizar `src/api`, hooks afectados y documentacion.
- Si cambia una regla de acceso visual, actualizar guards y documentacion del frontend.
- Si el cambio pertenece a negocio o persistencia, documentarlo primero en `educonnect-backend`.
- No asumir despliegue sincronizado con el backend; los cambios con ruptura de contrato deben coordinarse explicitamente.
