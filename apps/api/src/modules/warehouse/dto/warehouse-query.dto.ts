export interface WarehouseQueryDto {
  page: number;
  limit: number;
  search?: string;
  active?: boolean;
  branchId?: string;
}
