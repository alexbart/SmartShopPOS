export interface BrandQueryDto {
  page: number;
  limit: number;
  search?: string;
  active?: boolean;
}
