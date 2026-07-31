import type { PageResponse } from '../../../shared/types/pagination.types.js';
import type { SupplierResponse } from '../responses/supplier.response.js';

export type SupplierListResponse = PageResponse<SupplierResponse>;
