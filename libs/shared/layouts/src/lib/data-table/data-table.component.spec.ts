import { Component, viewChild, TemplateRef, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Sort } from '@angular/material/sort';
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
      [dataTable]="data()"
      [dataColumn]="columns"
      [actions]="actions"
      [selectable]="selectable"
      [(selectedKeys)]="selectedKeys"
      [(selectedRows)]="selectedRows"
      [expandable]="expandable"
      [rowKey]="rowKey"
      [loading]="loading()"
      [density]="density()"
      [searchable]="searchable()"
      [searchTerm]="searchTerm()"
      [sortLocally]="sortLocally()"
      [pageSize]="pageSize"
      [pageIndex]="pageIndex"
      [detailTemplate]="detailRef"
      (actionClick)="onActionClick($event)"
      (selectionChange)="onSelectionChange($event)"
      (searchChange)="onSearchChange($event)"
      (sortChange)="onSortChange($event)"
      (rowExpand)="onRowExpand($event)"
    />
  `,
})
class TestHostComponent {
  readonly data = signal<TestUser[]>([
    { id: '1', name: 'Ana Perez', role: 'admin', status: 'active' },
    { id: '2', name: 'Carlos Ruiz', role: 'user', status: 'inactive' },
  ]);

  columns: TableColumnDef<TestUser>[] = [
    { field: 'id', header: 'ID', sortable: true },
    { field: 'name', header: 'Nombre', sortable: true },
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

  selectable = false;
  selectedKeys: unknown[] = [];
  selectedRows: TestUser[] = [];
  expandable = true;
  rowKey = 'id';
  readonly loading = signal<boolean>(false);
  readonly density = signal<'default' | 'compact'>('default');
  readonly searchable = signal<boolean>(false);
  readonly searchTerm = signal<string>('');
  readonly sortLocally = signal<boolean>(true);
  pageSize = 10;
  pageIndex = 0;

  lastAction: { action: string; row: TestUser } | null = null;
  lastSelection: TestUser[] | null = null;
  lastSearch: string | null = null;
  lastSort: Sort | null = null;
  lastExpanded: TestUser | null = null;

  customCell = viewChild<TemplateRef<any>>('customCell');

  onActionClick(event: { action: string; row: TestUser }): void {
    this.lastAction = event;
  }

  onSelectionChange(rows: TestUser[]): void {
    this.lastSelection = rows;
  }

  onSearchChange(term: string): void {
    this.lastSearch = term;
  }

  onSortChange(sort: Sort): void {
    this.lastSort = sort;
  }

  onRowExpand(row: TestUser | null): void {
    this.lastExpanded = row;
  }
}

describe('DataTableComponent (Tactical Block - Phase 2 Suite)', () => {
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

  describe('1. Renderizado de Cabeceras y Celdas con Clases MDC', () => {
    it('debe renderizar los encabezados con clase .mat-mdc-header-cell', () => {
      const headers = fixture.debugElement
        .queryAll(By.css('th.mat-mdc-header-cell'))
        .map((el) => el.nativeElement.textContent.trim());

      expect(headers).toContain('ID');
      expect(headers).toContain('Nombre');
      expect(headers).toContain('Rol');
      expect(headers).toContain('Estado');
    });

    it('debe renderizar las celdas con clase .mat-mdc-cell y textos directos', () => {
      const rows = fixture.debugElement.queryAll(By.css('tr.table-row'));
      expect(rows.length).toBe(2);

      const firstRowCells = rows[0].queryAll(By.css('td.mat-mdc-cell'));
      expect(firstRowCells.length).toBeGreaterThan(0);
      expect(rows[0].nativeElement.textContent).toContain('Ana Perez');
      expect(rows[0].nativeElement.textContent).toContain('1');
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

      expect(adminActions.length).toBe(1);
      expect(userActions.length).toBe(2);
    });

    it('debe emitir actionClick al pulsar una acción habilitada', () => {
      const rows = fixture.debugElement.queryAll(By.css('tr.table-row'));
      const editButton = rows[0].query(By.css('.actions-group button')).nativeElement;

      editButton.click();
      fixture.detectChanges();

      expect(host.lastAction).toEqual({
        action: 'edit',
        row: host.data()[0],
      });
    });
  });

  describe('4. Expansión de Filas', () => {
    it('debe renderizar el botón indicador con flechas arrow_down y arrow_up al alternar expansión', () => {
      const rows = fixture.debugElement.queryAll(By.css('tr.table-row'));
      const toggleButton = rows[0].query(By.css('.expand-toggle-button'));
      expect(toggleButton).not.toBeNull();

      const iconSpan = toggleButton.query(By.css('.expand-icon')).nativeElement;
      expect(iconSpan.textContent.trim()).toBe('keyboard_arrow_down');

      // Clic para expandir fila 1 vía botón indicador
      toggleButton.nativeElement.click();
      fixture.detectChanges();

      expect(host.lastExpanded).toEqual(host.data()[0]);
      expect(rows[0].nativeElement.classList.contains('expanded-row')).toBe(true);
      expect(iconSpan.textContent.trim()).toBe('keyboard_arrow_up');

      const detailContent = fixture.debugElement.query(By.css('.detail-content'));
      expect(detailContent).not.toBeNull();
      expect(detailContent.nativeElement.textContent).toContain('Detalle de Ana Perez');

      // Segundo clic en el botón colapsa y regresa a keyboard_arrow_down
      toggleButton.nativeElement.click();
      fixture.detectChanges();

      expect(host.lastExpanded).toBeNull();
      expect(rows[0].nativeElement.classList.contains('expanded-row')).toBe(false);
      expect(iconSpan.textContent.trim()).toBe('keyboard_arrow_down');
    });

    it('debe alternar la expansión al hacer clic en la fila según rowKey', () => {
      const rows = fixture.debugElement.queryAll(By.css('tr.table-row'));

      rows[0].nativeElement.click();
      fixture.detectChanges();

      expect(host.lastExpanded).toEqual(host.data()[0]);
      expect(rows[0].nativeElement.classList.contains('expanded-row')).toBe(true);

      const detailContent = fixture.debugElement.query(By.css('.detail-content'));
      expect(detailContent).not.toBeNull();
      expect(detailContent.nativeElement.textContent).toContain('Detalle de Ana Perez');

      rows[0].nativeElement.click();
      fixture.detectChanges();

      expect(host.lastExpanded).toBeNull();
      expect(rows[0].nativeElement.classList.contains('expanded-row')).toBe(false);
    });
  });

  describe('5. Selección por Clave Inmutable (Hallazgo C5)', () => {
    beforeEach(() => {
      host.selectable = true;
      fixture.detectChanges();
    });

    it('debe seleccionar una fila por su rowKey y emitir selectionChange', () => {
      const checkboxes = fixture.debugElement.queryAll(By.css('td.checkbox-cell mat-checkbox input'));
      expect(checkboxes.length).toBe(2);

      checkboxes[0].nativeElement.click();
      fixture.detectChanges();

      expect(host.selectedKeys).toEqual(['1']);
      expect(host.lastSelection?.length).toBe(1);
      expect(host.lastSelection?.[0].id).toBe('1');
    });

    it('debe preservar la selección cuando el backend actualiza dataTable con nuevas referencias de objeto', () => {
      const checkboxes = fixture.debugElement.queryAll(By.css('td.checkbox-cell mat-checkbox input'));
      checkboxes[0].nativeElement.click();
      fixture.detectChanges();
      expect(host.selectedKeys).toEqual(['1']);

      host.data.set([
        { id: '1', name: 'Ana Perez (Actualizada)', role: 'admin', status: 'active' },
        { id: '2', name: 'Carlos Ruiz', role: 'user', status: 'inactive' },
      ]);
      fixture.detectChanges();

      const tableComp = fixture.debugElement
        .query(By.directive(DataTableComponent))
        .componentInstance as DataTableComponent<TestUser>;

      expect(tableComp.selectedKeys()).toEqual(['1']);
      expect(tableComp.selectedRows().length).toBe(1);
      expect(tableComp.selectedRows()[0].name).toBe('Ana Perez (Actualizada)');

      const rows = fixture.debugElement.queryAll(By.css('tr.table-row'));
      expect(rows[0].nativeElement.classList.contains('selected-row')).toBe(true);
    });

    it('debe alternar selección total con masterToggle', () => {
      const headerCheckbox = fixture.debugElement.query(By.css('th.checkbox-cell mat-checkbox input'));

      headerCheckbox.nativeElement.click();
      fixture.detectChanges();

      expect(host.selectedKeys).toEqual(['1', '2']);
      expect(host.selectedRows.length).toBe(2);

      headerCheckbox.nativeElement.click();
      fixture.detectChanges();

      expect(host.selectedKeys).toEqual([]);
      expect(host.selectedRows.length).toBe(0);
    });
  });

  describe('6. Prevención de Parpadeo en Carga (Hallazgo C4)', () => {
    it('no debe renderizar el mensaje de vacío cuando loading es true y la data está vacía', () => {
      host.data.set([]);
      host.loading.set(true);
      fixture.detectChanges();

      const emptyContent = fixture.debugElement.query(By.css('.empty-content'));
      expect(emptyContent).toBeNull();
    });

    it('debe renderizar el mensaje de vacío cuando loading es false y la data está vacía', () => {
      host.data.set([]);
      host.loading.set(false);
      fixture.detectChanges();

      const emptyContent = fixture.debugElement.query(By.css('.empty-content'));
      expect(emptyContent).not.toBeNull();
      expect(emptyContent.nativeElement.textContent).toContain('No se encontraron registros.');
    });
  });

  describe('7. Reinicio de Paginador Fuera de Rango (Hallazgo C6)', () => {
    it('debe reiniciar el paginador a la primera página cuando los datos disminuyen y la página queda fuera de rango', () => {
      const tableComp = fixture.debugElement
        .query(By.directive(DataTableComponent))
        .componentInstance as DataTableComponent<TestUser>;

      tableComp.dataSource.paginator!.pageSize = 10;
      tableComp.dataSource.paginator!.pageIndex = 3;

      host.data.set([{ id: '99', name: 'Solo Uno', role: 'user', status: 'active' }]);
      fixture.detectChanges();

      expect(tableComp.dataSource.paginator!.pageIndex).toBe(0);
    });
  });

  describe('8. Densidad Visual (Hallazgo C1)', () => {
    it('debe aplicar el atributo data-density="default" por defecto', () => {
      const wrapper = fixture.debugElement.query(By.css('.table-wrapper'));
      expect(wrapper.nativeElement.getAttribute('data-density')).toBe('default');
    });

    it('debe reflejar data-density="compact" cuando se configura el input', () => {
      host.density.set('compact');
      fixture.detectChanges();

      const wrapper = fixture.debugElement.query(By.css('.table-wrapper'));
      expect(wrapper.nativeElement.getAttribute('data-density')).toBe('compact');
    });
  });

  describe('9. Búsqueda Integrada con Debounce y visibleRows() (Fase 2)', () => {
    beforeEach(() => {
      host.searchable.set(true);
      fixture.detectChanges();
    });

    it('debe renderizar el campo de búsqueda cuando searchable es true', () => {
      const searchBox = fixture.debugElement.query(By.css('.search-box'));
      expect(searchBox).not.toBeNull();

      const searchInput = searchBox.query(By.css('.search-input'));
      expect(searchInput).not.toBeNull();
    });

    it('debe filtrar las filas con debounce de 300ms y emitir searchChange', async () => {
      host.searchTerm.set('Carlos');
      fixture.detectChanges();

      // Esperar que transcurra el debounce de 300ms
      await new Promise((resolve) => setTimeout(resolve, 350));
      fixture.detectChanges();

      const tableComp = fixture.debugElement
        .query(By.directive(DataTableComponent))
        .componentInstance as DataTableComponent<TestUser>;

      expect(tableComp.dataSource.filter).toBe('carlos');
      expect(host.lastSearch).toBe('Carlos');

      // Solo Carlos Ruiz debe coincidir en las filas visibles
      const visible = tableComp.visibleRows();
      expect(visible.length).toBe(1);
      expect(visible[0].name).toBe('Carlos Ruiz');
    });

    it('debe limpiar la búsqueda al hacer clic en el botón de limpiar', async () => {
      host.searchTerm.set('Ana');
      fixture.detectChanges();
      await new Promise((resolve) => setTimeout(resolve, 350));
      fixture.detectChanges();

      const tableComp = fixture.debugElement
        .query(By.directive(DataTableComponent))
        .componentInstance as DataTableComponent<TestUser>;

      expect(tableComp.visibleRows().length).toBe(1);

      const clearBtn = fixture.debugElement.query(By.css('.clear-button'));
      expect(clearBtn).not.toBeNull();
      clearBtn.nativeElement.click();
      fixture.detectChanges();

      await new Promise((resolve) => setTimeout(resolve, 350));
      fixture.detectChanges();

      expect(tableComp.dataSource.filter).toBe('');
      expect(tableComp.visibleRows().length).toBe(2);
    });
  });

  describe('10. Ordenamiento Dual sortLocally (Fase 2 - Hallazgo C3)', () => {
    it('debe enlazar dataSource.sort cuando sortLocally es true', () => {
      host.sortLocally.set(true);
      fixture.detectChanges();

      const tableComp = fixture.debugElement
        .query(By.directive(DataTableComponent))
        .componentInstance as DataTableComponent<TestUser>;

      expect(tableComp.dataSource.sort).not.toBeNull();
    });

    it('debe dejar dataSource.sort en null cuando sortLocally es false para delegar al padre', () => {
      host.sortLocally.set(false);
      fixture.detectChanges();

      const tableComp = fixture.debugElement
        .query(By.directive(DataTableComponent))
        .componentInstance as DataTableComponent<TestUser>;

      expect(tableComp.dataSource.sort).toBeNull();
    });
  });
});
