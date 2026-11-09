# 00 — API Gateway (Nexo Central de Arquitectura Backend)

> **Ficha Técnica del Módulo**  
> * **Ubicación en Monorepo:** `services/api-gateway`  
> * **Tipo de Módulo:** Microservicio NestJS 11+ — API Gateway HTTP / Orquestador de Transporte  
> * **Tags Nx (`project.json`):** `["scope:backend", "type:service"]`  
> * **Puerto de Desarrollo:** `3000` (Prefijo global: `/api`)  
> * **Rol Documental:** **Documento Nexo Central** del Backend. Conecta la capa de entrada HTTP con los 3 dominios de negocio desacoplados por RabbitMQ.

---

## 1. Mapa de Navegación de la Documentación Backend

La arquitectura backend del monorepo está dividida por responsabilidades bajo **Domain-Driven Design (DDD)**. Utiliza este índice para navegar al detalle interno de cada microservicio y librería de dominio:

| Documento | Microservicio Ejecutable | Librería de Dominio | Cola RabbitMQ | Responsabilidad de Negocio |
|---|---|---|---|---|
| **[`00-api-gateway.md`](./00-api-gateway.md)** *(Actual)* | `services/api-gateway` | *N/A (Agnóstico al dominio)* | Productor AMQP | Puerta de enlace HTTP única, validación `ValidationPipe`, `TransformInterceptor`, `RpcExceptionFilter` y enrutamiento de los 24 endpoints. |
| **[`01-patients-clinical-service.md`](./01-patients-clinical-service.md)** | `services/patients-service` | `libs/backend/patients-domain` | `patients_queue` | Ficha demográfica de pacientes (20 campos), Historias Clínicas (Resolución 1995 de 1999), hidratación de antecedentes y borradores reactivos. |
| **[`02-scheduling-service.md`](./02-scheduling-service.md)** | `services/scheduling-service` | `libs/backend/scheduling-domain` | `scheduling_queue` | Cálculo matemático de disponibilidad, sincronización con Google Calendar API, reserva de citas, lista de espera y CRM diario de confirmación. |
| **[`03-procedures-doctors-service.md`](./03-procedures-doctors-service.md)** | `services/procedures-service` | `libs/backend/procedures-domain` | `procedures_queue` | Catálogo de procedimientos y laboratorios, directorio de profesionales médicos, horarios laborales, turnos extra/días libres e indicativos (`area_codes`). |

> **Documentos de Análisis y Planificación Relacionados:**
> * [`historias-clinicas-back.md`](../historias-clinicas-back.md) — Resumen ejecutivo de endpoints e insumo base para la planificación del Frontend.
> * [`fases-historias-clinicas-back.md`](../fases-historias-clinicas-back.md) — Planificación arquitectónica de las 4 fases del backend de historias clínicas.
> * [`analisis-version-1-angendadorCitas.md`](../analisis-version-1-angendadorCitas.md) — Trazabilidad paso a paso del agendamiento de citas.

---

## 2. Propósito y Alcance del API Gateway

El **API Gateway** es la puerta de enlace única para todas las aplicaciones cliente del ecosistema (`app-shell`, `agendador-citas`, `procedimientos-medicos`, `lista-profesionales` y el futuro MFE `historial-pacientes`).

1. **Punto Único de Entrada (Single Entry Point):** Protege la topología interna evitando que los navegadores conozcan las colas RabbitMQ o las colecciones de MongoDB Atlas.
2. **Traductor de Protocolos (HTTP ↔ AMQP/RabbitMQ):** Recibe peticiones REST JSON, las valida en runtime con `class-validator` y las transforma en comandos RPC (`client.send`) o eventos asíncronos (`client.emit`).
3. **Orquestador de Eventos entre Dominios:** Coordina flujos transversales sin acoplar microservicios entre sí (por ejemplo, al confirmar una cita en `scheduling_queue`, el Gateway emite el evento `appointment.confirmed` hacia `patients_queue`).
4. **Estandarizador de Contratos:** Envuelve todas las respuestas en el sobre canónico `IApiResponse<T>` y traduce cualquier `RpcException` a códigos HTTP semánticos (`400`, `404`, `409`, `504`, `500`).

---

## 3. Diagrama Global de Topología y Enrutamiento

```mermaid
graph TD
    Client["Clientes Web / MFEs Angular\n(app-shell, agendador-citas,\nprocedimientos-medicos, lista-profesionales,\nhistorial-pacientes)"] -->|HTTP REST /api/*| GW["API Gateway\n(NestJS :3000)"]
    
    subgraph Gateway_Core ["Infraestructura Transversal (main.ts)"]
        VP["ValidationPipe\n(whitelist + forbidNonWhitelisted + transform)"]
        TI["TransformInterceptor\n(Sobre IApiResponse<T>)"]
        EF["RpcExceptionFilter\n(Mapeo de Errores RPC -> HTTP)"]
    end

    GW --> VP
    VP --> C_PAT["PatientsController\nClinicalRecordsController"]
    VP --> C_SCH["AppointmentsController\nAppointmentConfirmationController"]
    VP --> C_PRO["ProceduresController\nDoctorsController\nAreaCodesController"]
    VP --> C_HLT["HealthController"]
    
    subgraph RabbitMQ ["Broker RabbitMQ (AMQP :5672)"]
        Q_PAT["patients_queue"]
        Q_SCH["scheduling_queue"]
        Q_PRO["procedures_queue"]
    end

    C_PAT -->|RPC send()| Q_PAT
    C_SCH -->|RPC send() / emit()| Q_SCH
    C_SCH -.->|emit('appointment.confirmed')| Q_PAT
    C_PRO -->|RPC send()| Q_PRO
    
    Q_PAT --> MS1["patients-service\n( Ver 01-patients-clinical-service.md )"]
    Q_SCH --> MS2["scheduling-service\n( Ver 02-scheduling-service.md )"]
    Q_PRO --> MS3["procedures-service\n( Ver 03-procedures-doctors-service.md )"]

    MS1 & MS2 & MS3 -.->|Resultado / RpcException| EF
    TI -->|200 / 201 / 202 JSON| Client
    EF -->|400 / 404 / 409 / 504 JSON| Client
```

---

## 4. La Tríada de Seguridad y Estandarización en el Gateway

Configurada globalmente en [`services/api-gateway/src/main.ts`](file:///Users/usuario/Desktop/nx-boilerplate/services/api-gateway/src/main.ts):

1. **`ValidationPipe` (`whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`):**
   * Rechaza automáticamente con `400 Bad Request` cualquier propiedad no declarada en el DTO de `@nx-boilerplate/shared-dtos`.
   * Transforma tipos primitivos en parámetros de ruta y query (ej. `?includeInactive=true` a booleano).
2. **`TransformInterceptor` ([`transform.interceptor.ts`](file:///Users/usuario/Desktop/nx-boilerplate/services/api-gateway/src/interceptors/transform.interceptor.ts)):**
   * Envuelve toda respuesta exitosa en el contrato [`IApiResponse<T>`](file:///Users/usuario/Desktop/nx-boilerplate/libs/shared/api-interfaces/src/lib/api-response.interface.ts): `{ success: true, statusCode, message, data, timestamp }`.
3. **`RpcExceptionFilter` ([`rpc-exception.filter.ts`](file:///Users/usuario/Desktop/nx-boilerplate/services/api-gateway/src/filters/rpc-exception.filter.ts)):**
   * Intercepta errores provenientes de los microservicios RabbitMQ o `TimeoutError` de RxJS y devuelve respuestas HTTP controladas (`400`, `404`, `409`, `504 Gateway Timeout`) sin exponer trazas internas.

---

## 5. Matriz Maestra de Controladores y Endpoints HTTP

### 5.1 Dominio de Pacientes e Historias Clínicas (`patients_queue`)
> 📖 **Detalle interno de dominio, esquemas e hidratación:** Ver [`01-patients-clinical-service.md`](./01-patients-clinical-service.md)

#### [`PatientsController`](file:///Users/usuario/Desktop/nx-boilerplate/services/api-gateway/src/controllers/patients.controller.ts) (`/api/patients`)
| Método | Ruta HTTP | DTO de Entrada | Patrón RabbitMQ | Timeout | Propósito |
|---|---|---|---|---|---|
| `GET` | `/api/patients` | — | `patients.find-all` | `5000ms` | Lista todos los pacientes registrados ordenados por fecha de creación. |
| `GET` | `/api/patients/:nationalId` | `FindPatientByNationalIdDto` | `patients.find-by-national-id` | `5000ms` | Obtiene los 20 campos demográficos + `ultimosProcedimientos` y `recomendaciones` hidratados desde `historialMedico`. |
| `POST` | `/api/patients` | `CreatePatientDto` | `patients.create` | `5000ms` | Crea un paciente (registro rápido de 5 campos con defaults `null` o registro completo de 20 campos). |
| `PATCH` | `/api/patients/:nationalId` | `UpdatePatientDto` | `patients.update` | `5000ms` | Actualiza parcial o totalmente los 20 campos demográficos del paciente. |
| `GET` | `/api/patients/:nationalId/clinical-records` | `FindPatientByNationalIdDto` | `clinical-records.find-by-patient` | `5000ms` | Retorna el historial cronológico de historias clínicas (`ICitaMedica[]`) del paciente. |

#### [`ClinicalRecordsController`](file:///Users/usuario/Desktop/nx-boilerplate/services/api-gateway/src/controllers/clinical-records.controller.ts) (`/api/clinical-records`)
| Método | Ruta HTTP | DTO de Entrada | Patrón RabbitMQ | Timeout | Propósito |
|---|---|---|---|---|---|
| `GET` | `/api/clinical-records/:id` | `FindClinicalRecordByIdDto` | `clinical-records.find-by-id` | `5000ms` | Consulta una historia clínica específica por su `_id` de MongoDB o su `appointmentId` (`APT-...`). |
| `POST` | `/api/clinical-records` | `CreateClinicalRecordDto` | `clinical-records.create` | `5000ms` | Crea manualmente un registro clínico asistencial sin cita previa. |
| `PATCH` | `/api/clinical-records/:id` | `UpdateClinicalRecordDto` | `clinical-records.update` | `5000ms` | Diligencia examen físico, antecedentes, lote y cierra la historia clínica (`COMPLETADA`). |

---

### 5.2 Dominio de Agendamiento, Google Calendar y CRM (`scheduling_queue`)
> 📖 **Detalle interno de algoritmo de slots, Google Calendar y compensación:** Ver [`02-scheduling-service.md`](./02-scheduling-service.md)

#### [`AppointmentsController`](file:///Users/usuario/Desktop/nx-boilerplate/services/api-gateway/src/controllers/appointments.controller.ts) (`/api/appointments`)
| Método | Ruta HTTP | DTO de Entrada | Patrón RabbitMQ | Timeout | Propósito |
|---|---|---|---|---|---|
| `GET` | `/api/appointments/available-dates` | `GetAvailableDatesQueryDto` | `appointments.get-available-dates` | `10000ms` | Calcula los cupos disponibles cruzando horario laboral, excepciones, citas locales y Google Calendar. Si no se envían fechas, calcula la ventana semanal actual con `getWeekWindow(0)`. |
| `POST` | `/api/appointments` | `CreateAppointmentBodyDto` | `appointments.create` | `10000ms` | Reserva una cita en estado `TENTATIVE` en MongoDB y crea el evento en Google Calendar (`colorId: '5'`). |
| `POST` | `/api/appointments/waitlist` | `CreateWaitlistBodyDto` | `waitlist.create` | `5000ms` | Registra al paciente en la lista de espera de un procedimiento. |

#### [`AppointmentConfirmationController`](file:///Users/usuario/Desktop/nx-boilerplate/services/api-gateway/src/controllers/appointment-confirmation.controller.ts) (`/api/appointments`)
| Método | Ruta HTTP | DTO de Entrada | Patrón RabbitMQ | Timeout | Propósito |
|---|---|---|---|---|---|
| `GET` | `/api/appointments/daily` | `GetDailyAppointmentsQueryDto` | `appointments.get-daily` | `5000ms` | Lista las citas del día para el panel CRM de confirmación. |
| `PATCH` | `/api/appointments/:id/status` | `UpdateAppointmentStatusDto` | `appointments.update-status` (`send`) + `appointment.confirmed` (`emit`) | `10000ms` | Actualiza la cita a `CONFIRMED` o `CANCELLED`. **Si es `CONFIRMED`, emite el evento asíncrono `appointment.confirmed` hacia `patients_queue` para pre-crear el borrador clínico.** |
| `POST` | `/api/appointments/:id/track-contact` | ` appointmentId ` | `appointments.contact-tracked` (`emit`) | *Asíncrono (`202`)* | Incrementa en segundo plano el contador `contactCount` de seguimiento por WhatsApp/teléfono. |

---

### 5.3 Dominio de Catálogo Médico: Procedimientos, Doctores e Indicativos (`procedures_queue`)
> 📖 **Detalle interno de esquemas, horarios laborales y seeders:** Ver [`03-procedures-doctors-service.md`](./03-procedures-doctors-service.md)

#### [`ProceduresController`](file:///Users/usuario/Desktop/nx-boilerplate/services/api-gateway/src/controllers/procedures.controller.ts) (`/api/procedures`)
| Método | Ruta HTTP | DTO de Entrada | Patrón RabbitMQ | Timeout | Propósito |
|---|---|---|---|---|---|
| `GET` | `/api/procedures` | `FilterProceduresQueryDto` | `procedures.get-all` o `procedures.find-by-doctor` | `5000ms` | Lista procedimientos activos (o incluye inactivos con `?includeInactive=true`, o filtra por `?doctorCedula=`). |
| `GET` | `/api/procedures/:idProcedimiento` | `FindProcedureParamDto` | `procedures.find-by-id` | `5000ms` | Obtiene el detalle de un procedimiento por su código (`PROC-001`). |
| `GET` | `/api/procedures/:idProcedimiento/doctors` | `FindProcedureParamDto` | `procedures.get-doctors-by-procedure` | `5000ms` | Lista los especialistas activos habilitados para realizar dicho procedimiento. |
| `POST` | `/api/procedures` | `CreateProcedureDto` | `procedures.create` | `5000ms` | Crea un procedimiento médico con generación automática de secuencia `PROC-XXX`. |
| `PATCH` | `/api/procedures/:idProcedimiento` | `UpdateProcedureDto` | `procedures.update` | `10000ms` | Actualiza nombre, valor, duración, laboratorios o estado `isActive`. |
| `DELETE` | `/api/procedures/:idProcedimiento` | `FindProcedureParamDto` | `procedures.soft-delete` | `5000ms` | Inactiva lógicamente el procedimiento (`isActive: false`). |

#### [`DoctorsController`](file:///Users/usuario/Desktop/nx-boilerplate/services/api-gateway/src/controllers/doctors.controller.ts) (`/api/doctors`)
| Método | Ruta HTTP | DTO de Entrada | Patrón RabbitMQ | Timeout | Propósito |
|---|---|---|---|---|---|
| `GET` | `/api/doctors` | `GetDoctorsFilterDto` | `doctors.get-all` | `5000ms` | Lista los profesionales médicos activos (o todos si `?includeInactive=true`). |
| `POST` | `/api/doctors` | `CreateProfessionalDto` | `doctors.create` | `5000ms` | Registra un nuevo profesional con su jornada laboral (`horarioTrabajo`). |
| `PATCH` | `/api/doctors/:cedula` | `UpdateProfessionalDto` | `doctors.update` | `10000ms` | Actualiza datos del profesional, procedimientos asignados, horario o estado `isActive`. |
| `PATCH` | `/api/doctors/:cedula/schedule` | `UpdateScheduleExceptionsDto` | `doctors.update-schedule` | `5000ms` | Actualiza turnos extra (`EXTRA_SHIFT`) o días libres (`DAY_OFF`). |
| `DELETE` | `/api/doctors/:cedula` | `:cedula` | `doctors.soft-delete` | `5000ms` | Inactiva lógicamente al profesional (`isActive: false`). |

#### [`AreaCodesController`](file:///Users/usuario/Desktop/nx-boilerplate/services/api-gateway/src/controllers/area-codes.controller.ts) (`/api/area-codes`) y [`HealthController`](file:///Users/usuario/Desktop/nx-boilerplate/services/api-gateway/src/controllers/health.controller.ts) (`/api/health`)
| Método | Ruta HTTP | Patrón RabbitMQ | Propósito |
|---|---|---|---|
| `GET` | `/api/area-codes` | `area-codes.get-all` (`procedures_queue`) | Retorna el catálogo de indicativos telefónicos internacionales y expresiones regulares de validación. |
| `GET` | `/api/health` | *Respuesta Local Directa* | Liveness check del API Gateway (`{ status: 'ok', uptime, timestamp }`). |

---

## 6. Variables de Entorno y Límites de Módulos Nx

### Variables de Entorno (`.env`)
```bash
PORT=3000                                   # Puerto HTTP del API Gateway
RABBITMQ_URI=amqp://localhost:5672         # Broker RabbitMQ
RABBITMQ_PATIENTS_QUEUE=patients_queue     # Cola del dominio de Pacientes e Historias Clínicas
RABBITMQ_SCHEDULING_QUEUE=scheduling_queue # Cola del dominio de Agendamiento
RABBITMQ_PROCEDURES_QUEUE=procedures_queue # Cola del dominio de Procedimientos y Doctores
```

### Reglas de Frontera Arquitectónica (`enforce-module-boundaries`)
* **Permitido importar:** `@nx-boilerplate/api-interfaces`, `@nx-boilerplate/shared-dtos`, `@nx-boilerplate/utils`.
* **Estríctamente Prohibido:** Importar `@nx-boilerplate/backend/*-domain` o `MongooseModule`. Toda operación de negocio o persistencia debe viajar por RabbitMQ.

---

## 7. Comandos Nx de Desarrollo y Verificación

```bash
# Levantar el API Gateway en modo desarrollo
npx nx serve api-gateway

# Compilar bundle de producción
npx nx build api-gateway --no-interactive

# Verificar tipado estricto TypeScript
./node_modules/.bin/tsc -p services/api-gateway/tsconfig.app.json --noEmit
```

