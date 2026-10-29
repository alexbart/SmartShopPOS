export interface CategoryQueryDto {
  page: number;
  limit: number;
  search?: string;
  active?: boolean;
}
