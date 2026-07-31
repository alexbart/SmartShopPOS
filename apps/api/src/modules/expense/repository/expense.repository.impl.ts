import { PrismaClient } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import type {
  IExpenseRepository,
  CreateExpenseModel,
  ExpenseEntity,
  CreateExpenseCategoryModel,
  ExpenseCategoryEntity,
  ExpenseFilters,
} from './expense.repository.js';
import { NotFoundError } from '../../../shared/errors/business-error.js';

export class ExpenseRepositoryImpl implements IExpenseRepository {
  constructor(private readonly _prisma: PrismaClient | Prisma.TransactionClient) {}

  async create(model: CreateExpenseModel): Promise<string> {
    const result = await this._prisma.expense.create({
      data: {
        organizationId: model.organizationId,
        categoryId: model.categoryId,
        amount: model.amount,
        description: model.description,
        expenseDate: model.expenseDate ?? new Date(),
        paidById: model.paidById,
        paymentReference: model.paymentReference,
      },
      select: { id: true },
    });

    return result.id;
  }

  async findById(id: string, organizationId: string): Promise<ExpenseEntity | null> {
    const expense = await this._prisma.expense.findFirst({
      where: { id, organizationId },
      include: {
        category: { select: { name: true } },
      },
    });

    if (!expense) return null;

    return this._toEntity(expense);
  }

  async findByOrganization(organizationId: string, filters: ExpenseFilters = {}): Promise<ExpenseEntity[]> {
    const where: Record<string, unknown> = { organizationId };

    if (filters.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters.from || filters.to) {
      where.expenseDate = {};
      if (filters.from) where.expenseDate.gte = filters.from;
      if (filters.to) where.expenseDate.lte = filters.to;
    }

    const expenses = await this._prisma.expense.findMany({
      where,
      include: {
        category: { select: { name: true } },
      },
      orderBy: { expenseDate: 'desc' },
      take: filters.limit ?? undefined,
    });

    return expenses.map((e) => this._toEntity(e));
  }

  async createCategory(model: CreateExpenseCategoryModel): Promise<string> {
    const existing = await this._prisma.expenseCategory_.findFirst({
      where: {
        organizationId: model.organizationId,
        code: model.code,
      },
    });

    if (existing) {
      throw new NotFoundError('This error should use ConflictError - duplicate category code');
    }

    const result = await this._prisma.expenseCategory_.create({
      data: {
        organizationId: model.organizationId,
        name: model.name,
        code: model.code,
        description: model.description,
        budget: model.budget,
      },
      select: { id: true },
    });

    return result.id;
  }

  async findCategoryById(id: string, organizationId: string): Promise<ExpenseCategoryEntity | null> {
    const category = await this._prisma.expenseCategory_.findFirst({
      where: { id, organizationId },
    });

    if (!category) return null;

    return {
      id: category.id,
      organizationId: category.organizationId,
      name: category.name,
      code: category.code,
      description: category.description ?? undefined,
      budget: category.budget ? Number(category.budget) : undefined,
      isActive: category.isActive,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  }

  async findCategories(organizationId: string): Promise<ExpenseCategoryEntity[]> {
    const categories = await this._prisma.expenseCategory_.findMany({
      where: { organizationId, isActive: true },
      orderBy: { name: 'asc' },
    });

    return categories.map((c) => ({
      id: c.id,
      organizationId: c.organizationId,
      name: c.name,
      code: c.code,
      description: c.description ?? undefined,
      budget: c.budget ? Number(c.budget) : undefined,
      isActive: c.isActive,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));
  }

  private _toEntity(expense: {
    id: string;
    organizationId: string;
    categoryId: string;
    category: { name: string };
    amount: number;
    description?: string;
    expenseDate: Date;
    paidById?: string;
    paymentReference?: string;
    createdAt: Date;
    updatedAt: Date;
  }): ExpenseEntity {
    return {
      id: expense.id,
      organizationId: expense.organizationId,
      categoryId: expense.categoryId,
      categoryName: expense.category.name,
      amount: Number(expense.amount),
      description: expense.description ?? undefined,
      expenseDate: expense.expenseDate,
      paidById: expense.paidById ?? undefined,
      paymentReference: expense.paymentReference ?? undefined,
      createdAt: expense.createdAt,
      updatedAt: expense.updatedAt,
    };
  }
}
