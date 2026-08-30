# Branding de EduConnect

Los activos oficiales del portal viven en `public/branding/`:

- `educonnect_new_logo.png`: composición completa con isotipo y nombre para superficies amplias.
- `educonnect_new_mark.png`: isotipo recortado para encabezados compactos, autenticación y sidebars.

Las pantallas deben renderizar la marca mediante `src/components/BrandLogo.tsx`. El componente centraliza las rutas y expone `variant="full"` o `variant="mark"`; no se deben agregar referencias remotas ni duplicar URLs de los PNG.

Para cambiar el logo sin modificar código, define `VITE_BRAND_LOGO_PATH` con una ruta pública, por ejemplo `/branding/mi-logo.png`, y coloca ese archivo dentro de `public/`. La variable es de compilación: después de cambiarla hay que reiniciar el servidor de desarrollo o generar un nuevo build. Cuando está definida, sobrescribe ambas variantes del componente.

Los activos son PNG RGBA y no contienen fondo incrustado. El favicon existente `public/favicon.ico` se conserva sin cambios y no depende de `BrandLogo` ni de `VITE_BRAND_LOGO_PATH`. En superficies oscuras, el logo debe conservar un contenedor claro o de alto contraste para mantener la legibilidad de sus colores.
