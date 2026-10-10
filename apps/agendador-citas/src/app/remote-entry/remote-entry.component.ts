import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  viewChild,
  TemplateRef,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  TabsCollectionComponent,
  TabItemConfig,
} from '@nx-boilerplate/layouts';
import { AgendarCitaComponent } from '../components/agendar-cita/agendar-cita.component';
import { CalendarioCitasComponent } from '../components/calendario-citas/calendario-citas.component';
import { ConfirmacionCitasComponent } from '../components/confirmacion-citas/confirmacion-citas.component';
import { AGENDADOR_TABS, AgendadorTabId } from '../models/booking.models';
import { AppointmentLogicService } from '../services/appointment-logic.service';

@Component({
  selector: 'app-agendador-citas-entry',
  standalone: true,
  imports: [
    CommonModule,
    TabsCollectionComponent,
    AgendarCitaComponent,
    CalendarioCitasComponent,
    ConfirmacionCitasComponent,
  ],
  templateUrl: './remote-entry.component.html',
  styleUrl: './remote-entry.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RemoteEntryComponent {
  protected readonly appointmentLogic = inject(AppointmentLogicService);

  // Query Signals de los ng-template proyectados en la vista
  private readonly appointmentTpl =
    viewChild<TemplateRef<void>>('appointmentTab');
  private readonly calendarTpl = viewChild<TemplateRef<void>>('calendarTab');
  private readonly confirmationTpl =
    viewChild<TemplateRef<void>>('confirmationTab');

  /**
   * Sincroniza la pestaña activa con el servicio de orquestación
   */
  onActiveTabChange(id: string | number | undefined): void {
    if (typeof id === 'number') {
      this.appointmentLogic.setActiveTab(id as AgendadorTabId);
    }
  }

  /**
   * Estado base reactivo de configuración de pestañas
   */
  private readonly rawTabs = signal<Omit<TabItemConfig, 'contentTemplate'>[]>([
    {
      id: AGENDADOR_TABS.FORM,
      label: 'Agendar Cita',
      icon: 'calendar_add_on',
      disabled: false,
    },
    {
      id: AGENDADOR_TABS.CALENDAR,
      label: 'Calendario',
      icon: 'dataset',
      disabled: false,
    },
    {
      id: AGENDADOR_TABS.PROFESSIONALS,
      label: 'Confirmación de Citas',
      icon: 'fact_check',
      disabled: false,
    },
  ]);

  /**
   * Signal computado puro para enlazar cada TemplateRef al Tab correspondiente
   */
  readonly tabs = computed<TabItemConfig[]>(() => {
    const raw = this.rawTabs();
    const templates = [
      this.appointmentTpl(),
      this.calendarTpl(),
      this.confirmationTpl(),
    ];

    return raw.map((tab, index) => ({
      ...tab,
      contentTemplate: templates[index],
    }));
  });
}
