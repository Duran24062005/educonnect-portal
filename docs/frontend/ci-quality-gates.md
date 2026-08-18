# CI Quality Gates

## Purpose

Documentar como el portal protege `main` con revision previa y validaciones automatizadas.

## Scope

- Cubre el workflow `.github/workflows/build_and_test.yaml` de `educonnect-portal`.
- Cubre la revision requerida por PR, `CODEOWNERS` y plantilla de PR.
- No cubre el CI del backend; ese repositorio mantiene su propio workflow y documentacion.

## Context

`educonnect-portal` y `educonnect-backend` son repositorios Git independientes. El portal debe validar su propio codigo, aunque consuma contratos publicados por el backend.

La meta de este flujo es evitar que tests/build corran sobre codigo sin revision humana minima, y asegurar que los cambios aprobados pasen validaciones reproducibles antes de entrar a `main`.

## Current Behavior

El workflow se dispara en:

- `pull_request` hacia `main`
- `pull_request_review` cuando una revision se envia o se descarta
- `push` directo a `main`

En PRs, el job `Review gate` corre antes del job `Quality gates`. El gate exige:

- PR no marcado como draft
- al menos una aprobacion de una persona distinta al autor
- aprobacion hecha sobre el ultimo commit del PR
- ninguna solicitud de cambios activa sobre ese ultimo commit

Si se empuja un commit nuevo, las aprobaciones anteriores no desbloquean CI. El PR debe revisarse otra vez.

En `main`, el workflow corre las validaciones directamente porque el codigo ya debio haber pasado por PR.

## Key Decisions

- El workflow vive en este repo porque GitHub Actions solo ve el contenido del repositorio que lo ejecuta.
- `CODEOWNERS` asigna todos los archivos a `@Duran24062005`; para que sea obligatorio debe activarse la regla de proteccion correspondiente en GitHub.
- `yarn install --frozen-lockfile --non-interactive` evita que CI cambie dependencias o lockfile.
- `yarn quality` es el comando unico de calidad del portal y ejecuta `lint`, `typecheck`, `test` y `build:ci`.
- ESLint bloquea errores y deja visible la deuda existente de `any` como advertencias; promover esas advertencias a errores requiere una limpieza de tipos separada.
- El workflow usa permisos minimos: lectura de contenido y lectura de pull requests.

## Dependencies and Contracts

- Runtime de proyecto en CI: Node.js 20.
- Gestor de paquetes: Yarn classic con `yarn.lock`.
- Checks bloqueantes:
  - `Review gate`
  - `Quality gates`
- Comando local equivalente:

```bash
yarn quality
```

## UI and Edge Cases

Este flujo no cambia comportamiento visual del portal. Los riesgos operativos estan en el ciclo de PR:

- Un PR sin aprobacion bloquea intencionalmente `Quality gates`.
- Un nuevo commit invalida aprobaciones previas para efectos del workflow.
- Warnings de ESLint deben revisarse durante code review aunque no bloqueen CI todavia.

## Maintenance Notes

- Si cambia la version de Node soportada por Vite/React, actualizar `README.md`, `package.json` si aplica y el workflow.
- Si cambian los comandos de prueba o build, actualizar `yarn quality` y este documento.
- Si cambia el ownership del repo, actualizar `.github/CODEOWNERS`.
- Cuando se reduzca la deuda de tipos, cambiar `@typescript-eslint/no-explicit-any` de `warn` a `error`.
