<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { Package, X } from '@lucide/vue';
import type { PurchaseOrderItem } from '../composables/usePurchaseOrders';
import { usePurchaseOrder } from '../composables/usePurchaseOrders';
import { notification } from '@/stores/notification';

interface Props {
  orderId: string;
  warehouseId: string;
  items: PurchaseOrderItem[];
}

const props = defineProps<Props>();
const { receiveMutation } = usePurchaseOrder(props.orderId);

const localItems = ref<Array<PurchaseOrderItem & { receiveQty: number }>>([]);
const showFull = ref(false);

function open() {
  localItems.value = props.items.map((item) => ({
    ...item,
    receiveQty: item.remainingQuantity,
  }));
  showFull.value = true;
}

function updateQty(item: any, delta: number) {
  const newQty = item.receiveQty + delta;
  if (newQty >= 0 && newQty <= item.remainingQuantity) {
    item.receiveQty = newQty;
  }
}

async function handleReceive() {
  const itemsToReceive = localItems.value
    .filter((item) => item.receiveQty > 0)
    .map((item) => ({
      productId: item.productId,
      quantity: item.receiveQty,
      unitCost: item.unitCost,
    }));

  if (itemsToReceive.length === 0) {
    notification.error('Please enter a quantity to receive');
    return;
  }

  await receiveMutation.mutateAsync({
    warehouseId: props.warehouseId,
    items: itemsToReceive,
  });

  showFull.value = false;
}
</script>

<template>
  <div>
    <button
      @click="open"
      class="btn btn-primary touch-target"
    >
      Receive Goods
    </button>

    <teleport to="body">
      <Transition name="dialog">
        <div
          v-if="showFull"
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        >
          <Transition name="dialog-slide" @enter="() => {}">
            <div
              class="bg-card border rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto"
            >
              <div class="p-4 sm:p-6">
                <div class="flex items-center justify-between mb-4">
                  <h2 class="text-lg font-semibold">Receive Goods</h2>
                  <button
                    @click="showFull = false"
                    class="p-2 rounded-lg hover:bg-muted touch-target"
                  >
                    <X class="w-5 h-5" />
                  </button>
                </div>

                <p class="text-sm text-muted-foreground mb-6">
                  Receive items against this purchase order. Partial deliveries are supported.
                </p>

                <div class="space-y-4">
                  <div
                    v-for="(item, index) in localItems"
                    :key="item.id"
                    class="border rounded-lg p-4 space-y-3"
                  >
                    <div class="flex items-center gap-4">
                      <div class="flex-1">
                        <p class="font-medium">{{ item.productName }}</p>
                        <p class="text-xs text-muted-foreground">
                          Code: {{ item.productCode }}
                        </p>
                      </div>

                      <div class="text-right">
                        <p class="font-medium">
                          Ordered: {{ item.quantity }}
                        </p>
                        <p class="text-xs text-muted-foreground">
                          Received: {{ item.receivedQuantity }} / {{ item.remainingQuantity }} remaining
                        </p>
                      </div>
                    </div>

                    <div class="space-y-2">
                      <div class="flex items-center gap-2">
                        <button
                          @click="updateQty(item, -1)"
                          :disabled="item.receiveQty <= 0"
                          class="btn btn-outline btn-sm w-8 h-8"
                        >
                          -
                        </button>
                        <input
                          v-model.number="item.receiveQty"
                          type="number"
                          min="0"
                          :max="item.remainingQuantity"
                          class="input input-sm w-16 text-center"
                        />
                        <button
                          @click="updateQty(item, 1)"
                          :disabled="item.receiveQty >= item.remainingQuantity"
                          class="btn btn-outline btn-sm w-8 h-8"
                        >
                          +
                        </button>
                      </div>

                      <div class="w-full bg-muted rounded-full h-2 overflow-hidden">
        <div
          class="h-2 bg-success transition-all duration-300"
          :style="{
            width: `${((item.quantity - item.remainingQuantity) / item.quantity) * 100}%`,
          }"
        ></div>
      </div>

                      <div class="flex justify-between text-xs text-muted-foreground">
                        <span>{{ item.quantity - item.remainingQuantity }} received</span>
                        <span>{{ item.remainingQuantity }} remaining</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="flex justify-end gap-3 pt-4 border-t mt-4">
                  <button
                    @click="showFull = false"
                    class="btn btn-outline touch-target"
                  >
                    Cancel
                  </button>
                  <button
                    @click="handleReceive"
                    :disabled="receiveMutation.isPending"
                    class="btn btn-primary touch-target"
                  >
                    <Package v-if="!receiveMutation.isPending" class="w-4 h-4 mr-1" />
                    {{ receiveMutation.isPending ? 'Receiving...' : 'Confirm Receipt' }}
                  </button>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </Transition>
    </teleport>
  </div>
</template>

<style scoped>
.dialog-enter-active,
.dialog-leave-active {
  transition: opacity 0.2s ease;
}
.dialog-enter-from,
.dialog-leave-to {
  opacity: 0;
}
.dialog-slide-enter-active {
  transition: transform 0.2s ease;
}
.dialog-slide-enter-from {
  transform: translateY(-10px);
}
</style>
