import { describe, it, expect } from 'vitest';
import { getNextWorkingDays, formatDateYMD, calculateAgeFromBirthDate } from './date.utils';

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

describe('calculateAgeFromBirthDate', () => {
  const refDate = new Date(2026, 10, 3); // 2026-11-03

  it('debe calcular la edad correctamente cuando el cumpleaños ya pasó este año', () => {
    expect(calculateAgeFromBirthDate('1985-05-20', refDate)).toBe(41);
    expect(calculateAgeFromBirthDate('1984-10-05', refDate)).toBe(42);
  });

  it('debe calcular la edad correctamente cuando el cumpleaños aún no ha ocurrido este año', () => {
    // Cumpleaños el 15 de diciembre
    expect(calculateAgeFromBirthDate('1990-12-15', refDate)).toBe(35);
  });

  it('debe calcular la edad correctamente cuando el cumpleaños es exactamente hoy', () => {
    // 3 de noviembre de 1990
    expect(calculateAgeFromBirthDate('1990-11-03', refDate)).toBe(36);
  });

  it('debe calcular la edad correctamente cuando el cumpleaños es mañana', () => {
    // 4 de noviembre de 1990 -> aún tiene 35 años
    expect(calculateAgeFromBirthDate('1990-11-04', refDate)).toBe(35);
  });

  it('debe manejar recién nacidos (menos de 1 año) retornando 0', () => {
    expect(calculateAgeFromBirthDate('2026-10-01', refDate)).toBe(0);
  });

  it('debe aceptar instancias de Date además de strings YYYY-MM-DD', () => {
    const birthDate = new Date(2000, 0, 15);
    expect(calculateAgeFromBirthDate(birthDate, refDate)).toBe(26);
  });

  it('debe retornar null ante valores nulos, indefinidos o strings vacíos', () => {
    expect(calculateAgeFromBirthDate(null)).toBeNull();
    expect(calculateAgeFromBirthDate(undefined)).toBeNull();
    expect(calculateAgeFromBirthDate('')).toBeNull();
    expect(calculateAgeFromBirthDate('   ')).toBeNull();
  });

  it('debe retornar null ante fechas inválidas o fechas futuras', () => {
    expect(calculateAgeFromBirthDate('invalid-date')).toBeNull();
    // Fecha en el futuro respecto a refDate
    expect(calculateAgeFromBirthDate('2027-01-01', refDate)).toBeNull();
  });
});
