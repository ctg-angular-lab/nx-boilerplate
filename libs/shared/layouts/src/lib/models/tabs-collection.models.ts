import { TemplateRef } from '@angular/core';

export interface TabItemConfig {
  id: string | number;
  label: string;
  icon?: string;
  badge?: string | number;
  disabled?: boolean;
  contentTemplate?: TemplateRef<void>;
}
