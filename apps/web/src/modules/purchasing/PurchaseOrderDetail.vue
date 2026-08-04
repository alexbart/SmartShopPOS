<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import {
  Package,
  Receipt,
  History,
  FileText,
  FileUp,
  Check,
  Clock,
  User,
  Send,
  Trash2,
} from '@lucide/vue';
import { usePurchaseOrder, usePurchaseOrderWorkflow } from './composables/usePurchaseOrders.js';
import { PurchaseOrderStatusLabels, PurchaseOrderStatusColors } from './composables/usePurchaseOrders.js';
import WorkspaceShell from '@/components/business/WorkspaceShell.vue';
import MoneyDisplay from '@/components/business/MoneyDisplay.vue';
import PurchaseOrderTimeline from './components/PurchaseOrderTimeline.vue';
import ApprovalPanel from './components/ApprovalPanel.vue';
import GoodsReceivingModal from './components/GoodsReceivingModal.vue';

const route = useRoute();
const orderId = computed(() => String(route.params.id));
const { po, isLoading: poLoading, submitMutation, cancelMutation } = usePurchaseOrder(orderId.value);
const { approvalHistory, historyLoading } = usePurchaseOrderWorkflow();

const activeTab = ref('items');

const tabs = [
  { label: 'Items', value: 'items', icon: Package },
  { label: 'Receipts', value: 'receipts', icon: Receipt },
  { label: 'Timeline', value: 'timeline', icon: History },
  { label: 'Documents', value: 'documents', icon: FileText },
  { label: 'Audit', value: 'audit', icon: History },
];

function getProgress(p: any) {
  if (!p) return 0;
  const totalOrdered = p.totalQuantity || 0;
  const totalReceived = p.receivedQuantity || 0;
  return totalOrdered > 0 ? (totalReceived / totalOrdered) * 100 : 0;
}

function canSubmit(p: any) {
  if (!p) return false;
  return p.status === 'DRAFT';
}

function canCancel(p: any) {
  if (!p) return false;
  return !['RECEIVED', 'CANCELLED'].includes(p.status);
}

function getItemProgress(item: any) {
  const received = item.quantity - item.remainingQuantity;
  return (received / item.quantity) * 100;
}
</script>

<template>
  <WorkspaceShell
    v-if="po"
    :workspace-title="`${po.orderNumber} - ${po.supplierName}`"
    :workspace-description="po.supplierCode"
    :action-button="canSubmit(po) ? {
      label: 'Submit for Approval',
      icon: Send,
      loading: submitMutation.isPending,
      onClick: () => submitMutation.mutate(),
    } : undefined"
    :tabs="[]"
  >
    <template #search>
      <div class="relative flex-1 min-w-[180px]">
        <input
          type="text"
          placeholder="Search items..."
          class="w-full pl-9 pr-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
    </template>

    <template #filters>
      <button
        v-if="canCancel(po)"
        @click="cancelMutation.mutate()"
        :disabled="cancelMutation.isPending"
        class="btn btn-outline btn-sm text-red-600 touch-target"
      >
        <Trash2 class="w-3 h-3 mr-1" />
        {{ cancelMutation.isPending ? 'Cancelling...' : 'Cancel Order' }}
      </button>
    </template>

    <div class="space-y-6">
      <nav class="flex items-center gap-1 border-b overflow-x-auto scrollbar-hide">
        <button
          v-for="tab in tabs"
          :key="tab.value"
          @click="activeTab = tab.value"
          :class="[
            'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-md transition-all whitespace-nowrap',
            activeTab === tab.value
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
          ]"
        >
          <component :is="tab.icon" class="w-4 h-4" />
          {{ tab.label }}
        </button>
      </nav>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2">
          <div v-if="activeTab === 'items'" class="space-y-4">
            <div class="border rounded-lg overflow-hidden">
              <table class="w-full">
                <thead class="bg-muted/50">
                  <tr>
                    <th class="text-left p-3 text-xs font-medium text-muted-foreground">Product</th>
                    <th class="text-right p-3 text-xs font-medium text-muted-foreground">Qty</th>
                    <th class="text-right p-3 text-xs font-medium text-muted-foreground">Received</th>
                    <th class="text-right p-3 text-xs font-medium text-muted-foreground">Unit Cost</th>
                    <th class="text-right p-3 text-xs font-medium text-muted-foreground">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in po.items" :key="item.id" class="border-t">
                    <td class="p-3">
                      <div>
                        <p class="font-medium">{{ item.productName }}</p>
                        <p class="text-xs text-muted-foreground">{{ item.productCode }}</p>
                      </div>
                    </td>
                    <td class="p-3 text-right">{{ item.quantity }}</td>
                    <td class="p-3 text-right">
                      <div class="flex flex-col items-end">
                        <span>{{ item.receivedQuantity }}</span>
                        <div class="w-12 h-1.5 bg-muted rounded-full overflow-hidden mt-1">
                          <div
                            class="h-1.5 bg-success transition-all"
                            :style="{ width: getItemProgress(item) + '%' }"
                          ></div>
                        </div>
                        <span class="text-xs text-muted-foreground">
                          {{ item.remainingQuantity }} remaining
                        </span>
                      </div>
                    </td>
                    <td class="p-3 text-right"><MoneyDisplay :amount="item.unitCost" /></td>
                    <td class="p-3 text-right"><MoneyDisplay :amount="item.subtotal" /></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div
              v-if="po.status === 'APPROVED' || po.status === 'PARTIALLY_RECEIVED'"
              class="pt-4"
            >
              <GoodsReceivingModal :order-id="po.id" :warehouse-id="po.warehouseId" :items="po.items" />
            </div>
          </div>

          <div v-else-if="activeTab === 'receipts'" class="space-y-4">
            <p class="text-sm text-muted-foreground">
              No goods receipt records yet.
            </p>
          </div>

          <div v-else-if="activeTab === 'timeline'" class="space-y-4">
            <PurchaseOrderTimeline
              :current-status="po.status"
              :created-at="po.createdAt"
              :updated-at="po.updatedAt"
            />
          </div>

          <div v-else-if="activeTab === 'documents'" class="space-y-4">
            <div class="border-2 border-dashed border-border rounded-lg p-6 text-center">
              <FileUp class="w-8 h-8 mx-auto text-muted-foreground mb-3" />
              <p class="text-sm text-muted-foreground mb-2">
                Upload supplier invoices and delivery notes
              </p>
              <label class="btn btn-outline btn-sm touch-target cursor-pointer">
                <FileUp class="w-3 h-3 mr-1" /> Upload Document
                <input type="file" multiple class="hidden" />
              </label>
            </div>
          </div>

          <div v-else-if="activeTab === 'audit'" class="space-y-4">
            <div class="space-y-3">
              <div class="flex items-start gap-3 pb-3 border-b">
                <div class="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <User class="w-3 h-3 text-primary" />
                </div>
                <div>
                  <p class="font-medium text-sm">Created by {{ po.createdBy }}</p>
                  <p class="text-xs text-muted-foreground">
                    {{ new Date(po.createdAt).toLocaleString('en-KE') }}
                  </p>
                </div>
              </div>

              <div v-if="po.approvedBy" class="flex items-start gap-3 pb-3 border-b">
                <div class="w-6 h-6 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
                  <Check class="w-3 h-3 text-success" />
                </div>
                <div>
                  <p class="font-medium text-sm">Approved by {{ po.approvedBy }}</p>
                  <p class="text-xs text-muted-foreground">
                    {{ new Date(po.updatedAt).toLocaleString('en-KE') }}
                  </p>
                </div>
              </div>

              <div class="flex items-start gap-3">
                <div class="w-6 h-6 rounded-full bg-muted/30 flex items-center justify-center flex-shrink-0">
                  <Clock class="w-3 h-3 text-muted-foreground" />
                </div>
                <div>
                  <p class="font-medium text-sm">Last updated</p>
                  <p class="text-xs text-muted-foreground">
                    {{ new Date(po.updatedAt).toLocaleString('en-KE') }}
                  </p>
                </div>
              </div>
            </div>

            <div class="mt-6">
              <ApprovalPanel :history="approvalHistory" :is-loading="historyLoading" />
            </div>
          </div>
        </div>

        <div class="space-y-6">
          <div class="card p-4">
            <h3 class="text-sm font-medium text-muted-foreground mb-3">PO Summary</h3>
            <div class="space-y-2">
              <div class="flex justify-between">
                <span class="text-sm text-muted-foreground">PO Number</span>
                <span class="font-medium">{{ po.orderNumber }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-sm text-muted-foreground">Supplier</span>
                <span class="font-medium">{{ po.supplierName }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-sm text-muted-foreground">Warehouse</span>
                <span class="font-medium">{{ po.warehouseName || po.warehouseId }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-sm text-muted-foreground">Status</span>
                <span
                  class="px-2 py-1 rounded-full text-xs font-medium"
                  :class="PurchaseOrderStatusColors[po.status] || 'bg-muted/30 text-muted-foreground'"
                >
                  {{ PurchaseOrderStatusLabels[po.status] || po.status }}
                </span>
              </div>
              <div class="flex justify-between">
                <span class="text-sm text-muted-foreground">Expected Delivery</span>
                <span class="font-medium">
                  {{ po.expectedDeliveryDate ? new Date(po.expectedDeliveryDate).toLocaleDateString('en-KE') : 'â€”' }}
                </span>
              </div>
            </div>

            <div class="border-t my-3"></div>

            <div class="space-y-2">
              <div class="flex justify-between">
                <span class="text-sm text-muted-foreground">Subtotal</span>
                <MoneyDisplay :amount="po.subtotal" />
              </div>
              <div class="flex justify-between">
                <span class="text-sm text-muted-foreground">Tax</span>
                <MoneyDisplay :amount="po.tax" />
              </div>
              <div class="flex justify-between">
                <span class="text-sm text-muted-foreground">Discount</span>
                <MoneyDisplay :amount="po.discount" :negative="true" />
              </div>
              <div class="flex justify-between border-t pt-2 font-bold">
                <span>Total</span>
                <MoneyDisplay :amount="po.total" />
              </div>
            </div>

            <div
              v-if="po.receivedQuantity > 0 && (po.status === 'PARTIALLY_RECEIVED' || po.status === 'RECEIVED')"
              class="my-4"
            >
              <div class="flex justify-between text-sm mb-1">
                <span>Delivery Progress</span>
                <span>{{ po.receivedQuantity }}/{{ po.totalQuantity }}</span>
              </div>
              <div class="w-full bg-muted rounded-full h-2">
                <div
                  class="h-2 bg-success rounded-full transition-all"
                  :style="{ width: getProgress(po) + '%' }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </WorkspaceShell>

  <div v-else-if="poLoading" class="p-6">
    <div class="space-y-4">
      <div class="h-8 bg-muted/30 rounded animate-pulse w-64"></div>
      <div class="space-y-2">
        <div v-for="i in 10" :key="i" class="h-12 bg-muted/30 rounded animate-pulse"></div>
      </div>
    </div>
  </div>
</template>

