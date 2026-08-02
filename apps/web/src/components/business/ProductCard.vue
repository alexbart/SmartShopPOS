<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { Card, CardContent } from '@/components/ui/card';
import StatusBadge from '@/components/business/StatusBadge.vue';

export interface Product {
  id: string;
  name: string;
  code: string;
  sku: string;
  sellingPrice: number;
  stockQuantity: number;
  lowStockThreshold: number;
  isActive: boolean;
  imageUrl?: string;
  description?: string;
  unitAbbreviation?: string;
  categoryName?: string;
  brandName?: string;
  unitName?: string;
}

const props = defineProps<{
  product: Product;
}>();

const router = useRouter();

const stockStatus = computed(() => {
  const stock = props.product.stockQuantity ?? 0;
  const threshold = props.product.lowStockThreshold ?? 0;
  if (stock === 0) return 'out';
  if (stock <= threshold) return 'low';
  return 'good';
});

const stockColor = computed(() => {
  if (stockStatus.value === 'out') return 'text-destructive';
  if (stockStatus.value === 'low') return 'text-warning';
  return 'text-success';
});

function goToProduct() {
  router.push(`/products/${props.product.id}`);
}
</script>

<template>
  <Card @click="goToProduct" class="cursor-pointer transition-shadow hover:shadow-md">
    <CardContent class="p-4">
      <div class="flex items-start gap-3">
        <div
          v-if="product.imageUrl"
          class="w-16 h-16 rounded-md overflow-hidden flex-shrink-0"
        >
          <img :src="product.imageUrl" :alt="product.name" class="w-full h-full object-cover" />
        </div>
        <div
          v-else
          class="w-16 h-16 rounded-md bg-muted flex-shrink-0 flex items-center justify-center"
        >
          <span class="text-xs font-bold text-muted-foreground">
            {{ product.name?.substring(0, 2).toUpperCase() }}
          </span>
        </div>

        <div class="flex-1 min-w-0">
          <div class="flex items-start justify-between gap-2">
            <div>
              <p class="font-medium text-sm">{{ product.name }}</p>
              <p class="text-xs text-muted-foreground font-mono">
                SKU: {{ product.sku }}
              </p>
              <p v-if="product.description" class="text-xs text-muted-foreground mt-0.5">
                {{ product.description.substring(0, 50) }}
              </p>
            </div>
            <StatusBadge :status="product.isActive ? 'active' : 'inactive'" :text="product.isActive ? 'Active' : 'Inactive'" />
          </div>

          <div class="mt-2 flex items-center justify-between">
            <p class="text-sm font-medium font-mono">
              {{ product.sellingPrice?.toLocaleString('en-KE', { style: 'currency', currency: 'KES' }) }}
            </p>
            <p class="text-sm" :class="stockColor">
              {{ product.stockQuantity ?? 0 }} {{ product.unitAbbreviation ?? '' }}
              <span v-if="stockStatus === 'low'" class="text-xs"> ⚠</span>
            </p>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
