<script setup lang="ts">
import { ref, computed } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import { useRouter, useRoute } from 'vue-router';
import {
  Package,
  Edit,
  Warehouse,
  ImageIcon,
  Clock,
  DollarSign,
  Users,
} from '@lucide/vue';
import { apiClient } from '@/shared/lib/api-client';
import { notification } from '@/stores/notification';
import type { Product, Category, Brand, Unit, Tax } from '@/shared/types';
import CatalogWorkspace from '@/modules/catalog/components/CatalogWorkspace.vue';
import ProductAvatar from '@/modules/catalog/components/ProductAvatar.vue';
import StockBadge from '@/modules/catalog/components/StockBadge.vue';
import StatusChip from '@/modules/catalog/components/StatusChip.vue';
import PriceTag from '@/modules/catalog/components/PriceTag.vue';
import ProductInsights from '@/modules/catalog/components/ProductInsights.vue';
import ActivityTimeline from '@/modules/catalog/components/ActivityTimeline.vue';
import InventoryChip from '@/modules/catalog/components/InventoryChip.vue';
import MoneyDisplay from '@/components/business/MoneyDisplay.vue';
import ImageUploader from '@/modules/catalog/components/ImageUploader.vue';
import LoadingSkeleton from '@/components/business/LoadingSkeleton.vue';
import ErrorState from '@/components/business/ErrorState.vue';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const router = useRouter();
const route = useRoute();
const productId = route.params.id as string;
const activeTab = ref('overview');

const {
  data: productData,
  isLoading,
  isError,
  refetch,
} = useQuery({
  queryKey: ['product', productId],
  queryFn: async () => {
    const res = await apiClient.get(`/products/${productId}`);
    return res.data.data as Product;
  },
  enabled: !!productId,
  staleTime: 30_000,
});

const { data: categoriesData } = useQuery({
  queryKey: ['categories'],
  queryFn: async () => {
    const res = await apiClient.get('/categories');
    return res.data.data.items as Category[];
  },
  staleTime: 60_000,
});

const { data: brandsData } = useQuery({
  queryKey: ['brands'],
  queryFn: async () => {
    const res = await apiClient.get('/brands');
    return res.data.data.items as Brand[];
  },
  staleTime: 60_000,
});

const { data: unitsData } = useQuery({
  queryKey: ['units'],
  queryFn: async () => {
    const res = await apiClient.get('/units');
    return res.data.data.items as Unit[];
  },
  staleTime: 60_000,
});

const { data: taxesData } = useQuery({
  queryKey: ['taxes'],
  queryFn: async () => {
    const res = await apiClient.get('/taxes');
    return res.data.data.items as Tax[];
  },
  staleTime: 60_000,
});

const categoryName = computed(() => {
  if (productData.value?.categoryName) return productData.value.categoryName;
  const cat = categoriesData.value?.find(
    (c) => c.id === productData.value?.categoryId,
  );
  return cat?.name ?? 'Uncategorized';
});

const brandName = computed(() => {
  if (productData.value?.brandName) return productData.value.brandName;
  const b = brandsData.value?.find((b) => b.id === productData.value?.brandId);
  return b?.name ?? null;
});

const unitName = computed(() => {
  const u = unitsData.value?.find((u) => u.id === productData.value?.unitId);
  return u?.name ?? '-';
});

const taxName = computed(() => {
  const t = taxesData.value?.find((t) => t.id === productData.value?.taxId);
  return t ? `${t.name} (${t.rate}%)` : 'No tax assigned';
});

const profitMargin = computed(() => {
  const cost = productData.value?.costPrice ?? 0;
  const selling = productData.value?.sellingPrice ?? 0;
  if (cost > 0 && selling > 0) {
    const margin = ((selling - cost) / selling) * 100;
    return `${margin.toFixed(1)}%`;
  }
  return '-';
});

const profitAmount = computed(() => {
  const cost = productData.value?.costPrice ?? 0;
  const selling = productData.value?.sellingPrice ?? 0;
  if (cost > 0 && selling > 0) {
    return selling - cost;
  }
  return 0;
});

const tabs = computed(() => [
  { label: 'Overview', value: 'overview', icon: Package },
  { label: 'Inventory', value: 'inventory', icon: Warehouse },
  { label: 'Pricing', value: 'pricing', icon: DollarSign },
  { label: 'Suppliers', value: 'suppliers', icon: Users },
  { label: 'Images', value: 'images', icon: ImageIcon },
  { label: 'Movement History', value: 'history', icon: Clock },
]);

function handleEdit() {
  router.push(`/products/${productId}/edit`);
}

function handleImageUpload(files: File[]) {
  notification.success(`${files.length} image(s) uploaded`);
}

function handleImageRemove(newFiles: File[]) {
  if (newFiles.length < (productData.value?.images?.length ?? 1)) {
    notification.success('Image removed');
  }
}</script>

<template>
  <CatalogWorkspace
    title="Product"
    :description="productData?.code || productData?.sku || ''"
    :breadcrumbs="[
      { label: 'Catalog', href: '/products' },
      { label: productData?.name ?? 'Product' },
    ]"
    :workspace-icon="Package"
    :action-button="{
      label: 'Edit',
      icon: Edit,
      onClick: handleEdit,
    }"
    :tabs="tabs"
    :active-tab="activeTab"
    @update:activeTab="activeTab = $event"
    :show-toolbar="false"
  >
    <div v-if="isLoading">
      <Card>
        <CardContent class="pt-6">
          <LoadingSkeleton :rows="6" :columns="4" />
        </CardContent>
      </Card>
    </div>

    <ErrorState
      v-else-if="isError"
      title="Failed to load product"
      retryable
      @retry="refetch"
    />

    <template v-else-if="productData">
      <div v-if="activeTab === 'overview'" class="space-y-6">
        <Card>
          <CardContent class="pt-6">
            <div class="flex flex-col sm:flex-row items-start gap-6">
              <ProductAvatar
                :src="productData.imageUrl"
                :alt="productData.name"
                size="xl"
              />

              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-3 mb-2 flex-wrap">
                  <h1 class="text-2xl font-bold">{{ productData.name }}</h1>
                  <StatusChip
                    :status="productData.isActive ? 'active' : 'inactive'"
                  />
                  <StockBadge
                    :quantity="productData.stockQuantity ?? 0"
                    :threshold="productData.lowStockThreshold"
                    size="sm"
                  />
                </div>

                <p
                  v-if="productData.description"
                  class="text-sm text-muted-foreground mb-4"
                >
                  {{ productData.description }}
                </p>

                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span class="text-muted-foreground">SKU:</span>
                    <span class="font-mono ml-1"
                      >{{ productData.code || productData.sku || '—' }}</span
                    >
                  </div>
                  <div>
                    <span class="text-muted-foreground">Barcode:</span>
                    <span class="font-mono ml-1"
                      >{{ productData.barcode || '—' }}</span
                    >
                  </div>
                  <div>
                    <span class="text-muted-foreground">Category:</span>
                    <span class="ml-1">{{ categoryName }}</span>
                  </div>
                  <div>
                    <span class="text-muted-foreground">Brand:</span>
                    <span class="ml-1">{{ brandName || '—' }}</span>
                  </div>
                  <div>
                    <span class="text-muted-foreground">Unit:</span>
                    <span class="ml-1">{{ unitName }}</span>
                  </div>
                  <div>
                    <span class="text-muted-foreground">Tax:</span>
                    <span class="ml-1">{{ taxName }}</span>
                  </div>
                  <div>
                    <span class="text-muted-foreground">Created:</span>
                    <span class="ml-1">
                      {{ productData.createdAt
                        ? new Date(productData.createdAt).toLocaleDateString()
                        : '—' }}
                    </span>
                  </div>
                  <div>
                    <span class="text-muted-foreground">Last Updated:</span>
                    <span class="ml-1">
                      {{ productData.updatedAt
                        ? new Date(productData.updatedAt).toLocaleDateString()
                        : '—' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent class="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6">
            <div>
              <CardTitle class="text-sm font-medium text-muted-foreground uppercase">
                Selling Price
              </CardTitle>
              <p class="mt-1">
                <PriceTag :amount="productData.sellingPrice" size="md" />
              </p>
            </div>
            <div>
              <CardTitle class="text-sm font-medium text-muted-foreground uppercase">
                Cost Price
              </CardTitle>
              <p class="mt-1">
                <MoneyDisplay :amount="productData.costPrice" size="md" />
              </p>
            </div>
            <div>
              <CardTitle class="text-sm font-medium text-muted-foreground uppercase">
                Profit Margin
              </CardTitle>
              <p class="mt-1">
                <span class="text-2xl font-bold">{{ profitMargin }}</span>
                <span class="text-sm text-muted-foreground">
                  (KES {{ profitAmount }})
                </span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent class="pt-6">
            <h3 class="text-lg font-medium mb-4">Product Insights</h3>
            <ProductInsights :product="productData" />
          </CardContent>
        </Card>
      </div>

      <div v-else-if="activeTab === 'inventory'" class="space-y-6">
        <Card>
          <CardContent class="pt-6">
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-medium">Warehouse Stock</h3>
                <Button variant="outline" size="sm">
                  <Package class="w-4 h-4 mr-2" />
                  Adjust Stock
                </Button>
              </div>
              <Separator />
                <div class="space-y-2">
                  <template
                    v-for="warehouse in [
                      { name: 'Warehouse A', qty: productData.stockQuantity ?? 0 },
                      { name: 'Warehouse B', qty: 0 },
                      { name: 'Warehouse C', qty: 0 },
                    ]"
                    :key="warehouse.name"
                  >
                    <div class="flex items-center justify-between py-3">
                      <InventoryChip
                        :quantity="warehouse.qty"
                        :threshold="productData.lowStockThreshold"
                        :warehouse="warehouse.name"
                        size="md"
                      />
                      <div class="flex items-center gap-2">
                        <StockBadge
                          :quantity="warehouse.qty"
                          :threshold="productData.lowStockThreshold"
                          size="sm"
                          :show-text="false"
                        />
                        <p class="text-xs text-muted-foreground">
                          Low: {{ productData.lowStockThreshold ?? 0 }}
                        </p>
                      </div>
                    </div>
                  </template>
                </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div v-else-if="activeTab === 'pricing'" class="space-y-6">
        <Card>
          <CardContent class="pt-6">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div class="space-y-4">
                <div>
                  <CardTitle class="text-sm font-medium text-muted-foreground uppercase">
                    Selling Price
                  </CardTitle>
                  <p class="mt-2">
                    <PriceTag :amount="productData.sellingPrice" size="lg" />
                  </p>
                </div>
                <div>
                  <CardTitle class="text-sm font-medium text-muted-foreground uppercase">
                    Cost Price
                  </CardTitle>
                  <p class="mt-2">
                    <MoneyDisplay :amount="productData.costPrice" size="lg" />
                  </p>
                </div>
                <div>
                  <CardTitle class="text-sm font-medium text-muted-foreground uppercase">
                    Tax
                  </CardTitle>
                  <p class="mt-2">{{ taxName }}</p>
                </div>
              </div>
              <div class="space-y-4">
                <div>
                  <CardTitle class="text-sm font-medium text-muted-foreground uppercase">
                    Profit Margin
                  </CardTitle>
                  <div class="mt-2 space-y-1">
                    <p class="text-3xl font-bold">{{ profitMargin }}</p>
                    <p class="text-sm text-muted-foreground">
                      KES {{ profitAmount }} per unit
                    </p>
                  </div>
                </div>
                <div>
                  <CardTitle class="text-sm font-medium text-muted-foreground uppercase">
                    Tax-Inclusive Price
                  </CardTitle>
                  <p class="mt-2">
                    <MoneyDisplay
                      :amount="productData.sellingPrice"
                      size="lg"
                    />
                  </p>
                  <p class="text-xs text-muted-foreground mt-1">
                    Includes {{ taxName }}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div v-else-if="activeTab === 'suppliers'" class="space-y-6">
        <Card>
          <CardContent class="pt-6">
            <div class="text-center py-8">
              <Users class="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
              <h3 class="text-lg font-medium mb-1">No suppliers linked</h3>
              <p class="text-sm text-muted-foreground">
                Link suppliers to this product to track procurement.
              </p>
              <Button variant="outline" class="mt-4">
                Link Supplier
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div v-else-if="activeTab === 'images'" class="space-y-6">
        <Card>
          <CardContent class="pt-6">
            <div class="space-y-4">
              <div>
                <h3 class="text-lg font-medium">Product Images</h3>
                <p class="text-sm text-muted-foreground">
                  Drag and drop to reorder. Click remove to delete.
                </p>
              </div>
              <ImageUploader
                @upload="handleImageUpload"
                @update:model-value="handleImageRemove"
              />
              <div
                v-if="productData.imageUrl"
                class="mt-4 flex items-center gap-4"
              >
                <ProductAvatar
                  :src="productData.imageUrl"
                  :alt="productData.name"
                  size="lg"
                />
                <span class="text-sm text-muted-foreground">Current image</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div v-else-if="activeTab === 'history'" class="space-y-6">
        <Card>
          <CardContent class="pt-6">
            <div class="space-y-4">
              <h3 class="text-lg font-medium">Movement History</h3>
              <div class="border rounded-lg">
                <ActivityTimeline :product="productData" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </template>
  </CatalogWorkspace>
</template>
