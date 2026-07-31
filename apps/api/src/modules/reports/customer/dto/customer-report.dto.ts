export interface CustomerSummaryDto {
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface CustomerPurchasesDto {
  customerId: string;
  from?: Date;
  to?: Date;
  branchId?: string;
  page?: number;
  limit?: number;
}

export interface TopCustomersDto {
  limit?: number;
}
