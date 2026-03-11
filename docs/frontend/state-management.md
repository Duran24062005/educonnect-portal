# State Management

## Estrategia actual

El proyecto usa tres niveles de estado:

1. Zustand para estado global pequeno y transversal.
2. React Query para algunos flujos remotos con cache.
3. `useState` y `useEffect` para estado local de pantalla.

No existe un store global unico para todo el negocio.

## Zustand

### `src/store/auth.ts`

Es el store mas importante del portal.

Se usa para:

- sesion
- usuario autenticado
- perfil personal
- bootstrap de autenticacion

### `src/store/admin-ui.ts`

Se usa para estado UI que no justifica persistencia remota ni store de negocio grande.

## React Query

Se usa sobre todo en hooks admin como:

- `src/hooks/admin/useAdminGroups.ts`
- `src/hooks/admin/useAdminAulas.ts`
- `src/hooks/admin/useAdminPendingUsers.ts`
- `src/hooks/admin/useAdminPromotions.ts`

Patron:

- `useQuery` para lectura con cache
- `useMutation` para escritura
- `invalidateQueries` para refrescar datos afectados

## Estado local en paginas

Sigue siendo el patron dominante.

Ejemplos:

- filtros seleccionados
- dialogs abiertos
- tablas cargando
- estados derivados del payload

Esto simplifica algunas pantallas, pero hace que archivos grandes concentren demasiada responsabilidad.

## Cuando usar cada cosa

### Usar Zustand si

- el dato se comparte entre muchas rutas
- el dato define navegacion o permisos
- el dato debe sobrevivir cambio de pagina

### Usar React Query si

- el estado es remoto
- conviene cachear
- conviene invalidar despues de mutaciones

### Usar estado local si

- el dato solo vive dentro de una pagina
- el ciclo de vida depende del montaje de la vista
- no hace falta compartirlo

## Problema actual

La base del proyecto mezcla dos estilos:

- vistas nuevas o refactorizadas con hooks reutilizables y React Query
- vistas antiguas o intermedias con fetch manual

Esto no es necesariamente incorrecto, pero debe tenerse en cuenta antes de refactorizar.

## Recomendacion

Si una vista empieza a tener:

- multiples requests
- transformaciones repetidas
- invalidaciones tras mutaciones

conviene mover la logica a un hook del dominio.
