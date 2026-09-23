import { Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { google, calendar_v3 } from 'googleapis';
import * as fs from 'fs';
import {
  ICalendarProvider,
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

  async getBusyIntervals(calendarEmail: string, fromDate: Date, toDate: Date): Promise<ITimeSlot[]> {
    try {
      const response = await this.calendarClient.freebusy.query({
        requestBody: {
          timeMin: fromDate.toISOString(),
          timeMax: toDate.toISOString(),
          timeZone: 'America/Bogota',
          items: [{ id: calendarEmail }],
        },
      });

      const calendars = response.data.calendars;
      if (!calendars || !calendars[calendarEmail]) {
        return [];
      }

      const busyList = calendars[calendarEmail].busy || [];
      const slots: ITimeSlot[] = [];
      for (const item of busyList) {
        if (item.start && item.end) {
          slots.push({
            start: new Date(item.start),
            end: new Date(item.end),
          });
        }
      }
      return slots;
    } catch (error) {
      this.logger.error(`Fallo consultando freebusy para ${calendarEmail}: ${(error as Error).message}`);
      throw new RpcException(`Error al consultar disponibilidad en Google Calendar: ${(error as Error).message}`);
    }
  }

  async createEvent(eventData: ICreateAppointmentEvent): Promise<string> {
    try {
      const response = await this.calendarClient.events.insert({
        calendarId: eventData.doctorEmail,
        requestBody: {
          summary: `Cita Médica: ${eventData.procedureName} - ${eventData.patientFullName}`,
          description: `Procedimiento: ${eventData.procedureName}\nPaciente: ${eventData.patientFullName}\nCorreo Paciente: ${eventData.patientEmail}\nNotas: ${eventData.notes || 'Ninguna'}`,
          start: {
            dateTime: eventData.startTime.toISOString(),
            timeZone: 'America/Bogota',
          },
          end: {
            dateTime: eventData.endTime.toISOString(),
            timeZone: 'America/Bogota',
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
}
