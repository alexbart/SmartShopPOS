<script setup lang="ts">
import type { PaymentMethod } from '@/modules/sales/composables/types';
import {
  Banknote,
  CreditCard,
  Smartphone,
  Landmark,
  Split,
} from '@lucide/vue';
import { Card, CardContent } from '@/components/ui/card';

const props = defineProps<{
  total: number;
  selectedMethod: PaymentMethod;
}>();

const emit = defineEmits<{
  (e: 'select', method: PaymentMethod): void;
}>();

const methods = [
  { value: 'CASH', label: 'Cash', icon: Banknote, color: 'text-green-600' },
  { value: 'CARD', label: 'Card', icon: CreditCard, color: 'text-blue-600' },
  { value: 'MPESA', label: 'M-Pesa', icon: Smartphone, color: 'text-emerald-600' },
  { value: 'BANK', label: 'Bank', icon: Landmark, color: 'text-purple-600' },
  { value: 'SPLIT', label: 'Split', icon: Split, color: 'text-amber-600' },
];
</script>

<template>
  <Card>
    <CardContent class="pt-4">
      <h3 class="text-sm font-medium text-muted-foreground uppercase mb-3">
        Payment Method
      </h3>
      <div class="grid grid-cols-5 gap-2">
        <button
          v-for="m in methods"
          :key="m.value"
          @click="emit('select', m.value as PaymentMethod)"
            :class="[
              'flex flex-col items-center gap-1 p-3 rounded-lg border text-sm transition-all touch-target',
              selectedMethod === (m.value as PaymentMethod)
                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                : 'border-border hover:bg-muted/50',
            ]"
        >
          <component :is="m.icon" class="w-6 h-6" :class="m.color" />
          <span class="font-medium">{{ m.label }}</span>
        </button>
      </div>
    </CardContent>
  </Card>
</template>
