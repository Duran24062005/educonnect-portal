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
