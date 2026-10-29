import type { PageResponse } from '../../../shared/types/pagination.types.js';
import type { WarehouseResponse } from '../responses/warehouse.response.js';

export type WarehouseListResponse = PageResponse<WarehouseResponse>;
