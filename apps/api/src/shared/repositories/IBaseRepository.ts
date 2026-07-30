export interface IBaseRepository<T> {
  findById(_id: string): Promise<T | null>;
  findMany(_options?: { where?: Record<string, unknown>; orderBy?: Record<string, unknown>; pagination?: { page: number; pageSize: number } }): Promise<{ data: T[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } }>;
  create(_data: Record<string, unknown>): Promise<T>;
  update(_id: string, _data: Record<string, unknown>): Promise<T>;
  softDelete(_id: string, _deletedBy: string): Promise<T>;
  restore(_id: string): Promise<T>;
  exists(_id: string): Promise<boolean>;
}
