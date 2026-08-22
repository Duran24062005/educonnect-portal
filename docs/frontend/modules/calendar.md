# Módulo Calendar

## Alcance

El calendario muestra sesiones de clase concretas y puede operar con fixtures demo o con la API persistente sin modificar las vistas.

## Rutas

- `/calendar`: vista semanal y agenda para `admin`, `teacher`, `student` y `parent`.
- `/dashboard`: el dashboard del estudiante incluye la próxima clase.

## Capas

- `src/api/calendar.ts`: tipos canónicos y selector entre proveedor demo/API.
- `src/api/calendarDemo.ts`: fixtures, filtros y mutaciones locales de la demo.
- `src/lib/calendar-utils.ts`: rangos semanales, posición de sesiones y próxima clase.
- `src/pages/CalendarPage.tsx`: composición de filtros, navegación, permisos y estado de la vista.
- `src/components/calendar/`: cuadrícula semanal, agenda, detalle/formulario y tarjeta del estudiante.

## Fuente de datos

Por defecto se usa el proveedor demo. Para usar la API persistente se puede establecer:

```bash
VITE_CALENDAR_DATA_SOURCE=api
```

El proveedor API usa `/api/calendar/catalog`, `/api/calendar`, `/api/calendar/me` y `/api/calendar/sessions`. El backend valida la matrícula, las asignaciones docentes y los conflictos de docente, grupo y aula. El contrato completo está en `educonnect-backend/prds/013-calendar-class-schedule.md`.

El componente visual trabaja con `CalendarSession`, que usa nombres en `camelCase`. La normalización de respuestas backend con `snake_case` vive en `src/api/calendar.ts`.

## Diagnóstico local

La ruta `/calendar` es privada. El portal primero valida el token con `GET /api/auth/me`; una sesión ausente, expirada o revocada produce una redirección a `/login` antes de montar la pantalla.

Para validar el proveedor visual demo sin depender de los endpoints de calendario:

```bash
VITE_CALENDAR_DATA_SOURCE=demo yarn dev --host 127.0.0.1 --port 3000
```

El modo demo no elimina la autenticación global: la ruta sigue requiriendo un usuario válido porque `/calendar` es privada. La cobertura aislada de `CalendarPage` permite probar el renderizado sin una sesión real.

Para validar la integración persistente, el backend debe estar disponible en `VITE_API_URL`, el usuario debe tener un perfil completo y el token debe conservar permisos sobre el rol consultado. Un error de catálogo o sesiones muestra el estado `No se pudo cargar el calendario`; `Reintentar` vuelve a consultar ambas fuentes.

## Permisos demo

- `student`: consulta las sesiones del grupo demo `7A`; no edita.
- `teacher`: consulta y edita sesiones del docente demo `Daniel Vargas`.
- `admin`: consulta todas las sesiones y puede crear, editar, cancelar y filtrar.
- `parent`: consulta únicamente sesiones de grupos con estudiantes vinculados y matrícula activa; no puede editar.

Estos identificadores son únicamente fixtures. La API debe resolver el alcance por matrícula y asignación docente, no por estos valores.

## Decisiones de UX

- La semana es la vista operativa en escritorio.
- La agenda es la vista legible en móvil.
- Las sesiones canceladas permanecen visibles y no se consideran próxima clase.
- Admin y docente autorizado pueden reactivar una sesión cancelada; la demo conserva todos sus datos y cambia el estado a `scheduled`.
- Las actividades se muestran como resumen relacionado por grupo y materia; no se crea todavía `activity.session_id`.
