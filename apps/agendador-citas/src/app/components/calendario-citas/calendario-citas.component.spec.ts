import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CalendarioCitasComponent } from './calendario-citas.component';

describe('CalendarioCitasComponent', () => {
  let component: CalendarioCitasComponent;
  let fixture: ComponentFixture<CalendarioCitasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CalendarioCitasComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CalendarioCitasComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
