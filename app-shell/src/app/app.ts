import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter } from 'rxjs';
import { MatIconModule, MAT_ICON_DEFAULT_OPTIONS } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';

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
  private readonly router = inject(Router);

  readonly isSidenavOpen = signal<boolean>(false);

  readonly mfeRoutes = signal<MfeRoute[]>([
    { path: '/agendador-citas', label: 'Agendar Cita', icon: 'calendar_add_on' },
    { path: '/profesionales', label: 'Profesionales', icon: 'badge' },
    { path: '/procedimientos-medicos', label: 'Procedimientos Médicos', icon: 'medical_services' },
    { path: '/mfe-pacientes', label: 'Pacientes', icon: 'person' }
  ]);

  constructor() {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed()
      )
      .subscribe(() => {
        this.closeSidenav();
      });
  }

  toggleSidenav(): void {
    this.isSidenavOpen.update((currentState) => !currentState);
  }

  closeSidenav(): void {
    this.isSidenavOpen.set(false);
  }
}
