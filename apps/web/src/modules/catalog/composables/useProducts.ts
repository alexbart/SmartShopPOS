import { ref, computed } from 'vue';
import { useQuery, useQueryClient, useMutation } from '@tanstack/vue-query';
import { apiClient } from '@/shared/lib/api-client';
import { notification } from '@/stores/notification';
import type { Product } from '@/shared/types';

export interface ProductFilters {
  search: string;
  categoryId: string | null;
  brandId: string | null;
  status: string | null;
  warehouseId: string | null;
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  pages: number;
}

export function useProducts() {
  const queryClient = useQueryClient();

  const search = ref('');
  const page = ref(1);
  const categoryFilter = ref<string | null>(null);
  const brandFilter = ref<string | null>(null);
  const statusFilter = ref<string | null>(null);
  const warehouseFilter = ref<string | null>(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [
      'products',
      {
        search,
        category: categoryFilter,
        brand: brandFilter,
        status: statusFilter,
        warehouse: warehouseFilter,
        page,
      },
    ],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (search.value) params.search = search.value;
      if (categoryFilter.value) params.categoryId = categoryFilter.value;
      if (brandFilter.value) params.brandId = brandFilter.value;
      if (statusFilter.value) params.isActive = statusFilter.value;
      if (warehouseFilter.value) params.warehouseId = warehouseFilter.value;
      params.page = String(page.value);
      params.limit = '20';
      const res = await apiClient.get('/products', { params });
      return res.data.data as PaginatedResponse<Product>;
    },
  });

  const products = computed(() => data.value?.items ?? []);
  const total = computed(() => data.value?.total ?? 0);
  const totalPages = computed(() => data.value?.pages ?? 1);

  function setSearch(q: string) {
    search.value = q;
    page.value = 1;
  }

  function setCategory(id: string | null) {
    categoryFilter.value = id;
    page.value = 1;
  }

  function setBrand(id: string | null) {
    brandFilter.value = id;
    page.value = 1;
  }

  function setStatus(status: string | null) {
    statusFilter.value = status;
    page.value = 1;
  }

  function setWarehouse(id: string | null) {
    warehouseFilter.value = id;
    page.value = 1;
  }

  function setPage(p: number) {
    page.value = p;
  }

  function clearFilters() {
    search.value = '';
    categoryFilter.value = null;
    brandFilter.value = null;
    statusFilter.value = null;
    warehouseFilter.value = null;
    page.value = 1;
  }

  const createProduct = useMutation({
    mutationFn: (payload: any) => apiClient.post('/products', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: () => {
      notification.error('Failed to save product');
    },
  });

  const updateProduct = useMutation({
    mutationFn: ({ id, ...payload }: { id: string; [key: string]: any }) =>
      apiClient.put(`/products/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: () => {
      notification.error('Failed to update product');
    },
  });

  const deleteProduct = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: () => {
      notification.error('Failed to delete product');
    },
  });

  return {
    products,
    total,
    totalPages,
    isLoading,
    isError,
    error,
    refetch,
    search,
    page,
    categoryFilter,
    brandFilter,
    statusFilter,
    warehouseFilter,
    setSearch,
    setCategory,
    setBrand,
    setStatus,
    setWarehouse,
    setPage,
    clearFilters,
    createProduct,
    updateProduct,
    deleteProduct,
  };
}
