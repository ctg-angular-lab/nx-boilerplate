import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AvailabilityService } from '@nx-boilerplate/backend/scheduling-domain';
import { IAvailableDate, IDayAvailability } from '@nx-boilerplate/api-interfaces';
import { GetAvailableDatesPayloadDto } from '@nx-boilerplate/shared-dtos';

const DEFAULT_DOCTOR = {
  email: 'camilotabares.portafolio@gmail.com',
  cedula: '1020304050',
  name: 'Dr. Camilo Tabares García',
};

@Controller()
export class AvailabilityController {
  private readonly logger = new Logger(AvailabilityController.name);

  constructor(private readonly availabilityService: AvailabilityService) {}

  @MessagePattern('appointments.get-available-dates')
  async getAvailableDates(
    @Payload() payload: GetAvailableDatesPayloadDto
  ): Promise<IAvailableDate[] | IDayAvailability[]> {
    this.logger.log(`Consultando disponibilidad de citas: ${JSON.stringify(payload)}`);

    const doctorEmail = payload.doctorEmail || DEFAULT_DOCTOR.email;
    const doctorCedula = payload.doctorCedula || DEFAULT_DOCTOR.cedula;
    const durationMinutes = 45;

    // Consulta optimizada por rango semanal
    if (payload.startDate && payload.endDate) {
      const [sYear, sMonth, sDay] = payload.startDate.split('-').map(Number);
      const start = new Date(sYear, sMonth - 1, sDay, 0, 0, 0, 0);

      const [eYear, eMonth, eDay] = payload.endDate.split('-').map(Number);
      const end = new Date(eYear, eMonth - 1, eDay, 23, 59, 59, 999);

      return this.availabilityService.getAvailableSlotsForRange(
        doctorEmail,
        start,
        end,
        durationMinutes,
        doctorCedula
      );
    }

    // Consulta de día único (retrocompatibilidad)
    let targetDate: Date;
    if (payload.targetDate) {
      const [tYear, tMonth, tDay] = payload.targetDate.split('-').map(Number);
      targetDate = new Date(tYear, tMonth - 1, tDay, 0, 0, 0, 0);
    } else {
      targetDate = new Date();
    }

    const slots = await this.availabilityService.getAvailableSlots(
      doctorEmail,
      doctorCedula,
      targetDate,
      durationMinutes
    );

    return slots.map((slot, index) => {
      const start = new Date(slot.start);
      const hours = String(start.getHours()).padStart(2, '0');
      const minutes = String(start.getMinutes()).padStart(2, '0');
      const year = start.getFullYear();
      const month = String(start.getMonth() + 1).padStart(2, '0');
      const day = String(start.getDate()).padStart(2, '0');

      return {
        id: `slot-${year}${month}${day}-${hours}${minutes}-${index}`,
        fecha: `${year}-${month}-${day}`,
        hora: `${hours}:${minutes}`,
        profesional: DEFAULT_DOCTOR.name,
        disponible: true,
      };
    });
  }
}
