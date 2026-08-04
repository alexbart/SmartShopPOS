import { computed } from 'vue';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import { apiClient } from '@/shared/lib/api-client';
import { notification } from '@/stores/notification';
import type { Supplier, Warehouse } from '@/shared/types';

export interface PurchaseOrderItem {
  id: string;
  productId: string;
  productName: string;
  productCode: string;
  quantity: number;
  unitCost: number;
  discount: number;
  tax: number;
  subtotal: number;
  receivedQuantity: number;
  remainingQuantity: number;
}

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplierId: string;
  supplierName: string;
  supplierCode: string;
  warehouseId: string;
  warehouseName: string;
  branchId: string;
  status: string;
  total: number;
  subtotal: number;
  tax: number;
  discount: number;
  receivedQuantity: number;
  totalQuantity: number;
  expectedDeliveryDate?: string;
  notes?: string;
  createdBy: string;
  approvedBy?: string;
  createdAt: string;
  updatedAt: string;
  items: PurchaseOrderItem[];
}

export type PurchaseOrderStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'PARTIALLY_RECEIVED'
  | 'RECEIVED'
  | 'CANCELLED';

export const PurchaseOrderStatusLabels: Record<string, string> = {
  DRAFT: 'Draft',
  PENDING_APPROVAL: 'Pending Approval',
  SUBMITTED: 'Submitted',
  APPROVED: 'Approved',
  PARTIALLY_RECEIVED: 'Partially Received',
  RECEIVED: 'Received',
  CANCELLED: 'Cancelled',
};

export const PurchaseOrderStatusSteps: PurchaseOrderStatus[] = [
  'DRAFT',
  'PENDING_APPROVAL',
  'SUBMITTED',
  'APPROVED',
  'PARTIALLY_RECEIVED',
  'RECEIVED',
];

export const PurchaseOrderStatusColors: Record<string, string> = {
  DRAFT: 'bg-muted/30 text-muted-foreground',
  PENDING_APPROVAL: 'bg-warning/10 text-warning',
  SUBMITTED: 'bg-info/10 text-info',
  APPROVED: 'bg-success/10 text-success',
  PARTIALLY_RECEIVED: 'bg-orange-500/10 text-orange-600',
  RECEIVED: 'bg-blue-500/10 text-blue-600',
  CANCELLED: 'bg-destructive/10 text-destructive',
};

export function usePurchaseOrders(
  params: () => {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
    supplierId?: string;
  },
) {
  const queryClient = useQueryClient();

  const {
    data: poResponse,
    isLoading,
    error: poError,
  } = useQuery({
    queryKey: ['purchase-orders', params],
    queryFn: async () => {
      const p = params();
      const queryParams = new URLSearchParams();
      if (p.page) queryParams.set('page', String(p.page));
      if (p.limit) queryParams.set('limit', String(p.limit));
      if (p.status) queryParams.set('status', p.status);
      if (p.search) queryParams.set('search', p.search);
      if (p.supplierId) queryParams.set('supplierId', p.supplierId);

      const res = await apiClient.get(`/purchase-orders?${queryParams.toString()}`);
      return res.data.data as { items: PurchaseOrder[]; total: number; pages: number };
    },
    staleTime: 30_000,
  });

  const pos = computed(() => poResponse.value?.items ?? []);
  const total = computed(() => poResponse.value?.total ?? 0);

  const createMutation = useMutation({
    mutationFn: (payload: {
      supplierId: string;
      warehouseId: string;
      branchId: string;
      items: Array<{ productId: string; quantity: number; unitCost: number }>;
      expectedDeliveryDate?: string;
      discount?: number;
      tax?: number;
      notes?: string;
    }) =>
      apiClient.post('/purchase-orders', {
        ...payload,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      notification.success('Purchase order created');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: {
      id: string;
      items?: PurchaseOrderItem[];
      expectedDeliveryDate?: string;
      discount?: number;
      tax?: number;
      notes?: string;
    }) => apiClient.patch(`/purchase-orders/${payload.id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      notification.success('Purchase order updated');
    },
  });

  const submitMutation = useMutation({
    mutationFn: (id: string) => apiClient.post(`/purchase-orders/${id}/submit`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      notification.success('Purchase order submitted for approval');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => apiClient.post(`/purchase-orders/${id}/cancel`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      notification.success('Purchase order cancelled');
    },
  });

  const receiveMutation = useMutation({
    mutationFn: (payload: {
      id: string;
      warehouseId: string;
      items: Array<{ productId: string; quantity: number; unitCost: number }>;
      notes?: string;
    }) =>
      apiClient.post(`/purchase-orders/${payload.id}/receive`, {
        warehouseId: payload.warehouseId,
        items: payload.items,
        notes: payload.notes,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      notification.success('Goods received');
    },
  });

  return {
    pos,
    total,
    isLoading,
    error: poError,
    createMutation,
    updateMutation,
    submitMutation,
    cancelMutation,
    receiveMutation,
  };
}

export function usePurchaseOrder(id: string) {
  const queryClient = useQueryClient();

  const {
    data: poData,
    isLoading,
    error: poError,
  } = useQuery({
    queryKey: ['purchase-order', id],
    queryFn: async () => {
      const res = await apiClient.get(`/purchase-orders/${id}`);
      return res.data.data as PurchaseOrder;
    },
    enabled: () => !!id,
    staleTime: 30_000,
  });

  const po = computed(() => poData.value ?? null);

  const receiveMutation = useMutation({
    mutationFn: (payload: {
      warehouseId: string;
      items: Array<{ productId: string; quantity: number; unitCost: number }>;
      notes?: string;
    }) =>
      apiClient.post(`/purchase-orders/${id}/receive`, {
        warehouseId: payload.warehouseId,
        items: payload.items,
        notes: payload.notes,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-order', id] });
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      notification.success('Goods received');
    },
  });

  const submitMutation = useMutation({
    mutationFn: () => apiClient.post(`/purchase-orders/${id}/submit`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-order', id] });
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      notification.success('Purchase order submitted');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => apiClient.post(`/purchase-orders/${id}/cancel`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-order', id] });
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      notification.success('Purchase order cancelled');
    },
  });

  return {
    po,
    isLoading,
    error: poError,
    receiveMutation,
    submitMutation,
    cancelMutation,
  };
}

export function usePurchaseOrderWorkflow() {
  const queryClient = useQueryClient();

  const { data: approvalHistoryData, isLoading: historyLoading } = useQuery({
    queryKey: ['approval-history'],
    queryFn: async () => {
      const res = await apiClient.get('/workflow/history', {
        params: {
          entityType: 'PurchaseOrder',
        },
      });
      return res.data.data as Array<{
        id: string;
        action: string;
        entityType: string;
        entityId: string;
        amount: number | null;
        requestedBy: string;
        status: string;
        approvedBy: string | null;
        approvedAt: string | null;
        comments: string | null;
        createdAt: string;
      }>;
    },
    staleTime: 30_000,
  });

  const { data: pendingApprovalsData, isLoading: pendingLoading } = useQuery({
    queryKey: ['pending-approvals'],
    queryFn: async () => {
      const res = await apiClient.get('/workflow/pending');
      return res.data.data as Array<{
        id: string;
        action: string;
        entityType: string;
        entityId: string;
        amount: number | null;
        status: string;
        requestedBy: string;
        createdAt: string;
      }>;
    },
    staleTime: 30_000,
  });

  const approvalHistory = computed(() => approvalHistoryData.value ?? []);
  const pendingApprovals = computed(() => pendingApprovalsData.value ?? []);

  const approveMutation = useMutation({
    mutationFn: (payload: { id: string; comments?: string }) =>
      apiClient.post(`/workflow/${payload.id}/approve`, { comments: payload.comments }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-approvals'] });
      queryClient.invalidateQueries({ queryKey: ['approval-history'] });
      notification.success('Approval granted');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (payload: { id: string; comments?: string }) =>
      apiClient.post(`/workflow/${payload.id}/reject`, { comments: payload.comments }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-approvals'] });
      queryClient.invalidateQueries({ queryKey: ['approval-history'] });
      notification.success('Request rejected');
    },
  });

  return {
    approvalHistory,
    pendingApprovals,
    historyLoading,
    pendingLoading,
    approveMutation,
    rejectMutation,
  };
}

export function useReorderSuggestions() {
  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products-with-stock'],
    queryFn: async () => {
      const res = await apiClient.get('/products?limit=500');
      return res.data.data.items as Array<
        Supplier & {
          stockQuantity: number;
          lowStockThreshold: number;
          sellingPrice: number;
          costPrice: number;
        }
      >;
    },
    staleTime: 60_000,
  });

  const suggestions = computed(() => {
    if (!productsData.value) return [];
    return productsData.value
      .filter((p) => p.stockQuantity < p.lowStockThreshold)
      .map((p) => ({
        ...p,
        shortfall: p.lowStockThreshold - p.stockQuantity,
        suggestedQuantity: Math.max(p.lowStockThreshold * 2 - p.stockQuantity, p.lowStockThreshold),
      }))
      .sort((a, b) => a.shortfall - b.shortfall);
  });

  return {
    suggestions,
    isLoading,
  };
}
