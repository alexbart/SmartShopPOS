import type { PageResponse } from '../../../shared/types/pagination.types.js';
import type { CategoryResponse } from '../responses/category.response.js';

export type CategoryListResponse = PageResponse<CategoryResponse>;
