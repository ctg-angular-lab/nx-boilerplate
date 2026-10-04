import {
  IBookingPatient,
  IProcedure,
  IProfessionalSummary,
} from '@nx-boilerplate/api-interfaces';

export const AGENDADOR_TABS = {
  FORM: 1,
  CALENDAR: 2,
  PROFESSIONALS: 3,
} as const;

export type AgendadorTabId = (typeof AGENDADOR_TABS)[keyof typeof AGENDADOR_TABS];

export interface IBookingContext {
  patient: IBookingPatient;
  procedure: IProcedure;
  doctor: IProfessionalSummary;
}
