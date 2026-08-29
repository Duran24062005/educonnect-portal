# Módulo Materials

## Alcance

El módulo permite publicar y consultar guías, documentos, archivos de cualquier tipo y enlaces asociados a sesiones de clase.

## Rutas

- `/materials`: vista para docentes y estudiantes.

## Roles

- `teacher`: administra materiales de sus sesiones y puede crear una sesión desde el formulario.
- `student`: consulta materiales de su grupo y año escolar activo.

## Flujo docente

1. Seleccionar una sesión existente o crearla con el diálogo del calendario.
2. Registrar título, descripción y archivo o enlace.
3. Editar metadatos, sesión, tema y recurso desde la tarjeta del material.
4. Eliminar el material cuando ya no deba estar disponible.

El tema pertenece a la sesión (`ClassSession`) y no se copia en `Material`. Los cambios se reflejan en el calendario y en todos los materiales asociados.

## Flujo estudiante

Los estudiantes ven los materiales de sus sesiones en `/materials`. También pueden abrirlos desde el detalle de una sesión en `/calendar`. Los archivos usan URLs firmadas y los enlaces se abren en una pestaña nueva.

## Integración API

Las llamadas viven en `src/api/materials.ts`. Los filtros se envían por `group_id`, `area_id` y `session_id` cuando corresponda. La vista usa React Query para invalidar el listado después de crear, editar o eliminar.

## Estados y accesibilidad

- Mostrar estados de carga y error recuperable.
- Los archivos y enlaces deben tener etiquetas con el nombre del recurso.
- Los botones destructivos requieren confirmación.
- La interfaz debe conservar foco visible y funcionar en móvil.
