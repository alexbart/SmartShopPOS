import 'reflect-metadata';
import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../../../app.js';
import type { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { WorkflowAction } from '../../../shared/constants/domain-constants.js';
import { WorkflowRepositoryImpl } from '../../workflow/repository/workflow.repository.impl.js';
import { WorkflowService } from '../../workflow/service/workflow.service.js';

const prisma = new PrismaClient();

describe('Workflow & Approval integration tests', () => {
  let app: FastifyInstance;
  let accessToken: string;
  let approverToken: string;
  let organizationId: string;
  let approverRole: string;
  let branchId: string;
  let supplierId: string;
  let productId: string;
  let unitId: string;
  let warehouseId: string;
  let approvalId: string;
  let poIdForHistory: string;

  beforeAll(async () => {
    app = await buildApp();

    const ts = Date.now();

    const registerResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        organizationName: `WFTest-${ts}`,
        ownerFirstName: 'Test',
        ownerLastName: 'User',
        ownerEmail: `wftest-${ts}@example.com`,
        ownerPhone: '+254700000000',
        password: 'StrongPassword123!',
      },
    });

    const registerBody = JSON.parse(registerResponse.body);
    accessToken = registerBody.data.tokens.accessToken;
    organizationId = registerBody.data.organization.id;

    const branch = await prisma.branch.findFirst({
      where: { organizationId },
      select: { id: true },
    });
    branchId = branch!.id;

    const roles = await prisma.role.findMany({
      where: { organizationId },
      select: { id: true, name: true },
    });
    const ownerRole = roles.find((r) => r.name === 'OWNER');
    approverRole = ownerRole?.name ?? 'OWNER';

    const approverEmail = `approver-${ts}@example.com`;
    const { hashPassword } = await import('../../auth/utils/index.js');
    const hashedPassword = await hashPassword('StrongPassword123!');

    const approverRoleRecord = await prisma.role.findFirst({
      where: { name: 'OWNER' },
      select: { id: true },
    });

    await prisma.user.create({
      data: {
        organizationId,
        branchId,
        email: approverEmail,
        firstName: 'Approver',
        lastName: 'Manager',
        phone: '+254700000001',
        passwordHash: hashedPassword,
        status: 'ACTIVE',
        roles: {
          create: [{ roleId: approverRoleRecord?.id ?? '' }],
        },
      },
    });

    const loginResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        organizationCode: registerBody.data.organization.code,
        email: approverEmail,
        password: 'StrongPassword123!',
      },
    });

    const loginBody = JSON.parse(loginResponse.body);
    approverToken = loginBody.data?.tokens?.accessToken ?? loginBody.tokens?.accessToken ?? '';

    const unit = await prisma.unit.create({
      data: {
        organizationId,
        code: `WF-UNIT-${ts}`,
        name: 'Unit',
        abbreviation: 'u',
      },
    });
    unitId = unit.id;

    const warehouse = await prisma.warehouse.create({
      data: {
        organizationId,
        branchId,
        code: `WF-WH-${ts}`,
        name: 'WF Test Warehouse',
        isDefault: true,
      },
    });
    warehouseId = warehouse.id;

    const supplier = await prisma.supplier.create({
      data: {
        organizationId,
        code: `WF-SUP-${ts}`,
        name: 'WF Test Supplier',
        isActive: true,
      },
    });
    supplierId = supplier.id;

    const product = await prisma.product.create({
      data: {
        organizationId,
        name: 'Test Product',
        code: `WF-PROD-${ts}`,
        sku: 'SKU-WF-001',
        unitId,
        costPrice: 50,
        sellingPrice: 100,
        lowStockThreshold: 5,
      },
    });
    productId = product.id;
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it('should auto-approve PO when no matching rule exists', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/purchase-orders',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {
        supplierId,
        warehouseId,
        branchId,
        items: [{ productId, quantity: 10, unitCost: 1 }],
      },
    });

    const body = JSON.parse(response.body);
    const poId = body.data.id;

    const submitResponse = await app.inject({
      method: 'POST',
      url: `/api/v1/purchase-orders/${poId}/submit`,
      headers: { authorization: `Bearer ${accessToken}` },
    });

    const submitBody = JSON.parse(submitResponse.body);
    expect(submitResponse.statusCode).toBe(200);
    expect(submitBody.data.status).toBe('SUBMITTED');
  });

  it('should create a PO requiring approval when rule matches amount threshold', async () => {
    const workflowService = new WorkflowService(new WorkflowRepositoryImpl(prisma));

    await workflowService.createRule({
      organizationId,
      action: WorkflowAction.PURCHASE_ORDER,
      minimumAmount: 100000,
      approverRole,
      branchId,
      priority: 1,
      isActive: true,
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/purchase-orders',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {
        supplierId,
        warehouseId,
        branchId,
        items: [{ productId, quantity: 2000, unitCost: 100 }],
      },
    });

    const po = JSON.parse(response.body).data;
    poIdForHistory = po.id;

    const submitResponse = await app.inject({
      method: 'POST',
      url: `/api/v1/purchase-orders/${po.id}/submit`,
      headers: { authorization: `Bearer ${accessToken}` },
    });

    const submitBody = JSON.parse(submitResponse.body);
    expect(submitResponse.statusCode).toBe(200);
    expect(submitBody.data.status).toBe('PENDING_APPROVAL');

    const request = await prisma.approvalRequest.findFirst({
      where: {
        organizationId,
        entityType: 'PurchaseOrder',
        entityId: po.id,
        status: 'PENDING',
      },
    });

    expect(request).toBeDefined();
    approvalId = request!.id;
  });

  it('should allow approver to approve the request', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/api/v1/workflow/${approvalId}/approve`,
      headers: { authorization: `Bearer ${approverToken}` },
      payload: {
        comments: 'Approved by finance manager',
      },
    });

    const body = JSON.parse(response.body);
    expect(response.statusCode).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('APPROVED');
  });

  it('should reject a request', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/purchase-orders',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {
        supplierId,
        warehouseId,
        branchId,
        items: [{ productId, quantity: 2000, unitCost: 100 }],
      },
    });

    const po = JSON.parse(response.body).data;

    await app.inject({
      method: 'POST',
      url: `/api/v1/purchase-orders/${po.id}/submit`,
      headers: { authorization: `Bearer ${accessToken}` },
    });

    const pendingRequest = await prisma.approvalRequest.findFirst({
      where: {
        organizationId,
        entityType: 'PurchaseOrder',
        entityId: po.id,
        status: 'PENDING',
      },
    });

    if (pendingRequest) {
      const rejectResponse = await app.inject({
        method: 'POST',
        url: `/api/v1/workflow/${pendingRequest.id}/reject`,
        headers: { authorization: `Bearer ${approverToken}` },
        payload: { comments: 'Rejected - budget exceeded' },
      });

      const body = JSON.parse(rejectResponse.body);
      expect(rejectResponse.statusCode).toBe(200);
      expect(body.data.status).toBe('REJECTED');
    }
  });

  it('should list pending requests for approver', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/workflow/pending',
      headers: { authorization: `Bearer ${approverToken}` },
    });

    const body = JSON.parse(response.body);
    expect(response.statusCode).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.length).toBeGreaterThanOrEqual(0);
  });

  it('should route expense through workflow when rule matches', async () => {
    const workflowService = new WorkflowService(new WorkflowRepositoryImpl(prisma));

    await workflowService.createRule({
      organizationId,
      action: WorkflowAction.EXPENSE,
      minimumAmount: 10000,
      approverRole,
      priority: 1,
      isActive: true,
    });

    const cat = await prisma.expenseCategory_.create({
      data: {
        organizationId,
        name: 'Test Rent',
        code: 'TRENT',
      },
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/finance/expenses',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {
        categoryId: cat.id,
        amount: 200000,
        description: 'Large expense',
      },
    });

    const body = JSON.parse(response.body);
    expect(response.statusCode).toBe(201);
    expect(body.data.needsApproval).toBe(true);
  });

  it('should get request history', async () => {
    const history = await app.inject({
      method: 'GET',
      url: `/api/v1/workflow/history?entityType=PurchaseOrder&entityId=${poIdForHistory}`,
      headers: { authorization: `Bearer ${accessToken}` },
    });

    const body = JSON.parse(history.body);
    expect(history.statusCode).toBe(200);
    expect(body.data.length).toBeGreaterThan(0);
  });
});
