# ADR 003 - Capa API por dominio sobre Axios comun

## Estado

Aprobado

## Contexto

El frontend necesita:

- reusar `baseURL`
- compartir interceptores
- evitar que cada pagina construya requests manualmente
- centralizar validacion de params y tokens

## Decision

Se definio un cliente Axios comun en `src/api/axios.ts` y modulos API por dominio en `src/api/*`.

## Consecuencias

### Positivas

- menor duplicacion de logica HTTP
- consistencia de manejo de errores
- mas facil refactorizar endpoints

### Negativas

- como el backend no siempre responde con el mismo shape, varias paginas aun hacen normalizacion propia
- la capa API todavia no encapsula por completo todos los payloads del sistema
