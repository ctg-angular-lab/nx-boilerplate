# @nx-boilerplate/shared-dtos

Librería de **Data Transfer Objects (DTOs)** con validación en runtime mediante `class-validator` y `class-transformer`.

## Propósito

Cada DTO en esta librería:

1. **Implementa** una interface pura de `@nx-boilerplate/api-interfaces` (contrato compartido).
2. **Decora** las propiedades con validadores de `class-validator` para proteger los microservicios de payloads inválidos en runtime.

## Uso

```typescript
import { FindPatientByNationalIdDto } from '@nx-boilerplate/shared-dtos';
```

> **⚠️ Backend only**: Esta librería depende de `class-validator` y `class-transformer`. No debe importarse desde código Angular/frontend.
