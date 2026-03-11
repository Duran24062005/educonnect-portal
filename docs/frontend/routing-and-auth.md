# Routing y Autenticacion

## Flujo de inicializacion

Al montar la aplicacion:

1. `App.tsx` monta `AppInitializer`.
2. `AppInitializer` llama `useAuthStore.initialize()`.
3. `initialize()` revisa `localStorage` y, si hay token, ejecuta `authApi.me()`.
4. Si el backend responde bien, se reconstruyen `user` y `person`.
5. Si falla, se limpia la sesion.

Esto evita que la UI renderice rutas protegidas antes de confirmar el estado real del usuario.

## Store de autenticacion

Archivo principal: `src/store/auth.ts`

Responsabilidades:

- persistir token, user y person en `localStorage`
- exponer `setAuth`, `logout`, `fetchMe`, `initialize`
- normalizar `role` y `status`
- mantener `isLoading` mientras se resuelve la sesion

## Entidades del store

- `token`: JWT de sesion.
- `user`: entidad de autenticacion.
- `person`: perfil personal del usuario.
- `isLoading`: evita redirecciones prematuras mientras se consulta `/me`.

## Guards disponibles

Archivo principal: `src/routes/guards.tsx`

### `PublicOnlyRoute`

Permite acceso solo si no hay sesion valida ya utilizable.

Uso:

- login
- register

### `IncompleteProfileRoute`

Permite acceder a completar perfil solo si:

- existe token
- la cuenta no esta bloqueada
- el perfil aun no esta completo

### `ProfileCompleteGuard`

Se usa en casi todas las vistas privadas.

Valida:

- existe token
- el perfil esta completo
- la cuenta no esta en estado bloqueado

### `RoleRoute`

Agrega control de autorizacion por rol encima del guard anterior.

### `AccountStatusRoute`

Protege la pantalla de estado de cuenta y soporta casos donde no hay sesion activa pero si existe informacion temporal en `sessionStorage`.

## Flujo esperado por tipo de usuario

### Usuario nuevo

1. Registro
2. Login o token activo
3. Completar perfil
4. Si esta pendiente o bloqueado, ver estado de cuenta
5. Si esta activo y completo, entrar al dashboard

### Usuario existente

1. Login
2. `setAuth`
3. Redireccion segun perfil y estado

## Normalizacion de rol y estado

Archivo principal: `src/lib/auth.ts`

Se centraliza porque el backend puede devolver variantes de nombres.

Ejemplos:

- `guardian` se normaliza a `parent`
- los estados se limitan a `active`, `pending`, `inactive`, `blocked`, `egresado`

## Redirecciones importantes

- `401`: el interceptor limpia la sesion y manda a `/login`
- `403`: el interceptor guarda estado temporal y la app puede redirigir a `/account-status`
- perfil incompleto: redireccion a `/complete-profile`
- rol no permitido: redireccion a `/dashboard`

## Riesgos conocidos

- Si se cambia el payload de `/me`, se rompe la inicializacion global.
- Si una pagina usa datos de `user` cuando deberia usar `person`, la UI puede perder nombre o foto.
- Si se salta la normalizacion de rol/estado, los guards pueden comportarse distinto a lo esperado.
