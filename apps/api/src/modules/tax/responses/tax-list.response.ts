import type { PageResponse } from '../../../shared/types/pagination.types.js';
import type { TaxResponse } from '../responses/tax.response.js';

export type TaxListResponse = PageResponse<TaxResponse>;
