# Módulo Asistencia

## Alcance

El módulo permite a `admin` y `teacher` crear sesiones de asistencia por grupo y marcar el estado de cada estudiante con matrícula activa. El dashboard familiar muestra el resumen de cada estudiante autorizado.

## Rutas

- `/attendance`: operación de sesiones para administración y docentes.
- `/dashboard`: sección de asistencia por estudiante para `parent`/`guardian`.

## Flujo operativo

1. Seleccionar año, grupo, fecha y opcionalmente periodo o área.
2. Crear la sesión, que se inicializa con estudiantes matriculados activamente.
3. Marcar `Presente`, `Ausente`, `Tarde`, `Justificada` o `Pendiente`.
4. Escribir una justificación cuando el estado sea `Justificada`.
5. Guardar y cerrar la sesión. Una sesión cerrada queda bloqueada para docentes.

## Contratos

La capa `src/api/attendance.ts` consume las rutas de asistencia del backend y `/api/guardians/me/attendance`. React Query mantiene separadas las consultas de lista, detalle y resumen familiar. Administración puede descargar el reporte CSV filtrado por año y grupo desde la misma pantalla.

## Límites actuales

No hay todavía aprobación de justificaciones, alertas automáticas por inasistencia, reportes de matrícula/calificaciones, jobs programados ni sincronización directa con sesiones del calendario.
