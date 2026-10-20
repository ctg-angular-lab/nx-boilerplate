import { Component, viewChild, TemplateRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { DataTableComponent } from './data-table.component';
import { TableActionDef, TableColumnDef } from '../models/data-table.models';

interface TestUser {
  id: string;
  name: string;
  role: string;
  status: 'active' | 'inactive';
}

@Component({
  standalone: true,
  imports: [DataTableComponent],
  template: `
    <ng-template #customCell let-row let-field="field">
      <span class="custom-badge">{{ row[field] }}</span>
    </ng-template>

    <ng-template #detailRef let-row>
      <div class="detail-content">Detalle de {{ row.name }}</div>
    </ng-template>

    <lib-data-table
      [dataTable]="data"
      [dataColumn]="columns"
      [actions]="actions"
      [expandable]="expandable"
      [rowKey]="rowKey"
      [detailTemplate]="detailRef"
      (actionClick)="onActionClick($event)"
      (rowExpand)="onRowExpand($event)"
    />
  `,
})
class TestHostComponent {
  data: TestUser[] = [
    { id: '1', name: 'Ana Perez', role: 'admin', status: 'active' },
    { id: '2', name: 'Carlos Ruiz', role: 'user', status: 'inactive' },
  ];

  columns: TableColumnDef<TestUser>[] = [
    { field: 'id', header: 'ID' },
    { field: 'name', header: 'Nombre' },
    {
      field: 'role',
      header: 'Rol',
      formatter: (row) => row.role.toUpperCase(),
    },
    {
      field: 'status',
      header: 'Estado',
      cellTemplate: null as unknown as TemplateRef<any>,
    },
  ];

  actions: TableActionDef<TestUser>[] = [
    {
      id: 'edit',
      label: 'Editar',
      icon: 'edit',
      disabled: (row) => row.status === 'inactive',
    },
    {
      id: 'delete',
      label: 'Eliminar',
      icon: 'delete',
      hidden: (row) => row.role === 'admin',
    },
  ];

  expandable = true;
  rowKey = 'id';

  lastAction: { action: string; row: TestUser } | null = null;
  lastExpanded: TestUser | null = null;

  customCell = viewChild<TemplateRef<any>>('customCell');

  onActionClick(event: { action: string; row: TestUser }): void {
    this.lastAction = event;
  }

  onRowExpand(row: TestUser | null): void {
    this.lastExpanded = row;
  }
}

describe('DataTableComponent (Baseline Suite)', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    host.columns[3].cellTemplate = host.customCell()!;
    fixture.detectChanges();
  });

  describe('1. Renderizado de Cabeceras y Celdas', () => {
    it('debe renderizar los encabezados correspondientes a las columnas definidas', () => {
      const headers = fixture.debugElement
        .queryAll(By.css('th.mat-mdc-header-cell'))
        .map((el) => el.nativeElement.textContent.trim());

      expect(headers).toContain('ID');
      expect(headers).toContain('Nombre');
      expect(headers).toContain('Rol');
      expect(headers).toContain('Estado');
    });

    it('debe renderizar los valores de texto directos de dataTable', () => {
      const rows = fixture.debugElement.queryAll(By.css('tr.table-row'));
      expect(rows.length).toBe(2);

      const firstRowText = rows[0].nativeElement.textContent;
      expect(firstRowText).toContain('Ana Perez');
      expect(firstRowText).toContain('1');
    });
  });

  describe('2. Formatter y CellTemplate', () => {
    it('debe aplicar la función formatter cuando esté configurada en la columna', () => {
      const rows = fixture.debugElement.queryAll(By.css('tr.table-row'));
      expect(rows[0].nativeElement.textContent).toContain('ADMIN');
      expect(rows[1].nativeElement.textContent).toContain('USER');
    });

    it('debe renderizar el contenido proyectado por cellTemplate', () => {
      const badges = fixture.debugElement.queryAll(By.css('.custom-badge'));
      expect(badges.length).toBe(2);
      expect(badges[0].nativeElement.textContent.trim()).toBe('active');
      expect(badges[1].nativeElement.textContent.trim()).toBe('inactive');
    });
  });

  describe('3. Columna de Acciones (TableActionDef)', () => {
    it('debe respetar el estado disabled condicional por fila', () => {
      const rows = fixture.debugElement.queryAll(By.css('tr.table-row'));
      const activeRowButtons = rows[0].queryAll(By.css('.actions-group button'));
      const inactiveRowButtons = rows[1].queryAll(By.css('.actions-group button'));

      const editBtnActive = activeRowButtons[0].nativeElement as HTMLButtonElement;
      expect(editBtnActive.disabled).toBe(false);

      const editBtnInactive = inactiveRowButtons[0].nativeElement as HTMLButtonElement;
      expect(editBtnInactive.disabled).toBe(true);
    });

    it('debe respetar el estado hidden condicional por fila', () => {
      const rows = fixture.debugElement.queryAll(By.css('tr.table-row'));
      const adminActions = rows[0].queryAll(By.css('.actions-group button'));
      const userActions = rows[1].queryAll(By.css('.actions-group button'));

      // Para 'admin', el botón delete está oculto (hidden: true), solo debe verse 'edit'
      expect(adminActions.length).toBe(1);
      // Para 'user', ambos botones están presentes ('edit' y 'delete')
      expect(userActions.length).toBe(2);
    });

    it('debe emitir actionClick al pulsar una acción habilitada', () => {
      const rows = fixture.debugElement.queryAll(By.css('tr.table-row'));
      const editButton = rows[0].query(By.css('.actions-group button')).nativeElement;

      editButton.click();
      fixture.detectChanges();

      expect(host.lastAction).toEqual({
        action: 'edit',
        row: host.data[0],
      });
    });
  });

  describe('4. Expansión de Filas', () => {
    beforeEach(() => {
      host.expandable = true;
      fixture.detectChanges();
    });

    it('debe alternar la expansión al hacer clic en la fila según rowKey', () => {
      const rows = fixture.debugElement.queryAll(By.css('tr.table-row'));

      // Clic para expandir fila 1
      rows[0].nativeElement.click();
      fixture.detectChanges();

      expect(host.lastExpanded).toEqual(host.data[0]);
      expect(rows[0].nativeElement.classList.contains('expanded-row')).toBe(true);

      const detailContent = fixture.debugElement.query(By.css('.detail-content'));
      expect(detailContent).not.toBeNull();
      expect(detailContent.nativeElement.textContent).toContain('Detalle de Ana Perez');

      // Segundo clic en la misma fila colapsa
      rows[0].nativeElement.click();
      fixture.detectChanges();

      expect(host.lastExpanded).toBeNull();
      expect(rows[0].nativeElement.classList.contains('expanded-row')).toBe(false);
    });
  });
});
