<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { PaymentMethod, SplitPayment } from '@/modules/sales/composables/types';
import {
  Banknote,
  CreditCard,
  Smartphone,
  Landmark,
  Plus,
  X,
  Check,
} from '@lucide/vue';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

const props = withDefaults(
  defineProps<{
    total: number;
    open?: boolean;
  }>(),
  { open: false },
);

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'pay', payload: { method: PaymentMethod; tendered?: number; change?: number; split?: SplitPayment[] }): void;
}>();

const selectedMethod = ref<PaymentMethod>('CASH');
const tendered = ref(0);
const splitCash = ref(0);
const splitCard = ref(0);
const splitMpesa = ref(0);
const showSplit = ref(false);
const mpesaPhone = ref('');
const mpesaStatus = ref<'idle' | 'processing' | 'confirmed'>('idle');

const change = computed(() => Math.max(0, (tendered.value || 0) - props.total));
const splitTotal = computed(() => splitCash.value + splitCard.value + splitMpesa.value);

const paymentMethods = [
  { value: 'CASH', label: 'Cash', icon: Banknote, desc: 'Cash payment' },
  { value: 'CARD', label: 'Card', icon: CreditCard, desc: 'Card terminal' },
  { value: 'MPESA', label: 'M-Pesa', icon: Smartphone, desc: 'Mobile money' },
  { value: 'BANK', label: 'Bank', icon: Landmark, desc: 'Bank transfer' },
  { value: 'SPLIT', label: 'Split', icon: Plus, desc: 'Multiple methods' },
];

const visibleMethods = computed(() => {
  if (selectedMethod.value === 'SPLIT') {
    return paymentMethods.filter((m) => m.value !== 'SPLIT');
  }
  return paymentMethods;
});

function selectMethod(method: PaymentMethod) {
  selectedMethod.value = method;
  if (method === 'SPLIT') showSplit.value = true;
  else showSplit.value = false;
  tendered.value = 0;
  splitCash.value = 0;
  splitCard.value = 0;
  splitMpesa.value = 0;
  mpesaStatus.value = 'idle';
}

function handlePay() {
  if (selectedMethod.value === 'CASH') {
    if (tendered.value < props.total) return;
    emit('pay', {
      method: 'CASH',
      tendered: tendered.value,
      change: change.value,
    });
  } else if (selectedMethod.value === 'SPLIT') {
    if (splitTotal.value < props.total) return;
    emit('pay', {
      method: 'SPLIT',
      split: [
        { method: 'CASH', amount: splitCash.value },
        { method: 'CARD', amount: splitCard.value },
        { method: 'MPESA', amount: splitMpesa.value },
      ],
    });
  } else if (selectedMethod.value === 'MPESA') {
    if (!mpesaPhone.value) return;
    emit('pay', { method: 'MPESA', tendered: mpesaPhone.value as any });
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
  showSplit.value = false;
  mpesaPhone.value = '';
  mpesaStatus.value = 'idle';
  emit('close');
}

function handleMpesaPay() {
  mpesaStatus.value = 'processing';
  setTimeout(() => {
    mpesaStatus.value = 'confirmed';
    emit('pay', { method: 'MPESA', tendered: mpesaPhone.value as any });
  }, 2000);
}

watch(
  () => props.total,
  () => {
    if (tendered.value < props.total) {
      tendered.value = props.total;
    }
  },
);
</script>

<template>
  <transition name="slide-up">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      @click.self="resetAndClose"
    >
      <div
        class="bg-popover border border-border rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden"
        @click.stop
      >
        <div class="flex items-center justify-between p-4 border-b">
          <h3 class="text-lg font-semibold">Complete Payment</h3>
          <button
            @click="resetAndClose"
            class="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <div class="p-4 space-y-4 overflow-y-auto flex-1">
          <div class="text-center py-2">
            <p class="text-sm text-muted-foreground uppercase">Total Amount</p>
            <p class="text-4xl font-bold text-primary mt-1">
              KES {{ total.toLocaleString() }}
            </p>
          </div>

          <div v-if="!showSplit" class="grid grid-cols-5 gap-2">
            <button
              v-for="m in visibleMethods"
              :key="m.value"
              @click="selectMethod(m.value as PaymentMethod)"
              :class="[
                'flex flex-col items-center gap-1 p-3 rounded-lg border text-sm transition-all touch-target',
                selectedMethod === m.value
                  ? 'border-primary bg-primary/10 ring-1 ring-primary'
                  : 'border-border hover:bg-muted/50',
              ]"
            >
              <component :is="m.icon" class="w-6 h-6" />
              <span class="font-medium">{{ m.label }}</span>
            </button>
          </div>

          <div v-if="showSplit" class="grid grid-cols-3 gap-2 mb-4">
            <button
              v-for="m in visibleMethods"
              :key="m.value"
              @click="selectMethod(m.value as PaymentMethod)"
              :class="[
                'flex flex-col items-center gap-1 p-2 rounded-lg border text-xs transition-all touch-target',
                selectedMethod === m.value
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:bg-muted/50',
              ]"
            >
              <component :is="m.icon" class="w-5 h-5" />
              <span>{{ m.label }}</span>
            </button>
            <button
              @click="showSplit = false; selectedMethod = 'CASH'"
              class="flex items-center justify-center p-2 rounded-lg border border-border text-xs touch-target"
            >
              <X class="w-4 h-4" />
            </button>
          </div>

          <Card v-if="selectedMethod === 'CASH'" class="border-dashed">
            <CardContent class="pt-4 space-y-3">
              <div>
                <label class="block text-xs text-muted-foreground mb-1">Tendered Amount</label>
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
                <span class="text-3xl font-bold text-green-600">
                  KES {{ change.toLocaleString() }}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card v-else-if="selectedMethod === 'MPESA'" class="border-dashed">
            <CardContent class="pt-4 space-y-4">
              <div v-if="mpesaStatus === 'idle'">
                <label class="block text-xs text-muted-foreground mb-1">Phone Number</label>
                <Input
                  v-model="mpesaPhone"
                  type="tel"
                  placeholder="07XXXXXXXX"
                  class="text-center h-12"
                />
                <Button
                  class="w-full mt-3"
                  :disabled="!mpesaPhone || !mpesaPhone.startsWith('07')"
                  @click="handleMpesaPay"
                >
                  Send STK Push
                </Button>
              </div>
              <div v-else-if="mpesaStatus === 'processing'" class="text-center py-6">
                <div class="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-3"></div>
                <p class="text-lg font-medium">Waiting for customer...</p>
                <p class="text-sm text-muted-foreground">STK push sent to {{ mpesaPhone }}</p>
              </div>
              <div v-else-if="mpesaStatus === 'confirmed'" class="text-center py-6 text-green-600">
                <Check class="w-10 h-10 mx-auto mb-2" />
                <p class="font-bold">Payment Confirmed</p>
              </div>
            </CardContent>
          </Card>

          <Card v-else-if="selectedMethod === 'CARD'" class="border-dashed">
            <CardContent class="pt-4 text-center py-6">
              <CreditCard class="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
              <p class="font-medium mb-1">Terminal Connected</p>
              <p class="text-sm text-muted-foreground">Tap or insert card to process payment</p>
            </CardContent>
          </Card>

          <Card v-else-if="selectedMethod === 'BANK'" class="border-dashed">
            <CardContent class="pt-4 space-y-3">
              <label class="block text-xs text-muted-foreground">Reference Number</label>
              <Input type="text" placeholder="Enter bank transfer reference" class="h-10" />
            </CardContent>
          </Card>

          <Card v-else-if="selectedMethod === 'SPLIT'" class="border-dashed">
            <CardContent class="pt-4 space-y-3">
              <div class="space-y-2">
                <div class="flex items-center gap-2">
                  <Banknote class="w-4 h-4 text-muted-foreground" />
                  <label class="text-xs text-muted-foreground">Cash</label>
                  <Input v-model.number="splitCash" type="number" placeholder="0" class="flex-1 h-8" />
                </div>
                <div class="flex items-center gap-2">
                  <CreditCard class="w-4 h-4 text-muted-foreground" />
                  <label class="text-xs text-muted-foreground">Card</label>
                  <Input v-model.number="splitCard" type="number" placeholder="0" class="flex-1 h-8" />
                </div>
                <div class="flex items-center gap-2">
                  <Smartphone class="w-4 h-4 text-muted-foreground" />
                  <label class="text-xs text-muted-foreground">M-Pesa</label>
                  <Input v-model.number="splitMpesa" type="number" placeholder="0" class="flex-1 h-8" />
                </div>
              </div>
              <div class="flex justify-between text-sm pt-2">
                <span class="text-muted-foreground">Total entered</span>
                <span class="font-medium">KES {{ splitTotal.toLocaleString() }}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator />

        <div class="p-4">
          <div class="flex gap-2">
            <Button variant="outline" class="flex-1 touch-target h-12" @click="resetAndClose">
              Cancel
            </Button>
            <Button
              class="flex-1 touch-target h-12 text-lg"
              :disabled="
                (selectedMethod === 'CASH' && tendered < total) ||
                (selectedMethod === 'SPLIT' && splitTotal < total) ||
                (selectedMethod === 'MPESA' && !mpesaPhone)
              "
              @click="handlePay"
            >
              Confirm
            </Button>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  transform: scale(0.95) translateY(8px);
  opacity: 0;
}
</style>
