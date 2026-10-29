export interface TaxQueryDto {
  page: number;
  limit: number;
  search?: string;
  active?: boolean;
}
