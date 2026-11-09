import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  OnDestroy,
  TemplateRef,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabsCollectionComponent, TabItem } from '@nx-boilerplate/layouts';
import { ProcedimientosListComponent } from '../components/procedimientos-list/procedimientos-list.component';
import { ProcedimientosFormComponent } from '../components/procedimientos-form/procedimientos-form.component';
import {
  PROCEDIMIENTOS_TABS,
  ProcedimientosTabId,
} from '../models/procedimientos-nav.models';
import { ProcedimientosAdminService } from '../services/procedimientos-admin.service';

@Component({
  selector: 'app-procedimientos-medicos-entry',
  standalone: true,
  imports: [
    CommonModule,
    TabsCollectionComponent,
    ProcedimientosListComponent,
    ProcedimientosFormComponent,
  ],
  templateUrl: './remote-entry.component.html',
  styleUrl: './remote-entry.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RemoteEntryComponent implements OnInit, OnDestroy {
  readonly procedimientosService = inject(ProcedimientosAdminService);

  readonly listTabTpl = viewChild<TemplateRef<unknown>>('listTab');
  readonly formTabTpl = viewChild<TemplateRef<unknown>>('formTab');

  readonly tabs = computed<TabItem[]>(() => {
    const isEdit = this.procedimientosService.isEditMode();
    const isRestore = this.procedimientosService.isRestoringInactive();

    let formLabel = 'Agregar Procedimiento';
    let formIcon = 'add_circle';

    if (isRestore) {
      formLabel = 'Reactivar Procedimiento';
      formIcon = 'history';
    } else if (isEdit) {
      formLabel = 'Editar Procedimiento';
      formIcon = 'edit_note';
    }

    return [
      {
        id: PROCEDIMIENTOS_TABS.LIST,
        label: 'Lista de Procedimientos',
        icon: 'list_alt',
        contentTemplate: this.listTabTpl(),
      },
      {
        id: PROCEDIMIENTOS_TABS.FORM,
        label: formLabel,
        icon: formIcon,
        contentTemplate: this.formTabTpl(),
      },
    ];
  });

  ngOnInit(): void {
    this.procedimientosService.setActiveTab(PROCEDIMIENTOS_TABS.LIST);
    this.procedimientosService.loadProcedimientos();
    this.procedimientosService.loadDoctors();
  }

  ngOnDestroy(): void {
    this.procedimientosService.setActiveTab(PROCEDIMIENTOS_TABS.LIST);
  }

  onActiveTabChange(tabId: string | number | undefined): void {
    if (
      tabId === PROCEDIMIENTOS_TABS.LIST ||
      tabId === PROCEDIMIENTOS_TABS.FORM
    ) {
      this.procedimientosService.setActiveTab(tabId as ProcedimientosTabId);
    }
  }
}
