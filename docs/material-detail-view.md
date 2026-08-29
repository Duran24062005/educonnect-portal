# Vista de detalle de materiales

## Problema y objetivo

La tarjeta de materiales resumía el recurso y mezclaba dos acciones distintas: consultar la información y abrir el archivo o enlace. La nueva vista permite revisar el contexto completo del material antes de abrirlo.

## Alcance

- Las tarjetas de `/materials` son navegables con clic, `Enter` o `Space`.
- Los materiales mostrados dentro del diálogo del calendario también llevan a la vista de detalle.
- La pantalla está disponible para docentes y estudiantes en `/materials/:materialId`.
- Se muestran título, tipo de recurso, descripción, archivo o enlace, tamaño, fechas de publicación, sesión, fecha, horario, grupo, grado, materia y docente.

## Implementación

La pantalla vive en `src/pages/MaterialDetailPage.tsx` y se carga de forma diferida desde `src/App.tsx`. Para estudiantes se consulta el detalle autorizado del backend. Para docentes se reutiliza el listado autorizado y se localiza el material solicitado.

La acción de abrir o descargar el recurso conserva una pestaña nueva y no navega accidentalmente al detalle cuando se pulsa desde una tarjeta.

## Permisos y estados

- El guard de ruta limita la pantalla a los roles `teacher` y `student`.
- El backend sigue siendo responsable de autorizar el material.
- Se contemplan ID inválido, material inexistente, falta de permisos, carga y recurso sin URL.

## Validación

- Prueba de navegación desde la tarjeta.
- Prueba de renderizado de la información completa y la acción de recurso.
- `yarn lint`, `yarn typecheck`, `yarn test` y `yarn build:ci`.
