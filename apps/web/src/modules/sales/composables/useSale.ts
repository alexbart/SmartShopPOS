import { ref } from 'vue';
import { apiClient } from '@/shared/lib/api-client';
import { notification } from '@/stores/notification';
import { useQueryClient } from '@tanstack/vue-query';
import type { PosSale } from './types';

let cachedWarehouseId: string | null = null;

async function getDefaultWarehouseId(): Promise<string | null> {
  if (cachedWarehouseId) return cachedWarehouseId;
  try {
    const res = await apiClient.get('/warehouses');
    const warehouses: Array<{ id: string; isDefault: boolean }> = res.data.data.items ?? [];
    const def = warehouses.find((w) => w.isDefault) ?? warehouses[0];
    cachedWarehouseId = def?.id ?? null;
    return cachedWarehouseId;
  } catch {
    return null;
  }
}

export function useSale() {
  const queryClient = useQueryClient();
  const isProcessing = ref(false);
  const lastSale = ref<PosSale | null>(null);

  async function processSale(sale: PosSale) {
    if (sale.cartItems.length === 0) return null;

    const warehouseId = await getDefaultWarehouseId();
    if (!warehouseId) {
      notification.error('No warehouse', 'Please set up a warehouse before making sales.');
      return null;
    }

    isProcessing.value = true;
    try {
      const response = await apiClient.post('/sales', {
        warehouseId,
        items: sale.cartItems.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          price: item.price,
          discount: item.discount,
          note: item.note,
        })),
        customerId: sale.customerId,
        paymentMethod: sale.paymentMethod,
        subtotal: sale.subtotal,
        tax: sale.tax,
        discount: sale.discount,
        total: sale.total,
        tenderedAmount: sale.tenderedAmount,
        change: sale.change,
        splitPayments: sale.splitPayments,
      });

      if (response.data.success) {
        lastSale.value = sale;
        queryClient.invalidateQueries({ queryKey: ['products-list'] });
        queryClient.invalidateQueries({ queryKey: ['pos-products'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        notification.success('Sale completed!', `Receipt #${response.data.data?.number ?? ''}`);
      }
      return response.data;
    } catch {
      notification.error('Sale failed', 'Please check your network and try again.');
      return null;
    } finally {
      isProcessing.value = false;
    }
  }

  async function suspendSale(sale: PosSale) {
    if (sale.cartItems.length === 0) {
      notification.warning('Empty cart', 'Nothing to suspend.');
      return;
    }
    const suspended: PosSale = { ...sale, timestamp: new Date().toISOString() };
    const saved = localStorage.getItem('pos-suspended-sales');
    const suspendedSales: PosSale[] = saved ? JSON.parse(saved) : [];
    suspendedSales.push(suspended);
    localStorage.setItem('pos-suspended-sales', JSON.stringify(suspendedSales));
    notification.info('Sale suspended', 'Resume later from the suspended sales list.');
  }

  function getSuspendedSales(): PosSale[] {
    const saved = localStorage.getItem('pos-suspended-sales');
    return saved ? JSON.parse(saved) : [];
  }

  function resumeSale(id: string): PosSale | null {
    const sales = getSuspendedSales();
    const sale = sales.find((s) => s.timestamp === id);
    if (!sale) return null;
    const remaining = sales.filter((s) => s.timestamp !== id);
    localStorage.setItem('pos-suspended-sales', JSON.stringify(remaining));
    return sale;
  }

  return {
    isProcessing,
    lastSale,
    processSale,
    suspendSale,
    getSuspendedSales,
    resumeSale,
  };
}
