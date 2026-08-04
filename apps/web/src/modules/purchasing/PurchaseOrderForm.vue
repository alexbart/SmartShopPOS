<script setup lang="ts">
import { reactive, computed, ref } from 'vue';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import { useRouter, useRoute } from 'vue-router';
import { apiClient } from '@/shared/lib/api-client';
import { notification } from '@/stores/notification';
import { useAuthStore } from '@/stores/auth';
import WorkspaceShell from '@/components/business/WorkspaceShell.vue';
import { Plus, Trash2, Save } from '@lucide/vue';
import type { Supplier, Product } from '@/shared/types';

const route = useRoute();
const router = useRouter();
const queryClient = useQueryClient();
const auth = useAuthStore();
const isEditing = computed(() => !!route.params.id);

const form = reactive({
  supplierId: '',
  warehouseId: auth.branch?.id || '',
  branchId: auth.branch?.id || '',
  expectedDeliveryDate: new Date().toISOString().split('T')[0],
  items: [{ productId: '', quantity: 1, unitCost: 0 }],
  notes: '',
});

const { data: suppliersData } = useQuery({
  queryKey: ['suppliers'],
  queryFn: async () => {
    const response = await apiClient.get('/suppliers');
    return response.data.data.items as Supplier[];
  },
});

const { data: productsData } = useQuery({
  queryKey: ['products'],
  queryFn: async () => {
    const response = await apiClient.get('/products');
    return response.data.data.items as Product[];
  },
});

const suppliers = computed(() => suppliersData.value ?? []);
const products = computed(() => productsData.value ?? []);

const saveMutation = useMutation({
  mutationFn: (payload: any) =>
    isEditing.value
      ? apiClient.patch(`/purchase-orders/${route.params.id}`, payload)
      : apiClient.post('/purchase-orders', payload),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
    notification.success(
      isEditing.value ? 'Purchase order updated' : 'Purchase order submitted',
    );
    router.push('/purchase-orders');
  },
});

async function handleSubmit() {
  const payload = {
    supplierId: form.supplierId,
    warehouseId: form.warehouseId,
    branchId: form.branchId,
    expectedDeliveryDate: form.expectedDeliveryDate,
    items: form.items.map((item) => ({
      productId: item.productId,
      quantity: Number(item.quantity),
      unitCost: Number(item.unitCost),
    })),
    notes: form.notes,
  };

  await saveMutation.mutateAsync(payload);
}

function addItem() {
  form.items.push({ productId: '', quantity: 1, unitCost: 0 });
}

function removeItem(index: number) {
  form.items.splice(index, 1);
}

const total = computed(() =>
  form.items.reduce((sum, item) => sum + Number(item.quantity) * Number(item.unitCost), 0),
);
</script>

<template>
  <WorkspaceShell
    :workspace-title="isEditing ? 'Edit Purchase Order' : 'New Purchase Order'"
    workspace-description="Add supplier, select products, and submit for approval"
  >
    <form @submit.prevent="handleSubmit" class="card p-6 space-y-6 max-w-4xl">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-foreground mb-1">Supplier *</label>
          <select v-model="form.supplierId" class="input" required>
            <option value="">Select Supplier</option>
            <option v-for="s in suppliers" :key="s.id" :value="s.id">{{ s.name }}</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-foreground mb-1">Expected Delivery</label>
          <input v-model="form.expectedDeliveryDate" type="date" class="input" />
        </div>
      </div>

      <div>
        <div class="flex justify-between items-center mb-2">
          <h3 class="font-medium">Items</h3>
          <button type="button" @click="addItem" class="btn btn-secondary btn-sm">
            <Plus class="w-3 h-3 mr-1" /> Add Item
          </button>
        </div>

        <div class="space-y-3">
          <div
            v-for="(item, index) in form.items"
            :key="index"
            class="grid grid-cols-4 gap-2 items-end"
          >
            <select v-model="item.productId" class="input" required>
              <option value="">Select Product</option>
              <option v-for="p in products" :key="p.id" :value="p.id">{{ p.name }} ({{ p.code }})</option>
            </select>
            <input v-model.number="item.quantity" type="number" placeholder="Qty" class="input" min="1" />
            <input v-model.number="item.unitCost" type="number" placeholder="Cost" class="input" step="0.01" />
            <button
              v-if="form.items.length > 1"
              type="button"
              @click="removeItem(index)"
              class="btn btn-sm btn-ghost text-red-600"
            >
              <Trash2 class="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-foreground mb-1">Notes</label>
        <textarea v-model="form.notes" class="input" rows="3" placeholder="Add notes..."></textarea>
      </div>

      <div class="flex justify-between items-center pt-4 border-t">
        <span class="font-medium">Total:</span>
        <span class="text-xl font-bold">KES {{ total.toLocaleString() }}</span>
      </div>

      <button type="submit" :disabled="saveMutation.isPending" class="btn btn-primary w-full">
        <Save v-if="!saveMutation.isPending" class="w-4 h-4 mr-2" />
        {{ saveMutation.isPending ? 'Saving...' : isEditing ? 'Update Order' : 'Save Purchase Order' }}
      </button>
    </form>
  </WorkspaceShell>
</template>

