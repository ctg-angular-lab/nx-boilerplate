import { describe, it, expect, vi } from 'vitest';
import { ClinicalRecordsRepository } from './clinical-records.repository';
import { ProfessionalNamesRepository } from './professional-names.repository';

describe('ClinicalRecordsRepository.createDraftFromAppointment', () => {
  const event = {
    appointmentId: 'APT-1',
    patientNationalId: '1020304050',
    doctorCedula: '71345678',
    procedureId: 'PROC-1',
    procedureName: 'Toxina Botulínica',
    appointmentDate: '2026-11-12T15:00:00.000Z',
  };

  function build(fullName: string | null) {
    const exec = vi.fn().mockResolvedValue({ _id: 'abc', appointmentId: 'APT-1' });
    const findOneAndUpdate = vi.fn().mockReturnValue({
      select: () => ({ lean: () => ({ exec }) }),
    });
    const names = {
      findFullNameByCedula: vi.fn().mockResolvedValue(fullName),
    } as unknown as ProfessionalNamesRepository;
    const repo = new ClinicalRecordsRepository({ findOneAndUpdate } as never, names);
    return { repo, findOneAndUpdate, names };
  }

  it('debe guardar nombre_profesional resuelto por la cédula del médico', async () => {
    const { repo, findOneAndUpdate, names } = build('Carlos Andrés Ruiz');
    await repo.createDraftFromAppointment(event);

    expect(names.findFullNameByCedula).toHaveBeenCalledWith('71345678');
    const update = findOneAndUpdate.mock.calls[0][1];
    expect(update.$setOnInsert.medico_tratante[0]).toEqual(
      expect.objectContaining({
        cedula_profesional: '71345678',
        nombre_profesional: 'Carlos Andrés Ruiz',
      })
    );
  });

  it('debe crear el borrador sin nombre cuando el profesional no existe', async () => {
    const { repo, findOneAndUpdate } = build(null);
    await repo.createDraftFromAppointment(event);

    const update = findOneAndUpdate.mock.calls[0][1];
    expect(update.$setOnInsert.medico_tratante[0].nombre_profesional).toBeUndefined();
  });
});

