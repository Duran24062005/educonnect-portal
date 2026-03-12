# Modulo Teacher

## Alcance

El rol teacher opera sobre grupos asignados, calificaciones y resultados por periodo.

## Rutas principales

- `/my-groups`
- `/groups/:id/grade-items`
- `/groups/:id/scores`
- `/period-results`

## Pantallas

### `MyGroupsPage`

Responsabilidad:

- listar grupos reales del docente
- mostrar metricas por grupo y area
- mostrar detalle por estudiante

Dependencias:

- `analytics/teacher/me/dashboard-summary`
- `analytics/teacher/me/student-detail`

Nota de rendimiento:

- desde marzo de 2026, `MyGroupsPage` usa un resumen agregado por docente y anio escolar
- los graficos por grupo ya no deben disparar una request separada por asignacion al entrar a la pagina

### `GroupGradeItemsPage`

Responsabilidad:

- crear y administrar items de evaluacion por grupo, periodo y area

### `GroupScoresPage`

Responsabilidad:

- registrar notas por item
- consultar notas ya registradas

### `PeriodResultsPage`

Responsabilidad:

- calcular resultados de periodo por estudiante y area
- consultar consolidados de periodo

## Riesgos conocidos

- algunas pantallas de docente siguen cargando todas las areas del sistema en lugar de limitarse a las areas asignadas al profesor
- si no existen resultados consolidados (`periodAreaResult` o `finalResult`), las graficas pueden verse vacias sin que exista bug en frontend
- el detalle de estudiante sigue siendo carga diferida y se consulta solo para la seleccion activa

## Regla de negocio critica

Para docente, `group_id + area_id` es la combinacion importante. No basta con saber el grupo.
