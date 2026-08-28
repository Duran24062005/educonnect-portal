# Plan de implementación: horario semanal y notificaciones

## Problema y objetivo

El formulario para enviar anuncios ocupa permanentemente la pantalla de notificaciones. Además, la configuración académica solo permite definir una ventana general por grupo, pero no el detalle de cada clase durante la semana.

El portal debe permitir:

- abrir los formularios de anuncio administrativo o docente desde un modal;
- mantener la bandeja de notificaciones como el foco principal de la pantalla;
- editar una jornada institucional con nombre, código y rango horario;
- construir un horario por grupo con una clase específica por día, materia, hora, docente y aula;
- guardar el horario como borrador y publicarlo después de validar conflictos y rangos.

## Alcance

Incluye `NotificationsPage`, `ScheduleManagementPage`, los tipos y normalizadores de `scheduleApi`, y la documentación del contrato consumido por el portal.

No cambia las rutas existentes, los nombres de campos de los formularios de anuncios, ni la estructura de sedes y jornadas usada por matrículas.

## Enfoque de implementación

1. Reutilizar el componente Radix `Dialog` existente para los dos formularios de anuncios y cerrar el modal después de un envío exitoso.
2. Mantener `Sedes y jornadas` como la pantalla de referencias institucionales. Las jornadas continúan siendo registros editables de tipo mañana, tarde o híbrida mediante nombre, código y horas.
3. Cambiar la edición del horario semanal a una lista de clases (`slots`) con grupo, materia, día de la semana, inicio, fin, docente y aula. La interfaz mostrará los slots agrupados por día para que el caso lunes 06:15-08:15 Inglés, lunes 08:15-09:15 Sociales y martes 06:15-07:15 Naturales sea directo de configurar.
4. Conservar `availability_windows` para compatibilidad con horarios antiguos y como límite general derivado de la jornada del grupo. Cuando un horario publicado tenga slots, las nuevas sesiones deberán coincidir con un slot del mismo grupo, materia, docente, día y rango.

## Actores y permisos

- Admin: crea borradores, edita slots, valida y publica horarios; crea anuncios administrativos.
- Docente: crea anuncios dirigidos a sus estudiantes; no edita el horario institucional.
- Estudiante/acudiente: solo consulta las notificaciones y el calendario resultante.

## Reglas de UX

- Los campos mantienen etiqueta visible encima del control y acciones claras de cancelar/guardar.
- El modal tiene título, descripción, foco administrado por Radix y cierre accesible.
- En móvil, la edición de un slot se apila en una columna; la lista semanal conserva separación por día.
- Los errores de API aparecen como toast; los errores de validación local aparecen antes de modificar el borrador.

## Riesgos y casos límite

- Un horario antiguo puede no tener slots: debe seguir funcionando con ventanas por grupo.
- No se deben permitir intervalos invertidos, días no lectivos, slots fuera de la jornada, materias no asignadas al grado, ni solapamientos de grupo, docente o aula.
- Publicar un horario reemplaza el publicado anterior y mantiene la trazabilidad de versiones.

