import { PrismaClient } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import type { ICashDrawerRepository, CashDrawerSummary, CashMovementItem } from './cash-drawer.repository.js';
import { NotFoundError, ConflictError } from '../../../shared/errors/business-error.js';

export class CashDrawerRepositoryImpl implements ICashDrawerRepository {
  constructor(private readonly _prisma: PrismaClient | Prisma.TransactionClient) {}

  async getCurrentSession(organizationId: string, branchId: string): Promise<CashDrawerSummary | null> {
    const session = await this._prisma.cashDrawerSession.findFirst({
      where: {
        organizationId,
        status: 'OPEN',
        cashDrawer: { branchId },
      },
      include: {
        cashDrawer: { select: { name: true } },
        movements: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            type: true,
            amount: true,
            referenceType: true,
            notes: true,
            performedBy: true,
            createdAt: true,
          },
        },
      },
    });

    if (!session) return null;

    return this._toSummary(session);
  }

  async openSession(organizationId: string, branchId: string, userId: string, openingFloat: number): Promise<CashDrawerSummary> {
    const existing = await this._prisma.cashDrawerSession.findFirst({
      where: {
        organizationId,
        status: 'OPEN',
        cashDrawer: { branchId },
      },
    });

    if (existing) {
      throw new ConflictError('A cash drawer session is already open for this branch.');
    }

    let drawer = await this._prisma.cashDrawer.findFirst({
      where: {
        organizationId,
        branchId,
      },
      select: { id: true },
    });

    if (!drawer) {
      drawer = await this._prisma.cashDrawer.create({
        data: {
          organizationId,
          branchId,
          name: 'Main',
        },
        select: { id: true },
      });
    }

    const session = await this._prisma.cashDrawerSession.create({
      data: {
        organizationId,
        cashDrawerId: drawer.id,
        openedBy: userId,
        openingFloat,
        expectedCash: openingFloat,
      },
      include: {
        cashDrawer: { select: { name: true } },
        movements: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            type: true,
            amount: true,
            referenceType: true,
            notes: true,
            performedBy: true,
            createdAt: true,
          },
        },
      },
    });

    await this._prisma.cashMovement.create({
      data: {
        organizationId,
        sessionId: session.id,
        type: 'OPENING_FLOAT',
        amount: openingFloat,
        performedBy: userId,
      },
    });

    return this._toSummary(session);
  }

  async closeSession(sessionId: string, countedCash: number): Promise<CashDrawerSummary> {
    const session = await this._prisma.cashDrawerSession.findFirst({
      where: { id: sessionId },
      include: {
        cashDrawer: { select: { name: true } },
        movements: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            type: true,
            amount: true,
            referenceType: true,
            notes: true,
            performedBy: true,
            createdAt: true,
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundError('Cash drawer session not found.');
    }

    if (session.status === 'CLOSED') {
      throw new ConflictError('Cash drawer session is already closed.');
    }

    const variance = Number(countedCash) - Number(session.expectedCash);

    await this._prisma.$transaction(async (tx) => {
      await tx.cashDrawerSession.update({
        where: { id: sessionId },
        data: {
          status: 'CLOSED',
          closingFloat: countedCash,
          countedCash,
          variance,
          closedAt: new Date(),
        },
      });

      await tx.cashMovement.create({
        data: {
          organizationId: session.organizationId,
          sessionId,
          type: 'CLOSING',
          amount: countedCash,
          performedBy: session.openedBy,
          notes: `Variance: ${variance}`,
        },
      });
    });

    const updated = await this._prisma.cashDrawerSession.findFirst({
      where: { id: sessionId },
      include: {
        cashDrawer: { select: { name: true } },
        movements: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            type: true,
            amount: true,
            referenceType: true,
            notes: true,
            performedBy: true,
            createdAt: true,
          },
        },
      },
    });

    if (!updated) {
      throw new NotFoundError('Cash drawer session not found after closing.');
    }

    return this._toSummary(updated);
  }

  async addCashIn(sessionId: string, amount: number, notes?: string, performedBy?: string): Promise<void> {
    const session = await this._prisma.cashDrawerSession.findFirst({
      where: { id: sessionId, status: 'OPEN' },
    });

    if (!session) {
      throw new NotFoundError('Open cash drawer session not found.');
    }

    await this._prisma.$transaction(async (tx) => {
      await tx.cashDrawerSession.update({
        where: { id: sessionId },
        data: {
          totalCashIn: { increment: amount },
          expectedCash: { increment: amount },
        },
      });

      await tx.cashMovement.create({
        data: {
          organizationId: session.organizationId,
          sessionId,
          type: 'CASH_IN',
          amount,
          notes,
          performedBy,
        },
      });
    });
  }

  async addCashOut(sessionId: string, amount: number, notes?: string, performedBy?: string): Promise<void> {
    const session = await this._prisma.cashDrawerSession.findFirst({
      where: { id: sessionId, status: 'OPEN' },
    });

    if (!session) {
      throw new NotFoundError('Open cash drawer session not found.');
    }

    await this._prisma.$transaction(async (tx) => {
      await tx.cashDrawerSession.update({
        where: { id: sessionId },
        data: {
          totalCashOut: { increment: amount },
          expectedCash: { decrement: amount },
        },
      });

      await tx.cashMovement.create({
        data: {
          organizationId: session.organizationId,
          sessionId,
          type: 'CASH_OUT',
          amount,
          notes,
          performedBy,
        },
      });
    });
  }

  async getMovements(organizationId: string, sessionId: string): Promise<CashMovementItem[]> {
    const movements = await this._prisma.cashMovement.findMany({
      where: { sessionId, organizationId },
      orderBy: { createdAt: 'desc' },
    });

    return movements.map((m) => ({
      id: m.id,
      type: m.type,
      amount: Number(m.amount),
      referenceType: m.referenceType ?? undefined,
      notes: m.notes ?? undefined,
      performedBy: m.performedBy,
      createdAt: m.createdAt,
    }));
  }

  private _toSummary(session: {
    id: string;
    cashDrawer: { name: string };
    status: string;
    openingFloat: number;
    closingFloat: number | null;
    totalSales: number;
    totalRefunds: number;
    totalCashIn: number;
    totalCashOut: number;
    expectedCash: number;
    countedCash: number | null;
    variance: number | null;
    openedAt: Date;
    closedAt: Date | null;
    movements: CashMovementItem[];
  }): CashDrawerSummary {
    return {
      drawerId: session.id,
      name: session.cashDrawer.name,
      session: {
        id: session.id,
        status: session.status as 'OPEN' | 'CLOSED',
        openingFloat: Number(session.openingFloat),
        closingFloat: session.closingFloat ? Number(session.closingFloat) : null,
        totalSales: Number(session.totalSales),
        totalRefunds: Number(session.totalRefunds),
        totalCashIn: Number(session.totalCashIn),
        totalCashOut: Number(session.totalCashOut),
        expectedCash: Number(session.expectedCash),
        countedCash: session.countedCash ? Number(session.countedCash) : null,
        variance: session.variance ? Number(session.variance) : null,
        openedAt: session.openedAt,
        closedAt: session.closedAt,
        movements: session.movements,
      },
    };
  }
}
