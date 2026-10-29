import type { PageResponse } from '../../../shared/types/pagination.types.js';
import type { BrandResponse } from '../responses/brand.response.js';

export type BrandListResponse = PageResponse<BrandResponse>;
