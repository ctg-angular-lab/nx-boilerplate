import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  afterNextRender,
  inject,
  viewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  AsideModalService,
  ConfirmationModalComponent,
  ConfirmationModalData,
  DataTableComponent,
  TableActionDef,
  TableColumnDef,
} from '@nx-boilerplate/layouts';
import { IPatientDirectoryRow } from '../../models/historial-pacientes.models';
import { HistorialPacientesService } from '../../services/historial-pacientes.service';
import { PacienteDemographicFormComponent } from '../paciente-demographic-form/paciente-demographic-form.component';

@Component({
  selector: 'app-pacientes-directory',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
    DataTableComponent,
  ],
  templateUrl: './pacientes-directory.component.html',
  styleUrl: './pacientes-directory.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PacientesDirectoryComponent {
  readonly service = inject(HistorialPacientesService);
  private readonly dialog = inject(MatDialog);
  private readonly asideModalService = inject(AsideModalService);

  readonly estadoFichaTemplate = viewChild<TemplateRef<{ $implicit: IPatientDirectoryRow }>>('estadoFichaTpl');

  readonly columns: TableColumnDef<IPatientDirectoryRow>[] = [
    {
      field: 'cedula',
      header: 'Documento',
      sortable: true,
      width: '140px',
      formatter: (row) => `${row.tipo_documento || 'CC'} ${row.cedula}`,
    },
    {
      field: 'nombreCompleto',
      header: 'Paciente',
      sortable: true,
    },
    {
      field: 'celular',
      header: 'Celular',
      sortable: false,
      width: '130px',
    },
    {
      field: 'correo',
      header: 'Correo Electrónico',
      sortable: true,
    },
    {
      field: 'edad',
      header: 'Edad',
      sortable: true,
      width: '100px',
      formatter: (row) => (row.edad !== null ? `${row.edad} años` : 'N/R'),
    },
    {
      field: 'estadoFichaLabel',
      header: 'Ficha Demográfica',
      sortable: true,
      width: '160px',
    },
  ];

  constructor() {
    afterNextRender(() => {
      const tpl = this.estadoFichaTemplate();
      if (tpl) {
        this.columns[5].cellTemplate = tpl;
      }
    });
  }

  readonly directoryActions: TableActionDef<IPatientDirectoryRow>[] = [
    {
      id: 'view-expediente',
      label: 'Ver Expediente',
      icon: 'visibility',
      color: 'primary',
    },
  ];

  onTableAction(event: { action: string; row: IPatientDirectoryRow }): void {
    if (event.action === 'view-expediente') {
      this.service.selectAndLoadPatientExpediente(event.row.cedula);
    }
  }

  onRowClick(row: IPatientDirectoryRow): void {
    this.service.selectAndLoadPatientExpediente(row.cedula);
  }

  onAgregarPaciente(): void {
    const modalData: ConfirmationModalData<boolean> = {
      title: 'Registrar Paciente sin Cita Previa',
      text: 'Está a punto de crear un nuevo historial de paciente sin cita previa. ¿Desea continuar?',
      actions: [
        { label: 'Cancelar', color: 'default', value: false },
        {
          label: 'Continuar',
          color: 'primary',
          value: true,
          icon: 'person_add',
        },
      ],
    };

    const dialogRef = this.dialog.open(ConfirmationModalComponent, {
      data: modalData,
      width: '450px',
      disableClose: false,
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.openPatientFormModal();
      }
    });
  }

  private openPatientFormModal(): void {
    const asideRef = this.asideModalService.open<PacienteDemographicFormComponent>(
      {
        title: 'Registrar Nuevo Paciente (Sin Cita Previa)',
        component: PacienteDemographicFormComponent,
        showActions: false,
        showCloseIcon: true,
      },
      {
        width: '680px',
      }
    );

    asideRef.afterClosed().subscribe((savedPatient) => {
      if (savedPatient) {
        // La lista reactiva en el servicio ya se actualiza internamente con el tap()
      }
    });
  }
}
