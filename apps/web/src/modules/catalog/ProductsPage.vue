<script setup lang="ts">
import { ref, computed } from 'vue';
import { useQuery, useQueryClient } from '@tanstack/vue-query';
import { useRouter } from 'vue-router';
import { Plus, Package, Tag, Layers, ChevronLeft, ChevronRight, Download } from '@lucide/vue';
import { apiClient } from '@/shared/lib/api-client';
import { notification } from '@/stores/notification';
import type { Product, Category, Brand } from '@/shared/types';
import WorkspaceShell from '@/components/business/WorkspaceShell.vue';
import ProductTable from '@/components/business/ProductTable.vue';
import ErrorState from '@/components/business/ErrorState.vue';
import LoadingSkeleton from '@/components/business/LoadingSkeleton.vue';
import EmptyState from '@/components/business/EmptyState.vue';
import SmartSearch from '@/components/business/SmartSearch.vue';
import FilterBar from '@/components/business/FilterBar.vue';
import BulkActionBar from '@/components/business/BulkActionBar.vue';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const router = useRouter();
const queryClient = useQueryClient();

const selectedIds = ref<string[]>([]);
const searchQueryStr = ref('');
const currentPage = ref(1);
const selectedCategory = ref<string | null>(null);
const statusFilter = ref<string | null>(null);
const selectedBrand = ref<string | null>(null);

const { data: productsResponse, isLoading, isError } = useQuery({
  queryKey: ['products', {
    search: searchQueryStr,
    category: selectedCategory,
    brand: selectedBrand,
    status: statusFilter,
    page: currentPage,
  }],
  queryFn: async () => {
    const params: Record<string, string> = {};
    if (searchQueryStr.value) params.search = searchQueryStr.value;
    if (selectedCategory.value) params.categoryId = selectedCategory.value;
    if (selectedBrand.value) params.brandId = selectedBrand.value;
    if (statusFilter.value) params.isActive = statusFilter.value;
    params.page = String(currentPage.value);
    params.limit = '20';
    const response = await apiClient.get('/products', { params });
    return response.data.data;
  },
});

const { data: categoriesData } = useQuery({
  queryKey: ['categories'],
  queryFn: async () => {
    const res = await apiClient.get('/categories');
    return res.data.data.items as Category[];
  },
});

const { data: brandsData } = useQuery({
  queryKey: ['brands'],
  queryFn: async () => {
    const res = await apiClient.get('/brands');
    return res.data.data.items as Brand[];
  },
});

const products = computed(() => productsResponse.value?.items ?? []);
const categories = computed(() => categoriesData.value ?? []);
const brands = computed(() => brandsData.value ?? []);
const totalProducts = computed(() => productsResponse.value?.total ?? 0);
const totalPages = computed(() => productsResponse.value?.pages ?? 1);

function handleDelete(product: Product) {
  if (confirm(`Delete ${product.name}?`)) {
    apiClient.delete(`/products/${product.id}`)
      .then(() => {
        notification.success('Product archived', product.name);
        queryClient.invalidateQueries({ queryKey: ['products'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      })
      .catch(() => {});
  }
}

function goToCreate() {
  router.push('/products/create');
}

function handleBulkDelete() {
  if (!confirm(`Delete ${selectedIds.value.length} products?`)) return;
  Promise.all(
    selectedIds.value.map((id) => apiClient.delete(`/products/${id}`))
  ).then(() => {
    notification.success('Deleted', `${selectedIds.value.length} products archived`);
    selectedIds.value = [];
    queryClient.invalidateQueries({ queryKey: ['products'] });
  });
}

const filterGroups = computed(() => [
  {
    key: 'category',
    label: 'Category',
    value: selectedCategory.value,
    options: categories.value.map((c) => ({ label: c.name, value: c.id })),
  },
  {
    key: 'brand',
    label: 'Brand',
    value: selectedBrand.value,
    options: brands.value.map((b) => ({ label: b.name, value: b.id })),
  },
  {
    key: 'status',
    label: 'Status',
    value: statusFilter.value,
    options: [
      { label: 'Active', value: 'true' },
      { label: 'Inactive', value: 'false' },
    ],
  },
]);

function updateFilter(key: string, value: string | null) {
  if (key === 'category') selectedCategory.value = value;
  if (key === 'brand') selectedBrand.value = value;
  if (key === 'status') statusFilter.value = value;
  currentPage.value = 1;
}

function clearFilters() {
  selectedCategory.value = null;
  selectedBrand.value = null;
  statusFilter.value = null;
  currentPage.value = 1;
}

function handleSearch(query: string) {
  searchQueryStr.value = query;
  currentPage.value = 1;
}

const breadcrumbs = [
  { label: 'Catalog', href: '/products' },
];

const tabs = computed(() => [
  { label: 'Products', value: 'products', icon: Package, count: totalProducts?.value ?? 0 },
  { label: 'Categories', value: 'categories', icon: Tag },
  { label: 'Brands', value: 'brands', icon: Layers },
]);

function handleTabChange(value: string) {
  if (value === 'categories') router.push('/categories');
  if (value === 'brands') router.push('/brands');
}

const bulkActionsList = [
  {
    label: 'Delete',
    icon: Plus,
    variant: 'destructive' as const,
    action: () => handleBulkDelete(),
  },
  {
    label: 'Export',
    icon: Download,
    action: () => notification.info('Export', 'Export feature coming soon'),
  },
];
</script>

<template>
  <WorkspaceShell
    :breadcrumbs="breadcrumbs"
    workspace-icon="Package"
    workspace-title="Catalog"
    workspace-description="Manage products, categories and pricing"
    :action-button="{
      label: 'Add Product',
      icon: Plus,
      onClick: goToCreate,
    }"
    :tabs="tabs"
    :active-tab="'products'"
    @update:activeTab="handleTabChange"
    :show-toolbar="true"
  >
    <template #search>
      <SmartSearch
        v-model="searchQueryStr"
        placeholder="Search products, SKU, barcode..."
        @search="handleSearch"
      />
    </template>

    <template #filters>
      <FilterBar
        :filters="filterGroups"
        @filter-change="updateFilter"
        @clear="clearFilters"
      />
    </template>

    <div class="flex-1 overflow-y-auto">
      <BulkActionBar
        v-if="selectedIds.length > 0"
        :selected-ids="selectedIds"
        :actions="bulkActionsList"
      />

      <Card v-if="isError" class="mt-4">
        <CardContent class="p-6">
          <ErrorState title="Failed to load products" />
        </CardContent>
      </Card>

      <Card v-else-if="isLoading" class="mt-4">
        <CardContent class="p-4">
          <LoadingSkeleton :rows="8" :columns="7" />
        </CardContent>
      </Card>

      <Card v-else-if="products.length === 0" class="mt-4">
        <CardContent class="p-6">
          <EmptyState
            icon="Package"
            title="No products yet"
            description="Create your first product to begin managing inventory."
          >
            <Button @click="goToCreate">
              <Plus class="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </EmptyState>
        </CardContent>
      </Card>

      <Card v-else class="mt-4">
        <CardContent class="p-0">
          <ProductTable
            :products="products"
            :categories="categories"
            :brands="brands"
            :selected-ids="selectedIds"
            :is-loading="isLoading"
            @select-all="selectedIds = $event ? products.map((p: Product) => p.id) : []"
            @select-product="
              (id: string, checked: boolean) => {
                if (checked) {
                  selectedIds = [...selectedIds, id];
                } else {
                  selectedIds = selectedIds.filter((i: string) => i !== id);
                }
              }
            "
            @view="(p: Product) => router.push(`/products/${p.id}`)"
            @edit="(p: Product) => router.push(`/products/${p.id}/edit`)"
            @delete="handleDelete"
          />
        </CardContent>

        <div class="p-4 border-t flex items-center justify-between">
          <p class="text-sm text-muted-foreground">
            Page {{ currentPage }} of {{ totalPages }} — {{ totalProducts }} total
          </p>
          <div class="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              :disabled="currentPage === 1 || isLoading"
              @click="currentPage > 1 && currentPage--"
            >
              <ChevronLeft class="w-4 h-4" />
            </Button>
            <span class="text-sm">{{ currentPage }} / {{ totalPages }}</span>
            <Button
              variant="outline"
              size="sm"
              :disabled="currentPage >= totalPages || isLoading"
              @click="currentPage < totalPages && currentPage++"
            >
              <ChevronRight class="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  </WorkspaceShell>
</template>

<style scoped>
:global(.sm\:hidden) {
  display: none;
}
</style>
