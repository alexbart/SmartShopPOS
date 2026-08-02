<script setup lang="ts">
import type { Product } from '@/shared/types';
import ProductAvatar from '@/modules/catalog/components/ProductAvatar.vue';
import { computed } from 'vue';
import { Pin, PinOff } from '@lucide/vue';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const props = withDefaults(
  defineProps<{
    products: Product[];
    pinnedIds?: string[];
  }>(),
  { pinnedIds: () => [] },
);

const emit = defineEmits<{
  (e: 'select', product: Product): void;
  (e: 'pin', productId: string): void;
}>();

const pinned = computed(() =>
  props.pinnedIds.map((id) => props.products.find((p) => p.id === id)).filter(Boolean),
);
</script>

<template>
  <Card class="mb-4">
    <CardContent class="pt-4">
      <div class="flex items-center gap-2 mb-3">
        <Pin class="w-4 h-4 text-muted-foreground" />
        <h3 class="text-sm font-medium text-muted-foreground uppercase">Quick Sale</h3>
      </div>

      <div
        v-if="pinned.length === 0"
        class="text-center py-6 text-muted-foreground"
      >
        <PinOff class="w-8 h-8 mx-auto mb-2 opacity-30" />
        <p class="text-sm">No pinned products</p>
        <p class="text-xs mt-1">Pin products from the grid for quick access</p>
      </div>

      <div
        v-else
        class="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2"
      >
        <TooltipProvider>
          <Tooltip v-for="product in pinned" :key="product!.id">
            <TooltipTrigger as-child>
              <button
                @click="$emit('select', product!)"
                class="flex flex-col items-center p-2 rounded-lg border border-border bg-card hover:shadow-md hover:border-primary transition-all touch-target"
              >
                <div class="relative mb-1">
                  <ProductAvatar
                    :src="product!.imageUrl"
                    :alt="product!.name"
                    size="sm"
                  />
                </div>
                <p class="text-xs font-medium text-center truncate w-full">
                  {{ product!.name }}
                </p>
                <p class="text-xs text-muted-foreground">
                  KES {{ product!.sellingPrice.toLocaleString() }}
                </p>
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" class="text-xs">
              {{ product!.name }} — KES {{ product!.sellingPrice }}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </CardContent>
  </Card>
</template>
