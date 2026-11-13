import { Controller, Get, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Observable, timeout } from 'rxjs';
import { IMedicalCategory } from '@nx-boilerplate/api-interfaces';

@Controller('categories')
export class CategoriesController {
  constructor(
    @Inject('PROCEDURES_SERVICE')
    private readonly proceduresClient: ClientProxy,
  ) {}

  @Get()
  getAllCategories(): Observable<IMedicalCategory[]> {
    return this.proceduresClient
      .send<IMedicalCategory[]>('categories.get-all', {})
      .pipe(timeout(5000));
  }
}

