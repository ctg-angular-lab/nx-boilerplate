export interface IMedicalCategory {
  categoryId: string;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
}

export interface ISpecialtyCategoryRef {
  categoryId: string;
  name: string;
  slug: string;
}

export interface IProcedureCategoryRef {
  categoryId: string;
  name: string;
}

export interface ICreateCategoryRequest {
  name: string;
  slug: string;
  description?: string;
  isActive?: boolean;
}
