# Agendador de Citas

> **Ficha Técnica del Módulo**
> * **Ubicación en Monorepo:** `apps/agendador-citas`
> * **Tipo de Módulo:** Microfrontend Angular — Remote MFE (Module Federation)
> * **Tags Nx (`project.json`):** `["scope:frontend", "type:app"]`
> * **Puerto de desarrollo:** `4201`
> * **Estado:** Activo

---

## 1. Propósito y Alcance de Negocio

El MFE **Agendador de Citas** es el Remote principal que gestiona todo el flujo de agendamiento de citas médicas desde la perspectiva del paciente o del operador clínico. Permite seleccionar un profesional médico, visualizar su disponibilidad semanal real (sincronizada con Google Calendar y MongoDB Atlas) y agendar una cita en el horario elegido.

La arquitectura reactiva basada en **Signals** y un único **Single Source of Truth (SSOT)** (`AppointmentLogicService`) garantiza que la UI siempre refleje el estado real del sistema sin suscripciones manuales ni lógica duplicada en los componentes.

---

## 2. Diagrama de Arquitectura y Flujo de Información

```mermaid
graph TD
    Shell["app-shell\n(Host MFE)"]
    Remote["agendador-citas\nRemote Entry / Routes"]
    SSOT["AppointmentLogicService\nSSOT — Signals + effect()"]
    CalComp["CalendarioCitasComponent\nSmart UI"]
    API["API Gateway\nhttp://localhost:3000/api"]
    GC["Google Calendar API\n(via scheduling-service)"]
    Mongo["MongoDB Atlas\n(via scheduling-service)"]

    Shell -->|Lazy load Module Federation| Remote
    Remote --> CalComp
    CalComp -->|inject()| SSOT
    SSOT -->|GET /api/appointments/available-dates| API
    SSOT -->|GET /api/doctors| API
    SSOT -->|GET /api/procedures| API
    API -->|appointments.get-available-dates RMQ| GC
    API -->|appointments.get-available-dates RMQ| Mongo
    GC -->|isSynced + busyIntervals| API
    API -->|IDayAvailability[]| SSOT
    SSOT -->|weekDays Signal| CalComp
```

---

## 3. Estado Reactivo — Signals (SSOT)

El `AppointmentLogicService` es el **único responsable** de la lógica de estado de la feature. Los componentes solo leen Signals públicos de solo lectura (`asReadonly()`).

### Signals Públicos

| Signal | Tipo | Descripción |
|---|---|---|
| `weekDays` | `Signal<CalendarDay[]>` | Disponibilidad semanal computada (grilla completa con slots disponibles y reservados) |
| `activeProfessional` | `Signal<IProfessionalSummary \| null>` | Médico actualmente seleccionado en el calendario |
| `availableProfessionals` | `Signal<IProfessionalSummary[]>` | Catálogo completo de especialistas activos |
| `isLoadingCalendar` | `Signal<boolean>` | Estado de carga del fetch de disponibilidad semanal |
| `currentWeekOffset` | `Signal<number>` | Offset de semana (0 = actual, 1 = siguiente, -1 = anterior) |
| `procedures` | `Signal<IProcedure[]>` | Catálogo de procedimientos médicos |
| `patientHistory` | `Signal<IPatientHistory \| null>` | Historial del paciente consultado |

### Signals Privados (con `#`)

| Signal | Descripción |
|---|---|
| `#currentWeekOffset` | Fuente de verdad del offset de semana (solo mutable internamente) |
| `#isLoadingCalendar` | Control de estado de carga |
| `#weekDays` | Estado de la grilla semanal (solo escritura interna) |
| `#activeProfessional` | Médico activo (solo escritura interna) |
| `#availableProfessionals` | Catálogo de médicos (solo escritura interna) |

### Reactivity — `effect()`

```typescript
// En el constructor del servicio
effect(() => {
  const doctor = this.#activeProfessional();
  const offset = this.#currentWeekOffset();
  if (doctor?.email) {
    this.#fetchCalendarWeek(doctor.email, offset);
  }
});
```

Cada vez que cambia `#activeProfessional` o `#currentWeekOffset`, el `effect` dispara automáticamente `#fetchCalendarWeek` sin intervención del componente.

---

## 4. Contratos de Datos e Interfaces

### A. Interfaces de Contrato (`@nx-boilerplate/api-interfaces`)

| Interfaz | Propósito |
|---|---|
| `CalendarDay` | Día del calendario: `date`, `label`, `subLabel`, `slots[]`, `isToday`, `isPast`, `isAvailable`, `isCalendarSynced?`, `doctorEmail?` |
| `TimeSlot` | Slot de tiempo: `id`, `time`, `status`, `reservedBy?`, `mergedCount?` |
| `SlotStatus` | Union type: `'disponible' \| 'reservado' \| 'seleccionado'` |
| `IDayAvailability` | Respuesta del backend por día: `date`, `dayName`, `slots[]`, `isCalendarSynced` |
| `ISlotDisplay` | Slot crudo del backend: `startTime`, `endTime`, `display` |
| `IProfessionalSummary` | Médico: `nombres`, `apellidos`, `cedula`, `email`, `profesion` |
| `IProcedure` | Procedimiento médico con `id`, `nombre`, `duracion`, `especialidad` |

### B. API de Signals del `CalendarioCitasComponent` (Smart Component)

| Propiedad / Computed | Tipo | Descripción |
|---|---|---|
| `weekDays` | `Signal<CalendarDay[]>` | Inyectado directo del SSOT |
| `activeProfessional` | `Signal<IProfessionalSummary\|null>` | Inyectado del SSOT |
| `availableProfessionals` | `Signal<IProfessionalSummary[]>` | Inyectado del SSOT |
| `isLoading` | `Signal<boolean>` | Alias de `isLoadingCalendar` del SSOT |
| `selectedSlot` | `Signal<TimeSlot\|null>` | Estado local del slot seleccionado |
| `calendarTitle` | `computed()` | Título del calendario con nombre del médico activo |
| `currentDateRange` | `computed()` | Rango de fechas de la semana visible (`"5 oct - 10 oct de 2026"`) |
| `isCurrentWeek` | `computed()` | `true` cuando `currentWeekOffset === 0` |

---

## 5. Lógica de Disponibilidad — Pipeline Interno

El método `#fetchCalendarWeek` ejecuta el siguiente pipeline tras cada cambio de médico u offset:

```
1. API Gateway → GET /api/appointments/available-dates
         ↓
2. IDayAvailability[] (con isCalendarSynced por día)
         ↓
3. Por cada día (Lunes–Sábado):
   ├── isSunday || isPast? → { isAvailable: false, slots: [] }
   ├── isCalendarSynced === false? → { isCalendarSynced: false, doctorEmail }
   └── Normal:
       ├── Generar grilla completa #generateDailySlotGrid()
       │   → 14 slots: 07:00–19:00, 45 min, excluyendo almuerzo 12:00–13:00
       ├── Comparar contra Set de displays disponibles del backend
       ├── Marcar disponible / reservado
       └── #mergeConsecutiveBusySlots() → fusionar bloques reservados consecutivos
```

### `#generateDailySlotGrid()` — Grilla Canónica Diaria

Genera los **14 slots laborales** en hora Colombia:

| Horario (COL) | Nota |
|---|---|
| 07:00 – 07:45 | |
| 07:45 – 08:30 | |
| 08:30 – 09:15 | |
| 09:15 – 10:00 | |
| 10:00 – 10:45 | |
| 10:45 – 11:30 | |
| ~~11:30 – 12:15~~ | Excluido (solapa con almuerzo) |
| ~~12:15 – 13:00~~ | Excluido (solapa con almuerzo) |
| 13:00 – 13:45 | |
| 13:45 – 14:30 | |
| 14:30 – 15:15 | |
| 15:15 – 16:00 | |
| 16:00 – 16:45 | |
| 16:45 – 17:30 | |
| 17:30 – 18:15 | |
| 18:15 – 19:00 | |

### `#mergeConsecutiveBusySlots()` — Fusión de Bloques Ocupados

Los slots `reservado` consecutivos se fusionan en un único bloque con rango combinado y `mergedCount` para el template:

```
[13:00-13:45 reservado] + [13:45-14:30 reservado] + [14:30-15:15 reservado]
         ↓
[13:00-15:15 reservado, mergedCount: 3]
```

---

## 6. Estados Visuales del Calendario

### Columna de Día

| Estado | Condición | Visualización |
|---|---|---|
| **Disponible** | `isAvailable: true` | Columna normal con grilla de slots |
| **No disponible** | `isAvailable: false` (pasado / domingo) | Placeholder gris con ícono `event_busy` |
| **No sincronizado** | `isCalendarSynced: false` | Placeholder ámbar con ícono `sync_problem` + email del médico |
| **Hoy** | `isToday: true` | Borde primario, fecha con píldora azul |

### Slot Individual

| Estado CSS | Condición | Visualización |
|---|---|---|
| `time-slot--disponible` | `status === 'disponible'` | Borde azul izquierdo, hover elevado |
| `time-slot--reservado` | `status === 'reservado'` | Fondo rayado diagonal, cursor `not-allowed` |
| `time-slot--reservado time-slot--merged` | `status === 'reservado' && mergedCount > 1` | Fondo rayado + ícono `lock` + rango completo + etiqueta "No disponible" |
| `time-slot--seleccionado` | slot seleccionado por usuario | Fondo azul sólido, sombra elevada |

---

## 7. Componentes del MFE

### `CalendarioCitasComponent`

- **Tipo:** Smart Component (inyecta `AppointmentLogicService`)
- **Selector:** `app-calendario-citas`
- **Change Detection:** `OnPush`
- **Responsabilidades:** Filtro de médico, navegación semanal, renderizado del grid, selección de slot

### `ListaProfesionalesComponent`

- **Tipo:** UI Component
- **Selector:** `app-lista-profesionales`

### `AgendarCitaComponent`

- **Tipo:** UI Component / Form
- **Selector:** `app-agendar-cita`

---

## 8. Module Federation

El MFE `agendador-citas` se expone como Remote en el `app-shell` Host:

```typescript
// webpack.config.ts
exposes: {
  './Routes': 'apps/agendador-citas/src/app/remote-entry/entry.routes.ts'
}
```

**Puerto de desarrollo:** `4201`  
**publicHost:** `http://localhost:4201`

---

## 9. Dependencias y Límites Arquitectónicos

**Módulos que consume:**
- `@nx-boilerplate/api-interfaces` — `CalendarDay`, `TimeSlot`, `SlotStatus`, `IDayAvailability`, `IProfessionalSummary`, `IProcedure`, `IApiResponse`
- `@nx-boilerplate/data-access` — `ApiClientService` (HTTP con interceptores)
- `@nx-boilerplate/shared/utils` — `getColombiaToday()`, `normalizeDate()`, `formatDateYMD()`, `getWeekSchedule()`
- `@nx-boilerplate/theme` — Tokens MD3 (`--sys-color-*`, `--mdc-*`) para estilos
- `@angular/material` — `MatButtonModule`, `MatIconModule`, `MatFormFieldModule`, `MatSelectModule`

**Módulos que lo consumen:**
- `app-shell` — Host MFE que carga este Remote por Module Federation

---

## 10. Variables de Entorno / Configuración

| Configuración | Valor | Descripción |
|---|---|---|
| Puerto del Remote | `4201` | `serve` en desarrollo |
| URL del API Gateway | `http://localhost:3000` | Configurado en el proxy del `app-shell` |

---

## 11. Comandos de Verificación (Nx)

```bash
# Servir en desarrollo (como Remote independiente)
npx nx serve agendador-citas

# Servir completo (Host + Remote integrado)
npx nx serve app-shell

# Compilar para producción
npx nx build agendador-citas

# Ejecutar pruebas unitarias
npx nx test agendador-citas

# Validar límites arquitectónicos
npx nx lint agendador-citas
```
