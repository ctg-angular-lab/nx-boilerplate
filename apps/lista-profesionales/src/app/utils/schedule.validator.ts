import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Validador cruzado para el horario laboral y receso de almuerzo del profesional.
 */
export const scheduleRangeValidator: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {
  const horaInicio = control.get('horaInicio')?.value;
  const horaFin = control.get('horaFin')?.value;

  // Validación 1: Hora de inicio vs. hora de fin laboral
  if (horaInicio && horaFin && horaInicio >= horaFin) {
    return { invalidWorkRange: true };
  }

  const tieneReceso = control.get('tieneReceso')?.value;
  if (tieneReceso) {
    const receso = control.get('recesoAlmuerzo');
    const inicio = receso?.get('inicio')?.value;
    const fin = receso?.get('fin')?.value;

    // Validación 2: Inicio vs. fin de almuerzo
    if (inicio && fin && inicio >= fin) {
      return { invalidLunchRange: true };
    }

    // Validación 3: Receso contenido dentro de la jornada laboral
    if (horaInicio && horaFin && inicio && fin) {
      if (inicio < horaInicio || fin > horaFin) {
        return { lunchOutsideWorkHours: true };
      }
    }
  }

  return null;
};
