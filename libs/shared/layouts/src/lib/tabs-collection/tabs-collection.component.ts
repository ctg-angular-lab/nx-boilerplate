import { Component, ChangeDetectionStrategy, input, model, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { TabItemConfig } from '../models/tabs-collection.models';

@Component({
  selector: 'lib-tabs-collection, app-tabs-collection',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    MatIconModule,
    MatBadgeModule,
  ],
  templateUrl: './tabs-collection.component.html',
  styleUrl: './tabs-collection.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabsCollectionComponent {
  /** Configuración de las pestañas */
  readonly tabs = input.required<TabItemConfig[]>();

  /** Variante visual */
  readonly variant = input<'standard' | 'pills' | 'enclosed'>('standard');

  /** Id de la pestaña activa (Two-Way Binding) */
  readonly activeTabId = model<string | number | undefined>(undefined);

  /** Índice seleccionado computado para sincronizar con MatTabGroup */
  readonly selectedIndex = computed(() => {
    const active = this.activeTabId();
    if (active === undefined) return 0;
    const index = this.tabs().findIndex((t) => t.id === active);
    return index >= 0 ? index : 0;
  });

  onSelectedIndexChange(index: number): void {
    const tab = this.tabs()[index];
    if (tab) {
      this.activeTabId.set(tab.id);
    }
  }
}
