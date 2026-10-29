import type { PageResponse } from '../../../shared/types/pagination.types.js';
import type { ProductResponse } from '../responses/product.response.js';

export type ProductListResponse = PageResponse<ProductResponse>;
