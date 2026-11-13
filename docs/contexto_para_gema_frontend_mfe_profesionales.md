# Contexto Técnico Backend → Frontend: Selector de Especialidad en MFE `lista-profesionales`

Copia y pega el siguiente bloque directamente en tu conversación con la **Gema de Frontend** para que te genere el prompt o el código exacto del MFE.

---

## 📋 Bloque para copiar a la Gema de Frontend

Hola. Necesito que me generes el prompt de implementación (o los cambios necesarios) para el microfrontend **`lista-profesionales`** en Angular. Queremos agregar un selector (`select` / `dropdown`) para elegir la **Categoría / Especialidad Médica** del profesional dentro del formulario tipo Stepper de la pestaña **"Agregar/Editar Profesional"**.

A continuación te comparto el contexto exacto y los contratos que ya están listos en el Backend (NestJS + API Gateway + Shared Libraries):

### 1. Contratos Compartidos (`@nx-boilerplate/api-interfaces`)
Ya existen en la librería compartida las siguientes interfaces:

```typescript
export interface IMedicalCategory {
  _id?: string;
  categoryId: string; // Ej: 'CAT-PSIQUIATRIA'
  name: string;       // Ej: 'Médico Psiquiatra'
  slug: string;       // Ej: 'medico-psiquiatra'
  description?: string;
  isActive: boolean;
}

export interface ISpecialtyCategoryRef {
  categoryId: string;
  name: string;
  slug: string;
}
```

Y la interfaz del profesional (`IActiveProfessional` / `IProfessionalSummary`) ahora incluye la propiedad desnormalizada `specialtyCategory`:

```typescript
export interface IActiveProfessional {
  cedula: string;
  nombres: string;
  apellidos: string;
  email: string;
  profesion: string;
  specialtyCategory: ISpecialtyCategoryRef; // <-- NUEVO CAMPO OBLIGATORIO
  procedimientosRelacionados?: string[];
  horarioTrabajo: IWorkSchedule;
  horariosExcepcionales?: IExceptionSchedule[];
  isActive: boolean;
}
```

### 2. Endpoints Disponibles en el API Gateway (`http://localhost:3000/api`)

1. **Cargar opciones para el Select del Stepper (`GET /api/categories`):**
   - Retorna el sobre estándar `IApiResponse<IMedicalCategory[]>` con las categorías activas:
     - `Médico Psiquiatra` (`categoryId: "CAT-PSIQUIATRIA"`, `slug: "medico-psiquiatra"`)
     - `Médico Estético` (`categoryId: "CAT-ESTETICA"`, `slug: "medico-estetico"`)
     - `Profesional Cosmetóloga` (`categoryId: "CAT-COSMETOLOGIA"`, `slug: "profesional-cosmetologa"`)

2. **Crear Profesional (`POST /api/doctors`) y Editar Profesional (`PATCH /api/doctors/:cedula`):**
   - El `ValidationPipe` del API Gateway tiene `whitelist: true` y `forbidNonWhitelisted: true` mediante `CreateProfessionalDto` y `UpdateProfessionalDto`.
   - Por lo tanto, cuando el Stepper envíe el formulario, **NO debe enviar solo un string con el ID**, sino el objeto anidado `specialtyCategory` con esta estructura exacta:
     ```json
     {
       "cedula": "1018432109",
       "nombres": "Carlos",
       "apellidos": "Morales",
       "email": "drmorales@clinica.com",
       "profesion": "Médico Cirujano",
       "specialtyCategory": {
         "categoryId": "CAT-ESTETICA",
         "name": "Médico Estético",
         "slug": "medico-estetico"
       },
       "procedimientosRelacionados": ["PROC-001"],
       "horarioTrabajo": { ... }
     }
     ```

3. **Filtrado de Profesionales (`GET /api/doctors?categorySlug=medico-estetico`):**
   - Opcionalmente, el endpoint de listado ya soporta el query param `categorySlug` por si queremos filtrar la tabla/lista de profesionales.

### 3. Lo que necesito que generes para el MFE (`lista-profesionales`):
1. Cómo consumir `GET /api/categories` en el servicio correspondiente del MFE y exponerlo de forma reactiva (Signals / Observables) para poblar el input en el Stepper.
2. Cómo agregar el control `specialtyCategory` en el `FormGroup` del Stepper (en el paso de Datos Básicos / Información Profesional) con `Validators.required`.
3. Cómo manejar la selección en el template: al elegir una categoría del dropdown, que se guarde o transforme al objeto `{ categoryId, name, slug }` requerido por el DTO del backend.
4. Cómo precargar (`patchValue`) correctamente el selector cuando el usuario entra en modo **"Editar Profesional"** (comparando por `categoryId`).