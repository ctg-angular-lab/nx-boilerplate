import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { IActiveProfessional } from '@nx-boilerplate/api-interfaces';
import {
  ConfirmationModalComponent,
  ConfirmationModalData,
  DataTableComponent,
  TableColumnDef,
} from '@nx-boilerplate/layouts';
import { ProfesionalesAdminService } from '../../services/profesionales-admin.service';

@Component({
  selector: 'app-profesionales-list',
  standalone: true,
  imports: [
    DataTableComponent,
    MatButtonModule,
    MatButtonToggleModule,
    MatTooltipModule,
  ],
  templateUrl: './profesionales-list.component.html',
  styleUrl: './profesionales-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfesionalesListComponent {
  public readonly profesionalesService = inject(ProfesionalesAdminService);
  private readonly dialog = inject(MatDialog);

  readonly viewFilter = signal<'activos' | 'inactivos'>('activos');

  readonly displayedProfesionales = computed(() => {
    const list = this.profesionalesService.profesionalesList();
    const filter = this.viewFilter();
    return list.filter((p) =>
      filter === 'activos' ? p.isActive !== false : p.isActive === false
    );
  });

  readonly emptyMessage = computed(() =>
    this.viewFilter() === 'activos'
      ? 'No hay profesionales activos registrados.'
      : 'No hay profesionales inactivos.'
  );

  readonly columns: TableColumnDef<IActiveProfessional>[] = [
    { field: 'nombres', header: 'Nombre', sortable: true },
    { field: 'apellidos', header: 'Apellidos', sortable: true },
    { field: 'email', header: 'Correo', sortable: true },
    { field: 'profesion', header: 'Profesión', sortable: true },
  ];

  onFilterChange(filter: 'activos' | 'inactivos'): void {
    this.viewFilter.set(filter);
  }

  onAddNew(): void {
    this.profesionalesService.goToCreate();
  }

  onEdit(prof: IActiveProfessional, event?: Event): void {
    event?.stopPropagation();
    this.profesionalesService.goToEdit(prof);
  }

  onDelete(prof: IActiveProfessional, event?: Event): void {
    event?.stopPropagation();

    const modalData: ConfirmationModalData<boolean> = {
      title: 'Desactivar profesional',
      text: `¿Está seguro de que desea desactivar a ${prof.nombres} ${prof.apellidos}? El profesional pasará al estado inactivo.`,
      actions: [
        { label: 'Cancelar', color: 'default', value: false },
        { label: 'Desactivar', color: 'warn', value: true, icon: 'delete' },
      ],
    };

    const dialogRef = this.dialog.open(ConfirmationModalComponent, {
      data: modalData,
      width: '450px',
      disableClose: false,
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.profesionalesService.deleteProfesional(prof.cedula).subscribe();
      }
    });
  }

  onReactivate(prof: IActiveProfessional, event?: Event): void {
    event?.stopPropagation();

    const modalData: ConfirmationModalData<boolean> = {
      title: 'Reactivar profesional',
      text: `¿Está seguro de que desea reactivar a ${prof.nombres} ${prof.apellidos}? El profesional volverá al estado activo.`,
      actions: [
        { label: 'Cancelar', color: 'default', value: false },
        { label: 'Reactivar', color: 'primary', value: true, icon: 'how_to_reg' },
      ],
    };

    const dialogRef = this.dialog.open(ConfirmationModalComponent, {
      data: modalData,
      width: '450px',
      disableClose: false,
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.profesionalesService.reactivateProfesional(prof.cedula).subscribe();
      }
    });
  }
}

