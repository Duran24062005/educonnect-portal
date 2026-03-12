# Modulo Admin

## Alcance

El rol admin concentra configuracion institucional y operacion academica.

## Rutas principales

- `/dashboard`
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

## Subdominios

### Usuarios

Pantallas:

- `src/pages/users/UsersPage.tsx`
- `src/pages/users/PendingUsersPage.tsx`

Objetivo:

- administrar usuarios
- aprobar o rechazar pendientes
- revisar estado general de cuentas

### Estructura academica

Pantallas:

- `SchoolYearsPage`
- `PeriodsPage`
- `CrudPages` para grados y areas
- `AulasManagementPage`
- `PromotionsPage`

Objetivo:

- configurar la estructura base del anio escolar
- definir periodos, grados, areas y aulas

### Grupos y matriculas

Pantallas:

- `GroupsPage`
- `GroupDetailPage`
- `EnrollmentsPage`

Objetivo:

- crear grupos por anio y grado
- asignar docentes
- matricular estudiantes
- mover estudiantes entre grupos
- asignar aula

### Analitica institucional

Pantalla:

- `EvaluationStatsPage`

Objetivo:

- mostrar resumen anual o por periodo
- comparar desempeno por grado y area

Integracion optimizada actual:

- `dashboard` usa `analytics/admin/dashboard-summary`
- `EvaluationStatsPage` reutiliza el mismo resumen agregado y solo mantiene aparte `evaluations/stats`
- `schoolYears` debe venir de `useSchoolYears`

## Patrones del modulo

- varios hooks admin usan React Query
- varias tablas hacen normalizacion manual del payload
- gran parte del negocio depende de contratos precisos del backend
- dashboard y estadisticas ya no deben reconstruirse desde multiples requests independientes si existe endpoint agregado

## Riesgos conocidos

- las entidades academicas tienen dependencias cruzadas fuertes
- un cambio pequeno en IDs o payloads del backend puede romper matriculas o asignaciones
