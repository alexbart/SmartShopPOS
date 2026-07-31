<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query';
import { apiClient } from '@/shared/lib/api-client';
import { ref, computed } from 'vue';

interface Product {
  id: string;
  name: string;
  code: string;
  sku: string;
  sellingPrice: number;
  costPrice: number;
  stockQuantity: number;
}

const searchQuery = ref('');

const { data: productsResponse, isLoading, refetch } = useQuery({
  queryKey: ['products'],
  queryFn: async () => {
    const response = await apiClient.get<{ items: Product[] }>('/products');
    return response.data.data;
  },
});

const products = computed(() => productsResponse.value?.items ?? []);
</script>

<template>
  <div class="p-6">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Products</h1>
      <button @click="$router.push('/products/create')" class="btn btn-primary">Add Product</button>
    </div>

    <input v-model="searchQuery" type="text" placeholder="Search..." class="input mb-4 max-w-sm" />

    <div v-if="isLoading" class="text-center py-8 text-gray-500">Loading...</div>

    <div v-else-if="products.length === 0" class="text-center py-8 text-gray-500">
      No products found.
    </div>

    <div v-else class="card overflow-hidden">
      <table class="w-full">
        <thead>
          <tr class="bg-gray-50">
            <th class="text-left p-3 text-xs font-medium text-gray-600">Product</th>
            <th class="text-left p-3 text-xs font-medium text-gray-600">SKU</th>
            <th class="text-right p-3 text-xs font-medium text-gray-600">Selling Price</th>
            <th class="text-right p-3 text-xs font-medium text-gray-600">Cost Price</th>
            <th class="text-right p-3 text-xs font-medium text-gray-600">Stock</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in products" :key="p.id" class="border-t">
            <td class="p-3">
              <div class="font-medium">{{ p.name }}</div>
              <div class="text-sm text-gray-500">{{ p.code }}</div>
            </td>
            <td class="p-3 text-sm">{{ p.sku }}</td>
            <td class="p-3 text-right">KES {{ p.sellingPrice }}</td>
            <td class="p-3 text-right">KES {{ p.costPrice }}</td>
            <td class="p-3 text-right" :class="p.stockQuantity === 0 ? 'text-red-600' : p.stockQuantity < 5 ? 'text-orange-600' : 'text-green-600'">
              {{ p.stockQuantity }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
