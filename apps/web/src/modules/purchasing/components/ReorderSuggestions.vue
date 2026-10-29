<script setup lang="ts">
import { ref, computed } from 'vue';
import { AlertTriangle, Package, Plus, TrendingDown } from '@lucide/vue';
import type { PurchaseOrder } from '../composables/usePurchaseOrders';
import { apiClient } from '@/shared/lib/api-client';
import { notification } from '@/stores/notification';
import { useRouter } from 'vue-router';

interface Suggestion {
  id: string;
  name: string;
  code: string;
  stockQuantity: number;
  lowStockThreshold: number;
  shortfall: number;
  suggestedQuantity: number;
  costPrice: number;
  supplierId?: string;
  supplierName?: string;
}

interface Props {
  suggestions: Suggestion[];
  isLoading?: boolean;
  onGeneratePO?: (items: Array<{ productId: string; quantity: number; unitCost: number }>) => void;
}

const props = withDefaults(defineProps<Props>(), {
  suggestions: () => [],
  isLoading: false,
});

const router = useRouter();

async function generateDraftPO(item: Suggestion) {
  if (props.onGeneratePO) {
    props.onGeneratePO([{
      productId: item.id,
      quantity: item.suggestedQuantity,
      unitCost: item.costPrice,
    }]);
  } else {
    try {
      const suppliersRes = await apiClient.get('/suppliers');
      const suppliers = suppliersRes.data.data.items;
      const supplier = suppliers.find((s: any) => s.id === item.supplierId) || suppliers[0];

      const payload = {
        supplierId: supplier?.id,
        warehouseId: '',
        branchId: '',
        items: [{
          productId: item.id,
          quantity: item.suggestedQuantity,
          unitCost: item.costPrice,
        }],
      };

      const res = await apiClient.post('/purchase-orders', payload);
      const poId = res.data.data?.id;

      notification.success('Draft purchase order created');
      if (poId) router.push(`/purchase-orders/${poId}`);
    } catch {
      notification.error('Failed to create purchase order');
    }
  }
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <AlertTriangle class="w-5 h-5 text-warning" />
        <h3 class="text-lg font-medium">Reorder Suggestions</h3>
      </div>
      <span class="text-xs text-muted-foreground" v-if="suggestions.length">
        {{ suggestions.length }} items need restocking
      </span>
    </div>

    <div
      v-if="isLoading"
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"
    >
      <div
        v-for="i in 3"
        :key="i"
        class="border rounded-lg p-3 animate-pulse"
      >
        <div class="h-4 bg-muted rounded w-3/4 mb-2"></div>
        <div class="h-3 bg-muted rounded w-1/2"></div>
      </div>
    </div>

    <div
      v-else-if="suggestions.length === 0"
      class="text-center py-6 text-muted-foreground"
    >
      <Package class="w-8 h-8 mx-auto mb-2 opacity-30" />
      <p>All stock levels are healthy.</p>
    </div>

    <div
      v-else
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"
    >
      <div
        v-for="item in suggestions"
        :key="item.id"
        class="border rounded-lg p-3 space-y-3"
      >
        <div>
          <p class="font-medium">{{ item.name }}</p>
          <p class="text-xs text-muted-foreground">
            Code: {{ item.code }}
          </p>
        </div>

        <div class="flex items-center gap-2">
          <TrendingDown class="w-4 h-4 text-red-500" />
          <span class="text-sm">
            Stock: <strong>{{ item.stockQuantity }}</strong> / Min: <strong>{{ item.lowStockThreshold }}</strong>
          </span>
        </div>

        <div class="w-full bg-muted rounded-full h-2">
          <div
            class="h-2 bg-red-500 rounded-full transition-all"
            :style="{ width: `${Math.min((item.stockQuantity / item.lowStockThreshold) * 100, 100)}%` }"
          ></div>
        </div>

        <div class="text-xs text-muted-foreground">
          Recommended: <strong>{{ item.suggestedQuantity }}</strong> units
        </div>

        <button
          @click="generateDraftPO(item)"
          class="w-full btn btn-outline btn-sm touch-target"
        >
          <Plus class="w-3 h-3 mr-1" />
          Generate Draft PO
        </button>
      </div>
    </div>
  </div>
</template>
