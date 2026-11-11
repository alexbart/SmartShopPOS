import type { FastifyReply, FastifyRequest } from 'fastify';
import type { PrinterService } from '../service/printer.service.js';
import type { RawPrintInput } from '../dto/printer.dto.js';

export class PrinterController {
  constructor(private readonly _service: PrinterService) {}

  async raw(request: FastifyRequest, reply: FastifyReply) {
    const result = await this._service.sendRaw(request.body as RawPrintInput);

    return reply.send({
      success: true,
      message: `Sent ${result.bytes} bytes to ${result.host}:${result.port}.`,
      data: result,
    });
  }
}
