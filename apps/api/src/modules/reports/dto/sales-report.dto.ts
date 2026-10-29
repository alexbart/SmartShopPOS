export interface SalesReportDto {
  from?: string;
  to?: string;
  branchId?: string;
  cashierId?: string;
  customerId?: string;
  paymentMethod?: string;
  status?: string;
  page?: number;
  limit?: number;
}
