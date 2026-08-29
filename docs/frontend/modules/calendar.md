# Módulo Calendar

## Alcance

El calendario muestra `ClassSession` materializadas por el backend. El portal no crea sesiones: administración configura `TeachingAssignment` y `ScheduleEntry`, publica el horario y el sistema genera las ocurrencias. El docente prepara el `LessonPlan` de sus clases; estudiantes y acudientes solo consultan el contenido autorizado.

## Rutas

- `/calendar`: vista semanal y agenda para `admin`, `teacher`, `student` y `parent`.
- `/dashboard`: el dashboard del estudiante incluye la próxima clase.

## Capas

- `src/api/calendar.ts`: tipos de sesiones, permisos y selector entre proveedor demo/API.
- `src/api/teachingAssignments.ts`: asignaciones docentes administrativas.
- `src/api/lessonPlans.ts`: lectura y edición de planeaciones docentes.
- `src/api/schedule.ts`: horarios y entradas canónicas.
- `src/api/calendarDemo.ts`: fixtures y filtros locales de la demo.
- `src/lib/calendar-utils.ts`: rangos semanales, posición de sesiones y próxima clase.
- `src/pages/CalendarPage.tsx`: composición de filtros, navegación, permisos y estado de la vista.
- `src/components/calendar/`: cuadrícula semanal, agenda, detalle de sesión y tarjeta del estudiante.

## Fuente de datos

Por defecto se usa el proveedor demo. Para usar la API persistente se puede establecer:

```bash
VITE_CALENDAR_DATA_SOURCE=api
```

El proveedor API usa `/api/calendar/catalog`, `/api/calendar`, `/api/calendar/me`, `/api/calendar/sessions/:id`, `/api/teaching-assignments`, `/api/calendar/schedules/:id/entries`, `/api/calendar/exceptions`, `/api/lesson-plans/session/:sessionId` y `/api/lesson-plans`. El backend valida la matrícula, las asignaciones docentes, la ventana semanal publicada del grupo y los conflictos de docente, grupo y aula.

El detalle de sesión nunca presenta un formulario de programación. Los datos de grupo, área, docente, aula, fecha y hora aparecen como administrados por la institución. Para docentes, la única edición disponible es el `LessonPlan` mediante guardar borrador o marcar como completa.

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
- `teacher`: consulta sus sesiones asignadas y crea/edita únicamente sus `LessonPlan`.
- `admin`: administra asignaciones, entradas del horario, publicación y excepciones; consulta y filtra sesiones.
- `parent`: consulta únicamente sesiones de grupos con estudiantes vinculados y matrícula activa; no puede editar.

Estos identificadores son únicamente fixtures. La API debe resolver el alcance por matrícula y asignación docente, no por estos valores.

## Decisiones de UX

- La semana es la vista operativa en escritorio.
- La agenda es la vista legible en móvil.
- Las sesiones canceladas permanecen visibles y no se consideran próxima clase; las correcciones administrativas se realizan mediante horario y excepciones.
- Las sesiones fuera de la disponibilidad solo se crean mediante la ruta de excepciones administrativa y requieren motivo.
- Las actividades se muestran como resumen relacionado por grupo y materia; no se crea todavía `activity.session_id`.
- El detalle de cada sesión consulta los materiales educativos asociados mediante el módulo `/api/materials`; los materiales no se embeben en la respuesta de la vista semanal.

## Compatibilidad legacy

La API conserva `topic`, `schedule_slot_id` y `WeeklySchedule.slots` para leer datos históricos. El portal no usa esos campos para iniciar sesiones ni para editar la programación. Los materiales se asocian a una sesión ya existente y no pueden crear una clase desde su formulario.
