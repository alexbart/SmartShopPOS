import type { FastifyRequest, FastifyReply } from 'fastify';
import type { ThemeService } from '../service/theme.service.js';
import type { ThemeData } from '../repository/theme.repository.js';

export class ThemeController {
  constructor(private readonly _themeService: ThemeService) {}

  async get(request: FastifyRequest, reply: FastifyReply) {
    const theme = await this._themeService.getTheme(request.requestContext.organizationId);
    return reply.status(200).send({
      success: true,
      message: 'Theme retrieved successfully.',
      data: theme,
    });
  }

  async update(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as ThemeData;
    const theme = await this._themeService.saveTheme(request.requestContext.organizationId, body);
    return reply.status(200).send({
      success: true,
      message: 'Theme updated successfully.',
      data: theme,
    });
  }
}
