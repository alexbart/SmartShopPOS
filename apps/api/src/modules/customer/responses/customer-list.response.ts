import type { PageResponse } from '../../../shared/types/pagination.types.js';
import type { CustomerResponse } from '../responses/customer.response.js';

export type CustomerListResponse = PageResponse<CustomerResponse>;
