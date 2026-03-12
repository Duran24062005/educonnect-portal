# Modulo Groups

## Alcance

Este modulo conecta la organizacion academica con la operacion diaria.

## Pantallas involucradas

- `src/pages/groups/GroupsPage.tsx`
- `src/pages/groups/GroupDetailPage.tsx`
- `src/pages/admin/EnrollmentsPage.tsx`

## Responsabilidades

- listar grupos por anio escolar
- mostrar capacidad y cupos disponibles
- ver estudiantes y docentes asignados
- asignar docentes por area
- matricular estudiantes
- trasladar estudiantes
- asignar aula al estudiante

## Regla tecnica importante

No confundir:

- capacidad maxima del grupo
- matriculas activas
- cupos disponibles

La capacidad no se decrementa en base de datos; se calcula por diferencia entre `max_capacity` y matriculas activas.

## Integraciones criticas

- `groups`
- `enrollments`
- `students`
- `users by role`
- `academic areas`

Integracion optimizada actual:

- `GroupDetailPage` usa `GET /api/groups/:group_id/detail-summary`
- el objetivo es cargar grupo, estudiantes, docentes, areas y opciones de docentes en una sola respuesta
- despues de asignar docente o area, la vista invalida ese resumen y recarga una sola query

## Riesgo historico documentado

Hubo inconsistencias entre `_id` de `User` y `_id` de `Student` o `Teacher`.

Antes de tocar este modulo, validar siempre que ID espera el backend.
