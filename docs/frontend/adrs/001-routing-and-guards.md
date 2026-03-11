# ADR 001 - Routing y Guards por capa

## Estado

Aprobado

## Contexto

La aplicacion necesita:

- rutas publicas
- rutas con autenticacion
- rutas por rol
- redirecciones por perfil incompleto
- control de cuentas pendientes o bloqueadas

## Decision

Se definio un mapa central de rutas en `src/App.tsx` y una capa de guards reutilizables en `src/routes/guards.tsx`.

## Consecuencias

### Positivas

- el control de acceso no queda disperso por paginas
- es facil revisar quien puede entrar a una ruta
- el onboarding de permisos es mas simple

### Negativas

- el orden de composicion de guards importa
- si cambia la semantica del backend sobre perfil o estado, hay que ajustar varias redirecciones
