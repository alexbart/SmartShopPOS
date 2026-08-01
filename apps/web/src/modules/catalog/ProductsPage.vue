<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useQuery, useQueryClient } from '@tanstack/vue-query';
import { useRouter } from 'vue-router';
import { apiClient } from '@/shared/lib/api-client';
import { notification } from '@/stores/notification';
import type { Product, Category } from '@/shared/types';

const router = useRouter();
const queryClient = useQueryClient();
const searchQuery = ref('');
const selectedCategory = ref<string | null>(null);
const statusFilter = ref<'all' | 'active' | 'inactive'>('all');
const debounceTimer = ref<NodeJS.Timeout | null>(null);
const debouncedQuery = ref('');

const { data: productsResponse, isLoading } = useQuery({
  queryKey: ['products', { search: debouncedQuery, category: selectedCategory, status: statusFilter }],
  queryFn: async () => {
    const params: Record<string, string> = {};
    if (debouncedQuery.value) params.search = debouncedQuery.value;
    if (selectedCategory.value) params.categoryId = selectedCategory.value;
    if (statusFilter.value !== 'all') params.isActive = statusFilter.value === 'active';
    const response = await apiClient.get('/products', { params });
    return response.data.data;
  },
});

const { data: categoriesResponse } = useQuery({
  queryKey: ['categories'],
  queryFn: async () => {
    const response = await apiClient.get('/categories');
    return response.data.data.items as Category[];
  },
});

const { data: dashboardResponse } = useQuery({
  queryKey: ['dashboard'],
  queryFn: async () => {
    const response = await apiClient.get('/dashboard');
    return response.data.data;
  },
});

const products = computed(() => productsResponse.value?.items ?? []);
const categories = computed(() => categoriesResponse.value ?? []);
const lowStockCount = computed(() => dashboardResponse.value?.inventory?.lowStock ?? 0);
const outOfStockCount = computed(() => dashboardResponse.value?.inventory?.outOfStock ?? 0);
const totalProducts = computed(() => productsResponse.value?.total ?? 0);
const totalPages = computed(() => productsResponse.value?.pages ?? 1);
const currentPage = ref(1);

function updateSearch() {
  if (debounceTimer.value) clearTimeout(debounceTimer.value);
  debounceTimer.value = setTimeout(() => {
    debouncedQuery.value = searchQuery.value;
  }, 300);
}

const categoryNameMap = computed(() => {
  return new Map(categories.value.map((c) => [c.id, c.name]));
});

const categoryOptions = computed(() => {
  return [{ id: null, name: 'All Categories' }, ...categories.value];
});

function getStockStatus(product: Product): 'out' | 'low' | 'good' {
  const stock = product.stockQuantity ?? 0;
  const threshold = product.lowStockThreshold ?? 0;
  if (stock === 0) return 'out';
  if (stock <= threshold) return 'low';
  return 'good';
}

function handleDelete(product: Product) {
  if (confirm(`Delete ${product.name}?`)) {
    apiClient.delete(`/products/${product.id}`)
      .then(() => {
        notification.success('Product deleted', product.name);
        queryClient.invalidateQueries({ queryKey: ['products'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      })
      .catch(() => {});
  }
}

function goToCreate() {
  router.push('/products/create');
}

function goToProduct(id: string) {
  router.push(`/products/${id}`);
}

onMounted(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      (document.querySelector('input[type="search"]') as HTMLInputElement)?.focus();
    }
  };
  document.addEventListener('keydown', handleKeyDown);
  onUnmounted(() => document.removeEventListener('keydown', handleKeyDown));
});
</script>

<template>
  <div class="p-4 sm:p-6">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold">Catalog</h1>
        <p class="text-sm text-muted-foreground mt-1">Manage your product catalog</p>
      </div>
      <button @click="goToCreate" class="btn btn-primary touch-target">
        <svg class="w-5 h-5 mr-2 -ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Add Product
      </button>
    </div>

    <div class="card p-4 mb-4">
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
        <div class="sm:col-span-2">
          <label class="block text-sm font-medium text-gray-700 mb-1">Search</label>
          <div class="relative">
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor"
              viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              v-model="searchQuery"
              @input="updateSearch"
              type="search"
              placeholder="Search products, SKU, barcode... (⌘K)"
              class="input pl-10"
            />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select v-model="selectedCategory" @change="queryClient.invalidateQueries({ queryKey: ['products'] })" class="input">
              <option v-for="c in categoryOptions" :key="c.id ?? 'null'" :value="c.id">{{ c.name }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select v-model="statusFilter" @change="queryClient.invalidateQueries({ queryKey: ['products'] })" class="input">
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <div class="card p-4 mb-4">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div class="text-center">
          <p class="text-2xl font-bold text-primary">{{ totalProducts }}</p>
          <p class="text-xs text-muted-foreground">Total SKUs</p>
        </div>
        <div class="text-center">
          <p class="text-2xl font-bold text-warning">{{ lowStockCount }}</p>
          <p class="text-xs text-muted-foreground">Low Stock</p>
        </div>
        <div class="text-center">
          <p class="text-2xl font-bold text-danger">{{ outOfStockCount }}</p>
          <p class="text-xs text-muted-foreground">Out of Stock</p>
        </div>
        <div class="text-center">
          <p class="text-2xl font-bold text-green-600">{{ (totalProducts - outOfStockCount - lowStockCount).toString() }}</p>
          <p class="text-xs text-muted-foreground">In Stock</p>
        </div>
      </div>
    </div>

    <div class="card overflow-hidden">
      <div v-if="isLoading" class="p-4 space-y-2">
        <div v-for="i in 8" :key="i" class="h-12 bg-muted rounded animate-pulse"></div>
      </div>

      <div v-else-if="!products.length" class="p-8 text-center text-muted-foreground">
        <svg class="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10a2 2 0 01-2 2h-2.5m-9.5 0a2 2 0 01-2-2V7" />
        </svg>
        <p>No products found.</p>
        <button @click="goToCreate" class="btn btn-primary mt-3">Add your first product</button>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-muted/50 border-b">
            <tr>
              <th class="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Product</th>
              <th class="text-left p-3 text-xs font-medium text-muted-foreground uppercase">SKU</th>
              <th class="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Category</th>
              <th class="text-right p-3 text-xs font-medium text-muted-foreground uppercase">Price</th>
              <th class="text-right p-3 text-xs font-medium text-muted-foreground uppercase">Stock</th>
              <th class="text-right p-3 text-xs font-medium text-muted-foreground uppercase">Status</th>
              <th class="p-3 text-center text-xs font-medium text-muted-foreground uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="product in products"
              :key="product.id"
              class="table-row-hover border-b"
            >
              <td class="p-3">
                <div class="flex items-center gap-3">
                  <div
                    v-if="product.imageUrl"
                    class="w-10 h-10 rounded-md overflow-hidden"
                  >
                    <img :src="product.imageUrl" :alt="product.name" class="w-full h-full object-cover" />
                  </div>
                  <div v-else class="w-10 h-10 rounded-md bg-muted flex items-center justify-center">
                    <span class="text-xs font-bold text-muted-foreground">
                      {{ product.name?.substring(0, 2).toUpperCase() }}
                    </span>
                  </div>
                  <div>
                    <p class="font-medium text-sm">{{ product.name }}</p>
                    <p class="text-xs text-muted-foreground">{{ product.description?.substring(0, 40) }}...</p>
                  </div>
                </div>
              </td>
              <td class="p-3">
                <p class="text-sm font-mono">{{ product.code }}</p>
                <p v-if="product.sku" class="text-xs text-muted-foreground font-mono">{{ product.sku }}</p>
              </td>
              <td class="p-3">
                <p class="text-sm">{{ product.categoryId ? categoryNameMap.get(product.categoryId) || 'Uncategorized' : 'Uncategorized' }}</p>
              </td>
              <td class="p-3 text-right">
                <p class="text-sm font-medium font-mono">KES {{ product.sellingPrice?.toLocaleString() }}</p>
              </td>
              <td class="p-3 text-right">
                <p class="text-sm" :class="{
                  'text-red-600': getStockStatus(product) === 'out',
                  'text-amber-600': getStockStatus(product) === 'low',
                  'text-green-600': getStockStatus(product) === 'good',
                }">
                  {{ product.stockQuantity ?? 0 }}
                  <span v-if="getStockStatus(product) === 'low'" class="text-amber-600">⚠</span>
                  <span v-else-if="getStockStatus(product) === 'out'" class="text-red-600">⦻</span>
                </p>
                <p v-if="getStockStatus(product) === 'low'" class="text-xs text-amber-600">
                  Below threshold ({{ product.lowStockThreshold ?? 0 }})
                </p>
              </td>
              <td class="p-3 text-right">
                <span
                  :class="[
                    'badge',
                    product.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800',
                  ]"
                >
                  {{ product.isActive ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td class="p-3">
                <div class="flex justify-center gap-1">
                  <button
                    @click="goToProduct(product.id)"
                    class="p-1 hover:bg-muted rounded touch-target"
                    title="Edit"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.441-9.032l1-1m0 0l3-3m-3 3l-7.032 7.032a2 2 0 01-2.351-2.351l7.032-7.032z" />
                    </svg>
                  </button>
                  <button
                    @click="handleDelete(product)"
                    class="p-1 hover:bg-red-100 text-red-600 rounded touch-target"
                    title="Delete"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.857L5 7m5 5V3a2 2 0 00-4 0v4m8 0v6a1 1 0 11-2 0V7m2 0H9" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="totalPages > 1" class="p-4 border-t flex justify-between items-center">
        <p class="text-sm text-muted-foreground">
          Page {{ currentPage }} of {{ totalPages }}
        </p>
        <div class="flex gap-2">
          <button
            @click="currentPage > 1 && currentPage--"
            class="btn btn-outline btn-sm"
            :disabled="currentPage === 1"
          >
            Previous
          </button>
          <button
            @click="currentPage < totalPages && currentPage++"
            class="btn btn-outline btn-sm"
            :disabled="currentPage === totalPages"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
