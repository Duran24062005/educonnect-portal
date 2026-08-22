# Modulo Importaciones

## Alcance

La ruta administrativa `/imports` permite cargar archivos CSV para preparar la carga inicial del piloto.

## Flujo

- Seleccionar la entidad y el archivo CSV.
- Solicitar una previsualización al backend.
- Revisar el resumen y los errores por fila.
- Confirmar únicamente una carga sin errores.
- Consultar las cargas anteriores desde el historial.

La confirmación crea o actualiza datos en el backend; el portal no intenta transformar filas ni resolver referencias académicas por su cuenta.

## Contrato

La capa `src/api/imports.ts` consume:

- `POST /api/imports/preview` como `multipart/form-data` con `entity` y `file`.
- `GET /api/imports` y `GET /api/imports/:id` para el historial y el detalle.
- `POST /api/imports/:id/confirm` para la confirmación explícita.

El backend soporta estudiantes, acudientes, docentes, grados, áreas, grupos y matrículas. La carga debe ejecutarse con datos sintéticos hasta aprobar el gate P0.
