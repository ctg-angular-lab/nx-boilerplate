import { Controller, Get, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { IAreaCode } from '@nx-boilerplate/api-interfaces';
import { firstValueFrom, timeout } from 'rxjs';

@Controller('area-codes')
export class AreaCodesController {
  constructor(
    @Inject('PROCEDURES_SERVICE')
    private readonly proceduresClient: ClientProxy,
  ) {}

  @Get()
  async getAreaCodes(): Promise<IAreaCode[]> {
    return firstValueFrom(
      this.proceduresClient
        .send<IAreaCode[]>('area-codes.get-all', {})
        .pipe(timeout(5000)),
    );
  }
}