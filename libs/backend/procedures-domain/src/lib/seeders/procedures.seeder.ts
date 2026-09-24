import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { IProcedure } from '@nx-boilerplate/api-interfaces';
import { ProceduresRepository } from '../repositories/procedures.repository';

@Injectable()
export class ProceduresSeeder implements OnModuleInit {
  private readonly logger = new Logger(ProceduresSeeder.name);

  constructor(private readonly proceduresRepository: ProceduresRepository) {}

  async onModuleInit(): Promise<void> {
    await this.seedInitialProceduresIfEmpty();
  }

  async seedInitialProceduresIfEmpty(): Promise<void> {
    try {
      const count = await this.proceduresRepository.count();
      if (count === 0) {
        this.logger.log(
          'Colección "procedimientosMedicos" vacía en MongoDB Atlas. Inicializando auto-seeder...'
        );

        const initialProcedures: IProcedure[] = [
          {
            idProcedimiento: 'PROC-EST-001',
            nombreProcedimiento:
              'Armonización y Perfilado Labial con Ácido Hialurónico',
            valorStandar: 850000,
            duracionStandar: 45,
            medicosRelacionados: ['52890123', '1032456789'],
          },
          {
            idProcedimiento: 'PROC-EST-002',
            nombreProcedimiento:
              'Aplicación de Toxina Botulínica (Tercio Superior y Líneas de Expresión)',
            valorStandar: 720000,
            duracionStandar: 40,
            medicosRelacionados: ['52890123', '71345678'],
          },
          {
            idProcedimiento: 'PROC-EST-003',
            nombreProcedimiento:
              'Cirugía Menor de Resección de Bolsas de Bichat (Bichectomía Láser)',
            valorStandar: 1850000,
            duracionStandar: 90,
            medicosRelacionados: ['71345678'],
          },
          {
            idProcedimiento: 'PROC-EST-004',
            nombreProcedimiento:
              'Diseño de Sonrisa Digital y Mockup Estético con Lentes Cerámicos',
            valorStandar: 1200000,
            duracionStandar: 60,
            medicosRelacionados: ['71345678', '1032456789'],
          },
          {
            idProcedimiento: 'PROC-EST-005',
            nombreProcedimiento:
              'Bioestimulación Dérmica Profunda con Inductores de Colágeno',
            valorStandar: 1450000,
            duracionStandar: 60,
            medicosRelacionados: ['52890123', '1032456789'],
          },
        ];

        await this.proceduresRepository.insertMany(initialProcedures);
        this.logger.log('Auto-seeder completado: 5 procedimientos estéticos insertados con éxito.');
      }
    } catch (error) {
      this.logger.warn(
        `Aviso en auto-seeder Procedures (posible arranque sin conexión): ${
          (error as Error).message
        }`
      );
    }
  }
}
