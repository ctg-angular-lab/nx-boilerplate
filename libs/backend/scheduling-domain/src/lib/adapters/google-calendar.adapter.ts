import { Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { google, calendar_v3 } from 'googleapis';
import * as fs from 'fs';
import {
  ICalendarProvider,
  ICalendarBusyResult,
  ICalendarEventItem,
  ITimeSlot,
  ICreateAppointmentEvent,
} from '../ports/calendar-provider.port';

@Injectable()
export class GoogleCalendarAdapter implements ICalendarProvider {
  private readonly logger = new Logger(GoogleCalendarAdapter.name);
  private calendarClient!: calendar_v3.Calendar;

  constructor() {
    this.initGoogleClient();
  }

  private initGoogleClient(): void {
    try {
      let clientEmail = process.env['GOOGLE_SERVICE_ACCOUNT_EMAIL'];
      let privateKey = process.env['GOOGLE_PRIVATE_KEY'];

      const credentialsPath = process.env['GOOGLE_APPLICATION_CREDENTIALS'];

      if (credentialsPath && fs.existsSync(credentialsPath)) {
        this.logger.log(`Cargando credenciales de Service Account desde archivo: ${credentialsPath}`);
        const fileContent = fs.readFileSync(credentialsPath, 'utf8');
        const parsed = JSON.parse(fileContent);
        clientEmail = parsed.client_email;
        privateKey = parsed.private_key;
      }

      if (!clientEmail || !privateKey) {
        throw new Error(
          'Faltan variables de autenticación de Google Calendar (GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_PRIVATE_KEY o GOOGLE_APPLICATION_CREDENTIALS)'
        );
      }

      const normalizedPrivateKey = privateKey.replace(/\\n/g, '\n');

      const auth = new google.auth.JWT({
        email: clientEmail,
        key: normalizedPrivateKey,
        scopes: ['https://www.googleapis.com/auth/calendar'],
      });

      this.calendarClient = google.calendar({ version: 'v3', auth });
      this.logger.log('Cliente Google Calendar v3 inicializado exitosamente');
    } catch (error) {
      this.logger.error(`Error al inicializar cliente de Google Calendar: ${(error as Error).message}`);
      throw new RpcException(`Error de autenticación con Google Calendar: ${(error as Error).message}`);
    }
  }

  async getEventsInRange(doctorEmail: string, fromDate: Date, toDate: Date): Promise<ICalendarEventItem[]> {
    try {
      const response = await this.calendarClient.events.list({
        calendarId: doctorEmail,
        timeMin: fromDate.toISOString(),
        timeMax: toDate.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
      });

      const rawItems = response.data.items || [];
      const validEvents: ICalendarEventItem[] = [];

      for (const event of rawItems) {
        const startIso = event.start?.dateTime || event.start?.date;
        const endIso = event.end?.dateTime || event.end?.date;
        if (!startIso || !endIso) {
          continue;
        }

        const attendees = event.attendees || [];
        const doctorAttendee = attendees.find((a) => a.email?.toLowerCase() === doctorEmail.toLowerCase());
        const patientAttendee = attendees.find((a) => a.email?.toLowerCase() !== doctorEmail.toLowerCase());

        const doctorResponse = doctorAttendee?.responseStatus;
        const patientResponse = patientAttendee?.responseStatus;

        // Regla de Veto
        let derivedStatus: 'CANCELLED' | 'CONFIRMED' | 'TENTATIVE';
        if (doctorResponse === 'declined' || patientResponse === 'declined' || event.status === 'cancelled') {
          derivedStatus = 'CANCELLED';
        } else if (patientResponse === 'accepted' || event.status === 'confirmed') {
          derivedStatus = 'CONFIRMED';
        } else {
          derivedStatus = 'TENTATIVE';
        }

        // Excluir eventos cancelados o vetados
        if (derivedStatus === 'CANCELLED') {
          continue;
        }

        const isCreatedByApp = Boolean(
          event.summary?.startsWith('Cita Médica:') || event.description?.includes('Procedimiento:')
        );

        validEvents.push({
          id: event.id || '',
          summary: event.summary || '',
          start: new Date(startIso),
          end: new Date(endIso),
          colorId: event.colorId || null,
          isCreatedByApp,
          derivedStatus,
        });
      }

      return validEvents;
    } catch (error) {
      this.logger.warn(
        `Error al obtener eventos de Google Calendar para ${doctorEmail}: ${(error as Error).message}`
      );
      throw error;
    }
  }

  async getBusyIntervals(calendarEmail: string, fromDate: Date, toDate: Date): Promise<ICalendarBusyResult> {
    try {
      const events = await this.getEventsInRange(calendarEmail, fromDate, toDate);
      const intervals: ITimeSlot[] = events.map((event) => ({
        start: event.start,
        end: event.end,
      }));

      return { intervals, isSynced: true };
    } catch (error) {
      this.logger.warn(
        `No se pudo sincronizar Google Calendar para ${calendarEmail} (${(error as Error).message}). ` +
          `Marcando como no sincronizado.`
      );
      return { intervals: [], isSynced: false };
    }
  }

  async createEvent(eventData: ICreateAppointmentEvent): Promise<string> {
    try {
      const descriptionLines = [
        `Procedimiento: ${eventData.procedureName}`,
        `Paciente: ${eventData.patientFullName}`,
        `Correo: ${eventData.patientEmail}`,
        ...(eventData.patientPhone ? [`Teléfono: ${eventData.patientPhone}`] : []),
        ...(eventData.patientNationalId ? [`Cédula: ${eventData.patientNationalId}`] : []),
        `Notas: ${eventData.notes || 'Ninguna'}`,
      ];

      const response = await this.calendarClient.events.insert({
        calendarId: eventData.doctorEmail,
        sendUpdates: 'none',
        requestBody: {
          summary: `Cita Médica: ${eventData.procedureName} - ${eventData.patientFullName}`,
          description: descriptionLines.join('\n'),
          status: 'tentative',
          colorId: '5',
          start: {
            dateTime: eventData.startTime.toISOString(),
            timeZone: 'America/Bogota',
          },
          end: {
            dateTime: eventData.endTime.toISOString(),
            timeZone: 'America/Bogota',
          },
          extendedProperties: {
            private: {
              procedureName: eventData.procedureName,
              patientFullName: eventData.patientFullName,
              patientEmail: eventData.patientEmail,
              patientPhone: eventData.patientPhone || '',
              patientNationalId: eventData.patientNationalId || '',
              notes: eventData.notes || '',
            },
          },
          reminders: {
            useDefault: false,
            overrides: [
              { method: 'popup', minutes: 30 },
              { method: 'email', minutes: 1440 },
            ],
          },
        },
      });

      if (!response.data.id) {
        throw new Error('Google Calendar no retornó un ID de evento válido');
      }

      this.logger.log(`Evento creado en Google Calendar con ID: ${response.data.id}`);
      return response.data.id;
    } catch (error) {
      this.logger.error(`Error al insertar evento en Google Calendar: ${(error as Error).message}`);
      throw new RpcException(`Error al crear cita en Google Calendar: ${(error as Error).message}`);
    }
  }

  async updateEventStatus(
    doctorEmail: string,
    eventId: string,
    status: 'CONFIRMED' | 'CANCELLED'
  ): Promise<void> {
    try {
      const isConfirmed = status === 'CONFIRMED';
      const colorId = isConfirmed ? '10' : '11';
      const eventStatus = isConfirmed ? 'confirmed' : 'cancelled';

      await this.calendarClient.events.patch({
        calendarId: doctorEmail,
        eventId,
        sendUpdates: 'none',
        requestBody: {
          colorId,
          status: eventStatus,
        },
      });

      this.logger.log(
        `Evento de Google Calendar ${eventId} actualizado a status=${eventStatus}, colorId=${colorId}`
      );
    } catch (error) {
      this.logger.error(
        `Error al actualizar evento ${eventId} en Google Calendar: ${(error as Error).message}`
      );
      throw new RpcException(`Error al sincronizar con Google Calendar: ${(error as Error).message}`);
    }
  }
}

