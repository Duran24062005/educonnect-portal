# ADR 002 - Zustand para sesion y perfil

## Estado

Aprobado

## Contexto

El portal necesita un estado compartido para:

- token
- usuario autenticado
- perfil personal
- inicializacion de sesion

## Decision

Se usa Zustand en `src/store/auth.ts` como store pequeno, directo y sin boilerplate excesivo.

## Consecuencias

### Positivas

- lectura simple desde cualquier vista
- menor complejidad que Redux para el tamano actual del proyecto
- facil persistencia con `localStorage`

### Negativas

- si se empieza a meter demasiado estado de negocio, el store puede crecer sin control
- parte del acoplamiento con `localStorage` queda embebida en el store
