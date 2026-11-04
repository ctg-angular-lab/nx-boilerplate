import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  afterNextRender,
  computed,
  inject,
  viewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
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
import {
  HISTORIAL_TABS,
  IClinicalRecordRow,
  isDemographicComplete,
} from '../../models/historial-pacientes.models';
import { HistorialPacientesService } from '../../services/historial-pacientes.service';
import { ClinicalRecordDetailComponent } from '../clinical-record-detail/clinical-record-detail.component';
import { ClinicalRecordFormComponent } from '../clinical-record-form/clinical-record-form.component';
import { PacienteDemographicFormComponent } from '../paciente-demographic-form/paciente-demographic-form.component';

@Component({
  selector: 'app-paciente-expediente',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
    MatDividerModule,
    MatExpansionModule,
    DataTableComponent,
    PacienteDemographicFormComponent,
  ],
  templateUrl: './paciente-expediente.component.html',
  styleUrl: './paciente-expediente.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PacienteExpedienteComponent {
  readonly service = inject(HistorialPacientesService);
  private readonly dialog = inject(MatDialog);
  private readonly asideModalService = inject(AsideModalService);

  readonly estadoRegistroTemplate = viewChild<TemplateRef<{ $implicit: IClinicalRecordRow }>>('estadoRegistroTpl');

  readonly selectedPatient = this.service.selectedPatient;
  readonly isComplete = computed(() => isDemographicComplete(this.selectedPatient()));

  readonly recordColumns: TableColumnDef<IClinicalRecordRow>[] = [
    {
      field: 'appointmentIdDisplay',
      header: 'Cita / ID',
      width: '130px',
      sortable: true,
    },
    {
      field: 'fechaAtencion',
      header: 'Fecha Atención',
      width: '140px',
      sortable: true,
    },
    {
      field: 'procedimientoRealizado',
      header: 'Procedimiento',
      sortable: true,
    },
    {
      field: 'medicoNombre',
      header: 'Médico Tratante',
      sortable: true,
    },
    {
      field: 'estadoRegistroLabel',
      header: 'Estado de Atención',
      width: '180px',
      sortable: true,
    },
  ];

  readonly recordActions: TableActionDef<IClinicalRecordRow>[] = [
    {
      id: 'view-record',
      label: 'Ver Historia Clínica',
      icon: 'visibility',
      color: 'primary',
    },
    {
      id: 'edit-record',
      label: 'Diligenciar / Editar',
      icon: 'edit',
      color: 'accent',
    },
  ];

  constructor() {
    afterNextRender(() => {
      const tpl = this.estadoRegistroTemplate();
      if (tpl) {
        this.recordColumns[4].cellTemplate = tpl;
      }
    });
  }

  onVolverAlDirectorio(): void {
    this.service.clearSelectedPatient();
  }

  onTableAction(event: { action: string; row: IClinicalRecordRow }): void {
    const patient = this.selectedPatient();
    if (!patient) return;

    if (event.action === 'view-record') {
      this.asideModalService.open<ClinicalRecordDetailComponent>(
        {
          title: 'Detalle de la Atención Clínica (Resolución 1995/1999)',
          component: ClinicalRecordDetailComponent,
          inputs: {
            record: event.row.raw,
            patient: patient,
            doctorName: event.row.medicoNombre,
          },
          showActions: false,
          showCloseIcon: true,
        },
        {
          width: '560px',
        }
      );
    } else if (event.action === 'edit-record') {
      this.asideModalService.open<ClinicalRecordFormComponent>(
        {
          title: 'Diligenciamiento de Historia Clínica',
          component: ClinicalRecordFormComponent,
          inputs: {
            record: event.row.raw,
            patient: patient,
            doctorName: event.row.medicoNombre,
          },
          showActions: false,
          showCloseIcon: true,
        },
        {
          width: '680px',
        }
      );
    }
  }

  onNuevaAtencionManual(): void {
    const patient = this.selectedPatient();
    if (!patient) return;

    const modalData: ConfirmationModalData<boolean> = {
      title: 'Registrar Atención Clínica sin Cita Previa',
      text: `¿Desea crear un nuevo registro de atención clínica manual para el paciente ${patient.nombre} ${patient.apellidos}?`,
      actions: [
        { label: 'Cancelar', color: 'default', value: false },
        {
          label: 'Continuar',
          color: 'primary',
          value: true,
          icon: 'note_add',
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
        this.asideModalService.open<ClinicalRecordFormComponent>(
          {
            title: 'Nueva Atención Clínica Manual',
            component: ClinicalRecordFormComponent,
            inputs: {
              record: null,
              patient: patient,
            },
            showActions: false,
            showCloseIcon: true,
          },
          {
            width: '680px',
          }
        );
      }
    });
  }
}
