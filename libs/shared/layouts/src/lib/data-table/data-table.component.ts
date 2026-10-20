import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  model,
  viewChild,
  effect,
  afterNextRender,
  computed,
  TemplateRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { TableActionDef, TableColumnDef } from '../models/data-table.models';

@Component({
  selector: 'lib-data-table',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatProgressBarModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatCheckboxModule,
  ],
  templateUrl: './data-table.component.html',
  styleUrl: './data-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataTableComponent<T extends Record<string, any>> {
  // Inputs
  readonly dataTable = input<T[]>([]);
  readonly dataColumn = input<TableColumnDef<T>[]>([]);
  readonly actions = input<TableActionDef<T>[]>([]);
  readonly loading = input<boolean>(false);
  readonly pageSizeOptions = input<number[]>([5, 10, 25, 50]);
  readonly selectable = input<boolean>(false);
  readonly totalElements = input<number | null>(null);
  readonly emptyMessage = input<string>('No se encontraron registros.');

  // Expanded Row (opcional, deshabilitado por defecto)
  readonly expandable = input<boolean>(false);
  /** Campo con valor único y estable por fila (ej. 'cedula'). La expansión se compara por clave, no por referencia. */
  readonly rowKey = input<string>('id');
  readonly detailTemplate = input<TemplateRef<{ $implicit: T }> | null>(null);

  // Models (Two-Way Binding)
  readonly pageSize = model<number>(10);
  readonly pageIndex = model<number>(0);
  readonly selectedRows = model<T[]>([]);
  /** Clave de la fila expandida (una a la vez). */
  readonly expandedKey = model<unknown | null>(null);

  // Outputs
  readonly rowClick = output<T>();
  readonly actionClick = output<{ action: string; row: T }>();
  readonly sortChange = output<Sort>();
  readonly pageChange = output<PageEvent>();
  readonly rowExpand = output<T | null>();

  // Queries
  private readonly paginator = viewChild<MatPaginator>(MatPaginator);
  private readonly sort = viewChild<MatSort>(MatSort);

  // Instancia de DataSource de Material
  readonly dataSource = new MatTableDataSource<T>();

  // Columnas a renderizar (computadas de forma pura)
  readonly displayedColumns = computed(() => {
    const cols: string[] = [];
    if (this.selectable()) cols.push('__select__');
    cols.push(...this.dataColumn().map((c) => c.field));
    if (this.actions().length > 0) cols.push('__actions__');
    return cols;
  });

  // Columna única de la fila de detalle (Expanded Row)
  readonly detailColumns = ['__detail__'];

  constructor() {
    // Sincronización reactiva en effect() estricto (Side-effect seguro)
    effect(() => {
      this.dataSource.data = this.dataTable();
    });

    afterNextRender(() => {
      const p = this.paginator();
      const s = this.sort();
      if (p) this.dataSource.paginator = p;
      if (s) this.dataSource.sort = s;
    });
  }

  onRowClick(row: T): void {
    this.rowClick.emit(row);
    if (!this.expandable()) return;

    const key = row[this.rowKey()];
    const isSame = this.expandedKey() === key;
    this.expandedKey.set(isSame ? null : key);
    this.rowExpand.emit(isSame ? null : row);
  }

  isExpanded(row: T): boolean {
    return this.expandable() && this.expandedKey() === row[this.rowKey()];
  }

  onActionClick(event: Event, action: string, row: T): void {
    event.stopPropagation();
    this.actionClick.emit({ action, row });
  }

  isAllSelected(): boolean {
    const numSelected = this.selectedRows().length;
    const numRows = this.dataSource.data.length;
    return numRows > 0 && numSelected === numRows;
  }

  masterToggle(): void {
    if (this.isAllSelected()) {
      this.selectedRows.set([]);
    } else {
      this.selectedRows.set([...this.dataSource.data]);
    }
  }

  toggleRow(row: T): void {
    const current = this.selectedRows();
    const index = current.indexOf(row);
    if (index >= 0) {
      this.selectedRows.set(current.filter((r) => r !== row));
    } else {
      this.selectedRows.set([...current, row]);
    }
  }

  isRowSelected(row: T): boolean {
    return this.selectedRows().includes(row);
  }
}
