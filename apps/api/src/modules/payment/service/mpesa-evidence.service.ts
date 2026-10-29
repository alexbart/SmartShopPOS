import type { PrismaClient } from '@prisma/client';

type CaptureEvidenceInput = {
  organizationId: string;
  paymentId: string;
  capturedBy: string;
  rawMessage: string;
  claimedReceiptCode?: string;
  claimedAmount?: number;
  claimedPhone?: string;
  claimedPaidAt?: Date;
};

const evidenceRelations = {
  capturer: {
    select: { id: true, firstName: true, lastName: true },
  },
  reviewer: {
    select: { id: true, firstName: true, lastName: true },
  },
} as const;

export class MpesaEvidenceService {
  constructor(private readonly _prisma: PrismaClient) {}

  /**
   * Capture SMS text as unverified evidence.
   * This method never changes Payment.status or publishes payment events.
   */
  async capture(input: CaptureEvidenceInput) {
    const payment = await this._prisma.payment.findFirst({
      where: {
        id: input.paymentId,
        organizationId: input.organizationId,
      },
      select: {
        id: true,
        method: true,
      },
    });

    if (!payment) {
      return { kind: 'not_found' } as const;
    }

    if (payment.method !== 'MPESA') {
      return { kind: 'not_mpesa' } as const;
    }

    const evidence = await this._prisma.mpesaMessageEvidence.create({
      data: {
        organizationId: input.organizationId,
        paymentId: payment.id,
        capturedBy: input.capturedBy,
        rawMessage: input.rawMessage.trim(),
        claimedReceiptCode: input.claimedReceiptCode?.trim() || null,
        claimedAmount: input.claimedAmount,
        claimedPhone: input.claimedPhone?.trim() || null,
        claimedPaidAt: input.claimedPaidAt,
      },
      include: evidenceRelations,
    });

    return { kind: 'success', data: evidence } as const;
  }

  /**
   * List evidence only when the payment belongs to this organization.
   */
  async listForPayment(paymentId: string, organizationId: string) {
    const payment = await this._prisma.payment.findFirst({
      where: { id: paymentId, organizationId },
      select: { id: true, method: true },
    });

    if (!payment) {
      return { kind: 'not_found' } as const;
    }

    if (payment.method !== 'MPESA') {
      return { kind: 'not_mpesa' } as const;
    }

    const evidence = await this._prisma.mpesaMessageEvidence.findMany({
      where: {
        paymentId: payment.id,
        organizationId,
      },
      orderBy: { createdAt: 'desc' },
      include: evidenceRelations,
    });

    return { kind: 'success', data: evidence } as const;
  }

  /**
   * Record a review decision without changing the underlying payment.
   * Only CAPTURED evidence can receive a decision.
   */
  async decide(
    evidenceId: string,
    organizationId: string,
    reviewerId: string,
    decision: 'REVIEWED' | 'REJECTED',
    reviewNotes?: string,
  ): Promise<
    { kind: 'success'; data: unknown } | { kind: 'not_found' } | { kind: 'already_decided' }
  > {
    const updated = await this._prisma.mpesaMessageEvidence.updateMany({
      where: {
        id: evidenceId,
        organizationId,
        status: 'CAPTURED',
      },
      data: {
        status: decision,
        reviewNotes: reviewNotes?.trim() || null,
        reviewedAt: new Date(),
        reviewedBy: reviewerId,
      },
    });

    if (updated.count === 0) {
      const existing = await this._prisma.mpesaMessageEvidence.findFirst({
        where: { id: evidenceId, organizationId },
        select: { id: true },
      });

      if (!existing) {
        return { kind: 'not_found' };
      }

      return { kind: 'already_decided' };
    }

    const evidence = await this._prisma.mpesaMessageEvidence.findFirst({
      where: { id: evidenceId, organizationId },
      include: evidenceRelations,
    });

    if (!evidence) {
      return { kind: 'not_found' };
    }

    return { kind: 'success', data: evidence };
  }
}
