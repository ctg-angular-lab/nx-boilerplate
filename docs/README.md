# Documentación Técnica del Workspace (`docs/`)

Este directorio centraliza las especificaciones arquitectónicas, fichas técnicas por dominio/MFE y análisis de ingeniería del monorepo Nx (`@nx-boilerplate/source`).

---

## 1. Arquitectura y Microservicios Backend (`docs/documentacion-back/`)

La documentación del backend está organizada modularmente por responsabilidades (DDD), teniendo al **API Gateway** como documento nexo central:

| Documento | Alcance | Cola RabbitMQ |
|---|---|---|
| **[`00-api-gateway.md`](./documentacion-back/00-api-gateway.md)** | **Nexo Central:** Puerta de enlace HTTP (`:3000/api`), seguridad, interceptores y matriz maestra de los 24 endpoints. | Productor AMQP |
| **[`01-patients-clinical-service.md`](./documentacion-back/01-patients-clinical-service.md)** | `patients-service` + `patients-domain`: Ficha demográfica (20 campos), Historias Clínicas (Resolución 1995 de 1999), hidratación y evento `appointment.confirmed`. | `patients_queue` |
| **[`02-scheduling-service.md`](./documentacion-back/02-scheduling-service.md)** | `scheduling-service` + `scheduling-domain`: Algoritmo de slots, integración Google Calendar API, reserva y CRM diario. | `scheduling_queue` |
| **[`03-procedures-doctors-service.md`](./documentacion-back/03-procedures-doctors-service.md)** | `procedures-service` + `procedures-domain`: Catálogo de procedimientos, laboratorios, profesionales, agendas, excepciones e indicativos. | `procedures_queue` |

---

## 2. Aplicaciones y Microfrontends Frontend (`docs/documentacion-front/`)

| Documento | Módulo Frontend | Propósito |
|---|---|---|
| **[`app-shell.md`](./documentacion-front/app-shell.md)** | `app-shell` | Host principal MFE, layout general y orquestación de rutas remotas. |
| **[`agendador-citas.md`](./documentacion-front/agendador-citas.md)** | `apps/agendador-citas` | Flujo paso a paso de agendamiento de citas y panel CRM de confirmación. |
| **[`procedimientos-medicos.md`](./documentacion-front/procedimientos-medicos.md)** | `apps/procedimientos-medicos` | Administración de procedimientos médicos y laboratorios. |
| **[`lista-profesionales.md`](./documentacion-front/lista-profesionales.md)** | `apps/lista-profesionales` | Directorio y configuración de agendas/excepciones de especialistas. |
| **[`homologacion-navegacion.md`](./documentacion-front/homologacion-navegacion.md)** | Transversal UI | Estándares de navegación y diseño MD3 entre MFEs. |

---

## 3. Documentos de Análisis, Contratos Base y Planificación

* **[`historias-clinicas-back.md`](./historias-clinicas-back.md):** Resumen de ejecución del backend de historias clínicas e insumo base para la planificación del MFE `historial-pacientes` y el formulario de `agendador-citas`.
* **[`fases-historias-clinicas-back.md`](./fases-historias-clinicas-back.md):** Planificación arquitectónica de las 4 fases de implementación del backend de historias clínicas.
* **[`analisis-version-1-angendadorCitas.md`](./analisis-version-1-angendadorCitas.md):** Trazabilidad de extremo a extremo del flujo de reserva de citas.
* **[`coleccion-apis/agendador-citas.collection.json`](./coleccion-apis/agendador-citas.collection.json):** Colección Postman/Insomnia de pruebas de endpoints.

---

## 4. Convención de Generación (`doc-architect`)

Para documentar o actualizar la especificación de cualquier módulo o feature, utiliza el comando en el chat del agente:

```text
documentar :fileName
```
