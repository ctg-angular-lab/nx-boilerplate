import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MetricCardAction } from '../models/metric-card.models';

@Component({
  selector: 'lib-metric-card',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './metric-card.component.html',
  styleUrl: './metric-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MetricCardComponent {
  readonly title = input.required<string>();
  readonly value = input.required<string | number>();
  readonly subtitle = input<string>('');
  readonly icon = input<string>('');
  readonly variant = input<'surface' | 'primary' | 'secondary' | 'tertiary'>('surface');
  readonly trend = input<{ value: string; direction: 'up' | 'down' | 'flat' } | null>(null);
  readonly actions = input<MetricCardAction[]>([]);

  readonly actionClick = output<string>();
}
