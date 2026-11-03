import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RemoteEntryComponent } from './remote-entry.component';

describe('RemoteEntryComponent', () => {
  let component: RemoteEntryComponent;
  let fixture: ComponentFixture<RemoteEntryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RemoteEntryComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RemoteEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe renderizar el título del módulo', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const title = compiled.querySelector('.historial-pacientes-title');
    expect(title?.textContent).toContain('Historial de Pacientes');
  });
});

