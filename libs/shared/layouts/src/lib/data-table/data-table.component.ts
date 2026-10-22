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
import { NgTemplateOutlet } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { TableActionDef, TableColumnDef } from '../models/data-table.models';

@Component({
  selector: 'lib-data-table',
  standalone: true,
  imports: [
    NgTemplateOutlet,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatProgressBarModule,
    MatButtonModule,
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
  readonly density = input<'default' | 'compact'>('default');

  // Búsqueda (Fase 2)
  readonly searchable = input<boolean>(false);
  readonly searchPlaceholder = input<string>('Buscar...');
  readonly searchTerm = model<string>('');

  // Ordenamiento Dual (Fase 2 - C3)
  readonly sortLocally = input<boolean>(true);

  // Expanded Row
  readonly expandable = input<boolean>(false);
  readonly rowKey = input<string>('id');
  readonly detailTemplate = input<TemplateRef<{ $implicit: T }> | null>(null);

  // Models (Two-Way Binding)
  readonly pageSize = model<number>(10);
  readonly pageIndex = model<number>(0);
  readonly selectedRows = model<T[]>([]);
  readonly selectedKeys = model<unknown[]>([]);
  readonly expandedKey = model<unknown | null>(null);

  // Outputs
  readonly rowClick = output<T>();
  readonly actionClick = output<{ action: string; row: T }>();
  readonly selectionChange = output<T[]>();
  readonly searchChange = output<string>();
  readonly sortChange = output<Sort>();
  readonly pageChange = output<PageEvent>();
  readonly rowExpand = output<T | null>();

  // Queries
  private readonly paginator = viewChild<MatPaginator>(MatPaginator);
  private readonly sort = viewChild<MatSort>(MatSort);

  // DataSource
  readonly dataSource = new MatTableDataSource<T>();

  // Columnas computadas
  readonly displayedColumns = computed(() => {
    const cols: string[] = [];
    if (this.selectable()) cols.push('__select__');
    if (this.expandable()) cols.push('__expand__');
    cols.push(...this.dataColumn().map((c) => c.field));
    if (this.actions().length > 0) cols.push('__actions__');
    return cols;
  });

  readonly detailColumns = ['__detail__'];

  constructor() {
    // Sincronización reactiva de datos y selección
    effect(() => {
      const data = this.dataTable();
      this.dataSource.data = data;

      const keySet = new Set(this.selectedKeys());
      if (keySet.size > 0) {
        const matched = data.filter((row) => keySet.has(this.getRowKeyValue(row)));
        this.selectedRows.set(matched);
        this.selectionChange.emit(matched);
      } else if (this.selectedRows().length > 0) {
        const inferredKeys = this.selectedRows().map((row) => this.getRowKeyValue(row));
        this.selectedKeys.set(inferredKeys);
      }

      const p = this.dataSource.paginator;
      if (p) {
        const maxPageIndex = Math.max(0, Math.ceil(data.length / p.pageSize) - 1);
        if (p.pageIndex > maxPageIndex) {
          p.firstPage();
          this.pageIndex.set(0);
        }
      }
    });

    // Búsqueda integrada con debounce y cleanup (Fase 2)
    effect((onCleanup) => {
      const term = this.searchTerm();
      const timer = setTimeout(() => {
        const normalized = term.trim().toLowerCase();
        this.dataSource.filter = normalized;
        this.dataSource.paginator?.firstPage();
        this.searchChange.emit(term);
      }, 300);

      onCleanup(() => clearTimeout(timer));
    });

    // Ordenamiento dual local vs remoto (Fase 2 - C3)
    effect(() => {
      const s = this.sort();
      if (s) {
        this.dataSource.sort = this.sortLocally() ? s : null;
      }
    });

    afterNextRender(() => {
      const p = this.paginator();
      if (p) this.dataSource.paginator = p;
    });
  }

  /** Retorna las filas filtradas y ordenadas actualmente visibles (sin recorte de paginación) */
  public visibleRows(): T[] {
    return this.dataSource.filteredData;
  }

  getRowKeyValue(row: T): unknown {
    return row[this.rowKey()];
  }

  onRowClick(row: T): void {
    this.rowClick.emit(row);
    if (!this.expandable()) return;

    const key = this.getRowKeyValue(row);
    const isSame = this.expandedKey() === key;
    this.expandedKey.set(isSame ? null : key);
    this.rowExpand.emit(isSame ? null : row);
  }

  isExpanded(row: T): boolean {
    return this.expandable() && this.expandedKey() === this.getRowKeyValue(row);
  }

  onActionClick(event: Event, action: string, row: T): void {
    event.stopPropagation();
    this.actionClick.emit({ action, row });
  }

  isAllSelected(): boolean {
    const data = this.dataSource.data;
    if (data.length === 0) return false;
    const keySet = new Set(this.selectedKeys());
    return data.every((row) => keySet.has(this.getRowKeyValue(row)));
  }

  masterToggle(): void {
    const data = this.dataSource.data;
    if (this.isAllSelected()) {
      const dataKeys = new Set(data.map((r) => this.getRowKeyValue(r)));
      const remainingKeys = this.selectedKeys().filter((k) => !dataKeys.has(k));
      this.selectedKeys.set(remainingKeys);
      this.syncSelectedRows(remainingKeys);
    } else {
      const keySet = new Set(this.selectedKeys());
      data.forEach((r) => keySet.add(this.getRowKeyValue(r)));
      const newKeys = Array.from(keySet);
      this.selectedKeys.set(newKeys);
      this.syncSelectedRows(newKeys);
    }
  }

  toggleRow(row: T): void {
    const key = this.getRowKeyValue(row);
    const current = this.selectedKeys();
    const isSelected = current.includes(key);
    const newKeys = isSelected ? current.filter((k) => k !== key) : [...current, key];
    this.selectedKeys.set(newKeys);
    this.syncSelectedRows(newKeys);
  }

  isRowSelected(row: T): boolean {
    return this.selectedKeys().includes(this.getRowKeyValue(row));
  }

  private syncSelectedRows(keys: unknown[]): void {
    const keySet = new Set(keys);
    const matched = this.dataSource.data.filter((r) => keySet.has(this.getRowKeyValue(r)));
    this.selectedRows.set(matched);
    this.selectionChange.emit(matched);
  }
}
