# Módulo Calendar

## Alcance

El calendario demo muestra sesiones de clase concretas y está preparado para cambiar a la API sin modificar las vistas.

## Rutas

- `/calendar`: vista semanal y agenda para `admin`, `teacher` y `student`.
- `/dashboard`: el dashboard del estudiante incluye la próxima clase.

## Capas

- `src/api/calendar.ts`: tipos canónicos y selector entre proveedor demo/API.
- `src/api/calendarDemo.ts`: fixtures, filtros y mutaciones locales de la demo.
- `src/lib/calendar-utils.ts`: rangos semanales, posición de sesiones y próxima clase.
- `src/pages/CalendarPage.tsx`: composición de filtros, navegación, permisos y estado de la vista.
- `src/components/calendar/`: cuadrícula semanal, agenda, detalle/formulario y tarjeta del estudiante.

## Fuente de datos

Por defecto se usa el proveedor demo. Para preparar la integración futura se puede establecer:

```bash
VITE_CALENDAR_DATA_SOURCE=api
```

El proveedor API espera los endpoints definidos en `educonnect-backend/prds/013-calendar-class-schedule.md`.

El componente visual trabaja con `CalendarSession`, que usa nombres en `camelCase`. La normalización de respuestas backend con `snake_case` vive en `src/api/calendar.ts`.

## Permisos demo

- `student`: consulta las sesiones del grupo demo `7A`; no edita.
- `teacher`: consulta y edita sesiones del docente demo `Daniel Vargas`.
- `admin`: consulta todas las sesiones y puede crear, editar, cancelar y filtrar.

Estos identificadores son únicamente fixtures. La API debe resolver el alcance por matrícula y asignación docente, no por estos valores.

## Decisiones de UX

- La semana es la vista operativa en escritorio.
- La agenda es la vista legible en móvil.
- Las sesiones canceladas permanecen visibles y no se consideran próxima clase.
- Admin y docente autorizado pueden reactivar una sesión cancelada; la demo conserva todos sus datos y cambia el estado a `scheduled`.
- Las actividades se muestran como resumen relacionado por grupo y materia; no se crea todavía `activity.session_id`.
