# GEMINI.md — Directrices del Proyecto Nx Boilerplate

> **Nota para el modelo:** Este archivo sincroniza con la especificación maestra de agentes definida en [AGENTS.md](./AGENTS.md). Ambos archivos definen la arquitectura y gobernanza del workspace.

---

## 1. Identidad y Arquitectura del Workspace
* **Monorepo:** Nx 22+ (`@nx-boilerplate/source`).
* **Frontend:** Angular 21+ MFE (Module Federation) con componentes Standalone puros, Signals (`input()`, `output()`, `model()`, `viewChild()`), Control Flow moderno (`@if`, `@for`, `@switch`) e inyección vía `inject()`.
* **Backend:** Microservicios NestJS 11+ desacoplados (DDD) comunicados internamente mediante RabbitMQ (`Transport.RMQ`). El `api-gateway` es el único punto de entrada HTTP.
* **Sistema de Diseño:** Angular Material y Material Design 3 (MD3) gobernado por Design Tokens nativos (`--sys-color-*`, `--mdc-*`) en `@nx-boilerplate/theme`.

---

## 2. Skills Especializados (`.agents/skills/`)
Antes de generar o modificar código en dominios específicos, consulta y aplica las reglas detalladas en:
1. **Angular & MFE UI:** [.agents/skills/angular-ui-expert/SKILL.md](file:///.agents/skills/angular-ui-expert/SKILL.md)
2. **Material Design 3 & Temas SCSS:** [.agents/skills/md3-architecture/SKILL.md](file:///.agents/skills/md3-architecture/SKILL.md)
3. **Microservicios NestJS & RabbitMQ:** [.agents/skills/nest-microservices/SKILL.md](file:///.agents/skills/nest-microservices/SKILL.md)
4. **Documentación Técnica de Módulos:** [.agents/skills/doc-architect/SKILL.md](file:///.agents/skills/doc-architect/SKILL.md) (disparado con `documentar :fileName` generando `docs/:fileName.md`)

## 3. Protocolo de Interacción y Triaje (4 Fases)
* **Fase 0 (Scoping Obligatorio ante ambigüedad):** Prohibido codificar de inmediato. Identificar skill, listar lineamientos requeridos y formular 2-4 preguntas clave al usuario.
* **Fase 1 (Propuesta Técnica):** Mostrar la estructura de archivos y rutas una vez resueltas las preguntas.
* **Fase 2 (Confirmación):** Esperar el visto bueno explícito del usuario.
* **Fase 3 (Ejecución y Verificación):** Crear archivos con Nx (`--no-interactive`) y verificar compilación (`npx nx build`).

Para la especificación completa de topología, límites de módulos y guardrails innegociables, consulta [AGENTS.md](./AGENTS.md).
