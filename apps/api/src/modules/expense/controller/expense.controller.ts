import type { FastifyRequest, FastifyReply } from 'fastify';
import type { ExpenseService } from '../service/expense.service.js';

export class ExpenseController {
  constructor(private readonly _expenseService: ExpenseService) {}

  async create(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as {
      categoryId: string;
      amount: number;
      description?: string;
      expenseDate?: string;
      paidById?: string;
      paymentReference?: string;
    };
    const orgId = request.requestContext.organizationId;

    const result = await this._expenseService.createExpense({
      organizationId: orgId,
      categoryId: body.categoryId,
      amount: body.amount,
      description: body.description,
      expenseDate: body.expenseDate ? new Date(body.expenseDate) : undefined,
      paidById: body.paidById,
      paymentReference: body.paymentReference,
      createdBy: request.requestContext.userId,
    });

    return reply.status(201).send({
      success: true,
      message: result.needsApproval
        ? 'Expense recorded. Approval required before processing.'
        : 'Expense recorded successfully.',
      data: { id: result.id, needsApproval: result.needsApproval },
    });
  }

  async getOne(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const orgId = request.requestContext.organizationId;

    const expense = await this._expenseService.getExpense(id, orgId);

    if (!expense) {
      return reply.status(404).send({ success: false, message: 'Expense not found.' });
    }

    return reply.status(200).send({
      success: true,
      message: 'Expense retrieved successfully.',
      data: expense,
    });
  }

  async list(request: FastifyRequest, reply: FastifyReply) {
    const orgId = request.requestContext.organizationId;
    const query = request.query as {
      from?: string;
      to?: string;
      categoryId?: string;
      limit?: string;
    };

    const expenses = await this._expenseService.listExpenses(orgId, {
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
      categoryId: query.categoryId,
      limit: query.limit ? Number(query.limit) : undefined,
    });

    return reply.status(200).send({
      success: true,
      message: 'Expenses retrieved successfully.',
      data: expenses,
    });
  }

  async createCategory(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as {
      name: string;
      code: string;
      description?: string;
      budget?: number;
    };
    const orgId = request.requestContext.organizationId;

    const id = await this._expenseService.createCategory({
      organizationId: orgId,
      name: body.name,
      code: body.code,
      description: body.description,
      budget: body.budget,
      createdBy: request.requestContext.userId,
    });

    return reply.status(201).send({
      success: true,
      message: 'Expense category created successfully.',
      data: { id },
    });
  }

  async listCategories(request: FastifyRequest, reply: FastifyReply) {
    const orgId = request.requestContext.organizationId;

    const categories = await this._expenseService.listCategories(orgId);

    return reply.status(200).send({
      success: true,
      message: 'Expense categories retrieved successfully.',
      data: categories,
    });
  }

  async getCategory(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const orgId = request.requestContext.organizationId;

    const category = await this._expenseService.getCategory(id, orgId);

    if (!category) {
      return reply.status(404).send({ success: false, message: 'Category not found.' });
    }

    return reply.status(200).send({
      success: true,
      message: 'Category retrieved successfully.',
      data: category,
    });
  }
}
