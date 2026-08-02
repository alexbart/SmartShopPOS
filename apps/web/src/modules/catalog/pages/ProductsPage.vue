 <script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  Package,
  Tag,
  Layers,
  Plus,
  ChevronLeft,
  ChevronRight,
} from '@lucide/vue';
import { useQuery } from '@tanstack/vue-query';
import { useProducts } from '@/modules/catalog/composables/useProducts';
import { apiClient } from '@/shared/lib/api-client';
import { notification } from '@/stores/notification';
import type { Product, Category, Brand } from '@/shared/types';
import CatalogWorkspace from '@/modules/catalog/components/CatalogWorkspace.vue';
import ProductToolbar from '@/modules/catalog/components/ProductToolbar.vue';
import ProductTable from '@/modules/catalog/components/ProductTable.vue';
import ProductCard from '@/modules/catalog/components/ProductCard.vue';
import ProductEmptyState from '@/modules/catalog/components/ProductEmptyState.vue';
import ProductSkeleton from '@/modules/catalog/components/ProductSkeleton.vue';
import BulkActionBar from '@/modules/catalog/components/BulkActionBar.vue';
import BulkUpdateWizard from '@/modules/catalog/components/BulkUpdateWizard.vue';
import InventoryHealthCards from '@/modules/catalog/components/InventoryHealthCards.vue';
import ProductPreviewDrawer from '@/modules/catalog/components/ProductPreviewDrawer.vue';
import SavedFilters from '@/modules/catalog/components/SavedFilters.vue';
import ColumnCustomizer from '@/modules/catalog/components/ColumnCustomizer.vue';
import ErrorState from '@/components/business/ErrorState.vue';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const router = useRouter();

const {
  products,
  total,
  totalPages,
  isLoading,
  isError,
  refetch,
  page,
  categoryFilter,
  brandFilter,
  statusFilter,
  setSearch,
  setCategory,
  setBrand,
  setStatus,
  setPage,
  clearFilters,
  deleteProduct,
} = useProducts();

const toolbarRef = ref<any>(null);
const isMobile = ref(false);
const selectedIds = ref<string[]>([]);
const searchQuery = ref('');

const bulkUpdateOpen = ref(false);
const previewProduct = ref<Product | null>(null);
const visibleColumns = ref<string[]>([
  'image',
  'product',
  'sku',
  'category',
  'stock',
  'price',
  'status',
]);

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

const categories = computed(() => categoriesData.value ?? []);
const brands = computed(() => brandsData.value ?? []);

const filterGroups = computed(() => [
  {
    key: 'category',
    label: 'Category',
    value: categoryFilter.value,
    options: categories.value.map((c) => ({ label: c.name, value: c.id })),
  },
  {
    key: 'brand',
    label: 'Brand',
    value: brandFilter.value,
    options: brands.value.map((b) => ({ label: b.name, value: b.id })),
  },
  {
    key: 'status',
    label: 'Status',
    value: statusFilter.value,
    options: [
      { label: 'Active', value: 'true' },
      { label: 'Inactive', value: 'false' },
      { label: 'Low Stock', value: 'low' },
    ],
  },
]);

const breadcrumbs = [{ label: 'Catalog', href: '/products' }];

const tabs = computed(() => [
  { label: 'Products', value: 'products', icon: Package, count: total.value },
  { label: 'Categories', value: 'categories', icon: Tag },
  { label: 'Brands', value: 'brands', icon: Layers },
]);

function handleAddProduct() {
  router.push('/products/create');
}

function handleSearch(query: string) {
  setSearch(query);
}

function handleDelete(product: Product) {
  if (confirm(`Delete ${product.name}?`)) {
    deleteProduct.mutate(product.id);
    notification.success('Product deleted', product.name);
    refetch();
  }
}

function handleArchive(product: Product) {
  deleteProduct.mutate(product.id);
  notification.success('Product archived', product.name);
  refetch();
}

function handleAdjustStock(product: Product) {
  notification.info('Stock Adjustment', `Adjusting stock for ${product.name}. Feature coming soon.`);
}

function handleDuplicate(product: Product) {
  router.push(`/products/create?duplicate=${product.id}`);
  notification.info('Duplicating', product.name);
}

function handleView(product: Product) {
  router.push(`/products/${product.id}`);
}

function handleEdit(product: Product) {
  router.push(`/products/${product.id}/edit`);
}

function handleRowDblClick(product: Product) {
  router.push(`/products/${product.id}`);
}

const selectedProductNames = computed(() =>
  products.value
    .filter((p) => selectedIds.value.includes(p.id))
    .map((p) => p.name),
);

function handleBulkActivate() {
  if (selectedIds.value.length === 0) return;
  notification.success(`${selectedIds.value.length} products activated`);
  selectedIds.value = [];
}

function handleBulkDeactivate() {
  if (selectedIds.value.length === 0) return;
  notification.success(`${selectedIds.value.length} products deactivated`);
  selectedIds.value = [];
}

function handleBulkArchive() {
  if (selectedIds.value.length === 0) return;
  if (confirm(`Archive ${selectedIds.value.length} selected products?`)) {
    selectedIds.value = [];
    notification.success('Products archived');
  }
}

function handleBulkDelete() {
  if (selectedIds.value.length === 0) return;
  if (confirm(`Delete ${selectedIds.value.length} selected products?`)) {
    selectedIds.value = [];
    notification.success('Products deleted');
  }
}

function handlePreview(product: Product) {
  previewProduct.value = product;
}

function handleBulkUpdate(payload: Record<string, unknown>) {
  notification.success(
    `Updated ${payload.count} products with ${payload.action}`,
  );
  bulkUpdateOpen.value = false;
  selectedIds.value = [];
}

function handleSavedFilter(filters: Record<string, unknown>) {
  if (filters.status) setStatus(String(filters.status));
  if (filters.category) setCategory(String(filters.category));
  if (filters.active !== undefined) setStatus(filters.active === true ? 'true' : 'false');
  if (filters.lowStock !== undefined) setStatus('low');
}

function handleColumnsUpdate(cols: string[]) {
  visibleColumns.value = cols;
}

function handleTabChange(value: string) {
  if (value === 'categories') router.push('/categories');
  if (value === 'brands') router.push('/brands');
}

function handleExport() {
  notification.info('Export', 'Export feature coming soon');
}

function handleFocusSearch() {
  toolbarRef.value?.focusSearch();
}

function handleClearFilters() {
  clearFilters();
  searchQuery.value = '';
  notification.success('Filters cleared');
}

function updateFilter(key: string, value: string | null) {
  if (key === 'category') setCategory(value);
  if (key === 'brand') setBrand(value);
  if (key === 'status') setStatus(value);
}

function handleFilterChange(key: string, value: string | null) {
  updateFilter(key, value);
}

function checkMobile() {
  isMobile.value = window.innerWidth < 768;
}

onMounted(() => {
  checkMobile();
  window.addEventListener('resize', checkMobile);
});

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile);
});
</script>

  <template>
    <CatalogWorkspace
      title="Catalog"
      description="Manage products, pricing and inventory."
      :breadcrumbs="breadcrumbs"
      :workspace-icon="Package"
      :action-button="{
        label: 'Add Product',
        icon: Plus,
        onClick: handleAddProduct,
      }"
      :tabs="tabs"
      :active-tab="'products'"
      @update:activeTab="handleTabChange"
    @focus-search="handleFocusSearch"
    @clear-filters="handleClearFilters"
    @export="handleExport"
    @escape-press="selectedIds = []"
    :show-toolbar="true"
    >
      <template #toolbar>
        <div v-if="selectedIds.length === 0">
          <ProductToolbar
            ref="toolbarRef"
            v-model:search="searchQuery"
            placeholder="Search products, SKU, barcode, brand..."
            @search="handleSearch"
            @export="handleExport"
            @clear-all="handleClearFilters"
          />

          <div class="hidden sm:flex items-center gap-2 flex-wrap mt-2 sm:mt-0 sm:ml-2">
            <SavedFilters @apply="handleSavedFilter" />
            <ColumnCustomizer @update:columns="handleColumnsUpdate" />
            <div v-for="filter in filterGroups" :key="filter.key">
              <label class="block text-xs font-medium text-muted-foreground/70 mb-1">
                {{ filter.label }}
              </label>
              <select
                :value="filter.value"
                @change="
                  handleFilterChange(
                    filter.key,
                    ($event.target as HTMLSelectElement).value || null,
                  )
                "
                class="h-9 px-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring w-36"
              >
                <option :value="null">All</option>
                <option
                  v-for="opt in filter.options"
                  :key="String(opt.value)"
                  :value="opt.value"
                >
                  {{ opt.label }}
                </option>
              </select>
            </div>
          </div>
        </div>

        <BulkActionBar
          v-else
          :total-count="products.length"
          :selected-count="selectedIds.length"
          :selected-product-names="selectedProductNames"
          @change-category="bulkUpdateOpen = true"
          @change-brand="bulkUpdateOpen = true"
          @change-tax="bulkUpdateOpen = true"
          @change-unit="bulkUpdateOpen = true"
          @activate="handleBulkActivate"
          @deactivate="handleBulkDeactivate"
          @archive="handleBulkArchive"
          @delete="handleBulkDelete"
          @export="handleExport"
          @clear-selection="selectedIds = []"
        />
      </template>

      <InventoryHealthCards
        v-if="products.length > 0"
        :products="products"
        @filter-healthy="() => setStatus('true')"
        @filter-low="() => setStatus('low')"
        @filter-out="() => setStatus('out')"
        @filter-archived="() => setStatus('false')"
      />

      <div v-if="isError">
      <ErrorState
        title="Failed to load products"
        retryable
        @retry="refetch"
      />
    </div>

    <div v-else-if="isLoading">
      <Card>
        <CardContent class="p-4">
          <ProductSkeleton :rows="5" />
        </CardContent>
      </Card>
    </div>

    <div
      v-else-if="products.length === 0"
      class="mt-4"
    >
      <Card>
        <CardContent class="p-6">
          <ProductEmptyState>
            <template #actions>
              <Button @click="handleAddProduct">
                <Plus class="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </template>
          </ProductEmptyState>
        </CardContent>
      </Card>
    </div>

    <div
      v-else
      class="mt-4"
    >
      <div v-if="isMobile" class="space-y-3">
        <div
          v-for="product in products"
          :key="product.id"
        >
          <ProductCard
            :product="product"
            :categories="categories"
            :brands="brands"
            @edit="handleEdit"
            @delete="handleDelete"
            @archive="handleArchive"
            @adjust-stock="handleAdjustStock"
            @duplicate="handleDuplicate"
            @view="handleView"
          />
        </div>
      </div>

      <Card v-else>
        <CardContent class="p-0">
          <ProductTable
            :products="products"
            :categories="categories"
            :brands="brands"
            :selected-ids="selectedIds"
            @select-all="(checked: boolean) =>
              (selectedIds = checked ? products.map((p: Product) => p.id) : [])
            "
            @select-product="
              (id: string, checked: boolean) => {
                if (checked) {
                  selectedIds = [...selectedIds, id];
                } else {
                  selectedIds = selectedIds.filter((i: string) => i !== id);
                }
              }
            "
             @view="handleView"
             @preview="handlePreview"
             @edit="handleEdit"
            @delete="handleDelete"
            @duplicate="handleDuplicate"
            @archive="handleArchive"
            @adjust-stock="handleAdjustStock"
            @row-dblclick="handleRowDblClick"
          />
        </CardContent>

        <div
          v-if="totalPages > 1 && products.length > 0"
          class="p-4 border-t flex items-center justify-between"
        >
          <p class="text-sm text-muted-foreground">
            Page {{ page }} of {{ totalPages }} — {{ total }} total
          </p>
          <div class="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              :disabled="page === 1 || isLoading"
              @click="page > 1 && setPage(page - 1)"
            >
              <ChevronLeft class="w-4 h-4" />
            </Button>
            <span class="text-sm">{{ page }} / {{ totalPages }}</span>
            <Button
              variant="outline"
              size="sm"
              :disabled="page >= totalPages || isLoading"
              @click="page < totalPages && setPage(page + 1)"
            >
              <ChevronRight class="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>

    <ProductPreviewDrawer
      v-if="previewProduct"
      :product="previewProduct"
      @close="previewProduct = null"
      @view="handleView"
      @edit="handleEdit"
    />

    <BulkUpdateWizard
      :open="bulkUpdateOpen"
      :selected-count="selectedIds.length"
      :categories="categories"
      :brands="brands"
      @close="bulkUpdateOpen = false"
      @apply="handleBulkUpdate"
    />
  </CatalogWorkspace>
</template>
