<script setup lang="ts">
import { computed } from 'vue';
import type { PosCartItem } from '@/modules/sales/composables/types';
import CartItemRow from '@/modules/sales/components/CartItem.vue';
import { ShoppingCart } from '@lucide/vue';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const props = defineProps<{
  items: PosCartItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  itemCount: number;
  taxes: Array<{ id: string; name: string; code: string; rate: number }>;
  selectedTaxId: string | null;
}>();

const emit = defineEmits<{
  (e: 'update-qty', id: string, qty: number): void;
  (e: 'remove', id: string): void;
  (e: 'discount', id: string, amount: number): void;
  (e: 'note', id: string, note: string): void;
  (e: 'clear'): void;
  (e: 'set-tax', taxId: string | null): void;
}>();
</script>

<template>
  <Card class="flex flex-col flex-1 overflow-hidden">
    <CardContent class="pt-4 flex flex-col flex-1 overflow-hidden">
      <h2 class="font-bold text-lg mb-3 flex items-center gap-2">
        <ShoppingCart class="w-5 h-5" />
        Current Sale
        <span v-if="itemCount > 0" class="text-xs text-muted-foreground/70 font-normal">
          ({{ itemCount }} {{ itemCount === 1 ? 'item' : 'items' }})
        </span>
      </h2>

      <div
        v-if="items.length === 0"
        class="flex flex-col items-center justify-center py-12 text-muted-foreground/50"
      >
        <ShoppingCart class="w-12 h-12 mb-3 opacity-30" />
        <p class="text-sm">Cart is empty</p>
        <p class="text-xs mt-1">Scan a product or search to add items</p>
      </div>

      <div v-else class="space-y-1 overflow-y-auto flex-1">
        <CartItemRow
          v-for="item in items"
          :key="item.id"
          :item="item"
          @update-qty="(id, q) => emit('update-qty', id, q)"
          @remove="(id) => emit('remove', id)"
          @discount="(id, a) => emit('discount', id, a)"
          @note="(id, n) => emit('note', id, n)"
        />
      </div>
    </CardContent>

    <CardFooter class="flex flex-col gap-2 pt-0 pb-3">
      <div class="w-full space-y-1.5">
        <div class="flex justify-between text-sm">
          <span class="text-muted-foreground">Subtotal</span>
          <span class="font-medium">KES {{ subtotal.toLocaleString() }}</span>
        </div>

        <!-- Tax selector row -->
        <div class="flex items-center justify-between gap-2">
          <select
            :value="selectedTaxId ?? ''"
            @change="emit('set-tax', ($event.target as HTMLSelectElement).value || null)"
            class="h-7 px-2 rounded-md border border-input bg-background text-xs focus:outline-none focus:ring-1 focus:ring-ring flex-1 max-w-[160px]"
          >
            <option value="">No Tax</option>
            <option v-for="t in taxes" :key="t.id" :value="t.id">
              {{ t.name }} ({{ t.rate }}%)
            </option>
          </select>
          <span class="text-sm font-medium">
            KES {{ tax.toLocaleString() }}
          </span>
        </div>

        <div v-if="discount > 0" class="flex justify-between text-sm text-green-600">
          <span>Discount</span>
          <span>-KES {{ discount.toLocaleString() }}</span>
        </div>

        <Separator />

        <div class="flex justify-between items-center">
          <span class="text-sm text-muted-foreground font-medium">TOTAL</span>
          <span class="text-2xl font-bold text-primary">
            KES {{ total.toLocaleString() }}
          </span>
        </div>
      </div>

      <div class="flex gap-2 w-full">
        <Button
          v-if="items.length > 0"
          variant="outline"
          size="sm"
          class="flex-1"
          @click="$emit('clear')"
        >
          Clear Cart
        </Button>
      </div>
    </CardFooter>
  </Card>
</template>
