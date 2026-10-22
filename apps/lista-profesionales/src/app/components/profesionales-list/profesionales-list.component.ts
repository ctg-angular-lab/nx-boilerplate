import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { IActiveProfessional } from '@nx-boilerplate/api-interfaces';
import { DataTableComponent, TableColumnDef } from '@nx-boilerplate/layouts';
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

  readonly viewFilter = signal<'activos' | 'inactivos'>('activos');

  readonly columns: TableColumnDef<IActiveProfessional>[] = [
    { field: 'nombres', header: 'Nombre', sortable: true },
    { field: 'apellidos', header: 'Apellidos', sortable: true },
    { field: 'email', header: 'Correo', sortable: true },
    { field: 'profesion', header: 'Profesión', sortable: true },
  ];

  onAddNew(): void {
    this.profesionalesService.goToCreate();
  }

  onEdit(prof: IActiveProfessional, event?: Event): void {
    event?.stopPropagation();
    this.profesionalesService.goToEdit(prof);
  }

  onDelete(prof: IActiveProfessional, event?: Event): void {
    event?.stopPropagation();
    this.profesionalesService.deleteProfesional(prof.cedula).subscribe();
  }
}
