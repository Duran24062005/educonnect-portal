# Modulo Familia

## Alcance

El rol `parent` (incluye `guardian` normalizado) usa el dashboard familiar para consultar estudiantes vinculados a su cuenta.

## Pantalla

`/dashboard` renderiza `GuardianDashboard` cuando el rol normalizado es `parent`.

La pantalla:

- carga el año escolar disponible y permite cambiarlo;
- muestra una tarjeta por cada estudiante autorizado;
- conserva visibles todos los estudiantes aunque se seleccione otro para el detalle;
- muestra promedio, estado, áreas, periodos y grupo del estudiante seleccionado;
- muestra resumen de asistencia de cada estudiante autorizado;
- permite consultar el boletín básico del estudiante seleccionado desde `/family/bulletins`;
- permite consultar el calendario persistente de los grupos de sus estudiantes desde `/calendar`;
- recibe anuncios institucionales o docentes dirigidos a su cuenta desde `/notifications`;
- representa un estado vacío cuando no existen vínculos autorizados.

## Contrato

La capa `src/api/guardians.ts` consume:

- `GET /api/guardians/me/students`;
- `GET /api/guardians/me/dashboard?school_year_id=...`.
- `GET /api/guardians/me/attendance?school_year_id=...`.
- `GET /api/guardians/me/bulletin?school_year_id=...&period_id=...&student_id=...`.

La API del portal normaliza el payload académico reutilizando los tipos de `src/api/analytics.ts`.

## Límites actuales

Esta primera versión no expone todavía boletines oficiales firmados, documentos, solicitudes ni filtros avanzados de calendario familiar. Tampoco administra vínculos desde el portal: la asociación debe existir en el backend antes de que el acudiente vea estudiantes.
