export abstract class BaseService<TRepository extends IRepository> {
  constructor(protected readonly _repository: TRepository) {}

  protected abstract toResponse(_entity: unknown): unknown;

  async create(
    _command: { organizationId: string; createdBy?: string } & Record<string, unknown>,
  ): Promise<unknown> {
    const id = await this._repository.create(_command);
    const entity = await this._repository.findById(id, _command.organizationId);
    if (!entity) {
      throw new Error('Entity not found after creation.') as Error & {
        code: string;
        statusCode: number;
      };
    }
    return this.toResponse(entity);
  }

  async update(
    _command: { id: string; organizationId: string; updatedBy?: string } & Record<string, unknown>,
  ): Promise<unknown> {
    const existing = await this._repository.findById(_command.id, _command.organizationId);
    if (!existing) {
      throw new Error('Entity not found.') as Error & { code: string; statusCode: number };
    }
    await this._repository.update(_command);
    const updated = await this._repository.findById(_command.id, _command.organizationId);
    if (!updated) {
      throw new Error('Entity not found after update.') as Error & {
        code: string;
        statusCode: number;
      };
    }
    return this.toResponse(updated);
  }

  async findById(_id: string, _organizationId: string): Promise<unknown> {
    const entity = await this._repository.findById(_id, _organizationId);
    if (!entity) {
      throw new Error('Entity not found.') as Error & { code: string; statusCode: number };
    }
    return this.toResponse(entity);
  }

  async delete(_id: string, _organizationId: string): Promise<void> {
    const entity = await this._repository.findById(_id, _organizationId);
    if (!entity) {
      throw new Error('Entity not found.') as Error & { code: string; statusCode: number };
    }
    await this._repository.softDelete(_id, _organizationId);
  }
}
