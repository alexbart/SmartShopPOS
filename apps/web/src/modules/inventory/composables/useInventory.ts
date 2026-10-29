import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import { apiClient } from '@/shared/lib/api-client';
import type { Product, Warehouse, Supplier } from '@/shared/types/index';

export interface StockLevel {
  productId: string;
  productName: string;
  productCode: string;
  productSku: string;
  categoryName?: string;
  brandName?: string;
  imageUrl?: string;
  sellingPrice: number;
  costPrice: number;
  quantity: number;
  reservedQuantity: number;
  available: number;
  lowStockThreshold: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
}

export interface StockMovement {
  id: string;
  productId: string;
  warehouseId: string;
  type:
    | 'PURCHASE'
    | 'SALE'
    | 'RETURN'
    | 'TRANSFER_IN'
    | 'TRANSFER_OUT'
    | 'ADJUSTMENT'
    | 'DAMAGE'
    | 'EXPIRED';
  quantity: number;
  referenceType?: string;
  referenceId?: string;
  remarks?: string;
  createdAt: string;
}

export function useWarehouses() {
  return useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const res = await apiClient.get('/warehouses');
      return res.data.data.items as Warehouse[];
    },
    staleTime: 300_000,
  });
}

export function useSuppliers(page = 1, limit = 50) {
  return useQuery({
    queryKey: ['suppliers', page, limit],
    queryFn: async () => {
      const res = await apiClient.get('/suppliers', {
        params: { page: String(page), limit: String(limit) },
      });
      return res.data.data as { items: Supplier[]; total: number; pages: number };
    },
    staleTime: 60_000,
  });
}

export function useStockLevels(warehouseId: () => string | null) {
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['products-list', { limit: 200 }],
    queryFn: async () => {
      const res = await apiClient.get('/products', { params: { limit: '200' } });
      return res.data.data.items as Product[];
    },
    staleTime: 60_000,
  });

  const { data: stockData, isLoading: stockLoading } = useQuery({
    queryKey: ['stock-levels', warehouseId],
    queryFn: async () => {
      const wid = warehouseId();
      if (!wid) return [];
      const res = await apiClient.get(`/inventory/warehouses/${wid}/stock`);
      return res.data.data as Array<{
        productId: string;
        quantity: number;
        reservedQuantity: number;
      }>;
    },
    enabled: () => !!warehouseId(),
    staleTime: 30_000,
  });

  return { productsData, stockData, isLoading: productsLoading || stockLoading };
}

export function useStockMovements(
  params: () => {
    warehouseId?: string;
    productId?: string;
    type?: string;
    page?: number;
    limit?: number;
  },
) {
  return useQuery({
    queryKey: ['stock-movements', params],
    queryFn: async () => {
      const p = params();
      const res = await apiClient.get('/inventory/movements', {
        params: {
          ...(p.warehouseId && { warehouseId: p.warehouseId }),
          ...(p.productId && { productId: p.productId }),
          ...(p.type && { type: p.type }),
          page: String(p.page ?? 1),
          limit: String(p.limit ?? 50),
        },
      });
      return res.data.data as { items: StockMovement[]; total: number };
    },
    staleTime: 30_000,
  });
}

export function useAdjustStock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      warehouseId: string;
      productId: string;
      quantity: number;
      type: 'ADJUSTMENT' | 'DAMAGE' | 'EXPIRED';
      remarks?: string;
    }) => apiClient.post('/inventory/adjust', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-levels'] });
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      queryClient.invalidateQueries({ queryKey: ['products-list'] });
      queryClient.invalidateQueries({ queryKey: ['pos-products'] });
    },
  });
}

export function useTransferStock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      fromWarehouseId: string;
      toWarehouseId: string;
      productId: string;
      quantity: number;
      remarks?: string;
    }) => apiClient.post('/inventory/transfer', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-levels'] });
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
    },
  });
}

export function useReceiveStock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      warehouseId: string;
      productId: string;
      quantity: number;
      remarks?: string;
    }) => apiClient.post('/inventory/receive', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-levels'] });
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      queryClient.invalidateQueries({ queryKey: ['products-list'] });
      queryClient.invalidateQueries({ queryKey: ['pos-products'] });
    },
  });
}

export function useCreateWarehouse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { name: string; code: string; isDefault?: boolean }) =>
      apiClient.post('/warehouses', payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['warehouses'] }),
  });
}

export function useUpdateWarehouse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...payload
    }: {
      id: string;
      name?: string;
      code?: string;
      isDefault?: boolean;
    }) => apiClient.patch(`/warehouses/${id}`, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['warehouses'] }),
  });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      name: string;
      code: string;
      contactPerson?: string;
      email?: string;
      phone?: string;
      taxPin?: string;
      paymentTerms?: string;
    }) => apiClient.post('/suppliers', payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['suppliers'] }),
  });
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...payload
    }: {
      id: string;
      name?: string;
      contactPerson?: string;
      email?: string;
      phone?: string;
      taxPin?: string;
      paymentTerms?: string;
    }) => apiClient.patch(`/suppliers/${id}`, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['suppliers'] }),
  });
}
