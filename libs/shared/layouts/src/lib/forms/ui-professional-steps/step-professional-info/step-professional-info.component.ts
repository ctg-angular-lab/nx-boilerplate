import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { IMedicalCategory, ISpecialtyCategoryRef } from '@nx-boilerplate/api-interfaces';

@Component({
  selector: 'lib-step-professional-info',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './step-professional-info.component.html',
  styleUrl: './step-professional-info.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StepProfessionalInfoComponent {
  readonly stepForm = input.required<FormGroup>();
  readonly categories = input<IMedicalCategory[]>([]);

  readonly nextStep = output<void>();
  readonly prevStep = output<void>();

  readonly compareCategories = (
    a: ISpecialtyCategoryRef | null,
    b: ISpecialtyCategoryRef | null
  ): boolean => !!a && !!b && a.categoryId === b.categoryId;

  onCategoryChange(event: MatSelectChange): void {
    const selected = event.value as ISpecialtyCategoryRef | null;
    const profesionControl = this.stepForm().get('profesion');
    if (profesionControl) {
      profesionControl.setValue(selected?.name ?? '');
      profesionControl.markAsDirty();
    }
  }

  toCategoryRef(cat: IMedicalCategory): ISpecialtyCategoryRef {
    return {
      categoryId: cat.categoryId,
      name: cat.name,
      slug: cat.slug,
    };
  }

  hasError(field: string, error: string): boolean {
    const control = this.stepForm().get(field);
    return !!(control && control.hasError(error) && (control.dirty || control.touched));
  }
}
