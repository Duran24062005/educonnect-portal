# Modulo Student

## Alcance

El rol student consume su propio rendimiento academico.

## Rutas principales

- `/my-grades`
- `/my-results`

## Pantallas

### `MyGradesPage`

Enfocada en metricas academicas por area y tendencia.

### `MyResultsPage`

Enfocada en evolucion y resumen de resultados del estudiante.

## Dependencias

Principalmente:

- analytics de estudiante
- evaluaciones consolidadas

## Riesgos conocidos

- aun existen trazas de texto o estructuras pensadas inicialmente para datos de prueba
- antes de extender estas vistas conviene confirmar que el endpoint real ya cubra la necesidad
