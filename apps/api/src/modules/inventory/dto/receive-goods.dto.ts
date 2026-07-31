export interface ReceiveGoodsDto {
  warehouseId: string;
  productId: string;
  quantity: number;
  remarks?: string;
}
