import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { IMedicalCategory, IProcedure } from '@nx-boilerplate/api-interfaces';
import { ProceduresRepository } from '../repositories/procedures.repository';

@Injectable()
export class ProceduresSeeder implements OnModuleInit {
  private readonly logger = new Logger(ProceduresSeeder.name);

  constructor(private readonly proceduresRepository: ProceduresRepository) {}

  async onModuleInit(): Promise<void> {
    await this.seedInitialProceduresIfEmpty();
    await this.seedInitialCategoriesIfEmpty();
    try {
      await this.proceduresRepository.ensureProcedureCounter();
    } catch (error) {
      this.logger.warn(
        `Aviso al sincronizar contador de procedimientos: ${(error as Error).message}`
      );
    }
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

  async seedInitialCategoriesIfEmpty(): Promise<void> {
    try {
      const count = await this.proceduresRepository.countCategories();
      if (count === 0) {
        // Verificar si existen datos bajo 'categoriasMedicas' (plural) para migrarlos automáticamente
        const db = this.proceduresRepository.getConnection().db;
        if (db) {
          try {
            const oldDocs = await db.collection('categoriasMedicas').find({}).toArray();
            if (oldDocs.length > 0) {
              this.logger.log(
                `Migrando ${oldDocs.length} documentos desde "categoriasMedicas" a "categoriaMedica"...`
              );
              const mapped: IMedicalCategory[] = oldDocs.map((d) => ({
                categoryId: (d['categoryId'] as string) || `CAT-${d['_id']}`,
                name: (d['name'] as string) || '',
                slug: (d['slug'] as string) || '',
                description: d['description'] as string | undefined,
                isActive: d['isActive'] !== false,
              }));
              await this.proceduresRepository.insertManyCategories(mapped);
              this.logger.log('Migración de categorías completada con éxito.');
              return;
            }
          } catch {
            // Ignorar si la colección no existe en Atlas
          }
        }

        this.logger.log(
          'Colección "categoriaMedica" vacía en MongoDB Atlas. Inicializando auto-seeder de categorías...'
        );

        const initialCategories: IMedicalCategory[] = [
          {
            categoryId: 'CAT-ESTETICA',
            name: 'Médico Estético',
            slug: 'medico-estetico',
            description: 'Procedimientos de medicina estética y armonización facial',
            isActive: true,
          },
          {
            categoryId: 'CAT-COSMETOLOGIA',
            name: 'Profesional Cosmetóloga',
            slug: 'profesional-cosmetologa',
            description: 'Tratamientos cosmetológicos y cuidado dérmico',
            isActive: true,
          },
          {
            categoryId: 'CAT-PSIQUIATRIA',
            name: 'Médico Psiquiatra',
            slug: 'medico-psiquiatra',
            description: 'Atención en salud mental y psiquiatría clínica',
            isActive: true,
          },
        ];

        await this.proceduresRepository.insertManyCategories(initialCategories);
        this.logger.log(
          'Auto-seeder completado: 3 categorías médicas maestras insertadas con éxito.'
        );
      }
    } catch (error) {
      this.logger.warn(
        `Aviso en auto-seeder Categorías (posible arranque sin conexión): ${
          (error as Error).message
        }`
      );
    }
  }
}
