import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatIconModule, MAT_ICON_DEFAULT_OPTIONS } from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {MatSidenavModule} from '@angular/material/sidenav';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatListModule} from '@angular/material/list';

interface MfeRoute {
  path: string;
  label: string;
  icon: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    MatSidenavModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatListModule    
  ],
  providers: [
    {
      provide: MAT_ICON_DEFAULT_OPTIONS,
      useValue: { fontSet: 'material-symbols-outlined' }
    }    
  ],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrls: ['./app.scss'],
})
export class App {
  readonly isSidenavOpen = signal<boolean>(false);

  readonly mfeRoutes = signal<MfeRoute[]>([
    { path: '/dashboard', label: 'Dashboard General', icon: 'dashboard' },
    { path: '/mfe-users', label: 'Gestión de Usuarios', icon: 'people' },
    { path: '/mfe-billing', label: 'Módulo Facturación', icon: 'receipt_long' },
    { path: '/mfe-reports', label: 'Analíticas', icon: 'analytics' },
    { path: '/settings', label: 'Configuración', icon: 'settings' }
  ]);

  toggleSidenav(): void {
    this.isSidenavOpen.update((currentState) => !currentState);
  }
}
