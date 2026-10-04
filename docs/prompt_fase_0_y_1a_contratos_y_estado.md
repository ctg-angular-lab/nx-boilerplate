/skill angular-data-expert

Contexto: Vamos a implementar la Fase 0 (Contratos) y Fase 1a (Estado de Flujo) para permitir el "Deep Linking" desde el Stepper hacia el Calendario, basándonos en el análisis arquitectónico reciente.

Instrucciones paso a paso:

1. **FASE 0 - Modificación de Contratos (`libs/shared/api-interfaces/src/lib/appointment.interface.ts` o equivalente):**
   - **`TimeSlot`:** Añade las propiedades opcionales `startTime?: string;` y `endTime?: string;` (para almacenar el formato ISO necesario para el POST).
   - **`ICreateAppointmentBody`:** Crea esta nueva interfaz como reflejo exacto del DTO del Gateway. Debe contener: `doctorEmail` (string), `doctorCedula` (string), `patientNationalId` (string), `patientFullName` (string), `patientEmail` (string), `procedureId` (string), `procedureName` (string), `startTime` (string), `endTime` (string), y `notes?` (string opcional).
   - **`IBookingContext`:** Crea esta interfaz para el estado del front:
     ```typescript
     export interface IBookingContext {
       patient: { cedula: string; nombre: string; apellidos: string; correo: string; celular: string };
       procedure: IProcedure;
       doctor: IProfessionalSummary;
     }
     ```

2. **FASE 1a - Orquestación de Estado (`apps/agendador-citas/src/app/services/appointment-logic.service.ts`):**
   - Importa las nuevas interfaces.
   - **Estado de Pestañas:** Crea el signal privado `#activeTab = signal<number>(0);` y expónlo públicamente como `activeTab = this.#activeTab.asReadonly();`. Crea un método `setActiveTab(id: number): void { this.#activeTab.set(id); }`.
   - **Estado de Contexto:** Crea el signal privado `#bookingContext = signal<IBookingContext | null>(null);` y expónlo públicamente como `bookingContext = this.#bookingContext.asReadonly();`.
   - **Método `startBookingFlow`:** Crea este método que reciba `(ctx: IBookingContext)`. Dentro del método:
     1. Guarda el contexto: `this.#bookingContext.set(ctx);`
     2. Selecciona el médico para que el calendario se actualice: `this.selectProfessional(ctx.doctor);`
     3. Cambia a la pestaña del calendario (asumiendo que el índice es 1): `this.setActiveTab(1);`
   - **Método `clearBookingContext`:** Crea este método sin parámetros que asigne `null` a `#bookingContext`.

Asegúrate de no usar getters clásicos, mantén todo en la API de Signals moderna y no toques aún la lógica de `fetchCalendarWeek` (eso irá en la Fase 3).