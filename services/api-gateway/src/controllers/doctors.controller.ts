import { Controller, Get, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { IActiveProfessional } from '@nx-boilerplate/api-interfaces';
import { firstValueFrom, timeout } from 'rxjs';

@Controller('doctors')
export class DoctorsController {
  constructor(
    @Inject('PROCEDURES_SERVICE')
    private readonly proceduresClient: ClientProxy,
  ) {}

  @Get()
  async getAllDoctors(): Promise<IActiveProfessional[]> {
    return firstValueFrom(
      this.proceduresClient
        .send<IActiveProfessional[]>('doctors.get-all', {})
        .pipe(timeout(5000)),
    );
  }
}
