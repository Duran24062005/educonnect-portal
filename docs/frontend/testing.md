# Pruebas del portal

## Calendario

La cobertura del calendario se divide en tres niveles:

- `src/test/calendar-utils.test.ts`: rangos semanales, sesiones demo, cancelación y reactivación.
- `src/test/calendar-page.test.tsx`: montaje de la página, renderizado de sesiones, cambio entre semana y agenda, y estado recuperable de error.
- `src/test/app-sidebar.test.tsx`: disponibilidad de la entrada `Calendario` para roles con acceso.

Ejecutar la cobertura específica:

```bash
yarn test src/test/calendar-page.test.tsx src/test/calendar-utils.test.ts src/test/app-sidebar.test.tsx
```

## Suite completa

```bash
yarn test
yarn typecheck
yarn build:ci
```

La cobertura específica de materiales está en `src/test/materials-page.test.tsx` e incluye consulta estudiantil, apertura segura de enlaces y flujo docente de publicación. El detalle del calendario conserva su cobertura en `src/test/calendar-page.test.tsx`.

La suite no reemplaza la comprobación de autenticación. Para una revisión manual en local, arrancar el portal con `VITE_CALENDAR_DATA_SOURCE=demo`, iniciar sesión con un usuario de prueba y abrir `/calendar`. Para la integración API, comprobar primero `GET /health/ready` y que `GET /api/auth/me` responda con una sesión válida.

## Contexto institucional

Los endpoints de sedes y jornadas requieren `user.institution_id` cuando `REQUIRE_INSTITUTION_CONTEXT=true`. Una cuenta sin institución no debe consultar `/api/institutions/current/campuses` ni `/api/institutions/current/shifts`; el portal muestra el estado de configuración y evita generar respuestas `409` repetitivas.
