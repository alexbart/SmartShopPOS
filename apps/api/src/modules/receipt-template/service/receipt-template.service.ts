import type { Prisma } from '@prisma/client';
import type {
  IReceiptTemplateRepository,
  ReceiptTemplateRecord,
  UpdateReceiptTemplateData,
} from '../repository/receipt-template.repository.js';
import type {
  CreateReceiptTemplateInput,
  UpdateReceiptTemplateInput,
  ReceiptTemplateResponse,
} from '../dto/receipt-template.dto.js';
import {
  NotFoundError,
  ConflictError,
  ValidationError,
} from '../../../shared/errors/business-error.js';

// JSON columns hold section/style objects; anything else is treated as absent so
// the client always receives a shape it can spread over its defaults.
function asRecord(value: Prisma.JsonValue | null | undefined): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export class ReceiptTemplateService {
  constructor(private readonly _repository: IReceiptTemplateRepository) {}

  async create(
    organizationId: string,
    input: CreateReceiptTemplateInput,
  ): Promise<ReceiptTemplateResponse> {
    const existing = await this._repository.findByName(input.name, organizationId);
    if (existing) {
      throw new ConflictError('A template with this name already exists.');
    }

    // The first template a shop saves becomes its default, otherwise the POS
    // would print with nothing selected.
    const currentDefault = await this._repository.findDefault(organizationId);
    const isDefault = (input.isDefault ?? false) || currentDefault === null;

    const template = await this._repository.create({
      organizationId,
      name: input.name,
      isDefault,
      sections: input.sections ?? {},
      styles: input.styles ?? {},
      headerText: input.headerText ?? null,
      footerText: input.footerText ?? null,
    });

    return this.toResponse({
      ...template,
      deletedAt: null,
    });
  }

  async findById(id: string, organizationId: string): Promise<ReceiptTemplateResponse> {
    const template = await this._repository.findById(id, organizationId);
    if (!template) {
      throw new NotFoundError('Receipt template not found.');
    }
    return this.toResponse(template);
  }

  async findByName(name: string, organizationId: string): Promise<ReceiptTemplateResponse | null> {
    const template = await this._repository.findByName(name, organizationId);
    return template ? this.toResponse(template) : null;
  }

  async findAll(organizationId: string): Promise<ReceiptTemplateResponse[]> {
    const templates = await this._repository.findAll(organizationId);
    return templates.map(this.toResponse);
  }

  async findDefault(organizationId: string): Promise<ReceiptTemplateResponse | null> {
    const template = await this._repository.findDefault(organizationId);
    return template ? this.toResponse(template) : null;
  }

  async update(
    id: string,
    organizationId: string,
    input: UpdateReceiptTemplateInput,
  ): Promise<ReceiptTemplateResponse> {
    const existing = await this._repository.findById(id, organizationId);
    if (!existing) {
      throw new NotFoundError('Receipt template not found.');
    }

    if (input.name && input.name !== existing.name) {
      const duplicate = await this._repository.findByName(input.name, organizationId);
      if (duplicate && duplicate.id !== id) {
        throw new ConflictError('A template with this name already exists.');
      }
    }

    const data: UpdateReceiptTemplateData = {};

    if (input.name !== undefined) data.name = input.name;
    if (input.isDefault !== undefined) data.isDefault = input.isDefault;
    if (input.sections !== undefined) data.sections = input.sections;
    if (input.styles !== undefined) data.styles = input.styles;
    if (input.headerText !== undefined) data.headerText = input.headerText;
    if (input.footerText !== undefined) data.footerText = input.footerText;

    if (Object.keys(data).length === 0) {
      throw new ValidationError('No fields to update.');
    }

    const template = await this._repository.update(id, organizationId, data);
    return this.toResponse(template);
  }

  async setDefault(id: string, organizationId: string): Promise<ReceiptTemplateResponse> {
    await this._repository.setDefault(id, organizationId);
    const template = await this._repository.findById(id, organizationId);
    if (!template) {
      throw new NotFoundError('Receipt template not found.');
    }
    return this.toResponse(template);
  }

  async delete(id: string, organizationId: string): Promise<void> {
    await this._repository.softDelete(id, organizationId);
  }

  private toResponse(template: ReceiptTemplateRecord): ReceiptTemplateResponse {
    return {
      id: template.id,
      organizationId: template.organizationId,
      name: template.name,
      isDefault: template.isDefault,
      sections: asRecord(template.sections),
      styles: asRecord(template.styles),
      headerText: template.headerText ?? undefined,
      footerText: template.footerText ?? undefined,
      createdAt: template.createdAt.toISOString(),
      updatedAt: template.updatedAt.toISOString(),
      deletedAt: template.deletedAt?.toISOString(),
    };
  }
}
