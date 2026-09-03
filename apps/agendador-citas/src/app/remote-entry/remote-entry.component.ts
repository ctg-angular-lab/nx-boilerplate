import {
  Component,
  ChangeDetectionStrategy,
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
  // Query Signals de los ng-template proyectados en la vista
  private readonly appointmentTpl =
    viewChild<TemplateRef<void>>('appointmentTab');
  private readonly calendarTpl = viewChild<TemplateRef<void>>('calendarTab');
  private readonly professionalsTpl =
    viewChild<TemplateRef<void>>('professionalsTab');

  /**
   * Estado base reactivo de configuración de pestañas
   */
  private readonly rawTabs = signal<Omit<TabItemConfig, 'contentTemplate'>[]>([
    {
      id: 1,
      label: 'Agendar Cita',
      icon: 'calendar_add_on',
      disabled: false,
    },
    {
      id: 2,
      label: 'Calendario',
      icon: 'dataset',
      disabled: false,
    },
    {
      id: 3,
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
