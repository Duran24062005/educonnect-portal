# Portal global de SuperAdmin

## Objetivo

El portal comparte autenticación con EduConnect, pero presenta una experiencia separada para operadores globales. Un `SuperAdmin` entra a `/platform/institutions` y nunca navega por el dashboard académico de una institución.

## Consumo API

`src/api/platform.ts` encapsula:

- listado paginado y filtros por nombre/código, tipo y estado;
- detalle de institución;
- creación con `institution` y `primary_admin` anidados;
- edición de datos básicos;
- asignación del primer administrador para instituciones legacy sin administrador;
- activación/suspensión;
- reenvío de invitación.

Las mutaciones invalidan el listado y el detalle seleccionado mediante React Query. Los errores de la API se muestran como mensajes de operación, sin ocultar duplicados o transiciones inválidas.

## Rutas y guards

- `/platform/institutions`: `ProfileCompleteGuard` + `RoleRoute(['superadmin'])`.
- Un administrador institucional, docente, estudiante o acudiente es redirigido a su landing institucional.
- Un SuperAdmin que intenta abrir rutas académicas es redirigido al panel global.

`PlatformLayout` no consulta notificaciones ni datos institucionales. Esto evita llamadas tenant inválidas para una cuenta sin `institution_id`.

## UX

La pantalla usa una identidad de operaciones de plataforma: encabezado oscuro de alto contraste, acento cian, listado de clientes y ficha lateral del administrador principal. El alta se realiza en un diálogo responsive con etiquetas visibles, estados de carga, confirmación de suspensión y mensajes de invitación.

Las sedes y jornadas no forman parte de este formulario; el administrador del cliente las configura posteriormente en su portal.
