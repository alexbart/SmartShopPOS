<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { ShoppingCart, Clock, CheckCircle, AlertCircle, Package, Search, Plus, FileDown } from '@lucide/vue';
import { usePurchaseOrders } from './composables/usePurchaseOrders';
import { PurchaseOrderStatusColors, PurchaseOrderStatusLabels } from './composables/usePurchaseOrders';
import WorkspaceShell from '@/components/business/WorkspaceShell.vue';
import DataTable from '@/components/business/DataTable.vue';

const router = useRouter();

const searchQuery = ref('');
const statusFilter = ref<string | null>(null);

const { pos, total, isLoading } = usePurchaseOrders(() => ({
  page: 1,
  limit: 50,
  search: searchQuery.value,
  status: statusFilter.value,
}));

const statusStats = computed(() => {
  const stats: Record<string, number> = {};
  for (const po of pos.value) {
    stats[po.status] = (stats[po.status] || 0) + 1;
  }
  return stats;
});

const summaryCards = [
  {
    title: 'Outstanding POs',
    value: total.value,
    icon: ShoppingCart,
    subtitle: 'All purchase orders',
  },
  {
    title: 'Pending Approval',
    value: (statusStats.value['PENDING_APPROVAL'] || 0) + (statusStats.value['SUBMITTED'] || 0) + (statusStats.value['DRAFT'] || 0),
    icon: Clock,
    subtitle: 'Awaiting action',
  },
  {
    title: 'Awaiting Delivery',
    value: (statusStats.value['APPROVED'] || 0) + (statusStats.value['PARTIALLY_RECEIVED'] || 0),
    icon: AlertCircle,
    subtitle: 'Goods in transit',
  },
  {
    title: 'Received',
    value: statusStats.value['RECEIVED'] || 0,
    icon: CheckCircle,
    subtitle: 'Completed',
  },
];

const columns = [
  { key: 'orderNumber', label: 'PO #', sortable: true },
  { key: 'supplierName', label: 'Supplier', sortable: true },
  { key: 'total', label: 'Total', align: 'right' as const },
  {
    key: 'status',
    label: 'Status',
    render: (row: any) => PurchaseOrderStatusLabels[row.status] || row.status,
  },
  {
    key: 'expectedDeliveryDate',
    label: 'Expected',
    render: (row: any) =>
      row.expectedDeliveryDate
        ? new Date(row.expectedDeliveryDate).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' })
        : '\u2014',
  },
];
</script>

<template>
  <WorkspaceShell
    workspace-title="Purchasing"
    workspace-description="Manage purchase orders, track deliveries, and monitor approvals"
    :action-button="{
      label: 'New Purchase Order',
      icon: Plus,
      onClick: () => router.push('/purchase-orders/create'),
    }"
  >
    <template #search>
      <div class="relative flex-1 min-w-[180px]">
        <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search by PO #, supplier..."
          class="w-full pl-9 pr-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
    </template>

    <template #filters>
      <select v-model="statusFilter" class="text-xs border rounded px-2 py-1 bg-background">
        <option value="">All Statuses</option>
        <option value="DRAFT">Draft</option>
        <option value="SUBMITTED">Submitted</option>
        <option value="APPROVED">Approved</option>
        <option value="PARTIALLY_RECEIVED">Partially Received</option>
        <option value="RECEIVED">Received</option>
        <option value="CANCELLED">Cancelled</option>
      </select>
      <button class="btn btn-outline btn-sm touch-target">
        <FileDown class="w-3 h-3 mr-1" /> Export
      </button>
    </template>

    <div class="space-y-6">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div v-for="card in summaryCards" :key="card.title" class="card p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-muted-foreground">{{ card.title }}</p>
              <p class="text-2xl font-bold mt-1">{{ card.value }}</p>
              <p v-if="card.subtitle" class="text-xs text-muted-foreground mt-1">
                {{ card.subtitle }}
              </p>
            </div>
            <div class="w-10 h-10 rounded-lg flex items-center justify-center bg-muted/30">
              <component :is="card.icon" class="w-5 h-5 text-muted-foreground" />
            </div>
          </div>
        </div>
      </div>

      <div class="card overflow-hidden">
        <div class="p-4 border-b">
          <h3 class="font-medium">Recent Purchase Orders</h3>
        </div>

        <DataTable
          v-if="!isLoading"
          :columns="columns"
          :rows="pos"
          :striped="true"
          @select-row="(row) => router.push(`/purchase-orders/${row.id}`)"
        >
          <template #status="{ row }">
            <span
              class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
              :class="PurchaseOrderStatusColors[row.status] || 'bg-muted/30 text-muted-foreground'"
            >
              {{ PurchaseOrderStatusLabels[row.status] || row.status }}
            </span>
          </template>
          <template #total="{ row }">
            KES {{ Number(row.total || 0).toLocaleString() }}
          </template>
        </DataTable>

        <div v-else class="p-4 space-y-3">
          <div v-for="i in 5" :key="i" class="h-12 bg-muted/30 rounded animate-pulse"></div>
        </div>

        <div v-if="!isLoading && pos.length === 0" class="p-8 text-center text-muted-foreground">
          <Package class="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p>No purchase orders found.</p>
          <button
            @click="router.push('/purchase-orders/create')"
            class="btn btn-primary btn-sm mt-3 touch-target"
          >
            <Plus class="w-3 h-3 mr-1" /> Create First PO
          </button>
        </div>
      </div>
    </div>
  </WorkspaceShell>
</template>
