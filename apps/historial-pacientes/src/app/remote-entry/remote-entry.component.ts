import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  inject,
  OnInit,
  OnDestroy,
  viewChild,
} from '@angular/core';
import {
  TabItem,
  TabsCollectionComponent,
} from '@nx-boilerplate/layouts';
import { PacienteExpedienteComponent } from '../components/paciente-expediente/paciente-expediente.component';
import { PacientesDirectoryComponent } from '../components/pacientes-directory/pacientes-directory.component';
import {
  HISTORIAL_TABS,
  HistorialTabId,
} from '../models/historial-pacientes.models';
import { HistorialPacientesService } from '../services/historial-pacientes.service';

@Component({
  selector: 'app-historial-pacientes-entry',
  standalone: true,
  imports: [
    TabsCollectionComponent,
    PacientesDirectoryComponent,
    PacienteExpedienteComponent,
  ],
  templateUrl: './remote-entry.component.html',
  styleUrl: './remote-entry.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RemoteEntryComponent implements OnInit, OnDestroy {
  readonly service = inject(HistorialPacientesService);

  readonly directoryTabTpl = viewChild<TemplateRef<unknown>>('directoryTab');
  readonly expedienteTabTpl = viewChild<TemplateRef<unknown>>('expedienteTab');

  readonly tabs = computed<TabItem[]>(() => {
    const selected = this.service.selectedPatient();
    const expedienteLabel = selected
      ? `Expediente: ${selected.nombre} ${selected.apellidos}`
      : 'Expediente Clínico';

    return [
      {
        id: HISTORIAL_TABS.DIRECTORY,
        label: 'Directorio de Pacientes',
        icon: 'groups',
        contentTemplate: this.directoryTabTpl(),
      },
      {
        id: HISTORIAL_TABS.EXPEDIENTE,
        label: expedienteLabel,
        icon: 'folder_shared',
        contentTemplate: this.expedienteTabTpl(),
      },
    ];
  });

  ngOnInit(): void {
    this.service.clearSelectedPatient();
    this.service.loadPatients();
    this.service.loadDoctors();
    this.service.loadProcedures();
  }

  ngOnDestroy(): void {
    this.service.clearSelectedPatient();
  }

  onActiveTabChange(tabId: string | number | undefined): void {
    if (
      tabId === HISTORIAL_TABS.DIRECTORY ||
      tabId === HISTORIAL_TABS.EXPEDIENTE
    ) {
      this.service.setActiveTab(tabId as HistorialTabId);
    }
  }
}
