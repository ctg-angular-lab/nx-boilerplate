import { TemplateRef } from '@angular/core';

export interface TableColumnDef<T = Record<string, unknown>> {
  field: string;
  header: string;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string;
  formatter?: (row: T) => string | number;
  cellTemplate?: TemplateRef<{ $implicit: T; field: string }>;
}

export interface TableActionDef<T = Record<string, unknown>> {
  id: string;
  label: string;
  icon: string;
  color?: 'primary' | 'accent' | 'warn';
  disabled?: (row: T) => boolean;
  hidden?: (row: T) => boolean;
}
