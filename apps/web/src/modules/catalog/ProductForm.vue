<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import { useRouter, useRoute } from 'vue-router';
import { apiClient } from '@/shared/lib/api-client';
import { notification } from '@/stores/notification';
import type { Category, Unit, Brand, Tax } from '@/shared/types';

const route = useRoute();
const router = useRouter();
const queryClient = useQueryClient();
const isEditing = computed(() => !!route.params.id);

const form = reactive({
  name: '',
  code: '',
  sku: '',
  barcode: '',
  description: '',
  sellingPrice: 0,
  costPrice: 0,
  stockQuantity: 0,
  lowStockThreshold: 0,
  unitId: '',
  categoryId: '',
  brandId: '',
  taxId: '',
});

const { data: categoriesResponse } = useQuery({
  queryKey: ['categories'],
  queryFn: async () => {
    const response = await apiClient.get('/categories');
    return response.data.data.items as Category[];
  },
});

const { data: unitsResponse } = useQuery({
  queryKey: ['units'],
  queryFn: async () => {
    const response = await apiClient.get('/units');
    return response.data.data.items as Unit[];
  },
});

const { data: brandsResponse } = useQuery({
  queryKey: ['brands'],
  queryFn: async () => {
    const response = await apiClient.get('/brands');
    return response.data.data.items as Brand[];
  },
});

const { data: taxesResponse } = useQuery({
  queryKey: ['taxes'],
  queryFn: async () => {
    const response = await apiClient.get('/taxes');
    return response.data.data.items as Tax[];
  },
});

const categories = computed(() => categoriesResponse.value ?? []);
const units = computed(() => unitsResponse.value ?? []);
const brands = computed(() => brandsResponse.value ?? []);
const taxes = computed(() => taxesResponse.value ?? []);

const { data: existingProduct } = useQuery({
  queryKey: ['product', route.params.id as string],
  queryFn: async () => {
    const response = await apiClient.get(`/products/${route.params.id}`);
    return response.data.data;
  },
  enabled: isEditing.value,
});

watch(existingProduct, (product) => {
  if (product) {
    Object.assign(form, {
      name: product.name ?? '',
      code: product.code ?? '',
      sku: product.sku ?? '',
      barcode: product.barcode ?? '',
      description: product.description ?? '',
      sellingPrice: product.sellingPrice ?? 0,
      costPrice: product.costPrice ?? 0,
      stockQuantity: product.stockQuantity ?? 0,
      lowStockThreshold: product.lowStockThreshold ?? 0,
      unitId: product.unitId ?? '',
      categoryId: product.categoryId ?? '',
      brandId: product.brandId ?? '',
      taxId: product.taxId ?? '',
    });
  }
});

const saveMutation = useMutation({
  mutationFn: (payload: any) =>
    isEditing.value
      ? apiClient.put(`/products/${route.params.id}`, payload)
      : apiClient.post('/products', payload),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['products'] });
    notification.success(
      isEditing.value ? 'Product updated' : 'Product created',
      form.name,
    );
    router.push('/products');
  },
  onError: () => {
    // Handled by API interceptor
  },
});

async function handleSubmit() {
  const payload = {
    name: form.name,
    code: form.code,
    sku: form.sku,
    barcode: form.barcode || undefined,
    description: form.description || undefined,
    sellingPrice: Number(form.sellingPrice),
    costPrice: Number(form.costPrice),
    stockQuantity: Number(form.stockQuantity),
    lowStockThreshold: Number(form.lowStockThreshold),
    unitId: form.unitId,
    categoryId: form.categoryId || undefined,
    brandId: form.brandId || undefined,
    taxId: form.taxId || undefined,
  };

  await saveMutation.mutateAsync(payload);
}

function goBack() {
  router.push('/products');
}
</script>

<template>
  <div class="p-6">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">{{ isEditing ? 'Edit Product' : 'Create Product' }}</h1>
      <button @click="goBack" class="btn btn-outline">Cancel</button>
    </div>

    <form @submit.prevent="handleSubmit" class="card p-6 max-w-4xl space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
          <input v-model="form.name" placeholder="Enter product name" class="input" required />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Code *</label>
          <input v-model="form.code" placeholder="Enter SKU code" class="input" required />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">SKU</label>
          <input v-model="form.sku" placeholder="Enter SKU" class="input" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Barcode</label>
          <input v-model="form.barcode" placeholder="Barcode" class="input" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Selling Price *</label>
          <input v-model.number="form.sellingPrice" type="number" placeholder="0.00" class="input" required step="0.01" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Cost Price *</label>
          <input v-model.number="form.costPrice" type="number" placeholder="0.00" class="input" required step="0.01" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
          <input v-model.number="form.stockQuantity" type="number" class="input" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Low Stock Threshold</label>
          <input v-model.number="form.lowStockThreshold" type="number" class="input" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Unit *</label>
          <select v-model="form.unitId" class="input" required>
            <option value="">Select Unit</option>
            <option v-for="u in units" :key="u.id" :value="u.id">{{ u.name }} ({{ u.abbreviation }})</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select v-model="form.categoryId" class="input">
            <option value="">Select Category</option>
            <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Brand</label>
          <select v-model="form.brandId" class="input">
            <option value="">Select Brand</option>
            <option v-for="b in brands" :key="b.id" :value="b.id">{{ b.name }}</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Tax</label>
          <select v-model="form.taxId" class="input">
            <option value="">Select Tax</option>
            <option v-for="t in taxes" :key="t.id" :value="t.id">{{ t.name }} ({{ t.rate }}%)</option>
          </select>
        </div>
        <div class="md:col-span-2">
          <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea v-model="form.description" placeholder="Enter description" class="input" rows="3"></textarea>
        </div>
      </div>

      <button
        type="submit"
        :disabled="saveMutation.isPending"
        class="btn btn-primary w-full"
      >
        {{ saveMutation.isPending ? 'Saving...' : (isEditing ? 'Update Product' : 'Create Product') }}
      </button>
    </form>
  </div>
</template>
