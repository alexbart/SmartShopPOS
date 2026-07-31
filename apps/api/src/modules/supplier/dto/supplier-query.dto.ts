export interface SupplierQueryDto {
  page: number;
  limit: number;
  search?: string;
  active?: boolean;
}
