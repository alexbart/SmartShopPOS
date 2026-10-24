import { apiClient } from '@/shared/lib/api-client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import { notification } from '@/stores/notification';

export interface Customer {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  phone?: string;
  email?: string;
  taxPin?: string;
  address?: string;
  loyaltyPoints: number;
  creditLimit?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerQuery {
  organizationId: string;
  page: number;
  limit: number;
  search?: string;
  active?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CustomerListResponse {
  items: Customer[];
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export function useCustomers() {
  const queryClient = useQueryClient();

  const listCustomers = (query: CustomerQuery) =>
    useQuery({
      queryKey: ['customers', query],
      queryFn: async () => {
        const params = new URLSearchParams();
        Object.entries(query).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, String(value));
          }
        });
        const response = await apiClient.get(`/customers?${params.toString()}`);
        return (response.data as ApiResponse<CustomerListResponse>).data;
      },
      staleTime: 30_000,
    });

  const getCustomer = (id: string) =>
    useQuery({
      queryKey: ['customer', id],
      queryFn: async () => {
        const response = await apiClient.get(`/customers/${id}`);
        return (response.data as ApiResponse<Customer>).data;
      },
      enabled: !!id,
    });

  const createCustomer = useMutation({
    mutationFn: (data: Partial<Customer>) => apiClient.post('/customers', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      notification.success('Customer created');
    },
    onError: (error: any) => {
      notification.error(
        'Failed to create customer',
        error.response?.data?.message || 'Unknown error',
      );
    },
  });

  const updateCustomer = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Customer> }) =>
      apiClient.patch(`/customers/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer'] });
      notification.success('Customer updated');
    },
    onError: (error: any) => {
      notification.error(
        'Failed to update customer',
        error.response?.data?.message || 'Unknown error',
      );
    },
  });

  const deleteCustomer = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/customers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      notification.success('Customer deactivated');
    },
    onError: (error: any) => {
      notification.error(
        'Failed to deactivate customer',
        error.response?.data?.message || 'Unknown error',
      );
    },
  });

  return {
    listCustomers,
    getCustomer,
    createCustomer,
    updateCustomer,
    deleteCustomer,
  };
}
