# Documentacion Frontend

Esta carpeta documenta como esta construido el frontend de EduConnect hoy, con foco en onboarding tecnico y mantenimiento.

## Objetivos

- Explicar la arquitectura real del portal.
- Mostrar como se conectan rutas, estado, layouts y APIs.
- Dejar claras las decisiones de diseno que afectan el desarrollo diario.
- Registrar deuda tecnica e inconsistencias conocidas para evitar romper integraciones.

## Mapa de documentos

- [architecture.md](./architecture.md): vista general del sistema frontend.
- [routing-and-auth.md](./routing-and-auth.md): flujo de rutas, autenticacion y guards.
- [api-integration.md](./api-integration.md): capa HTTP, contratos y riesgos de integracion.
- [state-management.md](./state-management.md): uso de Zustand, React Query y estado local.
- [ui-patterns.md](./ui-patterns.md): layouts, componentes base y patrones de UI.

## Modulos

- [modules/admin.md](./modules/admin.md)
- [modules/teacher.md](./modules/teacher.md)
- [modules/student.md](./modules/student.md)
- [modules/academic.md](./modules/academic.md)
- [modules/groups.md](./modules/groups.md)

## ADRs

- [adrs/001-routing-and-guards.md](./adrs/001-routing-and-guards.md)
- [adrs/002-auth-store.md](./adrs/002-auth-store.md)
- [adrs/003-api-layer.md](./adrs/003-api-layer.md)

## Como usar esta documentacion

1. Leer `architecture.md` para entender el mapa general.
2. Leer `routing-and-auth.md` antes de tocar login, perfil o permisos.
3. Leer `api-integration.md` antes de conectar un endpoint nuevo.
4. Leer el documento del modulo que se va a modificar.
5. Si una decision nueva cambia la estructura del proyecto, agregar o actualizar un ADR.

## Convenciones

- Esta documentacion describe el estado actual del proyecto, no un ideal futuro.
- Cuando una seccion mencione deuda tecnica, no implica error inmediato; implica riesgo de mantenimiento.
- Si el frontend cambia de contrato con el backend, esta carpeta debe actualizarse junto con el codigo.
