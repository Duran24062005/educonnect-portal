# Modulo Academic

## Alcance

Agrupa la configuracion institucional del ciclo academico.

## Entidades principales

- SchoolYear
- Period
- Grade
- Area
- Aula

## Pantallas

- `SchoolYearsPage`
- `PeriodsPage`
- `CrudPages` para grados y areas
- `AulasManagementPage`
- `PromotionsPage`

`SchoolYearsPage` permite definir la escala SIEE inicial del año: mínimo, máximo y umbral de aprobación. `PeriodsPage` permite cerrar o reabrir periodos; mientras están cerrados el backend bloquea mutaciones de calificaciones.

## Dependencias de negocio

Estas entidades alimentan despues:

- grupos
- asignacion docente
- matriculas
- evaluaciones
- analytics

## Estructura institucional

InstitutionStructurePage consume los catalogos tenant de sedes y jornadas. Permite alta, edicion y desactivacion logica. Las matriculas pueden usar esas referencias de forma opcional; el frontend no inventa compatibilidades que aun no esten definidas por la institucion.

## Regla de mantenimiento

Antes de cambiar el flujo de estructura academica, revisar impacto en:

- creacion de grupos
- asignacion grupo-area
- calculo de resultados
- dashboards anuales
