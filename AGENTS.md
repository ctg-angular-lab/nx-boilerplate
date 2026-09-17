# AGENTS.md — Workspace Architecture & AI Guidelines

Este documento es la **constitución técnica y orquestador global** del monorepo Nx (`@nx-boilerplate/source`). Aplica a todos los agentes de IA y desarrolladores que interactúan en este espacio de trabajo.

---

## 1. Visión General del Proyecto

* **Monorepo:** Nx 22+
* **Frontend:** Angular 21+ con arquitectura de Microfrontends (Module Federation), componentes Standalone puros y reactividad basada en Signals.
* **Backend:** Microservicios NestJS 11+ desacoplados bajo Domain-Driven Design (DDD) con transporte asíncrono RabbitMQ y API Gateway HTTP.
* **Diseño:** Sistema de diseño basado en Angular Material y Material Design 3 (MD3) gobernado por Design Tokens nativos.

---

## 2. Topología del Monorepo y Convenciones de Ubicación

Debes respetar estrictamente la siguiente jerarquía de directorios al crear o modificar código:

```
nx-boilerplate/
├── app-shell/                   # Host MFE Angular (Panel de Control Principal / Shell)
├── apps/                        # Remotes MFE Frontend (Angular Standalone)
│   ├── agendador-citas/
│   └── login/
│
├── services/                    # Microservicios ejecutables delgados (NestJS)
│   └── <nombre-servicio>/       # Ej: api-gateway, patients-service, scheduling-service
│       └── src/
│           ├── controllers/     # Controladores de transporte (@MessagePattern / @EventPattern / HTTP)
│           ├── app.module.ts    # Módulo raíz
│           └── main.ts          # Bootstrap (NestFactory.createMicroservice o create)
│
├── docs/                        # Documentación técnica centralizada (:fileName.md)
│
└── libs/                        # Librerías de dominio y recursos compartidos
    ├── backend/                 # Lógica de dominio reusable (NestJS Modules)
    │   └── <nombre-dominio>/    # Ej: patients-domain (servicios de dominio, repositorios, entidades)
    │
    └── shared/                  # Recursos transversales
        ├── api-interfaces/      # @nx-boilerplate/api-interfaces — Interfaces puras TS (Front & Back)
        ├── dtos/                # @nx-boilerplate/shared-dtos — DTOs con class-validator (Backend runtime)
        ├── layouts/             # @nx-boilerplate/layouts — Componentes estructurales y de presentación
        ├── theme/               # @nx-boilerplate/theme — Tokens MD3, tipografía y temas SCSS
        └── ui-charts/           # @nx-boilerplate/ui-charts — Componentes Chart.js desacoplados
```

### Límites de Módulos de Nx (`tags` en `project.json`)

Para preservar los límites arquitectónicos (`enforce-module-boundaries`), asigna siempre los tags correspondientes:

| Directorio | Tags requeridos | Propósito |
|---|---|---|
| `apps/*`, `app-shell` | `["scope:frontend", "type:app"]` | Aplicaciones MFE cliente |
| `services/*` | `["scope:backend", "type:service"]` | Microservicios ejecutables |
| `libs/backend/*` | `["scope:backend", "type:domain-lib"]` | Lógica de negocio y persistencia |
| `libs/shared/api-interfaces` | `["scope:shared", "type:contracts"]` | Interfaces compartidas cliente-servidor |
| `libs/shared/dtos` | `["scope:backend", "type:dtos"]` | Validación de payload en runtime |
| `libs/shared/theme`, `layouts` | `["scope:shared", "type:ui"]` | Estilos y presentación compartida |

---

## 3. Despachador de Skills (`.agents/skills/`)

Antes de implementar código o documentar, debes invocar y seguir las reglas del skill especializado correspondiente ubicado en `.agents/skills/`:

| Dominio de la Tarea | Skill a Cargar | Archivo de Instrucciones |
|---|---|---|
| Componentes de UI Angular, Signals, MFE routing, Chart.js, tablas y formularios | `angular-ui-expert` | [.agents/skills/angular-ui-expert/SKILL.md](file:///.agents/skills/angular-ui-expert/SKILL.md) |
| Tematización SCSS, Design Tokens MD3, paletas tonales, estilos de componentes | `md3-architecture` | [.agents/skills/md3-architecture/SKILL.md](file:///.agents/skills/md3-architecture/SKILL.md) |
| Microservicios NestJS, RabbitMQ, DTOs de validación, servicios de dominio DDD | `nest-microservices` | [.agents/skills/nest-microservices/SKILL.md](file:///.agents/skills/nest-microservices/SKILL.md) |
| Documentación técnica estandarizada de módulos, microservicios y features | `doc-architect` | [.agents/skills/doc-architect/SKILL.md](file:///.agents/skills/doc-architect/SKILL.md) |

### Comando Rápido de Documentación (`documentar :fileName`)
Cuando el usuario introduzca la instrucción `documentar :fileName` (o `documentar <nombre-archivo>`):
1. Activa de inmediato el skill `doc-architect`.
2. Inspecciona el código fuente del módulo, microservicio o feature indicado en el monorepo.
3. Genera el documento técnico exhaustivo en `docs/:fileName.md` utilizando la plantilla canónica (Mermaid, contratos DTO/Interfaces, puntos de entrada y comandos Nx).

### Orquestación de Tareas Full-Stack (Paso a Paso)
Cuando una funcionalidad abarque tanto Backend como Frontend, sigue este orden estricto de capas:
1. **Contrato Compartido:** Define interfaces puras en `@nx-boilerplate/api-interfaces`.
2. **Validación Backend:** Implementa DTOs con `class-validator` en `@nx-boilerplate/shared-dtos`.
3. **Lógica de Dominio:** Escribe casos de uso en `libs/backend/<dominio>/`.
4. **Transporte Backend:** Implementa controladores en `services/<servicio>/src/controllers/` usando `RpcException` y RabbitMQ.
5. **Componentes UI Frontend:** Crea componentes Dumb en `libs/shared/*` consumiendo tokens de `@nx-boilerplate/theme`.
6. **Smart Remote/App Shell:** Integra la vista en `apps/<remote>/` conectando con el servicio HTTP / Gateway.

---

## 4. Reglas Arquitectónicas Transversales (Guardrails Innegociables)

### A. Política Zero-Legacy
* **Angular:** Prohibido `@NgModule`. Prohibidos decoradores legacy (`@Input`, `@Output`, `@ViewChild`). Obligatorio Signals (`input()`, `output()`, `model()`, `viewChild()`). Prohibido control flow legacy (`*ngIf`, `*ngFor`). Obligatorio `@if`, `@for`, `@switch`. Prohibida inyección por constructor; usar `inject()`.
* **Estilos & Material:** Prohibido `!important` y `::ng-deep`. Prohibido Angular Material legacy (v14-). Todos los colores y tipografías deben consumir tokens MD3 (`--sys-color-*`, `--mdc-*`).
* **NestJS & Microservicios:** Prohibido transporte TCP por defecto; usar RabbitMQ (`Transport.RMQ`). Prohibido colocar lógica de negocio o queries en controladores de `services/` (delegar a `libs/backend/`). Prohibido usar `HttpException` dentro de microservicios RabbitMQ; usar exclusivamente `RpcException`.

### B. Contratos y Validación
* Las interfaces TypeScript en `@nx-boilerplate/api-interfaces` no validan runtime.
* Todo payload de entrada en microservicios debe estar tipado con un DTO decorado con `class-validator` y procesado por un `ValidationPipe` global con `{ whitelist: true, forbidNonWhitelisted: true, transform: true }`.

### C. Generación con Nx
* Siempre ejecutar comandos Nx con `--no-interactive`.
* Respetar las opciones de generación `--projectNameAndRootFormat=as-provided` cuando aplique.

---

## 5. Protocolo de Interacción y Triaje (Flujo Obligatorio de 4 Fases)

Para cualquier requerimiento nuevo o modificación arquitectónica, el agente DEBE seguir este ciclo estricto:

### Fase 0 — Triaje, Identificación de Skills y Preguntas Clave (Scoping)
> **REGLA DE AMBIGÜEDAD:** Si el prompt del usuario es de alto nivel, ambiguo, incompleto o no especifica las variables o capas exactas (por ejemplo: motor de persistencia, alcance de capas, modelos de datos, o variables requeridas por los skills), el agente **TIENE PROHIBIDO** escribir código o generar bloques de implementación masivos de inmediato.

En su lugar, el agente debe responder estructurando:
1. **Skill(s) Asignado(s):** Declarar explícitamente qué skill gobernará la tarea (`angular-ui-expert`, `md3-architecture` o `nest-microservices`).
2. **Lineamientos del Skill:** Exponer de forma concisa los contratos, convenciones de ubicación y restricciones que el skill exigirá (ej. interfaces en `@nx-boilerplate/api-interfaces`, DTOs con `class-validator`, ubicación en `libs/backend/*` o `apps/*`).
3. **Preguntas Clave (2 a 4 preguntas concisas):** Orientar al usuario mediante opciones claras para definir:
   * Alcance de capas (solo dominio, microservicio RMQ, API Gateway o MFE UI).
   * Motor de persistencia o esquemas de datos requeridos.
   * Reglas de negocio o campos obligatorios indispensables.

### Fase 1 — Análisis y Propuesta Técnica
Una vez respondidas las preguntas de la Fase 0:
* Explica la estrategia arquitectónica detallada.
* Muestra la estructura de archivos y bloques de código indicando la ruta exacta con formato ````typescript:ruta/del/archivo.ts` o ````scss:ruta/del/archivo.scss`.

### Fase 2 — Solicitud de Confirmación
* Pregunta explícitamente al usuario si está de acuerdo con la propuesta antes de escribir o modificar archivos en el workspace.

### Fase 3 — Aplicación y Verificación
* Tras la confirmación explícita del usuario, escribe los archivos en el workspace respetando los generadores de Nx (`--no-interactive`).
* Valida la integridad ejecutando los comandos de build/test correspondientes (`npx nx build <nombre-proyecto>`).
