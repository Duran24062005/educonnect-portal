# Frontend Repository Context

## Identidad del repositorio

`educonnect-portal` es la aplicacion web de EduConnect. Su objetivo es ofrecer la experiencia de usuario sobre contratos expuestos por `educonnect-backend`.

Este repositorio es independiente del backend. Compartir carpeta padre o contexto funcional no los convierte en el mismo repo.

## Que se documenta aqui

- arquitectura del frontend
- rutas, guards y navegacion
- estado en cliente
- consumo de APIs
- patrones de UI
- estrategia de carga y cache
- decisiones de build y testing frontend

## Que no se documenta aqui como fuente principal

- modelos MongoDB
- reglas de negocio persistentes
- permisos definitivos del servidor
- implementacion interna de services/repositories del backend
- despliegue operativo de MongoDB

## Dependencia contractual con el backend

El portal necesita que el backend mantenga:

- endpoints estables
- formas de error razonablemente consistentes
- soporte para `Bearer token`
- rutas de uploads accesibles
- payloads agregados para dashboards y detalle de grupo

Cuando eso cambie:

- este repo debe ajustar `src/api`
- deben revisarse hooks, guards o pages afectadas
- la documentacion frontend debe registrar el nuevo consumo

## Flujo tecnico del portal

1. `src/main.tsx` monta la app.
2. `src/App.tsx` configura providers y el arbol de rutas.
3. `useAuthStore.initialize()` reconstruye sesion si existe token.
4. Los guards deciden acceso segun autenticacion, rol, estado y perfil.
5. Las pages consumen APIs o hooks de React Query.
6. Los layouts y componentes renderizan la UI final.

## Capas practicas del frontend

- `api/`: acceso HTTP por dominio
- `hooks/`: orquestacion de fetch, cache y transformacion de datos
- `store/`: estado global realmente compartido
- `pages/`: composicion de pantallas
- `components/`: bloques visuales reutilizables
- `lib/`: utilidades transversales

## Estado y cache

Separacion actual recomendada:

- Zustand para sesion y estado UI pequeño pero global
- React Query para datos remotos reutilizables
- estado local para interacciones acotadas de una pantalla

No conviene mover todo a Zustand ni duplicar en store lo que ya vive en cache remota.

## Performance

El repo ya usa varias tecnicas que deben preservarse:

- lazy loading en paginas privadas pesadas
- `manualChunks` en Vite
- hooks agregados para reducir waterfalls
- placeholders o estados de carga que no vacien toda la pantalla al refetch

## Checklist cuando se agrega una vista o modulo

1. definir si la ruta es publica o protegida
2. decidir si requiere `RoleRoute` o guard adicional
3. crear o extender modulo API
4. decidir si necesita React Query o solo fetch local
5. documentar dependencias con el backend si cambia el contrato consumido
6. actualizar documentacion del modulo en `docs/frontend`
