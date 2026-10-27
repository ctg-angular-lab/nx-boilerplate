import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { IProcedure } from '@nx-boilerplate/api-interfaces';
import {
  ConfirmationModalComponent,
  ConfirmationModalData,
  DataTableComponent,
  TableActionDef,
  TableColumnDef,
} from '@nx-boilerplate/layouts';
import { ProcedimientosAdminService } from '../../services/procedimientos-admin.service';

@Component({
  selector: 'app-procedimientos-list',
  standalone: true,
  imports: [DataTableComponent, MatButtonModule],
  templateUrl: './procedimientos-list.component.html',
  styleUrl: './procedimientos-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProcedimientosListComponent {
  public readonly procedimientosService = inject(ProcedimientosAdminService);
  private readonly dialog = inject(MatDialog);

  readonly columns: TableColumnDef<IProcedure>[] = [
    { field: 'nombreProcedimiento', header: 'Nombre del Procedimiento', sortable: true },
    {
      field: 'valorStandar',
      header: 'Valor Estándar',
      sortable: true,
      formatter: (row) =>
        new Intl.NumberFormat('es-CO', {
          style: 'currency',
          currency: 'COP',
          maximumFractionDigits: 0,
        }).format(row.valorStandar),
    },
    {
      field: 'duracionStandar',
      header: 'Duración',
      sortable: true,
      formatter: (row) => `${row.duracionStandar} min`,
    },
  ];

  readonly actions: TableActionDef<IProcedure>[] = [
    { id: 'edit', label: 'Editar', icon: 'edit', color: 'primary' },
    { id: 'delete', label: 'Eliminar', icon: 'delete', color: 'warn' },
  ];

  onAddNew(): void {
    this.procedimientosService.goToCreate();
  }

  handleAction(event: { action: string; row: IProcedure }): void {
    if (event.action === 'edit') {
      this.onEdit(event.row);
    } else if (event.action === 'delete') {
      this.onDelete(event.row);
    }
  }

  onEdit(proc: IProcedure): void {
    this.procedimientosService.goToEdit(proc);
  }

  onDelete(proc: IProcedure): void {
    const linked = proc.medicosRelacionados?.length ?? 0;

    const modalData: ConfirmationModalData<boolean> =
      linked > 0
        ? {
            title: 'No es posible eliminar',
            text: `El procedimiento está asignado a ${linked} profesional(es). Desvincúlelo primero desde Profesionales.`,
            actions: [{ label: 'Entendido', color: 'primary', value: false }],
          }
        : {
            title: '¿Eliminar procedimiento?',
            text: `¿Está seguro de que desea eliminar el procedimiento "${proc.nombreProcedimiento}"? Pasará al estado inactivo.`,
            actions: [
              { label: 'Cancelar', color: 'default', value: false },
              { label: 'Eliminar', color: 'warn', value: true, icon: 'delete' },
            ],
          };

    const dialogRef = this.dialog.open(ConfirmationModalComponent, {
      data: modalData,
      width: '450px',
      disableClose: false,
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed && linked === 0) {
        this.procedimientosService.deleteProcedimiento(proc.idProcedimiento).subscribe();
      }
    });
  }
}
