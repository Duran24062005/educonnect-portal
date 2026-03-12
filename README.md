# EduConnect Portal (Frontend)

Frontend LMS para **EduConnect** construido con React + Vite + TypeScript, conectado al backend real:

`https://educonnect-backend-rouge.vercel.app/`

## Stack

- React 18 + Vite
- Tailwind CSS + shadcn/ui
- Zustand (estado global de autenticación)
- Axios (interceptores para `Bearer`, `401`, `403`)
- React Router v6 (guards por autenticación/rol)
- React Hook Form + Zod
- Sonner (toasts)
- React Query (cache compartido y refetch controlado)

## Requisitos

- Node.js 18+
- npm 9+

## Instalación

```bash
npm install
```

## Variables de entorno

Crear archivo `.env`:

```env
VITE_API_URL=https://educonnect-backend-rouge.vercel.app
```

## Ejecutar en desarrollo

```bash
npm run dev
```

## Build de producción

```bash
npm run build
npm run preview
```

## Notas de rendimiento

- Las pantallas privadas pesadas se cargan con `lazy loading`.
- Dashboard, grupos y estadisticas usan endpoints agregados y hooks con React Query para reducir requests repetidas.
- El build esta dividido en chunks de paginas y vendors para evitar que todo el panel entre al bundle inicial.

## Documentacion interna

La documentacion tecnica del frontend vive en:

- `docs/frontend/README.md`

Lectura recomendada para onboarding:

1. `docs/frontend/architecture.md`
2. `docs/frontend/routing-and-auth.md`
3. `docs/frontend/api-integration.md`
4. `docs/frontend/modules/*.md`
5. `docs/frontend/adrs/*.md`

## Flujo de autenticación

1. Registro inicial (`/register`) con email y contraseña.
2. Completar perfil (`/complete-profile`) con token activo.
3. Login (`/login`) y sesión persistida en `localStorage`.
4. Guards de rutas:
- `Private/ProfileComplete`: exige token y perfil completo
- `RoleRoute`: restringe por `Admin | Teacher | Student`
- `IncompleteProfileRoute`: permite completar perfil antes del dashboard

## Módulos implementados

### Público
- `/login`
- `/register`
- `/complete-profile`

### Admin
- `/dashboard`
- `/users`
- `/users/pending`
- `/academic/school-years`
- `/academic/periods`
- `/academic/grades`
- `/academic/areas`
- `/academic/aulas`
- `/groups`
- `/groups/:id`
- `/evaluations/stats`
- `/evaluations/stats/:school_year_id`

### Teacher
- `/my-groups`
- `/groups/:id/grade-items`
- `/groups/:id/scores`
- `/period-results`

### Student
- `/my-grades`
- `/my-results`

### Compartida
- `/profile`

## Notas

- El interceptor request agrega `Authorization: Bearer <token>` automáticamente.
- Respuestas `401` limpian sesión y redirigen a `/login`.
- Respuestas `403` muestran toast de "Sin permisos".
- La mayoría de vistas incluye estados de carga (skeleton/spinner), validación y mensajes de error del backend.
