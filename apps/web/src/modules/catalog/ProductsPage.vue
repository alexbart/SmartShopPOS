<script setup lang="ts">
import { computed, ref } from 'vue';
import { useQuery, useQueryClient } from '@tanstack/vue-query';
import { apiClient } from '@/shared/lib/api-client';
import { notification } from '@/stores/notification';
import { useRouter } from 'vue-router';
import ProductCard from '@/components/business/ProductCard.vue';
import type { Product } from '@/shared/types';

const router = useRouter();
const queryClient = useQueryClient();
const searchQuery = ref('');

const { data: productsResponse, isLoading, error } = useQuery({
  queryKey: ['products'],
  queryFn: async () => {
    const response = await apiClient.get<{ items: Product[] }>('/products');
    return response.data.data;
  },
});

const products = computed(() => productsResponse.value?.items ?? []);

const filteredProducts = computed(() => {
  if (!searchQuery.value) return products.value;
  const q = searchQuery.value.toLowerCase();
  return products.value.filter(
    (p) => p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q),
  );
});
</script>

<template>
  <div class="p-6">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Products</h1>
      <button @click="router.push('/products/create')" class="btn btn-primary">Add Product</button>
    </div>

    <div class="mb-4 max-w-sm">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search products..."
        class="input"
      />
    </div>

    <div v-if="isLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div v-for="i in 8" :key="i" class="card p-4 animate-pulse">
        <div class="h-5 bg-gray-200 rounded mb-2"></div>
        <div class="h-4 bg-gray-200 rounded mb-1 w-3/4"></div>
        <div class="h-4 bg-gray-200 rounded w-1/2 mt-4"></div>
      </div>
    </div>

    <div v-else-if="error" class="text-center py-8 text-gray-500">
      Failed to load products.
    </div>

    <div v-else-if="filteredProducts.length === 0" class="text-center py-12 text-gray-500">
      No products found.
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <ProductCard
        v-for="product in filteredProducts"
        :key="product.id"
        :product="product"
        show-actions
        @view="router.push('/products/' + product.id)"
        @edit="router.push('/products/' + product.id)"
        @delete="notification.success('Product deleted')"
      />
    </div>
  </div>
</template>
