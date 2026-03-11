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

## Dependencias de negocio

Estas entidades alimentan despues:

- grupos
- asignacion docente
- matriculas
- evaluaciones
- analytics

## Regla de mantenimiento

Antes de cambiar el flujo de estructura academica, revisar impacto en:

- creacion de grupos
- asignacion grupo-area
- calculo de resultados
- dashboards anuales
