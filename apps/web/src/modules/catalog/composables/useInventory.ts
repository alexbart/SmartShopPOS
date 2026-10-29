import { apiClient } from '@/shared/lib/api-client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import { notification } from '@/stores/notification';

export interface AdjustStockPayload {
  warehouseId: string;
  productId: string;
  quantity: number;
  type: 'ADJUSTMENT' | 'DAMAGE' | 'EXPIRED';
  remarks: string;
}

export interface StockMovement {
  id: string;
  organizationId: string;
  warehouseId: string;
  productId: string;
  stockId: string;
  type: string;
  quantity: number;
  referenceType?: string;
  referenceId?: string;
  performedBy?: string;
  remarks?: string;
  createdAt: string;
}

export interface StockLevel {
  productId: string;
  quantity: number;
  reservedQuantity: number;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export function useInventory() {
  const queryClient = useQueryClient();

  const adjustStock = useMutation({
    mutationFn: (payload: AdjustStockPayload) => apiClient.post('/inventory/adjust', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product'] });
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      notification.success('Stock adjusted', 'Stock adjustment recorded successfully.');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error?.message || 'Failed to adjust stock';
      notification.error('Adjustment failed', message);
    },
  });

  function getStockLevel(warehouseId: string, productId: string) {
    return useQuery({
      queryKey: ['stock', warehouseId, productId],
      queryFn: async () => {
        const response = await apiClient.get(
          `/inventory/warehouses/${warehouseId}/products/${productId}/stock`,
        );
        return (response.data as ApiResponse<StockLevel>).data;
      },
      enabled: !!warehouseId && !!productId,
    });
  }

  function listStock(warehouseId: string) {
    return useQuery({
      queryKey: ['stock', warehouseId],
      queryFn: async () => {
        const response = await apiClient.get(`/inventory/warehouses/${warehouseId}/stock`);
        return (response.data as ApiResponse<StockLevel[]>).data;
      },
      enabled: !!warehouseId,
    });
  }

  function listMovements(params: {
    organizationId?: string;
    warehouseId?: string;
    productId?: string;
    type?: string;
    page?: number;
    limit?: number;
  }) {
    return useQuery({
      queryKey: ['movements', params],
      queryFn: async () => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            searchParams.append(key, String(value));
          }
        });
        const response = await apiClient.get(`/inventory/movements?${searchParams.toString()}`);
        return (
          response.data as ApiResponse<{
            items: StockMovement[];
            total: number;
            page: number;
            limit: number;
            pages: number;
          }>
        ).data;
      },
    });
  }

  return {
    adjustStock,
    getStockLevel,
    listStock,
    listMovements,
  };
}
