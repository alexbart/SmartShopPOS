export interface IRepository<T = unknown> {
  create(
    _model: { organizationId: string; createdBy?: string } & Record<string, unknown>,
  ): Promise<string>;
  update(
    _model: { id: string; organizationId: string; updatedBy?: string } & Record<string, unknown>,
  ): Promise<void>;
  findById(_id: string, _organizationId: string): Promise<T | null>;
  findAll(
    _query: {
      organizationId: string;
      page: number;
      limit: number;
      search?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    } & Record<string, unknown>,
  ): Promise<{ items: T[]; total: number }>;
  softDelete(_id: string, _organizationId: string): Promise<void>;
}
