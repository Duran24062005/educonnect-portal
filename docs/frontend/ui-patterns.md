# UI Patterns

## Layouts

### `AuthLayout`

Se usa para vistas publicas o de entrada.

### `DashboardLayout`

Es la base de casi toda la aplicacion privada.

Incluye:

- sidebar
- cabecera
- menu de usuario
- zona principal de contenido

## Sidebar y navegacion

Archivo principal: `src/components/AppSidebar.tsx`

La sidebar cambia por rol:

- admin
- teacher
- student

La seleccion visual se calcula con `pathname` actual.

## Componentes base

Los componentes de `src/components/ui/*` son wrappers de Radix o piezas base estilizadas.

Regla operativa:

- si ya existe un `Select`, `Table`, `Dialog` o `Button` en `ui`, reusarlo
- no mezclar componentes HTML crudos con nuevas variantes visuales sin necesidad

## Patrones visuales repetidos

- `Card` para agrupar funcionalidad
- `Skeleton` para carga
- `Badge` para estado
- `Table` para listados administrativos
- `Select` para filtros de dominio
- `toast` de Sonner para feedback

## Graficas

Actualmente hay dos caminos:

- `src/components/charts/LightweightCategoryChart.tsx` para graficas ligeras con categorias
- componentes sobre Recharts en `components/ui/chart.tsx`

Recomendacion:

- si la grafica es comparativa y simple, usar el componente ligero ya existente
- si requiere composicion mas compleja, usar Recharts

## Formularios

El proyecto ya tiene dependencias para `react-hook-form` y `zod`, pero no todas las vistas las usan.

Estado actual:

- algunos formularios usan manejo manual
- otros usan validacion mas estructurada

No asumir un patron unico.

## Mensajeria al usuario

Se usa `sonner`.

Reglas informales que ya existen:

- errores de request: toast error
- operaciones exitosas: toast success
- errores de permisos: el interceptor puede intervenir antes que la pagina

## Deuda tecnica conocida

- existe mezcla entre componentes muy reutilizables y pantallas con mucho markup embebido
- algunas vistas de negocio son largas y todavia no estan partidas en subcomponentes
