export interface CreateExpenseCommand {
  organizationId: string;
  categoryId: string;
  amount: number;
  description?: string;
  expenseDate?: Date;
  paidById?: string;
  paymentReference?: string;
  createdBy: string;
}

export interface ExpenseEntity {
  id: string;
  organizationId: string;
  categoryId: string;
  categoryName: string;
  amount: number;
  description?: string;
  expenseDate: Date;
  paidById?: string;
  paymentReference?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateExpenseCategoryCommand {
  organizationId: string;
  name: string;
  code: string;
  description?: string;
  budget?: number;
  createdBy: string;
}

export interface ExpenseCategoryEntity {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  description?: string;
  budget?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IExpenseRepository {
  // eslint-disable-next-line no-unused-vars
  create(model: CreateExpenseModel): Promise<string>;
  // eslint-disable-next-line no-unused-vars
  findById(id: string, organizationId: string): Promise<ExpenseEntity | null>;
  // eslint-disable-next-line no-unused-vars
  findByOrganization(organizationId: string, filters?: ExpenseFilters): Promise<ExpenseEntity[]>;
  // eslint-disable-next-line no-unused-vars
  createCategory(model: CreateExpenseCategoryModel): Promise<string>;
  // eslint-disable-next-line no-unused-vars
  findCategoryById(id: string, organizationId: string): Promise<ExpenseCategoryEntity | null>;
  // eslint-disable-next-line no-unused-vars
  findCategories(organizationId: string): Promise<ExpenseCategoryEntity[]>;
}

export interface CreateExpenseModel {
  organizationId: string;
  categoryId: string;
  amount: number;
  description?: string;
  expenseDate: Date;
  paidById?: string;
  paymentReference?: string;
  createdBy: string;
}

export interface CreateExpenseCategoryModel {
  organizationId: string;
  name: string;
  code: string;
  description?: string;
  budget?: number;
}

export interface ExpenseFilters {
  from?: Date;
  to?: Date;
  categoryId?: string;
  limit?: number;
}
