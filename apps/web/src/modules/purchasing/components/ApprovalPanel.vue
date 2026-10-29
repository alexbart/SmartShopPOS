<script setup lang="ts">
import { Clock, Check, X, User } from '@lucide/vue';
import { PurchaseOrderStatusColors, PurchaseOrderStatusLabels } from '../composables/usePurchaseOrders';
import type { PurchaseOrderStatus } from '../composables/usePurchaseOrders';

interface ApprovalRecord {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  amount: number | null;
  requestedBy: string;
  status: string;
  approvedBy: string | null;
  approvedAt: string | null;
  comments: string | null;
  createdAt: string;
}

interface Props {
  history: ApprovalRecord[];
  isLoading?: boolean;
}

defineProps<Props>();
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-medium">Approval History</h3>
      <span class="text-xs text-muted-foreground" v-if="history.length">
        {{ history.length }} records
      </span>
    </div>

    <div
      v-if="isLoading"
      class="space-y-3"
    >
      <div
        v-for="i in 3"
        :key="i"
        class="border rounded-lg p-3 animate-pulse"
      >
        <div class="h-4 bg-muted rounded w-3/4 mb-2"></div>
        <div class="h-3 bg-muted rounded w-1/2"></div>
      </div>
    </div>

    <div
      v-else-if="history.length === 0"
      class="text-center py-8 text-muted-foreground"
    >
      <Clock class="w-8 h-8 mx-auto mb-2 opacity-30" />
      <p>No approval history found.</p>
    </div>

    <div
      v-else
      class="space-y-3"
    >
      <div
        v-for="record in history"
        :key="record.id"
        class="border rounded-lg p-4"
      >
        <div class="flex items-start justify-between">
          <div class="flex items-start gap-3">
            <div
              class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              :class="{
                'bg-success/10 text-success':
                  record.status === 'APPROVED',
                'bg-destructive/10 text-destructive':
                  record.status === 'REJECTED',
                'bg-warning/10 text-warning':
                  record.status === 'PENDING',
              }"
            >
              <Check v-if="record.status === 'APPROVED'" class="w-4 h-4" />
              <X v-else-if="record.status === 'REJECTED'" class="w-4 h-4" />
              <Clock v-else class="w-4 h-4" />
            </div>

            <div>
              <p class="font-medium">
                {{ record.status === 'APPROVED' ? 'Manager Approved' : record.status === 'REJECTED' ? 'Rejected' : 'Awaiting Approval' }}
              </p>
              <p class="text-xs text-muted-foreground">
                {{ new Date(record.createdAt).toLocaleDateString('en-KE', { month: 'short', day: 'numeric', year: 'numeric' }) }}
              </p>
              <p v-if="record.comments" class="text-xs text-muted-foreground mt-1">
                "{{ record.comments }}"
              </p>
            </div>
          </div>

          <span
            class="text-xs px-2 py-1 rounded-full"
            :class="record.status === 'APPROVED' ? 'bg-success/10 text-success' : record.status === 'REJECTED' ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning'"
          >
            {{ record.status }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
