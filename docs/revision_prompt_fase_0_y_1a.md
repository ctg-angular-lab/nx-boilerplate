# Revisión: `prompt_fase_0_y_1a_contratos_y_estado.md`

> Revisado contra el código real: [calendar.interface.ts](../libs/shared/api-interfaces/src/lib/calendar.interface.ts), [appointment.interface.ts](../libs/shared/api-interfaces/src/lib/appointment.interface.ts), [appointment-gateway.dto.ts](../services/api-gateway/src/dtos/appointment-gateway.dto.ts), [tabs-collection.component.ts](../libs/shared/layouts/src/lib/tabs-collection/tabs-collection.component.ts), [remote-entry.component.ts](../apps/agendador-citas/src/app/remote-entry/remote-entry.component.ts) y [appointment-logic.service.ts](../apps/agendador-citas/src/app/services/appointment-logic.service.ts).

---

## 1. Opinión general

El prompt va en la dirección correcta: es corto, tiene un alcance acotado, respeta la regla de solo-Signals y deja explícitamente fuera la Fase 3. Como base está bien.

Pero tiene **un bug seguro** (el id de la pestaña) y **dos huecos que quedan solo a medias**: se declara el contrato, pero nada lo llena ni lo usa. Si se ejecuta tal cual, el código compila, pero la Fase 1b llevaría al usuario a la pestaña equivocada y la Fase 4 se encontraría con `startTime` siempre `undefined`.

---

## 2. Cobertura de los huecos detectados

| Hueco | ¿Lo cubre este prompt? | Comentario |
|---|---|---|
| **A** – El botón "Ver calendario" sin `output()` | ❌ No (es de la Fase 1b) | Correcto que no esté aquí, pero falta decirlo explícitamente en "Fuera de alcance". |
| **B** – Las pestañas lazy destruyen el form | ❌ No (es de la Fase 1b) | Igual que A. |
| **C** – `TimeSlot` sin ISO | ⚠️ **A medias** | Agrega los campos, pero prohíbe tocar `#fetchCalendarWeek`, que es justo donde se descartan. Resultado: siempre `undefined`. |
| **D** – Contrato front ≠ DTO del gateway | ⚠️ **A medias** | Crea `ICreateAppointmentBody`, pero `createAppointment()` sigue tipado con `ICreateAppointmentRequest` y el DTO del gateway no se enlaza a la interfaz, así que pueden volver a desincronizarse. |
| **E** – Bucle del `effect()` | ❌ No (es de la Fase 3) | Correcto. |
| Ciclo de vida del contexto | ✅ Parcial | `clearBookingContext()` está bien. Falta definir quién lo llama (puede quedar como nota para 1b/4). |

---

## 3. Problemas concretos

### 🔴 3.1 Bug: confunde el id de la pestaña con su índice

`TabsCollectionComponent` busca la pestaña por **`tab.id`**, no por posición:

```typescript
const index = this.tabs().findIndex((t) => t.id === active);
return index >= 0 ? index : 0;
```

Y en `RemoteEntryComponent` los ids son **1, 2 y 3**:

| id | Pestaña |
|---|---|
| 1 | Agendar Cita |
| 2 | **Calendario** |
| 3 | Profesionales |

Con el prompt actual:
- `signal<number>(0)` → el id 0 no existe y "funciona" de casualidad por el fallback a 0.
- `setActiveTab(1)` → **te lleva a "Agendar Cita", no al calendario.**

**Arreglo:** usar constantes con nombre y no números mágicos.

```typescript
export const AGENDADOR_TABS = { FORM: 1, CALENDAR: 2, PROFESSIONALS: 3 } as const;
export type AgendadorTabId = (typeof AGENDADOR_TABS)[keyof typeof AGENDADOR_TABS];
```

`RemoteEntryComponent.rawTabs` debería usar esas mismas constantes, para que exista una sola fuente de verdad.

### 🔴 3.2 `TimeSlot` está en otro archivo

El prompt dice `appointment.interface.ts`, pero `TimeSlot` vive en **`calendar.interface.ts`**. Ese "o equivalente" deja la decisión a la IA, que podría crear un `TimeSlot` duplicado. Hay que darle la ruta exacta.

### 🟠 3.3 Un contrato vacío no cierra el hueco C

Para que `startTime/endTime` sirvan, hay que hacer un cambio **mínimo de mapeo** en `#fetchCalendarWeek`. No es la refactorización recursiva de la Fase 3, solo es dejar de perder datos:

```typescript
// Antes: Set<string> → solo sabe SI existe el display
// Después: Map<display, ISlotDisplay> → conserva el ISO
const availableByDisplay = new Map(
  (backendDay?.slots ?? []).map((s) => [s.display, s])
);

const rawSlots: TimeSlot[] = fullDailyGrid.map((display, index) => {
  const backendSlot = availableByDisplay.get(display);
  return {
    id: `${dateStr}-slot-${index}`,
    time: display,
    status: backendSlot ? 'disponible' : 'reservado',
    startTime: backendSlot?.startTime,
    endTime: backendSlot?.endTime,
  };
});
```

> Los slots `reservado` fusionados no necesitan ISO (no se pueden agendar), así que `#mergeConsecutiveBusySlots` no cambia.

Recomiendo cambiar la restricción final por: *"No refactorices el pipeline RxJS de `#fetchCalendarWeek` (Fase 3); solo cambia el `Set` por un `Map` para conservar `startTime/endTime`."*

### 🟠 3.4 Hay que blindar `ICreateAppointmentBody` contra la desincronización

Una interfaz "espejo" escrita a mano se vuelve a desincronizar con el tiempo. La forma de que **TypeScript lo vigile** es que el DTO del gateway la implemente:

```typescript
// services/api-gateway/src/dtos/appointment-gateway.dto.ts
export class CreateAppointmentBodyDto implements ICreateAppointmentBody { ... }
```

Así, si alguien agrega un campo obligatorio al DTO y no lo agrega al contrato (o al revés), el build falla. Es un cambio de una línea en el backend.

Además, el método del servicio debe usar el contrato nuevo, porque si no, la interfaz queda "huérfana":

```typescript
createAppointment(payload: ICreateAppointmentBody): Observable<IApiResponse<unknown>>
```

> ⚠️ Esto rompe `submitAppointment()` del stepper, que hoy arma un `ICreateAppointmentRequest`. Ese método ya está roto contra el gateway (le envía campos que el DTO rechaza con `forbidNonWhitelisted`), así que hay que decidir: **(a)** eliminarlo, porque el agendamiento real pasará por el calendario, o **(b)** dejar el método viejo como `@deprecated` y crear `confirmBooking()` aparte. Recomiendo **(b)** en esta fase y **(a)** en la Fase 4.

> ❗ **No elimines `ICreateAppointmentRequest`**: `libs/shared/dtos/src/lib/appointment.dto.ts` (`CreateAppointmentDto implements ICreateAppointmentRequest`) lo usa en el backend.

### 🟡 3.5 Ponerle nombre al tipo inline del paciente

`patient: { cedula; nombre; ... }` escrito inline no se puede reutilizar. El modal ya tiene un tipo casi igual (`IAgendarModalPatient`). Extráelo:

```typescript
export interface IBookingPatient {
  cedula: string;
  nombre: string;
  apellidos: string;
  correo: string;
  celular: string;
}
```

En la Fase 2, el modal podrá recibir `IBookingPatient` y eliminar la unión `IAgendarModalPatient | ICreateAppointmentRequest`.

### 🟡 3.6 ¿`IBookingContext` va en `api-interfaces`?

Según AGENTS.md, `api-interfaces` es para **contratos cliente-servidor**. `IBookingContext` es estado **solo del front** y nunca viaja por HTTP. Ponerlo ahí no rompe nada, pero ensucia la librería de contratos. Hay dos opciones válidas:
- `apps/agendador-citas/src/app/models/booking.models.ts` (más purista).
- Dejarlo en `api-interfaces` con un comentario `/** Estado de UI — no es contrato HTTP */`.

`IBookingPatient` y `ICreateAppointmentBody` sí van en `api-interfaces`.

### 🟡 3.7 `startBookingFlow` debería defenderse de un doctor que no está en la lista

El doctor viene de `/api/procedures/:id/doctors`, pero el `mat-select` del calendario lista `availableProfessionals` (de `/api/doctors`) y compara por `cedula`. Si el doctor no está en esa lista, el select se ve vacío. Sugerencia:

```typescript
startBookingFlow(ctx: IBookingContext): void {
  this.#bookingContext.set(ctx);
  const known = this.#availableProfessionals().find((p) => p.cedula === ctx.doctor.cedula);
  this.selectProfessional(known ?? ctx.doctor);
  this.setActiveTab(AGENDADOR_TABS.CALENDAR);
}
```

### 🟡 3.8 Detalles menores

- **"Deep Linking"** significa navegar por URL (`/agendador/calendario?doctor=...`). Lo que se implementa aquí es **navegación por estado**. Cambiar el término evita confusiones en el futuro.
- Agrega `readonly isBookingMode = computed(() => this.#bookingContext() !== null);`, que en la Fase 2 sirve para el banner y para el botón del modal.
- Falta pedir la **verificación**: `npx nx build agendador-citas`, `npx nx build api-gateway` y `npx nx lint agendador-citas`.
- Falta una sección explícita de **"Fuera de alcance"** (A, B y E), para que la IA no se adelante.
- **Skill**: la Fase 0 toca `api-interfaces` y el DTO del gateway. Conviene declarar `angular-data-expert` como skill principal, consultando las reglas de contratos de `nest-microservices` para el `implements` del DTO.

---

## 4. Desviación arquitectónica (preexistente) a tener en el radar

`CreateAppointmentBodyDto` está en `services/api-gateway/src/dtos/`, pero AGENTS.md dice que los DTOs con `class-validator` van en **`@nx-boilerplate/shared-dtos`**. No hace falta moverlo en esta fase (el `implements` ya da la garantía de tipos), pero conviene registrarlo como deuda.

---

## 5. Prompt propuesto (v2)

````markdown
/skill angular-data-expert

Contexto: Implementar la Fase 0 (Contratos) y la Fase 1a (Estado del flujo de agendamiento) para
navegar por estado desde el Stepper hacia el Calendario. Referencia: análisis arquitectónico previo.

## FASE 0 — Contratos

1. `libs/shared/api-interfaces/src/lib/calendar.interface.ts`
   - `TimeSlot`: agregar `startTime?: string;` y `endTime?: string;` (ISO 8601, solo en slots `disponible`).

2. `libs/shared/api-interfaces/src/lib/appointment.interface.ts`
   - Crear `IBookingPatient { cedula; nombre; apellidos; correo; celular }` (todos `string`).
   - Crear `ICreateAppointmentBody` como espejo EXACTO de `CreateAppointmentBodyDto`:
     `doctorEmail, doctorCedula, patientNationalId, patientFullName, patientEmail,
      procedureId, procedureName, startTime, endTime` (string) y `notes?: string`.
   - NO eliminar `ICreateAppointmentRequest` (lo usa `libs/shared/dtos`).

3. `services/api-gateway/src/dtos/appointment-gateway.dto.ts`
   - `CreateAppointmentBodyDto implements ICreateAppointmentBody` (sin cambiar validaciones).

4. `apps/agendador-citas/src/app/models/booking.models.ts` (nuevo)
   - `AGENDADOR_TABS = { FORM: 1, CALENDAR: 2, PROFESSIONALS: 3 } as const` y tipo `AgendadorTabId`.
   - `IBookingContext { patient: IBookingPatient; procedure: IProcedure; doctor: IProfessionalSummary }`.

## FASE 1a — Estado en `AppointmentLogicService`

- `#activeTab = signal<AgendadorTabId>(AGENDADOR_TABS.FORM)` → `activeTab` readonly + `setActiveTab(id)`.
- `#bookingContext = signal<IBookingContext | null>(null)` → `bookingContext` readonly.
- `isBookingMode = computed(() => this.#bookingContext() !== null)`.
- `startBookingFlow(ctx)`:
  1. guardar el contexto;
  2. resolver el doctor contra `availableProfessionals` por `cedula` (fallback: `ctx.doctor`) y llamar a `selectProfessional()`;
  3. `setActiveTab(AGENDADOR_TABS.CALENDAR)`.
- `clearBookingContext()`: poner `null`.
- `#fetchCalendarWeek`: SOLO reemplazar el `Set` de displays por un `Map<display, ISlotDisplay>` y
  copiar `startTime/endTime` a cada `TimeSlot` disponible. NO tocar el pipeline RxJS ni el `effect()`.
- `createAppointment`: marcar como `@deprecated` (lo usa el stepper) y crear
  `confirmBooking(body: ICreateAppointmentBody)` → `POST /api/appointments` (sin llamarlo aún desde la UI).

## `RemoteEntryComponent`
- Usar `AGENDADOR_TABS.*` como `id` en `rawTabs` (solo reemplazar los literales; el binding es de la Fase 1b).

## Fuera de alcance (NO implementar)
- `output()` del botón "Ver calendario" y el handler en el stepper (Fase 1b).
- Binding `[activeTabId]` en `RemoteEntry` y `preserveContent` en las pestañas (Fase 1b).
- Búsqueda recursiva, `switchMap` y el bucle del `effect()` (Fase 3).

## Reglas
- Solo API de Signals (`signal`, `computed`, `asReadonly`), sin getters ni `BehaviorSubject`.
- Seguir el protocolo de 4 fases de AGENTS.md (propuesta → confirmación → aplicación).

## Verificación
- `npx nx lint agendador-citas`
- `npx nx build agendador-citas`
- `npx nx build api-gateway`
````
