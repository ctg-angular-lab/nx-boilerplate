import { describe, it, expect } from 'vitest';
import { getNextWorkingDays, formatDateYMD } from './date.utils';

describe('getNextWorkingDays', () => {
  it('debe retornar 3 días consecutivos cuando inicia en lunes', () => {
    // 2026-10-12 fue Lunes
    const monday = new Date(2026, 9, 12);
    const result = getNextWorkingDays(3, monday);

    expect(result).toHaveLength(3);
    expect(result.map(formatDateYMD)).toEqual([
      '2026-10-12', // Lunes
      '2026-10-13', // Martes
      '2026-10-14', // Miércoles
    ]);
  });

  it('debe omitir el domingo cuando cruza el fin de semana', () => {
    // 2026-10-17 fue Sábado
    const saturday = new Date(2026, 9, 17);
    const result = getNextWorkingDays(3, saturday);

    expect(result).toHaveLength(3);
    expect(result.map(formatDateYMD)).toEqual([
      '2026-10-17', // Sábado
      '2026-10-19', // Lunes (omite domingo 18)
      '2026-10-20', // Martes
    ]);
  });

  it('debe comenzar desde el lunes si la fecha base es domingo', () => {
    // 2026-10-18 fue Domingo
    const sunday = new Date(2026, 9, 18);
    const result = getNextWorkingDays(2, sunday);

    expect(result).toHaveLength(2);
    expect(result.map(formatDateYMD)).toEqual([
      '2026-10-19', // Lunes
      '2026-10-20', // Martes
    ]);
  });
});
