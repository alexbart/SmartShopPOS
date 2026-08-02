<script setup lang="ts">
import { ref, computed } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import { useRouter, useRoute } from 'vue-router';
import {
  Edit,
  Receipt,
  Images,
  TrendingUp,
  RotateCw,
  Calendar,
} from '@lucide/vue';
import { apiClient } from '@/shared/lib/api-client';
import type { Product, Category, Brand, Unit, Tax, Supplier } from '@/shared/types';
import WorkspaceShell from '@/components/business/WorkspaceShell.vue';
import StockStatusBadge from '@/components/business/StockStatusBadge.vue';
import ProductImage from '@/components/business/ProductImage.vue';
import InventoryWidget from '@/components/business/InventoryWidget.vue';
import RelatedInfoCard from '@/components/business/RelatedInfoCard.vue';
import StatusBadge from '@/components/business/StatusBadge.vue';
import MoneyDisplay from '@/components/business/MoneyDisplay.vue';
import LoadingSkeleton from '@/components/business/LoadingSkeleton.vue';
import ErrorState from '@/components/business/ErrorState.vue';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

const router = useRouter();
const route = useRoute();
const productId = route.params.id as string;

const { data: productData, isLoading, isError } = useQuery({
  queryKey: ['product', productId],
  queryFn: async () => {
    const res = await apiClient.get(`/products/${productId}`);
    return res.data.data as Product;
  },
  enabled: !!productId,
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

const { data: unitsData } = useQuery({
  queryKey: ['units'],
  queryFn: async () => {
    const res = await apiClient.get('/units');
    return res.data.data.items as Unit[];
  },
});

const { data: taxesData } = useQuery({
  queryKey: ['taxes'],
  queryFn: async () => {
    const res = await apiClient.get('/taxes');
    return res.data.data.items as Tax[];
  },
});

const { data: productSuppliersData } = useQuery({
  queryKey: ['product-suppliers', productId],
  queryFn: async () => {
    const res = await apiClient.get(`/products/${productId}/suppliers`);
    return res.data.data.items as Supplier[];
  },
  enabled: !!productId,
});

const { data: salesData } = useQuery({
  queryKey: ['product-sales', productId],
  queryFn: async () => {
    const res = await apiClient.get(`/products/${productId}/sales`);
    return res.data.data.items;
  },
  enabled: !!productId,
});

const { data: purchasesData } = useQuery({
  queryKey: ['product-purchases', productId],
  queryFn: async () => {
    const res = await apiClient.get(`/products/${productId}/purchases`);
    return res.data.data.items;
  },
  enabled: !!productId,
});

const { data: movementsData } = useQuery({
  queryKey: ['product-movements', productId],
  queryFn: async () => {
    const res = await apiClient.get(`/products/${productId}/movements`);
    return res.data.data.items;
  },
  enabled: !!productId,
});

const { data: historyData } = useQuery({
  queryKey: ['product-history', productId],
  queryFn: async () => {
    const res = await apiClient.get(`/products/${productId}/history`);
    return res.data.data.items;
  },
  enabled: !!productId,
});

const stockByWarehouse = ref([]);

const categoryName = computed(() => {
  const cat = categoriesData.value?.find((c) => c.id === productData.value?.categoryId);
  return cat?.name ?? 'Uncategorized';
});

const brandName = computed(() => {
  const b = brandsData.value?.find((br) => br.id === productData.value?.brandId);
  return b?.name ?? null;
});

const unitName = computed(() => {
  const u = unitsData.value?.find((un) => un.id === productData.value?.unitId);
  return u?.name ?? '—';
});

const taxName = computed(() => {
  const t = taxesData.value?.find((tx) => tx.id === productData.value?.taxId);
  return t ? `${t.name} (${t.rate}%)` : null;
});

const profitMargin = computed(() => {
  const cost = productData.value?.costPrice ?? 0;
  const selling = productData.value?.sellingPrice ?? 0;
  if (cost > 0 && selling > 0) {
    return ((selling - cost) / selling * 100).toFixed(1);
  }
  return '0';
});

function goToEdit() {
  router.push(`/products/${productId}/edit`);
}
</script>

<template>
  <WorkspaceShell
    :breadcrumbs="[
      { label: 'Catalog', href: '/products' },
      { label: productData?.name ?? 'Product' },
    ]"
    :workspace-title="productData?.name ?? 'Product'"
    :workspace-description="productData?.sku ?? ''"
    :action-button="{
      label: 'Actions',
      icon: Edit,
      onClick: goToEdit,
    }"
    :tabs="[]"
    :show-toolbar="false"
  >
    <div class="animate-fadeIn">
      <Card v-if="isLoading" class="mb-6">
        <CardContent class="pt-6">
          <LoadingSkeleton :rows="6" :columns="4" />
        </CardContent>
      </Card>

      <ErrorState v-else-if="isError" title="Failed to load product" />

      <template v-else-if="productData">
        <Card class="mb-6">
          <CardContent class="pt-6">
            <div class="flex items-start gap-6">
              <ProductImage :src="productData.imageUrl" :alt="productData.name" size="lg" />

              <div class="flex-1">
                <div class="flex items-center gap-3 mb-2">
                  <h1 class="text-2xl font-bold">{{ productData.name }}</h1>
                  <StatusBadge
                    :status="productData.isActive ? 'active' : 'inactive'"
                    :text="productData.isActive ? 'Active' : 'Inactive'"
                  />
                  <StockStatusBadge
                    :currentStock="productData.stockQuantity ?? 0"
                    :lowStockThreshold="productData.lowStockThreshold"
                    size="sm"
                  />
                </div>
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span class="text-muted-foreground">SKU:</span>
                    <span class="font-mono">{{ productData.sku || '—' }}</span>
                  </div>
                  <div>
                    <span class="text-muted-foreground">Barcode:</span>
                    <span class="font-mono">{{ productData.barcode || '—' }}</span>
                  </div>
                  <div>
                    <span class="text-muted-foreground">Category:</span>
                    <span>{{ categoryName }}</span>
                  </div>
                  <div>
                    <span class="text-muted-foreground">Brand:</span>
                    <span>{{ brandName || '—' }}</span>
                  </div>
                </div>
                <p v-if="productData.description" class="text-sm text-muted-foreground mt-2">
                  {{ productData.description }}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs default-value="overview" class="w-full">
          <TabsList class="grid w-full grid-cols-3 sm:grid-cols-7 mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
            <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
            <TabsTrigger value="images">Images</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" class="mt-0 animate-fadeIn">
            <Card>
              <CardHeader>
                <CardTitle>General Information</CardTitle>
                <CardDescription>Product details and organization</CardDescription>
              </CardHeader>
              <CardContent class="space-y-4">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <h3 class="text-xs font-medium text-muted-foreground uppercase">Name</h3>
                    <p class="mt-1">{{ productData.name }}</p>
                  </div>
                  <div>
                    <h3 class="text-xs font-medium text-muted-foreground uppercase">SKU</h3>
                    <p class="mt-1 font-mono">{{ productData.sku || '—' }}</p>
                  </div>
                  <div>
                    <h3 class="text-xs font-medium text-muted-foreground uppercase">Barcode</h3>
                    <p class="mt-1 font-mono">{{ productData.barcode || '—' }}</p>
                  </div>
                  <div>
                    <h3 class="text-xs font-medium text-muted-foreground uppercase">Unit</h3>
                    <p class="mt-1">{{ unitName }}</p>
                  </div>
                  <div>
                    <h3 class="text-xs font-medium text-muted-foreground uppercase">Active</h3>
                    <p class="mt-1">
                      <StatusBadge
                        :status="productData.isActive ? 'active' : 'inactive'"
                        :text="productData.isActive ? 'Yes' : 'No'"
                      />
                    </p>
                  </div>
                  <div>
                    <h3 class="text-xs font-medium text-muted-foreground uppercase">Category</h3>
                    <p class="mt-1">{{ categoryName }}</p>
                  </div>
                  <div>
                    <h3 class="text-xs font-medium text-muted-foreground uppercase">Brand</h3>
                    <p class="mt-1">{{ brandName || '—' }}</p>
                  </div>
                  <div>
                    <h3 class="text-xs font-medium text-muted-foreground uppercase">Tax</h3>
                    <p class="mt-1">{{ taxName || 'No tax assigned' }}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inventory" class="mt-0 animate-fadeIn">
            <Card>
              <CardHeader>
                <CardTitle>Inventory</CardTitle>
                <CardDescription>Stock levels and thresholds</CardDescription>
              </CardHeader>
              <CardContent class="space-y-4">
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div>
                    <h3 class="text-xs font-medium text-muted-foreground uppercase">Current Stock</h3>
                    <p class="mt-1 text-2xl font-bold">{{ productData.stockQuantity ?? 0 }}</p>
                  </div>
                  <div>
                    <h3 class="text-xs font-medium text-muted-foreground uppercase">Low Stock Threshold</h3>
                    <p class="mt-1 text-2xl font-bold">{{ productData.lowStockThreshold ?? 0 }}</p>
                  </div>
                  <div>
                    <h3 class="text-xs font-medium text-muted-foreground uppercase">Status</h3>
                    <p class="mt-1">
                      <StatusBadge
                        :status="
                          (productData.stockQuantity ?? 0) === 0
                            ? 'inactive'
                            : (productData.stockQuantity ?? 0) <= (productData.lowStockThreshold ?? 0)
                              ? 'pending'
                              : 'active'
                        "
                        :text="
                          (productData.stockQuantity ?? 0) === 0
                            ? 'Out of Stock'
                            : (productData.stockQuantity ?? 0) <= (productData.lowStockThreshold ?? 0)
                              ? 'Low Stock'
                              : 'In Stock'
                        "
                      />
                    </p>
                  </div>
                </div>

                <Separator class="my-4" />

                <InventoryWidget
                  :product-id="productId"
                  :warehouses="stockByWarehouse"
                  :loading="false"
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pricing" class="mt-0 animate-fadeIn">
            <Card>
              <CardHeader>
                <CardTitle>Pricing</CardTitle>
                <CardDescription>Price configuration</CardDescription>
              </CardHeader>
              <CardContent class="space-y-4">
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div>
                    <h3 class="text-xs font-medium text-muted-foreground uppercase">Selling Price</h3>
                    <p class="mt-1">
                      <MoneyDisplay :amount="productData.sellingPrice" size="lg" />
                    </p>
                  </div>
                  <div>
                    <h3 class="text-xs font-medium text-muted-foreground uppercase">Cost Price</h3>
                    <p class="mt-1">
                      <MoneyDisplay :amount="productData.costPrice" size="lg" />
                    </p>
                  </div>
                  <div>
                    <h3 class="text-xs font-medium text-muted-foreground uppercase">Profit Margin</h3>
                    <p class="mt-1 text-2xl font-bold">
                      {{ profitMargin }}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="suppliers" class="mt-0 animate-fadeIn">
            <Card>
              <CardHeader>
                <CardTitle>Suppliers</CardTitle>
                <CardDescription>Suppliers who provide this product</CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  v-if="!productSuppliersData || productSuppliersData.length === 0"
                  class="text-sm text-muted-foreground py-6 text-center"
                >
                  No suppliers linked to this product.
                </div>
                <div
                  v-else
                  class="space-y-2"
                >
                  <div
                    v-for="supplier in productSuppliersData"
                    :key="supplier.id"
                    class="flex items-center justify-between py-2 border-b"
                  >
                    <div>
                      <p class="font-medium text-sm">{{ supplier.name }}</p>
                      <p class="text-xs text-muted-foreground">{{ supplier.email }}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="images" class="mt-0 animate-fadeIn">
            <Card>
              <CardHeader>
                <CardTitle>Images</CardTitle>
                <CardDescription>Product images</CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  v-if="!productData.imageUrl"
                  class="text-center py-8 text-muted-foreground"
                >
                  <Images class="w-8 h-8 mx-auto mb-2" />
                  <p>No images uploaded for this product.</p>
                </div>
                <div
                  v-else
                  class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4"
                >
                  <div class="aspect-square rounded-md overflow-hidden border group">
                    <img
                      :src="productData.imageUrl"
                      :alt="productData.name"
                      class="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" class="mt-0 animate-fadeIn">
            <Card>
              <CardHeader>
                <CardTitle>Activity History</CardTitle>
                <CardDescription>Product change history</CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  v-if="!historyData || historyData.length === 0"
                  class="text-sm text-muted-foreground py-6 text-center"
                >
                  No history available.
                </div>
                <div
                  v-else
                  class="space-y-3"
                >
                  <div
                    v-for="entry in historyData"
                    :key="entry.id"
                    class="flex items-start gap-3 py-2 border-b"
                  >
                    <Calendar class="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div class="flex-1">
                      <p class="text-sm">{{ entry.action }}</p>
                      <p class="text-xs text-muted-foreground">
                        {{ entry.user }} — {{ entry.createdAt }}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div class="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle class="text-sm flex items-center gap-2">
                <TrendingUp class="w-4 h-4" />
                Recent Sales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RelatedInfoCard
                title="sales"
                :items="salesData"
                :loading="false"
                empty-message="No recent sales"
                @view-all="() => router.push('/sales')"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle class="text-sm flex items-center gap-2">
                <Receipt class="w-4 h-4" />
                Recent Purchases
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RelatedInfoCard
                title="purchases"
                :items="purchasesData"
                :loading="false"
                empty-message="No recent purchases"
                @view-all="() => router.push('/purchase-orders')"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle class="text-sm flex items-center gap-2">
                <RotateCw class="w-4 h-4" />
                Recent Movements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RelatedInfoCard
                title="movements"
                :items="movementsData"
                :loading="false"
                empty-message="No recent movements"
              />
            </CardContent>
          </Card>
        </div>
      </template>
    </div>
  </WorkspaceShell>
</template>
