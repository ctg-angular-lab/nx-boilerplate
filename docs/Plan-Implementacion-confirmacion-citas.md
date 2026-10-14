> [!NOTE]
> **ESTADO: EJECUTADO / OBSOLETO**
> Este plan ha sido completamente ejecutado y superado por la arquitectura modular implementada bajo [Plan-Separacion-responsabilidades-scheduling.md](file:///Users/usuario/Desktop/nx-boilerplate/docs/Plan-Separacion-responsabilidades-scheduling.md) (Fases 0–5). Ver documentación canónica en [docs/documentacion-front/agendador-citas.md](file:///Users/usuario/Desktop/nx-boilerplate/docs/documentacion-front/agendador-citas.md) y [docs/api-gateway.md](file:///Users/usuario/Desktop/nx-boilerplate/docs/api-gateway.md).

# Plan de Implementación: Pestaña "Confirmación de Citas" (CRM Diario)
Objetivo: Construir un panel operativo (Tab 3) donde las recepcionistas puedan visualizar, filtrar, confirmar, cancelar y contactar por WhatsApp a los pacientes agendados para un día específico, aplicando principios de Optimistic UI y reactividad pura con Signals.

Fase 1: El Cerebro Operativo (Data-Access)
Skill Principal: angular-data-expert
Enfoque: Arquitectura de estado (Signals) y comunicación HTTP. Cero UI.

1.1. Contratos y DTOs: Actualizar @nx-boilerplate/api-interfaces con los nuevos tipos de datos definidos en el Gateway (IAppointmentDashboard, UpdateAppointmentStatusDto).

1.2. El Servicio (ConfirmacionCitasService):

Crear el nuevo servicio @Injectable({ providedIn: 'root' }).

Signals de Estado (Filtros): Definir #selectedDate (inicializado en "Hoy"), #selectedStatus (inicializado en TENTATIVE), #searchQuery (texto de búsqueda) y #selectedDoctorEmail (opcional).

Signals de Datos: Definir #appointmentsList (la respuesta bruta del backend).

Computed Signals (Derivación): Crear un computed() llamado filteredAppointments que tome #appointmentsList y le aplique el filtro de texto local (#searchQuery).

1.3. Conexión Backend (RxJS):

Implementar fetchDailyAppointments() que lea los signals de filtro y ejecute el GET /api/appointments/daily.

Implementar updateAppointmentStatus(id, newStatus) con Optimistic UI: Modificar localmente #appointmentsList antes de hacer el PATCH. Si el PATCH falla, revertir el estado local.

Implementar trackWhatsAppContact(id) (POST sin bloqueo).

1.4. Reactividad Automática: Usar un effect() o toObservable en el constructor para que cualquier cambio en #selectedDate o #selectedStatus dispare automáticamente la función fetchDailyAppointments().

Fase 2: Layout Base y Enrutamiento Interno
Skill Principal: angular-ui-expert
Enfoque: Integrar la nueva pestaña en el contenedor principal y preparar el cascarón visual.

2.1. Actualización del Host: Modificar RemoteEntryComponent (o donde definas tus Tabs) para cambiar el texto "Profesionales Disponibles" por "Confirmación de Citas" y asignar el ícono adecuado (ej. checklist o fact_check).

2.2. Componente Padre (ConfirmacionCitasComponent):

Generar el componente standalone.

Inyectar el ConfirmacionCitasService.

Implementar el Auto-reinicio: Usar un hook (ngOnInit o un efecto) para asegurar que, al entrar a esta pestaña, la fecha se resetee a "Hoy" (service.resetToToday()).

Definir la estructura del Grid (CSS CSS Grid o Flexbox): Una fila superior para la barra de herramientas (filtros) y un contenedor principal para la tabla.

Fase 3: La Barra de Herramientas (Filtros e Inteligencia de Fechas)
Skill Principal: angular-ui-expert
Enfoque: Interacciones del usuario y control flow moderno.

3.1. Sub-componente (FiltrosConfirmacionComponent):

Lógica de Fechas Inteligentes: Crear una función pura en libs/shared/utils (ej. getNextWorkingDays(5)) que devuelva los próximos 5 días excluyendo domingos.

Pills de Fechas: Renderizar un grupo de botones horizontales ([ Hoy ] [ Mañana ] [ Jueves, 15 Oct ] ...). Al hacer clic, actualizar el Signal del servicio (service.setDate(fecha)).

Selector de Estados: Un MatButtonToggleGroup para alternar entre "Agendadas", "Confirmadas" y "Canceladas".

Buscador Reactivo: Un <mat-form-field> con un <input> conectado a un FormControl. Usar valueChanges.pipe(debounceTime(300)) para emitir el término de búsqueda al servicio sin saturarlo con cada pulsación de tecla.

Fase 4: La Tabla Maestra y Acciones Rápidas
Skill Principal: angular-ui-expert
Enfoque: Presentación de datos, Material Table y Badges.

4.1. Sub-componente (TablaConfirmacionComponent):

Integrar un MatTable que consuma directamente el signal service.filteredAppointments().

Columnas:

Paciente: Muestra nombre completo y documento.

Profesional/Procedimiento: Datos del servicio.

Horario: Rango horario (ej. "09:00 - 09:45").

Contacto (WhatsApp):

Botón de estilo distintivo (verde corporativo).

Integrar un <mat-icon> de WhatsApp.

Usar [matBadge]="cita.contactCount" para la burbuja.

Ocultar el badge si contactCount === 0.

El botón debe abrir el link wa.me generado dinámicamente y disparar la acción service.trackWhatsAppContact(id) en paralelo.

Acciones Directas:

Dos botones (MatIconButton): Un Check verde y una X roja.

Solo deben estar visibles si la cita está en estado TENTATIVE.

Al hacer clic, llamar a service.updateAppointmentStatus(cita.id, 'CONFIRMED' o 'CANCELLED')
