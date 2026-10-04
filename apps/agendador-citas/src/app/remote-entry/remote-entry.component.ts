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
import { ListaProfesionalesComponent } from '../components/lista-profesionales/lista-profesionales.component';
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
    ListaProfesionalesComponent,
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
  private readonly professionalsTpl =
    viewChild<TemplateRef<void>>('professionalsTab');

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
      label: 'Profesionales Disponibles',
      icon: 'article_person',
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
      this.professionalsTpl(),
    ];

    return raw.map((tab, index) => ({
      ...tab,
      contentTemplate: templates[index],
    }));
  });
}
