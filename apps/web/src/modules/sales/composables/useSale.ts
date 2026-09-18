import { ref } from 'vue';
import { apiClient } from '@/shared/lib/api-client';
import { notification } from '@/stores/notification';
import { useQueryClient } from '@tanstack/vue-query';
import type { PosSale, ProcessSaleResult } from './types';

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

  async function processSale(sale: PosSale): Promise<ProcessSaleResult | null> {
    if (sale.cartItems.length === 0) return null;

    const warehouseId = await getDefaultWarehouseId();
    if (!warehouseId) {
      notification.error('No warehouse', 'Please set up a warehouse before making sales.');
      return null;
    }

    isProcessing.value = true;
    try {
      // Step 1: Create the sale — only fields the backend accepts
      const saleResponse = await apiClient.post('/sales', {
        warehouseId,
        customerId: sale.customerId,
        items: sale.cartItems.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          price: item.price,
          discount: item.discount,
        })),
        tax: sale.tax,
        discount: sale.discount,
      });

      if (!saleResponse.data.success) {
        notification.error('Sale failed', 'The sale could not be created.');
        return { success: false, paymentSuccess: false };
      }

      const createdSale = saleResponse.data.data;
      const saleId: string = createdSale.id;
      const saleNumber: string = createdSale.number ?? '';

      lastSale.value = sale;
      queryClient.invalidateQueries({ queryKey: ['products-list'] });
      queryClient.invalidateQueries({ queryKey: ['pos-products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['recent-sales-pos'] });

      // Step 2: Record payment(s) — separate from the sale transaction
      try {
        if (sale.paymentMethod === 'SPLIT' && sale.splitPayments?.length) {
          // Sequential — deterministic error handling if one leg fails
          for (const payment of sale.splitPayments) {
            if (payment.amount <= 0) continue;
            await apiClient.post('/payments', {
              saleId,
              method: payment.method,
              amount: payment.amount,
              reference: payment.reference,
            });
          }
        } else {
          await apiClient.post('/payments', {
            saleId,
            method: sale.paymentMethod,
            amount: sale.total,
            reference: sale.reference,
          });
        }

        notification.success('Sale completed!', `Receipt #${saleNumber}`);
        return { success: true, saleId, saleNumber, paymentSuccess: true };
      } catch (paymentError) {
        // Sale succeeded but payment recording failed — do NOT retry the sale
        const msg = 'Sale created, but payment could not be recorded. Do not retry — check payment status.';
        notification.error('Payment recording failed', msg);
        return {
          success: true,
          saleId,
          saleNumber,
          paymentSuccess: false,
          paymentError: msg,
        };
      }
    } catch {
      notification.error('Sale failed', 'Please check your network and try again.');
      return { success: false, paymentSuccess: false };
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
