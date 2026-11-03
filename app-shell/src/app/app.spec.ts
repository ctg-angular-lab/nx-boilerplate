import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { App } from './app';

describe('App (Host Component)', () => {
  let component: App;
  let fixture: ComponentFixture<App>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideNoopAnimations(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(App);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe contener las 4 rutas federadas en mfeRoutes, incluyendo historial-pacientes', () => {
    const routes = component.mfeRoutes();
    expect(routes.length).toBe(4);
    expect(routes.some((r) => r.path === '/historial-pacientes')).toBe(true);
    expect(routes.some((r) => r.path === '/agendador-citas')).toBe(true);
    expect(routes.some((r) => r.path === '/profesionales')).toBe(true);
    expect(routes.some((r) => r.path === '/procedimientos-medicos')).toBe(true);
  });

  it('debe alternar y cerrar el estado del sidenav', () => {
    expect(component.isSidenavOpen()).toBe(false);

    component.toggleSidenav();
    expect(component.isSidenavOpen()).toBe(true);

    component.closeSidenav();
    expect(component.isSidenavOpen()).toBe(false);
  });
});
