# Documentación Técnica del Workspace (`docs/`)

Este directorio contiene las especificaciones y fichas técnicas de los módulos, microservicios, aplicaciones remotas y librerías del monorepo Nx.

---

## Convención de Documentación

Los documentos aquí almacenados son generados de forma estandarizada mediante la skill `doc-architect`.

Para documentar o actualizar la especificación de cualquier módulo o feature, utiliza el comando en el chat del agente:

```text
documentar :fileName
```

* **Ejemplo:** `documentar agendador-citas` $\rightarrow$ generará `docs/agendador-citas.md`
* **Ejemplo:** `documentar patients-service` $\rightarrow$ generará `docs/patients-service.md`
