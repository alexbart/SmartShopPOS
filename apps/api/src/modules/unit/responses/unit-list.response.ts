import type { PageResponse } from '../../../shared/types/pagination.types.js';
import type { UnitResponse } from '../responses/unit.response.js';

export type UnitListResponse = PageResponse<UnitResponse>;
