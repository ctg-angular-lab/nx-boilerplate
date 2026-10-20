import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { IActiveProfessional } from '@nx-boilerplate/api-interfaces';
import { DataTableComponent, TableColumnDef } from '@nx-boilerplate/layouts';
import { ProfesionalesAdminService } from '../services/profesionales-admin.service';

@Component({
  selector: 'app-lista-profesionales-entry',
  standalone: true,
  imports: [
    DataTableComponent,
    MatButtonModule,
    MatButtonToggleModule,
    MatTooltipModule,
  ],
  templateUrl: './remote-entry.component.html',
  styleUrl: './remote-entry.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RemoteEntryComponent {
  protected readonly profesionalesService = inject(ProfesionalesAdminService);

  protected readonly columns: TableColumnDef<IActiveProfessional>[] = [
    { field: 'nombres', header: 'Nombre', sortable: true },
    { field: 'apellidos', header: 'Apellidos', sortable: true },
    { field: 'email', header: 'Correo', sortable: true },
    { field: 'profesion', header: 'Profesión', sortable: true },
  ];

  constructor() {
    // El servicio es root: se recarga en cada montaje del MFE para evitar datos obsoletos.
    this.profesionalesService.loadProfesionales();
  }

  // Parte 1: sin mutaciones. Los eventos solo se registran en consola.
  onEdit(profesional: IActiveProfessional): void {
    console.log('Editar profesional:', profesional.cedula);
  }

  onDelete(profesional: IActiveProfessional): void {
    console.log('Eliminar profesional:', profesional.cedula);
  }
}
