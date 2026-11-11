import type { FastifyRequest, FastifyReply } from 'fastify';
import type { ReceiptTemplateService } from '../service/receipt-template.service.js';
import type {
  CreateReceiptTemplateInput,
  UpdateReceiptTemplateInput,
} from '../dto/receipt-template.dto.js';

export class ReceiptTemplateController {
  constructor(private readonly _service: ReceiptTemplateService) {}

  async create(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as CreateReceiptTemplateInput;

    const template = await this._service.create(request.requestContext.organizationId, body);

    return reply.status(201).send({
      success: true,
      message: 'Receipt template created successfully.',
      data: template,
    });
  }

  async findAll(request: FastifyRequest, reply: FastifyReply) {
    const templates = await this._service.findAll(request.requestContext.organizationId);

    return reply.send({
      success: true,
      message: 'Receipt templates retrieved successfully.',
      data: templates,
    });
  }

  async findDefault(request: FastifyRequest, reply: FastifyReply) {
    const template = await this._service.findDefault(request.requestContext.organizationId);

    // "No template configured yet" is a normal state, not an error: the POS
    // falls back to built-in layout defaults.
    return reply.send({
      success: true,
      message: template
        ? 'Default template retrieved successfully.'
        : 'No default template configured.',
      data: template,
    });
  }

  async findById(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };

    const template = await this._service.findById(id, request.requestContext.organizationId);

    return reply.send({
      success: true,
      message: 'Receipt template retrieved successfully.',
      data: template,
    });
  }

  async update(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const body = request.body as UpdateReceiptTemplateInput;

    const template = await this._service.update(id, request.requestContext.organizationId, body);

    return reply.send({
      success: true,
      message: 'Receipt template updated successfully.',
      data: template,
    });
  }

  async setDefault(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };

    const template = await this._service.setDefault(id, request.requestContext.organizationId);

    return reply.send({
      success: true,
      message: 'Default template set successfully.',
      data: template,
    });
  }

  async delete(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };

    await this._service.delete(id, request.requestContext.organizationId);

    return reply.send({
      success: true,
      message: 'Receipt template deleted successfully.',
      data: null,
    });
  }
}
