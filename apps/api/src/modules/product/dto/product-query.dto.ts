export interface ProductQueryDto {
  page: number;
  limit: number;
  search?: string;
  active?: boolean;
  categoryId?: string;
  brandId?: string;
}
