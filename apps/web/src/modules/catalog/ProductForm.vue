<script setup lang="ts">
import { ref, h } from 'vue';
import { apiClient } from '@/shared/lib/api-client';
import { useQuery } from '@tanstack/vue-query';

const name = ref('');
const code = ref('');
const unitId = ref('');
const costPrice = ref(0);
const sellingPrice = ref(0);
const lowStockThreshold = ref(0);

const { data: categoriesResponse } = useQuery({
  queryKey: ['categories'],
  queryFn: async () => {
    const response = await apiClient.get('/categories');
    return response.data.data;
  },
});

const { data: brandsResponse } = useQuery({
  queryKey: ['brands'],
  queryFn: async () => {
    const response = await apiClient.get('/brands');
    return response.data.data;
  },
});

const { data: unitsResponse } = useQuery({
  queryKey: ['units'],
  queryFn: async () => {
    const response = await apiClient.get('/units');
    return response.data.data;
  },
});

async function handleSubmit() {
  await apiClient.post('/products', {
    name: name.value,
    code: code.value,
    sku: code.value,
    unitId: unitId.value,
    costPrice: costPrice.value,
    sellingPrice: sellingPrice.value,
    lowStockThreshold: lowStockThreshold.value,
  });
  alert('Product created!');
}
</script>

<template>
  <div class="p-6">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">{{ $route.params.id ? 'Edit' : 'Add' }} Product</h1>
    </div>

    <form @submit.prevent="handleSubmit" class="card p-6 max-w-2xl space-y-4">
      <div class="grid grid-cols-2 gap-4">
        <input v-model="name" placeholder="Product Name" class="input" required />
        <input v-model="code" placeholder="Code" class="input" required />
        <select v-model="unitId" class="input" required>
          <option value="">Select Unit</option>
          <option v-for="u in (unitsResponse || [])" :key="u.id" :value="u.id">{{ u.name }}</option>
        </select>
        <input v-model.number="costPrice" type="number" placeholder="Cost Price" class="input" required />
        <input v-model.number="sellingPrice" type="number" placeholder="Selling Price" class="input" required />
        <input v-model.number="lowStockThreshold" type="number" placeholder="Low Stock Threshold" class="input" />
      </div>

      <button type="submit" class="btn btn-primary">Save Product</button>
    </form>
  </div>
</template>
