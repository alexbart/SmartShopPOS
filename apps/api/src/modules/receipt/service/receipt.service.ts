import type { PrismaClient } from '@prisma/client';
import type { IUnitOfWork } from '../../../shared/database/unit-of-work.js';
import { ReceiptRepositoryImpl } from '../repositories/receipt.repository.impl.js';
import type { CreateReceiptCommand } from '../commands/create-receipt.command.js';
import type { ReceiptResponse } from '../responses/receipt.response.js';
import type { NumberSequenceService } from '../../../shared/services/number-sequence/number-sequence.service.js';
import { NumberSequenceTypes } from '../../../shared/constants/domain-constants.js';
import { NotFoundError, ConflictError } from '../../../shared/errors/business-error.js';

export class ReceiptService {
  constructor(
    private readonly _unitOfWork: IUnitOfWork,
    private readonly _numberSequenceService: NumberSequenceService,
    private readonly _prisma: PrismaClient,
  ) {}

  async create(command: CreateReceiptCommand): Promise<ReceiptResponse> {
    return this._unitOfWork.execute(async (tx) => {
      const receiptRepo = new ReceiptRepositoryImpl(tx);
      const receiptNumber = await this._numberSequenceService.next(
        NumberSequenceTypes.RECEIPT,
        command.organizationId,
      );

      const existing = await receiptRepo.findBySaleId(command.saleId, command.organizationId);
      if (existing) {
        throw new ConflictError('Receipt already exists for this sale.');
      }

      const receiptId = await receiptRepo.create({
        organizationId: command.organizationId,
        saleId: command.saleId,
        number: receiptNumber,
        issuedAt: new Date(),
      });

      const receipt = await receiptRepo.findById(receiptId, command.organizationId);
      if (!receipt) {
        throw new NotFoundError('Receipt not found after creation.');
      }

      return this.toResponse(receipt);
    });
  }

  async findByNumber(number: string, organizationId: string): Promise<ReceiptResponse> {
    const receiptRepo = new ReceiptRepositoryImpl(this._prisma);
    const receipt = await receiptRepo.findByNumber(number, organizationId);
    if (!receipt) {
      throw new NotFoundError('Receipt not found.');
    }
    return this.toResponse(receipt);
  }

  async findBySaleId(saleId: string, organizationId: string): Promise<ReceiptResponse | null> {
    const receiptRepo = new ReceiptRepositoryImpl(this._prisma);
    const receipt = await receiptRepo.findBySaleId(saleId, organizationId);
    if (!receipt) return null;
    return this.toResponse(receipt);
  }

  private toResponse(receipt: {
    id: string;
    organizationId: string;
    saleId: string;
    number: string;
    issuedAt: Date;
    createdAt: Date;
  }): ReceiptResponse {
    return {
      id: receipt.id,
      organizationId: receipt.organizationId,
      saleId: receipt.saleId,
      number: receipt.number,
      issuedAt: receipt.issuedAt,
      createdAt: receipt.createdAt,
    };
  }
}
