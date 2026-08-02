<script setup lang="ts">
import { computed } from 'vue';
import {
  X,
  Package,
  Tag,
  Barcode,
  Edit,
  Copy,
} from '@lucide/vue';
import type { Product } from '@/shared/types';
import StockBadge from '@/modules/catalog/components/StockBadge.vue';
import PriceTag from '@/modules/catalog/components/PriceTag.vue';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const props = defineProps<{
  product: Product | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'edit', product: Product): void;
  (e: 'duplicate', product: Product): void;
  (e: 'view', product: Product): void;
}>();

const open = computed(() => !!props.product);
</script>

<template>
  <Dialog :open="open" @update:open="$emit('close')">
    <DialogContent class="max-w-4xl p-0 overflow-hidden">
      <div class="flex">
        <div class="w-1/3 bg-muted/30 flex items-center justify-center p-6">
          <div class="flex flex-col items-center">
            <img
              v-if="product?.imageUrl"
              :src="product.imageUrl"
              :alt="product.name"
              class="w-32 h-32 object-cover rounded-lg shadow-lg"
            />
            <div
              v-else
              class="w-32 h-32 rounded-lg bg-muted flex items-center justify-center"
            >
              <Package class="w-12 h-12 text-muted-foreground" />
            </div>
            <StockBadge
              v-if="product"
              :quantity="product.stockQuantity ?? 0"
              :threshold="product.lowStockThreshold"
              size="sm"
              class="mt-3"
            />
          </div>
        </div>

        <div class="w-2/3 p-6 overflow-y-auto max-h-[80vh]">
          <DialogHeader class="text-left">
            <DialogTitle class="text-xl font-bold">
              {{ product?.name }}
            </DialogTitle>
            <DialogDescription class="text-sm text-muted-foreground">
              {{ product?.code || product?.sku || 'No SKU' }}
            </DialogDescription>
          </DialogHeader>

          <Separator class="my-4" />

          <div class="space-y-4" v-if="product">
            <div>
              <h4 class="text-xs font-medium text-muted-foreground uppercase">
                Price
              </h4>
              <PriceTag :amount="product.sellingPrice" size="lg" />
            </div>

            <div class="grid grid-cols-2 gap-4 text-sm">
              <div class="flex items-center gap-2">
                <Barcode class="w-4 h-4 text-muted-foreground" />
                <span class="text-muted-foreground">Barcode:</span>
                <span class="font-mono">{{ product.barcode || '—' }}</span>
              </div>
              <div class="flex items-center gap-2">
                <Tag class="w-4 h-4 text-muted-foreground" />
                <span class="text-muted-foreground">Category:</span>
                <span>{{ product.categoryName || 'Uncategorized' }}</span>
              </div>
              <div class="flex items-center gap-2">
                <Package class="w-4 h-4 text-muted-foreground" />
                <span class="text-muted-foreground">SKU:</span>
                <span class="font-mono">{{ product.sku || '—' }}</span>
              </div>
              <div class="flex items-center gap-2">
                <DollarSign class="w-4 h-4 text-muted-foreground" />
                <span class="text-muted-foreground">Cost:</span>
                <span>KES {{ product.costPrice }}</span>
              </div>
            </div>

            <div
              v-if="product.description"
              class="pt-2"
            >
              <h4 class="text-xs font-medium text-muted-foreground uppercase">
                Description
              </h4>
              <p class="text-sm mt-1">{{ product.description }}</p>
            </div>
          </div>

          <Separator class="my-4" />

          <div class="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              @click="emit('view', product!)"
              class="touch-target"
            >
              <Eye class="w-4 h-4 mr-1" />
              View Detail
            </Button>
            <Button
              variant="outline"
              size="sm"
              @click="emit('edit', product!)"
              class="touch-target"
            >
              <Edit class="w-4 h-4 mr-1" />
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              @click="emit('duplicate', product!)"
              class="touch-target"
            >
              <Copy class="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              @click="$emit('close')"
              class="touch-target"
            >
              <X class="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
