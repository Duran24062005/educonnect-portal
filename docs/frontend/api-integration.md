# Integracion API

## Cliente base

Archivo principal: `src/api/axios.ts`

El cliente Axios centraliza:

- `baseURL` via `VITE_API_URL`
- `Content-Type: application/json`
- envio automatico del bearer token
- manejo global de `400`, `401`, `403`

## Interceptores

### Request

Si hay token en `localStorage`, se agrega:

```http
Authorization: Bearer <token>
```

### Response

- `400`: muestra toast con mensaje principal y detalles validados.
- `401`: limpia sesion completa y redirige a `/login`.
- `403`: guarda estado temporal de cuenta y muestra error.

## Modulos API

La integracion esta separada por dominio:

- `auth.ts`
- `users.ts`
- `students.ts`
- `academic.ts`
- `groups.ts`
- `evaluations.ts`
- `analytics.ts`

Cada modulo debe:

- encapsular endpoints del dominio
- validar IDs cuando aplique
- evitar que las paginas construyan URLs manualmente

## Patrones de payload

El backend no es completamente uniforme. Por eso varias paginas usan utilidades como:

- `unwrapPayload`
- `getPayload`
- `asArray`
- `unwrap`

Estas funciones existen porque el backend a veces responde como:

- `res.data`
- `res.data.data`
- `data.items`
- `data.<collectionName>`

## Recomendacion operativa

Cuando un modulo backend se estabilice, mover la normalizacion al modulo `src/api/*` correspondiente y no repetirla en cada pagina.

## Validacion de ObjectId

Archivo util: `src/lib/object-id.ts`

Se usa para:

- detectar IDs invalidos antes de llamar al backend
- evitar requests rotos por params mal formados

## Riesgo clave: IDs de identidad vs IDs de perfil

Este proyecto usa entidades distintas:

- `User`
- `Student`
- `Teacher`

No son intercambiables.

Ejemplo de error historico:

- algunas vistas tomaban `_id` de `User`
- algunos endpoints esperaban `_id` de `Student`

Regla:

- si el endpoint es academico, validar si necesita `student_id` o `teacher_id`
- no asumir que `user._id` sirve para todo

## Integracion con analytics

`src/api/analytics.ts` tiene hoy una mezcla de:

- endpoints reales ya conectados
- restos de datos mockeados en algunas interfaces o helpers

Antes de agregar una nueva grafica:

1. revisar el PRD correspondiente
2. confirmar endpoint real
3. confirmar shape exacto de respuesta
4. decidir si la normalizacion vive en API o en la pagina

## Buenas practicas para integrar un endpoint nuevo

1. Crear o ampliar el modulo en `src/api`.
2. Validar IDs y params desde el cliente.
3. Tipar la respuesta minima esperada.
4. Centralizar la llamada en una sola funcion.
5. Normalizar el payload una sola vez.
6. Consumir esa funcion desde la pagina o hook.

## Deuda tecnica conocida

- No todos los modulos usan React Query; varios hacen fetch manual en `useEffect`.
- Hay repeticiones de utilidades de normalizacion entre paginas.
- Algunas paginas de docente todavia cargan datos mas amplios de lo necesario y luego filtran localmente.
