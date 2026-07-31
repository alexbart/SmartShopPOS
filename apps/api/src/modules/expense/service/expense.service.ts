import type {
  IExpenseRepository,
  CreateExpenseCommand,
  ExpenseEntity,
  CreateExpenseCategoryCommand,
  ExpenseCategoryEntity,
  ExpenseFilters,
} from '../repository/expense.repository.js';
import type { WorkflowService } from '../../workflow/service/workflow.service.js';
import { WorkflowAction } from '../../../shared/constants/domain-constants.js';

export class ExpenseService {
  constructor(
    private readonly _repository: IExpenseRepository,
    private readonly _workflowService?: WorkflowService,
  ) {}

  async createExpense(command: CreateExpenseCommand): Promise<{ id: string; needsApproval: boolean }> {
    if (Number(command.amount) <= 0) {
      throw new Error('Expense amount must be greater than zero.');
    }

    const id = await this._repository.create({
      organizationId: command.organizationId,
      categoryId: command.categoryId,
      amount: command.amount,
      description: command.description,
      expenseDate: command.expenseDate,
      paidById: command.paidById,
      paymentReference: command.paymentReference,
      createdBy: command.createdBy,
    });

    let needsApproval = false;

    if (this._workflowService) {
      const approval = await this._workflowService.requestApproval({
        organizationId: command.organizationId,
        action: WorkflowAction.EXPENSE,
        entityType: 'Expense',
        entityId: id,
        amount: Number(command.amount),
        branchId: undefined,
        requestedBy: command.createdBy,
        requesterRoleId: '',
      });

      needsApproval = approval.status === 'PENDING';
    }

    return { id, needsApproval };
  }

  async getExpense(id: string, organizationId: string): Promise<ExpenseEntity | null> {
    return this._repository.findById(id, organizationId);
  }

  async listExpenses(
    organizationId: string,
    filters: ExpenseFilters,
  ): Promise<ExpenseEntity[]> {
    return this._repository.findByOrganization(organizationId, filters);
  }

  async createCategory(command: CreateExpenseCategoryCommand): Promise<string> {
    return this._repository.createCategory({
      organizationId: command.organizationId,
      name: command.name,
      code: command.code.toUpperCase(),
      description: command.description,
      budget: command.budget,
    });
  }

  async getCategory(id: string, organizationId: string): Promise<ExpenseCategoryEntity | null> {
    return this._repository.findCategoryById(id, organizationId);
  }

  async listCategories(organizationId: string): Promise<ExpenseCategoryEntity[]> {
    return this._repository.findCategories(organizationId);
  }
}
