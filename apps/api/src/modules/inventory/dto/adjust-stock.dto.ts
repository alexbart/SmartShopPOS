export interface AdjustStockDto {
  warehouseId: string;
  productId: string;
  quantity: number;
  type: 'ADJUSTMENT' | 'DAMAGE' | 'EXPIRED';
  remarks: string;
}
