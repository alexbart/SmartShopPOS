import type { FastifyRequest, FastifyReply } from 'fastify';
import { MpesaEvidenceService } from '../service/mpesa-evidence.service.js';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type CaptureBody = {
  rawMessage?: unknown;
  claimedReceiptCode?: unknown;
  claimedAmount?: unknown;
  claimedPhone?: unknown;
  claimedPaidAt?: unknown;
};

type DecisionBody = {
  reviewNotes?: unknown;
};

export class MpesaEvidenceController {
  constructor(private readonly _evidenceService: MpesaEvidenceService) {}

  async capture(request: FastifyRequest, reply: FastifyReply) {
    const { id: paymentId } = request.params as { id: string };
    const body = (request.body ?? {}) as CaptureBody;
    const { organizationId, userId } = request.requestContext;

    if (!UUID_PATTERN.test(paymentId)) {
      return reply.status(400).send({
        success: false,
        message: 'A valid payment ID is required.',
      });
    }

    if (
      typeof body.rawMessage !== 'string' ||
      !body.rawMessage.trim() ||
      body.rawMessage.trim().length > 10000
    ) {
      return reply.status(400).send({
        success: false,
        message: 'rawMessage is required and must not exceed 10,000 characters.',
      });
    }

    if (
      body.claimedReceiptCode !== undefined &&
      (typeof body.claimedReceiptCode !== 'string' || body.claimedReceiptCode.length > 50)
    ) {
      return reply.status(400).send({
        success: false,
        message: 'claimedReceiptCode must be a string of at most 50 characters.',
      });
    }

    if (
      body.claimedPhone !== undefined &&
      (typeof body.claimedPhone !== 'string' || body.claimedPhone.length > 30)
    ) {
      return reply.status(400).send({
        success: false,
        message: 'claimedPhone must be a string of at most 30 characters.',
      });
    }

    if (
      body.claimedAmount !== undefined &&
      (typeof body.claimedAmount !== 'number' ||
        !Number.isFinite(body.claimedAmount) ||
        body.claimedAmount <= 0)
    ) {
      return reply.status(400).send({
        success: false,
        message: 'claimedAmount must be a positive number.',
      });
    }

    let claimedPaidAt: Date | undefined;

    if (body.claimedPaidAt !== undefined) {
      if (
        typeof body.claimedPaidAt !== 'string' ||
        !Number.isFinite(Date.parse(body.claimedPaidAt))
      ) {
        return reply.status(400).send({
          success: false,
          message: 'claimedPaidAt must be a valid date string.',
        });
      }

      claimedPaidAt = new Date(body.claimedPaidAt);
    }

    const result = await this._evidenceService.capture({
      organizationId,
      paymentId,
      capturedBy: userId,
      rawMessage: body.rawMessage,
      claimedReceiptCode: body.claimedReceiptCode as string | undefined,
      claimedAmount: body.claimedAmount as number | undefined,
      claimedPhone: body.claimedPhone as string | undefined,
      claimedPaidAt,
    });

    if (result.kind === 'not_found') {
      return reply.status(404).send({
        success: false,
        message: 'Payment not found.',
      });
    }

    if (result.kind === 'not_mpesa') {
      return reply.status(400).send({
        success: false,
        message: 'Manual M-Pesa evidence can only be attached to M-Pesa payments.',
      });
    }

    return reply.status(201).send({
      success: true,
      message: 'M-Pesa SMS evidence captured as unverified evidence.',
      data: result.data,
    });
  }

  async listForPayment(request: FastifyRequest, reply: FastifyReply) {
    const { id: paymentId } = request.params as { id: string };
    const { organizationId } = request.requestContext;

    if (!UUID_PATTERN.test(paymentId)) {
      return reply.status(400).send({
        success: false,
        message: 'A valid payment ID is required.',
      });
    }

    const result = await this._evidenceService.listForPayment(paymentId, organizationId);

    if (result.kind === 'not_found') {
      return reply.status(404).send({
        success: false,
        message: 'Payment not found.',
      });
    }

    if (result.kind === 'not_mpesa') {
      return reply.status(400).send({
        success: false,
        message: 'The selected payment is not an M-Pesa payment.',
      });
    }

    return reply.status(200).send({
      success: true,
      message: 'M-Pesa evidence retrieved successfully.',
      data: result.data,
    });
  }

  async review(request: FastifyRequest, reply: FastifyReply) {
    return this.decide(request, reply, 'REVIEWED');
  }

  async reject(request: FastifyRequest, reply: FastifyReply) {
    return this.decide(request, reply, 'REJECTED');
  }

  private async decide(
    request: FastifyRequest,
    reply: FastifyReply,
    decision: 'REVIEWED' | 'REJECTED',
  ) {
    const { evidenceId } = request.params as { evidenceId: string };
    const body = (request.body ?? {}) as DecisionBody;
    const { organizationId, userId } = request.requestContext;

    if (!UUID_PATTERN.test(evidenceId)) {
      return reply.status(400).send({
        success: false,
        message: 'A valid evidence ID is required.',
      });
    }

    if (
      body.reviewNotes !== undefined &&
      (typeof body.reviewNotes !== 'string' || body.reviewNotes.length > 1000)
    ) {
      return reply.status(400).send({
        success: false,
        message: 'reviewNotes must be a string of at most 1,000 characters.',
      });
    }

    const result = await this._evidenceService.decide(
      evidenceId,
      organizationId,
      userId,
      decision,
      body.reviewNotes as string | undefined,
    );

    if (result.kind === 'not_found') {
      return reply.status(404).send({
        success: false,
        message: 'Evidence not found.',
      });
    }

    if (result.kind === 'already_decided') {
      return reply.status(409).send({
        success: false,
        message: 'This evidence has already been reviewed or rejected.',
      });
    }

    return reply.status(200).send({
      success: true,
      message:
        decision === 'REVIEWED'
          ? 'Evidence review recorded. Payment remains unverified.'
          : 'Evidence rejected. Payment status remains unchanged.',
      data: result.data,
    });
  }
}
