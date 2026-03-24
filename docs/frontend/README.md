# Documentacion Frontend

Esta carpeta documenta como esta construido el frontend de EduConnect hoy, con foco en onboarding tecnico y mantenimiento.

## Objetivos

- Explicar la arquitectura real del portal.
- Mostrar como se conectan rutas, estado, layouts y APIs.
- Dejar claras las decisiones de diseno que afectan el desarrollo diario.
- Registrar deuda tecnica e inconsistencias conocidas para evitar romper integraciones.

## Mapa de documentos

- [repository-context.md](./repository-context.md): limites del repo, ownership y relacion con backend.
- [architecture.md](./architecture.md): vista general del sistema frontend.
- [routing-and-auth.md](./routing-and-auth.md): flujo de rutas, autenticacion y guards.
- [api-integration.md](./api-integration.md): capa HTTP, contratos y riesgos de integracion.
- [state-management.md](./state-management.md): uso de Zustand, React Query y estado local.
- [ui-patterns.md](./ui-patterns.md): layouts, componentes base y patrones de UI.
- [000-doc-template.md](./000-doc-template.md): plantilla base para nueva documentacion funcional o tecnica.

## Nota actual

El portal ya incluye bandeja de notificaciones y formularios de anuncios para `admin` y `teacher`.

Esta primera version:

- consume endpoints REST de notificaciones
- usa React Query para refresco y sincronizacion local
- no implementa WebSockets ni push en tiempo real

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

1. Leer `repository-context.md` para entender limites y responsabilidades del repo.
2. Leer `architecture.md` para entender el mapa general.
3. Leer `routing-and-auth.md` antes de tocar login, perfil o permisos.
4. Leer `api-integration.md` antes de conectar un endpoint nuevo.
5. Leer el documento del modulo que se va a modificar.
6. Si una decision nueva cambia la estructura del proyecto, agregar o actualizar un ADR.

## Convenciones

- Esta documentacion describe el estado actual del proyecto, no un ideal futuro.
- Cuando una seccion mencione deuda tecnica, no implica error inmediato; implica riesgo de mantenimiento.
- Si el frontend cambia de contrato con el backend, esta carpeta debe actualizarse junto con el codigo.
- Si una decision pertenece al backend, no debe documentarse aqui como unica fuente de verdad.
