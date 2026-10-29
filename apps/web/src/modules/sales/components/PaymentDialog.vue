<script setup lang="ts">
import { ref, computed } from 'vue';
import type { PaymentMethod, SplitPayment } from '@/modules/sales/composables/types';
import {
  CreditCard,
  Banknote,
  Smartphone,
  Landmark,
  Plus,
} from '@lucide/vue';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const props = defineProps<{
  open: boolean;
  total: number;
  cashTenderedDefault?: number;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'pay', payload: { method: PaymentMethod; tendered?: number; change?: number; split?: SplitPayment[] }): void;
}>();

const selectedMethod = ref<PaymentMethod>('CASH');
const tendered = ref(0);
const splitCash = ref(0);
const splitCard = ref(0);
const splitMpesa = ref(0);

const change = computed(() => Math.max(0, tendered.value - props.total));

const paymentMethods = [
  { value: 'CASH', label: 'Cash', icon: Banknote },
  { value: 'CARD', label: 'Card', icon: CreditCard },
  { value: 'MPESA', label: 'M-Pesa', icon: Smartphone },
  { value: 'BANK', label: 'Bank Transfer', icon: Landmark },
  { value: 'SPLIT', label: 'Split', icon: Plus },
];

function handlePay() {
  if (selectedMethod.value === 'CASH') {
    if (tendered.value < props.total) {
      return;
    }
    emit('pay', {
      method: 'CASH',
      tendered: tendered.value,
      change: change.value,
    });
  } else if (selectedMethod.value === 'SPLIT') {
    const totalSplit = splitCash.value + splitCard.value + splitMpesa.value;
    if (totalSplit < props.total) {
      return;
    }
    emit('pay', {
      method: 'SPLIT',
      split: [
        { method: 'CASH', amount: splitCash.value },
        { method: 'CARD', amount: splitCard.value },
        { method: 'MPESA', amount: splitMpesa.value },
      ],
    });
  } else {
    emit('pay', { method: selectedMethod.value });
  }
}

function resetAndClose() {
  selectedMethod.value = 'CASH';
  tendered.value = 0;
  splitCash.value = 0;
  splitCard.value = 0;
  splitMpesa.value = 0;
  emit('close');
}
</script>

<template>
  <Dialog :open="open" @update:open="resetAndClose">
    <DialogContent class="max-w-md">
      <DialogHeader>
        <DialogTitle>Complete Payment</DialogTitle>
        <DialogDescription>
          Total amount: <strong>KES {{ total.toLocaleString() }}</strong>
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4">
        <div class="grid grid-cols-5 gap-2">
          <button
            v-for="m in paymentMethods"
            :key="m.value"
            @click="selectedMethod = m.value as PaymentMethod"
            :class="[
              'flex flex-col items-center gap-1 p-3 rounded-lg border text-sm transition-all touch-target',
              selectedMethod === m.value
                ? 'border-primary bg-primary/5'
                : 'border-border hover:bg-muted/50',
            ]"
          >
            <component :is="m.icon" class="w-5 h-5" />
            {{ m.label }}
          </button>
        </div>

        <Card v-if="selectedMethod === 'CASH'">
          <CardContent class="pt-4 space-y-3">
            <div>
              <label class="text-xs text-muted-foreground">Tendered Amount</label>
              <Input
                v-model.number="tendered"
                type="number"
                :placeholder="total.toString()"
                class="text-2xl font-bold text-center h-12"
                :min="total"
              />
            </div>
            <div class="flex justify-between items-center">
              <span class="text-muted-foreground">Change</span>
              <span
                class="text-2xl font-bold text-green-600"
              >
                KES {{ change.toLocaleString() }}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card v-else-if="selectedMethod === 'SPLIT'">
          <CardContent class="pt-4 space-y-3">
            <div>
              <label class="text-xs text-muted-foreground">Cash</label>
              <Input
                v-model.number="splitCash"
                type="number"
                placeholder="0"
                class="text-lg text-center h-10"
              />
            </div>
            <div>
              <label class="text-xs text-muted-foreground">Card</label>
              <Input
                v-model.number="splitCard"
                type="number"
                placeholder="0"
                class="text-lg text-center h-10"
              />
            </div>
            <div>
              <label class="text-xs text-muted-foreground">M-Pesa</label>
              <Input
                v-model.number="splitMpesa"
                type="number"
                placeholder="0"
                class="text-lg text-center h-10"
              />
            </div>
            <div class="flex justify-between text-sm pt-2">
              <span class="text-muted-foreground">
                Total entered:
              </span>
              <span class="font-medium">
                KES {{ (splitCash + splitCard + splitMpesa).toLocaleString() }}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card v-else>
          <CardContent class="pt-4">
            <p class="text-sm text-center text-muted-foreground py-4">
              Tap or insert card to process {{ selectedMethod }} payment.
            </p>
          </CardContent>
        </Card>
      </div>

      <Separator />

      <div class="flex justify-end gap-2">
        <Button variant="ghost" size="sm" @click="resetAndClose">
          Cancel
        </Button>
        <Button
          size="sm"
          :disabled="selectedMethod === 'CASH' && tendered < total"
          @click="handlePay"
          class="touch-target"
        >
          Confirm Payment
        </Button>
      </div>
    </DialogContent>
  </Dialog>
</template>
