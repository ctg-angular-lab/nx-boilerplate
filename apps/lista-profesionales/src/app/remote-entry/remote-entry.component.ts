import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  TemplateRef,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabsCollectionComponent, TabItem } from '@nx-boilerplate/layouts';
import { ProfesionalesListComponent } from '../components/profesionales-list/profesionales-list.component';
import { ProfesionalesFormComponent } from '../components/profesionales-form/profesionales-form.component';
import {
  PROFESIONALES_TABS,
  ProfesionalesTabId,
} from '../models/profesionales-nav.models';
import { ProfesionalesAdminService } from '../services/profesionales-admin.service';

@Component({
  selector: 'app-lista-profesionales-entry',
  standalone: true,
  imports: [
    CommonModule,
    TabsCollectionComponent,
    ProfesionalesListComponent,
    ProfesionalesFormComponent,
  ],
  templateUrl: './remote-entry.component.html',
  styleUrl: './remote-entry.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RemoteEntryComponent {
  readonly profesionalesService = inject(ProfesionalesAdminService);

  readonly listTabTpl = viewChild<TemplateRef<unknown>>('listTab');
  readonly formTabTpl = viewChild<TemplateRef<unknown>>('formTab');

  readonly tabs = computed<TabItem[]>(() => {
    const isEdit = this.profesionalesService.isEditMode();
    return [
      {
        id: PROFESIONALES_TABS.LIST,
        label: 'Lista de Profesionales',
        icon: 'badge',
        contentTemplate: this.listTabTpl(),
      },
      {
        id: PROFESIONALES_TABS.FORM,
        label: isEdit ? 'Editar Profesional' : 'Agregar Profesional',
        icon: isEdit ? 'edit_note' : 'person_add',
        contentTemplate: this.formTabTpl(),
      },
    ];
  });

  constructor() {
    this.profesionalesService.loadProfesionales();
    this.profesionalesService.loadProcedures();
  }

  onActiveTabChange(tabId: string | number | undefined): void {
    if (
      tabId === PROFESIONALES_TABS.LIST ||
      tabId === PROFESIONALES_TABS.FORM
    ) {
      this.profesionalesService.setActiveTab(tabId as ProfesionalesTabId);
    }
  }
}
