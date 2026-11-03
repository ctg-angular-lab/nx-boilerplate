# Análisis y Propuesta Arquitectónica: V2 Agendador y Módulo Clínico

¡Hola! Como desarrollador junior, es completamente normal querer resolver un problema creando registros al mismo tiempo (en paralelo). Sin embargo, al escalar a microservicios, debemos pensar en cómo se comportan los datos en el mundo real. 

A continuación, te presento mi análisis, los "red flags" (alertas) de tu idea original, y cómo vamos a estructurar la arquitectura para que tu aplicación soporte miles de citas sin romperse.

## 1. Diagnóstico de la Estrategia Actual (Opinión Honesta)

Tu idea de crear una colección `historialMedico` para cumplir con la normatividad y mejorar la experiencia del usuario (UX) es **correcta a nivel de negocio**, pero la estrategia de crear este documento "en paralelo" durante el flujo de agendamiento tiene graves problemas arquitectónicos. 

Aquí están mis observaciones sobre por qué debemos ajustar el rumbo:

*   **Acoplamiento de Dominios (Falta de Bounded Contexts):** El flujo que me muestras en tu documentación pertenece puramente al **Dominio de Agendamiento (Scheduling)**. Su única responsabilidad es manejar el tiempo, el calendario de Google y reservar un "espacio". La colección `historialMedico` pertenece al **Dominio Clínico (Clinical/EHR)**. Mezclar la lógica clínica dentro de la reserva del espacio nos llevará a crear un monolito distribuido, que es muy difícil de mantener.
*   **Creación Prematura de Datos (Datos Basura):** Un agendamiento en estado `TENTATIVE` es solo una *promesa* de que el paciente irá. Si miras tu interfaz `IRegistroClinico`, pides `lote_producto`, `examen_fisico`, etc. Esos datos no existen en el momento del agendamiento. Si creas el historial médico al mismo tiempo que la cita, y el paciente cancela, tendrás miles de historiales médicos "vacíos" o "fantasma" en tu base de datos.
*   **El Requerimiento de UX (Paso 2):** Querer mostrar el último médico y motivo de consulta en el Paso 2 del frontend es un problema de **Lectura** (Query), no de Escritura. No necesitas acoplar la creación de la nueva cita para resolver esto.

**Mi evaluación de la estrategia:** *Needs Improvement* (Necesita mejoras). Pero no te preocupes, vamos a aplicar patrones de diseño de nivel Senior para solucionarlo.

---

## 2. El "Por Qué": Patrones de Diseño a Utilizar

Para que pienses a escala, vamos a aplicar dos conceptos fundamentales:

### A. Domain-Driven Design (DDD) - Bounded Contexts (Contextos Delimitados)
Imagina tu clínica física: El recepcionista (Scheduling) solo maneja la agenda. El doctor (Clinical) maneja la historia clínica. No cruzan sus papeles.
Debemos tener dos fronteras claras en tu código:
1.  **Scheduling Service:** Dueño de la colección `appointments`. Sabe de fechas, horas y estados (`TENTATIVE`, `CONFIRMED`).
2.  **Clinical Service (NUEVO):** Dueño de la colección `historialMedico`. Sabe de leyes (Resolución 1995), exámenes físicos y consentimientos informados. 

### B. Arquitectura Orientada a Eventos (Choreography) y Pub/Sub
Para comunicar al "recepcionista" con el "doctor", usaremos **RabbitMQ** (que ya tienes configurado en tu API Gateway). 
Cuando el *Scheduling Service* detecte que una cita ha cambiado su estado a `CONFIRMED` o `ARRIVED` (el paciente llegó a la clínica), emitirá un evento llamado `appointment.confirmed`. El *Clinical Service* escuchará este evento de forma asíncrona (sin bloquear al usuario) y, **solo en ese momento**, creará el documento en `historialMedico` en estado "borrador" para que el médico lo llene.

---

## 3. El "Cómo": Solución a tus Requerimientos

Aquí está la propuesta arquitectónica paso a paso:

*   **Objetivo 1 (Mostrar info previa en el Paso 2 del agendador):** 
    *   Tu `API Gateway` tendrá un endpoint `GET /api/patients/:cedula/last-visit`.
    *   Este endpoint hará un RPC (`client.send()`) hacia la cola del nuevo `clinical-service`.
    *   El `clinical-service` buscará en `historialMedico` el último registro de esa cédula y devolverá solo el nombre del médico y el motivo. ¡Así resuelves la UX sin acoplar la base de datos!
*   **Objetivo 2 (Nuevo módulo de Historia Clínica):** 
    *   Crearemos el microservicio `ClinicalService`.
    *   Se suscribirá a la cola de RabbitMQ esperando el evento `appointment.confirmed` (emitido desde tu actual `AppointmentConfirmationController`).
    *   Al recibirlo, creará el documento inicial de `ICitaMedica`.

---

## 4. Implementación en NestJS (Código con Guardrails)

Como regla estricta de nuestra arquitectura, todo mensaje que viaje por RabbitMQ **debe** ser validado en la entrada usando `class-validator` y `ValidationPipe`. No podemos confiar ciegamente en la red.

### A. El Contrato de Comunicación (DTO Compartido)
Este archivo debe ir en tu librería `@nx-boilerplate/shared-dtos`.

```typescript
import { IsString, IsDateString, IsNotEmpty } from 'class-validator';

export class AppointmentConfirmedEventDto {
  @IsString()
  @IsNotEmpty()
  appointmentId: string; // Ej: APT-1761844800000-482

  @IsString()
  @IsNotEmpty()
  patientNationalId: string; // cédula para relacionarlo

  @IsString()
  @IsNotEmpty()
  doctorCedula: string;

  @IsString()
  @IsNotEmpty()
  procedureName: string;

  @IsDateString()
  @IsNotEmpty()
  appointmentDate: string;
}
```

### B. El Controlador en el Nuevo Microservicio (Clinical Service)
Aquí configuramos el listener de RabbitMQ. Observa cómo aplicamos el `ValidationPipe` directamente en el controlador de mensajes.

```typescript
import { Controller, UsePipes, ValidationPipe, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { AppointmentConfirmedEventDto } from '@nx-boilerplate/shared-dtos';
import { MedicalRecordService } from '../services/medical-record.service';

@Controller()
export class MedicalRecordController {
  private readonly logger = new Logger(MedicalRecordController.name);

  constructor(private readonly medicalRecordService: MedicalRecordService) {}

  /**
   * Escucha asíncronamente cuando una cita se confirma.
   * El ValidationPipe rechaza mensajes mal formados ANTES de tocar tu lógica clínica.
   */
  @EventPattern('appointment.confirmed')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async handleAppointmentConfirmed(@Payload() payload: AppointmentConfirmedEventDto) {
    this.logger.log(`Evento recibido: Cita confirmada ${payload.appointmentId} para paciente ${payload.patientNationalId}`);
    
    // Delegamos al servicio de dominio para crear el borrador clínico
    await this.medicalRecordService.initializeDraftRecord(payload);
  }
}
```

### C. El Servicio de Dominio (Clinical Service)
Aquí es donde utilizamos tu interfaz `ICitaMedica`.

```typescript
import { Injectable } from '@nestjs/common';
import { AppointmentConfirmedEventDto } from '@nx-boilerplate/shared-dtos';
import { ICitaMedica } from '@nx-boilerplate/api-interfaces'; // Tu contrato

@Injectable()
export class MedicalRecordService {
  
  // Asumiendo que inyectas tu repositorio de MongoDB aquí
  // constructor(private readonly recordRepository: RecordRepository) {}

  async initializeDraftRecord(event: AppointmentConfirmedEventDto): Promise<void> {
    // Creamos el borrador basado en tu contrato de la Resolución 1995
    const draftRecord: Partial<ICitaMedica> = {
      cedula_paciente: event.patientNationalId,
      medico_tratante: [{
        cedula_profesional: event.doctorCedula,
        fecha_atencion: new Date(event.appointmentDate)
      }],
      registro_clinico: {
        motivo_consulta: `Atención programada para: ${event.procedureName}`,
        enfermedad_actual: '',
        antecedentes_medicos: {
          patologicos: '', alergicos: '', farmacologicos: '', procedimientos_previos: ''
        },
        examen_fisico: '',
        procedimiento_realizado: '',
        lote_producto: null,
        recomendaciones: ''
      },
      soporte_documental: {
        consentimiento_informado: false, // Pendiente de firma
        descargable_consentimiento: ''
      }
    };

    // Guardamos en la colección 'historialMedico'
    // await this.recordRepository.create(draftRecord);
  }
}
```