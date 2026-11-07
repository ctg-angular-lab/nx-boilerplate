import { describe, it, expect } from 'vitest';
import {
  calculateOverlayGeometry,
  timeStringToMinutes,
  isoOrTimeToMinutes,
  getStatusLabel,
  buildTimeGridRows,
  computeMonthlyKpis,
  computeWeeklyKpis,
  extractInitials,
  findNextAvailableDate,
  assignDoctorColorTheme,
} from './dashboard-calendar.mapper';
import { IDashboardDoctor } from '../models/dashboard.models';
import { IDayAvailability } from '@nx-boilerplate/api-interfaces';

describe('dashboard-calendar.mapper', () => {
  describe('calculateOverlayGeometry', () => {
    it('debe devolver 100% de ancho y 0% de desplazamiento para la capa 0 (única o base)', () => {
      const geo = calculateOverlayGeometry(0, 1);
      expect(geo.widthPercent).toBe(100);
      expect(geo.leftPercent).toBe(0);
      expect(geo.zIndex).toBe(10);
    });

    it('debe devolver la cascada canónica: 100% -> 65% -> 50% -> 35%', () => {
      const layer0 = calculateOverlayGeometry(0, 4);
      const layer1 = calculateOverlayGeometry(1, 4);
      const layer2 = calculateOverlayGeometry(2, 4);
      const layer3 = calculateOverlayGeometry(3, 4);

      expect(layer0.widthPercent).toBe(100);
      expect(layer0.leftPercent).toBe(0);
      expect(layer0.zIndex).toBe(10);

      expect(layer1.widthPercent).toBe(65);
      expect(layer1.leftPercent).toBe(35);
      expect(layer1.zIndex).toBe(20);

      expect(layer2.widthPercent).toBe(50);
      expect(layer2.leftPercent).toBe(50);
      expect(layer2.zIndex).toBe(30);

      expect(layer3.widthPercent).toBe(35);
      expect(layer3.leftPercent).toBe(65);
      expect(layer3.zIndex).toBe(40);
    });

    it('no debe desbordar si se pasa un índice mayor a 3', () => {
      const layerOverflow = calculateOverlayGeometry(5, 6);
      expect(layerOverflow.widthPercent).toBe(35);
      expect(layerOverflow.leftPercent).toBe(65);
    });
  });

  describe('timeStringToMinutes & isoOrTimeToMinutes', () => {
    it('debe convertir HH:mm a minutos correctamente', () => {
      expect(timeStringToMinutes('08:00')).toBe(480);
      expect(timeStringToMinutes('12:30')).toBe(750);
      expect(timeStringToMinutes('17:30')).toBe(1050);
      expect(timeStringToMinutes('')).toBe(0);
    });

    it('debe extraer minutos desde un string ISO local, ISO UTC (Z -> UTC-5 Colombia) o formato HH:mm', () => {
      expect(isoOrTimeToMinutes('09:15')).toBe(555);
      expect(isoOrTimeToMinutes('2026-11-06T09:45:00')).toBe(585); // 9 * 60 + 45 = 585
      expect(isoOrTimeToMinutes('2026-11-06T14:00:00.000Z')).toBe(540); // 14:00 UTC -> 09:00 COT = 540
    });
  });

  describe('getStatusLabel', () => {
    it('debe retornar las etiquetas legibles esperadas', () => {
      expect(getStatusLabel('CONFIRMED')).toBe('Confirmada');
      expect(getStatusLabel('SCHEDULED')).toBe('Agendada');
      expect(getStatusLabel('BLOCKED')).toBe('Bloqueado');
      expect(getStatusLabel('LUNCH')).toBe('Almuerzo');
      expect(getStatusLabel('AVAILABLE')).toBe('Disponible');
      expect(getStatusLabel('OUT_OF_HOURS')).toBe('Fuera de horario');
    });
  });

  describe('extractInitials & assignDoctorColorTheme', () => {
    it('debe generar iniciales en mayúsculas', () => {
      expect(extractInitials('Carlos', 'Sarmiento')).toBe('CS');
      expect(extractInitials('Beatriz', '')).toBe('B');
      expect(extractInitials('', '')).toBe('MD');
    });

    it('debe asignar temas de color cíclicamente', () => {
      const theme0 = assignDoctorColorTheme(0);
      const theme1 = assignDoctorColorTheme(1);
      const theme5 = assignDoctorColorTheme(5);

      expect(theme0.id).toBe('primary');
      expect(theme1.id).toBe('tertiary');
      expect(theme5.id).toBe('primary'); // Modulo 5
    });
  });

  describe('buildTimeGridRows', () => {
    const mockDoctor: IDashboardDoctor = {
      cedula: '1001',
      nombres: 'Alejandro',
      apellidos: 'Gómez',
      fullName: 'Dr(a). Alejandro Gómez',
      initials: 'AG',
      email: 'ag@clinica.com',
      profesion: 'Medicina General',
      colorTheme: assignDoctorColorTheme(0),
      horarioTrabajo: {
        diasLaborales: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'],
        horaInicio: '08:00',
        horaFin: '17:00',
        recesoAlmuerzo: { inicio: '12:00', fin: '13:00' },
      },
    };

    const mockAvailability: Record<string, IDayAvailability[]> = {
      '1001': [
        {
          date: '2026-11-06',
          dayName: 'Viernes',
          isCalendarSynced: true,
          isWorkingDay: true,
          slots: [
            {
              startTime: '09:00',
              endTime: '09:45',
              display: '09:00 - 09:45',
              colorId: null,
              isBookable: false,
              status: 'CONFIRMED',
              title: 'Consulta General',
              patient: { nombre: 'María', apellidos: 'Pérez', cedula: '123', correo: 'm@p.com', celular: '123' },
            },
          ],
        },
      ],
    };

    it('debe generar exactamente 20 filas desde las 08:00 hasta las 17:30', () => {
      const testDate = new Date('2026-11-06T10:00:00');
      const rows = buildTimeGridRows(testDate, [mockDoctor], mockAvailability);

      expect(rows.length).toBe(20);
      expect(rows[0].timeLabel).toBe('08:00');
      expect(rows[19].timeLabel).toBe('17:30');
    });

    it('debe proyectar el slot de 45 min (09:00 - 09:45) sobre los bloques de 09:00 y 09:30 con estado CONFIRMED', () => {
      const testDate = new Date('2026-11-06T10:00:00');
      const rows = buildTimeGridRows(testDate, [mockDoctor], mockAvailability);

      const row0900 = rows.find((r) => r.timeLabel === '09:00');
      const row0930 = rows.find((r) => r.timeLabel === '09:30');
      const row1000 = rows.find((r) => r.timeLabel === '10:00');

      expect(row0900?.layers[0].status).toBe('CONFIRMED');
      expect(row0900?.layers[0].procedureTitle).toBe('Consulta General');
      expect(row0900?.layers[0].patientName).toBe('María Pérez');

      expect(row0930?.layers[0].status).toBe('CONFIRMED');
      expect(row1000?.layers[0].status).toBe('AVAILABLE');
    });

    it('debe marcar la franja de 12:00 a 13:00 como LUNCH', () => {
      const testDate = new Date('2026-11-06T10:00:00');
      const rows = buildTimeGridRows(testDate, [mockDoctor], mockAvailability);

      const row1200 = rows.find((r) => r.timeLabel === '12:00');
      const row1230 = rows.find((r) => r.timeLabel === '12:30');

      expect(row1200?.layers[0].status).toBe('LUNCH');
      expect(row1230?.layers[0].status).toBe('LUNCH');
    });

    it('debe marcar fuera de horario (OUT_OF_HOURS) las filas posteriores a las 17:00', () => {
      const testDate = new Date('2026-11-06T10:00:00');
      const rows = buildTimeGridRows(testDate, [mockDoctor], mockAvailability);

      const row1730 = rows.find((r) => r.timeLabel === '17:30');
      expect(row1730?.layers[0].status).toBe('OUT_OF_HOURS');
    });

    it('debe marcar todo el día como OUT_OF_HOURS si la fecha seleccionada no es día laborable del médico (ej. Domingo)', () => {
      const sundayDate = new Date('2026-11-08T10:00:00'); // Domingo
      const rows = buildTimeGridRows(sundayDate, [mockDoctor], {});

      expect(rows.every((r) => r.layers[0].status === 'OUT_OF_HOURS')).toBe(true);
    });

    it('debe priorizar CONFIRMED sobre AVAILABLE cuando dos slots de 45 min solapan un mismo bloque de 30 min', () => {
      const testDate = new Date('2026-11-06T10:00:00');
      const availabilityWithOverlap: Record<string, IDayAvailability[]> = {
        '1001': [
          {
            date: '2026-11-06',
            dayName: 'Viernes',
            isCalendarSynced: true,
            isWorkingDay: true,
            slots: [
              {
                startTime: '2026-11-06T13:00:00.000Z', // 08:00 COT
                endTime: '2026-11-06T13:45:00.000Z',   // 08:45 COT
                display: '08:00 - 08:45',
                colorId: null,
                isBookable: true,
                status: 'AVAILABLE',
                title: 'Espacio disponible',
              },
              {
                startTime: '2026-11-06T13:45:00.000Z', // 08:45 COT
                endTime: '2026-11-06T14:30:00.000Z',   // 09:30 COT
                display: '08:45 - 09:30',
                colorId: '2',
                isBookable: false,
                status: 'CONFIRMED',
                title: 'Control Dermatológico',
              },
            ],
          },
        ],
      };

      const rows = buildTimeGridRows(testDate, [mockDoctor], availabilityWithOverlap);
      const row0800 = rows.find((r) => r.timeLabel === '08:00');
      const row0830 = rows.find((r) => r.timeLabel === '08:30');

      expect(row0800?.layers[0].status).toBe('AVAILABLE');
      expect(row0800?.layers[0].procedureTitle).toBeUndefined();
      expect(row0830?.layers[0].status).toBe('CONFIRMED');
      expect(row0830?.layers[0].procedureTitle).toBe('Control Dermatológico');
    });
  });

  describe('computeMonthlyKpis', () => {
    it('debe calcular los KPIs del mes y generar los títulos dinámicos con el mes capitalizado', () => {
      const mockDays: IDayAvailability[] = [
        {
          date: '2026-11-05',
          dayName: 'Jueves',
          isCalendarSynced: true,
          isWorkingDay: true,
          slots: [
            { startTime: '09:00', endTime: '09:45', display: '09:00 - 09:45', title: 'Cita 1', colorId: null, isBookable: false, status: 'CONFIRMED' },
            { startTime: '10:00', endTime: '10:45', display: '10:00 - 10:45', title: 'Cita 2', colorId: null, isBookable: false, status: 'TENTATIVE' },
          ],
        },
        {
          date: '2026-11-20',
          dayName: 'Viernes',
          isCalendarSynced: true,
          isWorkingDay: true,
          slots: [
            { startTime: '11:00', endTime: '11:45', display: '11:00 - 11:45', title: 'Cita 3', colorId: null, isBookable: false, status: 'CONFIRMED' },
            { startTime: '14:00', endTime: '14:45', display: '14:00 - 14:45', title: 'Cita 4', colorId: null, isBookable: false, status: 'TENTATIVE' },
            { startTime: '15:00', endTime: '15:45', display: '15:00 - 15:45', title: 'Cita 5', colorId: null, isBookable: false, status: 'TENTATIVE' },
          ],
        },
      ];

      const testDate = new Date('2026-11-06T10:00:00');
      const kpis = computeMonthlyKpis(mockDays, testDate);

      expect(kpis.confirmedCount).toBe(2);
      expect(kpis.scheduledCount).toBe(3);
      expect(kpis.monthName).toBe('Noviembre');
      expect(kpis.monthYearLabel).toBe('Noviembre 2026');
      expect(kpis.confirmedTitle).toBe('Citas de Noviembre Confirmadas');
      expect(kpis.scheduledTitle).toBe('Citas de Noviembre Agendadas');
    });

    it('debe adaptar dinámicamente el título si la fecha activa es en otro mes (ej: Diciembre)', () => {
      const decDate = new Date('2026-12-15T10:00:00');
      const kpis = computeMonthlyKpis([], decDate);

      expect(kpis.monthName).toBe('Diciembre');
      expect(kpis.confirmedTitle).toBe('Citas de Diciembre Confirmadas');
      expect(kpis.scheduledTitle).toBe('Citas de Diciembre Agendadas');
      expect(kpis.confirmedCount).toBe(0);
      expect(kpis.scheduledCount).toBe(0);
    });
  });

  describe('findNextAvailableDate', () => {
    it('debe encontrar el primer día con turno disponible posterior a la fecha de referencia y formatearlo en DD/MM/YYYY', () => {
      const mockDays: IDayAvailability[] = [
        {
          date: '2026-11-05',
          dayName: 'Jueves',
          isCalendarSynced: true,
          isWorkingDay: true,
          slots: [
            { startTime: '09:00', endTime: '09:45', display: '09:00 - 09:45', title: 'Cita', colorId: null, isBookable: false, status: 'CONFIRMED' },
          ],
        },
        {
          date: '2026-11-10',
          dayName: 'Martes',
          isCalendarSynced: true,
          isWorkingDay: true,
          slots: [
            { startTime: '08:00', endTime: '08:45', display: '08:00 - 08:45', title: 'Libre', colorId: null, isBookable: true, status: 'AVAILABLE' },
          ],
        },
      ];

      const refDate = new Date('2026-11-06T08:00:00');
      const nextDate = findNextAvailableDate(mockDays, refDate);
      expect(nextDate).toBe('10/11/2026');
    });

    it('debe retornar "Sin Cupos este mes" si no hay slots disponibles o el arreglo es vacío', () => {
      expect(findNextAvailableDate([])).toBe('Sin Cupos este mes');
      expect(findNextAvailableDate(undefined)).toBe('Sin Cupos este mes');
    });
  });

  describe('computeWeeklyKpis', () => {
    it('debe sumar correctamente las citas confirmadas y agendadas de la semana', () => {
      const mockDays: IDayAvailability[] = [
        {
          date: '2026-11-02',
          dayName: 'Lunes',
          isCalendarSynced: true,
          isWorkingDay: true,
          slots: [
            { startTime: '09:00', endTime: '09:45', display: '09:00 - 09:45', title: 'Cita 1', colorId: null, isBookable: false, status: 'CONFIRMED' },
            { startTime: '10:00', endTime: '10:45', display: '10:00 - 10:45', title: 'Cita 2', colorId: null, isBookable: false, status: 'TENTATIVE' },
            { startTime: '11:00', endTime: '11:45', display: '11:00 - 11:45', title: 'Cita 3', colorId: null, isBookable: true, status: 'AVAILABLE' },
          ],
        },
        {
          date: '2026-11-03',
          dayName: 'Martes',
          isCalendarSynced: true,
          isWorkingDay: true,
          slots: [
            { startTime: '14:00', endTime: '14:45', display: '14:00 - 14:45', title: 'Cita 4', colorId: null, isBookable: false, status: 'CONFIRMED' },
            { startTime: '15:00', endTime: '15:45', display: '15:00 - 15:45', title: 'Cita 5', colorId: null, isBookable: false, status: 'CONFIRMED' },
            { startTime: '16:00', endTime: '16:45', display: '16:00 - 16:45', title: 'Cita 6', colorId: null, isBookable: false, status: 'TENTATIVE' },
          ],
        },
      ];

      const kpis = computeWeeklyKpis(mockDays, '2026-11-02 al 2026-11-08');

      expect(kpis.confirmedCount).toBe(3);
      expect(kpis.scheduledCount).toBe(2);
      expect(kpis.weekRangeLabel).toBe('2026-11-02 al 2026-11-08');
    });

    it('debe devolver 0 si no hay disponibilidad provista', () => {
      const kpis = computeWeeklyKpis(undefined);
      expect(kpis.confirmedCount).toBe(0);
      expect(kpis.scheduledCount).toBe(0);
    });
  });
});
