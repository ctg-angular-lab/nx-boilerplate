import { TimeSlot } from '@nx-boilerplate/api-interfaces';

/**
 * Convierte minutos desde medianoche a formato 12 horas (ej. 08:45 AM)
 */
export function formatTime12h(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  const formattedHours = displayHours < 10 ? `0${displayHours}` : `${displayHours}`;
  const formattedMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;
  return `${formattedHours}:${formattedMinutes} ${period}`;
}

/**
 * Generador declarativo de slots de tiempo de 45 minutos (08:00 AM - 07:00 PM)
 */
export function generateDaySlots(
  dayPrefix: string,
  reservedIndices: number[] = [],
  reservedByDoctors: string[] = ['Dra. Botero', 'Dr. Mendoza', 'Dr. Restrepo']
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const startMinutes = 8 * 60; // 08:00 AM (480)
  const endMinutes = 19 * 60;  // 07:00 PM (1140)
  const intervalMinutes = 45;
  let slotIndex = 0;

  for (let current = startMinutes; current + intervalMinutes <= endMinutes; current += intervalMinutes) {
    const isReserved = reservedIndices.includes(slotIndex);
    const doctor = isReserved ? reservedByDoctors[slotIndex % reservedByDoctors.length] : undefined;
    slots.push({
      id: `${dayPrefix}-slot-${slotIndex + 1}`,
      time: formatTime12h(current),
      status: isReserved ? 'reservado' : 'disponible',
      ...(doctor && { reservedBy: doctor }),
    });
    slotIndex++;
  }

  return slots;
}
