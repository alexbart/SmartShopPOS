export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    stack?: string;
  };
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function successResponse<T>(data: T): ApiResponse<T> {
  return { success: true, data };
}

export function errorResponse(
  code: string,
  message: string,
  statusCode = 500,
): { statusCode: number; payload: ApiResponse } {
  return {
    statusCode,
    payload: {
      success: false,
      error: { code, message },
    },
  };
}
