export interface PageRequest {
  page: number;
  limit: number;
  search?: string;
  sortBy?: string;
  sortOrder: 'asc' | 'desc';
}

export interface PageResponse<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  pages: number;
}
