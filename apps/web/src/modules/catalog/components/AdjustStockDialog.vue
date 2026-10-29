<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { AdjustStockPayload } from '@/modules/catalog/composables/useInventory';
import { Loader2, AlertTriangle } from '@lucide/vue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

interface Warehouse {
  id: string;
  name: string;
  code: string;
  isDefault: boolean;
}

const props = withDefaults(
  defineProps<{
    productId: string;
    currentStock: number;
    open: boolean;
    warehouses: Warehouse[];
  }>(),
  { open: false, warehouses: () => [] as Warehouse[] },
);

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'success', payload: AdjustStockPayload): void;
}>();

const selectedWarehouseId = ref<string>('');
const adjustmentQuantity = ref<number>(0);
const adjustmentType = ref<'ADJUSTMENT' | 'DAMAGE' | 'EXPIRED'>('ADJUSTMENT');
const remarks = ref('');
const isSubmitting = ref(false);
const validationErrors = ref<Record<string, string>>({});

const adjustmentTypes = [
  { value: 'ADJUSTMENT', label: 'General Adjustment', description: 'Correction for counting errors, etc.' },
  { value: 'DAMAGE', label: 'Damage', description: 'Damaged goods written off' },
  { value: 'EXPIRED', label: 'Expired', description: 'Expired products written off' },
];

const computedNewStock = computed(() => props.currentStock + adjustmentQuantity.value);

const canSubmit = computed(() => {
  if (!selectedWarehouseId.value) return false;
  if (adjustmentQuantity.value === 0) return false;
  if (!remarks.value || remarks.value.trim().length < 3) return false;
  if (!adjustmentType.value) return false;
  return true;
});

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      // Auto-select default warehouse or first available
      if (props.warehouses.length === 1) {
        selectedWarehouseId.value = props.warehouses[0].id;
      } else {
        const defaultWarehouse = props.warehouses.find((w) => w.isDefault);
        selectedWarehouseId.value = defaultWarehouse?.id || props.warehouses[0]?.id || '';
      }
      // Reset form
      adjustmentQuantity.value = 0;
      adjustmentType.value = 'ADJUSTMENT';
      remarks.value = '';
      validationErrors.value = {};
    }
  },
  { immediate: true },
);

function validateForm(): boolean {
  const errors: Record<string, string> = {};

  if (!selectedWarehouseId.value) {
    errors.warehouse = 'Please select a warehouse';
  }

  if (adjustmentQuantity.value === 0) {
    errors.quantity = 'Adjustment quantity cannot be zero';
  }

  if (!remarks.value || remarks.value.trim().length < 3) {
    errors.remarks = 'Remarks must be at least 3 characters';
  } else if (remarks.value.length > 500) {
    errors.remarks = 'Remarks must not exceed 500 characters';
  }

  validationErrors.value = errors;
  return Object.keys(errors).length === 0;
}

async function handleSubmit() {
  if (!validateForm()) return;

  isSubmitting.value = true;

  try {
    const payload: AdjustStockPayload = {
      warehouseId: selectedWarehouseId.value,
      productId: props.productId,
      quantity: adjustmentQuantity.value,
      type: adjustmentType.value,
      remarks: remarks.value.trim(),
    };

    emit('success', payload);
  } finally {
    isSubmitting.value = false;
  }
}

function handleClose() {
  emit('close');
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    handleClose();
  }
}
</script>

<template>
  <Transition name="fade">
    <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" @click="handleClose" @keydown="handleKeydown">
      <div class="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden" @click.stop>
        <Card class="border-none shadow-none">
          <CardHeader class="pb-4">
            <div class="flex items-center justify-between">
              <div>
                <CardTitle class="text-lg">Adjust Stock</CardTitle>
                <CardDescription class="text-sm">Record a stock adjustment for this product</CardDescription>
              </div>
              <Button variant="ghost" size="icon" class="text-gray-500 hover:text-gray-900" @click="handleClose">
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>
          </CardHeader>

          <CardContent class="space-y-4">
            <!-- Current Stock Display -->
            <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm text-gray-500 dark:text-gray-400">Current Stock</p>
                  <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ currentStock }} units</p>
                </div>
                <AlertTriangle class="h-8 w-8 text-amber-500" />
              </div>
            </div>

            <!-- Warehouse Selection -->
            <div v-if="warehouses.length > 1" class="space-y-2">
              <Label for="warehouse">Warehouse <span class="text-red-500">*</span></Label>
              <Select v-model="selectedWarehouseId">
                <SelectTrigger id="warehouse" class="w-full" :class="{ 'border-red-500': validationErrors.warehouse }">
                  <SelectValue placeholder="Select warehouse" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Available Warehouses</SelectLabel>
                    <SelectItem v-for="warehouse in warehouses" :key="warehouse.id" :value="warehouse.id">
                      {{ warehouse.name }} ({{ warehouse.code }}) {{ warehouse.isDefault ? '✓ Default' : '' }}
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              <p v-if="validationErrors.warehouse" class="text-sm text-red-500">{{ validationErrors.warehouse }}</p>
            </div>
            <div v-else class="space-y-2">
              <p class="text-sm text-gray-500 dark:text-gray-400">Warehouse: {{ warehouses[0]?.name }} (auto-selected)</p>
            </div>

            <!-- Adjustment Quantity -->
            <div class="space-y-2">
              <Label for="quantity">Adjustment Quantity <span class="text-red-500">*</span></Label>
              <div class="relative">
                <Input
                  id="quantity"
                  type="number"
                  v-model.number="adjustmentQuantity"
                  :class="{ 'border-red-500': validationErrors.quantity }"
                  placeholder="e.g. -5 or 10"
                  min="-999999"
                  max="999999"
                  step="1"
                  @blur="validateForm"
                />
                <div class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">units</div>
              </div>
              <p v-if="validationErrors.quantity" class="text-sm text-red-500">{{ validationErrors.quantity }}</p>
            </div>

            <!-- Adjustment Type -->
            <div class="space-y-2">
              <Label for="type">Adjustment Type <span class="text-red-500">*</span></Label>
              <Select v-model="adjustmentType">
                <SelectTrigger id="type" class="w-full">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Select Adjustment Type</SelectLabel>
                    <SelectItem v-for="type in adjustmentTypes" :key="type.value" :value="type.value">
                      <div>
                        <p class="font-medium">{{ type.label }}</p>
                        <p class="text-xs text-gray-500 dark:text-gray-400">{{ type.description }}</p>
                      </div>
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <!-- Remarks -->
            <div class="space-y-2">
              <Label for="remarks">Reason / Remarks <span class="text-red-500">*</span></Label>
              <Textarea
                id="remarks"
                v-model="remarks"
                :class="{ 'border-red-500': validationErrors.remarks }"
                placeholder="Minimum 3 characters, max 500. e.g. '5 units damaged during handling'"
                rows="3"
                @blur="validateForm"
              />
              <div class="flex justify-between text-xs">
                <span :class="remarks.length < 3 ? 'text-red-500' : 'text-gray-500'">{{ remarks.length }}/500 characters</span>
                <span v-if="remarks.length > 500" class="text-red-500">Exceeds limit</span>
              </div>
              <p v-if="validationErrors.remarks" class="text-sm text-red-500">{{ validationErrors.remarks }}</p>
            </div>

            <!-- New Stock Preview -->
            <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm text-blue-700 dark:text-blue-300">Estimated New Stock</p>
                  <p class="text-xl font-bold text-blue-900 dark:text-blue-100">{{ computedNewStock }} units</p>
                </div>
                <div class="text-right">
                  <p class="text-xs text-blue-600 dark:text-blue-400">Current: {{ currentStock }}</p>
                  <p class="text-xs text-blue-600 dark:text-blue-400" :class="adjustmentQuantity >= 0 ? 'text-green-600' : 'text-red-600'">
                    {{ adjustmentQuantity >= 0 ? '+' : '' }}{{ adjustmentQuantity }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex justify-end gap-3 pt-2">
              <Button variant="outline" @click="handleClose" :disabled="isSubmitting">
                Cancel
              </Button>
              <Button variant="default" @click="handleSubmit" :disabled="!canSubmit || isSubmitting" class="w-full sm:w-auto">
                <Loader2 v-if="isSubmitting" class="w-4 h-4 mr-2 animate-spin" />
                {{ isSubmitting ? 'Adjusting...' : 'Adjust Stock' }}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>