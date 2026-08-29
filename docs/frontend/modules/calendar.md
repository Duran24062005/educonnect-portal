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

El proveedor API usa `/api/calendar/catalog`, `/api/calendar`, `/api/calendar/me`, `/api/calendar/sessions` y `/api/calendar/exceptions`. El backend valida la matrícula, las asignaciones docentes, la ventana semanal publicada del grupo y los conflictos de docente, grupo y aula. El contrato de disponibilidad está en `educonnect-backend/prds/037-weekly-group-availability.md`.

Al crear una sesión como docente, el diálogo consulta `/api/calendar/schedules/me` y muestra los bloques publicados asignados al docente. Seleccionar un bloque completa grupo, materia, aula y rango horario; la fecha se ajusta al día del bloque y se rechaza antes de enviar si no coincide. Si el horario publicado solo tiene ventanas generales, se muestran los rangos disponibles por grupo.

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
- `teacher`: consulta sus sesiones y registra clases dentro de la disponibilidad publicada de sus grupos.
- `admin`: configura disponibilidad por grupo y días lectivos; consulta, crea, edita, cancela y filtra sesiones.
- `parent`: consulta únicamente sesiones de grupos con estudiantes vinculados y matrícula activa; no puede editar.

Estos identificadores son únicamente fixtures. La API debe resolver el alcance por matrícula y asignación docente, no por estos valores.

## Decisiones de UX

- La semana es la vista operativa en escritorio.
- La agenda es la vista legible en móvil.
- Las sesiones canceladas permanecen visibles y no se consideran próxima clase.
- Administración puede reactivar una sesión cancelada; las sesiones docentes quedan vinculadas a su ventana publicada y no se proyectan como ocurrencias virtuales.
- Las sesiones fuera de la disponibilidad solo se crean mediante la ruta de excepciones administrativa y requieren motivo.
- Las actividades se muestran como resumen relacionado por grupo y materia; no se crea todavía `activity.session_id`.
- El detalle de cada sesión consulta los materiales educativos asociados mediante el módulo `/api/materials`; los materiales no se embeben en la respuesta de la vista semanal.
